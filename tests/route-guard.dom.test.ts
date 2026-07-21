/**
 * The flash guarantee, asserted at the level it actually matters: COMPONENT
 * CONSTRUCTION.
 *
 * `route-guard.test.ts` proves the decision function is right. That is necessary
 * but not sufficient — it says nothing about whether the shell wires it up in a
 * way that keeps the disallowed component from ever being built. A
 * `MutationObserver` cannot settle that either: the swap destroys and rebuilds
 * inside one synchronous effect, so a node created and removed within a single
 * task can be invisible to it. Counting `render()` calls on the real components
 * cannot miss it.
 *
 * These tests mount the real `AppComponent` under the happy-dom adapter that
 * `bunfig.toml` preloads.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { APP_ROUTES, isPublicRoute } from '../web/app/route-guard';
import { EMPTY_DASHBOARD_JSON, isDashboardUrl } from './dashboard-stub';

const realFetch = globalThis.fetch;
beforeAll(() => {
    // The shell prefetches on mount. Nothing here asserts on data, so every call
    // resolves to an empty 200 rather than reaching a server — except the
    // dashboard, which is a view-shaped payload rather than a collection and
    // whose fields Hem reads directly. See `dashboard-stub.ts`.
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(typeof input === 'object' && 'url' in input ? input.url : input);
        const body = isDashboardUrl(url) ? EMPTY_DASHBOARD_JSON : '[]';
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; });

const { ROUTE_COMPONENTS } = await import('../web/app/app.component');
const { LoginComponent } = await import('../web/auth/auth.component');
const { RegisterComponent } = await import('../web/auth/register.component');
const { HomeComponent } = await import('../web/home/home.component');
const { AppComponent } = await import('../web/app/app.component');

/** Records every component the swap actually builds, in order. */
const rendered: string[] = [];
function record(name: string, Ctor: { prototype: { render: () => unknown } }): void {
    const original = Ctor.prototype.render;
    Ctor.prototype.render = function (this: unknown, ...args: unknown[]) {
        rendered.push(name);
        return (original as (...a: unknown[]) => unknown).apply(this, args);
    };
}
record('Login', LoginComponent as never);
record('Register', RegisterComponent as never);
record('Home', HomeComponent as never);

const USER = { id: 'u1', username: 'anna' };

/**
 * Mount the shell at `route` in the given auth state.
 *
 * The route is set on the router's signal rather than through `history`: the
 * happy-dom `location` does not reliably reflect a `replaceState` path, and the
 * guard reads the signal, not `location`.
 */
function mountAt(route: string, authed: boolean) {
    di.reset();
    const router = di.get(Router);
    const auth = di.get(AuthService);
    router.route.set(route);
    auth.currentUser.set(authed ? USER : null);
    rendered.length = 0;

    document.body.innerHTML = '<div id="app"></div>';
    const app = new AppComponent();
    app.mount(document.getElementById('app') as HTMLElement);
    return { app, router, auth };
}

test('APP_ROUTES is exactly the shell\'s protected route set', () => {
    // `route-guard.ts` keeps its own list rather than importing the swap map,
    // because a security boundary should not be assembled out of whatever
    // happens to be imported elsewhere — and because that module is
    // deliberately free of the view graph. The cost of holding a second copy is
    // that the two can drift, so they are held together HERE instead.
    //
    // Drift in either direction is a real defect, which is why this is an
    // equality and not a subset check. A route in the swap map but missing from
    // APP_ROUTES silently stops being a valid returnTo — deep links to it break
    // with no error. A route in APP_ROUTES that the shell does not resolve is an
    // allow-list entry admitting a path that renders the fallback.
    const protectedRoutes = Object.keys(ROUTE_COMPONENTS).filter((r) => !isPublicRoute(r));
    expect([...APP_ROUTES].sort() as string[]).toEqual(protectedRoutes.sort());
});

test('flash: an authenticated visitor at /login never constructs the login form', () => {
    const { app, router } = mountAt('/login', true);
    // Not "the login form was removed quickly" — it was never built.
    expect(rendered).not.toContain('Login');
    expect(rendered).toContain('Home');
    expect(router.route.get()).toBe('/home');
    app.destroy();
});

test('flash: an authenticated visitor at /register never constructs the register form', () => {
    const { app, router } = mountAt('/register', true);
    expect(rendered).not.toContain('Register');
    expect(router.route.get()).toBe('/home');
    app.destroy();
});

test('flash: a signed-out visitor deep-linking to a protected route never constructs it', () => {
    const { app, router } = mountAt('/planer', false);
    // The protected shell must not mount and fire its loads on the way to being
    // thrown away.
    expect(rendered).toEqual(['Login']);
    expect(router.route.get()).toBe('/login');
    app.destroy();
});

test('flash: the bare origin resolves to /home for a session, /login without one', () => {
    const authed = mountAt('/', true);
    expect(authed.router.route.get()).toBe('/home');
    expect(rendered).not.toContain('Login');
    authed.app.destroy();

    const anon = mountAt('/', false);
    expect(anon.router.route.get()).toBe('/login');
    expect(rendered).not.toContain('Home');
    anon.app.destroy();
});

test('flash: sign-out mid-session swaps to login without painting the protected view', () => {
    const { app, auth, router } = mountAt('/planer/17/redigera', true);
    rendered.length = 0;

    auth.currentUser.set(null);

    expect(rendered.every((r) => r === 'Login')).toBe(true);
    expect(router.route.get()).toBe('/login');
    app.destroy();
});

test('the shell class and the mounted view can never disagree', () => {
    // Two independent reactive paths key off `currentUser`: the --anon class
    // toggle and the swap. Both are driven synchronously from the same
    // `Signal.set`, so they settle within one task and no frame can show an
    // authenticated view inside an anonymous shell (or the reverse). This
    // asserts that they agree at every point an observer could sample.
    const { app, auth } = mountAt('/planer', true);
    const layout = document.querySelector('.app-layout') as HTMLElement;
    const sample = () => ({
        anon: layout.classList.contains('app-layout--anon'),
        view: rendered[rendered.length - 1],
    });

    rendered.length = 0;
    auth.currentUser.set(null);
    expect(sample()).toEqual({ anon: true, view: 'Login' });

    rendered.length = 0;
    auth.currentUser.set(USER);
    expect(sample()).toEqual({ anon: false, view: 'Home' });

    app.destroy();
});

test('guard corrections replace rather than push, so Back stays usable', () => {
    const { app, router } = mountAt('/planer', false);
    const before = history.length;
    // Seven pushed navigations, every one of them protected while signed out.
    for (const r of ['/mal', '/planer', '/students', '/inbox', '/library', '/mal', '/planer']) {
        router.navigate(r);
    }
    // Each push adds one entry; the guard's own correction adds none. If the
    // guard pushed too, this would be 14.
    expect(history.length - before).toBe(7);
    expect(router.route.get()).toBe('/login');
    app.destroy();
});
