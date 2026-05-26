import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { PlanService } from '../services/plan.service';

const CreateInput = Type.Object({
    title: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 })),
    startDate: Type.Optional(Type.String({ format: 'date' })),
    endDate: Type.Optional(Type.String({ format: 'date' })),
    primaryTeacherId: Type.Optional(Type.String({ minLength: 1 })),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
    description: Type.Optional(Type.Union([Type.String({ maxLength: 5000 }), Type.Null()])),
    startDate: Type.Optional(Type.Union([Type.String({ format: 'date' }), Type.Null()])),
    endDate: Type.Optional(Type.Union([Type.String({ format: 'date' }), Type.Null()])),
    primaryTeacherId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
});

const ArchiveInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

export function createPlansApi(svc: PlanService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/plans',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/plans',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForStudent(user.id);
            },
        },
        get: {
            method: 'GET' as const,
            path: '/plans/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return svc.getDetail(user.id, input.id);
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/plans/:id',
            schema: UpdateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                const user = requireUser(c);
                const { id, ...patch } = input;
                return svc.update(user.id, id, patch);
            },
        },
        archive: {
            method: 'POST' as const,
            path: '/plans/:id/archive',
            schema: ArchiveInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ArchiveInput>, c: Context) => {
                const user = requireUser(c);
                await svc.archive(user.id, input.id);
                return { ok: true as const };
            },
        },
    };
}
