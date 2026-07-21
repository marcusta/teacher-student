import { capitalize, formatDate, formatMonthBlock, plural, t } from '../i18n';
import type { StatusPillTone, StatusPillVariant } from '@basics/core/client/ui/status-pill';
import type { AttachedProgramRef, LessonExerciseRef, LessonForUser } from '../api';

/**
 * Copy and derivation rules for Lektioner (IA §3.7) and Lektion (IA §3.8).
 *
 * Kept apart from the components for the reason `web/ui/copy.ts` states: the
 * component modules import `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so they cannot load in a DOM-less test process. Everything
 * here is pure — status shape, grouping, the terminal-state control matrix, the
 * derived title — which is precisely the part worth asserting, so it lives where
 * `bun test` can reach it.
 */

export type LessonStatus = LessonForUser['status'];
export type LessonRole = LessonForUser['role'];

/** Structural fields this module reads. Keeps the rules testable with fixtures. */
export interface LessonLike {
    id: string;
    role: LessonRole;
    status: LessonStatus;
    scheduledAt: string;
    counterpartyDisplayName: string;
    horseName: null | string;
    planId: null | string;
    planTitle: null | string;
    programs: AttachedProgramRef[];
    exercises: LessonExerciseRef[];
}

// ─── Status ─────────────────────────────────────────────────────

export interface StatusDescriptor {
    /**
     * A THUNK, never a resolved string.
     *
     * These descriptors are built inside `$each` row renderers, and `$each`
     * builds rows untracked on purpose — a renderer that reads a signal would
     * subscribe the list effect and remount every row on unrelated changes.
     * So a `t()` called here would be read once, outside any tracking, and the
     * pill would keep the locale that happened to be active when the row was
     * built. Handing `StatusPillComponent` the READ instead lets it perform
     * that read inside an effect it owns, which is the one place the
     * subscription is safe.
     */
    label: () => string;
    variant: StatusPillVariant;
    tone: StatusPillTone;
    glyph?: string;
}

/**
 * Design system §4.4: the SHAPE carries the meaning, so the three statuses stay
 * apart with colour removed entirely — outline = future, filled = completed,
 * dashed = cancelled. UI_DECISIONS §7 makes that mandatory rather than
 * preferred, which is why `variant` is derived here and never passed in by a
 * view. Cancelled takes the neutral tone, not danger: IA §3.7 wants those rows
 * muted but readable, and the dashed ring plus the ✕ already say "avbruten"
 * without shouting.
 */
export function statusPill(status: LessonStatus): StatusDescriptor {
    switch (status) {
        case 'planned':
            return { label: () => t('lesson.status.planned'), variant: 'outline', tone: 'info' };
        case 'completed':
            return { label: () => t('lesson.status.completed'), variant: 'filled', tone: 'success' };
        case 'cancelled':
            return { label: () => t('lesson.status.cancelled'), variant: 'dashed', tone: 'neutral', glyph: '✕' };
    }
}

export function isTerminal(status: LessonStatus): boolean {
    return status === 'completed' || status === 'cancelled';
}

// ─── The terminal-state control matrix ──────────────────────────

/**
 * Which controls a Lektion detail view may render, given status and the
 * reader's role in this relation.
 *
 * The server newly answers **409** for `addExercise`, `removeExercise`,
 * `attachProgram` and `detachProgram` once a Lesson is terminal
 * (`lesson.service.ts` — "Lesson is ${status}"). A control that can only fail is
 * worse than no control, so those four are withheld rather than disabled-with-a
 * -tooltip. What deliberately stays OPEN after a terminal transition:
 *
 * - **reschedule, horse, plan** — the server still permits them, and it should:
 *   a lesson recorded on the wrong horse must remain correctable afterwards.
 * - **notes, at both levels** — this is the product's core feedback loop. Most
 *   feedback on a lesson is written *after* it is taught; locking notes at the
 *   terminal transition would close the loop the whole app exists to run.
 *
 * Students never mutate structure at all, at any status, so the role gate and
 * the status gate are separate conditions rather than one blended flag.
 */
export interface LessonControls {
    /** Mark completed / cancel. Only while planned, and only for the teacher. */
    transition: boolean;
    /** Date/time, horse and plan. Open post-terminal — corrections must survive. */
    editDetails: boolean;
    /** Add and remove Exercise occurrences. 409 after terminal. */
    editExercises: boolean;
    /** Attach and detach source Programs. 409 after terminal. */
    editPrograms: boolean;
    /** Author notes on the Lesson and on each Exercise occurrence. Always. */
    notes: boolean;
    /** Explain why the structural controls are gone. */
    lockNotice: boolean;
}

export function lessonControls(status: LessonStatus, role: LessonRole): LessonControls {
    const teacher = role === 'teacher';
    const open = !isTerminal(status);
    return {
        transition: teacher && open,
        editDetails: teacher,
        editExercises: teacher && open,
        editPrograms: teacher && open,
        notes: true,
        lockNotice: teacher && !open,
    };
}

/** The sentence that replaces the withheld controls. Names what is still open. */
export function lockNotice(status: LessonStatus): string {
    return status === 'cancelled' ? t('lesson.locked.cancelled') : t('lesson.locked.completed');
}

/**
 * A 409 means the copy of the Lesson this view is working from is stale — the
 * status moved somewhere else. IA §4 wants that surfaced as a *recoverable
 * conflict with a refresh path*, not as a generic failure, so it is detected by
 * code rather than by matching a message string.
 */
export function isConflict(error: { code: string } | null | undefined): boolean {
    return error?.code === 'conflict';
}

// ─── Grouping ───────────────────────────────────────────────────

/**
 * IA §3.7: **Kommande** soonest first, **Tidigare** newest first. Both are
 * derived from one comparison against `nowIso`, so a lesson can never land in
 * both groups or in neither.
 */
export function groupLessons<T extends { scheduledAt: string }>(
    items: T[],
    nowIso: string,
): { upcoming: T[]; past: T[] } {
    const upcoming: T[] = [];
    const past: T[] = [];
    for (const item of items) (item.scheduledAt >= nowIso ? upcoming : past).push(item);
    upcoming.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    past.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    return { upcoming, past };
}

// ─── Row and header content ─────────────────────────────────────

export interface DateBlock {
    /** '22' — rendered with tabular numerals (§4.3). */
    day: string;
    /** 'JUL' — three characters, so the block keeps its fixed width. */
    month: string;
    /** '17:00'. */
    time: string;
}

/**
 * The §4.3 date block. `formatMonthBlock` rather than `formatMonthAbbrev`
 * because sv's four-character months ('JULI', 'MARS') break the block's
 * alignment — see UI_DECISIONS §4. Nothing here is hand-formatted; there are
 * already eight hardcoded `sv-SE` formatters in this app and this adds none.
 */
export function dateBlock(iso: string): DateBlock {
    return {
        day: formatDate(iso, { day: 'numeric' }),
        month: formatMonthBlock(iso),
        time: formatDate(iso, { hour: '2-digit', minute: '2-digit' }),
    };
}

/**
 * 'Onsdag 22 juli · 17:00' — the §4.10 metadata line.
 *
 * The spec's example reads `17:00–18:00`, but the contract carries only
 * `scheduled_at`; there is no end time or duration anywhere in the Lesson table.
 * Rendering a range would mean inventing the second half of it, so the line
 * states the start and stops. `formatTimeRange` becomes the right helper the day
 * the contract grows an end.
 */
export function lessonWhen(iso: string): string {
    return [
        capitalize(formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })),
        formatDate(iso, { hour: '2-digit', minute: '2-digit' }),
    ].join(' · ');
}

/**
 * The other party's contextual role — the inverse of the reader's own (IA §1:
 * role is a fact about a Relation, not about an account).
 */
export function counterpartyRole(role: LessonRole): LessonRole {
    return role === 'teacher' ? 'student' : 'teacher';
}

/**
 * The Lesson's headline.
 *
 * IA §3.7 asks for a title "if retained by the contract" — it is not: the
 * `lessons` table has no title or description column, so there is nothing to
 * read and nothing to offer at creation. Rather than print the bare word
 * "Lektion" on every row, the headline is derived from what the occasion
 * actually contains, in descending order of how much it says.
 */
export function lessonTitle(lesson: Pick<LessonLike, 'programs' | 'exercises'>): string {
    const [first, ...rest] = lesson.programs;
    if (first && rest.length === 0) return first.title;
    if (first) return plural('lesson.title.programs', lesson.programs.length);
    if (lesson.exercises.length > 0) return plural('lesson.title.exercises', lesson.exercises.length);
    return t('lesson.title.plain');
}

/**
 * Source-Program badges, minus any program whose title was promoted into the
 * headline by `lessonTitle`. Printing the same string twice on one row is the
 * kind of noise §4.3's "max two rows of text" rule exists to prevent.
 */
export function programBadges(lesson: Pick<LessonLike, 'programs' | 'exercises'>): AttachedProgramRef[] {
    return lesson.programs.length === 1 ? [] : lesson.programs;
}

/** 'Program: Grundhoppning A' — a source chip, always named. */
export function programChipLabel(program: AttachedProgramRef): string {
    return t('lesson.chip.program', { title: program.title });
}

/** 'Plan: Hoppsäsong vår 2026'. */
export function planChipLabel(title: string): string {
    return t('lesson.chip.plan', { title });
}

/** How many names the compact row summary prints before it starts counting. */
const SUMMARY_NAMES = 3;

/**
 * '4 övningar · Volt, Serpentin, Trav +1' — the compact Exercise summary
 * (IA §3.7). Never the full list: a row that grows with its content stops being
 * scannable, which is what the two-row limit in §4.3 is protecting.
 */
export function exerciseSummary(exercises: Pick<LessonExerciseRef, 'name'>[]): string {
    if (exercises.length === 0) return t('lesson.exercises.none');
    const shown = exercises.slice(0, SUMMARY_NAMES).map((e) => e.name);
    const hidden = exercises.length - shown.length;
    const names = hidden > 0
        ? `${shown.join(', ')} ${t('lesson.more', { count: hidden })}`
        : shown.join(', ');
    return plural('lesson.exerciseSummary', exercises.length, { names });
}

/**
 * The static Row note copied with an Exercise occurrence (IA §3.8).
 *
 * `lesson_exercise.notes` is copied verbatim from the source Program at snapshot
 * time and is now projected on `LessonExerciseRef`. This is the instructional
 * text, distinct from the Note thread that hangs off the occurrence's id.
 *
 * Blank and whitespace-only notes collapse to null so the row omits the label
 * entirely rather than rendering an empty paragraph.
 */
export function rowNote(exercise: Pick<LessonExerciseRef, 'notes'>): string | null {
    const note = exercise.notes;
    return typeof note === 'string' && note.trim().length > 0 ? note.trim() : null;
}

/** Occurrence rows in taught order — `sortOrder` is the Program's order. */
export function orderedExercises<T extends { sortOrder: number }>(exercises: T[]): T[] {
    return exercises.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 'Från Grundhoppning A' — which Program an occurrence was copied from. */
export function exerciseSource(
    exercise: Pick<LessonExerciseRef, 'sourceProgramId'>,
    programs: AttachedProgramRef[],
): string | null {
    if (!exercise.sourceProgramId) return null;
    const program = programs.find((p) => p.id === exercise.sourceProgramId);
    // A detached Program leaves its copied Exercises behind (IA §3.8), so the
    // source id can outlive the label. Say so rather than printing a dangling
    // "Från ".
    return program
        ? t('lesson.exercise.source', { title: program.title })
        : t('lesson.exercise.sourceGone');
}

// ─── Creation ───────────────────────────────────────────────────

/**
 * IA §3.7 step 3: "Horse from the selected Student's **non-archived** stable".
 * `GET /students/:id/horses` returns the whole stable including retired horses,
 * so the filter is the client's job — booking a lesson on a horse the student
 * has retired is a data-entry trap, not a choice.
 */
export function bookableHorses<T extends { archivedAt: null | string }>(horses: T[]): T[] {
    return horses.filter((h) => h.archivedAt === null);
}

/** IA §3.7 step 4: the **active** Plan. An archived Plan is not a destination. */
export function bookablePlans<T extends { status: 'active' | 'archived' }>(plans: T[]): T[] {
    return plans.filter((p) => p.status === 'active');
}

/**
 * Identity of a rendered row, for list reconciliation.
 *
 * `$each` caches a row's DOM by key and never re-runs its renderer, so the key
 * has to cover every field the row actually paints — otherwise a lesson that is
 * cancelled, rescheduled or has a Program attached keeps its stale row. `id`
 * alone is not enough and `updatedAt` is not either: attaching a Program writes
 * the join table, not the `lessons` row, so its timestamp does not move.
 */
export function rowKey(lesson: LessonLike): string {
    return [
        lesson.id,
        lesson.status,
        lesson.scheduledAt,
        lesson.horseName ?? '',
        lesson.planId ?? '',
        lesson.programs.map((p) => p.id).join(','),
        lesson.exercises.map((e) => e.id).join(','),
    ].join('|');
}

/** Deep link into this Student's history for one Exercise, with a way back. */
export function historyHref(studentId: string, exerciseId: string, lessonId: string): string {
    const from = encodeURIComponent(`/lektioner/${lessonId}`);
    return `/students/${studentId}/exercises/${exerciseId}/history?from=${from}`;
}
