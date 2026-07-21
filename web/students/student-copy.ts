import { formatDate, formatRelative, getLocale, plural, t } from '../i18n';
import type { StatusDescriptor } from '../goals/goal-copy';

/**
 * Copy and derivation rules for **Mina elever** (IA §3.3) and **Elevvy**
 * (IA §3.4).
 *
 * Kept apart from the components for the reason `web/ui/copy.ts` states: the
 * component modules import `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so they cannot load in a DOM-less test process. Everything
 * here is pure, which is also the part worth asserting — the privacy filters,
 * the tab inventory, the invitation status vocabulary and the roster ordering.
 *
 * Two rules in this module are privacy rules rather than presentation, and both
 * are load-bearing:
 *
 * - `sharedGoals()` and `sharedGoalCount()` exist so that no count rendered by
 *   Elevvy can be derived from anything but the shared set. IA §3.4: "Do not
 *   expose a Goal merely because its title is visible through a Plan unless the
 *   Goal itself is shared."
 * - `lessonsWithStudent()` filters on the reader being the *teacher* of the
 *   Lesson, not merely on the student id matching. `GET /lessons` returns every
 *   Lesson the reader teaches **or attends**; without the role check a person
 *   who is both someone's teacher and someone else's student could see their
 *   own riding lessons inside a student's workspace.
 */

// ─── Tabs (IA §3.4, design system §4.11) ────────────────────────

/**
 * The seven tabs, in the IA's order. Seven is the design system's stated
 * maximum ("Undvik: fler än sju flikar"), so this tuple is at the limit — an
 * eighth destination belongs somewhere else, not here.
 *
 * The keys are the URL vocabulary (`?flik=lektioner`) and are therefore
 * Swedish, like every other route in this app. They are not i18n keys: a
 * shared link must resolve to the same tab regardless of the reader's locale.
 */
export const STUDENT_TABS = [
    'oversikt',
    'lektioner',
    'pass',
    'planer',
    'mal',
    'hastar',
    'historik',
] as const;

export type StudentTab = (typeof STUDENT_TABS)[number];

export const DEFAULT_STUDENT_TAB: StudentTab = 'oversikt';

/**
 * Resolve `?flik=` to a tab. An unknown or absent value falls back to Översikt
 * rather than rendering an empty workspace — a mistyped link should still land
 * somewhere useful.
 */
export function resolveTab(value: string | undefined): StudentTab {
    return STUDENT_TABS.includes(value as StudentTab) ? (value as StudentTab) : DEFAULT_STUDENT_TAB;
}

const TAB_KEYS: Record<StudentTab, string> = {
    oversikt: 'student.tab.overview',
    lektioner: 'student.tab.lessons',
    pass: 'student.tab.sessions',
    planer: 'student.tab.plans',
    mal: 'student.tab.goals',
    hastar: 'student.tab.horses',
    historik: 'student.tab.history',
};

export function tabLabel(tab: StudentTab): string {
    return t(TAB_KEYS[tab]);
}

/** `/students/:id?flik=lektioner` — the linkable address of one tab. */
export function tabHref(studentId: string, tab: StudentTab): string {
    return tab === DEFAULT_STUDENT_TAB
        ? `/students/${studentId}`
        : `/students/${studentId}?flik=${tab}`;
}

// ─── Roster (IA §3.3) ───────────────────────────────────────────

export interface StudentLike {
    id: string;
    email: string;
    displayName: string;
}

/**
 * IA §3.3: "Connected students, sorted by display name."
 *
 * `localeCompare` with the active locale rather than a code-point sort, because
 * a Swedish roster containing Åsa, Örjan and Anna is otherwise ordered by UTF-16
 * value and puts both of the first two after Z — which is correct for Swedish
 * and wrong for, say, German, and neither is something a byte comparison knows.
 * The server orders by `users.display_name` in SQLite's binary collation, so the
 * client is where this can be got right at all.
 */
export function sortStudents<T extends { displayName: string }>(students: T[]): T[] {
    const locale = getLocale();
    return [...students].sort((a, b) => a.displayName.localeCompare(b.displayName, locale));
}

export interface LessonLike {
    id: string;
    studentId: string;
    role: 'teacher' | 'student';
    status: 'planned' | 'completed' | 'cancelled';
    scheduledAt: string;
}

/**
 * The Lessons of one Student that the reader teaches.
 *
 * The role check is a privacy boundary, not a tidiness one — see the module
 * docstring. `GET /lessons` is a single list call, which is why the roster can
 * afford a next-Lesson summary at all: IA §3.3 permits it only "when cheaply
 * available", and one list request that every row reads from is cheap in a way
 * that a request per row is not.
 */
export function lessonsWithStudent<T extends LessonLike>(lessons: T[], studentId: string): T[] {
    return lessons.filter((l) => l.studentId === studentId && l.role === 'teacher');
}

/**
 * The next Lesson with this Student, or null.
 *
 * Cancelled lessons are excluded: "nästa lektion" naming an occasion that will
 * not happen is worse than saying nothing. Completed ones are excluded by the
 * time comparison in every normal case and by status in the case of a lesson
 * marked complete ahead of its slot.
 */
export function nextLessonWith<T extends LessonLike>(
    lessons: T[],
    studentId: string,
    nowIso: string,
): T | null {
    const upcoming = lessonsWithStudent(lessons, studentId)
        .filter((l) => l.status === 'planned' && l.scheduledAt >= nowIso)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    return upcoming[0] ?? null;
}

/**
 * 'Nästa lektion onsdag 22 juli · 17:00', or null when there is none.
 *
 * Null rather than "Ingen bokad lektion" on every row: IA §3.3 makes the
 * summary optional, and a roster of twelve students each announcing an absence
 * is noise. Elevvy's Översikt tab, which is about one student, does state the
 * absence — there the fact is the answer to a question the reader asked.
 */
export function nextLessonSummary(lesson: { scheduledAt: string } | null): string | null {
    if (!lesson) return null;
    return t('student.nextLesson', {
        when: formatDate(lesson.scheduledAt, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        }),
    });
}

/** Row identity for `$each`. Includes the summary inputs so a row re-renders. */
export function studentRowKey(student: StudentLike, nextLessonIso: string | null): string {
    return `${student.id}:${student.displayName}:${student.email}:${nextLessonIso ?? ''}`;
}

// ─── Invitations (IA §3.3, absorbed from /invitations) ──────────

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface InvitationLike {
    id: string;
    inviteeEmail: string;
    status: InvitationStatus;
    createdAt: string;
}

/**
 * Status vocabulary, in the §4.4 shape grammar: outline = ongoing, filled =
 * completed, dashed = ended without completing.
 *
 * **`expired` deliberately says only that the invitation ended.** The status
 * exists in `InvitationStatus` and the row carries an `expires_at` column, but
 * nothing in `server/services/` ever writes `'expired'` — there is no sweeper,
 * no cron, and `InvitationService` never compares `expires_at` to the clock. So
 * the UI must not promise expiry anywhere: no countdown, no "gäller till", no
 * "går ut om 30 dagar". This label is here purely so that a row which somehow
 * carries the status renders as words rather than as a raw enum. IA §3.3: "Do
 * not promise automatic expiry behavior yet."
 */
export function invitationStatusPill(status: InvitationStatus): StatusDescriptor {
    switch (status) {
        case 'pending':
            return { label: () => t('invitations.status.pending'), variant: 'outline', tone: 'info' };
        case 'accepted':
            return { label: () => t('invitations.status.accepted'), variant: 'filled', tone: 'success' };
        case 'declined':
            return { label: () => t('invitations.status.declined'), variant: 'dashed', tone: 'neutral', glyph: '✕' };
        case 'revoked':
            return { label: () => t('invitations.status.revoked'), variant: 'dashed', tone: 'neutral', glyph: '✕' };
        case 'expired':
            return { label: () => t('invitations.status.expired'), variant: 'dashed', tone: 'neutral', glyph: '✕' };
    }
}

/**
 * IA §3.3: "Pending invitations may be revoked; terminal rows are read-only."
 *
 * Every non-pending status is terminal — `InvitationService.revoke` throws
 * `InvitationNotPendingError` for all four. Per LESSONS #4 the control is
 * withheld rather than disabled: a greyed Återkalla on an accepted invitation
 * suggests the relation could be undone from here, and it cannot.
 */
export function canRevoke(status: InvitationStatus): boolean {
    return status === 'pending';
}

/** 'Skickad i går 19:32' — sent time, IA §3.3. */
export function invitationSentLabel(createdAt: string, now: Date = new Date()): string {
    return t('invitations.sent', { when: formatRelative(createdAt, now) });
}

/**
 * Pending first, newest first inside each group.
 *
 * The pending ones are the only actionable rows on the page, so they lead;
 * terminal rows are a record and sort behind them. The server returns creation
 * order only, so the grouping is the client's.
 */
export function sortInvitations<T extends { status: InvitationStatus; createdAt: string }>(
    invitations: T[],
): T[] {
    return [...invitations].sort((a, b) => {
        const rank = Number(b.status === 'pending') - Number(a.status === 'pending');
        return rank !== 0 ? rank : b.createdAt.localeCompare(a.createdAt);
    });
}

export function invitationRowKey(invitation: InvitationLike): string {
    return `${invitation.id}:${invitation.status}`;
}

// ─── The invite form (IA §3.3) ──────────────────────────────────

/**
 * Same shape as the register form's check: an `@` with something either side and
 * a dot in the domain. Deliberately not an RFC 5322 attempt — the server is the
 * authority, and an over-strict client regex rejects addresses that are legal.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Field-level validation copy, or null when the field is fine.
 *
 * Both messages name the fix rather than the fault (IA §4, design system §4.8):
 * "Fyll i elevens e-postadress" rather than "Ogiltigt fält".
 */
export function inviteEmailError(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return t('invite.error.emailRequired');
    if (!EMAIL_RE.test(trimmed)) return t('invite.error.emailInvalid');
    return null;
}

/**
 * Duplicate-pending detection — IA §3.3: "reports duplicate-pending conflicts
 * inline".
 *
 * Keyed on `error.code`, never on the message text. `InvitationService.create`
 * raises a `ConflictError` whose wording is a server-side English sentence; a
 * client that matched on it would break the day someone rephrases it, and would
 * never have worked in Swedish. The `request()` wrapper maps HTTP 409 to
 * `code: 'conflict'`, and that code is the contract.
 */
export function isConflict(error: { code: string } | null | undefined): boolean {
    return error?.code === 'conflict';
}

/** The inline message for a duplicate pending invitation. Names the address. */
export function duplicateInviteMessage(email: string): string {
    return t('invite.error.conflict', { email: email.trim() });
}

// ─── Page-level states (IA §3.3) ────────────────────────────────

/**
 * Which of the three §3.3 states the page is in.
 *
 * - `empty` — no students AND no invitations: one branded empty state with a
 *   single action (§4.14).
 * - `invitedOnly` — invitations exist but none has been accepted: the
 *   invitation list is preserved and the next step is explained, rather than
 *   the page claiming there is nothing here.
 * - `roster` — at least one Relation.
 *
 * `unknown` is the fourth, and it is the one that keeps the two lists
 * independent: while either list is still unresolved, or has failed, the page
 * cannot honestly say "you have nothing". Collapsing an unresolved list into
 * the empty branch is exactly how a failed invitations request would erase a
 * roster that loaded fine — IA §3.3: "one failing must not erase the other".
 */
export type RosterState = 'unknown' | 'empty' | 'invitedOnly' | 'roster';

export function rosterState(args: {
    students: number;
    invitations: number;
    studentsResolved: boolean;
    invitationsResolved: boolean;
}): RosterState {
    if (args.students > 0) return 'roster';
    // Nothing below this line may be claimed without both answers in hand.
    if (!args.studentsResolved || !args.invitationsResolved) return 'unknown';
    return args.invitations > 0 ? 'invitedOnly' : 'empty';
}

/** `/lektioner/ny?elev=<id>` — Boka lektion, carrying this Student as context. */
export function bookLessonHref(studentId: string): string {
    return `/lektioner/ny?elev=${encodeURIComponent(studentId)}`;
}

/** `/students/:id/exercises/:exerciseId/history?from=…` — IA §3.16 entry path. */
export function historyHref(studentId: string, exerciseId: string, from: string): string {
    return `/students/${studentId}/exercises/${exerciseId}/history?from=${encodeURIComponent(from)}`;
}

// ─── Elevvy header (IA §3.4) ────────────────────────────────────

/**
 * The header's relation context.
 *
 * IA §1: role is a fact about a Relation, never an account type — so the line
 * states the reader's own side of *this* relation and the address that
 * identifies the other. There is no relation start date in the contract
 * (`RelationService.Student` carries id, email and displayName only), so none
 * is invented.
 */
export function relationContext(email: string): string {
    return t('student.relation', { email });
}

// ─── Tab content filters (IA §3.4) ──────────────────────────────

export interface HorseLike {
    id: string;
    name: string;
    archivedAt: null | string;
}

/**
 * IA §3.4 Hästar: "non-archived Horses, read-only".
 *
 * `GET /students/:id/horses` returns the whole stable including archived
 * horses, so the filter is the client's — same split as `bookableHorses` in
 * `lesson-copy.ts`, and for the same reason: the endpoint is a stable listing,
 * not a picker.
 */
export function activeHorses<T extends { archivedAt: null | string }>(horses: T[]): T[] {
    return horses.filter((h) => h.archivedAt === null);
}

/** IA §3.4 Planer: "active Plans". Archived ones are a record, not a workspace. */
export function activePlans<T extends { status: 'active' | 'archived' }>(plans: T[]): T[] {
    return plans.filter((p) => p.status === 'active');
}

export interface GoalLike {
    id: string;
    title: string;
    status: 'active' | 'achieved' | 'abandoned';
    targetDate: null | string;
}

/**
 * The Goals this Teacher may see. **This is a privacy filter, not a view.**
 *
 * `GET /students/:id/goals` inner-joins `goal_share` on the calling teacher, so
 * the list arriving here is already the shared set — this function does not
 * re-filter it, because it has nothing to filter by: an unshared Goal is not in
 * the payload at all, and `GoalTeacherView` carries no sharing field. That is
 * the point. The only way for Elevvy to show an unshared Goal would be to
 * source Goals from somewhere else, and the somewhere else is `PlanService
 * .getDetail`, whose `linkedGoals` were leaking exactly that until a filter
 * landed this session.
 *
 * So the rule this function encodes is: **Elevvy's Mål tab and every count
 * derived from it read from `students.listGoals` and from nothing else.** It
 * exists as a named function so that a future edit sourcing goals from a Plan
 * has to delete a documented boundary rather than quietly widen a filter.
 */
export function sharedGoals<T extends GoalLike>(goalsFromShareEndpoint: T[]): T[] {
    return goalsFromShareEndpoint;
}

/**
 * The Översikt tab's "delade mål" count.
 *
 * Counting the same shared list the Mål tab renders is what keeps the count
 * honest. A count sourced from anywhere with wider visibility — a Plan's linked
 * goals, a total-goals field — would leak the existence of Goals the Student
 * chose not to share, which IA §3.4 forbids as explicitly as it forbids showing
 * their titles. A number is a disclosure.
 */
export function sharedGoalCount<T extends GoalLike>(goalsFromShareEndpoint: T[]): number {
    return sharedGoals(goalsFromShareEndpoint).length;
}

export interface SessionLike {
    id: string;
    performedAt: string;
}

/**
 * IA §3.4 Pass: "only Training Sessions explicitly shared with this Teacher".
 *
 * Same shape of guarantee as `sharedGoals`: `GET /students/:id/training-sessions`
 * inner-joins `training_session_share`, so the payload is the shared set and
 * this function only orders it. Newest first — a coach reads the latest ride.
 */
export function sharedSessions<T extends SessionLike>(sessions: T[]): T[] {
    return [...sessions].sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

/** The newest shared Training Session, or null. IA §3.4 Översikt. */
export function latestSharedSession<T extends SessionLike>(sessions: T[]): T | null {
    return sharedSessions(sessions)[0] ?? null;
}

// ─── Översikt (IA §3.4) ─────────────────────────────────────────

/** 'Aktiva planer · 2'. Counts go through `plural()` — 1 plan, 2 planer. */
export function planCountLabel(count: number): string {
    return plural('student.overview.planCount', count);
}

/** 'Delade mål · 3'. See `sharedGoalCount` for why this count is safe to show. */
export function goalCountLabel(count: number): string {
    return plural('student.overview.goalCount', count);
}

export type ActivityKind = 'lesson' | 'session';

export interface ActivityItem {
    kind: ActivityKind;
    id: string;
    /** ISO instant the item happened at. */
    at: string;
    /** One line: what it was. */
    title: string;
    /** Where the row navigates. */
    href: string;
}

/** How many rows the compact recent-activity block shows. */
export const ACTIVITY_LIMIT = 5;

/**
 * The Översikt tab's compact recent activity.
 *
 * "Compact" is the operative word in IA §3.4 — this is a glance, not a feed, so
 * it is capped and it merges only the two occasion kinds the Teacher can
 * already see in full on their own tabs. Nothing enters this list that is not
 * already visible elsewhere in Elevvy, which is what keeps it from becoming a
 * second, less careful disclosure surface: no Goals (sharing is per-goal and
 * the activity would state a title), no Notes (their visibility is per-note).
 *
 * Future occasions are excluded: an activity list is a record of what has
 * happened, and a lesson booked for next week appears under Nästa lektion.
 */
export function recentActivity(
    lessons: { id: string; scheduledAt: string; title: string }[],
    sessions: { id: string; performedAt: string; title: string }[],
    nowIso: string,
    limit = ACTIVITY_LIMIT,
): ActivityItem[] {
    const items: ActivityItem[] = [
        ...lessons
            .filter((l) => l.scheduledAt <= nowIso)
            .map((l): ActivityItem => ({
                kind: 'lesson',
                id: l.id,
                at: l.scheduledAt,
                title: l.title,
                href: `/lektioner/${l.id}`,
            })),
        ...sessions
            .filter((s) => s.performedAt <= nowIso)
            .map((s): ActivityItem => ({
                kind: 'session',
                id: s.id,
                at: s.performedAt,
                title: s.title,
                href: `/traningspass/${s.id}`,
            })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/**
 * What the recent-activity block is entitled to say.
 *
 * `recentActivity()` is fed from `lessons.data ?? []` and `sessions.data ?? []`,
 * so an empty result means one of three different things, and only one of them
 * is "nothing has happened". Rendering the empty copy for the other two tells a
 * Teacher their rider has done nothing when the truth is that the request has
 * not come back, or came back broken — the one substitution that misinforms
 * rather than merely underinforms. IA §3.4 gives every tab its own loading,
 * empty AND error state; this is the Översikt block's share of that rule.
 *
 * Failure outranks the unresolved window because a source that has errored is
 * never coming back on its own, and the reader is owed the reason.
 */
export type ActivityLineState = 'silent' | 'empty' | 'unavailable';

export function activityLineState(args: {
    sourcesFailed: boolean;
    sourcesAnswered: boolean;
    count: number;
}): ActivityLineState {
    if (args.sourcesFailed) return 'unavailable';
    if (!args.sourcesAnswered) return 'silent';
    return args.count === 0 ? 'empty' : 'silent';
}

/** 'Lektion' / 'Träningspass' — the activity row's kind chip. */
export function activityKindLabel(kind: ActivityKind): string {
    return kind === 'lesson' ? t('objectKind.lesson') : t('objectKind.trainingSession');
}

/** 'i går 19:32' — the §4.6 in-row timestamp. */
export function activityWhen(iso: string, now: Date = new Date()): string {
    return formatRelative(iso, now);
}

export function activityRowKey(item: ActivityItem): string {
    return `${item.kind}:${item.id}:${item.at}`;
}

// ─── Not found (IA §3.4) ────────────────────────────────────────

/**
 * Whether a failed `GET /students/:id` means "not your student".
 *
 * The server answers 404 for a missing Student, a revoked Relation, and another
 * teacher's student alike — deliberately, so the response never reveals that an
 * account exists. IA §1 asks the client to preserve that: "Unauthorized and
 * cross-owner resources use the same not-found state rather than revealing that
 * the object exists."
 *
 * Anything else — a 500, a dropped connection — is a *failure*, not an answer,
 * and must render as an error with a retry. Showing "Eleven finns inte" because
 * the network blinked tells the reader their student was removed.
 */
export function isNotFound(status: number | undefined): boolean {
    return status === 404;
}
