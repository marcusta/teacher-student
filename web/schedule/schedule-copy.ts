import { calendarDate, mondayOf } from '../../shared/schedule-calendar';

export interface ScheduleFilters { scope: string; mine: boolean; status: 'all' | 'remaining' | 'completed'; unassigned: boolean }
export const DEFAULT_FILTERS: ScheduleFilters = { scope: 'all', mine: false, status: 'all', unassigned: false };
interface Filterable { horseId: string | null; status: 'planned' | 'completed' | 'cancelled'; assigneeIds: string[] }
export interface SchedulePreferences { filters: ScheduleFilters; startDate: string; dayIndex: number }
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const SCHEDULE_STORAGE_PREFIX = 'teacher-student:schedule:';

export function filterActivities<T extends Filterable>(activities: readonly T[], filters: ScheduleFilters, userId: string): T[] {
    return activities.filter(a =>
        (filters.scope === 'all' || (filters.scope === 'stable' && !a.horseId) || (filters.scope === 'horses' && !!a.horseId) || filters.scope === 'horse:' + a.horseId)
        && (!filters.mine || a.assigneeIds.includes(userId))
        && (!filters.unassigned || (!a.assigneeIds.length && a.status !== 'cancelled'))
        && (filters.status === 'all' || a.status === (filters.status === 'remaining' ? 'planned' : 'completed')),
    );
}

export function horseLanes<T extends { id: string; active: boolean }>(horses: readonly T[], visible: readonly Filterable[], filters: ScheduleFilters): T[] {
    if (filters.scope === 'stable') return [];
    return horses.filter(h => {
        if (filters.scope.startsWith('horse:')) return filters.scope === 'horse:' + h.id;
        const hasActivities = visible.some(a => a.horseId === h.id);
        if (filters.mine || filters.unassigned || filters.status !== 'all') return hasActivities;
        return h.active || hasActivities;
    });
}

function browserStorage(): Storage | undefined {
    try { return globalThis.sessionStorage; } catch { return undefined; }
}

export function readPreferences(userId: string, stableId: string, horseIds: string[], defaultStart: string, storage: PreferenceStorage | undefined = browserStorage()): SchedulePreferences {
    const fallback = { filters: { ...DEFAULT_FILTERS }, startDate: defaultStart, dayIndex: 0 };
    try {
        const value = JSON.parse(storage?.getItem(SCHEDULE_STORAGE_PREFIX + userId + ':' + stableId) ?? 'null');
        if (value?.version !== 1) return fallback;
        const filters = value.filters;
        const scope = ['all', 'stable', 'horses'].includes(filters?.scope) || horseIds.some(id => filters?.scope === 'horse:' + id) ? filters.scope : 'all';
        let startDate = defaultStart;
        try { if (mondayOf(calendarDate(value.startDate)) === value.startDate) startDate = value.startDate; } catch { /* Use this week for corrupt stored dates. */ }
        return { startDate, dayIndex: Number.isInteger(value.dayIndex) && value.dayIndex >= 0 && value.dayIndex <= 6 ? value.dayIndex : 0,
            filters: { scope, mine: filters?.mine === true, unassigned: filters?.unassigned === true, status: ['all', 'remaining', 'completed'].includes(filters?.status) ? filters.status : 'all' } };
    } catch { return fallback; }
}

export function savePreferences(userId: string, stableId: string, preferences: SchedulePreferences, storage: PreferenceStorage | undefined = browserStorage()): void {
    try { storage?.setItem(SCHEDULE_STORAGE_PREFIX + userId + ':' + stableId, JSON.stringify({ version: 1, ...preferences })); } catch { /* Scheduling remains usable when browser storage is disabled. */ }
}

export function clearSchedulePreferences(): void {
    try {
        const storage = browserStorage();
        if (!storage) return;
        const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => !!key?.startsWith(SCHEDULE_STORAGE_PREFIX));
        keys.forEach(key => storage.removeItem(key));
    } catch { /* Browser storage is optional. */ }
}

export function initials(name: string): string { return name.trim().split(/\s+/).slice(0, 2).map(word => word[0] ?? '').join('').toLocaleUpperCase(); }
export function activityOrder(a: { time: string | null; id: string }, b: { time: string | null; id: string }): number { return (a.time || '99:99').localeCompare(b.time || '99:99') || a.id.localeCompare(b.id); }
export function escapeHtml(value: unknown): string { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
