import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('exercises')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('teacher_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('description', 'text', (col) => col.notNull().defaultTo(''))
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('exercises_teacher_idx')
        .on('exercises')
        .column('teacher_id')
        .execute();
}
