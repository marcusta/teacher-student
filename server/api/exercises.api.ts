import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { ExerciseService } from '../services/exercise.service';

const CreateInput = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 4000 })),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
    description: Type.Optional(Type.String({ maxLength: 4000 })),
});

export function createExercisesApi(svc: ExerciseService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/exercises',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/exercises',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForTeacher(user.id);
            },
        },
        listForStudent: {
            method: 'GET' as const,
            path: '/exercises/for-student',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForStudent(user.id);
            },
        },
        get: {
            method: 'GET' as const,
            path: '/exercises/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                const ex = await svc.getForTeacher(user.id, input.id);
                if (!ex) throw new NotFoundError('Exercise not found');
                return ex;
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/exercises/:id',
            schema: UpdateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                const user = requireUser(c);
                const { id, ...patch } = input;
                return svc.update(user.id, id, patch);
            },
        },
        // Semantic delete = archive (soft-delete). The HTTP verb is DELETE but
        // nothing is removed: lesson_exercise / training_session_exercise rows
        // are the historical record of what was actually ridden, and the Notes
        // hanging off them have no FK to cascade through — a hard delete would
        // silently orphan them. The exercise just leaves every picker.
        delete: {
            method: 'DELETE' as const,
            path: '/exercises/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                await svc.archive(user.id, input.id);
                return { ok: true };
            },
        },
    };
}
