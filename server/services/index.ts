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
import { PlanService } from './plan.service';
import { GoalService } from './goal.service';
import { DashboardService } from './dashboard.service';
import { StableService } from './stable.service';
import { ScheduleService } from './schedule.service';
import { ScheduleTemplateService } from './schedule-template.service';
import { ScheduleTrainingService } from './schedule-training.service';

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
    const planService = new PlanService(db);
    const goalService = new GoalService(db);
    const dashboardService = new DashboardService(db);
    const stableService = new StableService(db);
    const scheduleService = new ScheduleService(db);
    const scheduleTemplateService = new ScheduleTemplateService(db);
    const scheduleTrainingService = new ScheduleTrainingService(db);
    return {
        db, userService, invitationService, relationService,
        exerciseService, horseService, lessonService, noteService,
        trainingSessionService, programService, planService, goalService,
        dashboardService, stableService, scheduleService, scheduleTemplateService, scheduleTrainingService,
    };
}
