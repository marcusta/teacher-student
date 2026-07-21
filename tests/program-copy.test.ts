import { test, expect } from 'bun:test';
import {
    builderRowKey,
    builderRows,
    isDuplicate,
    moveExercise,
    pickableExercises,
} from '../web/programs/program-copy';
import type { Exercise, ProgramExerciseRef } from '../web/api';

// See tests/library-copy.test.ts for why these rules live outside the component
// module. Nothing here reads the catalogs, so no locale is selected.

function ref(over: Partial<ProgramExerciseRef> = {}): ProgramExerciseRef {
    return {
        id: 'ex-1',
        name: 'Övergångar',
        description: '',
        sortOrder: 0,
        notes: null,
        archivedAt: null,
        ...over,
    };
}

function exercise(over: Partial<Exercise> = {}): Exercise {
    return {
        id: 'ex-1',
        teacherId: 'teacher-1',
        name: 'Övergångar',
        description: '',
        archivedAt: null,
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
        ...over,
    };
}

const SEQUENCE = [
    ref({ id: 'a', name: 'A', sortOrder: 0 }),
    ref({ id: 'b', name: 'B', sortOrder: 1 }),
    ref({ id: 'c', name: 'C', sortOrder: 2 }),
];
const LIBRARY = [exercise({ id: 'a' }), exercise({ id: 'b' }), exercise({ id: 'c' })];

// ─── Ordering ───────────────────────────────────────────────────

test('rows are ordered by sortOrder and numbered from 1, whatever order they arrive in', () => {
    const rows = builderRows([SEQUENCE[2]!, SEQUENCE[0]!, SEQUENCE[1]!]);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3]);
});

test('only the first row is first and only the last is last', () => {
    const rows = builderRows(SEQUENCE);
    expect(rows.map((r) => r.isFirst)).toEqual([true, false, false]);
    expect(rows.map((r) => r.isLast)).toEqual([false, false, true]);
});

test('a single row is both first and last, so it gets no reorder controls', () => {
    const rows = builderRows([SEQUENCE[0]!]);
    expect(rows[0]!.isFirst).toBe(true);
    expect(rows[0]!.isLast).toBe(true);
});

// ─── Archived, as stated by the server ──────────────────────────

const ARCHIVED_AT = '2026-07-01T10:00:00.000Z';

test('a row is archived when it carries an archivedAt, and only then', () => {
    // The server states this per row (`exercises.archived_at`, off a join
    // listExercises already makes). It is no longer inferred from the row's
    // absence from GET /exercises.
    const rows = builderRows([
        ref({ id: 'a', sortOrder: 0 }),
        ref({ id: 'b', sortOrder: 1, archivedAt: ARCHIVED_AT }),
        ref({ id: 'c', sortOrder: 2 }),
    ]);
    expect(rows.map((r) => r.archived)).toEqual([false, true, false]);
});

test('the library has no say in it — rows absent from it are still live', () => {
    // Guards the regression the old derivation could not survive. Absence from
    // the library once meant "archived", so an unloaded library, a failed one,
    // or (IA §4) one paginated past page one would flag a healthy Program as
    // dead. builderRows is not even given the library any more.
    expect(builderRows(SEQUENCE).map((r) => r.archived)).toEqual([false, false, false]);
});

test('every row can be archived at once, when every row actually is', () => {
    const rows = builderRows(SEQUENCE.map((r) => ({ ...r, archivedAt: ARCHIVED_AT })));
    expect(rows.map((r) => r.archived)).toEqual([true, true, true]);
});

test('the row key distinguishes archived from live, and tracks order and note', () => {
    const [live] = builderRows([SEQUENCE[0]!]);
    const [archived] = builderRows([{ ...SEQUENCE[0]!, archivedAt: ARCHIVED_AT }]);
    expect(builderRowKey(live!)).not.toBe(builderRowKey(archived!));

    const [withNote] = builderRows([ref({ id: 'a', notes: 'sitt ner' })]);
    const [withoutNote] = builderRows([ref({ id: 'a' })]);
    expect(builderRowKey(withNote!)).not.toBe(builderRowKey(withoutNote!));
});

// ─── Picker ─────────────────────────────────────────────────────

test('the picker withholds Exercises already in the Program', () => {
    const pickable = pickableExercises(LIBRARY, [SEQUENCE[0]!, SEQUENCE[2]!]);
    expect(pickable.map((e) => e.id)).toEqual(['b']);
});

test('the picker is empty, not undefined, when the Program has everything', () => {
    expect(pickableExercises(LIBRARY, SEQUENCE)).toEqual([]);
});

test('duplicates are detected against what is attached, not against the picker', () => {
    expect(isDuplicate(SEQUENCE, 'b')).toBe(true);
    expect(isDuplicate(SEQUENCE, 'z')).toBe(false);
    expect(isDuplicate([], 'a')).toBe(false);
});

// ─── Reorder ────────────────────────────────────────────────────

test('moving down swaps with the next row', () => {
    expect(moveExercise(SEQUENCE, 'a', 1)).toEqual(['b', 'a', 'c']);
});

test('moving up swaps with the previous row', () => {
    expect(moveExercise(SEQUENCE, 'c', -1)).toEqual(['a', 'c', 'b']);
});

test('a move off either end is null, so no no-op write is issued', () => {
    expect(moveExercise(SEQUENCE, 'a', -1)).toBeNull();
    expect(moveExercise(SEQUENCE, 'c', 1)).toBeNull();
});

test('a move of an unknown id is null rather than a silent reshuffle', () => {
    expect(moveExercise(SEQUENCE, 'nope', 1)).toBeNull();
});

test('reordering works from an out-of-order input and never mutates it', () => {
    const input = [SEQUENCE[1]!, SEQUENCE[2]!, SEQUENCE[0]!];
    const snapshot = input.map((r) => r.id);
    // Sorted by sortOrder first, so 'b' sits at index 1 regardless of arrival order.
    expect(moveExercise(input, 'b', 1)).toEqual(['a', 'c', 'b']);
    expect(input.map((r) => r.id)).toEqual(snapshot);
});
