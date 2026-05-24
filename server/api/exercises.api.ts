import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { ExerciseService } from '../services/exercise.service';

const CreateInput = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
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
    };
}
