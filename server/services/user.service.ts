import type { Kysely, Selectable } from 'kysely';
import type { Database, UsersTable } from '../db/schema';
import type { AuthUser } from '@basics/core/server/auth';

// --- Output types ---

export interface User {
    id: string;
    username: string;
}

// --- Row mapping ---

type UserRow = Selectable<UsersTable>;

function toUser(row: UserRow): User {
    return { id: row.id, username: row.username };
}

export class UserService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private users() {
        return this.db.selectFrom('users').selectAll();
    }

    private byId(id: string) {
        return this.users().where('id', '=', id);
    }

    private byUsername(username: string) {
        return this.users().where('username', '=', username);
    }

    // --- Methods ---

    async register(username: string, password: string): Promise<User> {
        const id = crypto.randomUUID();
        const passwordHash = await Bun.password.hash(password);

        await this.db.insertInto('users').values({
            id,
            username,
            password_hash: passwordHash,
        }).execute();

        return { id, username };
    }

    async verify(username: string, password: string): Promise<AuthUser | null> {
        const row = await this.byUsername(username).executeTakeFirst();
        if (!row) return null;

        const valid = await Bun.password.verify(password, row.password_hash);
        if (!valid) return null;

        return { id: row.id, username: row.username };
    }

    async findById(id: string): Promise<AuthUser | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return { id: row.id, username: row.username };
    }
}
