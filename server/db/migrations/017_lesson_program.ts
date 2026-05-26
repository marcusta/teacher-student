import { type Kysely, sql } from 'kysely';

/**
 * Many-to-many between Lessons and Programs. A Lesson can have N attached
 * Programs (multi-program support); a Program can be reused across N Lessons.
 * Snapshot exercises live in `lesson_exercise.source_program_id`; this table
 * is the durable list of "Programs this Lesson is sourced from".
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('lesson_program')
        .addColumn('lesson_id', 'text', (col) =>
            col.notNull().references('lessons.id').onDelete('cascade'),
        )
        .addColumn('program_id', 'text', (col) =>
            col.notNull().references('programs.id').onDelete('cascade'),
        )
        .addColumn('attached_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('lesson_program_pk', ['lesson_id', 'program_id'])
        .execute();

    await db.schema
        .createIndex('lesson_program_program_idx')
        .on('lesson_program')
        .column('program_id')
        .execute();
}
