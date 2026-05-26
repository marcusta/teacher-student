import { type Kysely, sql } from 'kysely';

/**
 * Many-to-many between Training Sessions and Programs. Snapshot exercises
 * live in `training_session_exercise.source_program_id`; this table is the
 * durable list of Programs attached to a session.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('training_session_program')
        .addColumn('training_session_id', 'text', (col) =>
            col.notNull().references('training_sessions.id').onDelete('cascade'),
        )
        .addColumn('program_id', 'text', (col) =>
            col.notNull().references('programs.id').onDelete('cascade'),
        )
        .addColumn('attached_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('training_session_program_pk', [
            'training_session_id',
            'program_id',
        ])
        .execute();

    await db.schema
        .createIndex('training_session_program_program_idx')
        .on('training_session_program')
        .column('program_id')
        .execute();
}
