import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('goal')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('student_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('description', 'text')
        .addColumn('target_date', 'text')
        .addColumn('achieved_at', 'text')
        .addColumn('status', 'text', (col) =>
            col.notNull().defaultTo('active')
                .check(sql`status IN ('active', 'achieved', 'abandoned')`),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('goal_student_status_idx')
        .on('goal')
        .columns(['student_id', 'status'])
        .execute();
}
