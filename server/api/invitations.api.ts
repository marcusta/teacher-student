import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { InvitationService } from '../services/invitation.service';

// --- Input schemas ---

const CreateInput = Type.Object({
    inviteeEmail: Type.String({
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        minLength: 3,
        maxLength: 254,
    }),
});

const RevokeInput = Type.Object({
    invitationId: Type.String({ minLength: 1 }),
});

// --- API descriptor ---

export function createInvitationsApi(svc: InvitationService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/invitations',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.createInvitation(user.id, input.inviteeEmail);
            },
        },
        revoke: {
            method: 'POST' as const,
            path: '/invitations/revoke',
            schema: RevokeInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof RevokeInput>, c: Context) => {
                const user = requireUser(c);
                const changed = await svc.revokeInvitation(input.invitationId, user.id);
                return { changed };
            },
        },
        list: {
            method: 'GET' as const,
            path: '/invitations',
            middleware: [requireAuth()],
            fn: async (c: Context) => {
                const user = requireUser(c);
                return svc.listByTeacher(user.id);
            },
        },
    };
}
