import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { UserService } from './user.service';
import { InvitationService } from './invitation.service';

export function createServices(db: Kysely<Database>) {
    const userService = new UserService(db);
    const invitationService = new InvitationService(db);
    return { db, userService, invitationService };
}
