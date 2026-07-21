import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    dateBlock,
    durationLabel,
    exerciseSource,
    exerciseSummary,
    groupByTeacher,
    isConflict,
    loggableHorses,
    loggablePlans,
    orderedExercises,
    ownerRecipients,
    planChipLabel,
    programBadges,
    programChipLabel,
    rowKey,
    rowNote,
    sessionTitle,
    sessionWhen,
    sharedTeacherRecipients,
    shouldCommitSharing,
    sortSessions,
    summaryExcerpt,
    trainingSessionControls,
    unsharedProgramOwners,
} from '../web/training-sessions/training-session-copy';
import { shareLabel } from '../web/ui/copy';
import type { AttachedProgramRef, TrainingSessionExerciseRef } from '../web/api';

// Importing the app's i18n module is what registers the catalogs; the component
// modules themselves cannot be imported here because `web/theme.ts` writes a
// <style> at import time and there is no DOM in this process. That is why the
// rules under test live in `training-session-copy.ts` rather than inside the
// components.
await import('../web/i18n');

// Swedish is the source of truth (UI_DECISIONS §4), and it is what these
// assertions are written against. Registering the catalogs does not select a
// locale — that would otherwise come from the host environment, so the same
// assertions would pass or fail depending on whose machine ran them.
setLocale('sv');

function withLocale<T>(locale: string, fn: () => T): T {
    setLocale(locale);
    try {
        return fn();
    } finally {
        setLocale('sv');
    }
}

function exercise(over: Partial<TrainingSessionExerciseRef> = {}): TrainingSessionExerciseRef {
    return {
        id: 'tse1',
        exerciseId: 'ex1',
        name: 'Volt',
        sortOrder: 1,
        sourceProgramId: null,
        notes: null,
        ...over,
    };
}

const program = (id: string, title: string): AttachedProgramRef => ({ id, title });

// ─── The role matrix (IA §3.10) ─────────────────────────────────

test('the owner may mutate every part of their own session', () => {
    expect(trainingSessionControls('owner')).toEqual({
        editDetails: true,
        editSharing: true,
        editPrograms: true,
        editExercises: true,
        remove: true,
        notes: true,
    });
});

test('a shared teacher may only author notes — no metadata, sharing, programs or exercises', () => {
    const controls = trainingSessionControls('sharedTeacher');
    expect(controls.editDetails).toBe(false);
    expect(controls.editSharing).toBe(false);
    expect(controls.editPrograms).toBe(false);
    expect(controls.editExercises).toBe(false);
    expect(controls.remove).toBe(false);
    // The one capability sharing exists to grant.
    expect(controls.notes).toBe(true);
});

test('notes are the only control both roles share', () => {
    const owner = trainingSessionControls('owner');
    const teacher = trainingSessionControls('sharedTeacher');
    const shared = (Object.keys(owner) as (keyof typeof owner)[])
        .filter((key) => owner[key] && teacher[key]);
    expect(shared).toEqual(['notes']);
});

// ─── Conflicts ──────────────────────────────────────────────────

test('a conflict is detected by code, never by message text', () => {
    expect(isConflict({ code: 'conflict' })).toBe(true);
    expect(isConflict({ code: 'validation' })).toBe(false);
    expect(isConflict(null)).toBe(false);
    expect(isConflict(undefined)).toBe(false);
    // A message that happens to say "conflict" is still not one.
    expect(isConflict({ code: 'server' })).toBe(false);
});

// ─── Ordering ───────────────────────────────────────────────────

test('sessions sort newest first and the input is not mutated', () => {
    const items = [
        { id: 'a', performedAt: '2026-07-01T10:00:00.000Z' },
        { id: 'b', performedAt: '2026-07-14T19:32:00.000Z' },
        { id: 'c', performedAt: '2026-06-20T08:00:00.000Z' },
    ];
    expect(sortSessions(items).map((s) => s.id)).toEqual(['b', 'a', 'c']);
    expect(items.map((s) => s.id)).toEqual(['a', 'b', 'c']);
});

test('occurrences render in performed order regardless of arrival order', () => {
    const list = [exercise({ id: '3', sortOrder: 3 }), exercise({ id: '1', sortOrder: 1 })];
    expect(orderedExercises(list).map((e) => e.id)).toEqual(['1', '3']);
});

// ─── Dates and duration ─────────────────────────────────────────

test('the date block truncates the month to three characters so its width is fixed', () => {
    const block = dateBlock('2026-07-14T17:32:00.000Z');
    expect(block.day).toBe('14');
    // sv's CLDR month here is 'juli' — four characters would break the block.
    expect(block.month).toBe('JUL');
    expect(block.month.length).toBe(3);
    expect(block.time).toMatch(/^\d{2}:\d{2}$/);
});

test('the metadata line names the weekday and is capitalised', () => {
    const when = sessionWhen('2026-07-14T17:32:00.000Z');
    expect(when.startsWith('Tisdag')).toBe(true);
    expect(when).toContain(' · ');
});

test('duration is null when none was logged, so the field disappears entirely', () => {
    expect(durationLabel(null)).toBeNull();
    expect(durationLabel(45)).toBe('45 min');
    // Zero is a logged value, not a missing one.
    expect(durationLabel(0)).toBe('0 min');
});

test('duration follows the catalog in English too', () => {
    expect(withLocale('en', () => durationLabel(45))).toBe('45 min');
});

// ─── Row content ────────────────────────────────────────────────

test('the summary excerpt collapses whitespace and cuts at a word boundary', () => {
    expect(summaryExcerpt(null)).toBeNull();
    expect(summaryExcerpt('   ')).toBeNull();
    expect(summaryExcerpt('Bra\n\npass  idag')).toBe('Bra pass idag');

    const long = 'Vi red volter åt båda håll och det kändes mycket jämnare än förra veckan, särskilt åt vänster.';
    const cut = summaryExcerpt(long, 40)!;
    expect(cut.endsWith('…')).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(41);
    // Cut at a space — no word is sliced in half.
    expect(cut.slice(0, -1).trim()).toBe(cut.slice(0, -1));
    expect(long.startsWith(cut.slice(0, -1))).toBe(true);
});

test('the exercise summary names at most three and counts the rest', () => {
    expect(exerciseSummary([])).toBe('Inga övningar');
    expect(exerciseSummary([exercise({ name: 'Volt' })])).toBe('1 övning · Volt');
    const four = ['Volt', 'Serpentin', 'Trav', 'Galopp'].map((name) => exercise({ name }));
    expect(exerciseSummary(four)).toBe('4 övningar · Volt, Serpentin, Trav +1');
});

test('the headline prefers the student’s own summary over derived copy', () => {
    expect(sessionTitle({
        summary: 'Lugnt pass, mycket skritt',
        programs: [program('p1', 'Uppvärmning')],
        exercises: [exercise()],
    })).toBe('Lugnt pass, mycket skritt');
});

test('the headline falls back through program, exercises, then the bare kind', () => {
    const base = { summary: null, exercises: [] as TrainingSessionExerciseRef[] };
    expect(sessionTitle({ ...base, programs: [program('p1', 'Uppvärmning')] })).toBe('Uppvärmning');
    expect(sessionTitle({ ...base, programs: [program('p1', 'A'), program('p2', 'B')] }))
        .toBe('Pass från 2 program');
    expect(sessionTitle({ ...base, programs: [], exercises: [exercise(), exercise({ id: 'b' })] }))
        .toBe('Pass med 2 övningar');
    expect(sessionTitle({ ...base, programs: [] })).toBe('Träningspass');
});

test('a program title promoted into the headline is not repeated as a badge', () => {
    const one = [program('p1', 'Uppvärmning')];
    expect(programBadges({ summary: null, programs: one })).toEqual([]);
    // Two programs were never promoted, so both still show.
    const two = [program('p1', 'A'), program('p2', 'B')];
    expect(programBadges({ summary: null, programs: two })).toEqual(two);
    // A summary took the headline, so the single program was never promoted.
    expect(programBadges({ summary: 'Bra pass', programs: one })).toEqual(one);
});

test('chips are always named', () => {
    expect(planChipLabel('Hoppsäsong vår 2026')).toBe('Plan: Hoppsäsong vår 2026');
    expect(programChipLabel(program('p1', 'Grundhoppning A'))).toBe('Program: Grundhoppning A');
});

// ─── The static Row note (the projection this slice fixed) ──────

test('the Row note reads the newly projected column and trims it', () => {
    expect(rowNote(exercise({ notes: '  Håll tempot jämnt  ' }))).toBe('Håll tempot jämnt');
});

test('a blank Row note collapses to null so no empty paragraph renders', () => {
    expect(rowNote(exercise({ notes: null }))).toBeNull();
    expect(rowNote(exercise({ notes: '' }))).toBeNull();
    expect(rowNote(exercise({ notes: '   \n ' }))).toBeNull();
});

test('the source label survives a detached program by saying so', () => {
    const programs = [program('p1', 'Uppvärmning')];
    expect(exerciseSource(exercise({ sourceProgramId: null }), programs)).toBeNull();
    expect(exerciseSource(exercise({ sourceProgramId: 'p1' }), programs)).toBe('Från Uppvärmning');
    // Detaching leaves the copied exercises behind, so the id outlives the label.
    expect(exerciseSource(exercise({ sourceProgramId: 'gone' }), programs))
        .toBe('Från ett borttaget program');
});

// ─── Sharing (§4.5) ─────────────────────────────────────────────

const teachers = [
    { id: 't1', displayName: 'Alva' },
    { id: 't2', displayName: 'Björn' },
];

test('the owner sees every recipient resolved to a name', () => {
    expect(ownerRecipients(['t1'], teachers)).toEqual([{ id: 't1', name: 'Alva' }]);
    expect(shareLabel(ownerRecipients(['t1'], teachers))).toBe('Delad: Alva');
    expect(shareLabel(ownerRecipients(['t1', 't2'], teachers))).toBe('Delad: Alva +1');
});

test('an unnameable recipient still counts, so the chip never understates the audience', () => {
    // A Relation removed since the session was shared.
    const label = shareLabel(ownerRecipients(['t1', 'ghost'], teachers));
    expect(label).toBe('Delad: Alva +1');
});

test('a private session says Privat and nothing else', () => {
    expect(ownerRecipients([], teachers)).toEqual([]);
    expect(shareLabel([], false)).toBe('Privat');
});

test('a shared teacher names themselves rather than rendering a bare Delad or a count', () => {
    const recipients = sharedTeacherRecipients(['t1', 't2'], 't1', 'du');
    expect(recipients[0]).toEqual({ id: 't1', name: 'du' });
    const label = shareLabel(recipients);
    expect(label).toBe('Delad: du +1');
    // The two things §4.5 forbids.
    expect(label).not.toBe('Delad');
    expect(label).not.toContain('lärare)');
});

test('a teacher who is the only recipient sees no phantom others', () => {
    expect(shareLabel(sharedTeacherRecipients(['t1'], 't1', 'du'))).toBe('Delad: du');
});

// ─── Creation filters ───────────────────────────────────────────

test('archived horses and plans are not offered', () => {
    expect(loggableHorses([
        { id: 'h1', archivedAt: null },
        { id: 'h2', archivedAt: '2026-01-01T00:00:00.000Z' },
    ]).map((h) => h.id)).toEqual(['h1']);

    expect(loggablePlans([
        { id: 'p1', status: 'active' as const },
        { id: 'p2', status: 'archived' as const },
    ]).map((p) => p.id)).toEqual(['p1']);
});

// ─── Pickers (§4.9) ─────────────────────────────────────────────

const catalog = [
    { id: 'e1', teacherId: 't1', name: 'Volt' },
    { id: 'e2', teacherId: 't2', name: 'Serpentin' },
    { id: 'e3', teacherId: 't1', name: 'Trav' },
];

test('the catalog is grouped under a non-selectable header per owning teacher', () => {
    const options = groupByTeacher(catalog, teachers, (e) => e.name);
    expect(options).toEqual([
        { value: 'group:t1', label: 'Alva', disabled: true },
        { value: 'e1', label: 'Volt' },
        { value: 'e3', label: 'Trav' },
        { value: 'group:t2', label: 'Björn', disabled: true },
        { value: 'e2', label: 'Serpentin' },
    ]);
    // Headers are never selectable values.
    expect(options.filter((o) => o.disabled).every((o) => o.value.startsWith('group:'))).toBe(true);
});

test('already-attached items are excluded, and an emptied group takes its header with it', () => {
    const options = groupByTeacher(catalog, teachers, (e) => e.name, new Set(['e1', 'e3']));
    expect(options).toEqual([
        { value: 'group:t2', label: 'Björn', disabled: true },
        { value: 'e2', label: 'Serpentin' },
    ]);
});

test('everything attached leaves no options at all, not a list of bare headers', () => {
    expect(groupByTeacher(catalog, teachers, (e) => e.name, new Set(['e1', 'e2', 'e3']))).toEqual([]);
});

test('group order follows the teacher list, not catalog insertion order', () => {
    const reversed = [...catalog].reverse();
    const labels = groupByTeacher(reversed, teachers, (e) => e.name)
        .filter((o) => o.disabled)
        .map((o) => o.label);
    expect(labels).toEqual(['Alva', 'Björn']);
});

test('content from a teacher no longer connected keeps its own labelled group', () => {
    const orphan = [{ id: 'e9', teacherId: 'gone', name: 'Tölt' }];
    expect(groupByTeacher(orphan, teachers, (e) => e.name)).toEqual([
        { value: 'group:gone', label: 'Okänd lärare', disabled: true },
        { value: 'e9', label: 'Tölt' },
    ]);
});

// ─── The sharing offer (IA §3.10) ───────────────────────────────

const programCatalog = [
    { id: 'p1', teacherId: 't1' },
    { id: 'p2', teacherId: 't2' },
];

test('attaching a program surfaces its owner when they cannot see the session', () => {
    const owners = unsharedProgramOwners(
        [program('p1', 'Uppvärmning')], programCatalog, [], teachers,
    );
    expect(owners).toEqual([{ id: 't1', displayName: 'Alva' }]);
});

test('no offer is made once the owner is already shared with — sharing is never forced', () => {
    expect(unsharedProgramOwners(
        [program('p1', 'Uppvärmning')], programCatalog, ['t1'], teachers,
    )).toEqual([]);
});

test('each missing owner is named once, however many of their programs are attached', () => {
    const owners = unsharedProgramOwners(
        [program('p1', 'A'), program('p2', 'B')], programCatalog, ['t1'], teachers,
    );
    expect(owners).toEqual([{ id: 't2', displayName: 'Björn' }]);
});

test('a program whose owner cannot be resolved raises no offer', () => {
    expect(unsharedProgramOwners(
        [program('unknown', 'Mystery')], programCatalog, [], teachers,
    )).toEqual([]);
});

// ─── Row identity ───────────────────────────────────────────────

function session(over: Partial<Parameters<typeof rowKey>[0]> = {}) {
    return {
        id: 's1',
        performedAt: '2026-07-14T19:32:00.000Z',
        durationMin: 45,
        summary: 'Bra pass',
        horseName: 'Luna',
        planId: 'pl1',
        sharedWithTeacherIds: ['t1'],
        programs: [program('p1', 'Uppvärmning')],
        exercises: [exercise()],
        ...over,
    };
}

test('the row key changes for every field the row paints', () => {
    const base = rowKey(session());
    expect(rowKey(session())).toBe(base);
    // Sharing is drawn on the row, so it has to move the key — a chip stuck on
    // "Privat" after sharing would be a lie the cache told.
    expect(rowKey(session({ sharedWithTeacherIds: [] }))).not.toBe(base);
    expect(rowKey(session({ durationMin: null }))).not.toBe(base);
    expect(rowKey(session({ summary: 'Annat' }))).not.toBe(base);
    expect(rowKey(session({ horseName: null }))).not.toBe(base);
    expect(rowKey(session({ planId: null }))).not.toBe(base);
    expect(rowKey(session({ programs: [] }))).not.toBe(base);
    expect(rowKey(session({ exercises: [] }))).not.toBe(base);
    expect(rowKey(session({ performedAt: '2026-07-15T19:32:00.000Z' }))).not.toBe(base);
});

// ─── Locale ─────────────────────────────────────────────────────

test('every derived string follows the active locale', () => {
    withLocale('en', () => {
        expect(exerciseSummary([])).toBe('No exercises');
        expect(sessionTitle({ summary: null, programs: [], exercises: [] })).toBe('Training session');
        expect(planChipLabel('Spring')).toBe('Plan: Spring');
        expect(exerciseSource(exercise({ sourceProgramId: 'gone' }), [])).toBe('From a removed program');
        expect(shareLabel([], false)).toBe('Private');
    });
});

// ─── The sharing commit guard ───────────────────────────────────

const commitArgs = (over: Partial<Parameters<typeof shouldCommitSharing>[0]> = {}) => ({
    seeded: true,
    teacherCount: 3,
    next: ['t1', 't2'],
    stored: ['t1', 't2'],
    ...over,
});

test('an un-seeded share signal is never read as a user edit', () => {
    // The regression this guards: TeachersService is an app-wide singleton that
    // AppComponent loads at startup, so on the normal navigation path the count
    // is already above one when the detail view mounts. Without the seed flag,
    // the initial [] against a shared session PATCHes the shares away — opening
    // a shared session would silently make it private.
    expect(shouldCommitSharing(commitArgs({ seeded: false, next: [], stored: ['t1', 't2'] })))
        .toBe(false);
    expect(shouldCommitSharing(commitArgs({ seeded: true, next: [], stored: ['t1', 't2'] })))
        .toBe(true);
});

test('the effect declines at one Teacher or none — the checkbox owns that write', () => {
    for (const teacherCount of [0, 1]) {
        expect(shouldCommitSharing(commitArgs({ teacherCount, next: ['t1'], stored: [] })))
            .toBe(false);
    }
});

test('a seeded signal matching the server is idempotent, in any order', () => {
    expect(shouldCommitSharing(commitArgs())).toBe(false);
    expect(shouldCommitSharing(commitArgs({ next: ['t2', 't1'], stored: ['t1', 't2'] })))
        .toBe(false);
});

test('a genuine edit still commits', () => {
    expect(shouldCommitSharing(commitArgs({ next: ['t1'], stored: ['t1', 't2'] }))).toBe(true);
    expect(shouldCommitSharing(commitArgs({ next: [], stored: ['t1'] }))).toBe(true);
    expect(shouldCommitSharing(commitArgs({ next: ['t1', 't3'], stored: ['t1'] }))).toBe(true);
});
