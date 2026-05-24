import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('lessons')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('teacher_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('student_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('scheduled_at', 'text', (col) => col.notNull())
        .addColumn('status', 'text', (col) => col.notNull().defaultTo('planned'))
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('updated_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('lessons_teacher_idx')
        .on('lessons')
        .columns(['teacher_id', 'scheduled_at'])
        .execute();

    await db.schema
        .createIndex('lessons_student_idx')
        .on('lessons')
        .columns(['student_id', 'scheduled_at'])
        .execute();
}
