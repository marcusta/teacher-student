import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { UserService } from './user.service';

export function createServices(db: Kysely<Database>) {
    const userService = new UserService(db);
    return { db, userService };
}
