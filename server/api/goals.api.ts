import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { GoalService } from '../services/goal.service';

const CreateInput = Type.Object({
    title: Type.String({ minLength: 1, maxLength: 200, pattern: '\\S' }),
    description: Type.Optional(Type.String({ maxLength: 5000 })),
    targetDate: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 200, pattern: '\\S' })),
    description: Type.Optional(Type.Union([Type.String({ maxLength: 5000 }), Type.Null()])),
    targetDate: Type.Optional(Type.Union([
        Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
        Type.Null(),
    ])),
});

const AbandonInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

const ShareInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    teacherId: Type.String({ minLength: 1 }),
});

const UnshareInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    teacherId: Type.String({ minLength: 1 }),
});

const ListSharesInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

export function createGoalsApi(svc: GoalService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/goals',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/goals',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listForStudent(user.id);
            },
        },
        get: {
            method: 'GET' as const,
            path: '/goals/:id',
            middleware: [requireAuth()],
            fn: async (input: { id: string }, c: Context) => {
                const user = requireUser(c);
                return svc.getForStudent(user.id, input.id);
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/goals/:id',
            schema: UpdateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                const user = requireUser(c);
                const { id, ...patch } = input;
                return svc.update(user.id, id, patch);
            },
        },
        abandon: {
            method: 'POST' as const,
            path: '/goals/:id/abandon',
            schema: AbandonInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof AbandonInput>, c: Context) => {
                const user = requireUser(c);
                await svc.abandon(user.id, input.id);
                return { ok: true as const };
            },
        },
        share: {
            method: 'POST' as const,
            path: '/goals/:id/shares',
            schema: ShareInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ShareInput>, c: Context) => {
                const user = requireUser(c);
                await svc.share(user.id, input.id, input.teacherId);
                return { ok: true as const };
            },
        },
        unshare: {
            method: 'DELETE' as const,
            path: '/goals/:id/shares/:teacherId',
            schema: UnshareInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UnshareInput>, c: Context) => {
                const user = requireUser(c);
                await svc.unshare(user.id, input.id, input.teacherId);
                return { ok: true as const };
            },
        },
        listShares: {
            method: 'GET' as const,
            path: '/goals/:id/shares',
            schema: ListSharesInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ListSharesInput>, c: Context) => {
                const user = requireUser(c);
                return svc.listSharedTeachers(user.id, input.id);
            },
        },
    };
}
