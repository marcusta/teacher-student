import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('invitations')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('teacher_id', 'text', (col) =>
            col.notNull().references('users.id').onDelete('cascade'),
        )
        .addColumn('invitee_email', 'text', (col) => col.notNull())
        .addColumn('status', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('expires_at', 'text', (col) => col.notNull())
        .addColumn('accepted_at', 'text')
        .execute();

    // Partial unique index: at most one pending invitation per (teacher, email).
    await sql`
        CREATE UNIQUE INDEX invitations_pending_unique
        ON invitations (teacher_id, invitee_email)
        WHERE status = 'pending'
    `.execute(db);

    await db.schema
        .createIndex('invitations_teacher_idx')
        .on('invitations')
        .column('teacher_id')
        .execute();

    await db.schema
        .createIndex('invitations_invitee_idx')
        .on('invitations')
        .column('invitee_email')
        .execute();
}
