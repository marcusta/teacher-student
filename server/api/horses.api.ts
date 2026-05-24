import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { HorseService } from '../services/horse.service';

const CreateInput = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
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
        get: {
            method: 'GET' as const,
            path: '/horses/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                const horse = await svc.getForStudent(user.id, input.id);
                if (!horse) throw new NotFoundError('Horse not found');
                return horse;
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/horses/:id',
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
