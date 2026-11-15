import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { ConflictError, NotFoundError, type AuthUser } from '@basics/core/server/auth';
import { UniqueViolationError, parseUniqueViolation } from '@basics/core/server/unique-violation';

// --- Output types ---

export interface User {
    id: string;
    email: string;
    displayName: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    displayName: string;
}

/** Thrown by `UserService.register` when the email is already taken. */
export class DuplicateEmailError extends UniqueViolationError {
    constructor(public readonly email: string) {
        super('users', 'email');
        this.message = `Email already registered: ${email}`;
        this.name = 'DuplicateEmailError';
    }
}

export class UserService {
    constructor(private db: Kysely<Database>) {}

    async register(input: RegisterInput): Promise<User> {
        const id = crypto.randomUUID();
        const passwordHash = await Bun.password.hash(input.password);

        try {
            await this.db.insertInto('users').values({
                id,
                email: input.email,
                display_name: input.displayName,
                password_hash: passwordHash,
            }).execute();
        } catch (err) {
            const uv = parseUniqueViolation(err);
            if (uv?.column === 'email') throw new DuplicateEmailError(input.email);
            throw err;
        }

        return { id, email: input.email, displayName: input.displayName };
    }

    async verify(email: string, password: string): Promise<AuthUser | null> {
        const row = await this.db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', email)
            .executeTakeFirst();
        if (!row) return null;

        const valid = await Bun.password.verify(password, row.password_hash);
        if (!valid) return null;

        return { id: row.id, username: row.email };
    }

    async findById(id: string): Promise<AuthUser | null> {
        const row = await this.db
            .selectFrom('users')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!row) return null;
        return { id: row.id, username: row.email };
    }

    /**
     * Change the password of a signed-in user.
     *
     * A wrong `currentPassword` throws `ConflictError` (409), deliberately not
     * `AuthenticationError` (401): both the web and iOS clients treat a 401 on
     * any endpoint as "session expired" and sign the user out mid-form. 409 is
     * the single failure mode this method has, so clients can map it
     * unambiguously to "current password does not match".
     *
     * "New password equals current password" is *not* rejected here — that is a
     * client-side validation rule only.
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const row = await this.db
            .selectFrom('users')
            .select(['id', 'password_hash'])
            .where('id', '=', userId)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('User not found');

        const valid = await Bun.password.verify(currentPassword, row.password_hash);
        if (!valid) throw new ConflictError('Current password does not match');

        const passwordHash = await Bun.password.hash(newPassword);
        await this.db
            .updateTable('users')
            .set({ password_hash: passwordHash })
            .where('id', '=', userId)
            .execute();
    }
}
