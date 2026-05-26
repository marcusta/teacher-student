import { type Kysely, sql } from 'kysely';

/**
 * Ordered Exercise links on a Training Session. Mirrors `lesson_exercise`:
 * surrogate `id`, nullable `notes` (row notes), nullable `source_program_id`
 * (filled when snapshot-copied from a Program in slice 034).
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('training_session_exercise')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('training_session_id', 'text', (col) =>
            col.notNull().references('training_sessions.id').onDelete('cascade'),
        )
        .addColumn('exercise_id', 'text', (col) =>
            col.notNull().references('exercises.id').onDelete('cascade'),
        )
        .addColumn('sort_order', 'integer', (col) => col.notNull())
        .addColumn('notes', 'text')
        .addColumn('source_program_id', 'text', (col) =>
            col.references('programs.id').onDelete('set null'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addUniqueConstraint('training_session_exercise_ts_ex_unique', [
            'training_session_id',
            'exercise_id',
        ])
        .execute();

    await db.schema
        .createIndex('training_session_exercise_ts_idx')
        .on('training_session_exercise')
        .columns(['training_session_id', 'sort_order'])
        .execute();

    await db.schema
        .createIndex('training_session_exercise_source_program_idx')
        .on('training_session_exercise')
        .column('source_program_id')
        .execute();
}
