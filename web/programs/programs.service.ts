import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Program } from '../api';

/**
 * Owns the current Teacher's Programs (reusable Exercise routines /
 * "ridprogram") as observable state. Deep module: exposes `items`,
 * `loading`, `error` signals and `load` / `create`. Mirrors LibraryService
 * for Exercises — same pattern, distinct entity.
 */
export class ProgramsService {
    readonly items = new Signal<Program[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

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
}
