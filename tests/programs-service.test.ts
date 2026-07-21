import { test, expect, mock, afterEach } from 'bun:test';
import { ProgramsService } from '../web/programs/programs.service';
import { api, type Exercise } from '../web/api';

const exercise = (id: string): Exercise => ({
    id, teacherId: 't1', name: 'Volt', description: '', archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
});

/**
 * `loadAvailableExercises` has to distinguish "the library is empty" from "the
 * library did not answer".
 *
 * It used to be load-bearing for correctness: the builder derived `Arkiverad`
 * from a row's ABSENCE from this set, so an unanswered library marked every row
 * dead. `ProgramExerciseRef` now carries `archivedAt` and that inference is
 * gone. The distinction still matters for the picker's explanatory sentence,
 * which must not report a failed request as "your library is empty".
 */

const original = api.exercises.list;
afterEach(() => { api.exercises.list = original; });

test('a successful load publishes the library and reports the answer', async () => {
    api.exercises.list = mock(async () => [exercise('a')]) as typeof api.exercises.list;

    const svc = new ProgramsService();
    expect(await svc.loadAvailableExercises()).toBe(true);
    expect(svc.availableExercises.get().map((e) => e.id)).toEqual(['a']);
});

test('a genuinely empty library still counts as an answer', async () => {
    api.exercises.list = mock(async (): Promise<Exercise[]> => []) as typeof api.exercises.list;

    const svc = new ProgramsService();
    // A teacher with no exercises HAS answered — the picker may say so.
    expect(await svc.loadAvailableExercises()).toBe(true);
    expect(svc.availableExercises.get()).toEqual([]);
});

test('a FAILED load reports no answer and publishes nothing', async () => {
    api.exercises.list = mock(async (): Promise<Exercise[]> => {
        throw new Error('boom');
    }) as typeof api.exercises.list;

    const svc = new ProgramsService();
    svc.availableExercises.set([exercise('a')]);

    // The bug this guards: reporting success on a 500 would let the picker
    // tell a teacher with a full library that they have no exercises.
    expect(await svc.loadAvailableExercises()).toBe(false);
    expect(svc.error.get()).not.toBeNull();
    // and it must not have clobbered what was already known
    expect(svc.availableExercises.get().map((e) => e.id)).toEqual(['a']);
});

// ─── Row notes (§3.6) ───────────────────────────────────────────

const originalPatch = api.programs.updateExerciseNotes;
const originalList = api.programs.listExercises;
afterEach(() => {
    api.programs.updateExerciseNotes = originalPatch;
    api.programs.listExercises = originalList;
});

test('updateExerciseNotes sends the note and refreshes the sequence', async () => {
    const calls: unknown[] = [];
    api.programs.updateExerciseNotes = mock(async (input: unknown) => {
        calls.push(input);
        return { ok: true };
    }) as typeof api.programs.updateExerciseNotes;
    api.programs.listExercises = mock(async () => [{
        id: 'e1', name: 'Volt', description: '', sortOrder: 0,
        notes: '3 varv', archivedAt: null,
    }]) as typeof api.programs.listExercises;

    const svc = new ProgramsService();
    expect(await svc.updateExerciseNotes('p1', 'e1', '3 varv')).toBe(true);
    expect(calls).toEqual([{ id: 'p1', exerciseId: 'e1', notes: '3 varv' }]);
    // The refresh is what puts the saved text back on the row.
    expect(svc.exercises.get()[0]!.notes).toBe('3 varv');
});

test('updateExerciseNotes passes null through to clear a note', async () => {
    const calls: unknown[] = [];
    api.programs.updateExerciseNotes = mock(async (input: unknown) => {
        calls.push(input);
        return { ok: true };
    }) as typeof api.programs.updateExerciseNotes;
    api.programs.listExercises = mock(async () => []) as typeof api.programs.listExercises;

    const svc = new ProgramsService();
    await svc.updateExerciseNotes('p1', 'e1', null);
    expect(calls).toEqual([{ id: 'p1', exerciseId: 'e1', notes: null }]);
});

test('a FAILED note save reports false and does not reload', async () => {
    api.programs.updateExerciseNotes = mock(async () => {
        throw new Error('boom');
    }) as typeof api.programs.updateExerciseNotes;
    const list = mock(async () => []) as typeof api.programs.listExercises;
    api.programs.listExercises = list;

    const svc = new ProgramsService();
    // The builder keeps the editor open on false, so the typed text survives —
    // a reload here would repaint the row and throw it away.
    expect(await svc.updateExerciseNotes('p1', 'e1', 'x')).toBe(false);
    expect(svc.error.get()).not.toBeNull();
    expect(list).not.toHaveBeenCalled();
});
