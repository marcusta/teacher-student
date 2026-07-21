import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Exercise } from '../api';

/**
 * Owns the current Teacher's Library as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals and `load` / `create`.
 * Hides the HTTP calls and post-create list mutation so the component
 * doesn't have to coordinate them.
 */
export class LibraryService {
    readonly items = new Signal<Exercise[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.exercises.list());
        if (result) this.items.set(result);
    }

    /** Returns the created Exercise so the caller can land on its detail route. */
    async create(input: { name: string; description: string }): Promise<Exercise | null> {
        const result = await request(this.loading, this.error, () =>
            api.exercises.create(input),
        );
        if (!result) return null;
        // listForTeacher is ordered created_at DESC — prepend.
        this.items.set([result, ...this.items.get()]);
        return result;
    }

    async get(id: string): Promise<Exercise | null> {
        const result = await request(this.loading, this.error, () => api.exercises.get({ id }));
        return result ?? null;
    }

    async update(id: string, patch: { name?: string; description?: string }): Promise<Exercise | null> {
        const result = await request(this.loading, this.error, () =>
            api.exercises.update({ id, ...patch }),
        );
        if (!result) return null;
        this.items.set(this.items.get().map((e) => e.id === id ? result : e));
        return result;
    }

    /**
     * Archive, not delete — and named for what it does.
     *
     * The endpoint is `DELETE /exercises/:id` and the HTTP verb deliberately
     * lies: the handler calls `ExerciseService.archive`, because
     * `lesson_exercise` / `training_session_exercise` rows are the historical
     * record of what was ridden and the Notes hanging off them have no FK to
     * cascade through. The Exercise leaves this list and every picker; it stays
     * attached to every occasion that already used it. Any copy this method
     * backs has to say that.
     */
    async archive(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.exercises.delete({ id }));
        if (!result) return false;
        this.items.set(this.items.get().filter((e) => e.id !== id));
        return true;
    }
}
