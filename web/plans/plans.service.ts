import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Plan, type PlanDetail } from '../api';

/**
 * Owns the current Student's Plans as observable state. Deep module: exposes
 * `items`, `loading`, `error` signals and the mutations.
 *
 * `items` is the OWNER's list — `GET /plans` is scoped to the authenticated
 * user — while `loadDetail` also resolves a Plan belonging to a Student the
 * reader teaches. Ownership is therefore a per-plan question (`studentId ===
 * me`), answered by the view, not a property of this list.
 */
export class PlansService {
    readonly items = new Signal<Plan[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.plans.list());
        if (result) this.items.set(result);
    }

    /**
     * Plan metadata plus its linked Goals, Lessons and Training Sessions.
     *
     * The `goals` array is **privacy-filtered by the server**: a connected
     * Teacher receives only the Goals individually shared with them, the owner
     * receives all. Callers must therefore treat it as "what this reader may
     * see", never as "what is attached" — see `linkedGoalIds` in `plan-copy.ts`
     * for the question it cannot answer.
     */
    async loadDetail(id: string): Promise<PlanDetail | null> {
        const result = await request(this.loading, this.error, () => api.plans.get({ id }));
        return result ?? null;
    }

    /**
     * Create a Plan — IA §3.11 "Creation", in one call.
     *
     * `POST /plans` takes the title, description, both dates and the Primary
     * Teacher together, so there is no follow-up PATCH and therefore no
     * partial-success state: a Plan either exists complete or was never
     * created. That is why this returns the Plan rather than a boolean — the
     * create view navigates to what it just made — and why it can honestly show
     * a plain success.
     */
    async create(input: {
        title: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        primaryTeacherId?: string;
    }): Promise<Plan | null> {
        const result = await request(this.loading, this.error, () => api.plans.create(input));
        if (!result) return null;
        // The server orders active before archived, so a new Plan belongs at the
        // head of the active run rather than at the head of the whole list.
        const list = this.items.get();
        const insertAt = list.findIndex((p) => p.status === 'archived');
        this.items.set(insertAt === -1
            ? [result, ...list]
            : [...list.slice(0, insertAt), result, ...list.slice(insertAt)]);
        return result;
    }

    async update(id: string, patch: {
        title?: string;
        description?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        primaryTeacherId?: string | null;
    }): Promise<Plan | null> {
        const result = await request(this.loading, this.error, () => api.plans.update({ id, ...patch }));
        if (!result) return null;
        this.items.set(this.items.get().map((p) => p.id === id ? result : p));
        return result;
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
