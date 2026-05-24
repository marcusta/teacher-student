import type { Kysely, Selectable } from 'kysely';
import type { Database, HorsesTable } from '../db/schema';

export interface Horse {
    id: string;
    studentId: string;
    name: string;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHorseInput {
    name: string;
}

function toHorse(row: Selectable<HorsesTable>): Horse {
    return {
        id: row.id,
        studentId: row.student_id,
        name: row.name,
        archivedAt: row.archived_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Owns a Student's stable of Horses. Deep module: callers pass
 * `(studentId, ...)`; all ownership checks, trimming, timestamp management
 * and archived-state filtering live here.
 */
export class HorseService {
    constructor(private db: Kysely<Database>) {}

    async create(studentId: string, input: CreateHorseInput): Promise<Horse> {
        const name = input.name.trim();
        if (name.length === 0) throw new Error('Horse name must not be empty');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insertInto('horses').values({
            id,
            student_id: studentId,
            name,
            archived_at: null,
            created_at: now,
            updated_at: now,
        }).execute();

        return { id, studentId, name, archivedAt: null, createdAt: now, updatedAt: now };
    }

    async listForStudent(studentId: string): Promise<Horse[]> {
        const rows = await this.db
            .selectFrom('horses')
            .selectAll()
            .where('student_id', '=', studentId)
            .where('archived_at', 'is', null)
            .orderBy('created_at', 'desc')
            .execute();
        return rows.map(toHorse);
    }
}
