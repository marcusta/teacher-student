import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('goal')
        .addColumn('horse_id', 'text', (col) =>
            col.references('horses.id').onDelete('set null'),
        )
        .execute();
    await db.schema
        .createIndex('goal_horse_id_idx')
        .on('goal')
        .column('horse_id')
        .execute();
}
