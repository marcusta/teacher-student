import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('training_sessions')
        .addColumn('horse_id', 'text', (col) =>
            col.references('horses.id').onDelete('set null'),
        )
        .execute();
    await db.schema
        .createIndex('training_sessions_horse_id_idx')
        .on('training_sessions')
        .column('horse_id')
        .execute();
}
