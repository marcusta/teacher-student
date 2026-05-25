import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { ProgramService } from '../services/program.service';

const CreateInput = Type.Object({
    title: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 4000 })),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
    description: Type.Optional(Type.String({ maxLength: 4000 })),
});

const AddExerciseInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    exerciseId: Type.String({ minLength: 1 }),
    notes: Type.Optional(Type.String({ maxLength: 2000 })),
});

export function createProgramsApi(svc: ProgramService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/programs',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/programs',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForTeacher(user.id);
            },
        },
        get: {
            method: 'GET' as const,
            path: '/programs/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                const p = await svc.getForTeacher(user.id, input.id);
                if (!p) throw new NotFoundError('Program not found');
                return p;
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/programs/:id',
            schema: UpdateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                const user = requireUser(c);
                const { id, ...patch } = input;
                return svc.update(user.id, id, patch);
            },
        },
        delete: {
            method: 'DELETE' as const,
            path: '/programs/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                await svc.delete(user.id, input.id);
                return { ok: true };
            },
        },
        listExercises: {
            method: 'GET' as const,
            path: '/programs/:id/exercises',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return svc.listExercises(user.id, input.id);
            },
        },
        addExercise: {
            method: 'POST' as const,
            path: '/programs/:id/exercises',
            schema: AddExerciseInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof AddExerciseInput>, c: Context) => {
                const user = requireUser(c);
                const { id, exerciseId, notes } = input;
                await svc.addExercise(user.id, id, exerciseId, notes !== undefined ? { notes } : {});
                return { ok: true };
            },
        },
    };
}
