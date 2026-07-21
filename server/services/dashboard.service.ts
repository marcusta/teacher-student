import { sql, type Kysely } from 'kysely';
import type { Database } from '../db/schema';

// --- Output types ---
//
// These exported interfaces ARE the wire contract: `vendor/basics-core/generate-api.ts`
// derives `web/api/dashboard.gen.ts` from the descriptor's `fn` return type. There is
// deliberately no TypeBox response schema — it would be a second source of truth that
// nothing validates against and that the generator ignores.

/** The whole Hem payload. One request, five independent facts. */
export interface DashboardView {
    capabilities: DashboardCapabilities;
    nextLesson: DashboardNextLesson | null;
    latestFeedback: DashboardFeedback | null;
    awaitingFeedback: DashboardAwaitingItem[];
    activePlans: DashboardPlanRef[];
    goalsNearingTarget: DashboardGoalRef[];
    pendingInvitations: number;
    /**
     * The server's clock at the moment this payload was assembled, ISO 8601.
     * Server-side windows (nextLesson's `>= now`, awaitingFeedback's floor,
     * goalsNearingTarget's horizon) are already baked in relative to this.
     */
    generatedAt: string;
}

/**
 * Which sides of the Relation graph this account currently sits on. Derived
 * from data, never from an account column — there is none. This is a FACT,
 * not an authorization gate: it may drive the Boka-lektion affordance and
 * empty-state copy, and nothing else. Nav visibility and the Riding block are
 * explicitly NOT gated on it.
 */
export interface DashboardCapabilities {
    /** At least one `relations` row with `teacher_id = me`. */
    teaches: boolean;
    /** At least one `relations` row with `student_id = me`. */
    rides: boolean;
}

export interface DashboardNextLesson {
    id: string;
    scheduledAt: string;
    /** The caller's own side of this Lesson. Mirrors `LessonForUser.role`. */
    role: 'teacher' | 'student';
    counterpartyDisplayName: string;
    horseName: string | null;
    planId: string | null;
    planTitle: string | null;
    /** Up to EXERCISE_PREVIEW_LIMIT Exercise names, in `sort_order` order. */
    exercisePreview: string[];
    /** Total Exercises on the Lesson, so the view can render "+3 till". */
    exerciseCount: number;
}

/**
 * The single newest **shared** Note authored by **someone other than the
 * caller**, across every parent the caller is authorized to read. No
 * read-state: this is *the latest*, not *the unread*.
 */
export interface DashboardFeedback {
    noteId: string;
    /** What the Note actually hangs off. Drives the context line. */
    parentKind: 'lesson' | 'lesson_exercise' | 'training_session'
        | 'training_session_exercise' | 'goal';
    parentId: string;
    /**
     * The nearest ancestor that HAS a route. For `lesson_exercise` this is the
     * Lesson; for `training_session_exercise` the Training Session; otherwise
     * it equals `parentKind`/`parentId`. The client builds the href from this —
     * the server emits no route string.
     */
    targetKind: 'lesson' | 'training_session' | 'goal';
    targetId: string;
    /** Human label for the target — Lesson counterparty, Goal title, etc. */
    targetLabel: string;
    /** For an exercise-occurrence Note: the Exercise's name. Null otherwise. */
    exerciseName: string | null;
    authorId: string;
    authorDisplayName: string;
    /** Full Note body. The view excerpts it. */
    body: string;
    createdAt: string;
}

/**
 * Occasions the caller taught (or was shared into), that have already
 * happened, and on which the caller has authored no Note of any visibility.
 */
export interface DashboardAwaitingItem {
    kind: 'lesson' | 'training_session';
    id: string;
    /** `lessons.scheduled_at` or `training_sessions.performed_at`. */
    occurredAt: string;
    /** The Student. Always the counterparty here — the caller is the teacher. */
    studentDisplayName: string;
    horseName: string | null;
}

/** Plans the caller OWNS. Ownership-scoped, never Relation-scoped. */
export interface DashboardPlanRef {
    id: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    primaryTeacherDisplayName: string | null;
}

/** Goals the caller OWNS. Ownership-scoped, never Relation-scoped. */
export interface DashboardGoalRef {
    id: string;
    title: string;
    /** `YYYY-MM-DD`. Never null in this list — the filter requires it. */
    targetDate: string;
}

// --- Tuning constants ---

/** Names shown on the nextLesson card; `exerciseCount` carries the true total. */
const EXERCISE_PREVIEW_LIMIT = 3;
/** Rows on the awaitingFeedback card. No total count is returned. */
const AWAITING_LIMIT = 5;
/** ~one season. Also what bounds the correlated NOT EXISTS scan. */
const AWAITING_FLOOR_DAYS = 90;
/** "Nearing target" horizon. Shorter than a Plan's unit would be useless. */
const GOAL_HORIZON_DAYS = 30;
const PLAN_LIMIT = 3;
const GOAL_LIMIT = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** `parentKind` → the nearest ancestor that has a client route. */
function targetKindFor(
    parentKind: DashboardFeedback['parentKind'],
): DashboardFeedback['targetKind'] {
    if (parentKind === 'lesson' || parentKind === 'lesson_exercise') return 'lesson';
    if (parentKind === 'training_session' || parentKind === 'training_session_exercise') {
        return 'training_session';
    }
    return 'goal';
}

interface FeedbackRow {
    note_id: string;
    author_id: string;
    author_display_name: string;
    body: string;
    created_at: string;
    parent_kind: DashboardFeedback['parentKind'];
    parent_id: string;
    target_id: string;
}

interface AwaitingRow {
    kind: 'lesson' | 'training_session';
    id: string;
    occurred_at: string;
    student_display_name: string;
    horse_name: string | null;
}

/**
 * The Hem read model. Deep module: one call, one payload, every authorization
 * rule expressed in a WHERE or JOIN rather than a post-filter — so a row the
 * caller may not read is never fetched in the first place.
 *
 * Statement count is CONSTANT in the number of rows: 7 minimum, 9 maximum —
 * seven fields at one statement each, plus one only when a `nextLesson` exists
 * and one only when a `latestFeedback` exists. Protect that property. Every
 * enrichment is either joined into the same statement or run once against a
 * single already-chosen row.
 */
export class DashboardService {
    constructor(private db: Kysely<Database>) {}

    /**
     * `now` is injected (defaulting to the real clock) so every window
     * boundary is assertable — same convention as `goal-copy.isOverdue`.
     */
    async get(userId: string, userEmail: string, now: Date = new Date()): Promise<DashboardView> {
        const nowIso = now.toISOString();

        const [
            capabilities,
            nextLesson,
            latestFeedback,
            awaitingFeedback,
            activePlans,
            goalsNearingTarget,
            pendingInvitations,
        ] = await Promise.all([
            this.capabilities(userId),
            this.nextLesson(userId, nowIso),
            this.latestFeedback(userId),
            this.awaitingFeedback(userId, now, nowIso),
            this.activePlans(userId),
            this.goalsNearingTarget(userId, now),
            this.pendingInvitations(userEmail),
        ]);

        return {
            capabilities,
            nextLesson,
            latestFeedback,
            awaitingFeedback,
            activePlans,
            goalsNearingTarget,
            pendingInvitations,
            generatedAt: nowIso,
        };
    }

    // --- capabilities ---

    /**
     * Two index probes in one statement. Self-scoped by construction, so no
     * authorization gate is needed or possible.
     */
    private async capabilities(userId: string): Promise<DashboardCapabilities> {
        const row = await sql<{ teaches: number; rides: number }>`
            SELECT
              EXISTS (SELECT 1 FROM relations WHERE teacher_id = ${userId}) AS teaches,
              EXISTS (SELECT 1 FROM relations WHERE student_id = ${userId}) AS rides
        `.execute(this.db);
        const r = row.rows[0];
        return { teaches: Boolean(r?.teaches), rides: Boolean(r?.rides) };
    }

    // --- nextLesson ---

    /**
     * Soonest `planned` Lesson on either side of the caller. The
     * `teacher_id = me OR student_id = me` disjunction IS the authorization —
     * the same predicate `LessonService.listForUser` uses.
     *
     * `status='planned'` excludes cancelled AND completed: naming a "next
     * lesson" that will not happen (cancelled) or already concluded
     * (completed-early) is worse than saying nothing.
     */
    private async nextLesson(userId: string, nowIso: string): Promise<DashboardNextLesson | null> {
        const row = await this.db
            .selectFrom('lessons')
            .innerJoin('users as teacher', 'teacher.id', 'lessons.teacher_id')
            .innerJoin('users as student', 'student.id', 'lessons.student_id')
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .leftJoin('plans', 'plans.id', 'lessons.plan_id')
            .select([
                'lessons.id as id',
                'lessons.scheduled_at as scheduled_at',
                'lessons.teacher_id as teacher_id',
                'lessons.plan_id as plan_id',
                'teacher.display_name as teacher_display_name',
                'student.display_name as student_display_name',
                'horses.name as horse_name',
                'plans.title as plan_title',
            ])
            .where((eb) => eb.or([
                eb('lessons.teacher_id', '=', userId),
                eb('lessons.student_id', '=', userId),
            ]))
            .where('lessons.status', '=', 'planned')
            .where('lessons.scheduled_at', '>=', nowIso)
            .orderBy('lessons.scheduled_at', 'asc')
            .limit(1)
            .executeTakeFirst();
        if (!row) return null;

        // Second keyed query, skipped entirely when no Lesson was found. Safe
        // without its own gate: `lesson_id` came from the already-scoped query
        // above.
        const exercises = await this.db
            .selectFrom('lesson_exercise')
            .innerJoin('exercises', 'exercises.id', 'lesson_exercise.exercise_id')
            .select(['exercises.name as name'])
            .where('lesson_exercise.lesson_id', '=', row.id)
            .orderBy('lesson_exercise.sort_order', 'asc')
            .execute();

        const isTeacher = row.teacher_id === userId;
        return {
            id: row.id,
            scheduledAt: row.scheduled_at,
            role: isTeacher ? 'teacher' : 'student',
            counterpartyDisplayName: isTeacher
                ? row.student_display_name
                : row.teacher_display_name,
            horseName: row.horse_name ?? null,
            planId: row.plan_id ?? null,
            planTitle: row.plan_title ?? null,
            exercisePreview: exercises.slice(0, EXERCISE_PREVIEW_LIMIT).map((e) => e.name),
            exerciseCount: exercises.length,
        };
    }

    // --- latestFeedback ---

    /**
     * Five branches, one per readable parent kind, each `ORDER BY
     * notes.created_at DESC, notes.id DESC LIMIT 1`, combined with UNION ALL;
     * the service takes the newest. One statement.
     *
     * TIEBREAK — `notes.id DESC`, on both the per-branch and the outer sort.
     * `created_at` is `new Date().toISOString()` (note.service.ts), so its
     * granularity is one millisecond and ties are routine: ~13 notes can share
     * a timestamp. Without the secondary key the winner was decided only
     * incidentally, by UNION ALL branch order plus SQLite's sort happening to
     * be stable — meaning `lesson` silently outranked `goal`, undocumented and
     * unasserted. That is a latent behaviour change, not merely an aesthetic
     * gap: adding the covering `notes(parent_kind, parent_id, created_at)`
     * index the contract defers to a later slice would change the query plan
     * and therefore the tie winner, in a slice that believes it is pure
     * optimisation. The id is arbitrary but stable, which is all a tiebreak
     * needs to be.
     *
     * PERFORMANCE CAVEAT — measured, and NOT what the frozen contract claims.
     * The contract (§3.3, §4.2) asserts this shape "drives from a bounded set
     * the caller owns" and thereby closes the unbounded-scan risk. It does not.
     * `EXPLAIN QUERY PLAN` on this SQL gives, for every branch:
     *
     *     SEARCH n USING INDEX notes_parent_idx (parent_kind=?)
     *     SEARCH <parent> USING INDEX sqlite_autoindex_... (id=?)
     *     USE TEMP B-TREE FOR ORDER BY
     *
     * i.e. SQLite drives from `notes`, walks every note of that parent_kind
     * globally, probes the parent per row, then sorts the whole survivor set
     * before applying LIMIT 1 — precisely the plan §3.3 says it rejected.
     * Merely reordering the FROM clause parent-first does not change it:
     * `notes_parent_idx (parent_kind, parent_id)` bound on `parent_kind` alone
     * is SQLite's cheapest available driver and it takes it.
     *
     * `CROSS JOIN` DOES force the intended plan, but not uniformly. On the two
     * Lesson branches it yields exactly what §3.3 wanted — `MULTI-INDEX OR`
     * over lessons_teacher_idx / lessons_student_idx, then `notes_parent_idx
     * (parent_kind=? AND parent_id=?)`. On the two Training Session branches it
     * DEGRADES to `SCAN training_sessions`, because the owner-OR-share
     * disjunction is not index-drivable as written. So there is no free fix;
     * the real remedies are splitting the Training Session branch in two, or
     * the covering `notes(parent_kind, parent_id, created_at)` index the
     * contract defers to its own slice.
     *
     * The SQL is therefore implemented exactly as the frozen contract
     * specifies, and the divergence is reported rather than patched
     * unilaterally — the choice is the contract owner's. Correctness is
     * unaffected; only cost is. See the contract's §3.3, §4.2 and Amendments.
     *
     * Each branch's parent rule is transcribed from the corresponding
     * `NoteService` gate: assertLessonMember, assertLessonExerciseMember,
     * assertTrainingSessionViewer, assertTrainingSessionExerciseViewer,
     * assertGoalViewer. `parent_kind` values 'student' and 'exercise_question'
     * are rejected by `assertCanRead` and are therefore unreachable here too:
     * no branch can select them.
     */
    private async latestFeedback(userId: string): Promise<DashboardFeedback | null> {
        const result = await sql<FeedbackRow>`
            SELECT * FROM (
              SELECT n.id AS note_id, n.author_id AS author_id,
                     u.display_name AS author_display_name, n.body AS body,
                     n.created_at AS created_at, n.parent_kind AS parent_kind,
                     n.parent_id AS parent_id, l.id AS target_id
              FROM notes n
                INNER JOIN lessons l ON l.id = n.parent_id
                INNER JOIN users u ON u.id = n.author_id
              WHERE n.parent_kind = 'lesson' AND n.visibility = 'shared'
                AND n.author_id <> ${userId}
                AND (l.teacher_id = ${userId} OR l.student_id = ${userId})
              ORDER BY n.created_at DESC, n.id DESC LIMIT 1
            )
            UNION ALL SELECT * FROM (
              SELECT n.id, n.author_id, u.display_name, n.body, n.created_at,
                     n.parent_kind, n.parent_id, l.id
              FROM notes n
                INNER JOIN lesson_exercise le ON le.id = n.parent_id
                INNER JOIN lessons l ON l.id = le.lesson_id
                INNER JOIN users u ON u.id = n.author_id
              WHERE n.parent_kind = 'lesson_exercise' AND n.visibility = 'shared'
                AND n.author_id <> ${userId}
                AND (l.teacher_id = ${userId} OR l.student_id = ${userId})
              ORDER BY n.created_at DESC, n.id DESC LIMIT 1
            )
            UNION ALL SELECT * FROM (
              SELECT n.id, n.author_id, u.display_name, n.body, n.created_at,
                     n.parent_kind, n.parent_id, ts.id
              FROM notes n
                INNER JOIN training_sessions ts ON ts.id = n.parent_id
                INNER JOIN users u ON u.id = n.author_id
              WHERE n.parent_kind = 'training_session' AND n.visibility = 'shared'
                AND n.author_id <> ${userId}
                AND (ts.student_id = ${userId}
                     OR EXISTS (SELECT 1 FROM training_session_share s
                                WHERE s.training_session_id = ts.id
                                  AND s.teacher_id = ${userId}))
              ORDER BY n.created_at DESC, n.id DESC LIMIT 1
            )
            UNION ALL SELECT * FROM (
              SELECT n.id, n.author_id, u.display_name, n.body, n.created_at,
                     n.parent_kind, n.parent_id, ts.id
              FROM notes n
                INNER JOIN training_session_exercise tse ON tse.id = n.parent_id
                INNER JOIN training_sessions ts ON ts.id = tse.training_session_id
                INNER JOIN users u ON u.id = n.author_id
              WHERE n.parent_kind = 'training_session_exercise' AND n.visibility = 'shared'
                AND n.author_id <> ${userId}
                AND (ts.student_id = ${userId}
                     OR EXISTS (SELECT 1 FROM training_session_share s
                                WHERE s.training_session_id = ts.id
                                  AND s.teacher_id = ${userId}))
              ORDER BY n.created_at DESC, n.id DESC LIMIT 1
            )
            UNION ALL SELECT * FROM (
              SELECT n.id, n.author_id, u.display_name, n.body, n.created_at,
                     n.parent_kind, n.parent_id, g.id
              FROM notes n
                INNER JOIN goal g ON g.id = n.parent_id
                INNER JOIN users u ON u.id = n.author_id
              WHERE n.parent_kind = 'goal' AND n.visibility = 'shared'
                AND n.author_id <> ${userId}
                AND (g.student_id = ${userId}
                     OR EXISTS (SELECT 1 FROM goal_share gs
                                WHERE gs.goal_id = g.id AND gs.teacher_id = ${userId}))
              ORDER BY n.created_at DESC, n.id DESC LIMIT 1
            )
            ORDER BY created_at DESC, note_id DESC LIMIT 1
        `.execute(this.db);

        const row = result.rows[0];
        if (!row) return null;

        const targetKind = targetKindFor(row.parent_kind);
        // Enrichment runs ONCE, on the winning row only — one keyed lookup,
        // never one per candidate.
        const { targetLabel, exerciseName } = await this.enrichFeedbackTarget(
            userId, row.parent_kind, row.parent_id, targetKind, row.target_id,
        );

        return {
            noteId: row.note_id,
            parentKind: row.parent_kind,
            parentId: row.parent_id,
            targetKind,
            targetId: row.target_id,
            targetLabel,
            exerciseName,
            authorId: row.author_id,
            authorDisplayName: row.author_display_name,
            body: row.body,
            createdAt: row.created_at,
        };
    }

    /**
     * One statement, branch-selected by `parentKind`. For the two junction
     * kinds it resolves the owning occasion's label AND the Exercise name
     * together, so enrichment never costs more than a single query.
     *
     * `targetLabel`: Lesson → the caller's counterparty; Training Session →
     * the owning Student's display name; Goal → its title (safe to print,
     * since reaching that branch already required owner-or-shared access).
     */
    private async enrichFeedbackTarget(
        userId: string,
        parentKind: DashboardFeedback['parentKind'],
        parentId: string,
        targetKind: DashboardFeedback['targetKind'],
        targetId: string,
    ): Promise<{ targetLabel: string; exerciseName: string | null }> {
        if (targetKind === 'lesson') {
            const q = this.db
                .selectFrom('lessons')
                .innerJoin('users as teacher', 'teacher.id', 'lessons.teacher_id')
                .innerJoin('users as student', 'student.id', 'lessons.student_id')
                .where('lessons.id', '=', targetId);
            if (parentKind === 'lesson_exercise') {
                const row = await q
                    .innerJoin('lesson_exercise', 'lesson_exercise.lesson_id', 'lessons.id')
                    .innerJoin('exercises', 'exercises.id', 'lesson_exercise.exercise_id')
                    .select([
                        'lessons.teacher_id as teacher_id',
                        'teacher.display_name as teacher_display_name',
                        'student.display_name as student_display_name',
                        'exercises.name as exercise_name',
                    ])
                    .where('lesson_exercise.id', '=', parentId)
                    .executeTakeFirst();
                return {
                    targetLabel: row
                        ? (row.teacher_id === userId
                            ? row.student_display_name
                            : row.teacher_display_name)
                        : '',
                    exerciseName: row?.exercise_name ?? null,
                };
            }
            const row = await q
                .select([
                    'lessons.teacher_id as teacher_id',
                    'teacher.display_name as teacher_display_name',
                    'student.display_name as student_display_name',
                ])
                .executeTakeFirst();
            return {
                targetLabel: row
                    ? (row.teacher_id === userId
                        ? row.student_display_name
                        : row.teacher_display_name)
                    : '',
                exerciseName: null,
            };
        }

        if (targetKind === 'training_session') {
            const q = this.db
                .selectFrom('training_sessions')
                .innerJoin('users as student', 'student.id', 'training_sessions.student_id')
                .where('training_sessions.id', '=', targetId);
            if (parentKind === 'training_session_exercise') {
                const row = await q
                    .innerJoin(
                        'training_session_exercise',
                        'training_session_exercise.training_session_id',
                        'training_sessions.id',
                    )
                    .innerJoin(
                        'exercises',
                        'exercises.id',
                        'training_session_exercise.exercise_id',
                    )
                    .select([
                        'student.display_name as student_display_name',
                        'exercises.name as exercise_name',
                    ])
                    .where('training_session_exercise.id', '=', parentId)
                    .executeTakeFirst();
                return {
                    targetLabel: row?.student_display_name ?? '',
                    exerciseName: row?.exercise_name ?? null,
                };
            }
            const row = await q
                .select(['student.display_name as student_display_name'])
                .executeTakeFirst();
            return { targetLabel: row?.student_display_name ?? '', exerciseName: null };
        }

        const row = await this.db
            .selectFrom('goal')
            .select(['title'])
            .where('id', '=', targetId)
            .executeTakeFirst();
        return { targetLabel: row?.title ?? '', exerciseName: null };
    }

    // --- awaitingFeedback ---

    /**
     * Past TEACHING-side occasions the caller has written no Note on.
     *
     * Deliberate departure from IA §3.1's word "upcoming": feedback on an
     * occasion that has not happened is not a thing anyone can write, and
     * upcoming Lessons are already served by `nextLesson`.
     *
     * "No Note of ANY visibility" — a private note is still engagement, and
     * counting only shared notes would make a private note's existence
     * inferable from the card's contents.
     *
     * Bounded twice: a 90-day floor (without it a teacher who does not write
     * notes accumulates a permanent, growing backlog, and the correlated
     * NOT EXISTS would be evaluated over an unbounded ordered scan) and
     * LIMIT 5. No total count is returned — a total requires counting the
     * unbounded set, and this is a launchpad, not a work queue.
     *
     * BOTH window boundaries are INCLUSIVE, on both branches: an occasion
     * exactly on `now - 90d` is in, and one exactly on `now` is in. Neither is
     * arbitrary — a half-open window would silently drop the occasion that just
     * finished — and both are pinned by tests landing exactly on the boundary,
     * not merely straddling it.
     *
     * Authorization is the join/WHERE in both branches: `teacher_id = me`, and
     * the `training_session_share` inner join. A Training Session the teacher
     * was unshared from disappears on the next load, with no trace.
     */
    private async awaitingFeedback(
        userId: string,
        now: Date,
        nowIso: string,
    ): Promise<DashboardAwaitingItem[]> {
        const floorIso = new Date(now.getTime() - AWAITING_FLOOR_DAYS * DAY_MS).toISOString();

        const result = await sql<AwaitingRow>`
            SELECT 'lesson' AS kind, l.id AS id, l.scheduled_at AS occurred_at,
                   student.display_name AS student_display_name,
                   horses.name AS horse_name
            FROM lessons l
              INNER JOIN users AS student ON student.id = l.student_id
              LEFT JOIN horses ON horses.id = l.horse_id
            WHERE l.teacher_id = ${userId}
              AND l.status = 'completed'
              AND l.scheduled_at <= ${nowIso}
              AND l.scheduled_at >= ${floorIso}
              AND NOT EXISTS (SELECT 1 FROM notes n
                              WHERE n.parent_kind = 'lesson' AND n.parent_id = l.id
                                AND n.author_id = ${userId})
            UNION ALL
            SELECT 'training_session', ts.id, ts.performed_at,
                   student.display_name, horses.name
            FROM training_sessions ts
              INNER JOIN training_session_share s ON s.training_session_id = ts.id
              INNER JOIN users AS student ON student.id = ts.student_id
              LEFT JOIN horses ON horses.id = ts.horse_id
            WHERE s.teacher_id = ${userId}
              AND ts.performed_at <= ${nowIso}
              AND ts.performed_at >= ${floorIso}
              AND NOT EXISTS (SELECT 1 FROM notes n
                              WHERE n.parent_kind = 'training_session' AND n.parent_id = ts.id
                                AND n.author_id = ${userId})
            ORDER BY occurred_at DESC
            LIMIT ${AWAITING_LIMIT}
        `.execute(this.db);

        return result.rows.map((r) => ({
            kind: r.kind,
            id: r.id,
            occurredAt: r.occurred_at,
            studentDisplayName: r.student_display_name,
            horseName: r.horse_name ?? null,
        }));
    }

    // --- activePlans ---

    /**
     * OWNERSHIP-scoped (`student_id = me`), never Relation-scoped. A Teacher's
     * read access to a connected Student's Plans is deliberately not sourced
     * here: the dashboard is first-person, and a teacher with twelve students
     * would otherwise see thirty-six plans that are not theirs. Their route to
     * those is Elevvy.
     *
     * Sorted `updated_at DESC` — `start_date` is nullable so it cannot be the
     * sort key, and recency of change is the closest proxy for "the plan I am
     * actually working in".
     */
    private async activePlans(userId: string): Promise<DashboardPlanRef[]> {
        const rows = await this.db
            .selectFrom('plans')
            .leftJoin('users as pt', 'pt.id', 'plans.primary_teacher_id')
            .select([
                'plans.id as id',
                'plans.title as title',
                'plans.start_date as start_date',
                'plans.end_date as end_date',
                'pt.display_name as primary_teacher_display_name',
            ])
            .where('plans.student_id', '=', userId)
            .where('plans.status', '=', 'active')
            .orderBy('plans.updated_at', 'desc')
            .limit(PLAN_LIMIT)
            .execute();

        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            startDate: r.start_date ?? null,
            endDate: r.end_date ?? null,
            primaryTeacherDisplayName: r.primary_teacher_display_name ?? null,
        }));
    }

    // --- goalsNearingTarget ---

    /**
     * Active, owned Goals with a `target_date` on or before today + 30 days.
     *
     * Overdue Goals ARE included and sort first: the page answers "what needs
     * me today?", and a goal whose date has passed needs the reader more, not
     * less. There is deliberately NO `overdue` boolean on the wire — IA §3.13
     * makes overdue supporting metadata, and `goal-copy.isOverdue` already owns
     * that definition on the client, computed from the browser's local day.
     *
     * `target_date` is a calendar date, so `YYYY-MM-DD` string comparison is
     * chronological and no date functions are needed. Accepted caveat: the
     * horizon is computed in the server's zone, so at the boundary a goal can
     * enter or leave the window up to a day early or late. Acceptable for a
     * SOFT horizon meaning "soon"; it would not be for `isOverdue`.
     *
     * OWNERSHIP-scoped: a Goal shared with the caller as a teacher belongs in
     * Elevvy — surfacing another person's deadlines here would be a disclosure
     * the sharer did not ask for.
     */
    private async goalsNearingTarget(userId: string, now: Date): Promise<DashboardGoalRef[]> {
        const horizonDate = new Date(now.getTime() + GOAL_HORIZON_DAYS * DAY_MS)
            .toISOString()
            .slice(0, 10);

        const rows = await this.db
            .selectFrom('goal')
            .select(['id', 'title', 'target_date'])
            .where('student_id', '=', userId)
            .where('status', '=', 'active')
            .where('target_date', 'is not', null)
            .where('target_date', '<=', horizonDate)
            .orderBy('target_date', 'asc')
            .limit(GOAL_LIMIT)
            .execute();

        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            // Non-null by the `is not null` predicate above.
            targetDate: r.target_date as string,
        }));
    }

    // --- pendingInvitations ---

    /**
     * A COUNT, not a payload — the Inkorg view owns the payload, and this
     * service deliberately does not depend on `InvitationService`.
     *
     * The `trim().toLowerCase()` normalization is byte-identical to
     * `InvitationService.listForUser`; two independent normalizations of an
     * email is exactly the kind of drift that makes a badge lie, so a test
     * asserts this count equals `listForUser(email).length`.
     *
     * Keyed on email rather than user id because that is the invitation
     * domain's existing design — pre-registration invitations are addressed to
     * an address, not an account.
     */
    private async pendingInvitations(userEmail: string): Promise<number> {
        const email = userEmail.trim().toLowerCase();
        const row = await this.db
            .selectFrom('invitations')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where('invitee_email', '=', email)
            .where('status', '=', 'pending')
            .executeTakeFirst();
        return Number(row?.count ?? 0);
    }
}
