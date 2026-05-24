import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, ExercisesTable } from '../db/schema';

export interface Exercise {
    id: string;
    teacherId: string;
    name: string;
    description: string;
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
            created_at: now,
            updated_at: now,
        }).execute();

        return { id, teacherId, name, description, createdAt: now, updatedAt: now };
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

    async delete(teacherId: string, exerciseId: string): Promise<void> {
        const rows = await this.db
            .deleteFrom('exercises')
            .where('id', '=', exerciseId)
            .where('teacher_id', '=', teacherId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Exercise not found');
    }

    async listForTeacher(teacherId: string): Promise<Exercise[]> {
        const rows = await this.db
            .selectFrom('exercises')
            .selectAll()
            .where('teacher_id', '=', teacherId)
            .orderBy('created_at', 'desc')
            .execute();
        return rows.map(toExercise);
    }
}
