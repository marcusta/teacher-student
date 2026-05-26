import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Plan, type PlanDetail } from '../api';

/**
 * Owns the current Student's Plans as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals and CRUD helpers.
 */
export class PlansService {
    readonly items = new Signal<Plan[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.plans.list());
        if (result) this.items.set(result);
    }

    async loadDetail(id: string): Promise<PlanDetail | null> {
        const result = await request(this.loading, this.error, () => api.plans.get({ id }));
        return result ?? null;
    }

    async create(input: { title: string; description?: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.plans.create(input));
        if (!result) return false;
        const list = this.items.get();
        const insertAt = list.findIndex((p) => p.status === 'archived');
        const next = insertAt === -1 ? [result, ...list] : [...list.slice(0, insertAt), result, ...list.slice(insertAt)];
        this.items.set(next);
        return true;
    }

    async update(id: string, patch: {
        title?: string;
        description?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        primaryTeacherId?: string | null;
    }): Promise<PlanDetail | null> {
        const result = await request(this.loading, this.error, () => api.plans.update({ id, ...patch }));
        if (!result) return null;
        this.items.set(this.items.get().map((p) => p.id === id ? result : p));
        return this.loadDetail(id);
    }

    async archive(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.plans.archive({ id }));
        if (!result) return false;
        this.items.set(this.items.get().map((p) =>
            p.id === id ? { ...p, status: 'archived' as const } : p,
        ));
        return true;
    }
}
