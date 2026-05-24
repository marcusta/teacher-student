import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('users')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('email', 'text', (col) => col.notNull().unique())
        .addColumn('display_name', 'text', (col) => col.notNull())
        .addColumn('password_hash', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();
}
