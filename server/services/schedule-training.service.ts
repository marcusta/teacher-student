import { ForbiddenError, NotFoundError } from '@basics/core/server/auth';
import { ScheduleService, boundedNote, instant, type ScheduleDb } from './schedule.service';
import { StableService } from './stable.service';
import { ScheduleError } from './schedule-errors';
import type { Activity } from './schedule.types';

export interface RegisterScheduledTraining {
    version: number; sessionId?: string; performedAt?: string; durationMin?: number | null;
    summary?: string; resultNote?: string; performerIds?: string[];
}

export class ScheduleTrainingService {
    constructor(private db: ScheduleDb) {}

    async register(actorId: string, stableId: string, activityId: string, input: RegisterScheduledTraining): Promise<Activity> {
        return this.db.transaction().execute(async db => {
            const svc = new ScheduleService(db), stable = new StableService(db);
            await stable.requireMember(actorId, stableId);
            const row = await svc.row(stableId, activityId);
            const type = await db.selectFrom('stable_activity_types').select('category').where('id', '=', row.type_id).executeTakeFirstOrThrow();
            const assigned = await db.selectFrom('stable_activity_assignees').select('user_id').where('activity_id', '=', activityId).where('user_id', '=', actorId).executeTakeFirst();
            if (row.training_student_id !== actorId || !assigned || type.category !== 'training' || !row.horse_id) throw new ForbiddenError('Main performer required');
            await stable.requireHorse(stableId, row.horse_id);
            if (row.training_session_id) return svc.get(actorId, stableId, activityId);
            if (row.status === 'cancelled') throw new ScheduleError('activity_cancelled');
            const now = new Date().toISOString();
            let sessionId = input.sessionId, performedAt: string;
            if (sessionId) {
                const session = await db.selectFrom('training_sessions').selectAll().where('id', '=', sessionId).where('student_id', '=', actorId).executeTakeFirst();
                if (!session || session.horse_id !== row.horse_id) throw new NotFoundError('Training session not found');
                const linked = await db.selectFrom('stable_activities').select('id').where('training_session_id', '=', sessionId).executeTakeFirst();
                if (linked) throw new ScheduleError('training_already_linked');
                performedAt = session.performed_at;
            } else {
                const programs = await db.selectFrom('stable_activity_programs').selectAll().where('activity_id', '=', activityId).execute();
                const exercises = await db.selectFrom('stable_activity_exercises').selectAll().where('activity_id', '=', activityId).orderBy('sort_order').execute();
                await svc.checkContent(actorId, stableId, actorId, programs.map(p => p.program_id), exercises.map(e => e.exercise_id), true);
                if (input.durationMin != null && (!Number.isInteger(input.durationMin) || input.durationMin < 0 || input.durationMin > 1440)) throw new ScheduleError('invalid_duration');
                sessionId = crypto.randomUUID();
                performedAt = instant(input.performedAt ?? now);
                await db.insertInto('training_sessions').values({ id: sessionId, student_id: actorId, horse_id: row.horse_id, plan_id: null,
                    performed_at: performedAt, duration_min: input.durationMin ?? null, summary: input.summary === undefined ? null : boundedNote(input.summary), created_at: now, updated_at: now }).execute();
                if (programs.length) await db.insertInto('training_session_program').values(programs.map(p => ({ training_session_id: sessionId!, program_id: p.program_id, snapshot_title: p.title }))).execute();
                if (exercises.length) await db.insertInto('training_session_exercise').values(exercises.map(e => ({ id: crypto.randomUUID(), training_session_id: sessionId!, exercise_id: e.exercise_id, sort_order: e.sort_order, notes: e.notes, source_program_id: e.source_program_id, snapshot_name: e.name, snapshot_description: e.description }))).execute();
            }
            const performers = await svc.members(stableId, input.performerIds?.length ? input.performerIds : [actorId]);
            if (!performers.includes(actorId)) throw new ScheduleError('training_student_required');
            await svc.cas(row, actorId, input.version, { status: 'completed', training_session_id: sessionId, performed_at: performedAt,
                completed_at: now, completed_by: actorId, ...(input.resultNote !== undefined ? { result_note: boundedNote(input.resultNote) } : {}) });
            await db.deleteFrom('stable_activity_performers').where('activity_id', '=', activityId).execute();
            await db.insertInto('stable_activity_performers').values(performers.map(userId => ({ activity_id: activityId, user_id: userId }))).execute();
            return svc.get(actorId, stableId, activityId);
        });
    }
}
