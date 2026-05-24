import type { Generated } from 'kysely';

export interface Database {
    users: UsersTable;
}

export interface UsersTable {
    id: string;
    email: string;
    display_name: string;
    password_hash: string;
    created_at: Generated<string>;
}
