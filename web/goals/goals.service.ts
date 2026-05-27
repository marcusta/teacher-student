import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Goal, type GoalTeacherView } from '../api';

const STATUS_ORDER: Record<Goal['status'], number> = {
    active: 0,
    achieved: 1,
    abandoned: 2,
};

function sortGoals(list: Goal[]): Goal[] {
    return [...list].sort((a, b) => {
        const sd = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (sd !== 0) return sd;
        return b.createdAt.localeCompare(a.createdAt);
    });
}

/**
 * Owns the current Student's Goals as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals and CRUD helpers.
 */
export class GoalsService {
    readonly items = new Signal<Goal[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.goals.list());
        if (result) this.items.set(sortGoals(result));
    }

    async loadDetail(id: string): Promise<GoalTeacherView | null> {
        const result = await request(this.loading, this.error, () => api.goals.get({ id }));
        return result ?? null;
    }

    async create(input: {
        title: string;
        description?: string;
        targetDate?: string;
    }): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.goals.create(input));
        if (!result) return false;
        this.items.set(sortGoals([result, ...this.items.get()]));
        return true;
    }

    async update(id: string, patch: {
        title?: string;
        description?: string | null;
        targetDate?: string | null;
    }): Promise<Goal | null> {
        const result = await request(this.loading, this.error, () => api.goals.update({ id, ...patch }));
        if (!result) return null;
        this.items.set(sortGoals(this.items.get().map((g) => g.id === id ? result : g)));
        return result;
    }

    async achieve(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.goals.achieve({ id }));
        if (!result) return false;
        const now = new Date().toISOString();
        this.items.set(sortGoals(this.items.get().map((g) =>
            g.id === id && g.status !== 'achieved'
                ? { ...g, status: 'achieved' as const, achievedAt: g.achievedAt ?? now }
                : g,
        )));
        return true;
    }

    async reopen(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.goals.reopen({ id }));
        if (!result) return false;
        this.items.set(sortGoals(this.items.get().map((g) =>
            g.id === id ? { ...g, status: 'active' as const, achievedAt: null } : g,
        )));
        return true;
    }

    async abandon(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.goals.abandon({ id }));
        if (!result) return false;
        this.items.set(sortGoals(this.items.get().map((g) =>
            g.id === id ? { ...g, status: 'abandoned' as const } : g,
        )));
        return true;
    }

    async share(goalId: string, teacherId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.share({ id: goalId, teacherId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().map((g) => {
            if (g.id !== goalId || g.sharedTeacherIds.includes(teacherId)) return g;
            return { ...g, sharedTeacherIds: [...g.sharedTeacherIds, teacherId] };
        }));
        return true;
    }

    async attachPlan(goalId: string, planId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.attachPlan({ id: goalId, planId }),
        );
        return result !== null;
    }

    async detachPlan(goalId: string, planId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.detachPlan({ id: goalId, planId }),
        );
        return result !== null;
    }

    async unshare(goalId: string, teacherId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.unshare({ id: goalId, teacherId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().map((g) => {
            if (g.id !== goalId) return g;
            return {
                ...g,
                sharedTeacherIds: g.sharedTeacherIds.filter((id) => id !== teacherId),
            };
        }));
        return true;
    }
}
