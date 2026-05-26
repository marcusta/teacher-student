import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, ProgramsTable } from '../db/schema';

export interface Program {
    id: string;
    teacherId: string;
    title: string;
    description: string;
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
            created_at: now,
        }).execute();

        return { id, teacherId, title, description, createdAt: now };
    }

    async listForTeacher(teacherId: string): Promise<Program[]> {
        const rows = await this.db
            .selectFrom('programs')
            .selectAll()
            .where('teacher_id', '=', teacherId)
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

    async delete(teacherId: string, programId: string): Promise<void> {
        const rows = await this.db
            .deleteFrom('programs')
            .where('id', '=', programId)
            .where('teacher_id', '=', teacherId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Program not found');
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
            .select(['id', 'teacher_id'])
            .where('id', '=', exerciseId)
            .executeTakeFirst();
        if (!exercise || exercise.teacher_id !== teacherId) {
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
        }));
    }
}
