import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
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

export interface UpdateHorseInput {
    name?: string;
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

    async getForStudent(studentId: string, horseId: string): Promise<Horse | null> {
        const row = await this.db
            .selectFrom('horses')
            .selectAll()
            .where('id', '=', horseId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        return row ? toHorse(row) : null;
    }

    async update(studentId: string, horseId: string, input: UpdateHorseInput): Promise<Horse> {
        const patch: Partial<{ name: string; updated_at: string }> = {};
        if (input.name !== undefined) {
            const name = input.name.trim();
            if (name.length === 0) throw new Error('Horse name must not be empty');
            patch.name = name;
        }
        patch.updated_at = new Date().toISOString();

        const rows = await this.db
            .updateTable('horses')
            .set(patch)
            .where('id', '=', horseId)
            .where('student_id', '=', studentId)
            .returning('id')
            .execute();
        if (rows.length === 0) throw new NotFoundError('Horse not found');

        const updated = await this.getForStudent(studentId, horseId);
        if (!updated) throw new NotFoundError('Horse not found');
        return updated;
    }

    /**
     * Archive a Horse (soft-delete). Idempotent: archiving an already-archived
     * horse is a no-op success. Throws `NotFoundError` if the horse does not
     * exist or belongs to a different student (leak-safe).
     */
    async archive(studentId: string, horseId: string): Promise<void> {
        const row = await this.db
            .selectFrom('horses')
            .select(['archived_at'])
            .where('id', '=', horseId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Horse not found');
        if (row.archived_at !== null) return; // idempotent

        await this.db
            .updateTable('horses')
            .set({ archived_at: new Date().toISOString() })
            .where('id', '=', horseId)
            .where('student_id', '=', studentId)
            .execute();
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

    /**
     * Read-only view of a connected Student's stable for a Teacher. Requires
     * an existing `Relation(teacher_id, student_id)`; otherwise throws
     * `NotFoundError` (leak-safe — same response whether the relation is
     * missing or the student doesn't exist).
     */
    async listForStudentAsTeacher(teacherId: string, studentId: string): Promise<Horse[]> {
        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Student not found');

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
