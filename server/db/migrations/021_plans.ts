import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('plans')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('student_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('primary_teacher_id', 'text', (col) =>
            col.references('users.id').onDelete('set null'),
        )
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('description', 'text')
        .addColumn('start_date', 'text')
        .addColumn('end_date', 'text')
        .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('plans_student_status_idx')
        .on('plans')
        .columns(['student_id', 'status'])
        .execute();

    await db.schema
        .createIndex('plans_primary_teacher_idx')
        .on('plans')
        .column('primary_teacher_id')
        .execute();
}
