import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { type SessionStore, issueSessionCookie } from '@basics/core/server/auth';
import type { UserService } from '../services/user.service';

// --- Input schema ---

const RegisterInput = Type.Object({
    email: Type.String({ pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', minLength: 3, maxLength: 254 }),
    password: Type.String({ minLength: 8, maxLength: 200 }),
    displayName: Type.String({ minLength: 1, maxLength: 100 }),
});

// --- API descriptor ---

export function createRegisterApi(svc: UserService, sessions: SessionStore) {
    return {
        register: {
            method: 'POST' as const,
            path: '/auth/register',
            schema: RegisterInput,
            fn: async (input: Static<typeof RegisterInput>, c: Context) => {
                const user = await svc.register(input);
                await issueSessionCookie(c, sessions, user.id);
                return user;
            },
        },
    };
}
