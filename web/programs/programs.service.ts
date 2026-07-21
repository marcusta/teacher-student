import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Exercise, type Program, type ProgramExerciseRef } from '../api';

/**
 * Owns the current Teacher's Programs (reusable Exercise routines /
 * "ridprogram") as observable state. Deep module: exposes `items`,
 * `loading`, `error` signals and `load` / `create` plus per-program
 * exercise composition signals. Mirrors LibraryService for Exercises —
 * same pattern, distinct entity.
 */
export class ProgramsService {
    readonly items = new Signal<Program[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    /** Exercises attached to the currently-edited Program, sort_order ASC. */
    readonly exercises = new Signal<ProgramExerciseRef[]>([]);
    /** Teacher's full Exercise library, used as the picker source. */
    readonly availableExercises = new Signal<Exercise[]>([]);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.programs.list());
        if (result) this.items.set(result);
    }

    /** Returns the created Program so the caller can land on its builder route. */
    async create(input: { title: string; description: string }): Promise<Program | null> {
        const result = await request(this.loading, this.error, () =>
            api.programs.create(input),
        );
        if (!result) return null;
        // listForTeacher is ordered created_at DESC — prepend.
        this.items.set([result, ...this.items.get()]);
        return result;
    }

    async get(id: string): Promise<Program | null> {
        const result = await request(this.loading, this.error, () => api.programs.get({ id }));
        return result ?? null;
    }

    async update(id: string, patch: { title?: string; description?: string }): Promise<Program | null> {
        const result = await request(this.loading, this.error, () =>
            api.programs.update({ id, ...patch }),
        );
        if (!result) return null;
        this.items.set(this.items.get().map((p) => p.id === id ? result : p));
        return result;
    }

    /**
     * Archive, not delete — and named for what it does.
     *
     * The endpoint is `DELETE /programs/:id` and the HTTP verb deliberately
     * lies: the handler calls `ProgramService.archive`, because past Lessons
     * and Training Sessions reference the Program through `lesson_program` /
     * `source_program_id` to render their "från program X" provenance, and a
     * cascade would erase it. The Program leaves this list and every picker; the
     * provenance on occasions that already copied it survives. Any copy this
     * method backs has to say that.
     */
    async archive(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.programs.delete({ id }));
        if (!result) return false;
        this.items.set(this.items.get().filter((p) => p.id !== id));
        return true;
    }

    /**
     * One Program's Exercises, returned rather than published to `exercises`.
     *
     * The `exercises` signal belongs to the Program currently open in the
     * builder. The list view needs a count for every row, and writing each
     * answer into that shared signal would leave it holding whichever request
     * happened to finish last — a builder opened straight afterwards would paint
     * another Program's rows. It also deliberately does NOT swallow a failure
     * into `[]` — the caller distinguishes "no answer" from "no exercises" and
     * asks through `Promise.allSettled`, so a rejection has to stay a rejection.
     */
    async exercisesOf(programId: string): Promise<ProgramExerciseRef[]> {
        return api.programs.listExercises({ id: programId });
    }

    async loadExercises(programId: string): Promise<void> {
        const result = await request(this.loading, this.error, () =>
            api.programs.listExercises({ id: programId }),
        );
        this.exercises.set(result ?? []);
    }

    /**
     * The picker source.
     *
     * The builder no longer derives "this Exercise was archived" from absence
     * here — rows carry `archivedAt` — so this set is now only what the add
     * picker may offer.
     *
     * It still returns whether the library actually answered, and still does NOT
     * publish `[]` on failure: the picker's explanatory sentence must be able to
     * tell "your library is empty" from "the library did not reply", and only
     * this distinction lets it.
     */
    async loadAvailableExercises(): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.exercises.list());
        if (!result) return false;
        this.availableExercises.set(result);
        return true;
    }

    /** Returns true on success; refreshes the exercises signal so the UI updates. */
    async addExerciseToProgram(programId: string, exerciseId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.programs.addExercise({ id: programId, exerciseId }),
        );
        if (!result) return false;
        await this.loadExercises(programId);
        return true;
    }

    async reorderExercises(programId: string, exerciseIds: string[]): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.programs.reorderExercises({ id: programId, exerciseIds }),
        );
        if (!result) return false;
        await this.loadExercises(programId);
        return true;
    }

    /**
     * Rewrite one row's instructional note (IA §3.6). Blank clears it — the
     * builder sends the trimmed draft and the server stores null for empty, so
     * "no note" has exactly one representation.
     */
    async updateExerciseNotes(
        programId: string,
        exerciseId: string,
        notes: string | null,
    ): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.programs.updateExerciseNotes({ id: programId, exerciseId, notes }),
        );
        if (!result) return false;
        await this.loadExercises(programId);
        return true;
    }

    async removeExercise(programId: string, exerciseId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.programs.removeExercise({ id: programId, exerciseId }),
        );
        if (!result) return false;
        await this.loadExercises(programId);
        return true;
    }
}
