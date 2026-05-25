import { type Kysely, sql } from 'kysely';

/**
 * A Student picks which connected Teachers each Training Session is shared
 * with. No row in `training_session_share` for a given session = private to
 * the Student.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('training_session_share')
        .addColumn('training_session_id', 'text', (col) =>
            col.notNull().references('training_sessions.id').onDelete('cascade'),
        )
        .addColumn('teacher_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('training_session_share_pk',
            ['training_session_id', 'teacher_id'])
        .execute();

    await db.schema
        .createIndex('training_session_share_teacher_idx')
        .on('training_session_share')
        .columns(['teacher_id'])
        .execute();
}
