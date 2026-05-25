import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('training_sessions')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('student_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('performed_at', 'text', (col) => col.notNull())
        .addColumn('duration_min', 'integer')
        .addColumn('summary', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('training_sessions_student_idx')
        .on('training_sessions')
        .columns(['student_id', 'performed_at'])
        .execute();
}
