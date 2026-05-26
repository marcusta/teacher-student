import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Plan } from '../api';

/**
 * Owns the current Student's Plans as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals and `load` / `create`.
 */
export class PlansService {
    readonly items = new Signal<Plan[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.plans.list());
        if (result) this.items.set(result);
    }

    async create(input: { title: string; description?: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.plans.create(input));
        if (!result) return false;
        // listForStudent orders active before archived, then created_at DESC.
        const list = this.items.get();
        const insertAt = list.findIndex((p) => p.status === 'archived');
        const next = insertAt === -1 ? [result, ...list] : [...list.slice(0, insertAt), result, ...list.slice(insertAt)];
        this.items.set(next);
        return true;
    }
}
