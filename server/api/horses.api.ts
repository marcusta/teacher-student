import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { HorseService } from '../services/horse.service';

const CreateInput = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
});

export function createHorsesApi(svc: HorseService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/horses',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/horses',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForStudent(user.id);
            },
        },
    };
}
