import { capitalize, formatDate, formatMonthBlock, plural, t } from '../i18n';
import type { ShareRecipient } from '../ui/copy';
import type { AttachedProgramRef, TrainingSessionExerciseRef } from '../api';

/**
 * Copy and derivation rules for Träningspass (IA §3.9) and its detail (§3.10).
 *
 * Kept apart from the components for the reason `web/ui/copy.ts` states: the
 * component modules import `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so they cannot load in a DOM-less test process. Everything
 * here is pure — the role matrix, the sharing recipients, the catalog grouping,
 * the derived headline — which is precisely the part worth asserting, so it
 * lives where `bun test` can reach it.
 *
 * This is the mirror of `lessons/lesson-copy.ts` with authorship reversed. The
 * two occasion types are siblings (design system: "Occasions are symmetric"), so
 * the small pure helpers they share — the §4.3 date block, the compact Exercise
 * summary, the Row-note reader — are spelled the same way in both. They are
 * duplicated rather than imported across the folder boundary: a Träningspass
 * must not depend on the Lektion module to render itself, and each module stays
 * readable on its own.
 */

// ─── The role matrix ────────────────────────────────────────────

/**
 * Who is reading this session. Derived from ownership, not from an account
 * type: the same person is a Student here and a Teacher on someone else's
 * session (IA §1).
 */
export type TrainingSessionViewer = 'owner' | 'sharedTeacher';

/**
 * Which controls a Träningspass detail view may render.
 *
 * IA §3.10 is explicit about the asymmetry: the **Student owns the structure**
 * and a **shared Teacher reads it and responds**. So a shared Teacher gets no
 * mutation of metadata, sharing, Programs or Exercises — and those controls are
 * *withheld*, never rendered disabled. The server enforces the same rule
 * (`assertTrainingSessionOwner` throws NotFoundError for a teacher), so a
 * disabled-but-present control would be a promise the API refuses to keep.
 *
 * Notes are the one thing both roles do, at both levels. That is the entire
 * point of sharing a session: the Student writes the reflection, the Teacher
 * answers it. Withholding notes from the Teacher would leave sharing with no
 * observable effect.
 */
export interface TrainingSessionControls {
    /** Performed date/time, duration, horse, plan, summary. Owner only. */
    editDetails: boolean;
    /** Which Teachers can see the session. Owner only — it is their trust decision. */
    editSharing: boolean;
    /** Attach and detach source Programs. Owner only. */
    editPrograms: boolean;
    /** Add and remove Exercise occurrences. Owner only. */
    editExercises: boolean;
    /** Hard delete. Owner only, and behind a consequence-stating dialog. */
    remove: boolean;
    /** Author notes on the session and on each Exercise occurrence. Both roles. */
    notes: boolean;
}

export function trainingSessionControls(viewer: TrainingSessionViewer): TrainingSessionControls {
    const owner = viewer === 'owner';
    return {
        editDetails: owner,
        editSharing: owner,
        editPrograms: owner,
        editExercises: owner,
        remove: owner,
        notes: true,
    };
}

/**
 * A 409 means this view is working from a stale copy. IA §4 wants that surfaced
 * as a recoverable conflict with a refresh path, not as a generic failure — and
 * it is detected by code, never by matching a message string.
 */
export function isConflict(error: { code: string } | null | undefined): boolean {
    return error?.code === 'conflict';
}

// ─── Ordering ───────────────────────────────────────────────────

/**
 * IA §3.9: own sessions, **newest first**. There is no Kommande/Tidigare split
 * here as there is on Lektioner — a Training Session is a log of practice that
 * already happened, so every row is past by construction and a "Kommande" group
 * would either be empty or hold a mistyped date.
 */
export function sortSessions<T extends { performedAt: string }>(items: T[]): T[] {
    return items.slice().sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

/** Occurrence rows in the order they were performed — `sortOrder` is the Program's. */
export function orderedExercises<T extends { sortOrder: number }>(exercises: T[]): T[] {
    return exercises.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

// ─── Row and header content ─────────────────────────────────────

export interface DateBlock {
    /** '14' — rendered with tabular numerals (§4.3). */
    day: string;
    /** 'JUL' — three characters, so the block keeps its fixed width. */
    month: string;
    /** '19:32'. */
    time: string;
}

/**
 * The §4.3 date block. `formatMonthBlock` rather than `formatMonthAbbrev`
 * because sv's four-character months ('JULI', 'MARS') break the block's
 * alignment — see UI_DECISIONS §4. Nothing here is hand-formatted; the app
 * already carries six hardcoded `sv-SE` formatters and this adds none.
 */
export function dateBlock(iso: string): DateBlock {
    return {
        day: formatDate(iso, { day: 'numeric' }),
        month: formatMonthBlock(iso),
        time: formatDate(iso, { hour: '2-digit', minute: '2-digit' }),
    };
}

/** 'Tisdag 14 juli · 19:32' — the §4.10 metadata line's leading fact. */
export function sessionWhen(iso: string): string {
    return [
        capitalize(formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })),
        formatDate(iso, { hour: '2-digit', minute: '2-digit' }),
    ].join(' · ');
}

/**
 * '45 min'. Null when no duration was logged — IA §3.9 says missing optional
 * data hides its field rather than blocking the log, so the caller omits the
 * fact entirely instead of printing '(ej angiven)'.
 */
export function durationLabel(durationMin: number | null): string | null {
    if (durationMin === null || !Number.isFinite(durationMin)) return null;
    return plural('trainingSession.duration', durationMin);
}

/** How many characters of the summary a row shows before it elides. */
const EXCERPT_LENGTH = 90;

/**
 * The row's summary excerpt (IA §3.9).
 *
 * Collapsed to a single line and cut at a word boundary: §4.3 allows a row at
 * most two rows of text, and a multi-paragraph reflection pasted verbatim would
 * push every following row off the screen. The full text is one click away on
 * the detail view, which is where it is meant to be read.
 */
export function summaryExcerpt(summary: string | null, max = EXCERPT_LENGTH): string | null {
    const flat = (summary ?? '').replace(/\s+/g, ' ').trim();
    if (flat.length === 0) return null;
    if (flat.length <= max) return flat;
    const cut = flat.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** How many names the compact row summary prints before it starts counting. */
const SUMMARY_NAMES = 3;

/**
 * '4 övningar · Volt, Serpentin, Trav +1' — the compact Exercise summary
 * (IA §3.9). Never the full list: a row that grows with its content stops being
 * scannable, which is what §4.3's two-row limit protects.
 */
export function exerciseSummary(exercises: Pick<TrainingSessionExerciseRef, 'name'>[]): string {
    if (exercises.length === 0) return t('trainingSession.exercises.none');
    const shown = exercises.slice(0, SUMMARY_NAMES).map((e) => e.name);
    const hidden = exercises.length - shown.length;
    const names = hidden > 0
        ? `${shown.join(', ')} ${t('trainingSession.more', { count: hidden })}`
        : shown.join(', ');
    return plural('trainingSession.exerciseSummary', exercises.length, { names });
}

/**
 * The session's headline.
 *
 * `training_sessions` has no title column, so — as on Lektioner — the headline
 * is derived from what the occasion actually contains, in descending order of
 * how much it says. The Student's own summary wins when there is one: it is the
 * only text a person wrote about this specific session, and it is what they
 * will recognise the row by.
 */
export function sessionTitle(session: {
    summary: string | null;
    programs: AttachedProgramRef[];
    exercises: Pick<TrainingSessionExerciseRef, 'name'>[];
}): string {
    const excerpt = summaryExcerpt(session.summary, 60);
    if (excerpt) return excerpt;
    const [first, ...rest] = session.programs;
    if (first && rest.length === 0) return first.title;
    if (first) return plural('trainingSession.title.programs', session.programs.length);
    if (session.exercises.length > 0) {
        return plural('trainingSession.title.exercises', session.exercises.length);
    }
    return t('trainingSession.title.plain');
}

/**
 * Source-Program badges, minus any Program whose title was promoted into the
 * headline by `sessionTitle`. Printing the same string twice on one row is the
 * noise §4.3's two-row rule exists to prevent.
 */
export function programBadges(session: {
    summary: string | null;
    programs: AttachedProgramRef[];
}): AttachedProgramRef[] {
    // A summary took the headline, so no Program title was promoted and all of
    // them are still worth showing.
    if (summaryExcerpt(session.summary, 60)) return session.programs;
    return session.programs.length === 1 ? [] : session.programs;
}

/** 'Program: Grundhoppning A' — a source chip, always named. */
export function programChipLabel(program: AttachedProgramRef): string {
    return t('trainingSession.chip.program', { title: program.title });
}

/** 'Plan: Hoppsäsong vår 2026'. */
export function planChipLabel(title: string): string {
    return t('trainingSession.chip.plan', { title });
}

/**
 * The static Row note copied with an Exercise occurrence (IA §3.10).
 *
 * `training_session_exercise.notes` is copied verbatim from the source Program
 * at snapshot time and is now projected on `TrainingSessionExerciseRef` — it was
 * written but never selected, so this text existed in the database and could not
 * be rendered. It is instructional text, distinct from the Note thread that
 * hangs off the occurrence's id.
 *
 * Blank and whitespace-only notes collapse to null so the row omits the label
 * entirely rather than rendering an empty paragraph.
 */
export function rowNote(exercise: Pick<TrainingSessionExerciseRef, 'notes'>): string | null {
    const note = exercise.notes;
    return typeof note === 'string' && note.trim().length > 0 ? note.trim() : null;
}

/** 'Från Grundhoppning A' — which Program an occurrence was copied from. */
export function exerciseSource(
    exercise: Pick<TrainingSessionExerciseRef, 'sourceProgramId'>,
    programs: AttachedProgramRef[],
): string | null {
    if (!exercise.sourceProgramId) return null;
    const program = programs.find((p) => p.id === exercise.sourceProgramId);
    // Detaching a Program leaves its copied Exercises behind, so the source id
    // outlives the label. Say so rather than printing a dangling "Från ".
    return program
        ? t('trainingSession.exercise.source', { title: program.title })
        : t('trainingSession.exercise.sourceGone');
}

// ─── Sharing ────────────────────────────────────────────────────

export interface TeacherLike {
    id: string;
    displayName: string;
}

/**
 * The audience, by name, as the **owner** sees it (§4.5).
 *
 * The owner can enumerate their own Teachers, so every recipient resolves to a
 * real name. An id with no matching Teacher — a Relation removed since the
 * session was shared — is kept as an unnamed entry rather than dropped: it still
 * counts toward the `+N`, so the chip never understates who can see the session.
 */
export function ownerRecipients(
    sharedWithTeacherIds: string[],
    teachers: TeacherLike[],
): ShareRecipient[] {
    return sharedWithTeacherIds.map((id) => ({
        id,
        name: teachers.find((teacher) => teacher.id === id)?.displayName ?? '',
    }));
}

/**
 * The audience as a **shared Teacher** sees it.
 *
 * A Teacher cannot enumerate the other Teachers on someone else's session —
 * there is no endpoint for it, and inventing one would leak a Student's other
 * relations. But the reader does know one recipient for certain: themselves. So
 * the chip names that (`Delad: du`) and lets the remaining ids fall behind the
 * `+N` as unnamed entries.
 *
 * This is deliberately not a bare "Delad" and deliberately not `Delad (2
 * lärare)` — §4.5 forbids both. It states exactly what this reader can know.
 */
export function sharedTeacherRecipients(
    sharedWithTeacherIds: string[],
    viewerId: string,
    youLabel: string,
): ShareRecipient[] {
    const others = sharedWithTeacherIds.filter((id) => id !== viewerId);
    return [{ id: viewerId, name: youLabel }, ...others.map((id) => ({ id, name: '' }))];
}

/**
 * Whether the detail view's sharing effect should write.
 *
 * The multi-select writes the share signal directly, so the commit is driven off
 * that signal rather than off a change handler the view does not own. Two things
 * must hold before a difference from the server's value counts as a user edit:
 *
 * - **The form state has been seeded from the loaded session.** Until then the
 *   signal is `[]`, which against a shared session reads as "the user just
 *   removed everyone". Comparing against the server's value does not catch this
 *   on its own, because the un-seeded empty value genuinely differs from it.
 * - **There is more than one Teacher.** At one or none the checkbox owns the
 *   write, and letting both fire would PATCH twice.
 *
 * The seeding guard is the load-bearing one. `TeachersService` is an app-wide DI
 * singleton that `AppComponent` loads at startup, so on the normal navigation
 * path — list, row, detail — the Teacher count is ALREADY above one when the
 * detail view mounts. The count check therefore does not stand in for the seed
 * check: without it, merely opening a shared session silently PATCHes its shares
 * away and reports success.
 */
export function shouldCommitSharing(args: {
    /** Has the share signal been filled from the loaded session yet? */
    seeded: boolean;
    teacherCount: number;
    next: string[];
    stored: string[];
}): boolean {
    if (!args.seeded) return false;
    if (args.teacherCount <= 1) return false;
    return [...args.next].sort().join(',') !== [...args.stored].sort().join(',');
}

// ─── Creation ───────────────────────────────────────────────────

/**
 * IA §3.9 step 3: the Horse. An archived horse is not a valid answer — logging a
 * session on a horse the rider has retired is a data-entry trap, and the server
 * refuses it (`assertOwnUnarchivedHorse`), so offering it would only produce a
 * failure the picker could have prevented.
 */
export function loggableHorses<T extends { archivedAt: null | string }>(horses: T[]): T[] {
    return horses.filter((h) => h.archivedAt === null);
}

/** IA §3.9 step 5: the **active** Plan. An archived Plan is not a destination. */
export function loggablePlans<T extends { status: 'active' | 'archived' }>(plans: T[]): T[] {
    return plans.filter((p) => p.status === 'active');
}

// ─── Pickers (§4.9) ─────────────────────────────────────────────

/** A `SelectComponent` option. Group headers are `disabled` rows. */
export interface CatalogOption {
    value: string;
    label: string;
    disabled?: boolean;
}

/**
 * Catalog options grouped by **owning Teacher** — design system §4.9, which
 * states the rule as "upphov är en del av innehållet": provenance is content,
 * not metadata. A Student connected to two Teachers sees two named groups, never
 * one merged alphabetical list in which an exercise's author is invisible.
 *
 * `excludeIds` drops what is already attached, so the picker only ever offers
 * something that would actually change the session (§4.9 again). A group whose
 * every member is already attached disappears with its members rather than
 * standing as an empty header.
 *
 * Group headers are `disabled: true` options — `SelectComponent` renders those
 * as non-selectable, keyboard-skipped headers, which is exactly the shape this
 * needs and is why no second picker component is introduced here.
 */
export function groupByTeacher<T extends { id: string; teacherId: string }>(
    items: T[],
    teachers: TeacherLike[],
    label: (item: T) => string,
    excludeIds: ReadonlySet<string> = new Set(),
): CatalogOption[] {
    const available = items.filter((item) => !excludeIds.has(item.id));
    const byTeacher = new Map<string, T[]>();
    for (const item of available) {
        const list = byTeacher.get(item.teacherId) ?? [];
        list.push(item);
        byTeacher.set(item.teacherId, list);
    }

    // Teacher order follows the Teacher list, so the groups keep a stable
    // order across renders rather than following insertion order of the catalog.
    const ordered = [
        ...teachers.filter((teacher) => byTeacher.has(teacher.id)).map((teacher) => teacher.id),
        ...[...byTeacher.keys()].filter((id) => !teachers.some((teach) => teach.id === id)),
    ];

    const out: CatalogOption[] = [];
    for (const teacherId of ordered) {
        const group = byTeacher.get(teacherId) ?? [];
        if (group.length === 0) continue;
        const teacher = teachers.find((teach) => teach.id === teacherId);
        out.push({
            value: `group:${teacherId}`,
            // A Teacher whose Relation has since gone still owns the content, so
            // the group is labelled as unknown rather than silently merged into
            // another Teacher's group.
            label: teacher ? teacher.displayName : t('trainingSession.catalog.unknownTeacher'),
            disabled: true,
        });
        for (const item of group) out.push({ value: item.id, label: label(item) });
    }
    return out;
}

/**
 * The Teachers who own an attached Program but cannot see the session.
 *
 * IA §3.10: "When attaching a Program, **offer** — do not silently force —
 * sharing with its owning Teacher." Forcing it would turn a content decision
 * into a disclosure the Student never made; saying nothing would leave a Program
 * attached whose author cannot see how it went. So the gap is surfaced as a
 * standing, dismissible offer with the Teacher named, and the Student decides.
 *
 * Returns the Teachers still missing, in Teacher-list order, so the offer can
 * name them.
 */
export function unsharedProgramOwners(
    attachedPrograms: AttachedProgramRef[],
    catalog: { id: string; teacherId: string }[],
    sharedWithTeacherIds: string[],
    teachers: TeacherLike[],
): TeacherLike[] {
    const shared = new Set(sharedWithTeacherIds);
    const owners = new Set<string>();
    for (const program of attachedPrograms) {
        const owner = catalog.find((p) => p.id === program.id)?.teacherId;
        if (owner && !shared.has(owner)) owners.add(owner);
    }
    return teachers.filter((teacher) => owners.has(teacher.id));
}

// ─── List reconciliation ────────────────────────────────────────

/**
 * Identity of a rendered row.
 *
 * `$each` caches a row's DOM by key and never re-runs its renderer, so the key
 * has to cover every field the row paints. `updatedAt` alone is not enough:
 * attaching a Program or a share writes a junction table, not the
 * `training_sessions` row, so its timestamp does not move.
 */
export function rowKey(session: {
    id: string;
    performedAt: string;
    durationMin: number | null;
    summary: string | null;
    horseName: string | null;
    planId: string | null;
    sharedWithTeacherIds: string[];
    programs: AttachedProgramRef[];
    exercises: Pick<TrainingSessionExerciseRef, 'id'>[];
}): string {
    return [
        session.id,
        session.performedAt,
        session.durationMin ?? '',
        session.summary ?? '',
        session.horseName ?? '',
        session.planId ?? '',
        session.sharedWithTeacherIds.join(','),
        session.programs.map((p) => p.id).join(','),
        session.exercises.map((e) => e.id).join(','),
    ].join('|');
}
