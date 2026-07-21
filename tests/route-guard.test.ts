import { test, expect } from 'bun:test';
import {
    guardTarget,
    guardedView,
    isPublicRoute,
    HOME_ROUTE,
    LOGIN_ROUTE,
    PUBLIC_ROUTES,
} from '../web/app/route-guard';
import { NAV_GROUPS } from '../web/app/nav.structure';

/** Every route the shell can actually be sitting on, plus the awkward ones. */
const NAV_PATHS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path));
const PROTECTED = [...NAV_PATHS, '/program', '/students/abc', '/planer/17/redigera'];
const ALL_ROUTES = [...PROTECTED, ...PUBLIC_ROUTES, '/', '', '/nonsense'];

test('route-guard: authenticated visitors skip public entry — IA 3.17', () => {
    for (const route of PUBLIC_ROUTES) {
        expect(guardTarget(route, true)).toBe(HOME_ROUTE);
    }
});

test('route-guard: the bare origin resolves to the real home URL', () => {
    // Otherwise one view answers to two URLs: '/' renders home via the swap
    // fallback, but the address bar never says so.
    expect(guardTarget('/', true)).toBe(HOME_ROUTE);
    expect(guardTarget('', true)).toBe(HOME_ROUTE);
});

test('route-guard: authenticated visitors are left alone on protected routes', () => {
    for (const route of PROTECTED) {
        expect(guardTarget(route, true)).toBeNull();
    }
});

test('route-guard: unauthenticated visitors are sent to login from anything protected', () => {
    for (const route of PROTECTED) {
        expect(guardTarget(route, false)).toBe(LOGIN_ROUTE);
    }
    // The bare origin is not a way in either.
    expect(guardTarget('/', false)).toBe(LOGIN_ROUTE);
});

test('route-guard: unauthenticated visitors are left alone on public entry', () => {
    for (const route of PUBLIC_ROUTES) {
        expect(guardTarget(route, false)).toBeNull();
    }
});

test('route-guard: deny by default — an unlisted route is protected, not public', () => {
    // A route added to the app later must be protected the moment it exists,
    // not the moment someone remembers to list it.
    expect(isPublicRoute('/nonsense')).toBe(false);
    expect(guardTarget('/nonsense', false)).toBe(LOGIN_ROUTE);
});

test('route-guard: public matching is on whole segments, not string prefixes', () => {
    // '/loginish' must not inherit /login's exemption.
    expect(isPublicRoute('/loginish')).toBe(false);
    expect(isPublicRoute('/registered')).toBe(false);
    expect(guardTarget('/loginish', false)).toBe(LOGIN_ROUTE);
});

test('route-guard: NO REDIRECT LOOP — every target is a fixed point', () => {
    // The property the whole design rests on, asserted exhaustively rather than
    // by example: applying the guard to its own output must always be a no-op.
    // If this ever fails, the app bounces forever between two routes.
    for (const route of ALL_ROUTES) {
        for (const authed of [true, false]) {
            const target = guardTarget(route, authed);
            if (target === null) continue;
            expect(guardTarget(target, authed)).toBeNull();
        }
    }
});

test('route-guard: the rendered view is always an allowed route', () => {
    // guardedView is what the swap reads, so this is the "never paint the wrong
    // view" guarantee stated directly.
    for (const route of ALL_ROUTES) {
        for (const authed of [true, false]) {
            const view = guardedView(route, authed);
            expect(guardTarget(view, authed)).toBeNull();
        }
    }
});

test('route-guard: the rendered view never lags the redirect', () => {
    // The flash-of-wrong-view regression, stated as a fact about the pair: when
    // the guard redirects, the view is the DESTINATION, never the route being
    // left. A login form must never be the answer for a signed-in visitor.
    for (const route of ALL_ROUTES) {
        for (const authed of [true, false]) {
            const target = guardTarget(route, authed);
            if (target !== null) expect(guardedView(route, authed)).toBe(target);
        }
    }
});

test('route-guard: an allowed route renders itself unchanged', () => {
    expect(guardedView('/planer', true)).toBe('/planer');
    expect(guardedView('/students/abc', true)).toBe('/students/abc');
    expect(guardedView('/login', false)).toBe('/login');
});

test('route-guard: sign-out from a deep route lands on login, not a bare shell', () => {
    // The mid-session transition: same route, authed flips to false.
    expect(guardTarget('/planer/17/redigera', true)).toBeNull();
    expect(guardTarget('/planer/17/redigera', false)).toBe(LOGIN_ROUTE);
    expect(guardedView('/planer/17/redigera', false)).toBe(LOGIN_ROUTE);
});

test('route-guard: post-login lands on home and stays there', () => {
    // Signing in flips authed while the route is still /login. The guard must
    // move it to /home — and must then leave /home alone, or the post-login
    // redirect fights the guard.
    expect(guardTarget('/login', true)).toBe(HOME_ROUTE);
    expect(guardTarget(HOME_ROUTE, true)).toBeNull();
});
