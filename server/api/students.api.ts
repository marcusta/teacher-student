import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { RelationService } from '../services/relation.service';
import type { HorseService } from '../services/horse.service';
import type { PlanService } from '../services/plan.service';
import type { TrainingSessionService } from '../services/training-session.service';
import type { LessonService } from '../services/lesson.service';

import type { GoalService } from '../services/goal.service';

export function createStudentsApi(
    svc: RelationService,
    horseService: HorseService,
    planService: PlanService,
    trainingSessionService: TrainingSessionService,
    lessonService: LessonService,
    goalService: GoalService,
) {
    return {
        list: {
            method: 'GET' as const,
            path: '/students',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listStudentsForTeacher(user.id);
            },
        },
        get: {
            method: 'GET' as const,
            path: '/students/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                const student = await svc.getStudentForTeacher(user.id, input.id);
                // 404 (not 403) to avoid leaking existence of other teachers' students.
                if (!student) throw new NotFoundError('Student not found');
                return student;
            },
        },
        listHorses: {
            method: 'GET' as const,
            path: '/students/:id/horses',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return horseService.listForStudentAsTeacher(user.id, input.id);
            },
        },
        listPlans: {
            method: 'GET' as const,
            path: '/students/:id/plans',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return planService.listForStudentAsTeacher(user.id, input.id);
            },
        },
        listGoals: {
            method: 'GET' as const,
            path: '/students/:id/goals',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return goalService.listForStudentAsTeacher(user.id, input.id);
            },
        },
        listTrainingSessions: {
            method: 'GET' as const,
            path: '/students/:id/training-sessions',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return trainingSessionService.listForTeacherOfStudent(user.id, input.id);
            },
        },
        exerciseHistory: {
            method: 'GET' as const,
            path: '/students/:id/exercises/:exerciseId/history',
            middleware: [requireAuth()],
            fn: async (input: { id: string; exerciseId: string }, c: Context) => {
                const user = requireUser(c);
                return lessonService.exerciseHistory(user.id, input.id, input.exerciseId);
            },
        },
    };
}
