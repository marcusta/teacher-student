import type { Kysely, Selectable } from 'kysely';
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
