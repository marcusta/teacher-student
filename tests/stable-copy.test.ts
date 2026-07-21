import { test, expect } from 'bun:test';
import { activeHorses, horseRowKey, isArchived, stableState } from '../web/stable/stable-copy';
import type { Horse } from '../web/api';

// See tests/library-copy.test.ts for why these rules live outside the component
// module. Nothing here reads the catalogs, so no locale is selected.

function horse(over: Partial<Horse> = {}): Horse {
    return {
        id: 'h-1',
        studentId: 'student-1',
        name: 'Caspian',
        archivedAt: null,
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
        ...over,
    };
}

test('archived Horses never reach the stable, whatever the endpoint returns', () => {
    const horses = [
        horse({ id: 'a' }),
        horse({ id: 'b', archivedAt: '2026-07-10T00:00:00.000Z' }),
    ];
    expect(activeHorses(horses).map((h) => h.id)).toEqual(['a']);
});

test('Horses are newest first (§3.15), regardless of arrival order', () => {
    const horses = [
        horse({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
        horse({ id: 'new', createdAt: '2026-07-01T00:00:00.000Z' }),
        horse({ id: 'mid', createdAt: '2026-04-01T00:00:00.000Z' }),
    ];
    expect(activeHorses(horses).map((h) => h.id)).toEqual(['new', 'mid', 'old']);
});

test('activeHorses never mutates the caller’s array', () => {
    const horses = [
        horse({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
        horse({ id: 'new', createdAt: '2026-07-01T00:00:00.000Z' }),
    ];
    activeHorses(horses);
    expect(horses.map((h) => h.id)).toEqual(['old', 'new']);
});

test('isArchived reads the timestamp, not a truthiness accident', () => {
    expect(isArchived(horse())).toBe(false);
    expect(isArchived(horse({ archivedAt: '2026-07-10T00:00:00.000Z' }))).toBe(true);
});

test('a failed fetch is an error, never an empty stable', () => {
    expect(stableState({ loading: false, failed: true, count: 0 })).toBe('error');
    // And it stays an error even mid-retry, so the empty copy cannot flash.
    expect(stableState({ loading: true, failed: true, count: 0 })).toBe('error');
});

test('loading wins over empty, so a cold view never flashes “inga hästar”', () => {
    expect(stableState({ loading: true, failed: false, count: 0 })).toBe('loading');
});

test('empty and rows are the two settled outcomes', () => {
    expect(stableState({ loading: false, failed: false, count: 0 })).toBe('empty');
    expect(stableState({ loading: false, failed: false, count: 3 })).toBe('rows');
});

test('the row key changes when the rendered name does', () => {
    expect(horseRowKey(horse())).toBe(horseRowKey(horse()));
    expect(horseRowKey(horse())).not.toBe(horseRowKey(horse({ name: 'Luna' })));
});
