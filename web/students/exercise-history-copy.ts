import { formatIsoDate, t } from '../i18n';
import type { ExerciseHistoryEntry, Note } from '../api';

/**
 * Övningshistorik — the DOM-free rules behind IA §3.16.
 *
 * See `../library/library-copy.ts` for why these live outside the component
 * module.
 */

/** `/students/:studentId/exercises/:exerciseId/history` — the only shape this view answers to. */
export interface HistoryRouteIds {
    studentId: string;
    exerciseId: string;
}

export function parseHistoryRoute(route: string): HistoryRouteIds | null {
    const parts = route.split('/');
    if (parts.length === 6
        && parts[1] === 'students'
        && parts[3] === 'exercises'
        && parts[5] === 'history'
        && parts[2]
        && parts[4]) {
        return { studentId: parts[2], exerciseId: parts[4] };
    }
    return null;
}

/**
 * The back link "according to entry path" (§3.16 context header).
 *
 * `?from=` is the existing convention and wins when present. Otherwise the
 * Exercise detail is the honest default: it is the only entry point that always
 * exists, since Elevvy's history tab is reachable only for a Teacher.
 *
 * Only same-origin app paths are honoured. `from` arrives from the address bar,
 * so an absolute URL or a protocol-relative `//host` would turn a back link into
 * an off-site redirect.
 */
export function backTarget(from: string | undefined, ids: HistoryRouteIds | null): string {
    if (from && from.startsWith('/') && !from.startsWith('//')) return from;
    if (ids) return `/library/${ids.exerciseId}`;
    return '/students';
}

/**
 * §3.16: "source Program or Standalone". Every row in this table is a Lesson
 * occurrence, so a column that read "Lektion" on every row would carry no
 * information AND would imply that other occasion types appear here — which
 * §3.16 forbids in as many words ("Training Session occurrences are not part of
 * the current history contract and must not be implied"). The Tillfälle chip
 * therefore names the source Program, or says the Exercise stood alone.
 */
export function sourceLabel(sourceProgramTitle: string | null): string {
    return sourceProgramTitle ?? t('exerciseHistory.standalone');
}

/**
 * The notes visible on one occurrence.
 *
 * The server already answers this correctly — `NoteService.listFor` selects
 * `visibility = 'shared' OR author_id = <actor>` — so the other party's private
 * notes never reach the client at all. This function does not re-filter what it
 * cannot see; it exists to make the contract assertable and to keep the
 * ordering stated rather than inherited.
 */
export function visibleNotes(entry: ExerciseHistoryEntry): Note[] {
    return [...entry.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function noteVisibilityLabel(note: Note): string {
    return note.visibility === 'shared'
        ? t('exerciseHistory.note.shared')
        : t('exerciseHistory.note.private');
}

/** One table row. §4.15's four columns, resolved. */
export interface HistoryRow {
    key: string;
    /** `2026-07-14` — §4.15 renders the date with tabular numerals. */
    dateLabel: string;
    /** ISO instant, kept so the row can be re-sorted or re-formatted. */
    scheduledAt: string;
    lessonHref: string;
    sourceLabel: string;
    /** `null` renders as the em dash the table already supplies. */
    rowNote: string | null;
    notes: Note[];
}

/**
 * Reverse-chronological rows (§3.16 timeline).
 *
 * The endpoint already orders `scheduled_at DESC`, but the view states its own
 * order rather than inheriting one: this is the single promise §3.16 makes about
 * the sequence, and a silently-changed server ordering would break it invisibly.
 */
export function historyRows(entries: readonly ExerciseHistoryEntry[]): HistoryRow[] {
    return [...entries]
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
        .map((entry) => ({
            key: entry.lessonExerciseId,
            dateLabel: formatIsoDate(entry.scheduledAt),
            scheduledAt: entry.scheduledAt,
            lessonHref: `/lektioner/${entry.lessonId}`,
            sourceLabel: sourceLabel(entry.sourceProgramTitle),
            rowNote: entry.rowNotes && entry.rowNotes.trim() !== '' ? entry.rowNotes : null,
            notes: visibleNotes(entry),
        }));
}

/**
 * A failed fetch is not an empty history. §3.16 gives the empty case its own
 * sentence ("history appears after the Exercise is used in a Lesson"), which
 * would be a lie if the request had simply failed.
 */
export type HistoryState = 'loading' | 'unreachable' | 'notFound' | 'empty' | 'rows';

/**
 * `unreachable` is separate from `notFound` on purpose.
 *
 * A missing Relation, Student or Exercise all legitimately collapse into one
 * not-found state — §1 requires that an object the reader may not see be
 * indistinguishable from one that does not exist, and the server answers 404 for
 * every such case. But a request that never reached the server is not one of
 * them. Telling someone offline that their student's history "finns inte" is a
 * false statement about the world, and it offers them a link to the roster
 * instead of the retry §4 requires for a failed read.
 *
 * Only transport-level failures can be told apart here: `RequestError.code`
 * flattens 404 and 500 alike to `server`, so `network` and `timeout` are the
 * codes this branch keys off. A 500 still lands in `notFound` — imprecise, but
 * it does not claim anything the client can disprove.
 */
export function historyState(input: {
    resolved: boolean;
    found: boolean;
    unreachable: boolean;
    count: number;
}): HistoryState {
    if (!input.resolved) return 'loading';
    if (input.unreachable) return 'unreachable';
    if (!input.found) return 'notFound';
    if (input.count === 0) return 'empty';
    return 'rows';
}

/** The `RequestError.code`s that prove the request never got an answer. */
export function isUnreachable(code: string | undefined): boolean {
    return code === 'network' || code === 'timeout';
}
