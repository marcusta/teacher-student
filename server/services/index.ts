import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { UserService } from './user.service';
import { InvitationService } from './invitation.service';
import { RelationService } from './relation.service';

export function createServices(db: Kysely<Database>) {
    const userService = new UserService(db);
    const invitationService = new InvitationService(db);
    const relationService = new RelationService(db);
    return { db, userService, invitationService, relationService };
}
