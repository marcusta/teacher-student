/**
 * `returnTo` end to end, through the real shell and the real forms.
 *
 * `return-to.test.ts` proves the validation is right. That says nothing about
 * whether the shell actually captures the destination on the way out, whether
 * the forms still hold it after the guard has replaced the URL underneath them,
 * or whether the hop between /login and /register drops it. Those are the parts
 * that broke in the first place, so they are asserted against the mounted app
 * rather than against the pure function.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads, as in
 * `route-guard.dom.test.ts`.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { EMPTY_DASHBOARD_JSON, isDashboardUrl } from './dashboard-stub';

const realFetch = globalThis.fetch;
beforeAll(() => {
    // Every call succeeds. Nothing here asserts on data — the flow is the
    // subject — but the shape still has to be plausible: landing on /planer
    // mounts the real plans shell, which loads and immediately calls
    // `groupPlans` on whatever comes back. A single canned body cannot serve
    // both an auth endpoint (an object) and a collection (an array), so the
    // stub answers by URL.
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(typeof input === 'object' && 'url' in input ? input.url : input);
        const body = /\/(auth|register)\b/.test(url)
            ? JSON.stringify({ id: 'u1', username: 'anna' })
            // Landing on /home mounts Hem, which reads the dashboard payload's
            // fields directly — a collection stub has none. See `dashboard-stub.ts`.
            : isDashboardUrl(url) ? EMPTY_DASHBOARD_JSON
            : '[]';
        return new Response(body, {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; });

const { AppComponent } = await import('../web/app/app.component');

function mountAt(route: string, search = '') {
    di.reset();
    const router = di.get(Router);
    const auth = di.get(AuthService);
    router.route.set(route);
    router.search.set(search);
    auth.currentUser.set(null);

    document.body.innerHTML = '<div id="app"></div>';
    const shell = new AppComponent();
    shell.mount(document.getElementById('app') as HTMLElement);
    return { shell, router, auth };
}

/** Type into an input the way the component's `oninput` binding expects. */
function fill(selector: string, value: string): void {
    const input = document.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function submit(): void {
    (document.querySelector('.auth__form') as HTMLFormElement)
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

/** Let the submit handler's awaits settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

test('returnTo: a deep link while signed out records where the visitor was going', () => {
    const { shell, router } = mountAt('/planer');
    expect(router.route.get()).toBe('/login');
    expect(router.search.get()).toBe('?returnTo=%2Fplaner');
    shell.destroy();
});

test('returnTo: a deep link to a nested route keeps the whole path', () => {
    const { shell, router } = mountAt('/planer/17/redigera');
    expect(router.search.get()).toBe('?returnTo=%2Fplaner%2F17%2Fredigera');
    shell.destroy();
});

test('returnTo: a route the app does not have is not reflected into the URL', () => {
    const { shell, router } = mountAt('/nonsense');
    expect(router.route.get()).toBe('/login');
    expect(router.search.get()).toBe('');
    shell.destroy();
});

test('returnTo: the bare origin produces a clean /login, not an empty parameter', () => {
    const { shell, router } = mountAt('/');
    expect(router.route.get()).toBe('/login');
    expect(router.search.get()).toBe('');
    shell.destroy();
});

test('returnTo: signing in lands on the deep link, not on /home', async () => {
    // The bug, stated as the flow that used to fail.
    const { shell, router } = mountAt('/planer');
    fill('#auth-email', 'alva@exempel.se');
    fill('#auth-password', 'hemligt123');
    submit();
    await settle();

    expect(router.route.get()).toBe('/planer');
    shell.destroy();
});

test('returnTo: an ordinary sign-in still lands on /home', async () => {
    // The requirement that must not regress while fixing the one above.
    const { shell, router } = mountAt('/login');
    fill('#auth-email', 'alva@exempel.se');
    fill('#auth-password', 'hemligt123');
    submit();
    await settle();

    expect(router.route.get()).toBe('/home');
    shell.destroy();
});

test('returnTo: SECURITY — an attacker-supplied off-site parameter is ignored', async () => {
    // The victim opens a crafted link, signs in for real, and must still land
    // inside the app. This is the assertion the whole mechanism answers to.
    const { shell, router } = mountAt('/login', '?returnTo=https%3A%2F%2Fevil.example');
    fill('#auth-email', 'alva@exempel.se');
    fill('#auth-password', 'hemligt123');
    submit();
    await settle();

    expect(router.route.get()).toBe('/home');
    shell.destroy();
});

test('returnTo: SECURITY — a protocol-relative parameter is ignored', async () => {
    const { shell, router } = mountAt('/login', '?returnTo=%2F%2Fevil.example');
    fill('#auth-email', 'alva@exempel.se');
    fill('#auth-password', 'hemligt123');
    submit();
    await settle();

    expect(router.route.get()).toBe('/home');
    shell.destroy();
});

test('returnTo: it survives the hop to /register', () => {
    const { shell, router } = mountAt('/planer');
    expect(router.search.get()).toBe('?returnTo=%2Fplaner');

    (document.querySelector('.auth__alt-link') as HTMLElement).click();

    expect(router.route.get()).toBe('/register');
    expect(router.search.get()).toBe('?returnTo=%2Fplaner');
    shell.destroy();
});

test('returnTo: it survives the hop back to /login', () => {
    const { shell, router } = mountAt('/planer');
    (document.querySelector('.auth__alt-link') as HTMLElement).click();
    (document.querySelector('.auth__alt-link') as HTMLElement).click();

    expect(router.route.get()).toBe('/login');
    expect(router.search.get()).toBe('?returnTo=%2Fplaner');
    shell.destroy();
});

test('returnTo: registering after a deep link lands on the deep link', async () => {
    const { shell, router } = mountAt('/planer');
    (document.querySelector('.auth__alt-link') as HTMLElement).click();
    expect(router.route.get()).toBe('/register');

    fill('#reg-email', 'alva@exempel.se');
    fill('#reg-name', 'Alva');
    fill('#reg-password', 'hemligt123');
    submit();
    await settle();

    expect(router.route.get()).toBe('/planer');
    shell.destroy();
});

test('returnTo: the guard still REPLACES, so Back is not a bounce', () => {
    // The deliberate property the returnTo work had to preserve: the guard's
    // correction adds no history entry, parameter or no parameter.
    const { shell, router } = mountAt('/planer');
    const before = history.length;
    for (const r of ['/mal', '/planer', '/students', '/inbox']) router.navigate(r);
    expect(history.length - before).toBe(4);
    expect(router.route.get()).toBe('/login');
    shell.destroy();
});

test('returnTo: the destination follows the LAST protected route asked for', () => {
    // Each bounce rewrites the parameter, so a visitor who wanders while signed
    // out is returned to where they finally landed, not where they started.
    const { shell, router } = mountAt('/planer');
    expect(router.search.get()).toBe('?returnTo=%2Fplaner');
    router.navigate('/mal');
    expect(router.route.get()).toBe('/login');
    expect(router.search.get()).toBe('?returnTo=%2Fmal');
    shell.destroy();
});
