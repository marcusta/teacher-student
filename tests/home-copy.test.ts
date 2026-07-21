import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    INBOX_HREF,
    LESSONS_HREF,
    awaitingCountLabel,
    awaitingHref,
    awaitingLabel,
    awaitingWhen,
    blockTitleKey,
    feedbackByline,
    feedbackContext,
    feedbackExcerpt,
    feedbackHref,
    goalHref,
    goalOverdueLabel,
    goalTargetLabel,
    homeAwaitingRowKey,
    homeBlockKey,
    homeFeedbackKey,
    homeGoalRowKey,
    homeLessonKey,
    homePlanRowKey,
    homeState,
    invitationsMessage,
    isGoalOverdue,
    moreExercisesLabel,
    nextLessonHref,
    nextLessonMeta,
    nextLessonWhen,
    planCountLabel,
    planHref,
    quickActions,
    startPaths,
    updatedLabel,
    visibleBlocks,
    type HomeBlockKind,
} from '../web/home/home-copy';
import { safeReturnTo } from '../web/app/route-guard';
import { isOverdue } from '../web/goals/goal-copy';
import type {
    DashboardAwaitingItem,
    DashboardFeedback,
    DashboardGoalRef,
    DashboardNextLesson,
    DashboardPlanRef,
    DashboardView,
} from '../web/api/dashboard.gen';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

// Importing the app's i18n module is what registers the catalogs; the component
// modules cannot be imported here because `web/theme.ts` writes a <style> at
// import time and there is no DOM in this process. That is why the rules under
// test live in `home-copy.ts` rather than inside `home.component.ts`.
await import('../web/i18n');

// Swedish is the source of truth (UI_DECISIONS §4) and is what these assertions
// are written against. Registering the catalogs does not select a locale.
setLocale('sv');

// ─── Fixtures ───────────────────────────────────────────────────

const NOW = '2026-07-22T12:00:00.000Z';

function view(overrides: Partial<DashboardView> = {}): DashboardView {
    return {
        capabilities: { teaches: false, rides: false },
        nextLesson: null,
        latestFeedback: null,
        awaitingFeedback: [],
        activePlans: [],
        goalsNearingTarget: [],
        pendingInvitations: 0,
        generatedAt: NOW,
        ...overrides,
    };
}

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
    parentKind: 'lesson',
    parentId: 'l1',
    targetKind: 'lesson',
    targetId: 'l1',
    targetLabel: 'Alva Lindgren',
    exerciseName: null,
    authorId: 'u2',
    authorDisplayName: 'Alva Lindgren',
    body: 'Bra tempo i galoppen i dag.',
    createdAt: '2026-07-21T19:32:00.000Z',
};

const AWAITING: DashboardAwaitingItem = {
    kind: 'lesson',
    id: 'l9',
    occurredAt: '2026-07-20T17:00:00.000Z',
    studentDisplayName: 'Nils Berg',
    horseName: 'Rocky',
};

const PLAN: DashboardPlanRef = {
    id: 'p1',
    title: 'Hoppsäsong vår 2026',
    startDate: '2026-03-03',
    endDate: '2026-06-30',
    primaryTeacherDisplayName: 'Alva Lindgren',
};

const GOAL: DashboardGoalRef = { id: 'g1', title: 'Hoppa 1,10', targetDate: '2026-08-01' };

// ─── homeState (IA §3.1 States) ─────────────────────────────────

test('homeState: unresolved is unknown, never an empty state', () => {
    expect(homeState(null, { resolved: false, failed: false })).toBe('unknown');
    expect(homeState(view(), { resolved: false, failed: false })).toBe('unknown');
});

test('homeState: a FAILED fetch is unknown — the regression this function exists to prevent', () => {
    // A failed request that rendered as "you have nothing" would tell a rider
    // their account is blank when the truth is that the answer never arrived.
    // Failure outranks resolution: an Async can be both settled and failed.
    expect(homeState(view(), { resolved: true, failed: true })).toBe('unknown');
    expect(homeState(view({ nextLesson: LESSON }), { resolved: true, failed: true })).toBe('unknown');
});

test('homeState: invited only with a pending invitation and no other content', () => {
    expect(homeState(view({ pendingInvitations: 1 }), { resolved: true, failed: false })).toBe('invited');
    // Any content at all outranks it — the dashboard has something to say.
    expect(
        homeState(view({ pendingInvitations: 1, nextLesson: LESSON }), { resolved: true, failed: false }),
    ).toBe('ready');
    expect(
        homeState(view({ pendingInvitations: 2, goalsNearingTarget: [GOAL] }), { resolved: true, failed: false }),
    ).toBe('ready');
});

test('homeState: fresh only when everything is empty and both capabilities are false', () => {
    expect(homeState(view(), { resolved: true, failed: false })).toBe('fresh');
    // Related to someone but with nothing booked yet is a real, empty dashboard.
    expect(
        homeState(view({ capabilities: { teaches: true, rides: false } }), { resolved: true, failed: false }),
    ).toBe('ready');
    expect(
        homeState(view({ capabilities: { teaches: false, rides: true } }), { resolved: true, failed: false }),
    ).toBe('ready');
    // An invitation outranks fresh — there is a concrete next step to take.
    expect(homeState(view({ pendingInvitations: 1 }), { resolved: true, failed: false })).toBe('invited');
});

test('homeState: every non-invitation field counts as content', () => {
    const contentful: Partial<DashboardView>[] = [
        { nextLesson: LESSON },
        { latestFeedback: FEEDBACK },
        { awaitingFeedback: [AWAITING] },
        { activePlans: [PLAN] },
        { goalsNearingTarget: [GOAL] },
    ];
    for (const overrides of contentful) {
        expect(homeState(view(overrides), { resolved: true, failed: false })).toBe('ready');
    }
});

// ─── visibleBlocks (IA §3.1 priority order, §4.2 cap) ───────────

function kinds(v: DashboardView): HomeBlockKind[] {
    return visibleBlocks(v).map((b) => b.kind);
}

test('visibleBlocks: neither capability, no content — the two core blocks only', () => {
    expect(kinds(view())).toEqual(['nextLesson', 'latestFeedback']);
});

test('visibleBlocks: teacher-only puts awaiting third', () => {
    expect(kinds(view({
        capabilities: { teaches: true, rides: false },
        nextLesson: LESSON,
        awaitingFeedback: [AWAITING],
    }))).toEqual(['nextLesson', 'latestFeedback', 'awaitingFeedback']);
});

test('visibleBlocks: rider-only puts riding third', () => {
    expect(kinds(view({
        capabilities: { teaches: false, rides: true },
        activePlans: [PLAN],
        goalsNearingTarget: [GOAL],
    }))).toEqual(['nextLesson', 'latestFeedback', 'riding']);
});

test('visibleBlocks: both — awaiting precedes riding', () => {
    // A person owing feedback is owed by somebody else, so the debt outranks
    // the reader's own plans on a page that asks "what needs me today?".
    expect(kinds(view({
        capabilities: { teaches: true, rides: true },
        nextLesson: LESSON,
        latestFeedback: FEEDBACK,
        awaitingFeedback: [AWAITING],
        activePlans: [PLAN],
        goalsNearingTarget: [GOAL],
    }))).toEqual(['nextLesson', 'latestFeedback', 'awaitingFeedback', 'riding']);
});

test('visibleBlocks: the fullest payload there is yields exactly the four cards, and no fifth', () => {
    // The four-card cap (§4.2, UI_DECISIONS §6) is structural: one push per
    // `HomeBlockKind`, each guarded once, so the list cannot grow a fifth entry
    // without a new kind and a new push.
    //
    // This assertion used to read `length <= MAX_BLOCKS` against a trailing
    // `.slice(0, 4)`. That asserted NOTHING — the function could not exceed four
    // by construction, so the bound was unreachable and deleting the slice
    // passed the whole suite. Pinning the exact list is the only form of this
    // test that can fail: a fifth push changes it, where a `<=` never would.
    const full = view({
        capabilities: { teaches: true, rides: true },
        nextLesson: LESSON,
        latestFeedback: FEEDBACK,
        awaitingFeedback: [AWAITING, { ...AWAITING, id: 'l10' }],
        activePlans: [PLAN],
        goalsNearingTarget: [GOAL],
        pendingInvitations: 3,
    });
    expect(kinds(full)).toEqual(['nextLesson', 'latestFeedback', 'awaitingFeedback', 'riding']);
    expect(visibleBlocks(full).length).toBe(4);
    expect(new Set(kinds(full)).size).toBe(kinds(full).length);

    // And no payload at all produces a fifth: every combination of the inputs
    // that can add a block is enumerated, and none exceeds four.
    for (const teaches of [false, true]) {
        for (const rides of [false, true]) {
            for (const awaitingFeedback of [[], [AWAITING]]) {
                for (const activePlans of [[], [PLAN]]) {
                    for (const goalsNearingTarget of [[], [GOAL]]) {
                        const blocks = visibleBlocks(view({
                            capabilities: { teaches, rides },
                            nextLesson: LESSON,
                            latestFeedback: FEEDBACK,
                            awaitingFeedback,
                            activePlans,
                            goalsNearingTarget,
                        }));
                        expect(blocks.length).toBeLessThan(5);
                    }
                }
            }
        }
    }
});

test('visibleBlocks: a ZERO-RELATION account that owns plans and goals still gets the Riding block', () => {
    // Contract §2.1 names this by name: `activePlans` and `goalsNearingTarget`
    // are ownership-scoped, so gating the block on `capabilities.rides` would
    // hide a person's own Goals from them.
    const solo = view({
        capabilities: { teaches: false, rides: false },
        activePlans: [PLAN],
        goalsNearingTarget: [GOAL],
    });
    expect(kinds(solo)).toContain('riding');
    const goalsOnly = view({ goalsNearingTarget: [GOAL] });
    expect(kinds(goalsOnly)).toContain('riding');
    const plansOnly = view({ activePlans: [PLAN] });
    expect(kinds(plansOnly)).toContain('riding');
});

test('visibleBlocks: riding is withheld when it has nothing, whatever `rides` says', () => {
    expect(kinds(view({ capabilities: { teaches: false, rides: true } }))).not.toContain('riding');
});

test('visibleBlocks: awaiting renders for a teacher with nothing owed, and never without a teaching relation', () => {
    // With a teaching relation "Du har svarat på allt" is a real answer.
    expect(kinds(view({ capabilities: { teaches: true, rides: false } }))).toContain('awaitingFeedback');
    // Without one the block has no possible subject — awaitingFeedback is only
    // ever populated from the teaching side (contract §3.4).
    expect(kinds(view({ capabilities: { teaches: false, rides: true } }))).not.toContain('awaitingFeedback');
});

test('visibleBlocks: the first two blocks always render, so their empty copy has somewhere to live', () => {
    const blocks = visibleBlocks(view());
    expect(blocks[0]).toEqual({ kind: 'nextLesson', lesson: null });
    expect(blocks[1]).toEqual({ kind: 'latestFeedback', feedback: null });
});

test('every block title key is translated in both catalogs', () => {
    for (const kind of ['nextLesson', 'latestFeedback', 'awaitingFeedback', 'riding'] as const) {
        const key = blockTitleKey(kind);
        expect(sv[key as keyof typeof sv], `sv is missing ${key}`).toBeDefined();
        expect(en[key as keyof typeof en], `en is missing ${key}`).toBeDefined();
    }
});

// ─── quickActions (contract §2.1) ───────────────────────────────

const CAPABILITY_MATRIX = [
    { teaches: false, rides: false },
    { teaches: false, rides: true },
    { teaches: true, rides: false },
    { teaches: true, rides: true },
];

test('quickActions: Logga pass is present for EVERY capability combination', () => {
    // `TrainingSessionService.create` requires no Relation, so hiding it from a
    // brand-new account would hide the one thing that account can do.
    for (const capabilities of CAPABILITY_MATRIX) {
        expect(quickActions(capabilities).map((a) => a.kind)).toContain('logSession');
    }
});

test('quickActions: Boka lektion is present iff `teaches` — the only capability gate', () => {
    for (const capabilities of CAPABILITY_MATRIX) {
        const has = quickActions(capabilities).some((a) => a.kind === 'bookLesson');
        expect(has).toBe(capabilities.teaches);
    }
});

test('quickActions: Logga pass leads, and every label key exists in both catalogs', () => {
    for (const capabilities of CAPABILITY_MATRIX) {
        const actions = quickActions(capabilities);
        expect(actions[0]!.kind).toBe('logSession');
        for (const action of actions) {
            expect(sv[action.labelKey as keyof typeof sv]).toBeDefined();
            expect(en[action.labelKey as keyof typeof en]).toBeDefined();
        }
    }
});

// ─── Hrefs, held inside route-guard's single enumeration ────────

test('feedbackHref: every targetKind produces its Swedish route', () => {
    expect(feedbackHref({ targetKind: 'lesson', targetId: 'l1' })).toBe('/lektioner/l1');
    expect(feedbackHref({ targetKind: 'training_session', targetId: 's1' })).toBe('/traningspass/s1');
    expect(feedbackHref({ targetKind: 'goal', targetId: 'g1' })).toBe('/mal/g1');
});

test('feedbackHref switches on targetKind, not parentKind — junctions have no route', () => {
    // A `lesson_exercise` note links to its owning Lesson. Routing on
    // `parentKind` would produce `/lesson_exercise/...`, which is not a route.
    const onLessonExercise: DashboardFeedback = {
        ...FEEDBACK,
        parentKind: 'lesson_exercise',
        parentId: 'le1',
        exerciseName: 'Volt',
    };
    expect(feedbackHref(onLessonExercise)).toBe('/lektioner/l1');
    const onSessionExercise: DashboardFeedback = {
        ...FEEDBACK,
        parentKind: 'training_session_exercise',
        parentId: 'tse1',
        targetKind: 'training_session',
        targetId: 's1',
        exerciseName: 'Volt',
    };
    expect(feedbackHref(onSessionExercise)).toBe('/traningspass/s1');
});

test('every href this module can produce is admitted by route-guard.APP_ROUTES', () => {
    // `safeReturnTo` validates against the app's single route enumeration. A
    // route invented here rather than reused would fail this assertion rather
    // than becoming quietly un-returnable-to.
    const hrefs = [
        nextLessonHref('l1'),
        planHref('p1'),
        goalHref('g1'),
        feedbackHref({ targetKind: 'lesson', targetId: 'l1' }),
        feedbackHref({ targetKind: 'training_session', targetId: 's1' }),
        feedbackHref({ targetKind: 'goal', targetId: 'g1' }),
        awaitingHref({ kind: 'lesson', id: 'l9' }),
        awaitingHref({ kind: 'training_session', id: 's9' }),
        LESSONS_HREF,
        INBOX_HREF,
        ...CAPABILITY_MATRIX.flatMap((c) => quickActions(c).map((a) => a.href)),
        ...startPaths().flatMap((p) => [p.href, ...(p.secondary ? [p.secondary.href] : [])]),
    ];
    for (const href of hrefs) {
        expect(safeReturnTo(href), `${href} is outside APP_ROUTES`).toBe(href);
    }
});

// ─── feedbackContext (all five parentKind values) ───────────────

test('feedbackContext: all five parent kinds, junctions naming the exercise', () => {
    const base = { targetLabel: 'Alva Lindgren', exerciseName: null } as const;
    expect(feedbackContext({ ...base, parentKind: 'lesson' })).toBe('På lektionen med Alva Lindgren');
    expect(feedbackContext({ ...base, parentKind: 'lesson_exercise', exerciseName: 'Volt' }))
        .toBe('På övningen Volt i lektionen med Alva Lindgren');
    expect(feedbackContext({ ...base, parentKind: 'training_session' })).toBe('På träningspasset');
    expect(feedbackContext({ ...base, parentKind: 'training_session_exercise', exerciseName: 'Volt' }))
        .toBe('På övningen Volt i träningspasset');
    expect(feedbackContext({ ...base, parentKind: 'goal', targetLabel: 'Hoppa 1,10' }))
        .toBe('På målet Hoppa 1,10');
});

test('feedbackContext: a junction note with no exercise name falls back, never a dangling preposition', () => {
    const context = feedbackContext({
        parentKind: 'lesson_exercise',
        targetLabel: 'Alva Lindgren',
        exerciseName: null,
    });
    expect(context).toBe('På lektionen med Alva Lindgren');
    expect(context).not.toContain('övningen  ');
    expect(feedbackContext({
        parentKind: 'training_session_exercise',
        targetLabel: 'Nils Berg',
        exerciseName: null,
    })).toBe('På träningspasset');
});

test('feedbackContext never renders a raw i18n key', () => {
    for (const parentKind of ['lesson', 'lesson_exercise', 'training_session', 'training_session_exercise', 'goal'] as const) {
        const line = feedbackContext({ parentKind, targetLabel: 'X', exerciseName: 'Y' });
        expect(line.startsWith('home.')).toBe(false);
        expect(line.length).toBeGreaterThan(0);
    }
});

// ─── Feedback presentation (contract §2.2 — no read-state) ──────

test('the feedback block says "Senaste", never "Ny"', () => {
    // There is no read-state anywhere in the schema, so copy implying one would
    // be a claim the data cannot support.
    expect(sv['home.feedback']).toBe('Senaste återkoppling');
    expect(sv['home.feedback']).not.toContain('Ny ');
    expect(en['home.feedback']).toBe('Latest feedback');
});

test('feedbackByline uses the injected instant, not the clock', () => {
    expect(feedbackByline(FEEDBACK, NOW)).toBe('Alva Lindgren · i går');
    // Same note, a different frozen "now": the phrase moves with the parameter.
    expect(feedbackByline(FEEDBACK, '2026-07-21T20:00:00.000Z')).toContain('Alva Lindgren · ');
    expect(feedbackByline(FEEDBACK, '2026-07-21T20:00:00.000Z')).not.toContain('i går');
});

test('feedbackExcerpt delegates to the existing excerpt rule', () => {
    expect(feedbackExcerpt(null)).toBeNull();
    expect(feedbackExcerpt('   ')).toBeNull();
    expect(feedbackExcerpt('Bra   tempo\ni galoppen.')).toBe('Bra tempo i galoppen.');
    const long = 'ord '.repeat(60).trim();
    const excerpt = feedbackExcerpt(long)!;
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(111);
});

// ─── Next lesson ────────────────────────────────────────────────

test('nextLesson: meta drops absent optional facts rather than naming them', () => {
    expect(nextLessonMeta(LESSON)).toBe('Alva Lindgren · Luna · Hoppsäsong vår 2026');
    expect(nextLessonMeta({ ...LESSON, horseName: null, planTitle: null })).toBe('Alva Lindgren');
});

test('nextLesson: the when-phrase is lesson-copy\'s, not a second formatter', () => {
    expect(nextLessonWhen(LESSON)).toBe('Onsdag 22 juli · 17:00');
});

test('moreExercisesLabel: plural forms, and null when the preview is the whole list', () => {
    expect(moreExercisesLabel({ exercisePreview: ['a', 'b', 'c'], exerciseCount: 5 })).toBe('+2 övningar till');
    expect(moreExercisesLabel({ exercisePreview: ['a', 'b', 'c'], exerciseCount: 4 })).toBe('+1 övning till');
    expect(moreExercisesLabel({ exercisePreview: ['a', 'b', 'c'], exerciseCount: 3 })).toBeNull();
    expect(moreExercisesLabel({ exercisePreview: [], exerciseCount: 0 })).toBeNull();
});

// ─── Awaiting feedback ──────────────────────────────────────────

test('awaiting: label and href follow the occasion kind', () => {
    expect(awaitingLabel(AWAITING)).toBe('Lektion med Nils Berg');
    expect(awaitingLabel({ kind: 'training_session', studentDisplayName: 'Nils Berg' }))
        .toBe('Träningspass · Nils Berg');
    expect(awaitingHref(AWAITING)).toBe('/lektioner/l9');
    expect(awaitingHref({ kind: 'training_session', id: 's9' })).toBe('/traningspass/s9');
});

test('awaiting: each kind gets its own occasion vocabulary', () => {
    expect(awaitingWhen(AWAITING)).toBe('Måndag 20 juli · 17:00');
    expect(awaitingWhen({ kind: 'training_session', occurredAt: '2026-07-20T17:00:00.000Z' }))
        .toBe('Måndag 20 juli · 17:00');
});

test('awaitingCountLabel: plural forms, counting the bounded list only', () => {
    expect(awaitingCountLabel([AWAITING])).toBe('1 tillfälle');
    expect(awaitingCountLabel([AWAITING, AWAITING])).toBe('2 tillfällen');
});

// ─── Riding block: overdue derivation ───────────────────────────

test('isGoalOverdue is computed against the injected todayIso', () => {
    const goal = { targetDate: '2026-07-20' };
    expect(isGoalOverdue(goal, '2026-07-22')).toBe(true);
    expect(isGoalOverdue(goal, '2026-07-20')).toBe(false); // the day itself is not late
    expect(isGoalOverdue(goal, '2026-07-19')).toBe(false);
    expect(goalOverdueLabel(goal, '2026-07-22')).toBe('Datum passerat');
    expect(goalOverdueLabel(goal, '2026-07-19')).toBeNull();
});

test('an achieved goal is never overdue — guaranteed twice', () => {
    // The 047 filter returns only `active` goals, and `goal-copy.isOverdue`
    // refuses a non-active goal independently. Both are asserted so removing
    // either is a test failure rather than a silent regression.
    expect(isOverdue({ status: 'achieved', targetDate: '2026-01-01' }, '2026-07-22')).toBe(false);
    expect(isOverdue({ status: 'abandoned', targetDate: '2026-01-01' }, '2026-07-22')).toBe(false);
    expect(isOverdue({ status: 'active', targetDate: '2026-01-01' }, '2026-07-22')).toBe(true);
});

test('goalTargetLabel reuses goal-copy rather than formatting a second time', () => {
    expect(goalTargetLabel(GOAL)).toBe('Måldatum 1 augusti 2026');
    expect(goalTargetLabel({ targetDate: 'not-a-date' })).toBeNull();
});

test('planCountLabel: plural forms', () => {
    expect(planCountLabel([])).toBe('0 aktiva planer');
    expect(planCountLabel([PLAN])).toBe('1 aktiv plan');
    expect(planCountLabel([PLAN, PLAN])).toBe('2 aktiva planer');
});

// ─── Invitations and the two zero-state paths ───────────────────

test('invitationsMessage: singular does not print the number, plural does', () => {
    expect(invitationsMessage(1)).toBe('Du har en inbjudan som väntar.');
    expect(invitationsMessage(3)).toBe('Du har 3 inbjudningar som väntar.');
});

test('startPaths: two paths at equal weight, neither capability-gated', () => {
    const paths = startPaths();
    expect(paths.map((p) => p.key)).toEqual(['teach', 'ride']);
    // Equal weight means the same shape: one title, one body, one action each.
    for (const path of paths) {
        for (const key of [path.titleKey, path.bodyKey, path.actionKey]) {
            expect(sv[key as keyof typeof sv], `sv is missing ${key}`).toBeDefined();
            expect(en[key as keyof typeof en], `en is missing ${key}`).toBeDefined();
        }
    }
    expect(paths[0]!.href).toBe('/students');
    expect(paths[1]!.href).toBe('/hastar');
    // The third link is deliberately a lower tier, so the two paths stay equal.
    expect(paths[0]!.secondary).toBeUndefined();
    expect(paths[1]!.secondary).toEqual({ actionKey: 'home.start.ride.goal', href: '/mal/nytt' });
    // `startPaths` takes no arguments — there is nothing it may vary on.
    expect(startPaths.length).toBe(0);
});

test('startPaths: the two empty-state bodies stay within the one-sentence budget', () => {
    for (const path of startPaths()) {
        const body = sv[path.bodyKey as keyof typeof sv] as string;
        expect(body.split('.').filter((s) => s.trim().length > 0).length).toBe(1);
    }
});

// ─── generatedAt is not the page's clock ────────────────────────

test('updatedLabel reports the payload age from the server clock against the client instant', () => {
    expect(updatedLabel('2026-07-21T19:32:00.000Z', NOW)).toBe('Uppdaterad i går');
    expect(updatedLabel(NOW, NOW)).toBe('Uppdaterad nu');
});

// ─── Row keys ───────────────────────────────────────────────────

test('row keys change when any rendered field changes', () => {
    expect(homeLessonKey(LESSON)).not.toBe(homeLessonKey({ ...LESSON, horseName: 'Rocky' }));
    expect(homeLessonKey(LESSON)).not.toBe(homeLessonKey({ ...LESSON, exerciseCount: 6 }));
    expect(homeLessonKey(LESSON)).not.toBe(homeLessonKey({ ...LESSON, exercisePreview: ['Volt'] }));

    expect(homeAwaitingRowKey(AWAITING)).not.toBe(homeAwaitingRowKey({ ...AWAITING, horseName: null }));
    expect(homeAwaitingRowKey(AWAITING)).not.toBe(homeAwaitingRowKey({ ...AWAITING, kind: 'training_session' }));

    expect(homePlanRowKey(PLAN)).not.toBe(homePlanRowKey({ ...PLAN, endDate: null }));
    expect(homePlanRowKey(PLAN)).not.toBe(homePlanRowKey({ ...PLAN, primaryTeacherDisplayName: null }));

    // The date drives both the target label and the derived overdue marker.
    expect(homeGoalRowKey(GOAL)).not.toBe(homeGoalRowKey({ ...GOAL, targetDate: '2026-01-01' }));
    expect(homeGoalRowKey(GOAL)).not.toBe(homeGoalRowKey({ ...GOAL, title: 'Hoppa 1,20' }));
    expect(homeGoalRowKey(GOAL)).toBe(homeGoalRowKey({ ...GOAL }));
});

test('homeBlockKey changes when the block\'s contents change', () => {
    const a = view({ capabilities: { teaches: true, rides: true }, nextLesson: LESSON, activePlans: [PLAN], goalsNearingTarget: [GOAL] });
    const b = view({ capabilities: { teaches: true, rides: true }, nextLesson: { ...LESSON, horseName: 'Rocky' }, activePlans: [PLAN], goalsNearingTarget: [GOAL] });
    expect(visibleBlocks(a).map(homeBlockKey)).not.toEqual(visibleBlocks(b).map(homeBlockKey));
    expect(visibleBlocks(a).map(homeBlockKey)).toEqual(visibleBlocks(view({
        capabilities: { teaches: true, rides: true }, nextLesson: LESSON, activePlans: [PLAN], goalsNearingTarget: [GOAL],
    })).map(homeBlockKey));
    // Keys are unique within one render, or $each would collapse two cards.
    const keys = visibleBlocks(a).map(homeBlockKey);
    expect(new Set(keys).size).toBe(keys.length);
});

// ─── i18n ───────────────────────────────────────────────────────

test('every home.* key exists in both catalogs and none is blank', () => {
    const svKeys = Object.keys(sv).filter((k) => k.startsWith('home.'));
    expect(svKeys.length).toBeGreaterThan(0);
    for (const key of svKeys) {
        expect(en[key as keyof typeof en], `en is missing ${key}`).toBeDefined();
        expect((sv[key as keyof typeof sv] as string).trim().length).toBeGreaterThan(0);
        expect((en[key as keyof typeof en] as string).trim().length).toBeGreaterThan(0);
    }
    expect(Object.keys(en).filter((k) => k.startsWith('home.')).length).toBe(svKeys.length);
});

test('home.* carries no greeting by display name — the session exposes only an email', () => {
    // IA §3.1 permits a named greeting "only after the authenticated-session
    // contract exposes it reliably", and `AuthUser` is `{ id, username }` where
    // username IS the email. Greeting by email is worse than not greeting.
    for (const key of Object.keys(sv).filter((k) => k.startsWith('home.'))) {
        const value = sv[key as keyof typeof sv] as string;
        expect(value, `${key} interpolates an account name`).not.toContain('{user}');
        expect(value, `${key} interpolates an email`).not.toContain('{email}');
    }
    expect(sv['home.title']).toBe('Hem');
});

test('every plural key used by this module has both CLDR forms in both catalogs', () => {
    for (const base of [
        'home.nextLesson.exercises.more',
        'home.awaiting.count',
        'home.plans.count',
        'home.invitations',
    ]) {
        for (const catalog of [sv, en]) {
            expect(catalog[`${base}.one` as keyof typeof catalog]).toBeDefined();
            expect(catalog[`${base}.other` as keyof typeof catalog]).toBeDefined();
        }
    }
});
