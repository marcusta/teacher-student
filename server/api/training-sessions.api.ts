import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { TrainingSessionService } from '../services/training-session.service';

const ISO_DATETIME_PATTERN = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$';

const ShareIds = Type.Array(Type.String({ minLength: 1 }));

const CreateInput = Type.Object({
    performedAt: Type.String({ pattern: ISO_DATETIME_PATTERN }),
    durationMin: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
    summary: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    horseId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
    planId: Type.Optional(Type.String({ minLength: 1 })),
    shareWithTeacherIds: Type.Optional(ShareIds),
    programId: Type.Optional(Type.String({ minLength: 1 })),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    performedAt: Type.Optional(Type.String({ pattern: ISO_DATETIME_PATTERN })),
    durationMin: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
    summary: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    horseId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
    planId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
    shareWithTeacherIds: Type.Optional(ShareIds),
});

const AddExerciseInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    exerciseId: Type.String({ minLength: 1 }),
});

const RemoveExerciseInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    exerciseId: Type.String({ minLength: 1 }),
});

const ListExercisesInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

const AttachProgramInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    programId: Type.String({ minLength: 1 }),
});

const DetachProgramInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    programId: Type.String({ minLength: 1 }),
});

export function createTrainingSessionsApi(svc: TrainingSessionService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/training-sessions',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/training-sessions',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForStudent(user.id);
            },
        },
        get: {
            method: 'GET' as const,
            path: '/training-sessions/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return svc.getForViewer(user.id, input.id);
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/training-sessions/:id',
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
            path: '/training-sessions/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                await svc.delete(user.id, input.id);
                return { ok: true };
            },
        },
        addExercise: {
            method: 'POST' as const,
            path: '/training-sessions/:id/exercises',
            schema: AddExerciseInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof AddExerciseInput>, c: Context) => {
                const user = requireUser(c);
                await svc.addExercise(user.id, input.id, input.exerciseId);
                return svc.listExercises(user.id, input.id);
            },
        },
        removeExercise: {
            method: 'DELETE' as const,
            path: '/training-sessions/:id/exercises/:exerciseId',
            schema: RemoveExerciseInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof RemoveExerciseInput>, c: Context) => {
                const user = requireUser(c);
                await svc.removeExercise(user.id, input.id, input.exerciseId);
                return svc.listExercises(user.id, input.id);
            },
        },
        listExercises: {
            method: 'GET' as const,
            path: '/training-sessions/:id/exercises',
            schema: ListExercisesInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ListExercisesInput>, c: Context) => {
                const user = requireUser(c);
                return svc.listExercises(user.id, input.id);
            },
        },
        attachProgram: {
            method: 'POST' as const,
            path: '/training-sessions/:id/programs',
            schema: AttachProgramInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof AttachProgramInput>, c: Context) => {
                const user = requireUser(c);
                return svc.attachProgram(user.id, input.id, input.programId);
            },
        },
        detachProgram: {
            method: 'DELETE' as const,
            path: '/training-sessions/:id/programs/:programId',
            schema: DetachProgramInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof DetachProgramInput>, c: Context) => {
                const user = requireUser(c);
                return svc.detachProgram(user.id, input.id, input.programId);
            },
        },
    };
}
