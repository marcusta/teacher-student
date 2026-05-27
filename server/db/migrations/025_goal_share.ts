import { type Kysely, sql } from 'kysely';

/**
 * A Student picks which connected Teachers each Goal is shared with.
 * No row in `goal_share` = visible only to the owning Student.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('goal_share')
        .addColumn('goal_id', 'text', (col) =>
            col.notNull().references('goal.id').onDelete('cascade'),
        )
        .addColumn('teacher_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('goal_share_pk', ['goal_id', 'teacher_id'])
        .execute();

    await db.schema
        .createIndex('goal_share_teacher_idx')
        .on('goal_share')
        .column('teacher_id')
        .execute();
}
