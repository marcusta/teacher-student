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

    async create(input: { name: string; description: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.exercises.create(input),
        );
        if (!result) return false;
        // listForTeacher is ordered created_at DESC — prepend.
        this.items.set([result, ...this.items.get()]);
        return true;
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
}
