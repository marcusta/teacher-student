import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('notes')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('author_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('parent_kind', 'text', (col) => col.notNull())
        .addColumn('parent_id', 'text', (col) => col.notNull())
        .addColumn('body', 'text', (col) => col.notNull())
        .addColumn('visibility', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('notes_parent_idx')
        .on('notes')
        .columns(['parent_kind', 'parent_id'])
        .execute();
}
