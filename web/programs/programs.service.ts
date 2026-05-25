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
}
