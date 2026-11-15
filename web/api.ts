import { createRegisterClient } from './api/register.gen';
import { createAccountClient } from './api/account.gen';
import { createInvitationsClient } from './api/invitations.gen';
import { createStudentsClient } from './api/students.gen';
import { createExercisesClient } from './api/exercises.gen';
import { createHorsesClient } from './api/horses.gen';
import { createLessonsClient } from './api/lessons.gen';
import { createNotesClient } from './api/notes.gen';
import { createTrainingSessionsClient } from './api/training-sessions.gen';
import { createTeachersClient, type Student as TeacherDto } from './api/teachers.gen';
import { createProgramsClient } from './api/programs.gen';
import { createPlansClient } from './api/plans.gen';
import { createGoalsClient } from './api/goals.gen';
import { createDashboardClient } from './api/dashboard.gen';
import { createStablesClient } from './api/stables.gen';
import { createStableActivitiesClient } from './api/stable-activities.gen';
import { createScheduleTemplatesClient } from './api/schedule-templates.gen';

export { ApiError } from '@basics/core/client/api-error';
export type { Invitation, InboxInvitation } from './api/invitations.gen';
export type { Student, ExerciseHistoryEntry } from './api/students.gen';
export type { Exercise } from './api/exercises.gen';
export type { Horse } from './api/horses.gen';
export type { Lesson, LessonForUser, LessonExerciseRef } from './api/lessons.gen';
export type { Note } from './api/notes.gen';
export type { TrainingSession, TrainingSessionExerciseRef, AttachedProgramRef } from './api/training-sessions.gen';
export type { Program, ProgramExerciseRef } from './api/programs.gen';
export type { Plan, PlanDetail, LinkedLessonRef, LinkedTrainingSessionRef, LinkedGoalRef } from './api/plans.gen';
export type { Goal, SharedTeacherRef } from './api/goals.gen';
export type { GoalTeacherView } from './api/students.gen';
export type {
    DashboardView, DashboardCapabilities, DashboardNextLesson, DashboardFeedback,
    DashboardAwaitingItem, DashboardPlanRef, DashboardGoalRef,
} from './api/dashboard.gen';
/** Server reuses RelationService.Student for the teachers endpoint; alias for clarity. */
export type Teacher = TeacherDto;
export type { StableSummary, StableDetail, StableHorse, StableMember, ActivityType, StableInvitation } from './api/stables.gen';
export type { Activity, ScheduleWeek, HorseLog, ScheduleCatalog } from './api/stable-activities.gen';
export type { ScheduleTemplate, ScheduleCopyResult } from './api/schedule-templates.gen';

// Carry the deploy base path (Vite BASE_URL) so API calls resolve under the
// sub-path in production ('/teacher-student/api') and at the root in dev
// ('/api'). Caddy strips the prefix before proxying, so the server still sees
// '/api'.
const API_BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/+$/, '') + '/api';

export const api = {
    register: createRegisterClient(API_BASE),
    account: createAccountClient(API_BASE),
    invitations: createInvitationsClient(API_BASE),
    students: createStudentsClient(API_BASE),
    exercises: createExercisesClient(API_BASE),
    horses: createHorsesClient(API_BASE),
    lessons: createLessonsClient(API_BASE),
    notes: createNotesClient(API_BASE),
    trainingSessions: createTrainingSessionsClient(API_BASE),
    teachers: createTeachersClient(API_BASE),
    programs: createProgramsClient(API_BASE),
    plans: createPlansClient(API_BASE),
    goals: createGoalsClient(API_BASE),
    dashboard: createDashboardClient(API_BASE),
    stables: createStablesClient(API_BASE),
    stableActivities: createStableActivitiesClient(API_BASE),
    scheduleTemplates: createScheduleTemplatesClient(API_BASE),
};
