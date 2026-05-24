import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { UserService } from './user.service';
import { InvitationService } from './invitation.service';
import { RelationService } from './relation.service';
import { ExerciseService } from './exercise.service';
import { HorseService } from './horse.service';

export function createServices(db: Kysely<Database>) {
    const userService = new UserService(db);
    const invitationService = new InvitationService(db);
    const relationService = new RelationService(db);
    const exerciseService = new ExerciseService(db);
    const horseService = new HorseService(db);
    return { db, userService, invitationService, relationService, exerciseService, horseService };
}
