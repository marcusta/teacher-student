import { type Kysely, sql } from 'kysely';

/**
 * Replace the scalar `lessons.program_id` (slice 028) with the
 * `lesson_program` junction (slice 030). Existing rows with a non-null
 * program_id become a junction row, then the column is dropped via the
 * SQLite recreate-table dance.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        INSERT INTO lesson_program (lesson_id, program_id, attached_at)
        SELECT id, program_id, created_at FROM lessons WHERE program_id IS NOT NULL
    `.execute(db);

    await sql`
        CREATE TABLE lessons_new (
            id TEXT PRIMARY KEY,
            teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            scheduled_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'planned',
            horse_id TEXT REFERENCES horses(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `.execute(db);

    await sql`
        INSERT INTO lessons_new (id, teacher_id, student_id, scheduled_at, status, horse_id, created_at, updated_at)
        SELECT id, teacher_id, student_id, scheduled_at, status, horse_id, created_at, updated_at FROM lessons
    `.execute(db);

    await sql`DROP TABLE lessons`.execute(db);
    await sql`ALTER TABLE lessons_new RENAME TO lessons`.execute(db);

    await db.schema
        .createIndex('lessons_teacher_idx')
        .on('lessons')
        .columns(['teacher_id', 'scheduled_at'])
        .execute();

    await db.schema
        .createIndex('lessons_student_idx')
        .on('lessons')
        .columns(['student_id', 'scheduled_at'])
        .execute();
}
