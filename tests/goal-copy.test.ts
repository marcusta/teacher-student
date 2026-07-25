import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    achievedLabel,
    attachablePlans,
    calendarDate,
    descriptionExcerpt,
    goalControls,
    goalRowKey,
    goalStatusPill,
    goalTransitions,
    groupGoals,
    horseChoices,
    isConflict,
    isOverdue,
    ownerRecipients,
    planMembership,
    selectableHorses,
    shouldCommitPlanLink,
    shouldCommitShare,
    targetDateLabel,
    type GoalStatus,
} from '../web/goals/goal-copy';
import { shareLabel } from '../web/ui/copy';

// Importing the app's i18n module is what registers the catalogs; the component
// modules themselves cannot be imported here because `web/theme.ts` writes a
// <style> at import time and there is no DOM in this process. That is why the
// rules under test live in `goal-copy.ts` rather than inside the components.
await import('../web/i18n');

// Swedish is the source of truth (UI_DECISIONS §4), and it is what these
// assertions are written against. Registering the catalogs does not select a
// locale — that would otherwise come from the host environment, so the same
// assertions would pass or fail depending on whose machine ran them.
setLocale('sv');

function goal(over: Partial<{
    id: string;
    title: string;
    status: GoalStatus;
    targetDate: string | null;
    description: string | null;
    planIds: string[];
    sharedTeacherIds: string[];
}> = {}) {
    return {
        id: 'g1',
        title: 'Fungerande galoppombyten',
        status: 'active' as GoalStatus,
        targetDate: null as string | null,
        description: null as string | null,
        planIds: [] as string[],
        sharedTeacherIds: [] as string[],
        ...over,
    };
}

// ─── The role matrix (IA §3.14) ─────────────────────────────────

test('owner holds every lever', () => {
    expect(goalControls('owner')).toEqual({
        editDetails: true,
        manageSharing: true,
        managePlans: true,
        seeCoWatchers: true,
        notes: true,
    });
});

test('shared teacher gets notes and nothing else', () => {
    const controls = goalControls('sharedTeacher');
    expect(controls.notes).toBe(true);
    expect(controls.editDetails).toBe(false);
    expect(controls.manageSharing).toBe(false);
    expect(controls.managePlans).toBe(false);
});

test('a shared teacher never sees co-watchers — the privacy rule, not a permission', () => {
    expect(goalControls('sharedTeacher').seeCoWatchers).toBe(false);
    expect(goalControls('owner').seeCoWatchers).toBe(true);
});

// ─── Status transitions (IA §3.14 state rules) ──────────────────

test('abandoned cannot go directly to achieved — reopen is offered instead', () => {
    const owner = goalTransitions('abandoned', 'owner');
    expect(owner.achieve).toBe(false);
    expect(owner.reopen).toBe(true);

    const teacher = goalTransitions('abandoned', 'sharedTeacher');
    expect(teacher.achieve).toBe(false);
    expect(teacher.reopen).toBe(true);
});

test('achieve is offered only from active, for both roles', () => {
    expect(goalTransitions('active', 'owner').achieve).toBe(true);
    expect(goalTransitions('active', 'sharedTeacher').achieve).toBe(true);
    // Idempotent on the server, so offering it here would be a button that
    // does nothing.
    expect(goalTransitions('achieved', 'owner').achieve).toBe(false);
    expect(goalTransitions('achieved', 'sharedTeacher').achieve).toBe(false);
});

test('reopen is offered from every non-active status, for both roles', () => {
    for (const viewer of ['owner', 'sharedTeacher'] as const) {
        expect(goalTransitions('active', viewer).reopen).toBe(false);
        expect(goalTransitions('achieved', viewer).reopen).toBe(true);
        expect(goalTransitions('abandoned', viewer).reopen).toBe(true);
    }
});

test('only the owner may abandon, and never twice', () => {
    expect(goalTransitions('active', 'owner').abandon).toBe(true);
    expect(goalTransitions('achieved', 'owner').abandon).toBe(true);
    expect(goalTransitions('abandoned', 'owner').abandon).toBe(false);

    for (const status of ['active', 'achieved', 'abandoned'] as const) {
        expect(goalTransitions(status, 'sharedTeacher').abandon).toBe(false);
    }
});

test('conflicts are detected by code, never by message text', () => {
    expect(isConflict({ code: 'conflict' })).toBe(true);
    expect(isConflict({ code: 'server' })).toBe(false);
    expect(isConflict(null)).toBe(false);
    expect(isConflict(undefined)).toBe(false);
});

// ─── Status presentation (§4.4) ─────────────────────────────────

test('the shape grammar survives colour removal', () => {
    // `label` is a thunk, so it is resolved rather than compared — see
    // `StatusDescriptor`. The thunk is the whole reason a pill in an `$each`
    // row survives a locale switch.
    expect(goalStatusPill('active').label()).toBe('Aktiv');
    expect(goalStatusPill('active')).toMatchObject({ variant: 'outline' });
    expect(goalStatusPill('achieved').label()).toBe('Uppnådd');
    expect(goalStatusPill('achieved')).toMatchObject({ variant: 'filled' });
    expect(goalStatusPill('abandoned').label()).toBe('Avbruten');
    expect(goalStatusPill('abandoned')).toMatchObject({ variant: 'dashed', glyph: '✕' });
    // Three distinct silhouettes — the whole point of the grammar.
    const variants = (['active', 'achieved', 'abandoned'] as const).map((s) => goalStatusPill(s).variant);
    expect(new Set(variants).size).toBe(3);
});

test('brass is never a status tone', () => {
    for (const status of ['active', 'achieved', 'abandoned'] as const) {
        expect(['neutral', 'success', 'warning', 'danger', 'info'])
            .toContain(goalStatusPill(status).tone);
    }
});

// ─── Calendar dates ─────────────────────────────────────────────

test('a calendar date is read in the reader\'s own day, not as UTC midnight', () => {
    const date = calendarDate('2026-09-01');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(8);
    expect(date!.getDate()).toBe(1);
});

test('malformed and impossible dates resolve to null rather than Invalid Date', () => {
    expect(calendarDate(null)).toBeNull();
    expect(calendarDate('')).toBeNull();
    expect(calendarDate('2026-9-1')).toBeNull();
    expect(calendarDate('inte ett datum')).toBeNull();
    expect(calendarDate('2026-02-30')).toBeNull();
    expect(calendarDate('2026-13-01')).toBeNull();
});

test('target and achieved labels omit themselves when there is nothing to say', () => {
    expect(targetDateLabel(null)).toBeNull();
    expect(targetDateLabel('2026-09-01')).toBe('Måldatum 1 september 2026');
    expect(achievedLabel(null)).toBeNull();
    expect(achievedLabel('not-a-timestamp')).toBeNull();
    expect(achievedLabel('2026-07-14T09:00:00.000Z')).toContain('Uppnått');
});

// ─── Overdue is metadata, not a status (IA §3.13) ───────────────

test('an active goal past its target date is overdue', () => {
    expect(isOverdue(goal({ targetDate: '2026-07-01' }), '2026-07-19')).toBe(true);
});

test('the boundary is exclusive — today is not yet overdue', () => {
    expect(isOverdue(goal({ targetDate: '2026-07-19' }), '2026-07-19')).toBe(false);
    expect(isOverdue(goal({ targetDate: '2026-07-20' }), '2026-07-19')).toBe(false);
});

test('only an ACTIVE goal can be overdue', () => {
    const past = { targetDate: '2026-07-01' };
    expect(isOverdue(goal({ ...past, status: 'achieved' }), '2026-07-19')).toBe(false);
    expect(isOverdue(goal({ ...past, status: 'abandoned' }), '2026-07-19')).toBe(false);
});

test('no target date means never overdue', () => {
    expect(isOverdue(goal({ targetDate: null }), '2026-07-19')).toBe(false);
});

test('overdue never becomes a fourth status pill', () => {
    // The pill function takes a GoalStatus and nothing else, so an overdue goal
    // is rendered by the ACTIVE pill. This asserts the two are independent.
    const overdue = goal({ targetDate: '2020-01-01' });
    expect(isOverdue(overdue, '2026-07-19')).toBe(true);
    expect(goalStatusPill(overdue.status).label()).toBe('Aktiv');
});

// ─── Grouping (IA §3.13) ────────────────────────────────────────

test('goals partition into Aktiva, Uppnådda and Avbrutna', () => {
    const items = [
        goal({ id: 'a', status: 'active' }),
        goal({ id: 'b', status: 'achieved' }),
        goal({ id: 'c', status: 'abandoned' }),
        goal({ id: 'd', status: 'active' }),
    ];
    const groups = groupGoals(items);
    expect(groups.active.map((g) => g.id)).toEqual(['a', 'd']);
    expect(groups.achieved.map((g) => g.id)).toEqual(['b']);
    expect(groups.abandoned.map((g) => g.id)).toEqual(['c']);
});

test('grouping preserves the server\'s order inside each group', () => {
    const items = [
        goal({ id: 'newest', status: 'active' }),
        goal({ id: 'older', status: 'active' }),
        goal({ id: 'oldest', status: 'active' }),
    ];
    expect(groupGoals(items).active.map((g) => g.id)).toEqual(['newest', 'older', 'oldest']);
});

// ─── Row content ────────────────────────────────────────────────

test('a description excerpt collapses whitespace and cuts at a word boundary', () => {
    expect(descriptionExcerpt(null)).toBeNull();
    expect(descriptionExcerpt('   ')).toBeNull();
    expect(descriptionExcerpt('Rakt\n  och  jämnt')).toBe('Rakt och jämnt');
    const long = 'ord '.repeat(40);
    const cut = descriptionExcerpt(long)!;
    expect(cut.endsWith('…')).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(91);
});

test('plan membership names its plans and folds the tail into +N', () => {
    const plans = [
        { id: 'p1', title: 'Hoppsäsong vår' },
        { id: 'p2', title: 'Dressyrgrund' },
        { id: 'p3', title: 'Uteritt' },
    ];
    expect(planMembership([], plans)).toBeNull();
    expect(planMembership(['p1'], plans)).toBe('Plan: Hoppsäsong vår');
    expect(planMembership(['p1', 'p2'], plans)).toBe('Planer: Hoppsäsong vår, Dressyrgrund');
    expect(planMembership(['p1', 'p2', 'p3'], plans)).toBe('Planer: Hoppsäsong vår, Dressyrgrund +1');
});

test('an unresolvable plan is still counted, never dropped from the total', () => {
    const plans = [{ id: 'p1', title: 'Hoppsäsong vår' }];
    // p2 has no title yet (the plan list is still loading, or the plan has gone).
    expect(planMembership(['p1', 'p2'], plans)).toBe('Planer: Hoppsäsong vår +1');
    // Nothing nameable at all: say how many, never print an id.
    const summary = planMembership(['p1', 'p2'], [])!;
    expect(summary).toBe('I 2 planer');
    expect(summary).not.toContain('p1');
});

test('the row key covers every field the row paints', () => {
    const base = goal({ planIds: ['p1'], sharedTeacherIds: ['t1'] });
    expect(goalRowKey(base)).toBe(goalRowKey(goal({ planIds: ['p1'], sharedTeacherIds: ['t1'] })));
    // Junction-table changes do not move `updatedAt`, so the key must carry them.
    expect(goalRowKey(base)).not.toBe(goalRowKey({ ...base, planIds: ['p1', 'p2'] }));
    expect(goalRowKey(base)).not.toBe(goalRowKey({ ...base, sharedTeacherIds: [] }));
    expect(goalRowKey(base)).not.toBe(goalRowKey({ ...base, status: 'achieved' }));
    expect(goalRowKey(base)).not.toBe(goalRowKey({ ...base, targetDate: '2026-09-01' }));
});

test('the row key is insensitive to the order ids arrive in', () => {
    const a = goal({ planIds: ['p1', 'p2'], sharedTeacherIds: ['t1', 't2'] });
    const b = goal({ planIds: ['p2', 'p1'], sharedTeacherIds: ['t2', 't1'] });
    expect(goalRowKey(a)).toBe(goalRowKey(b));
});

// ─── Sharing (§4.5) ─────────────────────────────────────────────

test('recipients are resolved to names, and an unresolved one still counts', () => {
    const teachers = [{ id: 't1', displayName: 'Alva' }, { id: 't2', displayName: 'Björn' }];
    expect(ownerRecipients(['t1'], teachers)).toEqual([{ id: 't1', name: 'Alva' }]);
    // A Relation removed since sharing: kept as an unnamed entry so the chip
    // never understates the audience.
    expect(ownerRecipients(['t1', 'gone'], teachers)).toEqual([
        { id: 't1', name: 'Alva' },
        { id: 'gone', name: '' },
    ]);
});

test('the chip never renders a bare "Delad"', () => {
    const teachers = [{ id: 't1', displayName: 'Alva' }];
    expect(shareLabel(ownerRecipients([], teachers))).toBe('Privat');
    expect(shareLabel(ownerRecipients(['t1'], teachers))).toBe('Delad: Alva');
    expect(shareLabel(ownerRecipients(['t1', 'gone'], teachers))).toBe('Delad: Alva +1');
    // Nothing nameable: the explicit degraded label, never an empty name.
    expect(shareLabel(ownerRecipients(['gone'], teachers))).toBe('Delad: okänd mottagare');
});

// ─── Write predicates ───────────────────────────────────────────

test('sharing never writes before the server\'s value is seeded', () => {
    // This is the Träningspass bug, asserted: an un-seeded empty `stored`
    // against a shared goal must not be read as "unshare everyone".
    expect(shouldCommitShare({ seeded: false, teacherId: 't1', next: false, stored: [] })).toBe(false);
    expect(shouldCommitShare({ seeded: false, teacherId: 't1', next: true, stored: [] })).toBe(false);
});

test('sharing writes only on an actual difference from the server', () => {
    expect(shouldCommitShare({ seeded: true, teacherId: 't1', next: true, stored: [] })).toBe(true);
    expect(shouldCommitShare({ seeded: true, teacherId: 't1', next: false, stored: ['t1'] })).toBe(true);
    // Redundant writes would succeed silently — both endpoints are idempotent —
    // which is exactly what let the previous bug survive review.
    expect(shouldCommitShare({ seeded: true, teacherId: 't1', next: true, stored: ['t1'] })).toBe(false);
    expect(shouldCommitShare({ seeded: true, teacherId: 't1', next: false, stored: [] })).toBe(false);
});

test('plan attachment carries the same two guards', () => {
    expect(shouldCommitPlanLink({ seeded: false, planId: 'p1', next: true, stored: [] })).toBe(false);
    expect(shouldCommitPlanLink({ seeded: true, planId: 'p1', next: true, stored: [] })).toBe(true);
    expect(shouldCommitPlanLink({ seeded: true, planId: 'p1', next: true, stored: ['p1'] })).toBe(false);
    expect(shouldCommitPlanLink({ seeded: true, planId: 'p1', next: false, stored: ['p1'] })).toBe(true);
});

// ─── Plan attachment (IA §3.14) ─────────────────────────────────

test('only active, unlinked plans are offered', () => {
    const plans = [
        { id: 'p1', title: 'Vår', status: 'active' as const },
        { id: 'p2', title: 'Höst', status: 'active' as const },
        { id: 'p3', title: 'Förra året', status: 'archived' as const },
    ];
    // The server refuses an archived plan (`attachToPlan` → NotFoundError), so
    // offering it would only produce a failure the picker could have prevented.
    expect(attachablePlans(plans, []).map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(attachablePlans(plans, ['p1']).map((p) => p.id)).toEqual(['p2']);
    expect(attachablePlans(plans, ['p1', 'p2'])).toEqual([]);
});

// ─── Horse ──────────────────────────────────────────────────────

const SAGA = { id: 'h1', name: 'Saga', archivedAt: null };
const NEMO = { id: 'h2', name: 'Nemo', archivedAt: '2026-01-01T00:00:00.000Z' };

test('only unarchived horses are offered', () => {
    // `assertOwnUnarchivedHorse` refuses an archived horse, so offering one
    // could only produce a failure the picker could have prevented.
    expect(selectableHorses([SAGA, NEMO]).map((h) => h.id)).toEqual(['h1']);
});

test('the goal keeps showing its own horse after that horse is archived', () => {
    const choices = horseChoices([SAGA, NEMO], { horseId: 'h2', horseName: 'Nemo' });
    expect(choices).toEqual([
        { id: 'h1', name: 'Saga' },
        { id: 'h2', name: 'Nemo' },
    ]);
});

test('a horse already in the stable is not offered twice', () => {
    const choices = horseChoices([SAGA], { horseId: 'h1', horseName: 'Saga' });
    expect(choices).toEqual([{ id: 'h1', name: 'Saga' }]);
});

test('a horseless goal is offered the stable and nothing more', () => {
    expect(horseChoices([SAGA], { horseId: null, horseName: null }))
        .toEqual([{ id: 'h1', name: 'Saga' }]);
});

// ─── Locale ─────────────────────────────────────────────────────

test('English renders the same rules without falling back to Swedish', () => {
    setLocale('en');
    try {
        expect(goalStatusPill('achieved').label()).toBe('Achieved');
        expect(targetDateLabel('2026-09-01')).toBe('Target date September 1, 2026');
        expect(planMembership(['p1'], [{ id: 'p1', title: 'Spring' }])).toBe('Plan: Spring');
    } finally {
        setLocale('sv');
    }
});
