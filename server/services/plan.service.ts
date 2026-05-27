import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, PlansTable } from '../db/schema';

export interface Plan {
    id: string;
    studentId: string;
    primaryTeacherId: string | null;
    primaryTeacherDisplayName: string | null;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: 'active' | 'archived';
    createdAt: string;
    updatedAt: string;
}

export interface CreatePlanInput {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    primaryTeacherId?: string;
}

export interface UpdatePlanInput {
    title?: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    primaryTeacherId?: string | null;
}

export interface LinkedLessonRef {
    id: string;
    scheduledAt: string;
    teacherDisplayName: string;
    status: 'planned' | 'completed' | 'cancelled';
    horseName: string | null;
}

export interface LinkedTrainingSessionRef {
    id: string;
    performedAt: string;
    durationMin: number | null;
    summary: string | null;
    horseName: string | null;
}

export interface PlanDetail extends Plan {
    lessons: LinkedLessonRef[];
    trainingSessions: LinkedTrainingSessionRef[];
}

function toPlan(row: Selectable<PlansTable>, primaryTeacherDisplayName: string | null = null): Plan {
    return {
        id: row.id,
        studentId: row.student_id,
        primaryTeacherId: row.primary_teacher_id,
        primaryTeacherDisplayName,
        title: row.title,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Owns a Student's Plans (träningsplan). Deep module: callers pass
 * `(studentId, ...)`; ownership checks, trimming, primary-teacher
 * Relation validation, and status filtering live here.
 */
export class PlanService {
    constructor(private db: Kysely<Database>) {}

    async create(studentId: string, input: CreatePlanInput): Promise<Plan> {
        const title = input.title.trim();
        if (title.length === 0) throw new Error('Plan title must not be empty');

        if (input.primaryTeacherId) {
            await this.assertConnectedTeacher(studentId, input.primaryTeacherId);
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insertInto('plans').values({
            id,
            student_id: studentId,
            primary_teacher_id: input.primaryTeacherId ?? null,
            title,
            description: input.description?.trim() ?? null,
            start_date: input.startDate ?? null,
            end_date: input.endDate ?? null,
            status: 'active',
            created_at: now,
            updated_at: now,
        }).execute();

        return {
            id,
            studentId,
            primaryTeacherId: input.primaryTeacherId ?? null,
            primaryTeacherDisplayName: null,
            title,
            description: input.description?.trim() ?? null,
            startDate: input.startDate ?? null,
            endDate: input.endDate ?? null,
            status: 'active',
            createdAt: now,
            updatedAt: now,
        };
    }

    /**
     * All own plans, active before archived, then `created_at DESC` within
     * each status group.
     */
    async listForStudent(studentId: string): Promise<Plan[]> {
        const rows = await this.db
            .selectFrom('plans')
            .leftJoin('users as primary_teacher', 'primary_teacher.id', 'plans.primary_teacher_id')
            .select([
                'plans.id', 'plans.student_id', 'plans.primary_teacher_id',
                'plans.title', 'plans.description', 'plans.start_date', 'plans.end_date',
                'plans.status', 'plans.created_at', 'plans.updated_at',
                'primary_teacher.display_name as primary_teacher_display_name',
            ])
            .where('plans.student_id', '=', studentId)
            .orderBy('plans.status', 'asc')
            .orderBy('plans.created_at', 'desc')
            .execute();
        return rows.map((r) => toPlan(r, r.primary_teacher_display_name));
    }

    async getForStudent(studentId: string, planId: string): Promise<Plan> {
        const row = await this.db
            .selectFrom('plans')
            .selectAll()
            .where('id', '=', planId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Plan not found');
        return toPlan(row);
    }

    /**
     * Plan metadata plus linked Lessons and Training Sessions. Callable by
     * the owning Student or a Teacher in an active Relation with the owner;
     * otherwise NotFoundError (leak-safe). Archived plans remain readable.
     */
    async getDetail(actorId: string, planId: string): Promise<PlanDetail> {
        const row = await this.db
            .selectFrom('plans')
            .leftJoin('users as primary_teacher', 'primary_teacher.id', 'plans.primary_teacher_id')
            .select([
                'plans.id', 'plans.student_id', 'plans.primary_teacher_id',
                'plans.title', 'plans.description', 'plans.start_date', 'plans.end_date',
                'plans.status', 'plans.created_at', 'plans.updated_at',
                'primary_teacher.display_name as primary_teacher_display_name',
            ])
            .where('plans.id', '=', planId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Plan not found');

        if (row.student_id !== actorId) {
            const rel = await this.db
                .selectFrom('relations')
                .select('id')
                .where('teacher_id', '=', actorId)
                .where('student_id', '=', row.student_id)
                .executeTakeFirst();
            if (!rel) throw new NotFoundError('Plan not found');
        }

        const lessons = await this.db
            .selectFrom('lessons')
            .innerJoin('users as teacher', 'teacher.id', 'lessons.teacher_id')
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .select([
                'lessons.id as id',
                'lessons.scheduled_at as scheduled_at',
                'lessons.status as status',
                'teacher.display_name as teacher_display_name',
                'horses.name as horse_name',
            ])
            .where('lessons.plan_id', '=', planId)
            .orderBy('lessons.scheduled_at', 'asc')
            .execute();

        const trainingSessions = await this.db
            .selectFrom('training_sessions')
            .leftJoin('horses', 'horses.id', 'training_sessions.horse_id')
            .select([
                'training_sessions.id as id',
                'training_sessions.performed_at as performed_at',
                'training_sessions.duration_min as duration_min',
                'training_sessions.summary as summary',
                'horses.name as horse_name',
            ])
            .where('training_sessions.plan_id', '=', planId)
            .orderBy('training_sessions.performed_at', 'desc')
            .execute();

        return {
            ...toPlan(row, row.primary_teacher_display_name),
            lessons: lessons.map((l) => ({
                id: l.id,
                scheduledAt: l.scheduled_at,
                teacherDisplayName: l.teacher_display_name,
                status: l.status,
                horseName: l.horse_name,
            })),
            trainingSessions: trainingSessions.map((ts) => ({
                id: ts.id,
                performedAt: ts.performed_at,
                durationMin: ts.duration_min,
                summary: ts.summary,
                horseName: ts.horse_name,
            })),
        };
    }

    async update(studentId: string, planId: string, input: UpdatePlanInput): Promise<Plan> {
        const patch: Partial<{
            title: string;
            description: string | null;
            start_date: string | null;
            end_date: string | null;
            primary_teacher_id: string | null;
            updated_at: string;
        }> = {};

        if (input.title !== undefined) {
            const title = input.title.trim();
            if (title.length === 0) throw new Error('Plan title must not be empty');
            patch.title = title;
        }
        if (input.description !== undefined) {
            patch.description = input.description?.trim() ?? null;
        }
        if (input.startDate !== undefined) patch.start_date = input.startDate;
        if (input.endDate !== undefined) patch.end_date = input.endDate;
        if (input.primaryTeacherId !== undefined) {
            if (input.primaryTeacherId !== null) {
                await this.assertConnectedTeacher(studentId, input.primaryTeacherId);
            }
            patch.primary_teacher_id = input.primaryTeacherId;
        }
        patch.updated_at = new Date().toISOString();

        const rows = await this.db
            .updateTable('plans')
            .set(patch)
            .where('id', '=', planId)
            .where('student_id', '=', studentId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Plan not found');

        return this.getForStudent(studentId, planId);
    }

    /**
     * Archive a Plan (soft-delete). Idempotent: archiving an already-archived
     * plan is a no-op success. Throws `NotFoundError` if the plan does not
     * exist or belongs to a different student (leak-safe).
     */
    async archive(studentId: string, planId: string): Promise<void> {
        const row = await this.db
            .selectFrom('plans')
            .select(['status'])
            .where('id', '=', planId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Plan not found');
        if (row.status === 'archived') return;

        await this.db
            .updateTable('plans')
            .set({ status: 'archived', updated_at: new Date().toISOString() })
            .where('id', '=', planId)
            .where('student_id', '=', studentId)
            .execute();
    }

    /**
     * Read-only view of a connected Student's active Plans for a Teacher.
     * Requires an existing `Relation(teacher_id, student_id)`; otherwise
     * throws `NotFoundError` (leak-safe).
     */
    async listForStudentAsTeacher(teacherId: string, studentId: string): Promise<Plan[]> {
        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Student not found');

        const rows = await this.db
            .selectFrom('plans')
            .leftJoin('users as primary_teacher', 'primary_teacher.id', 'plans.primary_teacher_id')
            .select([
                'plans.id', 'plans.student_id', 'plans.primary_teacher_id',
                'plans.title', 'plans.description', 'plans.start_date', 'plans.end_date',
                'plans.status', 'plans.created_at', 'plans.updated_at',
                'primary_teacher.display_name as primary_teacher_display_name',
            ])
            .where('plans.student_id', '=', studentId)
            .where('plans.status', '=', 'active')
            .orderBy('plans.created_at', 'desc')
            .execute();
        return rows.map((r) => toPlan(r, r.primary_teacher_display_name));
    }

    /**
     * Internal helper for attach flows (036/037): plan exists, owned by
     * student, and status is active.
     */
    async assertActivePlanForStudent(planId: string, studentId: string): Promise<void> {
        const row = await this.db
            .selectFrom('plans')
            .select(['student_id', 'status'])
            .where('id', '=', planId)
            .executeTakeFirst();
        if (!row || row.student_id !== studentId || row.status !== 'active') {
            throw new NotFoundError('Plan not found');
        }
    }

    private async assertConnectedTeacher(studentId: string, teacherId: string): Promise<void> {
        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Plan not found');
    }
}
