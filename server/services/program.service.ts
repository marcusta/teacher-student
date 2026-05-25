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
}
