import { API_BASE } from './base';
import { Signal, onAppDispose } from './core';
import { apiFetch } from './fetch';
import { request, type RequestError, type RequestOptions } from './request';
import { onSessionExpired } from './session';

/**
 * Options for calls to the auth endpoints themselves. A 401 from `POST /auth/login`
 * means "wrong credentials", not "session expired" — publishing expiry there would
 * clear state and bounce the user out of a failed sign-in attempt. A 401 from
 * `POST /auth/logout` means the cookie had already lapsed, which is not news to a
 * user who just clicked sign out.
 *
 * `GET /auth/me` deliberately does NOT opt out — see `load()`.
 */
const AUTH_ENDPOINT: RequestOptions = { sessionExpiry: false };

export interface AuthUser {
    id: string;
    username: string;
}

interface AuthClient {
    me(): Promise<AuthUser>;
    login(input: { username: string; password: string }): Promise<AuthUser>;
    logout(): Promise<{ ok: boolean }>;
}

function createAuthClient(baseUrl: string): AuthClient {
    return {
        me: () => apiFetch({ method: 'GET', url: `${baseUrl}/auth/me` }),
        login: (input) => apiFetch({ method: 'POST', url: `${baseUrl}/auth/login`, body: input }),
        logout: () => apiFetch({ method: 'POST', url: `${baseUrl}/auth/logout`, body: {} }),
    };
}

export class AuthService {
    private api = createAuthClient(API_BASE);
    readonly currentUser = new Signal<AuthUser | null>(null);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    private offSessionExpired: () => void;
    private offAppDispose: () => void;

    constructor() {
        // A 401 from any authenticated request means the server-side session is gone
        // (expired or revoked). Drop the stale user so app-level effects — a route
        // guard, a top bar — see the signed-out state immediately instead of leaving
        // the user in a broken signed-in shell until they happen to reload.
        this.offSessionExpired = onSessionExpired(() => {
            // Guarded so a burst of concurrent 401s clears once, and so a 401 that
            // arrives while already signed out is a no-op.
            if (this.currentUser.peek() !== null) this.currentUser.set(null);
        });

        // Close the HMR case at the source rather than asking every app to
        // remember. `startApp` drains this registry when the app entry is
        // replaced, which is the only moment at which this instance can be
        // stranded — see `destroy()`.
        this.offAppDispose = onAppDispose(() => this.destroy());
    }

    /**
     * Drop the session-expiry subscription. Idempotent.
     *
     * In production this never needs calling: `di` caches by constructor, app code
     * never calls `di.reset()`, and `startApp`'s `/_obs` toggle rebuilds only the
     * root component. It matters in two places — tests that build `AuthService`
     * directly, and Vite HMR.
     *
     * The HMR case is now closed, and the constructor closes it: it registers
     * `destroy()` with `onAppDispose`, which `startApp` drains when the app entry
     * is replaced.
     *
     * The bug that motivated it: when `auth.ts` re-evaluates, the class gets a new
     * identity while `session.ts` and `core.ts` stay cached, so `di.get()` builds a
     * fresh instance and the previous one's listener stays in the registry attached
     * to a dead service.
     *
     * AN EARLIER VERSION OF THIS COMMENT TOLD APPS TO CALL THIS FROM THEIR OWN
     * `import.meta.hot.dispose()`. Do not do that, and do not restore the advice.
     * Vite keys dispose callbacks by module path and keeps exactly ONE
     * (`disposeMap.set(ownerPath, cb)` in `vite/dist/client/client.mjs`), and
     * `startApp` already claims the app entry's slot for tearing down the component
     * tree. A second registration there does not run alongside it, it REPLACES it —
     * so an app that followed the advice traded one stranded listener for a leaked
     * component tree, which is strictly worse than the bug. That is why the
     * registry exists: disposal is composed by `startApp`, never competed for.
     *
     * `onAppDispose` is also what makes this safe to call twice. `destroy()`
     * unregisters, so a service destroyed by a test does not get destroyed again
     * at app teardown, and the registry never holds a dead instance alive.
     */
    destroy(): void {
        this.offSessionExpired();
        this.offSessionExpired = () => {};
        this.offAppDispose();
        this.offAppDispose = () => {};
    }

    async load(): Promise<void> {
        // Not an AUTH_ENDPOINT opt-out: a 401 from /auth/me really does mean the session
        // is gone. At boot `currentUser` is already null, so the listener is a no-op;
        // on a later re-check it correctly clears a now-stale user.
        const user = await request(this.loading, this.error, () => this.api.me());
        if (user) this.currentUser.set(user);
        // 401 on initial load is expected (not logged in) — clear the error
        if (this.error.get()?.code === 'auth') this.error.set(null);
    }

    async login(username: string, password: string): Promise<boolean> {
        const user = await request(this.loading, this.error, () =>
            this.api.login({ username, password }), AUTH_ENDPOINT);
        if (user) { this.currentUser.set(user); return true; }
        return false;
    }

    async logout(): Promise<void> {
        // AUTH_ENDPOINT: a 401 here means the cookie had already lapsed on a
        // deliberate sign-out, not that a session expired under the user. Publishing
        // would be harmless for this service's own listener but would fire an app's
        // "your session expired" toast on a button the user just pressed themselves.
        await request(this.loading, this.error, () => this.api.logout(), AUTH_ENDPOINT);
        // Clear user unless a network/timeout error means the server session may persist
        const err = this.error.get();
        if (!err || err.code === 'auth') this.currentUser.set(null);
    }
}
