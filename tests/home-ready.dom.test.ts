/**
 * What **Hem** actually paints once the account HAS something — the `ready`
 * state, mounted with a fully populated `GET /api/dashboard` body.
 *
 * `home-copy.test.ts` proves the rules and `home-empty.dom.test.ts` proves the
 * two empty states plus the fourth, unanswered one. Neither ever mounted the
 * component with content, so the whole of `renderBlock` / `renderNextLesson` /
 * `renderFeedback` / `renderAwaiting` / `renderRiding` / `buildActions` and the
 * freshness line executed in NO test: four independent mutations (gutting
 * `renderRiding`, gutting `renderBlock`, dropping the quick actions, and reading
 * the page's own `nowIso` for "Uppdaterad" instead of the payload's
 * `generatedAt`) each left the suite green. This file is what makes those four
 * red.
 *
 * The two clocks are the subtle one. Contract §4.3 keeps `view.generatedAt` (the
 * SERVER's assembly clock, used for exactly one sentence) apart from the page's
 * `nowIso` (frozen at mount, the reader's own instant). If the component passes
 * `nowIso` for both, "Uppdaterad" reads "nu" forever and no payload can ever look
 * stale — so `generatedAt` here is deliberately three hours behind the mount, and
 * the assertion is on the resulting words.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads, same pattern as
 * `home-empty.dom.test.ts` — including its `di.reset()`.
 */
import { test, expect, beforeEach, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { setLocale } from '@basics/core/client/i18n';
import { targetDateLabel } from '../web/goals/goal-copy';
import { EMPTY_DASHBOARD } from './dashboard-stub';
import type {
    DashboardAwaitingItem,
    DashboardFeedback,
    DashboardGoalRef,
    DashboardNextLesson,
    DashboardPlanRef,
    DashboardView,
} from '../web/api';

const realFetch = globalThis.fetch;
let body: DashboardView = EMPTY_DASHBOARD;

beforeEach(() => {
    globalThis.fetch = (async () => new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); });

const { HomeComponent } = await import('../web/home/home.component');

const HOUR_MS = 60 * 60 * 1000;

/** Three hours behind the mount — see the file docstring on the two clocks. */
const generatedAt = new Date(Date.now() - 3 * HOUR_MS).toISOString();

const LESSON: DashboardNextLesson = {
    id: 'l1',
    scheduledAt: '2026-07-22T17:00:00.000Z',
    role: 'student',
    counterpartyDisplayName: 'Alva Lindgren',
    horseName: 'Luna',
    planId: 'p1',
    planTitle: 'Hoppsäsong vår 2026',
    exercisePreview: ['Volt', 'Serpentin', 'Trav'],
    exerciseCount: 5,
};

const FEEDBACK: DashboardFeedback = {
    noteId: 'n1',
    parentKind: 'lesson_exercise',
    parentId: 'le1',
    targetKind: 'lesson',
    targetId: 'l1',
    targetLabel: 'Alva Lindgren',
    exerciseName: 'Volt',
    authorId: 'u2',
    authorDisplayName: 'Alva Lindgren',
    body: 'Bra tempo i galoppen i dag.',
    createdAt: new Date(Date.now() - 2 * HOUR_MS).toISOString(),
};

const AWAITING: DashboardAwaitingItem[] = [
    {
        kind: 'lesson',
        id: 'l9',
        occurredAt: '2026-07-20T17:00:00.000Z',
        studentDisplayName: 'Nils Berg',
        horseName: 'Rocky',
    },
    {
        kind: 'training_session',
        id: 's4',
        occurredAt: '2026-07-19T09:00:00.000Z',
        studentDisplayName: 'Sara Ek',
        horseName: null,
    },
];

const PLAN: DashboardPlanRef = {
    id: 'p1',
    title: 'Hoppsäsong vår 2026',
    startDate: '2026-03-03',
    endDate: '2026-06-30',
    primaryTeacherDisplayName: 'Alva Lindgren',
};

/**
 * Ten days out, computed from the clock rather than pinned: the overdue marker
 * is derived from the READER's calendar day, so a hardcoded date would make this
 * file start failing on its own the week it passed.
 */
const GOAL_TARGET = new Date(Date.now() + 10 * 24 * HOUR_MS).toISOString().slice(0, 10);
const GOAL: DashboardGoalRef = { id: 'g1', title: 'Hoppa 1,10', targetDate: GOAL_TARGET };

function fullDashboard(overrides: Partial<DashboardView> = {}): DashboardView {
    return {
        capabilities: { teaches: true, rides: true },
        nextLesson: LESSON,
        latestFeedback: FEEDBACK,
        awaitingFeedback: AWAITING,
        activePlans: [PLAN],
        goalsNearingTarget: [GOAL],
        pendingInvitations: 0,
        generatedAt,
        ...overrides,
    };
}

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

const cards = () => [...document.querySelectorAll('#app .home__cards > .home__card')] as HTMLElement[];

const textOf = (root: Element, selector: string): string[] =>
    [...root.querySelectorAll(selector)].map((el) => (el.textContent ?? '').trim());

const visible = (el: Element | null): boolean => el !== null && !el.closest('.hidden');

test('ready: all four blocks paint their content, in IA §3.1 priority order', async () => {
    setLocale('sv');
    body = fullDashboard();
    const { view } = await mountHome();

    // §4.2's cap is four, and this is the fullest payload there is.
    expect(cards().length, 'four cards, one per block').toBe(4);
    expect(cards().map((c) => (c.querySelector('.home__card-label')?.textContent ?? '')))
        .toEqual(['Nästa lektion', 'Senaste återkoppling', 'Väntar på din återkoppling', 'Din träning']);

    // ── 1. Nästa lektion — the whole card, not just its heading.
    const lesson = cards()[0]!;
    expect(lesson.tagName).toBe('A');
    expect((lesson as HTMLAnchorElement).getAttribute('href')).toBe('/lektioner/l1');
    expect(textOf(lesson, '.home__card-value')).toEqual(['Onsdag 22 juli · 17:00']);
    // Nulls are dropped, not printed — so the meta line is exactly these three.
    expect(textOf(lesson, '.home__card-meta')[0]).toBe('Alva Lindgren · Luna · Hoppsäsong vår 2026');
    // Preview plus the count of what it did NOT name: 5 − 3 = 2.
    expect(textOf(lesson, '.home__card-meta')[1]).toBe('Volt · Serpentin · Trav · +2 övningar till');

    // ── 2. Senaste återkoppling — excerpt, context and byline, no badge.
    const feedback = cards()[1]!;
    expect((feedback as HTMLAnchorElement).getAttribute('href'), 'targetKind, not parentKind')
        .toBe('/lektioner/l1');
    expect(textOf(feedback, '.home__card-value')).toEqual(['Bra tempo i galoppen i dag.']);
    // `parentKind` is the junction kind, so the context names the exercise.
    expect(textOf(feedback, '.home__card-meta')[0])
        .toBe('På övningen Volt i lektionen med Alva Lindgren');
    expect(textOf(feedback, '.home__card-meta')[1]).toBe('Alva Lindgren · för 2 tim sedan');
    expect(feedback.textContent).not.toContain('Ny');

    // ── 3. Väntar på din återkoppling — a prompt with real rows.
    const awaiting = cards()[2]!;
    expect(awaiting.tagName, 'a card holding row anchors is not itself a link').toBe('DIV');
    expect(textOf(awaiting, '.home__card-value')).toEqual(['2 tillfällen']);
    expect(textOf(awaiting, '.home__row-title'))
        .toEqual(['Lektion med Nils Berg', 'Träningspass · Sara Ek']);
    expect([...awaiting.querySelectorAll('.home__row')].map((a) => (a as HTMLAnchorElement).getAttribute('href')))
        .toEqual(['/lektioner/l9', '/traningspass/s4']);
    // Each occasion is dated in its own vocabulary, and the horse rides along.
    expect(textOf(awaiting, '.home__row-meta')[0]).toContain('Rocky');
    expect(textOf(awaiting, '.home__card .home__action--ghost').at(-1)).toBe('Öppna Lektioner');

    // ── 4. Din träning — plans AND goals share the one card.
    const riding = cards()[3]!;
    expect(textOf(riding, '.home__card-value')).toEqual(['1 aktiv plan']);
    expect(textOf(riding, '.home__card-sublabel')).toEqual(['Måldatum som närmar sig']);
    expect(textOf(riding, '.home__row-title')).toEqual(['Hoppsäsong vår 2026', 'Hoppa 1,10']);
    expect([...riding.querySelectorAll('.home__row')].map((a) => (a as HTMLAnchorElement).getAttribute('href')))
        .toEqual(['/planer/p1', '/mal/g1']);
    expect(textOf(riding, '.home__row-meta')[1]).toContain(targetDateLabel(GOAL_TARGET)!);
    // Ten days out is not overdue, and the marker is a WORD when it is.
    expect(riding.querySelector('.home__overdue')).toBeNull();

    view.destroy();
});

test('ready: the quick actions render, one primary, and Boka lektion is the one capability gate', async () => {
    setLocale('sv');
    body = fullDashboard();
    const { view, router } = await mountHome();

    const actions = [...document.querySelectorAll('#app .home__actions .home__action')] as HTMLAnchorElement[];
    expect(actions.map((a) => a.textContent)).toEqual(['Logga pass', 'Boka lektion']);
    // One primary per view (UI_DECISIONS §9), and it is the unconditional action.
    expect(actions.filter((a) => a.className.includes('--primary')).map((a) => a.textContent))
        .toEqual(['Logga pass']);

    actions[0]!.click();
    expect(router.route.get()).toBe('/traningspass/ny');

    view.destroy();
});

test('ready: without a teaching Relation, Boka lektion is withheld', async () => {
    setLocale('sv');
    body = fullDashboard({
        capabilities: { teaches: false, rides: true },
        awaitingFeedback: [],
    });
    const { view } = await mountHome();

    const actions = [...document.querySelectorAll('#app .home__actions .home__action')] as HTMLAnchorElement[];
    expect(actions.map((a) => a.textContent), 'LessonService.create needs a Relation').toEqual(['Logga pass']);
    // And with neither content nor `teaches`, the awaiting block has nothing to
    // be the empty state OF — three cards, not four.
    expect(cards().length).toBe(3);

    view.destroy();
});

test('ready: "Uppdaterad" reports the payload\'s age, not the moment the page mounted', async () => {
    // Contract §4.3: `generatedAt` is the SERVER's assembly clock and `nowIso` is
    // the reader's. Passing `nowIso` for both makes this line read "Uppdaterad nu"
    // forever — a dashboard that can never look stale.
    setLocale('sv');
    body = fullDashboard();
    const { view } = await mountHome();

    const updated = document.querySelector('#app .home__updated');
    expect(visible(updated), 'the freshness line belongs to `ready`').toBe(true);
    expect(updated!.textContent).toBe('Uppdaterad för 3 tim sedan');

    view.destroy();
});

test('ready: an empty block still answers, and the page never claims a state it has not got', async () => {
    // Content in one place only. `nextLesson` and `latestFeedback` always render
    // — an absence a reader asked about is an answer — and each keeps its single
    // §4.14 exit.
    setLocale('sv');
    body = fullDashboard({
        capabilities: { teaches: false, rides: true },
        nextLesson: null,
        latestFeedback: null,
        awaitingFeedback: [],
    });
    const { view } = await mountHome();

    expect(cards().map((c) => (c.querySelector('.home__card-value')?.textContent ?? '')))
        .toEqual(['Ingen bokad lektion', 'Ingen delad återkoppling än', '1 aktiv plan']);
    expect(textOf(cards()[0]!, '.home__action--ghost')).toEqual(['Visa lektioner']);
    expect(textOf(cards()[1]!, '.home__action--ghost')).toEqual(['Öppna Lektioner']);
    // Neither empty state may show on a page that has content.
    expect(document.querySelector('#app .home__state:not(.hidden)')).toBeNull();

    view.destroy();
});

// ─── Pending invitations in `ready` (IA §3.17) ──────────────────

test('ready: a pending invitation surfaces as a banner above the grid, deep-linking to Inkorgen', async () => {
    // The half of §3.17 that was missing: `homeState` returns `ready` as soon as
    // the account has content, and `pendingInvitations` was surfaced only by the
    // `invited` branch — so an established rider invited by a SECOND teacher saw
    // nothing here at all. A banner rather than a fifth card: §4.2 caps the grid
    // at four, and this is one line with one destination.
    setLocale('sv');
    body = fullDashboard({ pendingInvitations: 2 });
    const { view, router } = await mountHome();

    const banner = document.querySelector('#app .home__invite');
    expect(visible(banner), 'the invitation banner must be on screen in `ready`').toBe(true);
    expect(banner!.querySelector('.home__invite-text')!.textContent)
        .toBe('Du har 2 inbjudningar som väntar.');

    // Still four cards — the banner does not spend one of them.
    expect(cards().length).toBe(4);
    // Launchpad only: it links out, it does not accept or decline inline.
    expect(banner!.querySelectorAll('button').length, 'no inline accept/decline').toBe(0);

    const link = banner!.querySelector('a') as HTMLAnchorElement;
    expect(link.textContent).toBe('Öppna Inkorgen');
    expect(link.getAttribute('href')).toBe('/inbox');
    link.click();
    expect(router.route.get()).toBe('/inbox');

    view.destroy();
});

test('ready: no pending invitation, no banner — and the lede stays the ready one', async () => {
    setLocale('sv');
    body = fullDashboard({ pendingInvitations: 0 });
    const { view } = await mountHome();

    expect(visible(document.querySelector('#app .home__invite')),
        'zero invitations must not render "Du har inga inbjudningar som väntar."').toBe(false);
    expect(document.querySelector('#app .home__lede')!.textContent).toBe('Det här behöver dig i dag.');

    view.destroy();
});
