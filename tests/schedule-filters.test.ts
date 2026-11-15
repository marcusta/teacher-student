import { test, expect } from 'bun:test';
import { DEFAULT_FILTERS, filterActivities, horseLanes, readPreferences, savePreferences } from '../web/schedule/schedule-copy';

const activities = [
    { id: 'stable', horseId: null, status: 'planned' as const, assigneeIds: ['me'] },
    { id: 'saga', horseId: 'saga', status: 'completed' as const, assigneeIds: ['me', 'other'] },
    { id: 'atlas', horseId: 'atlas', status: 'planned' as const, assigneeIds: [] },
    { id: 'cancelled', horseId: 'atlas', status: 'cancelled' as const, assigneeIds: [] },
];

test('scope, mine, status and unassigned filters combine across both schedules', () => {
    expect(filterActivities(activities, DEFAULT_FILTERS, 'me')).toHaveLength(4);
    expect(filterActivities(activities, { ...DEFAULT_FILTERS, scope: 'stable' }, 'me').map(a => a.id)).toEqual(['stable']);
    expect(filterActivities(activities, { ...DEFAULT_FILTERS, scope: 'horses', mine: true }, 'me').map(a => a.id)).toEqual(['saga']);
    expect(filterActivities(activities, { ...DEFAULT_FILTERS, unassigned: true }, 'me').map(a => a.id)).toEqual(['atlas']);
    expect(filterActivities(activities, { ...DEFAULT_FILTERS, unassigned: true, mine: true }, 'me')).toEqual([]);
    expect(filterActivities(activities, { ...DEFAULT_FILTERS, scope: 'horse:atlas', status: 'remaining' }, 'me').map(a => a.id)).toEqual(['atlas']);
    const horses = [{ id: 'saga', active: true }, { id: 'atlas', active: true }, { id: 'empty', active: true }];
    expect(horseLanes(horses, activities, DEFAULT_FILTERS)).toHaveLength(3);
    expect(horseLanes(horses, [], { ...DEFAULT_FILTERS, scope: 'horse:atlas', mine: true }).map(h => h.id)).toEqual(['atlas']);
});

test('preferences survive reloads per user and stable and reject invalid dates and horse IDs', () => {
    const memory = new Map<string, string>();
    const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
    savePreferences('me', 'stable', { filters: { ...DEFAULT_FILTERS, scope: 'horse:saga', mine: true }, startDate: '2026-11-16', dayIndex: 2 }, storage);
    expect(readPreferences('me', 'stable', ['saga'], '2026-11-23', storage).filters.mine).toBe(true);
    expect(readPreferences('other', 'stable', ['saga'], '2026-11-23', storage).filters.mine).toBe(false);
    expect(readPreferences('me', 'stable', [], '2026-11-23', storage).filters.scope).toBe('all');
});
