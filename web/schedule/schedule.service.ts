import { Signal } from '@basics/core/client/core';
import { api, ApiError, type Activity, type ScheduleWeek, type StableSummary, type StableDetail, type HorseLog } from '../api';
import { addDays } from '../../shared/schedule-calendar';

export function scheduleErrorKey(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 401) return 'schedule.error.session';
        if (error.status === 404) return 'schedule.error.not_found';
        if (error.status === 403) return 'schedule.error.forbidden';
        if (error.status === 400) return 'schedule.error.validation';
        const known = ['version_conflict', 'horse_inactive', 'member_inactive', 'type_inactive', 'invalid_date', 'invalid_time', 'nonexistent_time', 'ambiguous_time', 'invalid_offset', 'last_admin', 'invitation_pending', 'invitation_expired', 'already_assigned', 'catalog_unavailable', 'training_student_required', 'training_already_linked', 'invalid_targets', 'source_changed', 'request_conflict', 'monday_required', 'invalid_duration', 'activity_cancelled', 'invalid_scope', 'type_in_use'];
        if (known.includes(error.message)) return 'schedule.error.' + error.message;
    }
    return 'schedule.error.generic';
}

export class ScheduleService {
    readonly stables = new Signal<StableSummary[]>([]);
    readonly week = new Signal<ScheduleWeek | null>(null);
    readonly detail = new Signal<StableDetail | null>(null);
    readonly log = new Signal<HorseLog | null>(null);
    readonly loading = new Signal(false);
    readonly loaded = new Signal(false);
    readonly error = new Signal<string | null>(null);
    readonly saving = new Signal(false);
    readonly writeError = new Signal<string | null>(null);
    private readGeneration = 0;
    private account = '';

    bindAccount(id: string): void {
        if (id === this.account) return;
        this.account = id;
        this.readGeneration++;
        this.stables.set([]); this.week.set(null); this.detail.set(null); this.log.set(null);
        this.loaded.set(false); this.error.set(null); this.writeError.set(null); this.loading.set(false); this.saving.set(false);
    }

    async loadStables(): Promise<void> {
        const account = this.account;
        this.loading.set(true); this.error.set(null);
        try { const result = await api.stables.list(); if (account === this.account) { this.stables.set(result); this.loaded.set(true); } }
        catch (error) { if (account === this.account) this.error.set(scheduleErrorKey(error)); }
        finally { if (account === this.account) { this.loaded.set(true); this.loading.set(false); } }
    }

    async loadWeek(stableId: string, startDate: string): Promise<void> {
        const generation = ++this.readGeneration;
        this.loading.set(true); this.error.set(null);
        if (this.week.get()?.stable.id !== stableId) this.week.set(null);
        try {
            const week = await api.stableActivities.week({ stableId, startDate });
            if (generation !== this.readGeneration) return;
            this.week.set(week); this.detail.set(week.stable);
        } catch (error) { if (generation === this.readGeneration) this.readError(error); }
        finally { if (generation === this.readGeneration) this.loading.set(false); }
    }

    async loadLog(stableId: string, horseId: string, from?: string, to?: string, append = false): Promise<void> {
        const generation = ++this.readGeneration;
        this.loading.set(true); this.error.set(null);
        if (!append) this.log.set(null);
        try {
            const [detail, log] = await Promise.all([api.stables.detail({ stableId }), api.stableActivities.log({ stableId, horseId, from: from || undefined, to: to || undefined, cursor: append ? this.log.get()?.nextCursor ?? undefined : undefined })]);
            if (generation !== this.readGeneration) return;
            this.detail.set(detail);
            this.log.set(append ? { ...log, items: [...(this.log.get()?.items ?? []), ...log.items] } : log);
        } catch (error) { if (generation === this.readGeneration) this.readError(error); }
        finally { if (generation === this.readGeneration) this.loading.set(false); }
    }

    async write<T>(operation: () => Promise<T>): Promise<T | undefined> {
        if (this.saving.get()) return undefined;
        const account = this.account;
        this.saving.set(true); this.writeError.set(null);
        try { const result = await operation(); return account === this.account ? result : undefined; }
        catch (error) { if (account === this.account) this.writeError.set(scheduleErrorKey(error)); return undefined; }
        finally { if (account === this.account) this.saving.set(false); }
    }

    private readError(error: unknown): void {
        const key = scheduleErrorKey(error);
        this.error.set(key);
        if (['schedule.error.session', 'schedule.error.not_found', 'schedule.error.forbidden'].includes(key)) {
            this.week.set(null); this.detail.set(null); this.log.set(null);
        }
    }

    merge(activity: Activity): void {
        const week = this.week.get();
        if (week?.stable.id === activity.stableId) {
            const activities = week.activities.filter(a => a.id !== activity.id);
            if (activity.date >= week.startDate && activity.date < addDays(week.startDate, 7)) activities.push(activity);
            this.week.set({ ...week, activities, total: activities.length, completed: activities.filter(a => a.status === 'completed').length, unassigned: activities.filter(a => a.status !== 'cancelled' && !a.assigneeIds.length).length });
        }
    }
}
