import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { RelationService } from '../services/relation.service';

export function createTeachersApi(svc: RelationService) {
    return {
        list: {
            method: 'GET' as const,
            path: '/teachers',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listTeachersForStudent(user.id);
            },
        },
    };
}
