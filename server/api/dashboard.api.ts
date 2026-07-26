import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { DashboardService } from '../services/dashboard.service';

/**
 * The one view-shaped endpoint in this API. Every other descriptor is a
 * resource noun; `/dashboard` is a read model shaped by one screen.
 *
 * Justified because `latestFeedback` is not composable from any existing
 * endpoint — `NoteService.listFor` takes one parent at a time, so answering
 * "the newest shared note anyone wrote to me, anywhere" from the client means
 * hundreds of requests AND a second, drifting copy of a five-branch privacy
 * rule. A view-shaped endpoint is permitted only on those grounds.
 *
 * No `schema` field: the endpoint takes no input, exactly like `lessons.list`
 * and `students.list`. No TypeBox response schema either — response types are
 * derived from the `fn` return type by `@basics/core/generate-api.ts`.
 */
export function createDashboardApi(svc: DashboardService) {
    return {
        get: {
            method: 'GET' as const,
            path: '/dashboard',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                // `AuthUser.username` IS the email (UserService returns
                // `{ id, username: row.email }`) — `pendingInvitations` is
                // keyed on it.
                return svc.get(user.id, user.username);
            },
        },
    };
}
