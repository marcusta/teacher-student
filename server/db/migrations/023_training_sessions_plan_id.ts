import { type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('training_sessions')
        .addColumn('plan_id', 'text', (col) =>
            col.references('plans.id').onDelete('set null'),
        )
        .execute();

    await db.schema
        .createIndex('training_sessions_plan_id_idx')
        .on('training_sessions')
        .column('plan_id')
        .execute();
}
