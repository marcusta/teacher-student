import type { Kysely } from 'kysely';
import { ConflictError, NotFoundError } from '@basics/core/server/auth';
import type { Database, LessonStatus } from '../db/schema';

export interface LessonExerciseRef {
    /** Surrogate id of the `lesson_exercise` junction row (parent target for Notes). */
    id: string;
    /** The library Exercise's id. */
    exerciseId: string;
    name: string;
    sortOrder: number;
    /** Program this row was snapshot-copied from, or null when added free. */
    sourceProgramId: string | null;
}

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: LessonStatus;
    horseId: string | null;
    horseName: string | null;
    programId: string | null;
    programTitle: string | null;
    exercises: LessonExerciseRef[];
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
    programId?: string;
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
    program_id: string | null;
    program_title: string | null;
    created_at: string;
    updated_at: string;
}

function toLesson(row: LessonRow, exercises: LessonExerciseRef[]): Lesson {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        studentId: row.student_id,
        scheduledAt: row.scheduled_at,
        status: row.status,
        horseId: row.horse_id,
        horseName: row.horse_name,
        programId: row.program_id,
        programTitle: row.program_title,
        exercises,
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
    'lessons.program_id as program_id',
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

        let program: { id: string; title: string } | null = null;
        let programRows: { exercise_id: string; sort_order: number; notes: string | null }[] = [];
        if (input.programId !== undefined) {
            const p = await this.db
                .selectFrom('programs')
                .select(['id', 'teacher_id', 'title'])
                .where('id', '=', input.programId)
                .executeTakeFirst();
            if (!p || p.teacher_id !== teacherId) {
                throw new NotFoundError('Program not found');
            }
            program = { id: p.id, title: p.title };
            programRows = await this.db
                .selectFrom('program_exercise')
                .select(['exercise_id', 'sort_order', 'notes'])
                .where('program_id', '=', p.id)
                .orderBy('sort_order', 'asc')
                .execute();
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.transaction().execute(async (tx) => {
            await tx.insertInto('lessons').values({
                id,
                teacher_id: teacherId,
                student_id: input.studentId,
                scheduled_at: scheduledAt,
                status: 'planned',
                horse_id: null,
                program_id: program?.id ?? null,
                created_at: now,
                updated_at: now,
            }).execute();

            if (programRows.length > 0) {
                await tx.insertInto('lesson_exercise').values(programRows.map((r) => ({
                    id: crypto.randomUUID(),
                    lesson_id: id,
                    exercise_id: r.exercise_id,
                    sort_order: r.sort_order,
                    notes: r.notes,
                    source_program_id: program!.id,
                }))).execute();
            }
        });

        return this.loadOne(id);
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

        return this.loadOne(lessonId);
    }

    /**
     * Move a Lesson into a terminal status. Idempotent on same-status calls.
     * Rejects terminal→other-terminal moves with ConflictError so the UI can
     * surface a 409 distinct from a generic validation error. NotFoundError
     * (leak-safe) when the Lesson is missing or owned by another teacher.
     */
    async transition(
        teacherId: string,
        lessonId: string,
        target: 'completed' | 'cancelled',
    ): Promise<Lesson> {
        const lesson = await this.db
            .selectFrom('lessons')
            .select(['id', 'teacher_id', 'status'])
            .where('id', '=', lessonId)
            .executeTakeFirst();
        if (!lesson || lesson.teacher_id !== teacherId) {
            throw new NotFoundError('Lesson not found');
        }
        if (lesson.status !== 'planned' && lesson.status !== target) {
            throw new ConflictError(`Lesson is already ${lesson.status}`);
        }
        if (lesson.status !== target) {
            await this.db.updateTable('lessons')
                .set({ status: target, updated_at: new Date().toISOString() })
                .where('id', '=', lessonId)
                .execute();
        }
        return this.loadOne(lessonId);
    }

    async listForTeacher(teacherId: string): Promise<Lesson[]> {
        const rows = await this.db
            .selectFrom('lessons')
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .leftJoin('programs', 'programs.id', 'lessons.program_id')
            .select([...LESSON_COLUMNS, 'horses.name as horse_name', 'programs.title as program_title'])
            .where('lessons.teacher_id', '=', teacherId)
            .orderBy('lessons.scheduled_at', 'asc')
            .execute();
        const exMap = await this.exercisesByLesson(rows.map((r) => r.id));
        return rows.map((r) => toLesson(r as LessonRow, exMap.get(r.id) ?? []));
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
            .leftJoin('programs', 'programs.id', 'lessons.program_id')
            .select([
                ...LESSON_COLUMNS,
                'horses.name as horse_name',
                'programs.title as program_title',
                'teacher.display_name as teacher_display_name',
                'student.display_name as student_display_name',
            ])
            .where((eb) => eb.or([
                eb('lessons.teacher_id', '=', userId),
                eb('lessons.student_id', '=', userId),
            ]))
            .orderBy('lessons.scheduled_at', 'asc')
            .execute();

        const exMap = await this.exercisesByLesson(rows.map((r) => r.id));
        return rows.map((r) => {
            const isTeacher = r.teacher_id === userId;
            return {
                ...toLesson(r as LessonRow, exMap.get(r.id) ?? []),
                role: isTeacher ? 'teacher' : 'student',
                counterpartyDisplayName: isTeacher ? r.student_display_name : r.teacher_display_name,
            };
        });
    }

    /**
     * Append an Exercise to a Lesson. Both the Lesson and the Exercise must
     * be owned by `teacherId` (NotFoundError otherwise — leak-safe). The
     * write is idempotent: a duplicate (lesson_id, exercise_id) is a no-op.
     */
    async addExercise(teacherId: string, lessonId: string, exerciseId: string): Promise<void> {
        const lesson = await this.db
            .selectFrom('lessons')
            .select(['id', 'teacher_id'])
            .where('id', '=', lessonId)
            .executeTakeFirst();
        if (!lesson || lesson.teacher_id !== teacherId) {
            throw new NotFoundError('Lesson not found');
        }
        const exercise = await this.db
            .selectFrom('exercises')
            .select(['id', 'teacher_id'])
            .where('id', '=', exerciseId)
            .executeTakeFirst();
        if (!exercise || exercise.teacher_id !== teacherId) {
            throw new NotFoundError('Exercise not found');
        }

        const existing = await this.db
            .selectFrom('lesson_exercise')
            .select(['lesson_id'])
            .where('lesson_id', '=', lessonId)
            .where('exercise_id', '=', exerciseId)
            .executeTakeFirst();
        if (existing) return;

        const max = await this.db
            .selectFrom('lesson_exercise')
            .select(({ fn }) => fn.max('sort_order').as('m'))
            .where('lesson_id', '=', lessonId)
            .executeTakeFirst();
        const nextOrder = ((max?.m as number | null | undefined) ?? 0) + 1;

        await this.db.insertInto('lesson_exercise').values({
            id: crypto.randomUUID(),
            lesson_id: lessonId,
            exercise_id: exerciseId,
            sort_order: nextOrder,
            notes: null,
            source_program_id: null,
        }).execute();
    }

    /**
     * Detach an Exercise from a Lesson. NotFoundError when the Lesson isn't
     * owned by the caller; idempotent when the link is already gone.
     */
    async removeExercise(teacherId: string, lessonId: string, exerciseId: string): Promise<void> {
        const lesson = await this.db
            .selectFrom('lessons')
            .select(['id', 'teacher_id'])
            .where('id', '=', lessonId)
            .executeTakeFirst();
        if (!lesson || lesson.teacher_id !== teacherId) {
            throw new NotFoundError('Lesson not found');
        }
        await this.db.deleteFrom('lesson_exercise')
            .where('lesson_id', '=', lessonId)
            .where('exercise_id', '=', exerciseId)
            .execute();
    }

    /**
     * Read the ordered list of attached Exercises for a Lesson. Accessible
     * to either side of the Lesson; NotFoundError to outsiders so the
     * existence of the Lesson doesn't leak.
     */
    async listExercises(userId: string, lessonId: string): Promise<LessonExerciseRef[]> {
        const lesson = await this.db
            .selectFrom('lessons')
            .select(['id', 'teacher_id', 'student_id'])
            .where('id', '=', lessonId)
            .executeTakeFirst();
        if (!lesson || (lesson.teacher_id !== userId && lesson.student_id !== userId)) {
            throw new NotFoundError('Lesson not found');
        }
        const map = await this.exercisesByLesson([lessonId]);
        return map.get(lessonId) ?? [];
    }

    /** Resolve a single Lesson with all hydrated fields. */
    private async loadOne(lessonId: string): Promise<Lesson> {
        const row = await this.db
            .selectFrom('lessons')
            .leftJoin('horses', 'horses.id', 'lessons.horse_id')
            .leftJoin('programs', 'programs.id', 'lessons.program_id')
            .select([...LESSON_COLUMNS, 'horses.name as horse_name', 'programs.title as program_title'])
            .where('lessons.id', '=', lessonId)
            .executeTakeFirstOrThrow();
        const map = await this.exercisesByLesson([lessonId]);
        return toLesson(row as LessonRow, map.get(lessonId) ?? []);
    }

    /**
     * Batch-fetch attached Exercises for a set of lesson ids and group them
     * by lesson id so callers can hydrate list responses in one query.
     */
    private async exercisesByLesson(
        lessonIds: string[],
    ): Promise<Map<string, LessonExerciseRef[]>> {
        const out = new Map<string, LessonExerciseRef[]>();
        if (lessonIds.length === 0) return out;
        const rows = await this.db
            .selectFrom('lesson_exercise')
            .innerJoin('exercises', 'exercises.id', 'lesson_exercise.exercise_id')
            .select([
                'lesson_exercise.id as id',
                'lesson_exercise.lesson_id as lesson_id',
                'lesson_exercise.sort_order as sort_order',
                'lesson_exercise.source_program_id as source_program_id',
                'exercises.id as exercise_id',
                'exercises.name as name',
            ])
            .where('lesson_exercise.lesson_id', 'in', lessonIds)
            .orderBy('lesson_exercise.lesson_id')
            .orderBy('lesson_exercise.sort_order', 'asc')
            .execute();
        for (const r of rows) {
            const list = out.get(r.lesson_id) ?? [];
            list.push({
                id: r.id,
                exerciseId: r.exercise_id,
                name: r.name,
                sortOrder: r.sort_order,
                sourceProgramId: r.source_program_id,
            });
            out.set(r.lesson_id, list);
        }
        return out;
    }
}
