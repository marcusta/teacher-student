import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { ConflictError, RateLimitError, requireAuth, requireUser } from '@basics/core/server/auth';
import { log } from '@basics/core/server/logger';
import type { UserService } from '../services/user.service';

// --- Input schema ---

// `newPassword` mirrors the register endpoint's password rule (min 8).
const ChangePasswordInput = Type.Object({
    currentPassword: Type.String({ minLength: 1, maxLength: 200 }),
    newPassword: Type.String({ minLength: 8, maxLength: 200 }),
});

const CHANGE_WINDOW = 60_000; // 1 minute
const CHANGE_MAX = 5; // max failed current-password attempts per window

// --- API descriptor ---

export function createAccountApi(svc: UserService) {
    // Per-user-id throttling of failed current-password attempts (state scoped
    // to this instance), shaped after the framework's own login limiter in
    // `@basics/core/server/auth` (`checkLoginRate`) and deliberately using the
    // same 5-per-minute budget: this endpoint should not be a cheaper
    // brute-force target than the front door, and it should not be a harsher
    // lockout either. A longer window would be a self-inflicted denial of
    // service — a throttled user is refused even with the *correct* password,
    // and this app has no password-reset flow to escape it with.
    //
    // Without it a stolen session is a password-guessing oracle: this app has
    // no password-reset flow and other sessions survive a change, so an
    // unthrottled guesser gets permanent account takeover. It is also an
    // authenticated memory-exhaustion vector — argon2id holds 64 MiB per
    // in-flight verify, so concurrent guesses allocate ~1 GB.
    //
    // The counter is bumped *before* `svc.changePassword` runs and cleared on
    // success. Counting only once the verify resolves would let a burst of
    // concurrent requests all pass the check before the first failure lands —
    // exactly the case that exhausts memory.
    const failures = new Map<string, { count: number; resetAt: number }>();
    let lastEviction = Date.now();

    function checkChangeRate(userId: string): void {
        const now = Date.now();

        // Evict expired entries at most once per window to bound Map size
        if (now - lastEviction >= CHANGE_WINDOW) {
            for (const [key, entry] of failures) {
                if (now >= entry.resetAt) failures.delete(key);
            }
            lastEviction = now;
        }

        const entry = failures.get(userId);
        if (!entry || now >= entry.resetAt) {
            failures.set(userId, { count: 1, resetAt: now + CHANGE_WINDOW });
            return;
        }
        if (entry.count >= CHANGE_MAX) throw new RateLimitError('Too many password change attempts');
        entry.count++;
    }

    return {
        changePassword: {
            method: 'POST' as const,
            path: '/account/password',
            schema: ChangePasswordInput,
            middleware: [requireAuth()],
            // Sessions are deliberately NOT revoked: the caller stays signed in
            // and any other sessions this user has survive the change.
            // `SessionStore` has no per-user revoke, and reaching into the
            // sessions DB from app code is out of scope.
            fn: async (input: Static<typeof ChangePasswordInput>, c: Context) => {
                const user = requireUser(c);
                checkChangeRate(user.id);

                try {
                    await svc.changePassword(user.id, input.currentPassword, input.newPassword);
                } catch (err) {
                    if (err instanceof ConflictError) {
                        log.warn({
                            msg: 'password change rejected: current password does not match',
                            userId: user.id,
                        });
                    }
                    throw err;
                }

                failures.delete(user.id);
                return { ok: true as const };
            },
        },
    };
}
