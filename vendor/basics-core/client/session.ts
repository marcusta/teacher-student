/**
 * Session-expiry notification seam.
 *
 * `request()` is where a 401 gets classified, but it cannot clear auth state
 * directly: `auth.ts` already imports `request.ts`, so calling `AuthService`
 * from there would be an import cycle. This tiny registry is the explicit,
 * named seam between the two — `request()` publishes, `AuthService` subscribes
 * and clears `currentUser`, and any app effect watching `currentUser` (e.g. a
 * route guard redirecting to the login page) reacts on its own.
 *
 * A 401 from the auth endpoints themselves does NOT publish here — see
 * `RequestOptions.sessionExpiry` in `request.ts`.
 */

import { reportError } from './error-report';

export type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();
let notifying = false;

/** Subscribe to session expiry. Returns an unsubscribe function. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

/**
 * Publish a session-expiry event.
 *
 * Safe to call repeatedly. When several in-flight requests 401 at once they
 * each call this, so listeners must be idempotent: `AuthService` only clears a
 * user that is still set, and `Signal.set` ignores an unchanged value, so app
 * effects run once for a burst.
 *
 * The `notifying` flag stops *synchronous* re-entry only — a listener that
 * calls `notifySessionExpired()` directly (or trips a code path that does)
 * cannot loop. It is deliberately NOT a general recursion guard: a listener
 * that fires off its own request gets an answer after the flag has reset, so a
 * listener whose request also 401s will publish again, and again.
 *
 * A partial mitigation does exist; it was rejected on cost, not on feasibility.
 * Setting a flag around the `listener()` call and having `request()` capture it
 * synchronously — before its first await — needs no async context propagation,
 * and would not swallow a genuine post-re-login expiry, since that arrives from
 * a normally-started request. But it only catches requests started
 * synchronously in the listener body (one behind a `setTimeout`, or after an
 * `await`, escapes it), and it couples `request.ts` to `session.ts` through
 * global mutable state to guard against a caller's bug. A time-based window
 * fits worse still: the loop closes over a network round trip, so a window
 * shorter than an RTT does not break it and a longer one is arbitrary.
 *
 * So the obligation stays on the listener: if it issues requests, it must be
 * self-limiting the way `AuthService`'s listener is (it only acts when a user is
 * actually set, so the second pass is a no-op), or opt that request out with
 * `sessionExpiry: false`.
 *
 * A throwing listener is contained (see below) — it can neither skip the
 * remaining listeners nor escape to the caller.
 */
export function notifySessionExpired(): void {
    if (notifying) return;
    notifying = true;
    try {
        for (const listener of [...listeners]) {
            // Isolated per listener. The caller is `request()`'s catch block, and
            // `request()` is contracted to *resolve* with `undefined` on failure —
            // ~every call site is `const r = await request(...); if (!r) return;`
            // with no try/catch, so an escaping throw becomes an unhandled
            // rejection rather than a handled error. Surfacing is via
            // `reportError`, the same path `request()` itself uses for every other
            // client-side failure, so a broken listener shows up in the error
            // stream instead of being silently swallowed.
            try {
                listener();
            } catch (err) {
                // Belt and braces. `reportError` itself cannot throw — it only
                // buffers and arms a timer, and the `JSON.stringify` that could
                // fail is deferred to `flushErrors` on a timer stack — but
                // *describing* the thrown value can (see `describeError`), and
                // that runs on this stack. An escape here would re-open the very
                // hole this catch exists to close, so nothing in the reporting
                // path is allowed out.
                try {
                    reportError('session-listener', describeError(err));
                } catch { /* reporting must never outrank the app */ }
            }
        }
    } finally {
        notifying = false;
    }
}

/**
 * Coerce a thrown value to a message without ever throwing.
 *
 * A listener can throw anything, and the obvious coercions are not total:
 * `String(Object.create(null))` throws (no `Symbol.toPrimitive`, no inherited
 * `toString`), `String(x)` runs a `toString` that may itself throw, and
 * `err.message` on an `Error` subclass may be a throwing getter. Each of those
 * would escape `notifySessionExpired` from inside the catch block and become an
 * unhandled rejection at a `request()` call site — the original defect by
 * another route.
 */
function describeError(err: unknown): string {
    try {
        if (err instanceof Error) {
            const message = err.message;
            if (typeof message === 'string') return message;
        }
        return String(err);
    } catch {
        return 'listener threw a value that could not be described';
    }
}

/** Remove all listeners — for testing only. */
export function _reset(): void {
    listeners.clear();
    notifying = false;
}
