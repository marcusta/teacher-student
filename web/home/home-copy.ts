import { formatRelative, plural, t } from '../i18n';
import { isOverdue, targetDateLabel } from '../goals/goal-copy';
import { descriptionExcerpt } from '../plans/plan-copy';
import { lessonWhen } from '../lessons/lesson-copy';
import { sessionWhen } from '../training-sessions/training-session-copy';
import type {
    DashboardAwaitingItem,
    DashboardCapabilities,
    DashboardFeedback,
    DashboardGoalRef,
    DashboardNextLesson,
    DashboardPlanRef,
    DashboardView,
} from '../api/dashboard.gen';

/**
 * Block selection, state discrimination and copy for **Hem** (IA §3.1).
 *
 * Kept apart from `home.component.ts` for the reason `web/ui/copy.ts`,
 * `nav.structure.ts` and `route-guard.ts` all state: the component modules
 * import `../theme`, whose `createTokens()` writes a `<style>` at import time,
 * so they cannot load in a DOM-less test process. Everything here is pure — the
 * block order, the four-card cap, the three (four) page states, the hrefs and
 * the overdue derivation — which is precisely the part worth asserting, so it
 * lives where `bun test` can reach it. **No `../theme`, no
 * `@basics/core/client/core`, no `document`.**
 *
 * Two standing rules from the frozen read contract are encoded here rather than
 * left to the component, because both are easy to get wrong in a way nothing
 * would catch:
 *
 * - **`capabilities` is a fact, not a gate** (contract §2.1). The *only*
 *   capability gate in this slice is whether **Boka lektion** renders.
 *   `Logga pass` is always available (`TrainingSessionService.create` requires
 *   no Relation), and the Riding block is **never** gated on `rides` — a
 *   zero-Relation account still owns Plans and Goals, so the block renders when
 *   it has content. See `visibleBlocks`.
 * - **There is no read-state** (contract §2.2). `latestFeedback` is the latest,
 *   not the unread; the copy says "Senaste återkoppling" and nothing here
 *   derives "new" from a timestamp or emits a badge.
 *
 * Every function that needs the clock takes it as an explicit `nowIso` /
 * `todayIso` parameter (contract §4.3). Nothing in this module reads
 * `Date.now()`.
 */

// ─── Hrefs (contract §3.8 — the client builds every route) ──────

/**
 * The server sends no `deepLink`. `web/app/route-guard.ts`'s `APP_ROUTES` is
 * this app's single route enumeration, and a server-emitted path would be a
 * route string that never passes through it. So every href on this page is
 * built here, from `targetKind`/`targetId`, in Swedish — the routes are Swedish
 * (`/lektioner`, `/traningspass`, `/mal`) while the API is English, and pushing
 * UI language into the service layer is the other half of the same mistake.
 *
 * `tests/home-copy.test.ts` feeds every href this module can produce through
 * `safeReturnTo`, so a route invented here fails the build rather than becoming
 * quietly un-returnable-to.
 */
export function nextLessonHref(lessonId: string): string {
    return `/lektioner/${lessonId}`;
}

export function planHref(planId: string): string {
    return `/planer/${planId}`;
}

export function goalHref(goalId: string): string {
    return `/mal/${goalId}`;
}

/**
 * Where the latest-feedback card navigates.
 *
 * Switches on `targetKind`, never on `parentKind`: `lesson_exercise` and
 * `training_session_exercise` have no routes of their own, which is exactly why
 * the payload carries a separate target. `feedbackContext` is the one that reads
 * `parentKind`, and it reads it for wording only.
 */
export function feedbackHref(feedback: Pick<DashboardFeedback, 'targetKind' | 'targetId'>): string {
    switch (feedback.targetKind) {
        case 'lesson':
            return nextLessonHref(feedback.targetId);
        case 'training_session':
            return `/traningspass/${feedback.targetId}`;
        case 'goal':
            return goalHref(feedback.targetId);
    }
}

/** Where an "väntar på din återkoppling" row navigates. */
export function awaitingHref(item: Pick<DashboardAwaitingItem, 'kind' | 'id'>): string {
    return item.kind === 'lesson' ? `/lektioner/${item.id}` : `/traningspass/${item.id}`;
}

/**
 * The Lessons list.
 *
 * Named for the destination rather than for one caller, because it has three:
 * the Teaching block's exit, and the empty `nextLesson` and `latestFeedback`
 * cards' single §4.14 exit. It was `AWAITING_ALL_HREF`, which described only the
 * first and misnamed the other two.
 *
 * Note what this route does NOT cover. The awaiting block lists lessons *and*
 * träningspass, and the feedback card spans goals and träningspass too, while
 * `/lektioner` is only the first of those. Contract §3.4 sanctions the route —
 * there is no combined occasion list to send people to — so the honesty has to
 * live in the LABEL, which is why `home.awaiting.all` names its destination
 * ("Öppna Lektioner") instead of claiming to show "alla lektioner" or, worse,
 * everything the card just listed.
 */
export const LESSONS_HREF = '/lektioner';

// ─── Quick actions (contract §2.1 — the one capability gate) ────

export type QuickActionKind = 'logSession' | 'bookLesson';

export interface QuickAction {
    kind: QuickActionKind;
    /** i18n key for the visible label. Resolved by the component, not here. */
    labelKey: string;
    href: string;
}

/**
 * IA §3.1 item 6. **Logga pass is unconditional.**
 *
 * `TrainingSessionService.create(studentId, …)` requires no `relations` row, so
 * an account with `{ teaches: false, rides: false }` — the state every new
 * account lands in (IA §3.20) — can genuinely log a session, and hiding the
 * action would hide the one thing that account can actually do.
 *
 * **Boka lektion is gated on `teaches`, and it is the only gate in this slice.**
 * `LessonService.create` requires a `relations` row, so without one the action
 * is not merely inadvisable, it is unavailable — and per LESSONS #4 the control
 * is withheld rather than rendered disabled. Discovery of teaching is the nav's
 * job (`UI_DECISIONS.md` §1: Undervisning renders for every account) and the
 * `fresh` empty state's, not this row's.
 */
export function quickActions(capabilities: DashboardCapabilities): QuickAction[] {
    const actions: QuickAction[] = [
        { kind: 'logSession', labelKey: 'home.action.logSession', href: '/traningspass/ny' },
    ];
    if (capabilities.teaches) {
        actions.push({ kind: 'bookLesson', labelKey: 'home.action.bookLesson', href: '/lektioner/ny' });
    }
    return actions;
}

// ─── Page state (IA §3.1 States) ────────────────────────────────

/**
 * Which of the page's states applies.
 *
 * - `invited` — a pending invitation and nothing else: welcome plus a single
 *   **Öppna Inkorgen** action. The post-registration landing of IA §3.20.
 * - `fresh` — no Relations and no content at all: two equally weighted starting
 *   paths. Neither may be hidden by capability (`UI_DECISIONS.md` §1).
 * - `ready` — the normal dashboard.
 * - `unknown` — **the non-negotiable fourth state.** Modelled on
 *   `student-copy.rosterState`: while the fetch is unresolved *or has failed*,
 *   neither empty state may render. Substituting "you have nothing" for "we do
 *   not know" is the one substitution that misinforms rather than merely
 *   underinforms, and a failed request is exactly when it happens.
 *
 * Failure is checked before resolution because a request that errored is never
 * coming back on its own, and because an `Async` can be both settled and failed.
 */
export type HomeState = 'unknown' | 'invited' | 'fresh' | 'ready';

export function homeState(
    view: DashboardView | null | undefined,
    args: { resolved: boolean; failed: boolean },
): HomeState {
    // Nothing below this line may be claimed without an answer in hand.
    if (args.failed || !args.resolved || !view) return 'unknown';
    if (hasContent(view)) return 'ready';
    if (view.pendingInvitations > 0) return 'invited';
    const { teaches, rides } = view.capabilities;
    if (!teaches && !rides) return 'fresh';
    // Related to someone, but with nothing scheduled yet: a real dashboard whose
    // blocks are empty, not a blank account. Their empty copy is the answer.
    return 'ready';
}

/**
 * Whether the payload carries anything at all to render.
 *
 * `pendingInvitations` is deliberately NOT content: it is what distinguishes
 * `invited` from `fresh`, and counting it here would collapse the two.
 */
function hasContent(view: DashboardView): boolean {
    return (
        view.nextLesson !== null
        || view.latestFeedback !== null
        || view.awaitingFeedback.length > 0
        || view.activePlans.length > 0
        || view.goalsNearingTarget.length > 0
    );
}

// ─── Block selection (IA §3.1, UI_DECISIONS §6 / design system §4.2) ──

export type HomeBlockKind = 'nextLesson' | 'latestFeedback' | 'awaitingFeedback' | 'riding';

export type HomeBlock =
    | { kind: 'nextLesson'; lesson: DashboardNextLesson | null }
    | { kind: 'latestFeedback'; feedback: DashboardFeedback | null }
    | { kind: 'awaitingFeedback'; items: DashboardAwaitingItem[] }
    | { kind: 'riding'; plans: DashboardPlanRef[]; goals: DashboardGoalRef[] };

/**
 * The ordered block list.
 *
 * Priority, from IA §3.1's information order:
 *
 * 1. `nextLesson` — the time-sensitive primary card.
 * 2. `latestFeedback` — what someone said to me.
 * 3. `awaitingFeedback` — what I owe someone. Ahead of the riding block on
 *    purpose: a person owing feedback is owed by somebody else, and the page
 *    answers "what needs me today?".
 * 4. `riding` — my own Plans and Goals, sharing one card (IA §3.1 item 5 pairs
 *    them, and four cards is the ceiling).
 *
 * `UI_DECISIONS.md` §6 notes that a phone yields one column *in priority order*
 * — that is a consequence of `auto-fit`, so the order has to come from this
 * array and never from source order in the template.
 *
 * **What renders, and why the two rules differ:**
 *
 * - The first two blocks always render. They are the page's subject, and both
 *   have their own empty copy ("Ingen bokad lektion", "Ingen delad
 *   återkoppling än") — an absence a reader asked about is an answer.
 * - `riding` renders **iff it has content**, and is **never gated on
 *   `capabilities.rides`**. Contract §2.1 is explicit: `activePlans` and
 *   `goalsNearingTarget` are ownership-scoped, so an account with zero
 *   Relations can own both, and gating on `rides` would hide a person's own
 *   Goals from them. This is the mistake the contract names by name.
 * - `awaitingFeedback` renders when it has content, or when `teaches` is true.
 *   The second half is not a permission gate: the block's subject is occasions
 *   the reader *taught*, and without a teaching Relation no such occasion can
 *   exist, so there is nothing the card could be an empty state *of*. With one,
 *   "Du har svarat på allt" is a real answer and worth a card.
 *
 * **The four-card cap (design system §4.2, `UI_DECISIONS.md` §6) is structural,
 * not a trailing `.slice()`.** There is exactly one `HomeBlockKind` per push
 * below and each push is guarded once, so the longest list this function can
 * return is the four kinds, one each. There used to be a `.slice(0, MAX_BLOCKS)`
 * on the return and a `MAX_BLOCKS = 4` beside it; both were removed because they
 * could not truncate anything, and their presence was actively harmful — the
 * test that guarded the cap asserted `length <= MAX_BLOCKS`, a bound the code
 * cannot exceed by construction, so it asserted nothing at all. The cap is now
 * asserted the only way it can really be: `home-copy.test.ts` pins the exact
 * kind list returned for the fullest payload there is, so a fifth push is a
 * failing test rather than a slice that silently drops it.
 */
export function visibleBlocks(view: DashboardView): HomeBlock[] {
    const blocks: HomeBlock[] = [
        { kind: 'nextLesson', lesson: view.nextLesson },
        { kind: 'latestFeedback', feedback: view.latestFeedback },
    ];
    if (view.awaitingFeedback.length > 0 || view.capabilities.teaches) {
        blocks.push({ kind: 'awaitingFeedback', items: view.awaitingFeedback });
    }
    if (view.activePlans.length > 0 || view.goalsNearingTarget.length > 0) {
        blocks.push({ kind: 'riding', plans: view.activePlans, goals: view.goalsNearingTarget });
    }
    return blocks;
}

/** The heading key for a block. Resolved by the component inside its own effect. */
export function blockTitleKey(kind: HomeBlockKind): string {
    switch (kind) {
        case 'nextLesson':
            return 'home.nextLesson';
        case 'latestFeedback':
            return 'home.feedback';
        case 'awaitingFeedback':
            return 'home.awaiting';
        case 'riding':
            return 'home.riding';
    }
}

// ─── Next lesson (IA §3.1 item 2) ───────────────────────────────

/** 'Onsdag 22 juli · 17:00'. Reuses `lesson-copy` — there is one such phrase. */
export function nextLessonWhen(lesson: Pick<DashboardNextLesson, 'scheduledAt'>): string {
    return lessonWhen(lesson.scheduledAt);
}

/**
 * The card's supporting line: counterparty, then Horse, then Plan.
 *
 * Nulls are dropped rather than printed as "Ingen häst" — §4.3 gives a card two
 * rows of text, and an absent optional fact spends one of them saying nothing.
 */
export function nextLessonMeta(lesson: DashboardNextLesson): string {
    return [lesson.counterpartyDisplayName, lesson.horseName, lesson.planTitle]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join(' · ');
}

/**
 * '+2 övningar till', or null when the preview is the whole list.
 *
 * The count goes through `plural()`, never through a hand-built string: '1
 * övning till' and '2 övningar till' are different words in Swedish, and the
 * string table is not where arithmetic belongs.
 */
export function moreExercisesLabel(lesson: Pick<DashboardNextLesson, 'exercisePreview' | 'exerciseCount'>): string | null {
    const hidden = lesson.exerciseCount - lesson.exercisePreview.length;
    return hidden > 0 ? plural('home.nextLesson.exercises.more', hidden) : null;
}

// ─── Latest feedback (IA §3.1 item 3, contract §2.2) ────────────

/**
 * The context line — 'På övningen Volt i lektionen med Alva Lindgren'.
 *
 * Switches on **`parentKind`**, not `targetKind`, so an exercise-occurrence note
 * says which exercise it was written on. That distinction is the whole reason
 * the payload carries both: `targetKind` answers "where does this link to",
 * `parentKind` answers "what is this about", and they differ for exactly the two
 * junction kinds.
 *
 * A junction note with no `exerciseName` falls back to the occasion-level
 * wording rather than printing 'På övningen  i lektionen med …'. That should not
 * happen — the server resolves the name in the same statement — but a dangling
 * preposition is a worse failure than a slightly less specific sentence.
 */
export function feedbackContext(
    feedback: Pick<DashboardFeedback, 'parentKind' | 'targetLabel' | 'exerciseName'>,
): string {
    const exercise = feedback.exerciseName ?? '';
    switch (feedback.parentKind) {
        case 'lesson':
            return t('home.feedback.on.lesson', { name: feedback.targetLabel });
        case 'lesson_exercise':
            return exercise
                ? t('home.feedback.on.lessonExercise', { exercise, name: feedback.targetLabel })
                : t('home.feedback.on.lesson', { name: feedback.targetLabel });
        case 'training_session':
            return t('home.feedback.on.trainingSession');
        case 'training_session_exercise':
            return exercise
                ? t('home.feedback.on.trainingSessionExercise', { exercise })
                : t('home.feedback.on.trainingSession');
        case 'goal':
            return t('home.feedback.on.goal', { title: feedback.targetLabel });
    }
}

/**
 * 'Alva Lindgren · i går 19:32'.
 *
 * `formatRelative` rather than a string-table date, and `nowIso` rather than the
 * clock — contract §4.3. This is the **client's** frozen instant, not
 * `view.generatedAt`: how long ago someone wrote to me is a fact about my day.
 */
export function feedbackByline(
    feedback: Pick<DashboardFeedback, 'authorDisplayName' | 'createdAt'>,
    nowIso: string,
): string {
    return t('home.feedback.byline', {
        name: feedback.authorDisplayName,
        when: formatRelative(feedback.createdAt, new Date(nowIso)),
    });
}

/** How many characters of a note body the card shows. */
export const FEEDBACK_EXCERPT_LENGTH = 110;

/**
 * The card's excerpt of the note body.
 *
 * Delegates to `plan-copy.descriptionExcerpt` — collapsing whitespace and
 * cutting at a word boundary is a decision that already exists, and a second
 * excerpt length would make two cards on the same page elide differently.
 */
export function feedbackExcerpt(body: string | null): string | null {
    return descriptionExcerpt(body, FEEDBACK_EXCERPT_LENGTH);
}

// ─── Awaiting feedback (IA §3.1 item 4) ─────────────────────────

/** 'Lektion med Alva Lindgren' / 'Träningspass · Alva Lindgren'. */
export function awaitingLabel(item: Pick<DashboardAwaitingItem, 'kind' | 'studentDisplayName'>): string {
    return item.kind === 'lesson'
        ? t('home.awaiting.lesson', { name: item.studentDisplayName })
        : t('home.awaiting.session', { name: item.studentDisplayName });
}

/**
 * The row's date phrase, in the vocabulary of the occasion it names — a Lesson
 * is *scheduled*, a Training Session is *performed*, and the two modules already
 * spell each one. Reused rather than re-derived so the same instant never reads
 * two ways on one page.
 */
export function awaitingWhen(item: Pick<DashboardAwaitingItem, 'kind' | 'occurredAt'>): string {
    return item.kind === 'lesson' ? lessonWhen(item.occurredAt) : sessionWhen(item.occurredAt);
}

/**
 * '3 tillfällen' — the block's count.
 *
 * The count is of the **bounded** list the server returned (contract §3.4:
 * 90-day floor, `LIMIT 5`, and deliberately no total). It is a prompt, not a
 * work queue, so this must never be presented as a backlog total.
 */
export function awaitingCountLabel(items: readonly unknown[]): string {
    return plural('home.awaiting.count', items.length);
}

// ─── Riding block (IA §3.1 item 5) ──────────────────────────────
//
// Never gated on `capabilities.rides` — see `visibleBlocks`.

/** '2 aktiva planer'. */
export function planCountLabel(plans: readonly unknown[]): string {
    return plural('home.plans.count', plans.length);
}

/** 'Måldatum 1 september 2026', or null. Reuses `goal-copy.targetDateLabel`. */
export function goalTargetLabel(goal: Pick<DashboardGoalRef, 'targetDate'>): string | null {
    return targetDateLabel(goal.targetDate);
}

/**
 * Whether a Goal on this card is past its target date.
 *
 * The server sends **no `overdue` flag** — IA §3.13: "Overdue is supporting
 * metadata, not a new domain status" — so the view derives it, and derives it
 * with `goal-copy.isOverdue` rather than a second date comparison. That helper
 * also parses `YYYY-MM-DD` in the reader's own calendar day, which is why
 * overdue stays on the client at all (contract §3.6: the server's horizon is
 * computed in the server's zone and is a *soft* window; overdue is not soft).
 *
 * `goalsNearingTarget` contains only `active` goals, so the status is asserted
 * here as a constant. `isOverdue` refuses to mark a non-active goal overdue
 * anyway — belt and braces, deliberately, and the test asserts both.
 */
export function isGoalOverdue(goal: Pick<DashboardGoalRef, 'targetDate'>, todayIso: string): boolean {
    return isOverdue({ status: 'active', targetDate: goal.targetDate }, todayIso);
}

/** The 'Datum passerat' marker, or null. Rendered beside the date, never as a pill. */
export function goalOverdueLabel(goal: Pick<DashboardGoalRef, 'targetDate'>, todayIso: string): string | null {
    return isGoalOverdue(goal, todayIso) ? t('home.goals.overdue') : null;
}

// ─── Invitations (contract §2.2 — a domain state, not a read state) ──

/**
 * 'Du har 2 inbjudningar som väntar.'
 *
 * Swedish CLDR has no `.zero` category — `Intl.PluralRules('sv').select(0)` is
 * `'other'` — so without an explicit `home.invitations.zero` a zero count reads
 * "Du har 0 inbjudningar som väntar.", which is a sentence no reader should ever
 * be shown. `plural()` looks for `<key>.zero` first when the count is 0, so the
 * guard is a catalog key rather than a branch here. Both call sites are supposed
 * to be unreachable at zero (the `invited` state requires `> 0`, and so does the
 * `ready` banner), which is exactly why the guard belongs somewhere that cannot
 * be forgotten by a third caller.
 */
export function invitationsMessage(count: number): string {
    return plural('home.invitations', count);
}

/** Where the `invited` state's single action goes. */
export const INBOX_HREF = '/inbox';

// ─── The `fresh` state's two equal paths (IA §3.1) ──────────────

export interface StartPath {
    key: 'teach' | 'ride';
    titleKey: string;
    bodyKey: string;
    actionKey: string;
    href: string;
    /**
     * A deliberately lower-tier link beneath the second panel. Design system
     * §4.14 wants exactly one action per empty state and IA §3.1 wants two equal
     * paths; two panels of one action each satisfies both, and the third link is
     * ghost-tier so the two paths stay equal *to each other*.
     */
    secondary?: { actionKey: string; href: string };
}

/**
 * The blank account's two starting paths, at equal weight.
 *
 * **Neither is capability-gated, and the order is fixed.** A brand-new account
 * has `teaches: false` and must still discover that inviting a student is
 * possible (`UI_DECISIONS.md` §1) — hiding the teaching path from the only
 * accounts that have not yet found it is the exact failure that rule exists to
 * prevent. This function therefore takes no arguments: there is nothing it could
 * legitimately vary on.
 */
export function startPaths(): StartPath[] {
    return [
        {
            key: 'teach',
            titleKey: 'home.start.teach.title',
            bodyKey: 'home.start.teach.body',
            actionKey: 'home.start.teach.action',
            href: '/students',
        },
        {
            key: 'ride',
            titleKey: 'home.start.ride.title',
            bodyKey: 'home.start.ride.body',
            actionKey: 'home.start.ride.action',
            href: '/hastar',
            // `/mal/nytt`, not `/mal`. IA §3.1: "Quick actions open creation
            // with known context prefilled" — and this link only ever renders in
            // the `fresh` state, so by construction the reader has no goals and
            // the list would be a blank page. The sibling quick actions already
            // point at `/traningspass/ny` and `/lektioner/ny`.
            secondary: { actionKey: 'home.start.ride.goal', href: '/mal/nytt' },
        },
    ];
}

// ─── Freshness (contract §4.3) ──────────────────────────────────

/**
 * 'Uppdaterad i går 19:32' — how old this payload is.
 *
 * `generatedAt` is the **server's** assembly clock and is used for exactly this
 * and nothing else. It is never the page's `nowIso`: server-side windows are
 * already baked into the payload, while every client-side derivation
 * (`isGoalOverdue`, `feedbackByline`) belongs to the reader's local day.
 */
export function updatedLabel(generatedAt: string, nowIso: string): string {
    return t('home.updated', { when: formatRelative(generatedAt, new Date(nowIso)) });
}

// ─── Row keys ───────────────────────────────────────────────────
//
// `$each` caches a row's DOM by key and never re-runs its renderer, so each key
// covers every field its row paints — the same convention as `studentRowKey` and
// `goalRowKey`, and for the same reason: an id-only key leaves a stale row on
// screen after the only thing that changed is what the row says.

export function homeBlockKey(block: HomeBlock): string {
    switch (block.kind) {
        case 'nextLesson':
            return `nextLesson:${block.lesson ? homeLessonKey(block.lesson) : ''}`;
        case 'latestFeedback':
            return `latestFeedback:${block.feedback ? homeFeedbackKey(block.feedback) : ''}`;
        case 'awaitingFeedback':
            return `awaitingFeedback:${block.items.map(homeAwaitingRowKey).join('|')}`;
        case 'riding':
            return [
                'riding',
                block.plans.map(homePlanRowKey).join('|'),
                block.goals.map(homeGoalRowKey).join('|'),
            ].join(':');
    }
}

export function homeLessonKey(lesson: DashboardNextLesson): string {
    return [
        lesson.id,
        lesson.scheduledAt,
        lesson.counterpartyDisplayName,
        lesson.horseName ?? '',
        lesson.planTitle ?? '',
        lesson.exercisePreview.join(','),
        String(lesson.exerciseCount),
    ].join('|');
}

/**
 * Every field the feedback card paints, and there are seven of them.
 *
 * The card is not just an excerpt: `feedbackExcerpt(body) ?? targetLabel` is the
 * value, `feedbackContext` reads `parentKind`, `targetLabel` and `exerciseName`,
 * and `feedbackByline` reads `authorDisplayName` and `createdAt`. This key used
 * to be `noteId` + `body` alone, which meant that after a `reload()` in which
 * someone had been renamed — or a note had been moved, or its exercise
 * resolved — `$each` matched the old key, never re-ran the renderer, and left
 * the previous author's name on screen beside the new body.
 *
 * `targetKind`/`targetId` are in here too because they are what `feedbackHref`
 * builds the card's own destination from, and a card whose href is stale sends
 * the reader somewhere the payload no longer points.
 */
export function homeFeedbackKey(feedback: DashboardFeedback): string {
    return [
        feedback.noteId,
        feedback.body ?? '',
        feedback.authorDisplayName,
        feedback.createdAt,
        feedback.targetLabel,
        feedback.parentKind,
        feedback.exerciseName ?? '',
        feedback.targetKind,
        feedback.targetId,
    ].join('|');
}

export function homeAwaitingRowKey(item: DashboardAwaitingItem): string {
    return [item.kind, item.id, item.occurredAt, item.studentDisplayName, item.horseName ?? ''].join('|');
}

export function homePlanRowKey(plan: DashboardPlanRef): string {
    return [
        plan.id,
        plan.title,
        plan.startDate ?? '',
        plan.endDate ?? '',
        plan.primaryTeacherDisplayName ?? '',
    ].join('|');
}

/**
 * Includes `targetDate` because the row paints two things derived from it — the
 * target-date label and the overdue marker — neither of which the server sends.
 * The page's `todayIso` is frozen at mount, so the date is the only input to
 * either that can move while the page is open.
 */
export function homeGoalRowKey(goal: DashboardGoalRef): string {
    return [goal.id, goal.title, goal.targetDate].join('|');
}
