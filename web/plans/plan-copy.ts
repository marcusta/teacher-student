import { capitalize, formatDate, formatMonthBlock, plural, t } from '../i18n';
import { calendarDate, goalStatusPill, type GoalStatus, type StatusDescriptor } from '../goals/goal-copy';

/**
 * Copy and derivation rules for Planer (IA §3.11) and Plan detail (§3.12).
 *
 * Kept apart from the components for the reason `web/ui/copy.ts` states: the
 * component modules import `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so they cannot load in a DOM-less test process. Everything
 * here is pure — the role matrix, the date-range rules, the archived-state
 * consequences, the linked-occasion ordering — which is precisely the part
 * worth asserting, so it lives where `bun test` can reach it.
 *
 * **Why this module imports `goal-copy` and the occasion modules do not import
 * each other.** Lektion and Träningspass are siblings, so their shared helpers
 * are deliberately duplicated: neither may depend on the other to render
 * itself. Plan and Goal are not siblings — the canonical hierarchy is `Goal →
 * Plan → Lesson / Training Session`, and a Plan detail view renders Goal
 * statuses as a matter of course. A one-way dependency down that edge is the
 * structure, and it buys the thing duplication would cost: one spelling of
 * "Uppnådd", with one shape grammar behind it.
 */

// ─── The role matrix ────────────────────────────────────────────

export type PlanStatus = 'active' | 'archived';

/**
 * Who is reading this Plan. A Teacher reaches a Plan through a Relation with
 * its owner — `PlanService.getDetail` accepts any teacher with a `relations`
 * row — so unlike a Goal there is no per-object share to check.
 */
export type PlanViewer = 'owner' | 'connectedTeacher';

/**
 * Which controls a Plan detail view may render.
 *
 * IA §3.12 gives the connected Teacher exactly two verbs: **read** and
 * **navigate**. So every mutation is withheld — absent, not disabled. The
 * server enforces the same line (`update` and `archive` both filter on
 * `student_id`, and answer NotFoundError otherwise), which is why a greyed
 * "Arkivera" would be a promise the API refuses to keep.
 *
 * The archived axis is separate from the role axis because they forbid
 * different things:
 *
 * - **`attachGoals` closes on archive.** IA §3.11: an archived Plan "stays
 *   readable but rejects new links", and `GoalService.attachToPlan` throws
 *   NotFoundError for a non-active plan. Offering the picker there would only
 *   produce a failure the picker could have prevented.
 * - **`detachGoals` stays open.** `detachFromPlan` checks Goal ownership and
 *   nothing else, and it should: archiving a Plan must not trap a Goal inside
 *   it. Untangling is exactly what someone tidying up after archiving wants.
 * - **`editDetails` stays open.** Archive is a soft delete, not a freeze; a
 *   plan archived with a typo in its title must stay correctable. The server
 *   permits it.
 *
 * `detachOccasions` is absent from this interface on purpose. IA §3.12 says
 * detaching linked Lessons and Training Sessions needs a product decision
 * first — whether a Plan owner may detach a *Teacher-authored* Lesson from
 * their own hub — so there is no flag to accidentally switch on, and the
 * sections render as navigation only.
 */
export interface PlanControls {
    /** Title, description, dates, Primary Teacher. Owner only, any status. */
    editDetails: boolean;
    /** Link a Goal to this Plan. Owner only, and only while active. */
    attachGoals: boolean;
    /** Unlink a Goal. Owner only; survives archiving so nothing is trapped. */
    detachGoals: boolean;
    /** Archive. Owner only, and only from active — archiving is idempotent. */
    archive: boolean;
}

export function planControls(viewer: PlanViewer, status: PlanStatus): PlanControls {
    const owner = viewer === 'owner';
    const active = status === 'active';
    return {
        editDetails: owner,
        attachGoals: owner && active,
        detachGoals: owner,
        archive: owner && active,
    };
}

// ─── Status presentation ────────────────────────────────────────

export type { StatusDescriptor } from '../goals/goal-copy';

/**
 * §4.4's shape grammar: outline = ongoing, dashed = ended. An archived Plan
 * carries no glyph — the ✕ is reserved for the *cancelled* reading (an
 * inställd Lesson, an avbrutet Goal), and archiving a Plan is a filing decision
 * rather than an abandonment. The dashed ring already says "no longer running"
 * without colour, which is what §4.4 requires.
 */
export function planStatusPill(status: PlanStatus): StatusDescriptor {
    return status === 'archived'
        ? { label: () => t('plan.status.archived'), variant: 'dashed', tone: 'neutral' }
        : { label: () => t('plan.status.active'), variant: 'outline', tone: 'info' };
}

// Re-exported so a Plan detail view needs one import to render its Goals.
export { goalStatusPill } from '../goals/goal-copy';

// ─── Dates ──────────────────────────────────────────────────────

/**
 * '3 mars 2026 – 30 juni 2026', or the half-open forms.
 *
 * A Plan is a *horizon*, and both ends are optional — the server stores each
 * independently and IA §3.11 asks only that the range be shown. So all four
 * combinations get their own sentence rather than one template with an em dash
 * dangling off a missing end: "Från 3 mars 2026" and "Till och med 30 juni
 * 2026" both say something a bare "3 mars 2026 – " does not.
 *
 * Returns null when neither end is set, so the caller omits the fact instead
 * of printing "Inga datum" on every row of an undated list.
 */
export function dateRangeLabel(startDate: string | null, endDate: string | null): string | null {
    const start = calendarDate(startDate);
    const end = calendarDate(endDate);
    const long: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (start && end) {
        return t('plan.range.both', {
            start: formatDate(start, long),
            end: formatDate(end, long),
        });
    }
    if (start) return t('plan.range.from', { start: formatDate(start, long) });
    if (end) return t('plan.range.until', { end: formatDate(end, long) });
    return null;
}

/**
 * Whether a start/end pair is orderable. IA §3.11: "Invalid date range is
 * field-level" — so this answers the question the end-date field asks about
 * itself, and the view puts the message under that field rather than in a form
 * -level error summary.
 *
 * Equal dates are valid: a one-day plan is a legitimate horizon, and the server
 * imposes no ordering constraint at all. A malformed date is *not* reported as
 * a range problem — it is a different fault with a different fix, and
 * `<input type="date">` will not emit one anyway.
 */
export function isValidRange(startDate: string | null, endDate: string | null): boolean {
    const start = calendarDate(startDate);
    const end = calendarDate(endDate);
    if (!start || !end) return true;
    return start.getTime() <= end.getTime();
}

// ─── List content ───────────────────────────────────────────────

/** How many characters of the description a row shows before it elides. */
const EXCERPT_LENGTH = 110;

/**
 * A row's description excerpt, collapsed to one line and cut at a word
 * boundary — §4.3 allows a row at most two rows of text.
 */
export function descriptionExcerpt(description: string | null, max = EXCERPT_LENGTH): string | null {
    const flat = (description ?? '').replace(/\s+/g, ' ').trim();
    if (flat.length === 0) return null;
    if (flat.length <= max) return flat;
    const cut = flat.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * 'Huvudlärare: Alva Lindgren'.
 *
 * IA §3.11 is emphatic that this is "a label and defaulting convenience, **not
 * elevated permission**" — the Primary Teacher can read the Plan because they
 * are connected to its owner, exactly like every other connected Teacher, and
 * naming one here grants nothing. Nothing in this module derives access from
 * it, and the detail view states the rule in words next to the field so the
 * owner does not read the label as a lock.
 *
 * Null when unset: an explicit "Ingen huvudlärare" on every row of a list is
 * noise about an optional label.
 */
export function primaryTeacherLabel(displayName: string | null): string | null {
    return displayName ? t('plan.primaryTeacher', { name: displayName }) : null;
}

export interface PlanGroups<T> {
    active: T[];
    archived: T[];
}

/**
 * IA §3.11's information order: active Plans, then an archived section. The
 * server already orders `status ASC, created_at DESC`, so this partitions
 * rather than re-sorts.
 *
 * Archived is returned separately rather than appended because the view
 * collapses it behind a disclosure: an archived plan is a record, and a rider
 * with three seasons behind them should not scroll past them to reach this
 * spring.
 */
export function groupPlans<T extends { status: PlanStatus }>(plans: T[]): PlanGroups<T> {
    return {
        active: plans.filter((p) => p.status === 'active'),
        archived: plans.filter((p) => p.status === 'archived'),
    };
}

/**
 * Identity of a rendered row. Covers every field the row paints — see
 * `goalRowKey` for why `updatedAt` alone is not enough.
 */
export function planRowKey(plan: {
    id: string;
    title: string;
    status: PlanStatus;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    primaryTeacherDisplayName: string | null;
}): string {
    return [
        plan.id,
        plan.title,
        plan.status,
        plan.startDate ?? '',
        plan.endDate ?? '',
        plan.description ?? '',
        plan.primaryTeacherDisplayName ?? '',
    ].join('|');
}

// ─── Linked occasions (§3.12) ───────────────────────────────────

export interface DateBlock {
    /** '14' — rendered with tabular numerals (§4.3). */
    day: string;
    /** 'JUL' — three characters, so the block keeps its fixed width. */
    month: string;
    /** '17:00'. */
    time: string;
}

/**
 * The §4.3 date block. `formatMonthBlock` rather than `formatMonthAbbrev`
 * because sv's four-character months ('JULI', 'MARS') break the block's
 * alignment — see UI_DECISIONS §4.
 */
export function dateBlock(iso: string): DateBlock {
    return {
        day: formatDate(iso, { day: 'numeric' }),
        month: formatMonthBlock(iso),
        time: formatDate(iso, { hour: '2-digit', minute: '2-digit' }),
    };
}

/** 'Onsdag 22 juli · 17:00' — an occasion row's leading fact. */
export function occasionWhen(iso: string): string {
    return [
        capitalize(formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })),
        formatDate(iso, { hour: '2-digit', minute: '2-digit' }),
    ].join(' · ');
}

export interface OccasionGroups<T> {
    upcoming: T[];
    past: T[];
}

/**
 * IA §3.12: Lektioner "upcoming first, then recent past".
 *
 * The server hands them back `scheduled_at ASC`, which is right for the
 * upcoming half and backwards for the other: the most useful past lesson is the
 * one that just happened, not the first one ever taught. So past is reversed to
 * newest-first, which is also the order §3.12 gives Träningspass, and the two
 * sections then read the same way.
 *
 * `nowIso` is a parameter rather than a clock read so the boundary is
 * assertable and so a lesson cannot cross between groups mid-render on a signal
 * nothing subscribed to.
 */
export function groupLinkedLessons<T extends { scheduledAt: string }>(
    lessons: T[],
    nowIso: string,
): OccasionGroups<T> {
    const upcoming = lessons
        .filter((l) => l.scheduledAt >= nowIso)
        .slice()
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    const past = lessons
        .filter((l) => l.scheduledAt < nowIso)
        .slice()
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    return { upcoming, past };
}

/** IA §3.12: Träningspass, **newest first**. */
export function sortLinkedSessions<T extends { performedAt: string }>(items: T[]): T[] {
    return items.slice().sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

/** 'Alva Lindgren · Planerad · Luna' — a linked Lesson's supporting line. */
export function lessonMeta(lesson: {
    teacherDisplayName: string;
    status: 'planned' | 'completed' | 'cancelled';
    horseName: string | null;
}): string {
    return [lesson.teacherDisplayName, t(`lesson.status.${lesson.status}`), lesson.horseName]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join(' · ');
}

/** '45 min · Luna · Bra tempo i galoppen' — a linked Training Session's line. */
export function sessionMeta(session: {
    durationMin: number | null;
    horseName: string | null;
    summary: string | null;
}): string | null {
    const parts = [
        session.durationMin === null || !Number.isFinite(session.durationMin)
            ? null
            : plural('trainingSession.duration', session.durationMin),
        session.horseName,
        descriptionExcerpt(session.summary, 70),
    ].filter((part): part is string => typeof part === 'string' && part.length > 0);
    return parts.length === 0 ? null : parts.join(' · ');
}

// ─── Goal attachment from the Plan side (§3.12) ─────────────────

export interface GoalOption {
    id: string;
    title: string;
    status: GoalStatus;
}

/**
 * The Goals this Plan can still take.
 *
 * Already-linked goals are excluded (the insert is `onConflict … doNothing`, so
 * offering them would be a no-op), and so are abandoned ones: hanging an
 * abandoned goal off a live plan states an intention that has already been
 * withdrawn. Achieved goals stay offerable — a plan that records what was
 * reached during it is exactly what the hub is for.
 *
 * Note what this does NOT do: it never reads `PlanDetail.goals` to decide what
 * is already linked. That array is privacy-filtered per reader, so on a
 * connected Teacher's screen it is a subset — and this picker is owner-only
 * anyway (`planControls().attachGoals`), where the owner's own `planIds` are
 * the complete truth.
 */
export function attachableGoals(goals: GoalOption[], linkedGoalIds: string[]): GoalOption[] {
    const linked = new Set(linkedGoalIds);
    return goals.filter((goal) => goal.status !== 'abandoned' && !linked.has(goal.id));
}

/**
 * Which Goals of the owner's are linked to this Plan.
 *
 * Derived from the **Goal** side (`goal.planIds`) rather than from
 * `PlanDetail.goals`, for the reason above: `PlanService.getDetail` filters its
 * `goals` array by `goal_share`, so it answers "what may this reader see",
 * which is a different question from "what is attached". Using it to drive the
 * owner's attach/detach controls would work today only because the owner sees
 * everything — and would quietly become wrong the moment anything else read
 * from it.
 */
export function linkedGoalIds(goals: { id: string; planIds: string[] }[], planId: string): string[] {
    return goals.filter((goal) => goal.planIds.includes(planId)).map((goal) => goal.id);
}

/**
 * The empty-state copy for the Mål section, which is **not** the same sentence
 * for both readers.
 *
 * `PlanService.getDetail` now filters linked Goals by `goal_share`: a connected
 * Teacher sees only the Goals shared with them individually. An empty array
 * therefore means two different things. For the owner it means the plan has no
 * goals. For a Teacher it means *none of this plan's goals is shared with you* —
 * and saying "Inga mål kopplade" to them would be a claim the view cannot
 * support and that happens to be false whenever the owner has attached a
 * private goal.
 *
 * The Teacher's wording is also the reason no count is rendered anywhere near
 * this section: "1 av 3 mål" would leak precisely the two the filter hid.
 */
export function goalsEmptyKey(viewer: PlanViewer): string {
    return viewer === 'owner' ? 'plan.goals.empty.owner' : 'plan.goals.empty.teacher';
}
