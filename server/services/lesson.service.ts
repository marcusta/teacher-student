import type { Kysely } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, LessonStatus } from '../db/schema';

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: LessonStatus;
    horseId: string | null;
    horseName: string | null;
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

export interface UpdateLessonInput {
    horseId?: string | null;
    scheduledAt?: string;
}

interface LessonRow {
    id: string;
    teacher_id: string;
    student_id: string;
    scheduled_at: string;
    status: LessonStatus;
    horse_id: string | null;
    horse_name: string | null;
    created_at: string;
    updated_at: string;
}

function toLesson(row: LessonRow): Lesson {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        studentId: row.student_id,
        scheduledAt: row.scheduled_at,
        status: row.status,
        horseId: row.horse_id,
        horseName: row.horse_name,
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

const LESSON_COLUMNS = [
    'lessons.id as id',
    'lessons.teacher_id as teacher_id',
    'lessons.student_id as student_id',
    'lessons.scheduled_at as scheduled_at',
    'lessons.status as status',
    'lessons.horse_id as horse_id',
    'lessons.created_at as created_at',
    'lessons.updated_at as updated_at',
] as const;

/**
 * Owns the Teacher↔Student calendar. Deep module: callers pass
 * `(teacherId, ...)` for write operations; all ownership / Relation checks,
 * Horse-belongs-to-Student validation, timestamp + status defaulting, and
 * ISO-date validation live here.
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
            horse_id: null,
            created_at: now,
            updated_at: now,
        }).execute();

        return {
            id,
            teacherId,
            studentId: input.studentId,
            scheduledAt,
            status: 'planned',
            horseId: null,
            horseName: null,
            createdAt: now,
            updatedAt: now,
        };
    }

    /**
     * Teacher-side mutation. Owns Lesson reschedule + Horse attach/detach.
     * Throws NotFoundError (leak-safe) when the Lesson is missing or owned by
     * a different teacher. Throws Error (→ HTTP 400) when the supplied Horse
     * doesn't belong to the Lesson's Student or is archived.
     */
    async update(teacherId: string, lessonId: string, input: UpdateLessonInput): Promise<Lesson> {
        const lesson = await this.db
            .selectFrom('lessons')
            .select(['id', 'teacher_id', 'student_id'])
            .where('id', '=', lessonId)
            .executeTakeFirst();
        if (!lesson || lesson.teacher_id !== teacherId) {
            throw new NotFoundError('Lesson not found');
        }

        const patch: Record<string, string | null> = { updated_at: new Date().toISOString() };

        if (input.scheduledAt !== undefined) {
            patch.scheduled_at = assertIsoDate(input.scheduledAt);
        }

        if (input.horseId !== undefined) {
            if (input.horseId === null) {
                patch.horse_id = null;
            } else {
                const horse = await this.db
                    .selectFrom('horses')
                    .select(['id', 'student_id', 'archived_at'])
                    .where('id', '=', input.horseId)
                    .executeTakeFirst();
                if (!horse || horse.student_id !== lesson.student_id) {
                    throw new Error('Horse does not belong to the lesson Student');
                }
                if (horse.archived_at) throw new Error('Horse is archived');
                patch.horse_id = input.horseId;
            }
        }

        await this.db.updateTable('lessons')
            .set(patch)
            .where('id', '=', lessonId)
            .execute();

        const row = await this.db
            .selectFrom('lessons')
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .select([...LESSON_COLUMNS, 'horses.name as horse_name'])
            .where('lessons.id', '=', lessonId)
            .executeTakeFirstOrThrow();
        return toLesson(row as LessonRow);
    }

    async listForTeacher(teacherId: string): Promise<Lesson[]> {
        const rows = await this.db
            .selectFrom('lessons')
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .select([...LESSON_COLUMNS, 'horses.name as horse_name'])
            .where('lessons.teacher_id', '=', teacherId)
            .orderBy('lessons.scheduled_at', 'asc')
            .execute();
        return rows.map((r) => toLesson(r as LessonRow));
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
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .select([
                ...LESSON_COLUMNS,
                'horses.name as horse_name',
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
                ...toLesson(r as LessonRow),
                role: isTeacher ? 'teacher' : 'student',
                counterpartyDisplayName: isTeacher ? r.student_display_name : r.teacher_display_name,
            };
        });
    }
}
