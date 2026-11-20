import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await sql`ALTER TABLE schedule_templates ADD COLUMN kind TEXT NOT NULL DEFAULT 'week' CHECK(kind IN ('day', 'week'))`.execute(db);
    await sql`ALTER TABLE schedule_templates ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default = 0 OR (is_default = 1 AND kind = 'day'))`.execute(db);
    await sql`CREATE UNIQUE INDEX schedule_templates_one_default ON schedule_templates(stable_id) WHERE is_default = 1`.execute(db);
    await sql`
        CREATE TABLE schedule_days (
            stable_id TEXT NOT NULL REFERENCES stables(id),
            date TEXT NOT NULL,
            PRIMARY KEY (stable_id, date)
        )
    `.execute(db);
}
