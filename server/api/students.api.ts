import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { RelationService } from '../services/relation.service';
import type { HorseService } from '../services/horse.service';

export function createStudentsApi(svc: RelationService, horseService: HorseService) {
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
    };
}
