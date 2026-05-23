import type { Generated } from 'kysely';

export interface Database {
    users: UsersTable;
}

export interface UsersTable {
    id: string;
    username: string;
    password_hash: string;
    created_at: Generated<string>;
}
