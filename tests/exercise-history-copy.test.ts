import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    backTarget,
    historyRows,
    historyState,
    isUnreachable,
    noteVisibilityLabel,
    parseHistoryRoute,
    sourceLabel,
    visibleNotes,
} from '../web/students/exercise-history-copy';
import type { ExerciseHistoryEntry, Note } from '../web/api';

// See tests/library-copy.test.ts for why these rules live outside the component
// module.
await import('../web/i18n');
setLocale('sv');

function note(over: Partial<Note> = {}): Note {
    return {
        id: 'n-1',
        authorId: 'teacher-1',
        authorDisplayName: 'Anna Ekström',
        parentKind: 'lesson_exercise',
        parentId: 'le-1',
        body: 'Bra energi.',
        visibility: 'shared',
        createdAt: '2026-07-14T18:00:00.000Z',
        updatedAt: '2026-07-14T18:00:00.000Z',
        ...over,
    } as Note;
}

function entry(over: Partial<ExerciseHistoryEntry> = {}): ExerciseHistoryEntry {
    return {
        lessonExerciseId: 'le-1',
        lessonId: 'lesson-1',
        scheduledAt: '2026-07-14T17:00:00.000Z',
        sourceProgramId: null,
        sourceProgramTitle: null,
        rowNotes: null,
        notes: [],
        ...over,
    };
}

// ─── Route ──────────────────────────────────────────────────────

test('the history route parses into its two ids', () => {
    expect(parseHistoryRoute('/students/s-1/exercises/e-2/history'))
        .toEqual({ studentId: 's-1', exerciseId: 'e-2' });
});

test('anything that is not the history route parses as null', () => {
    expect(parseHistoryRoute('/students/s-1')).toBeNull();
    expect(parseHistoryRoute('/students/s-1/exercises/e-2')).toBeNull();
    expect(parseHistoryRoute('/students/s-1/exercises/e-2/history/extra')).toBeNull();
    expect(parseHistoryRoute('/students//exercises/e-2/history')).toBeNull();
    expect(parseHistoryRoute('/students/s-1/exercises//history')).toBeNull();
});

// ─── Back link ──────────────────────────────────────────────────

const IDS = { studentId: 's-1', exerciseId: 'e-2' };

test('?from= wins, so the back link honours the entry path', () => {
    expect(backTarget('/students/s-1?flik=historik', IDS)).toBe('/students/s-1?flik=historik');
});

test('without ?from= the back link falls back to the Exercise detail', () => {
    expect(backTarget(undefined, IDS)).toBe('/library/e-2');
    expect(backTarget('', IDS)).toBe('/library/e-2');
});

test('with neither a from nor a parsable route, the back link still goes somewhere real', () => {
    expect(backTarget(undefined, null)).toBe('/students');
});

test('an off-site ?from= is refused — a back link is not a redirector', () => {
    expect(backTarget('https://evil.example/steal', IDS)).toBe('/library/e-2');
    expect(backTarget('//evil.example/steal', IDS)).toBe('/library/e-2');
    expect(backTarget('javascript:alert(1)', IDS)).toBe('/library/e-2');
});

// ─── Occasion label ─────────────────────────────────────────────

test('the Tillfälle cell names the source Program, or says the row stood alone', () => {
    expect(sourceLabel('Grundhoppning A')).toBe('Grundhoppning A');
    expect(sourceLabel(null)).toBe('Fristående');
});

test('the occasion label never says “Lektion” — §3.16 forbids implying other kinds', () => {
    // Every row here IS a Lesson, so a type column would be both uninformative
    // and a hint that Training Sessions appear, which they do not.
    expect(sourceLabel(null)).not.toBe('Lektion');
});

// ─── Rows ───────────────────────────────────────────────────────

test('rows are reverse-chronological, whatever order the endpoint returns', () => {
    const rows = historyRows([
        entry({ lessonExerciseId: 'old', scheduledAt: '2026-07-03T17:00:00.000Z' }),
        entry({ lessonExerciseId: 'new', scheduledAt: '2026-07-14T17:00:00.000Z' }),
        entry({ lessonExerciseId: 'mid', scheduledAt: '2026-07-10T17:00:00.000Z' }),
    ]);
    expect(rows.map((r) => r.key)).toEqual(['new', 'mid', 'old']);
});

test('each row links to its own Lesson detail', () => {
    const [row] = historyRows([entry({ lessonId: 'lesson-9' })]);
    expect(row!.lessonHref).toBe('/lektioner/lesson-9');
});

test('a blank or absent row note becomes null, so the table renders its em dash', () => {
    expect(historyRows([entry({ rowNotes: null })])[0]!.rowNote).toBeNull();
    expect(historyRows([entry({ rowNotes: '   ' })])[0]!.rowNote).toBeNull();
    expect(historyRows([entry({ rowNotes: 'Stel i vänster varv.' })])[0]!.rowNote)
        .toBe('Stel i vänster varv.');
});

test('the date is the ISO calendar day the §4.15 table sets in tabular figures', () => {
    const [row] = historyRows([entry({ scheduledAt: '2026-07-14T17:00:00.000Z' })]);
    expect(row!.dateLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('historyRows never mutates the caller’s array', () => {
    const entries = [
        entry({ lessonExerciseId: 'a', scheduledAt: '2026-07-03T17:00:00.000Z' }),
        entry({ lessonExerciseId: 'b', scheduledAt: '2026-07-14T17:00:00.000Z' }),
    ];
    historyRows(entries);
    expect(entries.map((e) => e.lessonExerciseId)).toEqual(['a', 'b']);
});

// ─── Notes ──────────────────────────────────────────────────────

test('notes are chronological within an occurrence', () => {
    const notes = visibleNotes(entry({
        notes: [
            note({ id: 'later', createdAt: '2026-07-14T19:00:00.000Z' }),
            note({ id: 'earlier', createdAt: '2026-07-14T18:00:00.000Z' }),
        ],
    }));
    expect(notes.map((n) => n.id)).toEqual(['earlier', 'later']);
});

test('visibleNotes passes through what the server allowed and drops nothing extra', () => {
    // The server selects `visibility = 'shared' OR author_id = actor`, so the
    // other party's private notes never arrive. This view must not then hide the
    // user's OWN private notes on top of that.
    const own = note({ id: 'mine', visibility: 'private', authorId: 'me' });
    const shared = note({ id: 'ours', visibility: 'shared', authorId: 'teacher-1' });
    expect(visibleNotes(entry({ notes: [own, shared] })).map((n) => n.id).sort())
        .toEqual(['mine', 'ours']);
});

test('visibility is labelled in words, never left to colour alone', () => {
    expect(noteVisibilityLabel(note({ visibility: 'shared' }))).toBe('Delad anteckning');
    expect(noteVisibilityLabel(note({ visibility: 'private' }))).toBe('Privat anteckning');
});

// ─── State ──────────────────────────────────────────────────────

test('nothing is claimed before the requests resolve', () => {
    expect(historyState({ resolved: false, found: false, unreachable: false, count: 0 })).toBe('loading');
    expect(historyState({ resolved: false, found: true, unreachable: false, count: 5 })).toBe('loading');
    // Not even a transport failure outranks "still asking".
    expect(historyState({ resolved: false, found: false, unreachable: true, count: 0 })).toBe('loading');
});

test('a missing Student, Exercise or Relation all resolve as one not-found state', () => {
    expect(historyState({ resolved: true, found: false, unreachable: false, count: 0 })).toBe('notFound');
});

test('a request that never reached the server is NOT reported as not-found', () => {
    expect(historyState({ resolved: true, found: false, unreachable: true, count: 0 })).toBe('unreachable');
});

test('an empty history is only claimed once it is known to be empty', () => {
    expect(historyState({ resolved: true, found: true, unreachable: false, count: 0 })).toBe('empty');
    expect(historyState({ resolved: true, found: true, unreachable: false, count: 2 })).toBe('rows');
});

test('only transport-level codes count as unreachable — 404 and 500 both arrive as `server`', () => {
    expect(isUnreachable('network')).toBe(true);
    expect(isUnreachable('timeout')).toBe(true);
    expect(isUnreachable('server')).toBe(false);
    expect(isUnreachable('auth')).toBe(false);
    expect(isUnreachable(undefined)).toBe(false);
});
