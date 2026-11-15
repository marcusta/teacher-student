/**
 * The nav footer link to Kontoinställningar.
 *
 * `nav.test.ts` asserts the information architecture as data — four groups,
 * nine links, exact composition — and this link is deliberately none of those
 * things: it is rendered by `nav.component.ts` below the groups rather than
 * added to `NAV_GROUPS`, precisely so the IA stays what the spec says it is.
 * That leaves it with no coverage at all from the structural test, which is
 * what this file is for.
 *
 * Three claims, all of which the component makes in prose:
 *
 *   1. It routes to /konto like any other nav link.
 *   2. It closes the drawer, via the same `onNavigate` hook — a link that
 *      navigated but left the drawer open over the destination is the specific
 *      failure `navLink()` exists to prevent, and this is the only link that
 *      could get it wrong by being wired separately.
 *   3. It carries no navigation to a signed-out visitor.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { setLocale } from '@basics/core/client/i18n';
import { NAV_GROUPS } from '../web/app/nav.structure';
import { EMPTY_DASHBOARD_JSON, isDashboardUrl } from './dashboard-stub';

const realFetch = globalThis.fetch;
beforeAll(() => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(typeof input === 'object' && 'url' in input ? input.url : input);
        const body = isDashboardUrl(url) ? EMPTY_DASHBOARD_JSON : '[]';
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); });

const { NavComponent } = await import('../web/app/nav.component');
const { AppComponent } = await import('../web/app/app.component');

const USER = { id: 'u1', username: 'anna@example.com' };

function mountNav(onNavigate?: () => void) {
    di.reset();
    const router = di.get(Router);
    di.get(AuthService).currentUser.set(USER);
    document.body.innerHTML = '<div id="app"></div>';
    const nav = new NavComponent(onNavigate ? { onNavigate } : {});
    nav.mount(document.getElementById('app') as HTMLElement);
    return { nav, router };
}

const links = (): HTMLAnchorElement[] =>
    [...document.querySelectorAll('#app a')] as HTMLAnchorElement[];

const footerLink = (): HTMLAnchorElement =>
    document.querySelector('#app .nav__footer a') as HTMLAnchorElement;

test('nav footer: the account link sits below the groups, outside them', () => {
    setLocale('sv');
    const { nav } = mountNav();

    const link = footerLink();
    expect(link, 'the nav renders no account link').not.toBeNull();
    expect(link.textContent).toBe('Kontoinställningar');
    expect(link.getAttribute('href')).toBe('/konto');

    // It is the LAST link, and it is not inside a group — the nine IA
    // destinations come first and are untouched by it.
    expect(links().at(-1)).toBe(link);
    expect(link.closest('.nav__group'), 'the account link must not join a group').toBeNull();
    expect(links().length).toBe(NAV_GROUPS.flatMap((g) => g.items).length + 1);

    nav.destroy();
});

test('nav footer: it routes to /konto and closes the drawer, like every other link', () => {
    setLocale('sv');
    let closed = 0;
    const { nav, router } = mountNav(() => { closed++; });

    footerLink().click();

    expect(router.route.get()).toBe('/konto');
    // The drawer hook. Wired separately from the group links, so nothing else
    // in the suite would notice if it were dropped.
    expect(closed, 'the drawer must close on this link like on any other').toBe(1);

    nav.destroy();
});

test('nav footer: its label follows the locale', () => {
    // Resolved in a thunk, like every other label here — a `t()` called while
    // building the element would freeze it in whatever language was active at
    // mount, which for the sidebar is page load.
    setLocale('sv');
    const { nav } = mountNav();
    expect(footerLink().textContent).toBe('Kontoinställningar');

    setLocale('en');
    expect(footerLink().textContent).toBe('Account settings');

    setLocale('sv');
    expect(footerLink().textContent).toBe('Kontoinställningar');
    nav.destroy();
});

function mountShell(authed: boolean) {
    di.reset();
    const router = di.get(Router);
    router.route.set(authed ? '/home' : '/login');
    di.get(AuthService).currentUser.set(authed ? USER : null);
    document.body.innerHTML = '<div id="app"></div>';
    const shell = new AppComponent();
    shell.mount(document.getElementById('app') as HTMLElement);
    return shell;
}

test('nav footer: a signed-out visitor is offered no account link', () => {
    setLocale('sv');
    const shell = mountShell(false);

    // The shell hides the navigation wholesale while signed out, which is why
    // the component itself carries no auth check. That argument only holds
    // while every account link IS inside the hidden containers — so this
    // asserts placement, not a computed style happy-dom does not resolve.
    const accountLinks = [...document.querySelectorAll('#app a[href="/konto"]')];
    expect(accountLinks.length, 'the drawer and sidebar each render one').toBeGreaterThan(0);
    for (const link of accountLinks) {
        const hidden = link.closest('.app-layout__nav') ?? link.closest('#app-nav-drawer');
        expect(hidden, 'an account link outside the navigation would survive --anon').not.toBeNull();
    }
    expect((document.querySelector('.app-layout') as HTMLElement).className)
        .toContain('app-layout--anon');
    expect((document.getElementById('app-nav-drawer') as HTMLElement).className)
        .toContain('app-nav-drawer--anon');

    shell.destroy();
});

test('nav footer: signing in reveals the navigation that carries it', () => {
    setLocale('sv');
    const shell = mountShell(true);

    expect((document.querySelector('.app-layout') as HTMLElement).className)
        .not.toContain('app-layout--anon');
    expect(document.querySelector('#app .app-layout__nav a[href="/konto"]')).not.toBeNull();

    shell.destroy();
});
