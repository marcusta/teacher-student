import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, ExercisesTable } from '../db/schema';

export interface Exercise {
    id: string;
    teacherId: string;
    name: string;
    description: string;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExerciseInput {
    name: string;
    description?: string;
}

export interface UpdateExerciseInput {
    name?: string;
    description?: string;
}

function toExercise(row: Selectable<ExercisesTable>): Exercise {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        name: row.name,
        description: row.description,
        archivedAt: row.archived_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Owns a Teacher's private Library of Exercises. Deep module: callers
 * pass `(teacherId, ...)`; all ownership checks, trimming, timestamp
 * management and DB shape mapping live here.
 */
export class ExerciseService {
    constructor(private db: Kysely<Database>) {}

    async create(teacherId: string, input: CreateExerciseInput): Promise<Exercise> {
        const name = input.name.trim();
        if (name.length === 0) throw new Error('Exercise name must not be empty');
        const description = (input.description ?? '').trim();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insertInto('exercises').values({
            id,
            teacher_id: teacherId,
            name,
            description,
            archived_at: null,
            created_at: now,
            updated_at: now,
        }).execute();

        return { id, teacherId, name, description, archivedAt: null, createdAt: now, updatedAt: now };
    }

    async getForTeacher(teacherId: string, exerciseId: string): Promise<Exercise | null> {
        const row = await this.db
            .selectFrom('exercises')
            .selectAll()
            .where('id', '=', exerciseId)
            .where('teacher_id', '=', teacherId)
            .executeTakeFirst();
        return row ? toExercise(row) : null;
    }

    async update(teacherId: string, exerciseId: string, input: UpdateExerciseInput): Promise<Exercise> {
        const patch: Partial<{ name: string; description: string; updated_at: string }> = {};
        if (input.name !== undefined) {
            const name = input.name.trim();
            if (name.length === 0) throw new Error('Exercise name must not be empty');
            patch.name = name;
        }
        if (input.description !== undefined) {
            patch.description = input.description.trim();
        }
        patch.updated_at = new Date().toISOString();

        const rows = await this.db
            .updateTable('exercises')
            .set(patch)
            .where('id', '=', exerciseId)
            .where('teacher_id', '=', teacherId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Exercise not found');

        const updated = await this.getForTeacher(teacherId, exerciseId);
        if (!updated) throw new NotFoundError('Exercise not found');
        return updated;
    }

    /**
     * Archive an Exercise (soft-delete). Idempotent: archiving an
     * already-archived exercise is a no-op success. Throws `NotFoundError`
     * if the exercise does not exist or belongs to a different teacher
     * (leak-safe).
     *
     * Deliberately not a hard delete: `lesson_exercise` /
     * `training_session_exercise` junction rows carry the teacher's per-row
     * `notes` and are the historical record of what was actually ridden. A
     * cascade would destroy them, and would additionally strand rows in
     * `notes` (which has no FK on `parent_id`) as unreachable orphans.
     */
    async archive(teacherId: string, exerciseId: string): Promise<void> {
        const row = await this.db
            .selectFrom('exercises')
            .select(['archived_at'])
            .where('id', '=', exerciseId)
            .where('teacher_id', '=', teacherId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Exercise not found');
        if (row.archived_at !== null) return; // idempotent

        await this.db
            .updateTable('exercises')
            .set({ archived_at: new Date().toISOString() })
            .where('id', '=', exerciseId)
            .where('teacher_id', '=', teacherId)
            .execute();
    }

    async listForTeacher(teacherId: string): Promise<Exercise[]> {
        const rows = await this.db
            .selectFrom('exercises')
            .selectAll()
            .where('teacher_id', '=', teacherId)
            .where('archived_at', 'is', null)
            .orderBy('created_at', 'desc')
            .execute();
        return rows.map(toExercise);
    }

    /**
     * Student-visible Exercise catalog: all Exercises owned by Teachers in an
     * active Relation with the student. Powers the Training Session picker.
     * Empty when no Relations; NotFoundError only when the student id is invalid.
     */
    async listForStudent(studentId: string): Promise<Exercise[]> {
        const user = await this.db
            .selectFrom('users')
            .select('id')
            .where('id', '=', studentId)
            .executeTakeFirst();
        if (!user) throw new NotFoundError('Student not found');

        const rows = await this.db
            .selectFrom('exercises')
            .innerJoin('relations', 'relations.teacher_id', 'exercises.teacher_id')
            .selectAll('exercises')
            .where('relations.student_id', '=', studentId)
            .where('exercises.archived_at', 'is', null)
            .orderBy('exercises.name', 'asc')
            .execute();
        return rows.map(toExercise);
    }
}
