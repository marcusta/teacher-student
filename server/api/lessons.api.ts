import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { LessonService } from '../services/lesson.service';

// ISO 8601 datetime (with optional fractional seconds; Z or ±HH:MM offset).
const ISO_DATETIME_PATTERN = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$';

const CreateInput = Type.Object({
    studentId: Type.String({ minLength: 1 }),
    scheduledAt: Type.String({ pattern: ISO_DATETIME_PATTERN }),
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

const TransitionInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    target: Type.Union([Type.Literal('completed'), Type.Literal('cancelled')]),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    horseId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
    scheduledAt: Type.Optional(Type.String({ pattern: ISO_DATETIME_PATTERN })),
});

export function createLessonsApi(svc: LessonService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/lessons',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/lessons',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForUser(user.id);
            },
        },
        addExercise: {
            method: 'POST' as const,
            path: '/lessons/:id/exercises',
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
            path: '/lessons/:id/exercises/:exerciseId',
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
            path: '/lessons/:id/exercises',
            schema: ListExercisesInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ListExercisesInput>, c: Context) => {
                const user = requireUser(c);
                return svc.listExercises(user.id, input.id);
            },
        },
        transition: {
            method: 'POST' as const,
            path: '/lessons/:id/transition',
            schema: TransitionInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof TransitionInput>, c: Context) => {
                const user = requireUser(c);
                return svc.transition(user.id, input.id, input.target);
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/lessons/:id',
            schema: UpdateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                const user = requireUser(c);
                const { id, ...patch } = input;
                return svc.update(user.id, id, patch);
            },
        },
    };
}
