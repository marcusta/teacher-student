import { type Kysely, sql } from 'kysely';

/**
 * Recreate `lesson_exercise` to add a surrogate `id` (required by SCOPE for
 * `note.parent_kind='lesson_exercise'`) and a nullable `source_program_id`
 * recording which Program — if any — an Exercise instance was snapshot-copied
 * from. The composite `(lesson_id, exercise_id)` stays unique so the same
 * Exercise still appears at most once per Lesson.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TABLE lesson_exercise_new (
            id TEXT PRIMARY KEY,
            lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL,
            notes TEXT,
            source_program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (lesson_id, exercise_id)
        )
    `.execute(db);

    // Backfill surrogate ids for existing rows. SQLite's randomblob+hex gives
    // us 32-char hex strings — collision-free for our scale.
    await sql`
        INSERT INTO lesson_exercise_new (id, lesson_id, exercise_id, sort_order, notes, source_program_id, created_at)
        SELECT lower(hex(randomblob(16))), lesson_id, exercise_id, sort_order, notes, NULL, created_at
        FROM lesson_exercise
    `.execute(db);

    await sql`DROP TABLE lesson_exercise`.execute(db);
    await sql`ALTER TABLE lesson_exercise_new RENAME TO lesson_exercise`.execute(db);

    await db.schema
        .createIndex('lesson_exercise_lesson_idx')
        .on('lesson_exercise')
        .columns(['lesson_id', 'sort_order'])
        .execute();

    await db.schema
        .createIndex('lesson_exercise_source_program_idx')
        .on('lesson_exercise')
        .column('source_program_id')
        .execute();
}
