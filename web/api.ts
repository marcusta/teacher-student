import { createRegisterClient } from './api/register.gen';
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

export { ApiError } from '@basics/core/client/api-error';
export type { Invitation, InboxInvitation } from './api/invitations.gen';
export type { Student, ExerciseHistoryEntry } from './api/students.gen';
export type { Exercise } from './api/exercises.gen';
export type { Horse } from './api/horses.gen';
export type { Lesson, LessonForUser, LessonExerciseRef } from './api/lessons.gen';
export type { Note } from './api/notes.gen';
export type { TrainingSession, TrainingSessionExerciseRef, AttachedProgramRef } from './api/training-sessions.gen';
export type { Program, ProgramExerciseRef } from './api/programs.gen';
export type { Plan, PlanDetail, LinkedLessonRef, LinkedTrainingSessionRef } from './api/plans.gen';
/** Server reuses RelationService.Student for the teachers endpoint; alias for clarity. */
export type Teacher = TeacherDto;

export const api = {
    register: createRegisterClient('/api'),
    invitations: createInvitationsClient('/api'),
    students: createStudentsClient('/api'),
    exercises: createExercisesClient('/api'),
    horses: createHorsesClient('/api'),
    lessons: createLessonsClient('/api'),
    notes: createNotesClient('/api'),
    trainingSessions: createTrainingSessionsClient('/api'),
    teachers: createTeachersClient('/api'),
    programs: createProgramsClient('/api'),
    plans: createPlansClient('/api'),
};
