/**
 * Where the Lektioner empty state actually SENDS people.
 *
 * The destination is a live link, and a live link is the one thing a copy test
 * cannot see: `lesson-copy.test.ts` checks every string this view renders and
 * would have passed just as happily while the button pointed at a view the
 * information architecture has dissolved. So this mounts the real component and
 * clicks the real button.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads, same as
 * `page-title.dom.test.ts`.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { setLocale } from '@basics/core/client/i18n';

const realFetch = globalThis.fetch;
beforeAll(() => {
    // Every list this view loads comes back empty, which is the whole point:
    // no lessons and no students is the state that renders the empty variant
    // under test.
    globalThis.fetch = (async () =>
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); });

const { LessonsComponent } = await import('../web/lessons/lessons.component');

async function mountLessons() {
    di.reset();
    const router = di.get(Router);
    document.body.innerHTML = '<div id="app"></div>';
    const view = new LessonsComponent();
    view.mount(document.getElementById('app') as HTMLElement);
    // The loads are fetch-backed even when the fetch is instant, so let the
    // task queue drain before asserting on what rendered.
    await new Promise((r) => setTimeout(r, 20));
    return { view, router };
}

const emptyAction = () =>
    document.querySelector('#app .ui-empty-state__action') as HTMLButtonElement | null;

test('lessons empty state: the rider CTA goes to /students, not the dissolved /invitations', async () => {
    // IA §1 folds outgoing invitations into Mina elever and IA §3.3 makes
    // `/students` open with Bjud in elev — the same action this button is
    // labelled with. `/invitations` still resolves, so pointing here was not a
    // broken link; it was a link to a page the IA has already replaced, showing
    // invitations without the roster they belong to.
    setLocale('sv');
    const { view, router } = await mountLessons();

    const action = emptyAction();
    expect(action, 'the empty state should render an action').not.toBeNull();
    expect(action!.textContent).toBe('Bjud in elev');

    action!.click();
    expect(router.route.get()).toBe('/students');
    expect(router.route.get(), '/invitations is dissolved into /students').not.toBe('/invitations');

    view.destroy();
});
