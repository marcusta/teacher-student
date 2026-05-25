import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { UserService } from './user.service';
import { InvitationService } from './invitation.service';
import { RelationService } from './relation.service';
import { ExerciseService } from './exercise.service';
import { HorseService } from './horse.service';
import { LessonService } from './lesson.service';
import { NoteService } from './note.service';
import { TrainingSessionService } from './training-session.service';
import { ProgramService } from './program.service';

export function createServices(db: Kysely<Database>) {
    const userService = new UserService(db);
    const invitationService = new InvitationService(db);
    const relationService = new RelationService(db);
    const exerciseService = new ExerciseService(db);
    const horseService = new HorseService(db);
    const lessonService = new LessonService(db);
    const noteService = new NoteService(db);
    const trainingSessionService = new TrainingSessionService(db);
    const programService = new ProgramService(db);
    return {
        db, userService, invitationService, relationService,
        exerciseService, horseService, lessonService, noteService,
        trainingSessionService, programService,
    };
}
