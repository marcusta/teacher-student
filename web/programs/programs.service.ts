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

    async create(input: { title: string; description: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.programs.create(input),
        );
        if (!result) return false;
        // listForTeacher is ordered created_at DESC — prepend.
        this.items.set([result, ...this.items.get()]);
        return true;
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

    async delete(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.programs.delete({ id }));
        if (!result) return false;
        this.items.set(this.items.get().filter((p) => p.id !== id));
        return true;
    }

    async loadExercises(programId: string): Promise<void> {
        const result = await request(this.loading, this.error, () =>
            api.programs.listExercises({ id: programId }),
        );
        this.exercises.set(result ?? []);
    }

    async loadAvailableExercises(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.exercises.list());
        this.availableExercises.set(result ?? []);
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

    async removeExercise(programId: string, exerciseId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.programs.removeExercise({ id: programId, exerciseId }),
        );
        if (!result) return false;
        await this.loadExercises(programId);
        return true;
    }
}
