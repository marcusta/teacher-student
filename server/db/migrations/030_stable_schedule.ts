import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    const statements = [
        `CREATE TABLE stables (id TEXT PRIMARY KEY, name TEXT NOT NULL, time_zone TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
        `CREATE TABLE stable_members (stable_id TEXT NOT NULL REFERENCES stables(id), user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL CHECK(role IN ('admin','member')), joined_at TEXT NOT NULL, ended_at TEXT, PRIMARY KEY(stable_id,user_id))`,
        `CREATE INDEX stable_members_user_idx ON stable_members(user_id,ended_at)`,
        `CREATE TABLE stable_invitations (id TEXT PRIMARY KEY, stable_id TEXT NOT NULL REFERENCES stables(id), invitee_email TEXT NOT NULL, invited_by TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL CHECK(status IN ('pending','accepted','declined','revoked')), expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`,
        `CREATE UNIQUE INDEX stable_invitation_pending_idx ON stable_invitations(stable_id,invitee_email) WHERE status='pending'`,
        `CREATE INDEX stable_invitations_inbox_idx ON stable_invitations(invitee_email,status)`,
        `CREATE TABLE stable_horses (stable_id TEXT NOT NULL REFERENCES stables(id), horse_id TEXT NOT NULL REFERENCES horses(id), approved_by TEXT NOT NULL REFERENCES users(id), joined_at TEXT NOT NULL, ended_at TEXT, PRIMARY KEY(stable_id,horse_id))`,
        `CREATE TABLE stable_activity_types (id TEXT PRIMARY KEY, stable_id TEXT NOT NULL REFERENCES stables(id), code TEXT, name TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('routine','care','training','visit','other')), scope TEXT NOT NULL CHECK(scope IN ('stable','horse','any')), default_time TEXT, sort_order INTEGER NOT NULL, archived_at TEXT, UNIQUE(stable_id,code))`,
        `CREATE TABLE stable_activities (id TEXT PRIMARY KEY, stable_id TEXT NOT NULL REFERENCES stables(id), type_id TEXT NOT NULL REFERENCES stable_activity_types(id), horse_id TEXT REFERENCES horses(id), title TEXT NOT NULL, scheduled_date TEXT NOT NULL, scheduled_time TEXT, scheduled_offset_min INTEGER, instruction TEXT NOT NULL DEFAULT '', status TEXT NOT NULL CHECK(status IN ('planned','completed','cancelled')), result_note TEXT NOT NULL DEFAULT '', performed_at TEXT, completed_at TEXT, completed_by TEXT REFERENCES users(id), created_by TEXT NOT NULL REFERENCES users(id), updated_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, training_student_id TEXT REFERENCES users(id), training_session_id TEXT UNIQUE REFERENCES training_sessions(id) ON DELETE SET NULL)`,
        `CREATE INDEX stable_activities_week_idx ON stable_activities(stable_id,scheduled_date)`,
        `CREATE INDEX stable_activities_log_idx ON stable_activities(stable_id,horse_id,status,performed_at)`,
        `CREATE TABLE stable_activity_assignees (activity_id TEXT NOT NULL REFERENCES stable_activities(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(activity_id,user_id))`,
        `CREATE INDEX stable_assignee_user_idx ON stable_activity_assignees(user_id,activity_id)`,
        `CREATE TABLE stable_activity_performers (activity_id TEXT NOT NULL REFERENCES stable_activities(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(activity_id,user_id))`,
        `CREATE TABLE stable_activity_programs (activity_id TEXT NOT NULL REFERENCES stable_activities(id) ON DELETE CASCADE, program_id TEXT NOT NULL REFERENCES programs(id), title TEXT NOT NULL, PRIMARY KEY(activity_id,program_id))`,
        `CREATE TABLE stable_activity_exercises (id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES stable_activities(id) ON DELETE CASCADE, exercise_id TEXT NOT NULL REFERENCES exercises(id), source_program_id TEXT REFERENCES programs(id), name TEXT NOT NULL, description TEXT NOT NULL, notes TEXT, sort_order INTEGER NOT NULL)`,
        `CREATE TABLE schedule_templates (id TEXT PRIMARY KEY, stable_id TEXT NOT NULL REFERENCES stables(id), name TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL)`,
        `CREATE TABLE schedule_template_items (id TEXT PRIMARY KEY, template_id TEXT NOT NULL REFERENCES schedule_templates(id) ON DELETE CASCADE, weekday INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6), type_id TEXT NOT NULL REFERENCES stable_activity_types(id), horse_id TEXT REFERENCES horses(id), title TEXT NOT NULL, scheduled_time TEXT, instruction TEXT NOT NULL, training_student_id TEXT REFERENCES users(id), content_json TEXT NOT NULL, sort_order INTEGER NOT NULL)`,
        `CREATE TABLE schedule_template_assignees (item_id TEXT NOT NULL REFERENCES schedule_template_items(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(item_id,user_id))`,
        `CREATE TABLE schedule_operations (stable_id TEXT NOT NULL REFERENCES stables(id), request_id TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES users(id), fingerprint TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(stable_id,request_id))`,
    ];
    for (const statement of statements) await sql.raw(statement).execute(db);
}
