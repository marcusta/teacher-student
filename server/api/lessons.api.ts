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
