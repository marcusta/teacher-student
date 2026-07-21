import type { Exercise, ProgramExerciseRef } from '../api';

/**
 * Program builder — the DOM-free rules behind IA §3.6.
 *
 * See `library-copy.ts` for why these live outside the component module.
 */

/**
 * One row of the ordered Exercise sequence, with everything the builder needs
 * to render and to decide which controls are offerable.
 */
export interface BuilderRow {
    /** The Exercise id. Also the reorder/remove key the API takes. */
    id: string;
    name: string;
    /** The optional instructional row note (§3.6 detail step 3). */
    notes: string | null;
    /** 1-based, as shown. `sortOrder` is 0-based on the wire. */
    position: number;
    /** No "move up" on the first row, no "move down" on the last. */
    isFirst: boolean;
    isLast: boolean;
    /**
     * The Exercise behind this row has been archived.
     *
     * Read straight off `ProgramExerciseRef.archivedAt`, which the server states
     * per row. It used to be inferred from the row's ABSENCE from `GET
     * /exercises` — exact only while that endpoint returns the whole library
     * unpaginated, and quietly wrong for every Exercise past page one the day it
     * is not (IA §4).
     */
    archived: boolean;
}

/**
 * Build the ordered rows.
 *
 * There is no load gate here any more, and that is the point. When `archived`
 * was derived from an absence, an un-answered library was indistinguishable
 * from an empty one and the whole builder briefly read as dead — so the
 * derivation had to be held back behind a flag tracking whether `GET /exercises`
 * had actually answered (not merely settled). A row that carries its own archive
 * stamp has nothing to wait for: the answer arrives with the row, and rendering
 * it early is simply correct rather than a guess made too soon.
 */
export function builderRows(refs: readonly ProgramExerciseRef[]): BuilderRow[] {
    const ordered = [...refs].sort((a, b) => a.sortOrder - b.sortOrder);
    return ordered.map((ref, i) => ({
        id: ref.id,
        name: ref.name,
        notes: ref.notes,
        position: i + 1,
        isFirst: i === 0,
        isLast: i === ordered.length - 1,
        archived: ref.archivedAt !== null,
    }));
}

/**
 * The add-Exercise picker, scoped to the Teacher's own library (§3.6 step 4) and
 * minus what is already attached.
 *
 * Withholding the already-attached ones is not the duplicate guard — it is what
 * makes the guard rarely fire. `isDuplicate` still exists because the list can
 * be stale: a second tab, or a slow add, can put a value in the picker that has
 * since been attached.
 */
export function pickableExercises(
    library: readonly Exercise[],
    attached: readonly ProgramExerciseRef[],
): Exercise[] {
    const taken = new Set(attached.map((e) => e.id));
    return library.filter((e) => !taken.has(e.id));
}

/**
 * §3.6: "Reject duplicate Exercises with a row-level explanation." The server
 * rejects the second attach outright (`addExercise` throws on a duplicate
 * `(program_id, exercise_id)`), so this is the local half of the same rule —
 * caught before the request, explained where the choice was made.
 */
export function isDuplicate(attached: readonly ProgramExerciseRef[], exerciseId: string): boolean {
    return attached.some((e) => e.id === exerciseId);
}

/**
 * Reorder by one step. Returns the new id order for
 * `PUT /programs/:id/exercises/order`, or `null` when the move is not available
 * — off either end, or an id that is not in the list.
 *
 * Returning `null` rather than the unchanged array is deliberate: the caller
 * must not issue a write that changes nothing, because a no-op PUT still
 * reloads the list and would flicker the row the user just tried to move.
 */
export function moveExercise(
    refs: readonly ProgramExerciseRef[],
    exerciseId: string,
    delta: -1 | 1,
): string[] | null {
    const ordered = [...refs].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((r) => r.id === exerciseId);
    if (index === -1) return null;
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return null;
    const order = ordered.map((r) => r.id);
    const moved = order[index]!;
    order[index] = order[target]!;
    order[target] = moved;
    return order;
}

/** Row identity for `$each`. Order and note are in the key so an edit repaints. */
export function builderRowKey(row: BuilderRow): string {
    return `${row.id}:${row.position}:${row.archived ? 'a' : 'l'}:${row.notes ?? ''}`;
}
