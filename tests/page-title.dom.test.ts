/**
 * The two things `page-title.test.ts` cannot check on its own: that the title
 * table covers the routes the shell actually resolves, and that the title the
 * top bar renders survives a locale switch.
 *
 * Mounts the real `AppComponent` under the happy-dom adapter `bunfig.toml`
 * preloads, same as `route-guard.dom.test.ts`.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { setLocale } from '@basics/core/client/i18n';
import { pageTitleKey } from '../web/app/page-title';
import { isPublicRoute } from '../web/app/route-guard';
import { EMPTY_DASHBOARD_JSON, isDashboardUrl } from './dashboard-stub';

const realFetch = globalThis.fetch;
beforeAll(() => {
    // `[]` for every collection endpoint; the dashboard is view-shaped and needs
    // a plausible object instead — see `dashboard-stub.ts`.
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(typeof input === 'object' && 'url' in input ? input.url : input);
        const body = isDashboardUrl(url) ? EMPTY_DASHBOARD_JSON : '[]';
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); });

const { ROUTE_COMPONENTS } = await import('../web/app/app.component');
const { AppComponent } = await import('../web/app/app.component');
const { AppService } = await import('../web/app/app.service');

const USER = { id: 'u1', username: 'anna' };

function mountAt(route: string, authed: boolean) {
    di.reset();
    const router = di.get(Router);
    const auth = di.get(AuthService);
    const app = di.get(AppService);
    router.route.set(route);
    auth.currentUser.set(authed ? USER : null);

    document.body.innerHTML = '<div id="app"></div>';
    const shell = new AppComponent();
    shell.mount(document.getElementById('app') as HTMLElement);
    return { shell, router, auth, app };
}

const titleText = () =>
    (document.querySelector('.top-bar__title') as HTMLElement).textContent;

test('page-title: every protected route the shell resolves has a name', () => {
    // The anti-drift check. A destination added to ROUTE_COMPONENTS without a
    // matching entry in page-title.ts fails HERE rather than shipping with an
    // empty top bar that nobody notices above 1024px.
    for (const route of Object.keys(ROUTE_COMPONENTS)) {
        if (isPublicRoute(route)) continue;
        expect(pageTitleKey(route), `${route} is in the swap map but has no title`).not.toBeNull();
    }
});

test('page-title: the bar names the mounted page', () => {
    setLocale('sv');
    const { shell } = mountAt('/planer', true);
    expect(titleText()).toBe('Planer');
    shell.destroy();
});

test('page-title: it follows navigation rather than sticking at the first page', () => {
    setLocale('sv');
    const { shell, router } = mountAt('/planer', true);
    router.navigate('/mal');
    expect(titleText()).toBe('Mål');
    router.navigate('/students/abc');
    expect(titleText()).toBe('Mina elever');
    shell.destroy();
});

test('page-title: it names the view the guard actually mounted, not the route asked for', () => {
    // Signed out at /planer the login form is what is on screen. A title read
    // from `router.route` would announce "Planer" over it.
    //
    // NOTE this assertion alone cannot tell the two sources apart, and the test
    // below is the one that can. By the time anything is readable the guard has
    // already rewritten `router.route` to '/login', so both `router.route` and
    // `guardedView` name the same view — which is the idempotence property
    // working, not the derivation being pinned. Kept as the plain statement of
    // the requirement; see the next test for the part that discriminates.
    setLocale('sv');
    const { shell } = mountAt('/planer', false);
    expect(titleText()).toBe('');
    shell.destroy();
});

test('page-title: the title follows the GUARD, not the URL, when the two disagree', () => {
    // The discriminating test. `app.component.ts` states that the URL
    // correction "is allowed to be late — nothing is painted from it", and this
    // is what holds that claim up: suppress the correction entirely and the
    // painted title must still be the guard's answer.
    //
    // Without this, swapping `guardedView(...)` for `this.router.route.get()`
    // in the title effect passes every other test in this file, because the
    // guard effect is registered first and has already corrected the route
    // before the title effect ever reads it. That is an ordering accident, and
    // reordering the two effects would break the title silently.
    setLocale('sv');
    const { shell, router, auth } = mountAt('/planer', true);
    expect(titleText()).toBe('Planer');

    // Pin the URL where it is, so `router.route` keeps saying '/planer' while
    // the guard says the login form is what should be mounted.
    const realNavigate = router.navigate.bind(router);
    router.navigate = (() => {}) as typeof router.navigate;
    try {
        auth.currentUser.set(null);
        expect(router.route.get(), 'the URL must still disagree, or this proves nothing')
            .toBe('/planer');
        // Reading router.route here would say "Planer" over a login form.
        expect(titleText()).toBe('');
    } finally {
        router.navigate = realNavigate;
        shell.destroy();
    }
});

test('page-title: the shell stores a KEY, and the top bar is what resolves it', () => {
    // Pins the seam itself, which no rendered-text assertion can: the top bar
    // shows "Planer" whether the shell wrote 'nav.plans' or wrote 'Planer'.
    // Resolving in the shell would in fact still be reactive here — effects
    // auto-track, so `t()` upstream would subscribe to the locale signal too —
    // so this is not a bug test. It is a boundary test: what crosses this
    // signal is locale-independent data, and the shell has no business knowing
    // what language the reader has chosen.
    setLocale('sv');
    const { shell, app, router } = mountAt('/planer', true);
    expect(app.titleKey.get()).toBe('nav.plans');
    expect(titleText()).toBe('Planer');

    // Still a key in the other direction, so this cannot pass by coincidence of
    // one key happening to differ from its Swedish rendering.
    setLocale('en');
    expect(app.titleKey.get(), 'the signal must not depend on the locale').toBe('nav.plans');
    expect(titleText()).toBe('Plans');

    router.navigate('/hastar');
    expect(app.titleKey.get()).toBe('nav.stable');
    shell.destroy();
});

test('page-title: signing out clears the title with the rest of the shell', () => {
    setLocale('sv');
    const { shell, auth } = mountAt('/planer', true);
    expect(titleText()).toBe('Planer');
    auth.currentUser.set(null);
    expect(titleText()).toBe('');
    shell.destroy();
});

test('page-title: the title survives a locale switch', () => {
    // Previously named "THE REACTIVITY TRAP", on the belief that resolving the
    // string upstream would freeze it. It would not — effects auto-track in
    // this framework, so an upstream `t()` re-runs on `setLocale` and this test
    // passes either way. The name promised a discrimination the test never had.
    //
    // Renamed rather than deleted, because the BEHAVIOUR is still worth
    // pinning: the bar must not contradict the rest of the page after a locale
    // switch, however that ends up being implemented. The design choice it used
    // to claim to protect is pinned by the KEY test above instead.
    setLocale('sv');
    const { shell } = mountAt('/hastar', true);
    expect(titleText()).toBe('Hästar');

    setLocale('en');
    expect(titleText()).toBe('Horses');

    setLocale('sv');
    expect(titleText()).toBe('Hästar');
    shell.destroy();
});

/**
 * The invariant the top bar's <640px rule is built on.
 *
 * `top-bar.component.ts` hides the page title below 640px on the grounds that
 * the page names ITSELF — the bar's title is a redundant second cue, and at
 * 320px it renders as one glyph and an ellipsis. That argument is only sound
 * while every destination actually has an <h1>, and when this rule was written
 * two of them did not: /inbox and /invitations titled themselves <h2>, so
 * hiding the bar title would have left those two pages with no level-1 name at
 * all on a phone.
 *
 * So the claim is pinned here rather than trusted. A new destination that
 * forgets its <h1>, or one that demotes an existing heading, fails HERE — at
 * the assumption — instead of silently degrading a viewport nobody tests in.
 */
test('page-title: every destination names itself with an h1', () => {
    setLocale('sv');
    for (const route of Object.keys(ROUTE_COMPONENTS)) {
        const { shell } = mountAt(route, !isPublicRoute(route));
        // Scoped past the shell: the top bar renders its title as a <span>, so
        // an h1 found here is always the PAGE's own, never the bar's.
        const heading = document.querySelector('#app h1');
        expect(heading, `${route} renders no <h1> — it has no page-level name`).not.toBeNull();
        expect(heading!.textContent?.trim().length, `${route} has an empty <h1>`).toBeGreaterThan(0);
        shell.destroy();
    }
});
