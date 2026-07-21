/**
 * HMR disposal: `startApp` composes teardown instead of competing for a slot.
 *
 * The bug behind this file: Vite keeps exactly ONE dispose callback per module
 * (`disposeMap.set(ownerPath, cb)`), and `startApp` already claims the app
 * entry's. So a module that wanted disposal of its own — `AuthService`, holding
 * a session-expiry listener — had no way to get it, and the docblock's
 * suggestion (register a second `import.meta.hot.dispose()` from the app) would
 * have OVERWRITTEN `startApp`'s callback and leaked the whole component tree.
 *
 * These tests therefore assert two things that are easy to lose independently:
 * that the single registration still tears the component tree down, and that
 * the composed disposers run alongside it rather than instead of it.
 */
import { test, expect, beforeEach, afterEach } from 'bun:test';
import { Component, di, startApp, onAppDispose } from './core';
import { AuthService } from './auth';
import { onSessionExpired, notifySessionExpired, _reset as resetSession } from './session';

beforeEach(() => {
    // `startApp` reads `location.pathname`, and Bun shares one global object
    // across test files. `error-report.test.ts` used to install a bare
    // `{ href }` location and never restore it, which made these tests fail
    // only when the whole suite ran. That is fixed at the source now; this
    // guard keeps the failure from being reintroduced silently by the next
    // file that stubs a global.
    const loc = globalThis.location as unknown as { pathname?: unknown } | undefined;
    if (!loc || typeof loc.pathname !== 'string') {
        (globalThis as { location?: unknown }).location =
            { href: 'http://localhost:5173/', pathname: '/', search: '' };
    }
});

afterEach(() => { resetSession(); di.reset(); });

/** A stand-in for `import.meta.hot`, which records rather than acts. */
function fakeHot() {
    const registered: (() => void)[] = [];
    return {
        data: {} as Record<string, unknown>,
        dispose(cb: () => void) { registered.push(cb); },
        accept() {},
        /** Vite keeps ONE. If we ever register twice, this is where it shows. */
        get registrations() { return registered.length; },
        fire() { registered[registered.length - 1]?.(); },
    };
}

let destroyed: string[] = [];
class Root extends Component {
    render(): HTMLElement { return document.createElement('div'); }
    onDestroy(): void { destroyed.push('root'); }
}

function host(): HTMLElement {
    document.body.innerHTML = '<div id="app"></div>';
    return document.getElementById('app') as HTMLElement;
}

test('startApp registers exactly one dispose callback', async () => {
    // The whole premise. If this ever becomes 2, one of them is dead code and
    // the other is silently winning.
    const hot = fakeHot();
    await startApp(Root, host(), { hot });
    expect(hot.registrations).toBe(1);
});

test('dispose tears down the component tree AND the registered disposers', async () => {
    destroyed = [];
    const hot = fakeHot();
    const off = onAppDispose(() => destroyed.push('service'));
    await startApp(Root, host(), { hot, onDispose: () => destroyed.push('app-hook') });

    expect(destroyed).toEqual([]);
    hot.fire();

    // Order is contractual: the tree holds references INTO the services, so it
    // goes first; the caller's hook goes last so it can assume the rest is shut.
    expect(destroyed).toEqual(['root', 'service', 'app-hook']);
    off();
});

test('a throwing disposer does not strand the ones behind it', async () => {
    destroyed = [];
    const hot = fakeHot();
    const offs = [
        onAppDispose(() => { throw new Error('boom'); }),
        onAppDispose(() => destroyed.push('after')),
    ];
    await startApp(Root, host(), { hot, onDispose: () => destroyed.push('app-hook') });

    expect(() => hot.fire()).not.toThrow();
    // A half-run teardown is the failure mode this whole mechanism exists to
    // avoid, so one bad callback must not become a leak of everything after it.
    expect(destroyed).toContain('after');
    expect(destroyed).toContain('app-hook');
    for (const off of offs) off();
});

test('AuthService: HMR no longer strands its session-expiry listener', async () => {
    // The concrete bug. Before this, `auth.ts` re-evaluating left the previous
    // instance subscribed to `session.ts` (which stays cached), so a later 401
    // was delivered to a service nothing renders.
    const hot = fakeHot();
    const auth = di.get(AuthService);
    auth.currentUser.set({ id: 'u1', username: 'anna' });
    await startApp(Root, host(), { hot });

    // Sanity: the listener IS live before disposal, otherwise the assertion
    // after it would pass against a service that never worked.
    notifySessionExpired();
    expect(auth.currentUser.get()).toBeNull();

    auth.currentUser.set({ id: 'u1', username: 'anna' });
    hot.fire();

    // Stranded instance is now deaf: the 401 that arrives after the module was
    // replaced no longer reaches it.
    notifySessionExpired();
    expect(auth.currentUser.get()).not.toBeNull();
});

test('AuthService.destroy() unregisters, so app teardown cannot run it twice', async () => {
    // `destroy()` is documented idempotent, but the registry must not hold a
    // destroyed instance reachable either — that would be a leak wearing the
    // costume of a fix.
    const hot = fakeHot();
    const auth = di.get(AuthService);
    await startApp(Root, host(), { hot });

    auth.destroy();
    let reached = false;
    onSessionExpired(() => { reached = true; });

    expect(() => hot.fire()).not.toThrow();
    notifySessionExpired();
    expect(reached).toBe(true);
});
