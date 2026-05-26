import { type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('lessons')
        .addColumn('plan_id', 'text', (col) =>
            col.references('plans.id').onDelete('set null'),
        )
        .execute();

    await db.schema
        .createIndex('lessons_plan_id_idx')
        .on('lessons')
        .column('plan_id')
        .execute();
}
