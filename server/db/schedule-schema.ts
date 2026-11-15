import type { Generated } from 'kysely';

export type StableRole = 'admin' | 'member';
export type ActivityStatus = 'planned' | 'completed' | 'cancelled';
export type ActivityCategory = 'routine' | 'care' | 'training' | 'visit' | 'other';

export interface ScheduleDatabase {
    stables: { id: string; name: string; time_zone: string; created_by: string; created_at: Generated<string> };
    stable_members: { stable_id: string; user_id: string; role: StableRole; joined_at: string; ended_at: string | null };
    stable_invitations: { id: string; stable_id: string; invitee_email: string; invited_by: string; status: 'pending' | 'accepted' | 'declined' | 'revoked'; expires_at: string; created_at: string };
    stable_horses: { stable_id: string; horse_id: string; approved_by: string; joined_at: string; ended_at: string | null };
    stable_activity_types: { id: string; stable_id: string; code: string | null; name: string; category: ActivityCategory; scope: 'stable' | 'horse' | 'any'; default_time: string | null; sort_order: number; archived_at: string | null };
    stable_activities: {
        id: string; stable_id: string; type_id: string; horse_id: string | null; title: string;
        scheduled_date: string; scheduled_time: string | null; scheduled_offset_min: number | null;
        instruction: string; status: ActivityStatus; result_note: string;
        performed_at: string | null; completed_at: string | null; completed_by: string | null;
        created_by: string; updated_by: string; created_at: string; updated_at: string; version: number;
        training_student_id: string | null; training_session_id: string | null;
    };
    stable_activity_assignees: { activity_id: string; user_id: string };
    stable_activity_performers: { activity_id: string; user_id: string };
    stable_activity_programs: { activity_id: string; program_id: string; title: string };
    stable_activity_exercises: { id: string; activity_id: string; exercise_id: string; source_program_id: string | null; name: string; description: string; notes: string | null; sort_order: number };
    schedule_templates: { id: string; stable_id: string; name: string; created_by: string; created_at: string };
    schedule_template_items: { id: string; template_id: string; weekday: number; type_id: string; horse_id: string | null; title: string; scheduled_time: string | null; instruction: string; training_student_id: string | null; content_json: string; sort_order: number };
    schedule_template_assignees: { item_id: string; user_id: string };
    schedule_operations: { stable_id: string; request_id: string; actor_id: string; fingerprint: string; result_json: string; created_at: string };
}
