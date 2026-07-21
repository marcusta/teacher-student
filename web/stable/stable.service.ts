import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Horse } from '../api';

/**
 * Owns the current Student's stable of Horses as observable state. Deep
 * module: exposes `items`, `loading`, `error` signals and `load` / `create`.
 * Hides the HTTP calls and post-create list mutation so the component
 * doesn't have to coordinate them.
 */
export class StableService {
    readonly items = new Signal<Horse[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.horses.list());
        if (result) this.items.set(result);
    }

    /** Returns the created Horse so the caller can name it in a confirmation. */
    async create(input: { name: string }): Promise<Horse | null> {
        const result = await request(this.loading, this.error, () =>
            api.horses.create(input),
        );
        if (!result) return null;
        // listForStudent is ordered created_at DESC — prepend.
        this.items.set([result, ...this.items.get()]);
        return result;
    }

    async get(id: string): Promise<Horse | null> {
        const result = await request(this.loading, this.error, () => api.horses.get({ id }));
        return result ?? null;
    }

    async update(id: string, patch: { name?: string }): Promise<Horse | null> {
        const result = await request(this.loading, this.error, () =>
            api.horses.update({ id, ...patch }),
        );
        if (!result) return null;
        this.items.set(this.items.get().map((h) => h.id === id ? result : h));
        return result;
    }

    /**
     * Archive, not delete — and already named for what it does.
     *
     * The endpoint is `DELETE /horses/:id` and the HTTP verb deliberately lies:
     * `horses.api.ts` calls `HorseService.archive`, because Lessons and Training
     * Sessions that reference a Horse have to survive its removal. The Horse
     * leaves this list and every picker for NEW occasions; it stays attached to
     * the ones already ridden. Any copy this method backs has to say that.
     */
    async archive(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.horses.delete({ id }));
        if (!result) return false;
        this.items.set(this.items.get().filter((h) => h.id !== id));
        return true;
    }
}
