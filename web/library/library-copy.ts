import { plural, t } from '../i18n';
import type { Exercise } from '../api';

/**
 * Bibliotek — the DOM-free rules behind IA §3.5 (Övningar) and §3.6 (Program).
 *
 * Lives outside the component modules for the reason `goal-copy.ts` states:
 * `web/theme.ts` writes a `<style>` element at import time, so anything that
 * transitively imports a component cannot load in the test process. Every rule
 * that is worth asserting therefore lives here and is asserted directly.
 */

/**
 * The two tabs of the single Bibliotek destination (IA §3.5/§3.6: "Bibliotek
 * contains two tabs: Övningar and Program").
 *
 * The keys ARE the URL vocabulary (`?flik=program`), following the convention
 * `student-detail.component.ts` established, so they are Swedish and stable.
 * Renaming one breaks every link anyone has saved.
 */
export const LIBRARY_TABS = ['ovningar', 'program'] as const;

export type LibraryTab = (typeof LIBRARY_TABS)[number];

export const DEFAULT_LIBRARY_TAB: LibraryTab = 'ovningar';

/**
 * Resolve `?flik=` to a tab. Unknown or absent lands on Övningar rather than on
 * a blank panel — a mistyped link should still arrive somewhere useful.
 */
export function resolveLibraryTab(value: string | undefined): LibraryTab {
    return LIBRARY_TABS.includes(value as LibraryTab) ? (value as LibraryTab) : DEFAULT_LIBRARY_TAB;
}

/**
 * The linkable address of one tab. The default tab has the bare address so the
 * canonical `/library` never carries a redundant query.
 */
export function libraryTabHref(tab: LibraryTab): string {
    return tab === DEFAULT_LIBRARY_TAB ? '/library' : `/library?flik=${tab}`;
}

const TAB_KEYS: Record<LibraryTab, string> = {
    ovningar: 'library.tab.exercises',
    program: 'library.tab.programs',
};

export function libraryTabLabel(tab: LibraryTab): string {
    return t(TAB_KEYS[tab]);
}

/**
 * `/program` is kept resolving (the IA calls merging Programs under Bibliotek
 * "frontend navigation" and explicitly does not require route migration), but
 * Bibliotek is now the real destination — so the bare list address forwards to
 * the tab that replaced it. The `/program/:id` builder and `/program/nytt`
 * creation routes are untouched and keep their own addresses.
 */
export const PROGRAM_LIST_REDIRECT = '/library?flik=program';

/** Row excerpt for a description (§3.5 "name, description excerpt"). */
const EXCERPT_MAX = 140;

export function descriptionExcerpt(description: string | null | undefined): string {
    const text = (description ?? '').trim().replace(/\s+/g, ' ');
    if (text === '') return '';
    if (text.length <= EXCERPT_MAX) return text;
    // Cut on a word boundary when there is one near the limit, so the ellipsis
    // does not land mid-word.
    const clipped = text.slice(0, EXCERPT_MAX);
    const lastSpace = clipped.lastIndexOf(' ');
    const body = lastSpace > EXCERPT_MAX - 24 ? clipped.slice(0, lastSpace) : clipped;
    return `${body.trimEnd()}…`;
}

/**
 * §3.5 asks for "search/filter **when volume requires it**". Below this many
 * rows the whole library is on one screen and a search box is furniture that
 * costs a tab stop and teaches nothing.
 */
export const SEARCH_THRESHOLD = 8;

export function shouldOfferSearch(count: number): boolean {
    return count >= SEARCH_THRESHOLD;
}

/** Case- and diacritic-tolerant contains, over name AND description. */
function normalize(value: string): string {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('sv');
}

export function matchesQuery(haystack: string, query: string): boolean {
    const needle = normalize(query.trim());
    if (needle === '') return true;
    return normalize(haystack).includes(needle);
}

export function filterExercises(items: readonly Exercise[], query: string): Exercise[] {
    if (query.trim() === '') return [...items];
    return items.filter((e) => matchesQuery(`${e.name} ${e.description}`, query));
}

/**
 * Search that matches nothing is NOT the same state as a library that is empty,
 * and §4.14 wants a different single action for each: "clear the search" versus
 * "create the first exercise". Collapsing them would offer to create an exercise
 * to someone who has forty and simply mistyped.
 */
export type ExerciseListState = 'loading' | 'error' | 'empty' | 'noMatches' | 'rows';

export function exerciseListState(input: {
    loading: boolean;
    failed: boolean;
    total: number;
    visible: number;
}): ExerciseListState {
    // A failed fetch must never render as an empty state (it is not empty —
    // it is unknown), so the error branch is checked before both empties.
    if (input.failed) return 'error';
    if (input.loading) return 'loading';
    if (input.total === 0) return 'empty';
    if (input.visible === 0) return 'noMatches';
    return 'rows';
}

/**
 * Övningshistorik entry from an Exercise (§3.5 detail step 4: "choose a
 * Student, then open the scoped history"). `from` is the existing back-link
 * convention `exercise-history.component.ts` consumes.
 */
export function exerciseHistoryHref(studentId: string, exerciseId: string): string {
    const from = encodeURIComponent(`/library/${exerciseId}`);
    return `/students/${studentId}/exercises/${exerciseId}/history?from=${from}`;
}

/** `{count} övningar` for a Program row (§3.6 "title, description excerpt, Exercise count"). */
export function exerciseCountLabel(count: number): string {
    return plural('program.exerciseCount', count);
}

export function exerciseRowKey(exercise: Exercise): string {
    return `${exercise.id}:${exercise.name}:${exercise.description}`;
}
