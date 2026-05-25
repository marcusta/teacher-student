import type { Generated } from 'kysely';

export interface Database {
    users: UsersTable;
    invitations: InvitationsTable;
    relations: RelationsTable;
    exercises: ExercisesTable;
    horses: HorsesTable;
    lessons: LessonsTable;
    lesson_exercise: LessonExerciseTable;
}

export interface LessonExerciseTable {
    lesson_id: string;
    exercise_id: string;
    sort_order: number;
    notes: string | null;
    created_at: Generated<string>;
}

export type LessonStatus = 'planned' | 'completed' | 'cancelled';

export interface LessonsTable {
    id: string;
    teacher_id: string;
    student_id: string;
    scheduled_at: string;
    status: Generated<LessonStatus>;
    horse_id: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface HorsesTable {
    id: string;
    student_id: string;
    name: string;
    archived_at: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface ExercisesTable {
    id: string;
    teacher_id: string;
    name: string;
    description: string;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface RelationsTable {
    id: string;
    teacher_id: string;
    student_id: string;
    invitation_id: string;
    created_at: Generated<string>;
}

export interface UsersTable {
    id: string;
    email: string;
    display_name: string;
    password_hash: string;
    created_at: Generated<string>;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface InvitationsTable {
    id: string;
    teacher_id: string;
    invitee_email: string;
    status: InvitationStatus;
    created_at: Generated<string>;
    expires_at: string;
    accepted_at: string | null;
}
