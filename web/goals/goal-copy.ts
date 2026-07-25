import { formatDate, plural, t } from '../i18n';
import type { ShareRecipient } from '../ui/copy';

/**
 * Copy and derivation rules for Mål (IA §3.13) and its detail (§3.14).
 *
 * Kept apart from the components for the reason `web/ui/copy.ts` states: the
 * component modules import `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so they cannot load in a DOM-less test process. Everything
 * here is pure — the role matrix, the status-transition rules, the overdue
 * derivation, the sharing recipients, the write predicates — which is precisely
 * the part worth asserting, so it lives where `bun test` can reach it.
 *
 * A Goal is the **destination** in the hierarchy `Goal → Plan → Lesson /
 * Training Session → Exercise → Note`. It belongs to an account outright: IA
 * §3.13 and UI_DECISIONS §1 both say Goals stay available regardless of
 * Relations, so nothing in this module gates a Goal on having a teacher.
 * Sharing changes who ELSE can read it; it never changes whose it is.
 */

// ─── Domain vocabulary ──────────────────────────────────────────

export type GoalStatus = 'active' | 'achieved' | 'abandoned';

/**
 * Who is reading this Goal. Derived from ownership, not from an account type:
 * the same person owns Goals here and reads a student's shared Goal there
 * (IA §1).
 *
 * There is deliberately no third value. A Teacher who is merely *connected* to
 * the owner is not a viewer of this Goal at all — the server answers 404 for
 * `GET /goals/:id` without a `goal_share` row — so "connected but not shared"
 * resolves as not found rather than as a reduced view (IA §3.14 state rules).
 */
export type GoalViewer = 'owner' | 'sharedTeacher';

// ─── The role matrix ────────────────────────────────────────────

/**
 * Which controls a Mål detail view may render.
 *
 * IA §3.14 splits the two roles sharply. The owner holds every lever. A shared
 * Teacher reads, writes notes, and moves the goal between *active* and
 * *achieved* — that is the whole point of sharing a goal with a coach — but
 * touches nothing else.
 *
 * Every withheld control is **absent**, never rendered disabled. The server
 * enforces the same boundary (`assertGoalOwner` throws NotFoundError), so a
 * disabled-but-present control would advertise a capability the API refuses,
 * and a greyed "Avbryt målet" on a teacher's screen would suggest the goal is
 * theirs to end.
 *
 * `seeCoWatchers` is the one that is a privacy rule rather than a permission.
 * §3.14 says a shared Teacher reads the Goal "without seeing co-watchers", and
 * the server backs it: `GoalTeacherView` omits `sharedTeacherIds` entirely and
 * `GET /goals/:id/shares` is owner-only. So the Delat med section is not merely
 * read-only for a Teacher — it does not exist for them.
 */
export interface GoalControls {
    /** Title, description, target date. Owner only. */
    editDetails: boolean;
    /** Share/unshare with connected Teachers. Owner only — their trust decision. */
    manageSharing: boolean;
    /** Attach/detach active Plans. Owner only. */
    managePlans: boolean;
    /** Render the named list of Teachers who can see this Goal. Owner only. */
    seeCoWatchers: boolean;
    /** Author notes on the Goal. Both roles — this is the conversation. */
    notes: boolean;
}

export function goalControls(viewer: GoalViewer): GoalControls {
    const owner = viewer === 'owner';
    return {
        editDetails: owner,
        manageSharing: owner,
        managePlans: owner,
        seeCoWatchers: owner,
        notes: true,
    };
}

/**
 * Which status transitions may be offered, given the current status and the
 * reader's role.
 *
 * Two rules, both from IA §3.14, both mirrored by `GoalService`:
 *
 * - **Abandoned cannot go directly to Achieved.** `markAchieved` throws
 *   `ConflictError('Goal is abandoned; reopen before achieving')`. So the
 *   Achieve control is withheld on an abandoned goal rather than offered and
 *   rejected — a control whose only outcome is a 409 is worse than no control.
 *   `reopen` is what the abandoned state offers instead, and reopening then
 *   makes Achieve available. The two-step path is the product rule, not an
 *   omission.
 * - **A shared Teacher may not Abandon.** Achieving and reopening are readings
 *   of the rider's progress, which is what a coach is there to judge. Ending
 *   the goal is a decision about what the rider is training for, and that is
 *   the owner's alone. The server agrees: `abandon` takes `studentId` and
 *   asserts ownership.
 *
 * Achieve is offered only from `active` for both roles — `markAchieved` is
 * idempotent on an already-achieved goal, so offering it there would be a
 * button that does nothing.
 */
export interface GoalTransitions {
    achieve: boolean;
    reopen: boolean;
    abandon: boolean;
}

export function goalTransitions(status: GoalStatus, viewer: GoalViewer): GoalTransitions {
    return {
        achieve: status === 'active',
        reopen: status !== 'active',
        abandon: viewer === 'owner' && status !== 'abandoned',
    };
}

/**
 * A 409 means this view is working from a stale copy — most plausibly because
 * the goal was abandoned elsewhere between load and click. Surfaced as a
 * recoverable conflict with a refresh path (IA §4), and detected by code, never
 * by matching a message string.
 */
export function isConflict(error: { code: string } | null | undefined): boolean {
    return error?.code === 'conflict';
}

// ─── Status presentation ────────────────────────────────────────

export interface StatusDescriptor {
    /** A THUNK, never a resolved string — see `lesson-copy.ts` for why. */
    label: () => string;
    variant: 'outline' | 'filled' | 'dashed';
    tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
    glyph?: string;
}

/**
 * The §4.4 shape grammar, which must stay legible with colour removed
 * entirely: outline = ongoing, filled = completed, dashed = cancelled. The
 * design system's own Mål row spells these three exactly — *Aktiv*, *Uppnådd*,
 * *✕ Avbruten* — so the mapping is transcription, not interpretation.
 *
 * Overdue is deliberately absent. IA §3.13 is explicit that overdue is
 * "supporting metadata, not a new domain status", so it can never reach this
 * function: a fourth pill would invent a status the server does not have and
 * that no transition could leave.
 */
export function goalStatusPill(status: GoalStatus): StatusDescriptor {
    switch (status) {
        case 'active':
            return { label: () => t('goal.status.active'), variant: 'outline', tone: 'info' };
        case 'achieved':
            return { label: () => t('goal.status.achieved'), variant: 'filled', tone: 'success' };
        case 'abandoned':
            return { label: () => t('goal.status.abandoned'), variant: 'dashed', tone: 'neutral', glyph: '✕' };
    }
}

// ─── Calendar dates ─────────────────────────────────────────────

/**
 * Read a `YYYY-MM-DD` column as a date in the reader's own day.
 *
 * `new Date('2026-09-01')` is parsed by spec as UTC midnight, so west of
 * Greenwich it renders as 31 August — a target date silently one day early for
 * every reader in the Americas. A target date is a calendar fact with no time
 * and no zone, so it is constructed from its parts in local time instead, and
 * every date helper below goes through here.
 *
 * Returns null for a malformed value rather than an Invalid Date, so callers
 * omit the fact instead of printing 'Invalid Date'.
 */
export function calendarDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return null;
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(year!, month! - 1, day!);
    // Rejects 2026-02-30 and friends, which round-trip to a different day.
    if (date.getFullYear() !== year || date.getMonth() !== month! - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

/** '1 september 2026'. Null when no target date was set — the caller omits it. */
export function targetDateLabel(targetDate: string | null): string | null {
    const date = calendarDate(targetDate);
    if (!date) return null;
    return t('goal.target', {
        date: formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' }),
    });
}

/** 'Uppnått 14 juli 2026' — the header's closing fact (IA §3.14). */
export function achievedLabel(achievedAt: string | null): string | null {
    if (!achievedAt) return null;
    const date = new Date(achievedAt);
    if (Number.isNaN(date.getTime())) return null;
    return t('goal.achievedAt', {
        date: formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' }),
    });
}

/**
 * Whether an **active** goal's target date has passed.
 *
 * IA §3.13: "Overdue is supporting metadata, not a new domain status." So this
 * returns a boolean the row prints beside the status pill, and never feeds
 * `goalStatusPill`. An achieved or abandoned goal is never overdue — the date
 * stopped mattering when the goal stopped being open, and marking a goal that
 * was *reached late* as overdue would read as a reproach for having finished.
 *
 * `today` is passed in rather than read from the clock so the boundary is
 * assertable and so a list does not reclassify a row mid-render on a signal
 * nothing subscribed to.
 */
export function isOverdue(
    goal: { status: GoalStatus; targetDate: string | null },
    todayIso: string,
): boolean {
    if (goal.status !== 'active') return false;
    const target = calendarDate(goal.targetDate);
    const today = calendarDate(todayIso);
    if (!target || !today) return false;
    return target.getTime() < today.getTime();
}

// ─── Grouping and ordering ──────────────────────────────────────

export interface GoalGroups<T> {
    active: T[];
    achieved: T[];
    abandoned: T[];
}

/**
 * IA §3.13's information order: **Aktiva**, then **Uppnådda**, then
 * **Avbrutna**. The server already returns goals in that order
 * (`GOAL_STATUS_ORDER`, then `created_at DESC`), so this partitions rather than
 * re-sorts — the sequence inside each group is the server's and stays stable.
 *
 * Three real groups rather than a status column: the question a rider brings to
 * this page is "what am I working on", and an achieved goal answering it from
 * the middle of the list is noise. Avbrutna in particular is collapsed by the
 * view, which is why it is returned separately rather than appended.
 */
export function groupGoals<T extends { status: GoalStatus }>(goals: T[]): GoalGroups<T> {
    return {
        active: goals.filter((g) => g.status === 'active'),
        achieved: goals.filter((g) => g.status === 'achieved'),
        abandoned: goals.filter((g) => g.status === 'abandoned'),
    };
}

// ─── Row content ────────────────────────────────────────────────

/** How many characters of the description a row shows before it elides. */
const EXCERPT_LENGTH = 90;

/**
 * A row's description excerpt, collapsed to one line and cut at a word
 * boundary. §4.3 allows a row at most two rows of text; a pasted paragraph
 * would push every following goal off the screen.
 */
export function descriptionExcerpt(description: string | null, max = EXCERPT_LENGTH): string | null {
    const flat = (description ?? '').replace(/\s+/g, ' ').trim();
    if (flat.length === 0) return null;
    if (flat.length <= max) return flat;
    const cut = flat.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** How many plan titles a row prints before it starts counting. */
const SUMMARY_NAMES = 2;

export interface PlanLike {
    id: string;
    title: string;
}

/**
 * 'Planer: Hoppsäsong vår 2026, Dressyrgrund +1' — the row's plan-membership
 * summary (IA §3.13).
 *
 * Named, not counted: "2 planer" tells the reader nothing they can act on,
 * while the title is the thing they recognise. Beyond two the tail folds into
 * `+N` so the row keeps its width.
 *
 * A plan id with no matching plan is *counted but not named*. That happens
 * while the plan list is still loading and after a plan the goal is linked to
 * has gone; in neither case may the summary understate how many places this
 * goal lives. Returns null when the goal belongs to no plan at all, so the row
 * omits the fact rather than printing "Ingen plan" on every unlinked row.
 */
export function planMembership(planIds: string[], plans: PlanLike[]): string | null {
    if (planIds.length === 0) return null;
    const titles = planIds
        .map((id) => plans.find((p) => p.id === id)?.title)
        .filter((title): title is string => typeof title === 'string' && title.length > 0);
    if (titles.length === 0) return plural('goal.plans.unnamed', planIds.length);
    const shown = titles.slice(0, SUMMARY_NAMES);
    const hidden = planIds.length - shown.length;
    const names = hidden > 0
        ? `${shown.join(', ')} ${t('goal.more', { count: hidden })}`
        : shown.join(', ');
    return plural('goal.plans.summary', planIds.length, { names });
}

/**
 * Identity of a rendered row.
 *
 * `$each` caches a row's DOM by key and never re-runs its renderer, so the key
 * has to cover every field the row paints. `updatedAt` alone is not enough:
 * sharing and plan membership are junction tables, so attaching a plan or
 * adding a share does not move the `goal` row's timestamp.
 */
export function goalRowKey(goal: {
    id: string;
    title: string;
    status: GoalStatus;
    targetDate: string | null;
    description: string | null;
    planIds: string[];
    sharedTeacherIds: string[];
}): string {
    return [
        goal.id,
        goal.title,
        goal.status,
        goal.targetDate ?? '',
        goal.description ?? '',
        [...goal.planIds].sort().join(','),
        [...goal.sharedTeacherIds].sort().join(','),
    ].join('|');
}

// ─── Sharing ────────────────────────────────────────────────────

export interface TeacherLike {
    id: string;
    displayName: string;
}

/**
 * The audience, by name, as the **owner** sees it (§4.5).
 *
 * The owner can enumerate their own Teachers, so every recipient normally
 * resolves to a real name. An id with no matching Teacher — a Relation removed
 * since the Goal was shared — is kept as an unnamed entry rather than dropped:
 * it still counts toward the `+N`, so the chip never understates who can read
 * the goal.
 */
export function ownerRecipients(
    sharedTeacherIds: string[],
    teachers: TeacherLike[],
): ShareRecipient[] {
    return sharedTeacherIds.map((id) => ({
        id,
        name: teachers.find((teacher) => teacher.id === id)?.displayName ?? '',
    }));
}

/**
 * Whether a sharing checkbox's change should actually write.
 *
 * The Träningspass slice lost a session's shares on open, because a signal
 * seeded from a later fetch was read as a user edit and PATCHed. Sharing here
 * is per-teacher (`POST /goals/:id/shares`, `DELETE …/:teacherId`) rather than
 * a whole-set replace, so the blast radius is smaller — but the same two guards
 * are what make a toggle safe, and they are stated here rather than trusted to
 * the component:
 *
 * - **`seeded`**: the share list arrives on a SECOND request, after the Goal.
 *   Until it lands the checkboxes' `stored` set is `[]`, which against a shared
 *   goal reads as "the user just unshared everyone". Nothing may be written
 *   before the server's answer is known.
 * - **an actual difference**: a checkbox re-rendered into the state it is
 *   already in must not fire a redundant write. Both endpoints are idempotent,
 *   so the write would succeed and be invisible — which is exactly what made
 *   the Träningspass bug survive review.
 */
export function shouldCommitShare(args: {
    /** Has the share list been filled from `GET /goals/:id/shares` yet? */
    seeded: boolean;
    teacherId: string;
    /** Where the checkbox now stands. */
    next: boolean;
    /** Teacher ids the SERVER last told us about — never the signal's history. */
    stored: string[];
}): boolean {
    if (!args.seeded) return false;
    return args.next !== args.stored.includes(args.teacherId);
}

// ─── Plan membership (§3.14) ────────────────────────────────────

export interface PlanOption {
    id: string;
    title: string;
    status: 'active' | 'archived';
}

/**
 * The Plans this Goal can still be attached to (IA §3.14: "Attach/detach
 * **active** Plans").
 *
 * Archived plans are excluded because the server refuses them —
 * `attachToPlan` throws NotFoundError when `plan.status !== 'active'` — and
 * IA §3.11 states the rule from the Plan's side: an archived Plan stays
 * readable but rejects new links. Already-linked plans are excluded because
 * offering them would produce a no-op (the insert is `onConflict … doNothing`).
 *
 * So every option this returns would genuinely change something, which is the
 * §4.9 rule for a picker.
 */
export function attachablePlans(plans: PlanOption[], linkedPlanIds: string[]): PlanOption[] {
    const linked = new Set(linkedPlanIds);
    return plans.filter((plan) => plan.status === 'active' && !linked.has(plan.id));
}

export interface HorseChoice {
    id: string;
    name: string;
}

/**
 * The Horses a Goal may be pointed at: the rider's own, minus the archived
 * ones. `GoalService.assertOwnUnarchivedHorse` rejects an archived horse, so
 * offering one would produce an option the server refuses — the §4.9 rule
 * again.
 */
export function selectableHorses<T extends { archivedAt: null | string }>(horses: T[]): T[] {
    return horses.filter((h) => h.archivedAt === null);
}

/**
 * Options for the Goal's horse picker on the detail view.
 *
 * Archiving a Horse does **not** clear goals that name it — the same promise
 * `horse.confirm.archive.message` makes about lessons and passes. So a goal
 * whose horse has since been archived must still be able to *show* that horse,
 * even though the horse is gone from the stable list. It is appended as its own
 * option, from the name the server hydrated, so switching away is a real choice
 * rather than a silent reset to "Ingen häst".
 */
export function horseChoices(
    horses: Array<{ id: string; name: string; archivedAt: null | string }>,
    current: { horseId: null | string; horseName: null | string },
): HorseChoice[] {
    const choices = selectableHorses(horses).map((h) => ({ id: h.id, name: h.name }));
    if (current.horseId && !choices.some((c) => c.id === current.horseId)) {
        choices.push({ id: current.horseId, name: current.horseName ?? current.horseId });
    }
    return choices;
}

/**
 * Whether a plan-attachment change should write. Same two guards, same reason
 * as `shouldCommitShare`: the goal's `planIds` arrive with the goal, but the
 * *plan titles* arrive separately, and a control rendered before either would
 * be acting on an unknown set.
 */
export function shouldCommitPlanLink(args: {
    seeded: boolean;
    planId: string;
    next: boolean;
    stored: string[];
}): boolean {
    if (!args.seeded) return false;
    return args.next !== args.stored.includes(args.planId);
}
