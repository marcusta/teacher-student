import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('lessons')
        .addColumn('program_id', 'text', (col) =>
            col.references('programs.id').onDelete('set null'),
        )
        .execute();

    await db.schema
        .createIndex('lessons_program_idx')
        .on('lessons')
        .column('program_id')
        .execute();
}
