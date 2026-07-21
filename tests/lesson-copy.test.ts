import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    bookableHorses,
    bookablePlans,
    counterpartyRole,
    dateBlock,
    exerciseSource,
    exerciseSummary,
    groupLessons,
    historyHref,
    isConflict,
    isTerminal,
    lessonControls,
    lessonTitle,
    lessonWhen,
    lockNotice,
    orderedExercises,
    programBadges,
    rowKey,
    rowNote,
    statusPill,
    type LessonLike,
} from '../web/lessons/lesson-copy';
import type { LessonExerciseRef } from '../web/api';

// Importing the app's i18n module is what registers the catalogs; the component
// modules themselves cannot be imported here because `web/theme.ts` writes a
// <style> at import time and there is no DOM in this process. That is why the
// rules under test live in `lesson-copy.ts` rather than inside the components.
await import('../web/i18n');

function withLocale<T>(locale: string, fn: () => T): T {
    setLocale(locale);
    try {
        return fn();
    } finally {
        setLocale('sv');
    }
}

function exercise(over: Partial<LessonExerciseRef> = {}): LessonExerciseRef {
    return {
        id: 'le1',
        exerciseId: 'ex1',
        name: 'Volt',
        sortOrder: 0,
        sourceProgramId: null,
        notes: null,
        ...over,
    };
}

function lesson(over: Partial<LessonLike> = {}): LessonLike {
    return {
        id: 'l1',
        role: 'teacher',
        status: 'planned',
        scheduledAt: '2026-07-22T15:00:00.000Z',
        counterpartyDisplayName: 'Alva',
        horseName: 'Caspian',
        planId: null,
        planTitle: null,
        programs: [],
        exercises: [],
        ...over,
    };
}

// ─── Status shape grammar (§4.4, UI_DECISIONS §7) ───────────────

test('status: the three statuses differ by SHAPE, not only by tone', () => {
    // UI_DECISIONS §7 makes this mandatory: "Status is never carried by colour
    // alone". Strip the tone entirely and the three must still be distinct.
    const variants = (['planned', 'completed', 'cancelled'] as const).map((s) => statusPill(s).variant);
    expect(variants).toEqual(['outline', 'filled', 'dashed']);
    expect(new Set(variants).size).toBe(3);
});

test('status: brass is never a status tone', () => {
    // §4.4 Undvik: "mässing som statusfärg". StatusPillTone has no accent entry,
    // so this is really a guard against someone widening the type later.
    for (const status of ['planned', 'completed', 'cancelled'] as const) {
        expect(['neutral', 'success', 'warning', 'danger', 'info']).toContain(statusPill(status).tone);
    }
});

test('status: labels are translated, and cancelled carries its glyph', () => {
    expect(withLocale('sv', () => statusPill('planned').label())).toBe('Planerad');
    expect(withLocale('sv', () => statusPill('completed').label())).toBe('Utförd');
    expect(withLocale('sv', () => statusPill('cancelled').label())).toBe('Inställd');
    expect(withLocale('en', () => statusPill('completed').label())).toBe('Completed');
    expect(statusPill('cancelled').glyph).toBe('✕');
    expect(statusPill('planned').glyph).toBeUndefined();
});

test('terminal: completed and cancelled, and nothing else', () => {
    expect(isTerminal('planned')).toBe(false);
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
});

// ─── The terminal-state control matrix ──────────────────────────

test('controls: structural editing closes at a terminal status', () => {
    // The server answers 409 for addExercise / removeExercise / attachProgram /
    // detachProgram once a Lesson is terminal, so the UI must not offer them.
    for (const status of ['completed', 'cancelled'] as const) {
        const c = lessonControls(status, 'teacher');
        expect(c.editExercises).toBe(false);
        expect(c.editPrograms).toBe(false);
        expect(c.transition).toBe(false);
    }
    const planned = lessonControls('planned', 'teacher');
    expect(planned.editExercises).toBe(true);
    expect(planned.editPrograms).toBe(true);
    expect(planned.transition).toBe(true);
});

test('controls: reschedule, horse and plan stay open after a terminal status', () => {
    // Corrections must remain possible — a lesson recorded on the wrong horse
    // is exactly the case this rule exists for. The server permits it too.
    for (const status of ['planned', 'completed', 'cancelled'] as const) {
        expect(lessonControls(status, 'teacher').editDetails).toBe(true);
    }
});

test('controls: notes stay open at EVERY status and for BOTH roles', () => {
    // This is the product's core feedback loop: most feedback on a lesson is
    // written after it is taught. Locking notes at the terminal transition would
    // close the loop the app exists to run.
    for (const status of ['planned', 'completed', 'cancelled'] as const) {
        for (const role of ['teacher', 'student'] as const) {
            expect(lessonControls(status, role).notes).toBe(true);
        }
    }
});

test('controls: a student never mutates structure, at any status', () => {
    for (const status of ['planned', 'completed', 'cancelled'] as const) {
        const c = lessonControls(status, 'student');
        expect(c.transition).toBe(false);
        expect(c.editDetails).toBe(false);
        expect(c.editExercises).toBe(false);
        expect(c.editPrograms).toBe(false);
        expect(c.lockNotice).toBe(false);
    }
});

test('controls: the lock notice appears exactly where controls were withheld', () => {
    expect(lessonControls('planned', 'teacher').lockNotice).toBe(false);
    expect(lessonControls('completed', 'teacher').lockNotice).toBe(true);
    expect(lessonControls('cancelled', 'teacher').lockNotice).toBe(true);
});

test('lock notice names what is closed AND what is still open', () => {
    for (const status of ['completed', 'cancelled'] as const) {
        const sv = withLocale('sv', () => lockNotice(status));
        expect(sv).toContain('anteckningar');
        expect(sv).toContain('låsta');
        const en = withLocale('en', () => lockNotice(status));
        expect(en).toContain('notes');
        expect(en).toContain('locked');
    }
    expect(withLocale('sv', () => lockNotice('completed'))).not.toBe(withLocale('sv', () => lockNotice('cancelled')));
});

test('conflict: a 409 is recognised by code, not by message text', () => {
    expect(isConflict({ code: 'conflict' })).toBe(true);
    expect(isConflict({ code: 'server' })).toBe(false);
    expect(isConflict({ code: 'validation' })).toBe(false);
    expect(isConflict(null)).toBe(false);
    expect(isConflict(undefined)).toBe(false);
});

// ─── Grouping (IA §3.7) ─────────────────────────────────────────

test('grouping: Kommande soonest first, Tidigare newest first', () => {
    const now = '2026-07-20T00:00:00.000Z';
    const items = [
        { id: 'c', scheduledAt: '2026-07-25T09:00:00.000Z' },
        { id: 'a', scheduledAt: '2026-07-11T08:00:00.000Z' },
        { id: 'b', scheduledAt: '2026-07-22T17:00:00.000Z' },
        { id: 'd', scheduledAt: '2026-07-14T18:00:00.000Z' },
    ];
    const { upcoming, past } = groupLessons(items, now);
    expect(upcoming.map((l) => l.id)).toEqual(['b', 'c']);
    expect(past.map((l) => l.id)).toEqual(['d', 'a']);
});

test('grouping: every lesson lands in exactly one group', () => {
    const now = '2026-07-20T00:00:00.000Z';
    const items = [
        { id: 'boundary', scheduledAt: now },
        { id: 'before', scheduledAt: '2026-07-19T23:59:59.999Z' },
        { id: 'after', scheduledAt: '2026-07-20T00:00:00.001Z' },
    ];
    const { upcoming, past } = groupLessons(items, now);
    expect(upcoming.length + past.length).toBe(items.length);
    // The boundary belongs to Kommande — a lesson starting exactly now has not
    // happened yet.
    expect(upcoming.map((l) => l.id)).toContain('boundary');
});

// ─── Row content ────────────────────────────────────────────────

test('date block: three fixed-width characters for the month', () => {
    // sv's 'JULI' would break the block's alignment; formatMonthBlock truncates
    // for this element only (UI_DECISIONS §4).
    const block = withLocale('sv', () => dateBlock('2026-07-22T15:00:00.000Z'));
    expect(block.day).toBe('22');
    expect(block.month).toBe('JUL');
    expect(block.month.length).toBe(3);
    expect(block.time).toMatch(/^\d{2}[:.]\d{2}$/);
});

test('date block: the month is three characters in every month, in both locales', () => {
    for (const locale of ['sv', 'en']) {
        for (let month = 0; month < 12; month++) {
            const iso = new Date(Date.UTC(2026, month, 15, 12)).toISOString();
            expect(withLocale(locale, () => dateBlock(iso).month).length).toBe(3);
        }
    }
});

test('when line: capitalised weekday, and no invented end time', () => {
    const when = withLocale('sv', () => lessonWhen('2026-07-22T15:00:00.000Z'));
    expect(when).toMatch(/^Onsdag/);
    expect(when).toContain('22 juli');
    // The contract carries only scheduled_at. Rendering '17:00–18:00' would mean
    // inventing the second half of the range.
    expect(when).not.toContain('–');
});

test('counterparty role is the inverse of the reader\'s own', () => {
    expect(counterpartyRole('teacher')).toBe('student');
    expect(counterpartyRole('student')).toBe('teacher');
});

test('title: derived from what the occasion contains', () => {
    // The lessons table has no title column, so the headline is derived rather
    // than read — and never the bare word "Lektion" when there is more to say.
    expect(withLocale('sv', () => lessonTitle(lesson()))).toBe('Lektion');
    expect(withLocale('sv', () => lessonTitle(lesson({
        exercises: [exercise(), exercise({ id: 'le2' })],
    })))).toBe('Lektion med 2 övningar');
    expect(withLocale('sv', () => lessonTitle(lesson({
        exercises: [exercise()],
    })))).toBe('Lektion med 1 övning');
    expect(withLocale('sv', () => lessonTitle(lesson({
        programs: [{ id: 'p1', title: 'Grundhoppning A' }],
    })))).toBe('Grundhoppning A');
    expect(withLocale('sv', () => lessonTitle(lesson({
        programs: [{ id: 'p1', title: 'A' }, { id: 'p2', title: 'B' }],
    })))).toBe('Lektion från 2 program');
});

test('title: a program headline wins over an exercise count', () => {
    expect(withLocale('sv', () => lessonTitle(lesson({
        programs: [{ id: 'p1', title: 'Grundhoppning A' }],
        exercises: [exercise(), exercise({ id: 'le2' })],
    })))).toBe('Grundhoppning A');
});

test('program badges never repeat the headline', () => {
    // §4.3 allows at most two rows of text per row; printing the same program
    // title twice on one row is exactly the noise that limit protects.
    const single = lesson({ programs: [{ id: 'p1', title: 'Grundhoppning A' }] });
    expect(programBadges(single)).toEqual([]);
    const many = lesson({ programs: [{ id: 'p1', title: 'A' }, { id: 'p2', title: 'B' }] });
    expect(programBadges(many).map((p) => p.id)).toEqual(['p1', 'p2']);
});

test('exercise summary stays compact and counts the rest', () => {
    expect(withLocale('sv', () => exerciseSummary([]))).toBe('Inga övningar');
    expect(withLocale('sv', () => exerciseSummary([{ name: 'Volt' }]))).toBe('1 övning · Volt');
    expect(withLocale('sv', () => exerciseSummary([
        { name: 'Volt' }, { name: 'Serpentin' }, { name: 'Trav' },
    ]))).toBe('3 övningar · Volt, Serpentin, Trav');
    // A fourth name is counted, not printed — the row must not grow with data.
    expect(withLocale('sv', () => exerciseSummary([
        { name: 'Volt' }, { name: 'Serpentin' }, { name: 'Trav' }, { name: 'Galopp' }, { name: 'Skänkelvikning' },
    ]))).toBe('5 övningar · Volt, Serpentin, Trav +2');
    expect(withLocale('en', () => exerciseSummary([{ name: 'Volt' }]))).toBe('1 exercise · Volt');
});

test('row key covers every field the row paints', () => {
    // $each caches a row's DOM by key and never re-runs its renderer, so a key
    // that misses a field leaves a stale row on screen. `updatedAt` alone would
    // not do: attaching a Program writes the join table, not the lessons row.
    const base = lesson();
    const changes: Partial<LessonLike>[] = [
        { status: 'cancelled' },
        { scheduledAt: '2026-08-01T10:00:00.000Z' },
        { horseName: 'Luna' },
        { planId: 'plan1' },
        { programs: [{ id: 'p1', title: 'A' }] },
        { exercises: [exercise()] },
    ];
    for (const change of changes) {
        expect(rowKey(lesson(change))).not.toBe(rowKey(base));
    }
    expect(rowKey(lesson())).toBe(rowKey(base));
});

// ─── Exercise occurrences (IA §3.8) ─────────────────────────────

test('occurrences render in taught order', () => {
    const shuffled = [
        exercise({ id: 'c', sortOrder: 2 }),
        exercise({ id: 'a', sortOrder: 0 }),
        exercise({ id: 'b', sortOrder: 1 }),
    ];
    expect(orderedExercises(shuffled).map((e) => e.id)).toEqual(['a', 'b', 'c']);
    // Non-destructive: the service's array is shared state.
    expect(shuffled[0]!.id).toBe('c');
});

test('exercise source survives its program being detached', () => {
    const programs = [{ id: 'p1', title: 'Grundhoppning A' }];
    expect(withLocale('sv', () => exerciseSource(exercise({ sourceProgramId: 'p1' }), programs)))
        .toBe('Från Grundhoppning A');
    expect(exerciseSource(exercise({ sourceProgramId: null }), programs)).toBeNull();
    // Detaching a Program leaves its copied Exercises behind, so the source id
    // outlives the label. Never a dangling 'Från '.
    const orphan = withLocale('sv', () => exerciseSource(exercise({ sourceProgramId: 'gone' }), programs));
    expect(orphan).toBe('Från ett borttaget program');
    expect(orphan).not.toMatch(/\s$/);
});

test('row note is only rendered when there is one to render', () => {
    expect(rowNote(exercise())).toBeNull();
    expect(rowNote({ ...exercise(), notes: null })).toBeNull();
    expect(rowNote({ ...exercise(), notes: '   ' })).toBeNull();
    expect(rowNote({ ...exercise(), notes: '  Håll tempot jämnt.  ' })).toBe('Håll tempot jämnt.');
});

test('history link carries a way back to this lesson', () => {
    const href = historyHref('s1', 'ex1', 'l1');
    expect(href).toBe('/students/s1/exercises/ex1/history?from=%2Flektioner%2Fl1');
    expect(decodeURIComponent(href.split('from=')[1]!)).toBe('/lektioner/l1');
});

// ─── Creation (IA §3.7) ─────────────────────────────────────────

test('booking offers only the non-archived stable and active plans', () => {
    const horses = [
        { id: 'h1', archivedAt: null },
        { id: 'h2', archivedAt: '2026-01-01T00:00:00.000Z' },
    ];
    expect(bookableHorses(horses).map((h) => h.id)).toEqual(['h1']);
    const plans = [
        { id: 'p1', status: 'active' as const },
        { id: 'p2', status: 'archived' as const },
    ];
    expect(bookablePlans(plans).map((p) => p.id)).toEqual(['p1']);
});
