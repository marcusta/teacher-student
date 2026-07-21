import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, ProgramsTable } from '../db/schema';

export interface Program {
    id: string;
    teacherId: string;
    title: string;
    description: string;
    archivedAt: string | null;
    createdAt: string;
}

export interface CreateProgramInput {
    title: string;
    description?: string;
}

export interface UpdateProgramInput {
    title?: string;
    description?: string;
}

export interface ProgramExerciseRef {
    id: string;
    name: string;
    description: string;
    sortOrder: number;
    notes: string | null;
    /**
     * Archive stamp of the underlying Exercise, or null while it is live.
     *
     * `listExercises` deliberately does NOT filter archived Exercises out — a
     * Program keeps its sequence when a Teacher retires an Exercise, and the
     * builder marks the row rather than dropping it. The builder used to infer
     * that state from the row's ABSENCE from `GET /exercises`, which is exact
     * only while that endpoint returns the whole library unpaginated. IA §4
     * warns against assuming lists stay small; the day it grows a page limit,
     * every Exercise past page one would silently read as archived. Stating the
     * fact on the row it belongs to costs one column on a join we already make.
     */
    archivedAt: string | null;
}

export interface AddProgramExerciseInput {
    notes?: string;
}

function toProgram(row: Selectable<ProgramsTable>): Program {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        title: row.title,
        description: row.description,
        archivedAt: row.archived_at,
        createdAt: row.created_at,
    };
}

/**
 * Owns a Teacher's library of Programs — reusable named Exercise routines
 * ("ridprogram"). Deep module: callers pass `(teacherId, ...)`; all ownership
 * checks, trimming and DB shape mapping live here. A Program is teacher-owned
 * and unattached to any Student or date — distinct from a Plan, which is the
 * student-owned long-term umbrella.
 */
export class ProgramService {
    constructor(private db: Kysely<Database>) {}

    async create(teacherId: string, input: CreateProgramInput): Promise<Program> {
        const title = input.title.trim();
        if (title.length === 0) throw new Error('Program title must not be empty');
        const description = (input.description ?? '').trim();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insertInto('programs').values({
            id,
            teacher_id: teacherId,
            title,
            description,
            archived_at: null,
            created_at: now,
        }).execute();

        return { id, teacherId, title, description, archivedAt: null, createdAt: now };
    }

    async listForTeacher(teacherId: string): Promise<Program[]> {
        const rows = await this.db
            .selectFrom('programs')
            .selectAll()
            .where('teacher_id', '=', teacherId)
            .where('archived_at', 'is', null)
            .orderBy('created_at', 'desc')
            .execute();
        return rows.map(toProgram);
    }

    /**
     * Student-visible Program catalog: all Programs owned by Teachers in an
     * active Relation with the student. Powers the Training Session picker.
     */
    async listForStudent(studentId: string): Promise<Program[]> {
        const user = await this.db
            .selectFrom('users')
            .select('id')
            .where('id', '=', studentId)
            .executeTakeFirst();
        if (!user) throw new NotFoundError('Student not found');

        const rows = await this.db
            .selectFrom('programs')
            .innerJoin('relations', 'relations.teacher_id', 'programs.teacher_id')
            .selectAll('programs')
            .where('relations.student_id', '=', studentId)
            .where('programs.archived_at', 'is', null)
            .orderBy('programs.created_at', 'desc')
            .execute();
        return rows.map(toProgram);
    }

    async getForTeacher(teacherId: string, programId: string): Promise<Program | null> {
        const row = await this.db
            .selectFrom('programs')
            .selectAll()
            .where('id', '=', programId)
            .where('teacher_id', '=', teacherId)
            .executeTakeFirst();
        return row ? toProgram(row) : null;
    }

    async update(teacherId: string, programId: string, input: UpdateProgramInput): Promise<Program> {
        const patch: Partial<{ title: string; description: string }> = {};
        if (input.title !== undefined) {
            const title = input.title.trim();
            if (title.length === 0) throw new Error('Program title must not be empty');
            patch.title = title;
        }
        if (input.description !== undefined) {
            patch.description = input.description.trim();
        }

        const rows = await this.db
            .updateTable('programs')
            .set(patch)
            .where('id', '=', programId)
            .where('teacher_id', '=', teacherId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Program not found');

        const updated = await this.getForTeacher(teacherId, programId);
        if (!updated) throw new NotFoundError('Program not found');
        return updated;
    }

    /**
     * Archive a Program (soft-delete). Idempotent: archiving an
     * already-archived program is a no-op success. Throws `NotFoundError`
     * if the program does not exist or belongs to a different teacher
     * (leak-safe).
     *
     * Deliberately not a hard delete: a cascade would drop the
     * `lesson_program` / `training_session_program` junction rows and null
     * out `lesson_exercise.source_program_id`, so past Lessons would lose
     * their "from program X" provenance label. Archiving keeps the row
     * resolvable by id while hiding it from every picker.
     */
    async archive(teacherId: string, programId: string): Promise<void> {
        const row = await this.db
            .selectFrom('programs')
            .select(['archived_at'])
            .where('id', '=', programId)
            .where('teacher_id', '=', teacherId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Program not found');
        if (row.archived_at !== null) return; // idempotent

        await this.db
            .updateTable('programs')
            .set({ archived_at: new Date().toISOString() })
            .where('id', '=', programId)
            .where('teacher_id', '=', teacherId)
            .execute();
    }

    /**
     * Append an Exercise to a Program. Both the Program and the Exercise must
     * be owned by `teacherId` — NotFoundError otherwise (leak-safe). A
     * duplicate `(program_id, exercise_id)` is rejected with a clear error;
     * snapshot-on-attach semantics mean the same routine should not contain
     * the same exercise twice.
     *
     * Sort order is 0-indexed: 0 for the first row, `max + 1` thereafter.
     */
    async addExercise(
        teacherId: string,
        programId: string,
        exerciseId: string,
        input: AddProgramExerciseInput = {},
    ): Promise<void> {
        const program = await this.db
            .selectFrom('programs')
            .select(['id', 'teacher_id'])
            .where('id', '=', programId)
            .executeTakeFirst();
        if (!program || program.teacher_id !== teacherId) {
            throw new NotFoundError('Program not found');
        }
        const exercise = await this.db
            .selectFrom('exercises')
            .select(['id', 'teacher_id', 'archived_at'])
            .where('id', '=', exerciseId)
            .executeTakeFirst();
        if (!exercise || exercise.teacher_id !== teacherId || exercise.archived_at !== null) {
            throw new NotFoundError('Exercise not found');
        }

        const existing = await this.db
            .selectFrom('program_exercise')
            .select(['program_id'])
            .where('program_id', '=', programId)
            .where('exercise_id', '=', exerciseId)
            .executeTakeFirst();
        if (existing) {
            throw new Error('Exercise is already in this Program');
        }

        const max = await this.db
            .selectFrom('program_exercise')
            .select(({ fn }) => fn.max('sort_order').as('m'))
            .where('program_id', '=', programId)
            .executeTakeFirst();
        const currentMax = (max?.m as number | null | undefined) ?? null;
        const nextOrder = currentMax === null ? 0 : currentMax + 1;

        const notes = input.notes !== undefined ? input.notes.trim() : null;

        await this.db.insertInto('program_exercise').values({
            program_id: programId,
            exercise_id: exerciseId,
            sort_order: nextOrder,
            notes: notes && notes.length > 0 ? notes : null,
        }).execute();
    }

    /**
     * Rewrite the full ordering of Exercises in a Program. `orderedExerciseIds`
     * must exactly match the current set of attached exercise ids (no missing,
     * no extra) — otherwise a validation error is thrown (the request is
     * malformed, not unauthorized). Cross-teacher Program → NotFoundError.
     */
    async reorderExercises(
        teacherId: string,
        programId: string,
        orderedExerciseIds: string[],
    ): Promise<void> {
        const program = await this.db
            .selectFrom('programs')
            .select(['id', 'teacher_id'])
            .where('id', '=', programId)
            .executeTakeFirst();
        if (!program || program.teacher_id !== teacherId) {
            throw new NotFoundError('Program not found');
        }

        const current = await this.db
            .selectFrom('program_exercise')
            .select('exercise_id')
            .where('program_id', '=', programId)
            .execute();
        const currentSet = new Set(current.map((r) => r.exercise_id));
        const suppliedSet = new Set(orderedExerciseIds);
        if (
            orderedExerciseIds.length !== currentSet.size ||
            suppliedSet.size !== orderedExerciseIds.length ||
            [...suppliedSet].some((id) => !currentSet.has(id))
        ) {
            throw new Error('Supplied exerciseIds do not match the Program');
        }

        await this.db.transaction().execute(async (tx) => {
            for (let i = 0; i < orderedExerciseIds.length; i++) {
                await tx.updateTable('program_exercise')
                    .set({ sort_order: i })
                    .where('program_id', '=', programId)
                    .where('exercise_id', '=', orderedExerciseIds[i])
                    .execute();
            }
        });
    }

    /**
     * Rewrite one row's instructional note (IA §3.6 detail step 3).
     *
     * The note was write-once until now: `addExercise` took it and nothing
     * edited it, so the builder rendered it read-only and a typo could only be
     * corrected by removing the row and adding it back — which loses both the
     * note and the row's position. This closes that.
     *
     * The note lives on the junction, not the Exercise: it is what THIS Program
     * says about the exercise, and two Programs may say different things about
     * the same one.
     *
     * Blank (or whitespace-only) clears it back to null, matching `addExercise`
     * — there is no distinction between "no note" and "an empty note", and
     * storing `''` would make the row render an empty note block forever.
     *
     * A missing junction row is NotFoundError rather than a silent no-op: unlike
     * `removeExercise`, an edit that lands nowhere has no idempotent reading —
     * the caller believes they saved text and nothing holds it.
     */
    async updateExerciseNotes(
        teacherId: string,
        programId: string,
        exerciseId: string,
        notes: string | null,
    ): Promise<void> {
        const program = await this.db
            .selectFrom('programs')
            .select(['id', 'teacher_id'])
            .where('id', '=', programId)
            .executeTakeFirst();
        if (!program || program.teacher_id !== teacherId) {
            throw new NotFoundError('Program not found');
        }
        const row = await this.db
            .selectFrom('program_exercise')
            .select('exercise_id')
            .where('program_id', '=', programId)
            .where('exercise_id', '=', exerciseId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Exercise not found in this Program');

        const trimmed = notes === null ? null : notes.trim();
        await this.db.updateTable('program_exercise')
            .set({ notes: trimmed && trimmed.length > 0 ? trimmed : null })
            .where('program_id', '=', programId)
            .where('exercise_id', '=', exerciseId)
            .execute();
    }

    /**
     * Remove an Exercise from a Program. Idempotent: silently no-ops if the
     * junction row doesn't exist (mirrors LessonService.removeExercise).
     * Cross-teacher Program → NotFoundError.
     */
    async removeExercise(
        teacherId: string,
        programId: string,
        exerciseId: string,
    ): Promise<void> {
        const program = await this.db
            .selectFrom('programs')
            .select(['id', 'teacher_id'])
            .where('id', '=', programId)
            .executeTakeFirst();
        if (!program || program.teacher_id !== teacherId) {
            throw new NotFoundError('Program not found');
        }
        await this.db.deleteFrom('program_exercise')
            .where('program_id', '=', programId)
            .where('exercise_id', '=', exerciseId)
            .execute();
    }

    /**
     * Read the ordered list of Exercises attached to a Program. NotFoundError
     * when the Program isn't owned by `teacherId`.
     */
    async listExercises(teacherId: string, programId: string): Promise<ProgramExerciseRef[]> {
        const program = await this.db
            .selectFrom('programs')
            .select(['id', 'teacher_id'])
            .where('id', '=', programId)
            .executeTakeFirst();
        if (!program || program.teacher_id !== teacherId) {
            throw new NotFoundError('Program not found');
        }
        const rows = await this.db
            .selectFrom('program_exercise')
            .innerJoin('exercises', 'exercises.id', 'program_exercise.exercise_id')
            .select([
                'exercises.id as id',
                'exercises.name as name',
                'exercises.description as description',
                'program_exercise.sort_order as sort_order',
                'program_exercise.notes as notes',
                'exercises.archived_at as archived_at',
            ])
            .where('program_exercise.program_id', '=', programId)
            .orderBy('program_exercise.sort_order', 'asc')
            .execute();
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            sortOrder: r.sort_order,
            notes: r.notes,
            archivedAt: r.archived_at,
        }));
    }
}
