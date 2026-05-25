import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, LessonsTable, LessonStatus } from '../db/schema';

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: LessonStatus;
    createdAt: string;
    updatedAt: string;
}

/**
 * Lesson plus a `role` discriminator describing the caller's side and the
 * resolved counterparty display name. Used by the unified `GET /api/lessons`
 * which serves both teachers and students from a single endpoint.
 */
export interface LessonForUser extends Lesson {
    role: 'teacher' | 'student';
    counterpartyDisplayName: string;
}

export interface CreateLessonInput {
    studentId: string;
    scheduledAt: string;
}

function toLesson(row: Selectable<LessonsTable>): Lesson {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        studentId: row.student_id,
        scheduledAt: row.scheduled_at,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function assertIsoDate(value: string): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) throw new Error('Lesson scheduledAt must be a valid ISO 8601 date');
    // Normalize to canonical ISO 8601 with milliseconds so the stored value
    // round-trips through JSON/HTTP boundaries unchanged.
    return new Date(parsed).toISOString();
}

/**
 * Owns the Teacher↔Student calendar. Deep module: callers pass
 * `(teacherId, ...)` for write operations; all ownership / Relation checks,
 * timestamp + status defaulting, and ISO-date validation live here.
 */
export class LessonService {
    constructor(private db: Kysely<Database>) {}

    async create(teacherId: string, input: CreateLessonInput): Promise<Lesson> {
        const scheduledAt = assertIsoDate(input.scheduledAt);

        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', input.studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Student not found');

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.insertInto('lessons').values({
            id,
            teacher_id: teacherId,
            student_id: input.studentId,
            scheduled_at: scheduledAt,
            status: 'planned',
            created_at: now,
            updated_at: now,
        }).execute();

        return {
            id,
            teacherId,
            studentId: input.studentId,
            scheduledAt,
            status: 'planned',
            createdAt: now,
            updatedAt: now,
        };
    }

    async listForTeacher(teacherId: string): Promise<Lesson[]> {
        const rows = await this.db
            .selectFrom('lessons')
            .selectAll()
            .where('teacher_id', '=', teacherId)
            .orderBy('scheduled_at', 'asc')
            .execute();
        return rows.map(toLesson);
    }

    /**
     * Lessons relevant to `userId` from both sides — as teacher and as
     * student — merged and sorted by `scheduled_at ASC`. Each row carries
     * the caller's `role` and the counterparty's display name, so the UI
     * can render a single timeline without a follow-up roster lookup.
     */
    async listForUser(userId: string): Promise<LessonForUser[]> {
        const rows = await this.db
            .selectFrom('lessons')
            .innerJoin('users as teacher', 'teacher.id', 'lessons.teacher_id')
            .innerJoin('users as student', 'student.id', 'lessons.student_id')
            .select([
                'lessons.id as id',
                'lessons.teacher_id as teacher_id',
                'lessons.student_id as student_id',
                'lessons.scheduled_at as scheduled_at',
                'lessons.status as status',
                'lessons.created_at as created_at',
                'lessons.updated_at as updated_at',
                'teacher.display_name as teacher_display_name',
                'student.display_name as student_display_name',
            ])
            .where((eb) => eb.or([
                eb('lessons.teacher_id', '=', userId),
                eb('lessons.student_id', '=', userId),
            ]))
            .orderBy('lessons.scheduled_at', 'asc')
            .execute();

        return rows.map((r) => {
            const isTeacher = r.teacher_id === userId;
            return {
                ...toLesson(r),
                role: isTeacher ? 'teacher' : 'student',
                counterpartyDisplayName: isTeacher ? r.student_display_name : r.teacher_display_name,
            };
        });
    }
}
