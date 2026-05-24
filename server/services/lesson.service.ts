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
}
