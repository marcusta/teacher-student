import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    attachableGoals,
    dateBlock,
    dateRangeLabel,
    descriptionExcerpt,
    goalsEmptyKey,
    groupLinkedLessons,
    groupPlans,
    isValidRange,
    lessonMeta,
    linkedGoalIds,
    occasionWhen,
    planControls,
    planRowKey,
    planStatusPill,
    primaryTeacherLabel,
    sessionMeta,
    sortLinkedSessions,
    type PlanStatus,
} from '../web/plans/plan-copy';
import { goalStatusPill } from '../web/goals/goal-copy';

// See tests/goal-copy.test.ts for why the rules under test live outside the
// component modules: `web/theme.ts` writes a <style> at import time and there
// is no DOM in this process.
await import('../web/i18n');

// Swedish is the source of truth (UI_DECISIONS §4).
setLocale('sv');

function plan(over: Partial<{
    id: string;
    title: string;
    status: PlanStatus;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    primaryTeacherDisplayName: string | null;
}> = {}) {
    return {
        id: 'p1',
        title: 'Hoppsäsong vår 2026',
        status: 'active' as PlanStatus,
        startDate: null as string | null,
        endDate: null as string | null,
        description: null as string | null,
        primaryTeacherDisplayName: null as string | null,
        ...over,
    };
}

// ─── The role matrix (IA §3.12) ─────────────────────────────────

test('the owner of an active plan holds every lever', () => {
    expect(planControls('owner', 'active')).toEqual({
        editDetails: true,
        attachGoals: true,
        detachGoals: true,
        archive: true,
    });
});

test('a connected teacher reads and navigates — nothing else', () => {
    for (const status of ['active', 'archived'] as const) {
        expect(planControls('connectedTeacher', status)).toEqual({
            editDetails: false,
            attachGoals: false,
            detachGoals: false,
            archive: false,
        });
    }
});

test('an archived plan rejects new links but does not trap the ones it has', () => {
    const archived = planControls('owner', 'archived');
    // IA §3.11: archived plans "stay readable but reject new links", and
    // `attachToPlan` throws NotFoundError for a non-active plan.
    expect(archived.attachGoals).toBe(false);
    // `detachFromPlan` checks Goal ownership only — untangling must survive.
    expect(archived.detachGoals).toBe(true);
    // Archive is idempotent server-side, so offering it again does nothing.
    expect(archived.archive).toBe(false);
    // A soft delete is not a freeze: a typo in the title stays correctable.
    expect(archived.editDetails).toBe(true);
});

test('PlanControls has no flag for detaching occasions', () => {
    // IA §3.12 defers that to a product decision, so there must be nothing to
    // switch on by accident.
    expect(Object.keys(planControls('owner', 'active')).sort())
        .toEqual(['archive', 'attachGoals', 'detachGoals', 'editDetails']);
});

// ─── Status presentation (§4.4) ─────────────────────────────────

test('archived is dashed and carries no cancellation glyph', () => {
    expect(planStatusPill('active').label()).toBe('Aktiv');
    expect(planStatusPill('active')).toMatchObject({ variant: 'outline' });
    expect(planStatusPill('archived').label()).toBe('Arkiverad');
    expect(planStatusPill('archived')).toMatchObject({ variant: 'dashed' });
    // The ✕ belongs to the cancelled reading, not to filing something away.
    expect(planStatusPill('archived').glyph).toBeUndefined();
});

// ─── Dates (IA §3.11) ───────────────────────────────────────────

test('all four range shapes get their own sentence', () => {
    expect(dateRangeLabel(null, null)).toBeNull();
    expect(dateRangeLabel('2026-03-03', '2026-06-30')).toBe('3 mars 2026 – 30 juni 2026');
    expect(dateRangeLabel('2026-03-03', null)).toBe('Från 3 mars 2026');
    expect(dateRangeLabel(null, '2026-06-30')).toBe('Till och med 30 juni 2026');
});

test('a malformed date is not rendered as Invalid Date', () => {
    expect(dateRangeLabel('inte-ett-datum', null)).toBeNull();
    expect(dateRangeLabel('2026-02-30', '2026-06-30')).toBe('Till och med 30 juni 2026');
});

test('an end before the start is invalid; equal dates are a legal one-day plan', () => {
    expect(isValidRange('2026-03-03', '2026-06-30')).toBe(true);
    expect(isValidRange('2026-06-30', '2026-03-03')).toBe(false);
    expect(isValidRange('2026-03-03', '2026-03-03')).toBe(true);
});

test('a half-open or malformed range is never reported as a range fault', () => {
    // Nothing to compare, so nothing to complain about — a bad date is a
    // different fault with a different fix.
    expect(isValidRange(null, '2026-06-30')).toBe(true);
    expect(isValidRange('2026-03-03', null)).toBe(true);
    expect(isValidRange(null, null)).toBe(true);
    expect(isValidRange('inte-ett-datum', '2026-06-30')).toBe(true);
});

// ─── List content (IA §3.11) ────────────────────────────────────

test('plans partition into active then archived', () => {
    const items = [
        plan({ id: 'a', status: 'active' }),
        plan({ id: 'b', status: 'archived' }),
        plan({ id: 'c', status: 'active' }),
    ];
    const groups = groupPlans(items);
    expect(groups.active.map((p) => p.id)).toEqual(['a', 'c']);
    expect(groups.archived.map((p) => p.id)).toEqual(['b']);
});

test('the primary teacher is a named label, absent when unset', () => {
    expect(primaryTeacherLabel(null)).toBeNull();
    expect(primaryTeacherLabel('Alva Lindgren')).toBe('Huvudlärare: Alva Lindgren');
});

test('a description excerpt collapses whitespace and cuts at a word boundary', () => {
    expect(descriptionExcerpt(null)).toBeNull();
    expect(descriptionExcerpt('  ')).toBeNull();
    expect(descriptionExcerpt('Rakt\n  och  jämnt')).toBe('Rakt och jämnt');
    const cut = descriptionExcerpt('ord '.repeat(60))!;
    expect(cut.endsWith('…')).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(111);
});

test('the row key covers every field the row paints', () => {
    const base = plan({ startDate: '2026-03-03', primaryTeacherDisplayName: 'Alva' });
    expect(planRowKey(base)).toBe(planRowKey({ ...base }));
    expect(planRowKey(base)).not.toBe(planRowKey({ ...base, status: 'archived' }));
    expect(planRowKey(base)).not.toBe(planRowKey({ ...base, endDate: '2026-06-30' }));
    expect(planRowKey(base)).not.toBe(planRowKey({ ...base, primaryTeacherDisplayName: 'Björn' }));
});

// ─── Linked occasions (IA §3.12) ────────────────────────────────

test('lessons group upcoming-ascending then past-newest-first', () => {
    const lessons = [
        { id: 'old', scheduledAt: '2026-05-01T10:00:00.000Z' },
        { id: 'recent', scheduledAt: '2026-07-10T10:00:00.000Z' },
        { id: 'soon', scheduledAt: '2026-07-22T10:00:00.000Z' },
        { id: 'later', scheduledAt: '2026-08-30T10:00:00.000Z' },
    ];
    const groups = groupLinkedLessons(lessons, '2026-07-19T00:00:00.000Z');
    // Next first — the useful end of the future.
    expect(groups.upcoming.map((l) => l.id)).toEqual(['soon', 'later']);
    // Most recent first — the useful end of the past. The server hands these
    // back ascending, which is backwards for this half.
    expect(groups.past.map((l) => l.id)).toEqual(['recent', 'old']);
});

test('a lesson exactly at the boundary counts as upcoming', () => {
    const now = '2026-07-19T00:00:00.000Z';
    const groups = groupLinkedLessons([{ id: 'x', scheduledAt: now }], now);
    expect(groups.upcoming.map((l) => l.id)).toEqual(['x']);
    expect(groups.past).toEqual([]);
});

test('training sessions are newest first', () => {
    const sessions = [
        { id: 'a', performedAt: '2026-07-01T18:00:00.000Z' },
        { id: 'b', performedAt: '2026-07-14T19:32:00.000Z' },
        { id: 'c', performedAt: '2026-06-20T08:00:00.000Z' },
    ];
    expect(sortLinkedSessions(sessions).map((s) => s.id)).toEqual(['b', 'a', 'c']);
});

test('sorting does not mutate the caller\'s array', () => {
    const sessions = [
        { id: 'a', performedAt: '2026-07-01T18:00:00.000Z' },
        { id: 'b', performedAt: '2026-07-14T19:32:00.000Z' },
    ];
    sortLinkedSessions(sessions);
    expect(sessions.map((s) => s.id)).toEqual(['a', 'b']);
});

test('the date block keeps its fixed width in Swedish', () => {
    const block = dateBlock('2026-07-14T19:32:00.000Z');
    expect(block.day).toBe('14');
    // sv's 'JULI' would break the block's alignment — formatMonthBlock truncates.
    expect(block.month).toBe('JUL');
    expect(block.month.length).toBe(3);
    expect(block.time).toMatch(/^\d{2}:\d{2}$/);
});

test('occasion headline is capitalised weekday plus clock', () => {
    expect(occasionWhen('2026-07-22T17:00:00.000Z')).toMatch(/^Onsdag 22 juli · \d{2}:\d{2}$/);
});

test('a linked lesson names its teacher, status and horse', () => {
    expect(lessonMeta({ teacherDisplayName: 'Alva', status: 'planned', horseName: 'Luna' }))
        .toBe('Alva · Planerad · Luna');
    // A missing horse drops the fact rather than printing an empty separator.
    expect(lessonMeta({ teacherDisplayName: 'Alva', status: 'cancelled', horseName: null }))
        .toBe('Alva · Inställd');
});

test('a linked session omits every fact it does not have', () => {
    expect(sessionMeta({ durationMin: 45, horseName: 'Luna', summary: 'Bra tempo' }))
        .toBe('45 min · Luna · Bra tempo');
    expect(sessionMeta({ durationMin: null, horseName: null, summary: null })).toBeNull();
    expect(sessionMeta({ durationMin: 45, horseName: null, summary: null })).toBe('45 min');
});

// ─── Goal attachment from the Plan side (IA §3.12) ──────────────

test('abandoned and already-linked goals are not offered', () => {
    const goals = [
        { id: 'g1', title: 'Galoppombyten', status: 'active' as const },
        { id: 'g2', title: 'Stabil form', status: 'achieved' as const },
        { id: 'g3', title: 'Gammalt mål', status: 'abandoned' as const },
    ];
    // Achieved stays offerable: recording what a plan reached is what the hub
    // is for. Abandoned does not — it states an intention already withdrawn.
    expect(attachableGoals(goals, []).map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(attachableGoals(goals, ['g1']).map((g) => g.id)).toEqual(['g2']);
});

test('linked ids come from the GOAL side, not from the privacy-filtered plan detail', () => {
    const goals = [
        { id: 'g1', planIds: ['p1', 'p2'] },
        { id: 'g2', planIds: ['p2'] },
        { id: 'g3', planIds: [] },
    ];
    expect(linkedGoalIds(goals, 'p1')).toEqual(['g1']);
    expect(linkedGoalIds(goals, 'p2')).toEqual(['g1', 'g2']);
    expect(linkedGoalIds(goals, 'p9')).toEqual([]);
});

// ─── The Plan → Goal privacy filter (IA §3.12) ──────────────────

test('an empty Mål section says something different to each reader', () => {
    // The server filters `PlanDetail.goals` by `goal_share`, so an empty array
    // means "no goals" to the owner and "none shared with you" to a teacher.
    // Saying "Inga mål kopplade" to a teacher would be a claim the view cannot
    // support — and would be false whenever the owner has a private goal here.
    expect(goalsEmptyKey('owner')).toBe('plan.goals.empty.owner');
    expect(goalsEmptyKey('connectedTeacher')).toBe('plan.goals.empty.teacher');
    expect(goalsEmptyKey('owner')).not.toBe(goalsEmptyKey('connectedTeacher'));
});

// ─── The shared vocabulary ──────────────────────────────────────

test('a Goal status is spelled once, in goal-copy, and reused here', () => {
    // Plan detail renders linked Goal statuses; importing rather than
    // duplicating is what keeps one spelling of "Uppnådd" with one shape
    // grammar behind it.
    expect(goalStatusPill('achieved').label()).toBe('Uppnådd');
    expect(goalStatusPill('achieved').variant).toBe('filled');
});

// ─── Locale ─────────────────────────────────────────────────────

test('English renders the same rules without falling back to Swedish', () => {
    setLocale('en');
    try {
        expect(planStatusPill('archived').label()).toBe('Archived');
        expect(primaryTeacherLabel('Alva')).toBe('Primary teacher: Alva');
        expect(dateRangeLabel('2026-03-03', null)).toBe('From March 3, 2026');
        expect(dateBlock('2026-07-14T19:32:00.000Z').month).toBe('JUL');
    } finally {
        setLocale('sv');
    }
});
