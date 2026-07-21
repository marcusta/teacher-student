/**
 * What the two empty states on **Hem** actually put on screen, and where they
 * send people.
 *
 * `home-copy.test.ts` proves which state applies and what each href resolves to.
 * It cannot see whether the component renders that state, whether the state has
 * an exit at all, or whether it grew a second one — and design system §4.14 is a
 * rule about exactly that: one action per empty state, no more and no fewer.
 * `COMPONENTS.md` records that every hand-rolled empty state in `web/` predating
 * that rule had zero, so "none" is the realistic regression, not "two".
 *
 * The fourth state gets an assertion of its own here, because it is the one that
 * misinforms when it breaks: while the fetch is unresolved or failed, NEITHER
 * empty state may render. A dashboard that answers "you have nothing" to a
 * request that never came back is lying.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads, same as
 * `lessons-empty.dom.test.ts`.
 */
import { test, expect, beforeEach, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { setLocale } from '@basics/core/client/i18n';
import { EMPTY_DASHBOARD } from './dashboard-stub';
import type { DashboardView } from '../web/api';

const realFetch = globalThis.fetch;
let body: DashboardView = EMPTY_DASHBOARD;
let fail = false;

beforeEach(() => {
    globalThis.fetch = (async () => {
        if (fail) return new Response('{"error":"nope"}', { status: 500 });
        return new Response(JSON.stringify(body), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); fail = false; });

const { HomeComponent } = await import('../web/home/home.component');

async function mountHome() {
    di.reset();
    const router = di.get(Router);
    document.body.innerHTML = '<div id="app"></div>';
    const view = new HomeComponent();
    view.mount(document.getElementById('app') as HTMLElement);
    // The load is fetch-backed even when the fetch is instant.
    await new Promise((r) => setTimeout(r, 20));
    return { view, router };
}

const visible = (el: Element | null): boolean =>
    el !== null && !el.closest('.hidden');

/**
 * Both empty states are BUILT at mount and toggled by class — the framework's
 * empty state is mounted once with reactive copy rather than rebuilt, which is
 * LESSONS #1 — so every query here is scoped to the visible state. An unscoped
 * `querySelector` finds the hidden one and reports an exit that is not on
 * screen.
 */
const emptyAction = () =>
    document.querySelector('#app .home__state:not(.hidden) .ui-empty-state__action') as HTMLButtonElement | null;

const startActions = () =>
    [...document.querySelectorAll('#app .home__state:not(.hidden) .home__panel .home__action')] as HTMLAnchorElement[];

test('invited: the welcome state offers exactly one exit, and it is the Inkorg', async () => {
    setLocale('sv');
    fail = false;
    body = { ...EMPTY_DASHBOARD, pendingInvitations: 2 };
    const { view, router } = await mountHome();

    const state = document.querySelector('#app .home__state:not(.hidden)');
    expect(state, 'the invited state should be the visible one').not.toBeNull();

    // The count is a real domain state (contract §2.2), not a read-state badge,
    // and it is stated in words rather than rendered as a dot.
    expect((document.querySelector('#app .home__lede') as HTMLElement).textContent)
        .toBe('Du har 2 inbjudningar som väntar.');

    const action = emptyAction();
    expect(action, 'the empty state must have an exit').not.toBeNull();
    expect(document.querySelectorAll('#app .home__state:not(.hidden) .ui-empty-state__action').length,
        '§4.14: exactly one action').toBe(1);
    expect(action!.textContent).toBe('Öppna Inkorgen');

    action!.click();
    expect(router.route.get()).toBe('/inbox');

    view.destroy();
});

test('fresh: two starting paths at equal weight, neither hidden by capability', async () => {
    // A brand-new account is `{ teaches: false, rides: false }` (IA §3.20). It
    // must still be able to discover that inviting a student is possible —
    // hiding the teaching path from the only accounts that have not found it is
    // the exact failure UI_DECISIONS §1 exists to prevent.
    setLocale('sv');
    fail = false;
    body = EMPTY_DASHBOARD;
    const { view, router } = await mountHome();

    const actions = startActions();
    expect(actions.map((a) => a.textContent))
        .toEqual(['Bjud in elev', 'Lägg till häst', 'Skapa mål']);

    // Equal weight is the requirement, so neither path may wear the primary
    // tier — and the third link is deliberately a lower tier than both.
    expect(actions.filter((a) => a.className.includes('--primary')).length,
        'neither starting path may outrank the other').toBe(0);
    expect(actions[2]!.className).toContain('--ghost');

    // The header's quick actions belong to the `ready` state only: a primary in
    // the header beside these would be a third, louder exit.
    expect(document.querySelector('#app .home__actions')!.children.length).toBe(0);

    actions[0]!.click();
    expect(router.route.get()).toBe('/students');

    view.destroy();
});

test('unknown: a failed fetch renders neither empty state, and offers a retry', async () => {
    // The regression this state exists to prevent. `homeState` checks failure
    // BEFORE resolution, so a request that errored can never be reported as an
    // account with nothing in it.
    setLocale('sv');
    fail = true;
    body = EMPTY_DASHBOARD;
    const { view } = await mountHome();

    expect(visible(document.querySelector('#app .home__error')),
        'the scoped error must be on screen').toBe(true);
    expect(document.querySelector('#app .home__state:not(.hidden)'),
        'no empty state may claim "you have nothing" without an answer in hand').toBeNull();
    expect(emptyAction()).toBeNull();
    expect(startActions().length).toBe(0);

    const retry = document.querySelector('#app .home__retry') as HTMLButtonElement;
    expect(retry.textContent).toBe('Försök igen');

    fail = false;
    view.destroy();
});
