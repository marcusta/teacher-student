import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { GoalService } from '../services/goal.service';

const CreateInput = Type.Object({
    title: Type.String({ minLength: 1, maxLength: 200, pattern: '\\S' }),
    description: Type.Optional(Type.String({ maxLength: 5000 })),
    targetDate: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
    horseId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 200, pattern: '\\S' })),
    description: Type.Optional(Type.Union([Type.String({ maxLength: 5000 }), Type.Null()])),
    targetDate: Type.Optional(Type.Union([
        Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
        Type.Null(),
    ])),
    horseId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])),
});

const AbandonInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

const AchieveInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

const ReopenInput = Type.Object({
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

const PlanLinkInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    planId: Type.String({ minLength: 1 }),
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
                try {
                    return await svc.getForStudent(user.id, input.id);
                } catch (e) {
                    if (e instanceof NotFoundError) {
                        return svc.getForTeacher(user.id, input.id);
                    }
                    throw e;
                }
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
        achieve: {
            method: 'POST' as const,
            path: '/goals/:id/achieve',
            schema: AchieveInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof AchieveInput>, c: Context) => {
                const user = requireUser(c);
                await svc.markAchieved(user.id, input.id);
                return { ok: true as const };
            },
        },
        reopen: {
            method: 'POST' as const,
            path: '/goals/:id/reopen',
            schema: ReopenInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ReopenInput>, c: Context) => {
                const user = requireUser(c);
                await svc.reopen(user.id, input.id);
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
        attachPlan: {
            method: 'POST' as const,
            path: '/goals/:id/plans/:planId',
            schema: PlanLinkInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof PlanLinkInput>, c: Context) => {
                const user = requireUser(c);
                await svc.attachToPlan(user.id, input.id, input.planId);
                return { ok: true as const };
            },
        },
        detachPlan: {
            method: 'DELETE' as const,
            path: '/goals/:id/plans/:planId',
            schema: PlanLinkInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof PlanLinkInput>, c: Context) => {
                const user = requireUser(c);
                await svc.detachFromPlan(user.id, input.id, input.planId);
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
