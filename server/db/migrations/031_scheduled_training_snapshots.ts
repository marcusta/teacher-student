import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await sql`ALTER TABLE training_session_exercise ADD COLUMN snapshot_name TEXT`.execute(db);
    await sql`ALTER TABLE training_session_exercise ADD COLUMN snapshot_description TEXT`.execute(db);
    await sql`ALTER TABLE training_session_program ADD COLUMN snapshot_title TEXT`.execute(db);
}
