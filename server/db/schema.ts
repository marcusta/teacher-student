import type { Generated } from 'kysely';
import type { ScheduleDatabase } from './schedule-schema';

export interface Database extends ScheduleDatabase {
    users: UsersTable;
    invitations: InvitationsTable;
    relations: RelationsTable;
    exercises: ExercisesTable;
    horses: HorsesTable;
    plans: PlansTable;
    goal: GoalTable;
    goal_share: GoalShareTable;
    goal_plan: GoalPlanTable;
    lessons: LessonsTable;
    lesson_exercise: LessonExerciseTable;
    notes: NotesTable;
    training_sessions: TrainingSessionsTable;
    training_session_share: TrainingSessionShareTable;
    training_session_exercise: TrainingSessionExerciseTable;
    training_session_program: TrainingSessionProgramTable;
    programs: ProgramsTable;
    program_exercise: ProgramExerciseTable;
    lesson_program: LessonProgramTable;
}

export interface LessonProgramTable {
    lesson_id: string;
    program_id: string;
    attached_at: Generated<string>;
}

export interface ProgramsTable {
    id: string;
    teacher_id: string;
    title: string;
    description: string;
    archived_at: string | null;
    created_at: Generated<string>;
}

export interface ProgramExerciseTable {
    program_id: string;
    exercise_id: string;
    sort_order: number;
    notes: string | null;
    created_at: Generated<string>;
}

export interface TrainingSessionsTable {
    id: string;
    student_id: string;
    performed_at: string;
    duration_min: number | null;
    summary: string | null;
    horse_id: string | null;
    plan_id: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface TrainingSessionShareTable {
    training_session_id: string;
    teacher_id: string;
    created_at: Generated<string>;
}

export interface TrainingSessionExerciseTable {
    id: string;
    training_session_id: string;
    exercise_id: string;
    sort_order: number;
    notes: string | null;
    source_program_id: string | null;
    snapshot_name: Generated<string | null>;
    snapshot_description: Generated<string | null>;
    created_at: Generated<string>;
}

export interface TrainingSessionProgramTable {
    training_session_id: string;
    program_id: string;
    snapshot_title: Generated<string | null>;
    attached_at: Generated<string>;
}

/** SCOPE.md: unified Note table. MVP wires only parent_kind='lesson'. */
export type NoteParentKind = 'lesson' | 'student' | 'training_session' | 'training_session_exercise' | 'exercise_question' | 'lesson_exercise' | 'goal';
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
    id: string;
    lesson_id: string;
    exercise_id: string;
    sort_order: number;
    notes: string | null;
    source_program_id: string | null;
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
    plan_id: string | null;
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

export type PlanStatus = 'active' | 'archived';
export type GoalStatus = 'active' | 'achieved' | 'abandoned';

export interface GoalTable {
    id: string;
    student_id: string;
    title: string;
    description: string | null;
    target_date: string | null;
    achieved_at: string | null;
    status: Generated<GoalStatus>;
    horse_id: string | null;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface GoalShareTable {
    goal_id: string;
    teacher_id: string;
    created_at: Generated<string>;
}

export interface GoalPlanTable {
    goal_id: string;
    plan_id: string;
    attached_at: Generated<string>;
}

export interface PlansTable {
    id: string;
    student_id: string;
    primary_teacher_id: string | null;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: Generated<PlanStatus>;
    created_at: Generated<string>;
    updated_at: Generated<string>;
}

export interface ExercisesTable {
    id: string;
    teacher_id: string;
    name: string;
    description: string;
    archived_at: string | null;
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
