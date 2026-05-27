import type { Kysely, Selectable } from 'kysely';
import { sql } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, GoalTable } from '../db/schema';

export interface Goal {
    id: string;
    studentId: string;
    title: string;
    description: string | null;
    targetDate: string | null;
    achievedAt: string | null;
    status: 'active' | 'achieved' | 'abandoned';
    sharedTeacherIds: string[];
    createdAt: string;
    updatedAt: string;
}

/** Teacher read view — omits co-watcher list (`sharedTeacherIds`). */
export interface GoalTeacherView {
    id: string;
    studentId: string;
    title: string;
    description: string | null;
    targetDate: string | null;
    achievedAt: string | null;
    status: 'active' | 'achieved' | 'abandoned';
    createdAt: string;
    updatedAt: string;
}

export interface SharedTeacherRef {
    teacherId: string;
    displayName: string;
}

export interface CreateGoalInput {
    title: string;
    description?: string;
    targetDate?: string;
}

export interface UpdateGoalInput {
    title?: string;
    description?: string | null;
    targetDate?: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertCalendarDate(value: string): void {
    if (!ISO_DATE.test(value)) throw new Error('Goal targetDate must be YYYY-MM-DD');
    const d = new Date(value + 'T00:00:00Z');
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
        throw new Error('Goal targetDate must be a real calendar date');
    }
}

function toGoal(row: Selectable<GoalTable>, sharedTeacherIds: string[] = []): Goal {
    return {
        ...toGoalTeacherView(row),
        sharedTeacherIds,
    };
}

function toGoalTeacherView(row: Selectable<GoalTable>): GoalTeacherView {
    return {
        id: row.id,
        studentId: row.student_id,
        title: row.title,
        description: row.description,
        targetDate: row.target_date,
        achievedAt: row.achieved_at,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

const GOAL_STATUS_ORDER = sql`CASE goal.status WHEN 'active' THEN 0 WHEN 'achieved' THEN 1 WHEN 'abandoned' THEN 2 END`;

/**
 * Owns a Student's Goals (mål). Deep module: callers pass `(studentId, ...)`;
 * ownership checks, trimming, date validation, sharing, and status filtering
 * live here.
 */
export class GoalService {
    constructor(private db: Kysely<Database>) {}

    async create(studentId: string, input: CreateGoalInput): Promise<Goal> {
        const title = input.title.trim();
        if (title.length === 0) throw new Error('Goal title must not be empty');

        if (input.targetDate !== undefined) assertCalendarDate(input.targetDate);

        const trimmedDescription = input.description?.trim();
        const description = trimmedDescription ? trimmedDescription : null;

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insertInto('goal').values({
            id,
            student_id: studentId,
            title,
            description,
            target_date: input.targetDate ?? null,
            achieved_at: null,
            status: 'active',
            created_at: now,
            updated_at: now,
        }).execute();

        return {
            id,
            studentId,
            title,
            description,
            targetDate: input.targetDate ?? null,
            achievedAt: null,
            status: 'active',
            sharedTeacherIds: [],
            createdAt: now,
            updatedAt: now,
        };
    }

    /**
     * All own goals, active before achieved before abandoned, then
     * `created_at DESC` within each status group.
     */
    async listForStudent(studentId: string): Promise<Goal[]> {
        const rows = await this.db
            .selectFrom('goal')
            .selectAll()
            .where('student_id', '=', studentId)
            .orderBy(GOAL_STATUS_ORDER, 'asc')
            .orderBy('created_at', 'desc')
            .execute();
        const shares = await this.sharesByGoal(rows.map((r) => r.id));
        return rows.map((r) => toGoal(r, shares.get(r.id) ?? []));
    }

    async getForStudent(studentId: string, goalId: string): Promise<Goal> {
        const row = await this.db
            .selectFrom('goal')
            .selectAll()
            .where('id', '=', goalId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Goal not found');
        const shares = await this.sharesByGoal([goalId]);
        return toGoal(row, shares.get(goalId) ?? []);
    }

    async update(studentId: string, goalId: string, input: UpdateGoalInput): Promise<Goal> {
        const patch: Partial<{
            title: string;
            description: string | null;
            target_date: string | null;
            updated_at: string;
        }> = {};

        if (input.title !== undefined) {
            const title = input.title.trim();
            if (title.length === 0) throw new Error('Goal title must not be empty');
            patch.title = title;
        }
        if (input.description !== undefined) {
            const trimmed = input.description?.trim();
            patch.description = trimmed ? trimmed : null;
        }
        if (input.targetDate !== undefined) {
            if (input.targetDate !== null) assertCalendarDate(input.targetDate);
            patch.target_date = input.targetDate;
        }
        patch.updated_at = new Date().toISOString();

        const rows = await this.db
            .updateTable('goal')
            .set(patch)
            .where('id', '=', goalId)
            .where('student_id', '=', studentId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Goal not found');

        return this.getForStudent(studentId, goalId);
    }

    /**
     * Abandon a Goal (soft-delete). Idempotent: abandoning an already-abandoned
     * goal is a no-op success. Throws `NotFoundError` if the goal does not
     * exist or belongs to a different student (leak-safe).
     */
    async abandon(studentId: string, goalId: string): Promise<void> {
        const row = await this.db
            .selectFrom('goal')
            .select(['status'])
            .where('id', '=', goalId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Goal not found');
        if (row.status === 'abandoned') return;

        await this.db
            .updateTable('goal')
            .set({ status: 'abandoned', updated_at: new Date().toISOString() })
            .where('id', '=', goalId)
            .where('student_id', '=', studentId)
            .execute();
    }

    /** Share a Goal with a connected Teacher. Idempotent. Owner-only. */
    async share(studentId: string, goalId: string, teacherId: string): Promise<void> {
        await this.assertGoalOwner(studentId, goalId);
        await this.assertConnectedTeacher(studentId, teacherId);

        await this.db.insertInto('goal_share')
            .values({ goal_id: goalId, teacher_id: teacherId })
            .onConflict((oc) => oc.columns(['goal_id', 'teacher_id']).doNothing())
            .execute();
    }

    /** Unshare a Goal from a Teacher. Idempotent. Owner-only. */
    async unshare(studentId: string, goalId: string, teacherId: string): Promise<void> {
        await this.assertGoalOwner(studentId, goalId);
        await this.db.deleteFrom('goal_share')
            .where('goal_id', '=', goalId)
            .where('teacher_id', '=', teacherId)
            .execute();
    }

    /**
     * List Teachers a Goal is shared with. Owner-only; returns display names
     * sorted by `displayName ASC`.
     */
    async listSharedTeachers(studentId: string, goalId: string): Promise<SharedTeacherRef[]> {
        await this.assertGoalOwner(studentId, goalId);
        const rows = await this.db
            .selectFrom('goal_share')
            .innerJoin('users', 'users.id', 'goal_share.teacher_id')
            .select(['goal_share.teacher_id as teacher_id', 'users.display_name as display_name'])
            .where('goal_share.goal_id', '=', goalId)
            .orderBy('users.display_name', 'asc')
            .execute();
        return rows.map((r) => ({
            teacherId: r.teacher_id,
            displayName: r.display_name,
        }));
    }

    /**
     * Read-only view of a connected Student's shared Goals for a Teacher.
     * Requires an active **Relation** and a matching `goal_share` row;
     * otherwise throws `NotFoundError` (leak-safe).
     */
    async listForStudentAsTeacher(teacherId: string, studentId: string): Promise<GoalTeacherView[]> {
        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Student not found');

        const rows = await this.db
            .selectFrom('goal')
            .innerJoin('goal_share', 'goal_share.goal_id', 'goal.id')
            .selectAll('goal')
            .where('goal.student_id', '=', studentId)
            .where('goal_share.teacher_id', '=', teacherId)
            .orderBy(GOAL_STATUS_ORDER, 'asc')
            .orderBy('goal.created_at', 'desc')
            .execute();
        return rows.map(toGoalTeacherView);
    }

    /** Returns a shared Goal for a Teacher, or NotFoundError (leak-safe). */
    async getForTeacher(teacherId: string, goalId: string): Promise<GoalTeacherView> {
        const row = await this.db
            .selectFrom('goal')
            .innerJoin('goal_share', 'goal_share.goal_id', 'goal.id')
            .selectAll('goal')
            .where('goal.id', '=', goalId)
            .where('goal_share.teacher_id', '=', teacherId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Goal not found');
        return toGoalTeacherView(row);
    }

    private async assertGoalOwner(studentId: string, goalId: string): Promise<void> {
        const row = await this.db
            .selectFrom('goal')
            .select('id')
            .where('id', '=', goalId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Goal not found');
    }

    private async assertConnectedTeacher(studentId: string, teacherId: string): Promise<void> {
        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Goal not found');
    }

    private async sharesByGoal(ids: string[]): Promise<Map<string, string[]>> {
        const out = new Map<string, string[]>();
        if (ids.length === 0) return out;
        const rows = await this.db
            .selectFrom('goal_share')
            .select(['goal_id', 'teacher_id'])
            .where('goal_id', 'in', ids)
            .execute();
        for (const r of rows) {
            const list = out.get(r.goal_id) ?? [];
            list.push(r.teacher_id);
            out.set(r.goal_id, list);
        }
        return out;
    }
}

export { toGoal, toGoalTeacherView };
