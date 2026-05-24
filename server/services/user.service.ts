import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { AuthUser } from '@basics/core/server/auth';
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
}
