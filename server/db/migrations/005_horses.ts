import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('horses')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('student_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('archived_at', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('horses_student_idx')
        .on('horses')
        .column('student_id')
        .execute();
}
