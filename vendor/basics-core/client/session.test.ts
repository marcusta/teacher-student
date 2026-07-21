import { test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Signal, effect } from './core';
import { request, type RequestError } from './request';
import { ApiError } from './api-error';
import { AuthService, type AuthUser } from './auth';
import { inflight } from './fetch';
import { onSessionExpired, notifySessionExpired, _reset as resetSession } from './session';
import { _reset as resetErrorReport, _errorQueue } from './error-report';

beforeEach(() => {
    inflight.clear();
});

afterEach(() => {
    resetErrorReport();
    resetSession();
});

// --- Helpers ---

function signals() {
    return {
        loading: new Signal(false),
        error: new Signal<RequestError | null>(null),
    };
}

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

const USER: AuthUser = { id: 'u1', username: 'anna' };

// --- Registry ---

test('session: onSessionExpired listener runs on notify', () => {
    let calls = 0;
    onSessionExpired(() => { calls++; });

    notifySessionExpired();

    expect(calls).toBe(1);
});

test('session: unsubscribe stops the listener', () => {
    let calls = 0;
    const off = onSessionExpired(() => { calls++; });

    off();
    notifySessionExpired();

    expect(calls).toBe(0);
});

test('session: notifies every subscriber', () => {
    const seen: string[] = [];
    onSessionExpired(() => seen.push('a'));
    onSessionExpired(() => seen.push('b'));

    notifySessionExpired();

    expect(seen).toEqual(['a', 'b']);
});

test('session: re-entrant notify from inside a listener is ignored', () => {
    let calls = 0;
    onSessionExpired(() => {
        calls++;
        notifySessionExpired();
    });

    notifySessionExpired();

    expect(calls).toBe(1);
});

// --- Listener isolation ---

test('session: a throwing listener does not stop the others', () => {
    const seen: string[] = [];
    onSessionExpired(() => { seen.push('a'); });
    onSessionExpired(() => { throw new Error('listener blew up'); });
    onSessionExpired(() => { seen.push('c'); });

    notifySessionExpired();

    expect(seen).toEqual(['a', 'c']);
});

test('session: a throwing listener does not escape notifySessionExpired', () => {
    onSessionExpired(() => { throw new Error('listener blew up'); });

    expect(() => notifySessionExpired()).not.toThrow();
});

test('session: a throwing listener is reported, not swallowed', () => {
    onSessionExpired(() => { throw new Error('listener blew up'); });

    notifySessionExpired();

    const reports = _errorQueue();
    expect(reports.length).toBe(1);
    expect(reports[0]!.code).toBe('session-listener');
    expect(reports[0]!.message).toBe('listener blew up');
});

test('session: a non-Error throw is reported too', () => {
    onSessionExpired(() => { throw 'plain string'; });

    notifySessionExpired();

    expect(_errorQueue()[0]!.message).toBe('plain string');
});

test('session: a null throw is reported too', () => {
    onSessionExpired(() => { throw null; });

    notifySessionExpired();

    expect(_errorQueue()[0]!.message).toBe('null');
});

// The coercion to a message runs inside the catch but on the caller's stack, so
// a value that cannot be stringified must not escape the way the raw throw did.

test('session: a listener throwing a null-prototype object is contained', () => {
    const seen: string[] = [];
    onSessionExpired(() => { seen.push('a'); });
    onSessionExpired(() => { throw Object.create(null); });
    onSessionExpired(() => { seen.push('c'); });

    expect(() => notifySessionExpired()).not.toThrow();
    expect(seen).toEqual(['a', 'c']);
    expect(_errorQueue()[0]!.code).toBe('session-listener');
});

test('session: a listener throwing an object with a throwing toString is contained', () => {
    onSessionExpired(() => { throw { toString() { throw new Error('toString boom'); } }; });

    expect(() => notifySessionExpired()).not.toThrow();
    expect(_errorQueue().length).toBe(1);
});

test('session: an Error whose message getter throws is contained', () => {
    class Nasty extends Error { override get message(): string { throw new Error('getter boom'); } }
    onSessionExpired(() => { throw new Nasty(); });

    expect(() => notifySessionExpired()).not.toThrow();
    expect(_errorQueue().length).toBe(1);
});

test('request: an undescribable listener throw still resolves undefined', async () => {
    const { loading, error } = signals();
    onSessionExpired(() => { throw Object.create(null); });

    const result = await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(result).toBeUndefined();
    expect(error.get()).toEqual({ code: 'auth', message: 'Unauthorized' });
});

test('request: a throwing listener still resolves undefined, not a rejection', async () => {
    const { loading, error } = signals();
    // Mirrors AuthService's listener tripping an app effect that throws — a route
    // guard or top bar reacting to currentUser going null.
    onSessionExpired(() => { throw new Error('route guard blew up'); });

    // ~every call site is `const r = await request(...); if (!r) return;` with no
    // try/catch, so a rejection here is an unhandled rejection app-wide.
    const result = await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(result).toBeUndefined();
    expect(error.get()).toEqual({ code: 'auth', message: 'Unauthorized' });
    expect(loading.get()).toBe(false);
});

test('request: a throwing listener does not deprive AuthService of the notification', async () => {
    const { loading, error } = signals();
    onSessionExpired(() => { throw new Error('app listener blew up'); });
    const auth = new AuthService();
    auth.currentUser.set(USER);

    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(auth.currentUser.get()).toBeNull();
});

// --- Async re-entry is NOT guarded (documented behaviour) ---

test('session: the re-entrancy guard is synchronous only — an async listener republishes', async () => {
    const pending: Promise<unknown>[] = [];
    let calls = 0;
    onSessionExpired(() => {
        calls++;
        // Self-limiting, which is exactly the obligation docs/auth.md puts on a
        // listener that issues requests.
        if (calls > 2) return;
        const { loading, error } = signals();
        pending.push(request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized'))));
    });

    notifySessionExpired();
    while (pending.length) await pending.shift();

    // Not 1: `notifying` resets before the listener's request answers, so the 401
    // it provokes publishes again. The guard covers same-stack re-entry only.
    expect(calls).toBe(3);
});

// --- request() → session-expiry wiring ---

test('request: 401 publishes session expiry', async () => {
    const { loading, error } = signals();
    let calls = 0;
    onSessionExpired(() => { calls++; });

    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(calls).toBe(1);
});

test('request: 401 still reports code auth to the caller', async () => {
    const { loading, error } = signals();
    onSessionExpired(() => {});

    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(error.get()).toEqual({ code: 'auth', message: 'Unauthorized' });
});

test('request: 401 does not publish when sessionExpiry is false', async () => {
    const { loading, error } = signals();
    let calls = 0;
    onSessionExpired(() => { calls++; });

    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')), { sessionExpiry: false });

    expect(calls).toBe(0);
    expect(error.get()).toEqual({ code: 'auth', message: 'Unauthorized' });
});

test('request: 403 does not publish session expiry', async () => {
    const { loading, error } = signals();
    let calls = 0;
    onSessionExpired(() => { calls++; });

    await request(loading, error, () => Promise.reject(new ApiError(403, 'Forbidden')));

    expect(calls).toBe(0);
    expect(error.get()).toEqual({ code: 'server', message: 'Server error' });
});

test('request: 500 does not publish session expiry', async () => {
    const { loading, error } = signals();
    let calls = 0;
    onSessionExpired(() => { calls++; });

    await request(loading, error, () => Promise.reject(new ApiError(500, 'Internal error')));

    expect(calls).toBe(0);
});

test('request: network error does not publish session expiry', async () => {
    const { loading, error } = signals();
    let calls = 0;
    onSessionExpired(() => { calls++; });

    await request(loading, error, () => Promise.reject(new TypeError('fetch failed')));

    expect(calls).toBe(0);
});

test('request: success does not publish session expiry', async () => {
    const { loading, error } = signals();
    let calls = 0;
    onSessionExpired(() => { calls++; });

    await request(loading, error, () => Promise.resolve('ok'));

    expect(calls).toBe(0);
});

// --- AuthService reaction ---

test('auth: 401 from a normal API call clears currentUser', async () => {
    const auth = new AuthService();
    auth.currentUser.set(USER);
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(auth.currentUser.get()).toBeNull();
});

test('auth: 403 from a normal API call leaves currentUser intact', async () => {
    const auth = new AuthService();
    auth.currentUser.set(USER);
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(403, 'Forbidden')));

    expect(auth.currentUser.get()).toEqual(USER);
});

test('auth: 500 from a normal API call leaves currentUser intact', async () => {
    const auth = new AuthService();
    auth.currentUser.set(USER);
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(500, 'Internal error')));

    expect(auth.currentUser.get()).toEqual(USER);
});

test('auth: concurrent 401s clear auth state exactly once', async () => {
    const auth = new AuthService();
    auth.currentUser.set(USER);

    // Count app-level reactions the way a route guard would: an effect on the signal.
    let guardRuns = 0;
    const stop = effect(() => {
        if (auth.currentUser.get() === null) guardRuns++;
    });
    expect(guardRuns).toBe(0);

    await Promise.all([1, 2, 3, 4, 5].map(() => {
        const { loading, error } = signals();
        return request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));
    }));

    expect(auth.currentUser.get()).toBeNull();
    // Five 401s, one redirect — not a thundering herd of guard runs.
    expect(guardRuns).toBe(1);
    stop();
});

test('auth: failed login does not clear a signed-in user or publish expiry', async () => {
    let calls = 0;
    onSessionExpired(() => { calls++; });
    const auth = new AuthService();
    auth.currentUser.set(USER);
    globalThis.fetch = mock(async () => jsonResponse({ error: 'Invalid credentials' }, 401)) as any;

    const ok = await auth.login('anna', 'wrong');

    expect(ok).toBe(false);
    expect(calls).toBe(0);
    expect(auth.currentUser.get()).toEqual(USER);
    // The caller still gets the auth error to render its own message
    expect(auth.error.get()).toEqual({ code: 'auth', message: 'Unauthorized' });
});

test('auth: failed login while signed out leaves state signed out', async () => {
    const auth = new AuthService();
    globalThis.fetch = mock(async () => jsonResponse({ error: 'Invalid credentials' }, 401)) as any;

    const ok = await auth.login('anna', 'wrong');

    expect(ok).toBe(false);
    expect(auth.currentUser.get()).toBeNull();
    expect(auth.error.get()).toEqual({ code: 'auth', message: 'Unauthorized' });
});

test('auth: successful login sets currentUser', async () => {
    const auth = new AuthService();
    globalThis.fetch = mock(async () => jsonResponse(USER)) as any;

    const ok = await auth.login('anna', 'secret123');

    expect(ok).toBe(true);
    expect(auth.currentUser.get()).toEqual(USER);
});

test('auth: 401 from /auth/me clears a stale signed-in user', async () => {
    const auth = new AuthService();
    auth.currentUser.set(USER);
    globalThis.fetch = mock(async () => jsonResponse({ error: 'Unauthorized' }, 401)) as any;

    await auth.load();

    expect(auth.currentUser.get()).toBeNull();
    // 401 on load is expected when signed out — error is swallowed as before
    expect(auth.error.get()).toBeNull();
});

test('auth: 401 from /auth/me at boot is a no-op', async () => {
    const auth = new AuthService();
    globalThis.fetch = mock(async () => jsonResponse({ error: 'Unauthorized' }, 401)) as any;

    await auth.load();

    expect(auth.currentUser.get()).toBeNull();
    expect(auth.error.get()).toBeNull();
});

test('auth: 401 from logout does not publish expiry', async () => {
    let calls = 0;
    onSessionExpired(() => { calls++; });
    const auth = new AuthService();
    auth.currentUser.set(USER);
    globalThis.fetch = mock(async () => jsonResponse({ error: 'Unauthorized' }, 401)) as any;

    await auth.logout();

    // A lapsed cookie on a deliberate sign-out is not a session expiring under the
    // user — an app's "your session expired" toast must not fire here.
    expect(calls).toBe(0);
    // Local sign-out still happens.
    expect(auth.currentUser.get()).toBeNull();
});

test('auth: successful logout does not publish expiry', async () => {
    let calls = 0;
    onSessionExpired(() => { calls++; });
    const auth = new AuthService();
    auth.currentUser.set(USER);
    globalThis.fetch = mock(async () => jsonResponse({ ok: true })) as any;

    await auth.logout();

    expect(calls).toBe(0);
    expect(auth.currentUser.get()).toBeNull();
});

// --- Unsubscribe ---

test('auth: destroy() unsubscribes from session expiry', async () => {
    const auth = new AuthService();
    auth.currentUser.set(USER);
    auth.destroy();
    const { loading, error } = signals();

    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(auth.currentUser.get()).toEqual(USER);
});

test('auth: destroy() is idempotent', () => {
    const auth = new AuthService();
    auth.destroy();

    expect(() => auth.destroy()).not.toThrow();
});

test('auth: a destroyed instance does not react alongside its replacement', async () => {
    // The HMR shape: auth.ts re-evaluates, di builds a second instance, and without
    // a disposer the first one keeps reacting to every 401 from behind a dead shell.
    const stale = new AuthService();
    stale.currentUser.set(USER);
    stale.destroy();

    const fresh = new AuthService();
    fresh.currentUser.set(USER);

    const { loading, error } = signals();
    await request(loading, error, () => Promise.reject(new ApiError(401, 'Unauthorized')));

    expect(stale.currentUser.get()).toEqual(USER);
    expect(fresh.currentUser.get()).toBeNull();
});
