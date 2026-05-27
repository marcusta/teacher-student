import { type Kysely, sql } from 'kysely';

/**
 * Many-to-many Plan–Goal Link junction. Both rows must be owned by the same
 * Student; the service enforces that invariant.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('goal_plan')
        .addColumn('goal_id', 'text', (col) =>
            col.notNull().references('goal.id').onDelete('cascade'),
        )
        .addColumn('plan_id', 'text', (col) =>
            col.notNull().references('plans.id').onDelete('cascade'),
        )
        .addColumn('attached_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addPrimaryKeyConstraint('goal_plan_pk', ['goal_id', 'plan_id'])
        .execute();

    await db.schema
        .createIndex('goal_plan_plan_idx')
        .on('goal_plan')
        .column('plan_id')
        .execute();
}
