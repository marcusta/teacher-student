import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('program_exercise')
        .addColumn('program_id', 'text', (col) =>
            col.notNull().references('programs.id').onDelete('cascade'),
        )
        .addColumn('exercise_id', 'text', (col) =>
            col.notNull().references('exercises.id').onDelete('cascade'),
        )
        .addColumn('sort_order', 'integer', (col) => col.notNull())
        .addColumn('notes', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('program_exercise_pk', ['program_id', 'exercise_id'])
        .execute();

    await db.schema
        .createIndex('program_exercise_program_idx')
        .on('program_exercise')
        .column('program_id')
        .execute();
}
