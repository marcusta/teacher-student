import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';

export interface Student {
    id: string;
    email: string;
    displayName: string;
}

/**
 * Owns queries over the (teacher, student) graph established by accepted
 * Invitations. Deep module: callers ask "which Students does this Teacher
 * have?" and "may this Teacher see this Student?" — the joins, sort and
 * 404-on-no-relation policy live here, not in route handlers.
 */
export class RelationService {
    constructor(private db: Kysely<Database>) {}

    async listStudentsForTeacher(teacherId: string): Promise<Student[]> {
        const rows = await this.db
            .selectFrom('relations')
            .innerJoin('users', 'users.id', 'relations.student_id')
            .where('relations.teacher_id', '=', teacherId)
            .select(['users.id', 'users.email', 'users.display_name'])
            .orderBy('users.display_name', 'asc')
            .execute();
        return rows.map((r) => ({ id: r.id, email: r.email, displayName: r.display_name }));
    }

    async getStudentForTeacher(teacherId: string, studentId: string): Promise<Student | null> {
        const row = await this.db
            .selectFrom('relations')
            .innerJoin('users', 'users.id', 'relations.student_id')
            .where('relations.teacher_id', '=', teacherId)
            .where('relations.student_id', '=', studentId)
            .select(['users.id', 'users.email', 'users.display_name'])
            .executeTakeFirst();
        return row ? { id: row.id, email: row.email, displayName: row.display_name } : null;
    }
}
