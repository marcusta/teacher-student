import type { Generated } from 'kysely';

export interface Database {
    users: UsersTable;
    invitations: InvitationsTable;
    relations: RelationsTable;
    exercises: ExercisesTable;
    horses: HorsesTable;
    lessons: LessonsTable;
    lesson_exercise: LessonExerciseTable;
    notes: NotesTable;
    training_sessions: TrainingSessionsTable;
    training_session_share: TrainingSessionShareTable;
}

export interface TrainingSessionsTable {
    id: string;
    student_id: string;
    performed_at: string;
    duration_min: number | null;
    summary: string | null;
    horse_id: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface TrainingSessionShareTable {
    training_session_id: string;
    teacher_id: string;
    created_at: Generated<string>;
}

/** SCOPE.md: unified Note table. MVP wires only parent_kind='lesson'. */
export type NoteParentKind = 'lesson' | 'student' | 'training_session' | 'exercise_question';
export type NoteVisibility = 'private' | 'shared';

export interface NotesTable {
    id: string;
    author_id: string;
    parent_kind: NoteParentKind;
    parent_id: string;
    body: string;
    visibility: NoteVisibility;
    created_at: Generated<string>;
    updated_at: Generated<string>;
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
