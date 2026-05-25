import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('lesson_exercise')
        .addColumn('lesson_id', 'text', (col) =>
            col.notNull().references('lessons.id').onDelete('cascade'),
        )
        .addColumn('exercise_id', 'text', (col) =>
            col.notNull().references('exercises.id').onDelete('cascade'),
        )
        .addColumn('sort_order', 'integer', (col) => col.notNull())
        .addColumn('notes', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('lesson_exercise_pk', ['lesson_id', 'exercise_id'])
        .execute();

    await db.schema
        .createIndex('lesson_exercise_lesson_idx')
        .on('lesson_exercise')
        .columns(['lesson_id', 'sort_order'])
        .execute();
}
