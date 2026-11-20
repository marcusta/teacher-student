import { Database } from 'bun:sqlite';
import { readdir } from 'node:fs/promises';
import * as path from 'node:path';
import type { Database as AppDatabase } from '../server/db/schema';
import { deploymentDbPath } from './db-path';

// Check runtime columns as well as migration history; SELECT 1 accepts an empty DB.
const requiredColumns: { [Table in keyof AppDatabase]: readonly (keyof AppDatabase[Table])[] } = {
    users: ['id', 'email', 'display_name', 'password_hash'],
    invitations: ['id', 'teacher_id', 'invitee_email', 'status'],
    relations: ['id', 'teacher_id', 'student_id'],
    exercises: ['id', 'teacher_id', 'name', 'archived_at'],
    horses: ['id', 'student_id', 'name', 'archived_at'],
    plans: ['id', 'student_id', 'primary_teacher_id', 'status'],
    goal: ['id', 'student_id', 'status', 'horse_id'],
    goal_share: ['goal_id', 'teacher_id'],
    goal_plan: ['goal_id', 'plan_id'],
    lessons: ['id', 'teacher_id', 'student_id', 'horse_id', 'plan_id', 'status'],
    lesson_exercise: ['id', 'lesson_id', 'exercise_id', 'source_program_id'],
    lesson_program: ['lesson_id', 'program_id'],
    notes: ['id', 'author_id', 'parent_kind', 'parent_id', 'visibility'],
    training_sessions: ['id', 'student_id', 'horse_id', 'plan_id', 'performed_at'],
    training_session_share: ['training_session_id', 'teacher_id'],
    training_session_exercise: ['id', 'training_session_id', 'snapshot_name', 'snapshot_description'],
    training_session_program: ['training_session_id', 'program_id', 'snapshot_title'],
    programs: ['id', 'teacher_id', 'title', 'archived_at'],
    program_exercise: ['program_id', 'exercise_id', 'sort_order', 'notes'],
    stables: ['id', 'name', 'time_zone', 'created_by'],
    stable_members: ['stable_id', 'user_id', 'role', 'ended_at'],
    stable_horses: ['stable_id', 'horse_id', 'approved_by', 'ended_at'],
    stable_invitations: ['id', 'stable_id', 'invitee_email', 'status', 'expires_at'],
    stable_activity_types: ['id', 'stable_id', 'category', 'scope', 'archived_at'],
    stable_activities: ['id', 'stable_id', 'horse_id', 'scheduled_date', 'status', 'version', 'training_session_id'],
    stable_activity_assignees: ['activity_id', 'user_id'],
    stable_activity_performers: ['activity_id', 'user_id'],
    stable_activity_programs: ['activity_id', 'program_id', 'title'],
    stable_activity_exercises: ['id', 'activity_id', 'exercise_id', 'name', 'description', 'sort_order'],
    schedule_templates: ['id', 'stable_id', 'name', 'created_by', 'kind', 'is_default'],
    schedule_template_items: ['id', 'template_id', 'weekday', 'type_id', 'horse_id', 'content_json'],
    schedule_template_assignees: ['item_id', 'user_id'],
    schedule_days: ['stable_id', 'date'],
    schedule_operations: ['stable_id', 'request_id', 'actor_id', 'fingerprint', 'result_json'],
};

try {
    const file = deploymentDbPath(); // Validate only the supplied DB_PATH snapshot.
    const migrationNames = (await readdir(path.join(import.meta.dir, '../server/db/migrations')))
        .filter(name => name.endsWith('.ts')).map(name => name.slice(0, -3)).sort();
    const db = new Database(file, { readonly: true });
    try {
        const tables = new Set(db.query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(t => t.name));
        if (!tables.has('kysely_migration')) throw new Error('Missing migration history table kysely_migration');
        const applied = new Set(db.query<{ name: string }, []>('SELECT name FROM kysely_migration').all().map(m => m.name));
        const pending = migrationNames.filter(name => !applied.has(name));
        if (pending.length) throw new Error(`Pending migrations: ${pending.join(', ')}`);
        const unknown = [...applied].filter(name => !migrationNames.includes(name));
        if (unknown.length) throw new Error(`Unknown applied migrations: ${unknown.join(', ')}`);

        for (const [table, required] of Object.entries(requiredColumns)) {
            if (!tables.has(table)) throw new Error(`Missing table ${table}`);
            const columns = new Set(db.query<{ name: string }, []>(`PRAGMA table_info("${table}")`).all().map(c => c.name));
            const missing = required.filter(column => !columns.has(column));
            if (missing.length) throw new Error(`Missing columns in ${table}: ${missing.join(', ')}`);
        }

        const integrity = db.query<{ integrity_check: string }, []>('PRAGMA integrity_check').all();
        if (integrity.length !== 1 || integrity[0]!.integrity_check !== 'ok') throw new Error('SQLite integrity check failed');
        const foreignKeys = db.query('PRAGMA foreign_key_check').all();
        if (foreignKeys.length) throw new Error(`SQLite foreign key check failed (${foreignKeys.length} violations)`);
        console.log(`Database validation passed for ${file} (${migrationNames.length} migrations)`);
    } finally { db.close(); }
} catch (error) {
    console.error(`Database validation failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
}
