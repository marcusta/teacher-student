import type { Horse } from '../api';

/**
 * Hästar — the DOM-free rules behind IA §3.15.
 *
 * See `../library/library-copy.ts` for why these live outside the component
 * module.
 */

/**
 * §3.15 list step 2: "Non-archived Horses, newest first."
 *
 * `GET /horses` already filters archived and orders `created_at DESC`, so this
 * is belt-and-braces rather than the only guard — but the view must not depend
 * on an ordering it does not state, and an archived horse arriving through any
 * other path (a stale cache, a future endpoint) must not appear in the stable.
 */
export function activeHorses(horses: readonly Horse[]): Horse[] {
    return horses
        .filter((h) => h.archivedAt === null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isArchived(horse: Horse): boolean {
    return horse.archivedAt !== null;
}

export function horseRowKey(horse: Horse): string {
    return `${horse.id}:${horse.name}`;
}

/**
 * A failed fetch must never render as an empty state — "you have no horses" and
 * "we could not find out" are different sentences and lead to different actions.
 */
export type StableState = 'loading' | 'error' | 'empty' | 'rows';

export function stableState(input: {
    loading: boolean;
    failed: boolean;
    count: number;
}): StableState {
    if (input.failed) return 'error';
    if (input.loading) return 'loading';
    if (input.count === 0) return 'empty';
    return 'rows';
}
