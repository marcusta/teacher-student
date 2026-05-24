import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('relations')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('teacher_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('student_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('invitation_id', 'text', (col) =>
            col.notNull().references('invitations.id'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addUniqueConstraint('relations_teacher_student_unique', ['teacher_id', 'student_id'])
        .execute();

    await db.schema
        .createIndex('relations_teacher_idx')
        .on('relations')
        .column('teacher_id')
        .execute();

    await db.schema
        .createIndex('relations_student_idx')
        .on('relations')
        .column('student_id')
        .execute();
}
