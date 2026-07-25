import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Goal, type GoalTeacherView, type SharedTeacherRef } from '../api';

/**
 * Owns the current user's Goals as observable state. Deep module: exposes
 * `items`, `loading`, `error` signals and the mutations.
 *
 * Goals belong to an account outright, with no Relation required (IA §3.13,
 * UI_DECISIONS §1), so nothing here is gated on having a teacher. `items` is
 * the OWNER's list; `loadDetail` also resolves a Goal shared with the reader,
 * in which case the server answers the reduced `GoalTeacherView` that omits
 * `sharedTeacherIds` — co-watchers are not visible to a shared Teacher, and
 * that is enforced by the shape of the response, not by the view.
 *
 * The list is NOT re-sorted here. `GoalService.listForStudent` already returns
 * active → achieved → abandoned, then `created_at DESC`, and `groupGoals` in
 * `goal-copy.ts` partitions that order without disturbing it. Sorting again on
 * the client would be a second, silently diverging spelling of the same rule.
 */
export class GoalsService {
    readonly items = new Signal<Goal[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.goals.list());
        if (result) this.items.set(result);
    }

    async loadDetail(id: string): Promise<GoalTeacherView | null> {
        const result = await request(this.loading, this.error, () => api.goals.get({ id }));
        return result ?? null;
    }

    /**
     * The Teachers this Goal is shared with, **by name**.
     *
     * `GET /goals/:id/shares` is owner-only (`assertGoalOwner`), so this is
     * called only when the reader owns the Goal. It is what makes §4.5's rule
     * satisfiable at all: the Goal itself carries teacher *ids*, and a chip
     * that cannot name its recipient is the bare "Delad" the spec forbids.
     */
    async loadShares(id: string): Promise<SharedTeacherRef[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.goals.listShares({ id }),
        );
        return result ?? null;
    }

    /**
     * Create a Goal — IA §3.13 "Creation", in one call. Returns the Goal so the
     * create view can land on what it just made; there is no follow-up write
     * and therefore no partial success to report.
     */
    async create(input: {
        title: string;
        description?: string;
        targetDate?: string;
        horseId?: string;
    }): Promise<Goal | null> {
        const result = await request(this.loading, this.error, () => api.goals.create(input));
        if (!result) return null;
        this.items.set([result, ...this.items.get()]);
        return result;
    }

    async update(id: string, patch: {
        title?: string;
        description?: string | null;
        targetDate?: string | null;
        horseId?: string | null;
    }): Promise<Goal | null> {
        const result = await request(this.loading, this.error, () => api.goals.update({ id, ...patch }));
        if (!result) return null;
        this.merge(result);
        return result;
    }

    /**
     * Transition to achieved. Allowed for the owner **and** a shared Teacher —
     * IA §3.14 gives both roles this verb.
     *
     * Answers 409 when the Goal is abandoned: abandoned cannot go directly to
     * achieved, it must be reopened first. The views withhold the control in
     * that state, so a 409 here means the view is stale, and it surfaces as a
     * conflict with a refresh path rather than as a generic failure.
     */
    async achieve(id: string): Promise<boolean> {
        return await request(this.loading, this.error, () => api.goals.achieve({ id })) !== undefined;
    }

    /** Transition back to active, clearing `achievedAt`. Owner or shared Teacher. */
    async reopen(id: string): Promise<boolean> {
        return await request(this.loading, this.error, () => api.goals.reopen({ id })) !== undefined;
    }

    /** Owner only — ending a Goal is a decision about what the rider trains for. */
    async abandon(id: string): Promise<boolean> {
        return await request(this.loading, this.error, () => api.goals.abandon({ id })) !== undefined;
    }

    async share(goalId: string, teacherId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.share({ id: goalId, teacherId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().map((g) =>
            g.id !== goalId || g.sharedTeacherIds.includes(teacherId)
                ? g
                : { ...g, sharedTeacherIds: [...g.sharedTeacherIds, teacherId] },
        ));
        return true;
    }

    async unshare(goalId: string, teacherId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.unshare({ id: goalId, teacherId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().map((g) =>
            g.id !== goalId
                ? g
                : { ...g, sharedTeacherIds: g.sharedTeacherIds.filter((id) => id !== teacherId) },
        ));
        return true;
    }

    async attachPlan(goalId: string, planId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.attachPlan({ id: goalId, planId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().map((g) =>
            g.id !== goalId || g.planIds.includes(planId)
                ? g
                : { ...g, planIds: [...g.planIds, planId] },
        ));
        return true;
    }

    async detachPlan(goalId: string, planId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.goals.detachPlan({ id: goalId, planId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().map((g) =>
            g.id !== goalId ? g : { ...g, planIds: g.planIds.filter((id) => id !== planId) },
        ));
        return true;
    }

    /** Resolve a loaded Goal — no round-trip. Only ever holds owned Goals. */
    get(id: string): Goal | null {
        return this.items.get().find((g) => g.id === id) ?? null;
    }

    /**
     * Replace one Goal in `items` in place, or prepend it.
     *
     * Updating from the response rather than refetching keeps the row the user
     * is looking at from flickering through a stale render, and it avoids the
     * trap `request()` sets: it clears `error` at the start of every call, so a
     * reload issued right after a failed write would erase the failure before
     * anyone could read it.
     */
    private merge(goal: Goal): void {
        const items = this.items.get();
        const at = items.findIndex((g) => g.id === goal.id);
        this.items.set(at === -1
            ? [goal, ...items]
            : [...items.slice(0, at), goal, ...items.slice(at + 1)]);
    }
}
