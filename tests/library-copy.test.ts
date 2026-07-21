import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    DEFAULT_LIBRARY_TAB,
    LIBRARY_TABS,
    PROGRAM_LIST_REDIRECT,
    SEARCH_THRESHOLD,
    descriptionExcerpt,
    exerciseCountLabel,
    exerciseHistoryHref,
    exerciseListState,
    exerciseRowKey,
    filterExercises,
    libraryTabHref,
    libraryTabLabel,
    matchesQuery,
    resolveLibraryTab,
    shouldOfferSearch,
} from '../web/library/library-copy';
import type { Exercise } from '../web/api';

// Importing the app's i18n module is what registers the catalogs; the component
// modules themselves cannot be imported here because `web/theme.ts` writes a
// <style> at import time and there is no DOM in this process. That is why the
// rules under test live in `library-copy.ts` rather than inside the components.
await import('../web/i18n');

// Swedish is the source of truth (UI_DECISIONS §4), and it is what these
// assertions are written against. Registering the catalogs does not select a
// locale — that would otherwise come from the host environment.
setLocale('sv');

function exercise(over: Partial<Exercise> = {}): Exercise {
    return {
        id: 'ex-1',
        teacherId: 'teacher-1',
        name: 'Övergångar galopp–trav',
        description: '',
        archivedAt: null,
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
        ...over,
    };
}

// ─── Tabs ───────────────────────────────────────────────────────

test('Bibliotek has exactly two tabs, Övningar first', () => {
    expect([...LIBRARY_TABS]).toEqual(['ovningar', 'program']);
    expect(DEFAULT_LIBRARY_TAB).toBe('ovningar');
});

test('resolveLibraryTab falls back to Övningar for unknown, absent and empty', () => {
    expect(resolveLibraryTab('program')).toBe('program');
    expect(resolveLibraryTab('ovningar')).toBe('ovningar');
    expect(resolveLibraryTab('planer')).toBe('ovningar');
    expect(resolveLibraryTab(undefined)).toBe('ovningar');
    expect(resolveLibraryTab('')).toBe('ovningar');
});

test('the default tab has the bare address; the second is linkable via ?flik=', () => {
    expect(libraryTabHref('ovningar')).toBe('/library');
    expect(libraryTabHref('program')).toBe('/library?flik=program');
});

test('every tab href round-trips back to the tab it addresses', () => {
    for (const tab of LIBRARY_TABS) {
        const query = libraryTabHref(tab).split('?')[1];
        const value = query ? new URLSearchParams(query).get('flik') ?? undefined : undefined;
        expect(resolveLibraryTab(value)).toBe(tab);
    }
});

test('tab labels come from the catalog, not from the URL keys', () => {
    expect(libraryTabLabel('ovningar')).toBe('Övningar');
    expect(libraryTabLabel('program')).toBe('Program');
});

test('the old bare /program list address forwards into the Program tab', () => {
    expect(PROGRAM_LIST_REDIRECT).toBe('/library?flik=program');
    const value = new URLSearchParams(PROGRAM_LIST_REDIRECT.split('?')[1]!).get('flik')!;
    expect(resolveLibraryTab(value)).toBe('program');
});

// ─── Description excerpt ────────────────────────────────────────

test('an absent or blank description yields no excerpt at all', () => {
    expect(descriptionExcerpt(null)).toBe('');
    expect(descriptionExcerpt(undefined)).toBe('');
    expect(descriptionExcerpt('   ')).toBe('');
});

test('a short description passes through, with whitespace collapsed', () => {
    expect(descriptionExcerpt('Fem  reps\nper varv')).toBe('Fem reps per varv');
});

test('a long description is clipped on a word boundary and ellipsised', () => {
    const long = 'ord '.repeat(80).trim();
    const excerpt = descriptionExcerpt(long);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(141);
    // Never mid-word: the character before the ellipsis closes a word.
    expect(excerpt.slice(-2, -1)).not.toBe(' ');
});

test('a single unbroken word longer than the limit is still clipped', () => {
    const excerpt = descriptionExcerpt('x'.repeat(400));
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(141);
});

// ─── Search ─────────────────────────────────────────────────────

test('search is offered only once the library has volume (§3.5)', () => {
    expect(shouldOfferSearch(0)).toBe(false);
    expect(shouldOfferSearch(SEARCH_THRESHOLD - 1)).toBe(false);
    expect(shouldOfferSearch(SEARCH_THRESHOLD)).toBe(true);
});

test('matching ignores case and diacritics', () => {
    expect(matchesQuery('Övergångar galopp', 'overgang')).toBe(true);
    expect(matchesQuery('Övergångar galopp', 'ÖVERGÅNG')).toBe(true);
    expect(matchesQuery('Övergångar galopp', 'serpentin')).toBe(false);
});

test('an empty or whitespace query matches everything', () => {
    expect(matchesQuery('vad som helst', '')).toBe(true);
    expect(matchesQuery('vad som helst', '   ')).toBe(true);
});

test('filtering searches the description as well as the name', () => {
    const items = [
        exercise({ id: 'a', name: 'Serpentiner', description: 'tre bågar' }),
        exercise({ id: 'b', name: 'Cavaletti', description: 'på volt' }),
    ];
    expect(filterExercises(items, 'bågar').map((e) => e.id)).toEqual(['a']);
    expect(filterExercises(items, 'volt').map((e) => e.id)).toEqual(['b']);
    expect(filterExercises(items, '').map((e) => e.id)).toEqual(['a', 'b']);
});

test('filtering returns a copy, never the caller’s array', () => {
    const items = [exercise()];
    expect(filterExercises(items, '')).not.toBe(items);
});

// ─── List state ─────────────────────────────────────────────────

test('a failed fetch is an error, never an empty library — even while loading', () => {
    expect(exerciseListState({ loading: true, failed: true, total: 0, visible: 0 }))
        .toBe('error');
    expect(exerciseListState({ loading: false, failed: true, total: 0, visible: 0 }))
        .toBe('error');
});

test('an empty library and a search that matched nothing are different states', () => {
    expect(exerciseListState({ loading: false, failed: false, total: 0, visible: 0 }))
        .toBe('empty');
    expect(exerciseListState({ loading: false, failed: false, total: 12, visible: 0 }))
        .toBe('noMatches');
});

test('loading wins over empty, so a cold view never flashes “no exercises”', () => {
    expect(exerciseListState({ loading: true, failed: false, total: 0, visible: 0 }))
        .toBe('loading');
});

test('rows render once there is something visible', () => {
    expect(exerciseListState({ loading: false, failed: false, total: 3, visible: 2 }))
        .toBe('rows');
});

// ─── History entry ──────────────────────────────────────────────

test('the history link carries the Exercise detail as its encoded return path', () => {
    const href = exerciseHistoryHref('student-9', 'ex-4');
    expect(href.startsWith('/students/student-9/exercises/ex-4/history?')).toBe(true);
    const from = new URLSearchParams(href.split('?')[1]!).get('from');
    expect(from).toBe('/library/ex-4');
});

// ─── Misc ───────────────────────────────────────────────────────

test('the Exercise count is pluralised, not interpolated into one form', () => {
    expect(exerciseCountLabel(1)).toBe('1 övning');
    expect(exerciseCountLabel(4)).toBe('4 övningar');
    expect(exerciseCountLabel(0)).toBe('0 övningar');
});

test('the row key changes when the rendered content does', () => {
    const base = exercise();
    expect(exerciseRowKey(base)).toBe(exerciseRowKey(exercise()));
    expect(exerciseRowKey(base)).not.toBe(exerciseRowKey(exercise({ name: 'Annat' })));
    expect(exerciseRowKey(base)).not.toBe(exerciseRowKey(exercise({ description: 'ny' })));
});
