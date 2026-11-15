import { createHash } from 'node:crypto';
import { type Kysely, type Selectable } from 'kysely';
import { ForbiddenError, NotFoundError } from '@basics/core/server/auth';
import type { Database } from '../db/schema';
import type { ActivityStatus, ScheduleDatabase } from '../db/schedule-schema';
import { StableService } from './stable.service';
import { ScheduleError, text } from './schedule-errors';
import { addDays, calendarDate, mondayOf, zonedInstant } from '../../shared/schedule-calendar';
import type { Activity, CreateActivityInput, UpdateActivityInput, CompleteActivityInput, ScheduleWeek, HorseLog, LogInput } from './schedule.types';

type ActivityRow = Selectable<ScheduleDatabase['stable_activities']>;
export type ScheduleDb = Kysely<Database>;
export function scheduleTransaction<T>(db: ScheduleDb, write: (db: ScheduleDb) => Promise<T>): Promise<T> {
    return db.isTransaction ? write(db) : db.transaction().execute(write);
}

export function validateDate(date: string): string {
    try { return calendarDate(date); } catch { throw new ScheduleError('invalid_date'); }
}
export function instant(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new ScheduleError('invalid_instant');
    validateDate(value.slice(0, 10));
    return new Date(value).toISOString();
}
export function boundedNote(value: string): string {
    if (value.length > 5000) throw new ScheduleError('invalid_text');
    return value.trim();
}

export class ScheduleService {
    constructor(readonly db: ScheduleDb) {}

    async row(stableId: string, activityId: string): Promise<ActivityRow> {
        const row = await this.db.selectFrom('stable_activities').selectAll().where('stable_id', '=', stableId).where('id', '=', activityId).executeTakeFirst();
        if (!row) throw new NotFoundError('Activity not found');
        return row;
    }

    async operation(actorId: string, stableId: string, requestId: string, payload: unknown, write: () => Promise<string[]>): Promise<string[]> {
        await new StableService(this.db).requireMember(actorId, stableId);
        text(requestId, 100);
        const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
        const existing = await this.db.selectFrom('schedule_operations').selectAll().where('stable_id', '=', stableId).where('request_id', '=', requestId).executeTakeFirst();
        if (existing) {
            if (existing.actor_id !== actorId || existing.fingerprint !== fingerprint) throw new ScheduleError('request_conflict');
            return JSON.parse(existing.result_json) as string[];
        }
        const ids = await write();
        await this.db.insertInto('schedule_operations').values({ stable_id: stableId, request_id: requestId, actor_id: actorId, fingerprint, result_json: JSON.stringify(ids), created_at: new Date().toISOString() }).execute();
        return ids;
    }

    async members(stableId: string, ids: string[]): Promise<string[]> {
        const unique = [...new Set(ids)];
        if (unique.length > 50) throw new ScheduleError('invalid_members');
        if (!unique.length) return [];
        const rows = await this.db.selectFrom('stable_members').select('user_id').where('stable_id', '=', stableId).where('user_id', 'in', unique).where('ended_at', 'is', null).execute();
        if (rows.length !== unique.length) throw new ScheduleError('member_inactive');
        return unique;
    }

    async validatePlanning(actorId: string, stableId: string, input: Omit<CreateActivityInput, 'requestId'>, allowTypeId?: string) {
        const stableSvc = new StableService(this.db), role = await stableSvc.requireMember(actorId, stableId);
        const type = await this.db.selectFrom('stable_activity_types').selectAll().where('id', '=', input.typeId).where('stable_id', '=', stableId).executeTakeFirst();
        if (!type || (type.archived_at && type.id !== allowTypeId)) throw new ScheduleError('type_inactive');
        const horseId = input.horseId || null;
        if (horseId) await stableSvc.requireHorse(stableId, horseId);
        if ((type.scope === 'horse' && !horseId) || (type.scope === 'stable' && horseId) || (type.category === 'training' && !horseId)) throw new ScheduleError('invalid_scope');
        const assignees = await this.members(stableId, input.assigneeIds ?? []);
        if (role !== 'admin' && (!horseId || assignees.length !== 1 || assignees[0] !== actorId)) throw new ForbiddenError('Members may plan their own horse activities');
        validateDate(input.date);
        const stable = await this.db.selectFrom('stables').select('time_zone').where('id', '=', stableId).executeTakeFirstOrThrow();
        if (input.time) {
            try { zonedInstant(input.date, input.time, stable.time_zone, input.offsetMinutes); }
            catch (error) { throw new ScheduleError(error instanceof Error ? error.message : 'invalid_time'); }
        }
        const trainingStudentId = type.category === 'training' ? input.trainingStudentId || (assignees.length === 1 ? assignees[0]! : null) : null;
        if (type.category === 'training' && ((trainingStudentId && !assignees.includes(trainingStudentId)) || (!trainingStudentId && assignees.length))) throw new ScheduleError('training_student_required');
        return { type, role, horseId, assignees, trainingStudentId, title: text(input.title) };
    }

    async create(actorId: string, stableId: string, input: CreateActivityInput): Promise<Activity> {
        return scheduleTransaction(this.db, async db => {
            const svc = new ScheduleService(db);
            const ids = await svc.operation(actorId, stableId, input.requestId, { kind: 'create', input }, async () => [await svc.insertActivity(actorId, stableId, input)]);
            return svc.get(actorId, stableId, ids[0]!);
        });
    }

    async insertActivity(actorId: string, stableId: string, input: Omit<CreateActivityInput, 'requestId'>): Promise<string> {
        const validated = await this.validatePlanning(actorId, stableId, input);
        const now = new Date().toISOString(), id = crypto.randomUUID(), completed = input.status === 'completed';
        const performerIds = completed ? await this.members(stableId, input.performerIds?.length ? input.performerIds : [actorId]) : [];
        await this.db.insertInto('stable_activities').values({
            id, stable_id: stableId, type_id: input.typeId, horse_id: validated.horseId, title: validated.title,
            scheduled_date: input.date, scheduled_time: input.time || null, scheduled_offset_min: input.offsetMinutes ?? null,
            instruction: boundedNote(input.instruction ?? ''), status: completed ? 'completed' : 'planned', result_note: boundedNote(input.resultNote ?? ''),
            performed_at: completed ? instant(input.performedAt ?? now) : null, completed_at: completed ? now : null, completed_by: completed ? actorId : null,
            created_by: actorId, updated_by: actorId, created_at: now, updated_at: now, version: 1,
            training_student_id: validated.trainingStudentId, training_session_id: null,
        }).execute();
        if (validated.assignees.length) await this.db.insertInto('stable_activity_assignees').values(validated.assignees.map(userId => ({ activity_id: id, user_id: userId }))).execute();
        if (performerIds.length) await this.db.insertInto('stable_activity_performers').values(performerIds.map(userId => ({ activity_id: id, user_id: userId }))).execute();
        if (input.programIds?.length || input.exerciseIds?.length) await this.setContent(actorId, id, validated.trainingStudentId, input.programIds ?? [], input.exerciseIds ?? []);
        return id;
    }

    async get(actorId: string, stableId: string, activityId: string): Promise<Activity> {
        const stable = await new StableService(this.db).detail(actorId, stableId);
        return (await this.views(actorId, stable, [await this.row(stableId, activityId)]))[0]!;
    }

    async week(actorId: string, stableId: string, startDate: string): Promise<ScheduleWeek> {
        validateDate(startDate);
        if (mondayOf(startDate) !== startDate) throw new ScheduleError('monday_required');
        const stable = await new StableService(this.db).detail(actorId, stableId);
        const rows = await this.db.selectFrom('stable_activities').selectAll().where('stable_id', '=', stableId)
            .where('scheduled_date', '>=', startDate).where('scheduled_date', '<', addDays(startDate, 7)).orderBy('scheduled_date').orderBy('scheduled_time').orderBy('id').execute();
        const activities = await this.views(actorId, stable, rows);
        return { stable, startDate, activities, total: activities.length, completed: activities.filter(a => a.status === 'completed').length, unassigned: activities.filter(a => a.status !== 'cancelled' && !a.assigneeIds.length).length };
    }

    async views(actorId: string, stable: Awaited<ReturnType<StableService['detail']>>, rows: ActivityRow[]): Promise<Activity[]> {
        if (!rows.length) return [];
        const ids = rows.map(r => r.id);
        const [assignees, performers, programs, exercises, teachers, trainingShares] = await Promise.all([
            this.db.selectFrom('stable_activity_assignees').selectAll().where('activity_id', 'in', ids).execute(),
            this.db.selectFrom('stable_activity_performers').selectAll().where('activity_id', 'in', ids).execute(),
            this.db.selectFrom('stable_activity_programs').innerJoin('programs', 'programs.id', 'stable_activity_programs.program_id').selectAll('stable_activity_programs').select('programs.teacher_id').where('activity_id', 'in', ids).execute(),
            this.db.selectFrom('stable_activity_exercises').innerJoin('exercises', 'exercises.id', 'stable_activity_exercises.exercise_id').selectAll('stable_activity_exercises').select('exercises.teacher_id').where('activity_id', 'in', ids).execute(),
            this.db.selectFrom('relations').select('teacher_id').where('student_id', '=', actorId).execute(),
            this.db.selectFrom('training_session_share').select('training_session_id').where('teacher_id', '=', actorId).execute(),
        ]);
        const visibleAuthors = new Set([actorId, ...teachers.map(t => t.teacher_id)]);
        return rows.map(row => {
            const assigned = assignees.filter(a => a.activity_id === row.id).map(a => a.user_id);
            const horseInactive = !!row.horse_id && !stable.horses.some(h => h.id === row.horse_id && h.active);
            const ownsTraining = row.training_student_id === actorId;
            const canViewTraining = ownsTraining || trainingShares.some(s => s.training_session_id === row.training_session_id);
            return {
                id: row.id, stableId: row.stable_id, typeId: row.type_id, category: stable.types.find(t => t.id === row.type_id)!.category,
                horseId: row.horse_id, title: row.title, date: row.scheduled_date, time: row.scheduled_time, offsetMinutes: row.scheduled_offset_min,
                instruction: row.instruction, status: row.status, resultNote: row.result_note, performedAt: row.performed_at,
                completedAt: row.completed_at, completedBy: row.completed_by, createdBy: row.created_by, updatedBy: row.updated_by, version: row.version,
                assigneeIds: assigned, performerIds: performers.filter(a => a.activity_id === row.id).map(a => a.user_id), horseInactive,
                trainingStudentId: row.training_student_id, trainingSessionId: canViewTraining ? row.training_session_id : null, hasTrainingSession: !!row.training_session_id,
                hasProgram: programs.some(p => p.activity_id === row.id),
                programs: programs.filter(p => p.activity_id === row.id && visibleAuthors.has(p.teacher_id)).map(p => ({ id: p.program_id, title: p.title })),
                exercises: exercises.filter(e => e.activity_id === row.id && visibleAuthors.has(e.teacher_id)).map(e => ({ exerciseId: e.exercise_id, sourceProgramId: e.source_program_id, name: e.name, description: e.description, notes: e.notes, sortOrder: e.sort_order })),
                canEdit: stable.role === 'admin' || (!!row.horse_id && row.created_by === actorId && assigned.length === 1 && assigned[0] === actorId),
                canComplete: stable.role === 'admin' || assigned.includes(actorId),
                canClaim: row.status === 'planned' && !assigned.length && !horseInactive,
                canRegisterTraining: ownsTraining && row.status !== 'cancelled' && !horseInactive && assigned.includes(actorId),
            };
        });
    }

    async cas(row: ActivityRow, actorId: string, version: number, patch: Partial<ActivityRow>): Promise<void> {
        const changed = await this.db.updateTable('stable_activities').set({ ...patch, updated_by: actorId, updated_at: new Date().toISOString(), version: row.version + 1 })
            .where('id', '=', row.id).where('stable_id', '=', row.stable_id).where('version', '=', version).returning('id').executeTakeFirst();
        if (!changed) throw new ScheduleError('version_conflict');
    }

    async update(actorId: string, stableId: string, activityId: string, input: UpdateActivityInput): Promise<Activity> {
        return scheduleTransaction(this.db, async db => {
            const svc = new ScheduleService(db), role = await new StableService(db).requireMember(actorId, stableId), row = await svc.row(stableId, activityId);
            const assignees = await db.selectFrom('stable_activity_assignees').select('user_id').where('activity_id', '=', activityId).execute();
            const outcomeOnly = Object.keys(input).every(key => ['version', 'resultNote', 'performedAt', 'performerIds', 'stableId', 'activityId'].includes(key));
            const canPlan = !!row.horse_id && row.created_by === actorId && assignees.length === 1 && assignees[0]!.user_id === actorId;
            if (role !== 'admin' && !canPlan && !(outcomeOnly && assignees.some(a => a.user_id === actorId))) throw new ForbiddenError('Activity owner or administrator required');
            if ((input.performedAt !== undefined || input.performerIds !== undefined) && row.status !== 'completed') throw new ScheduleError('invalid_scope');
            const correctedPerformers = input.performerIds !== undefined ? await svc.members(stableId, input.performerIds) : null;
            const planning = {
                typeId: input.typeId ?? row.type_id, horseId: input.horseId === undefined ? row.horse_id : input.horseId,
                title: input.title ?? row.title, date: input.date ?? row.scheduled_date, time: input.time === undefined ? row.scheduled_time : input.time,
                offsetMinutes: input.offsetMinutes === undefined ? row.scheduled_offset_min : input.offsetMinutes, instruction: input.instruction ?? row.instruction,
                assigneeIds: input.assigneeIds ?? assignees.map(a => a.user_id), trainingStudentId: input.trainingStudentId === undefined ? row.training_student_id : input.trainingStudentId,
            };
            // Historical assignees remain valid when editing only the outcome; new planning must use active members.
            const planningChanged = ['typeId', 'horseId', 'title', 'date', 'time', 'offsetMinutes', 'instruction', 'assigneeIds', 'trainingStudentId', 'programIds', 'exerciseIds'].some(key => key in input);
            if (planningChanged && row.training_session_id && (planning.horseId !== row.horse_id || planning.trainingStudentId !== row.training_student_id || planning.typeId !== row.type_id)) throw new ScheduleError('training_already_linked');
            const validated = planningChanged ? await svc.validatePlanning(actorId, stableId, planning, row.type_id) : null;
            if (validated?.type.category === 'training' && validated.trainingStudentId !== row.training_student_id && input.programIds === undefined && input.exerciseIds === undefined) {
                const programs = await db.selectFrom('stable_activity_programs').select('program_id').where('activity_id', '=', activityId).execute();
                const exercises = await db.selectFrom('stable_activity_exercises').select('exercise_id').where('activity_id', '=', activityId).execute();
                await svc.checkContent(actorId, stableId, validated.trainingStudentId, programs.map(p => p.program_id), exercises.map(e => e.exercise_id), true);
            }
            await svc.cas(row, actorId, input.version, {
                ...(validated ? { type_id: planning.typeId, horse_id: validated.horseId, title: validated.title, scheduled_date: planning.date, scheduled_time: planning.time || null, scheduled_offset_min: planning.offsetMinutes ?? null, instruction: boundedNote(planning.instruction), training_student_id: validated.trainingStudentId } : {}),
                ...(input.resultNote !== undefined ? { result_note: boundedNote(input.resultNote) } : {}),
                ...(input.performedAt !== undefined ? { performed_at: instant(input.performedAt) } : {}),
            });
            if (correctedPerformers) {
                await db.deleteFrom('stable_activity_performers').where('activity_id', '=', activityId).execute();
                if (correctedPerformers.length) await db.insertInto('stable_activity_performers').values(correctedPerformers.map(userId => ({ activity_id: activityId, user_id: userId }))).execute();
            }
            if (input.assigneeIds) {
                await db.deleteFrom('stable_activity_assignees').where('activity_id', '=', activityId).execute();
                if (validated!.assignees.length) await db.insertInto('stable_activity_assignees').values(validated!.assignees.map(userId => ({ activity_id: activityId, user_id: userId }))).execute();
            }
            if (validated && validated.type.category !== 'training') {
                if (input.programIds?.length || input.exerciseIds?.length) throw new ScheduleError('invalid_scope');
                await db.deleteFrom('stable_activity_exercises').where('activity_id', '=', activityId).execute();
                await db.deleteFrom('stable_activity_programs').where('activity_id', '=', activityId).execute();
            } else if (input.programIds !== undefined || input.exerciseIds !== undefined) await svc.setContent(actorId, activityId, validated?.trainingStudentId ?? row.training_student_id, input.programIds ?? [], input.exerciseIds ?? []);
            return svc.get(actorId, stableId, activityId);
        });
    }

    async transition(actorId: string, stableId: string, activityId: string, status: ActivityStatus, input: CompleteActivityInput): Promise<Activity> {
        return scheduleTransaction(this.db, async db => {
            const svc = new ScheduleService(db), role = await new StableService(db).requireMember(actorId, stableId), row = await svc.row(stableId, activityId);
            const assignees = await db.selectFrom('stable_activity_assignees').select('user_id').where('activity_id', '=', activityId).execute();
            if (role !== 'admin' && !assignees.some(a => a.user_id === actorId)) throw new ForbiddenError('Activity assignee required');
            if (row.status === status && status === 'completed') return svc.get(actorId, stableId, activityId);
            if (status === 'completed' && row.horse_id) await new StableService(db).requireHorse(stableId, row.horse_id);
            const performerIds = status === 'completed' ? await svc.members(stableId, input.performerIds?.length ? input.performerIds : [actorId]) : [];
            const now = new Date().toISOString();
            await svc.cas(row, actorId, input.version, {
                status, performed_at: status === 'completed' ? instant(input.performedAt ?? now) : null,
                completed_at: status === 'completed' ? now : null, completed_by: status === 'completed' ? actorId : null,
                ...(input.resultNote !== undefined ? { result_note: boundedNote(input.resultNote) } : {}),
            });
            await db.deleteFrom('stable_activity_performers').where('activity_id', '=', activityId).execute();
            if (performerIds.length) await db.insertInto('stable_activity_performers').values(performerIds.map(userId => ({ activity_id: activityId, user_id: userId }))).execute();
            return svc.get(actorId, stableId, activityId);
        });
    }

    async claim(actorId: string, stableId: string, activityId: string, version: number): Promise<Activity> {
        return scheduleTransaction(this.db, async db => {
            const svc = new ScheduleService(db);
            await new StableService(db).requireMember(actorId, stableId);
            const row = await svc.row(stableId, activityId);
            const assigned = await db.selectFrom('stable_activity_assignees').select('user_id').where('activity_id', '=', activityId).execute();
            if (assigned.length || row.status !== 'planned') throw new ScheduleError('already_assigned');
            if (row.horse_id) await new StableService(db).requireHorse(stableId, row.horse_id);
            await svc.cas(row, actorId, version, {});
            await db.insertInto('stable_activity_assignees').values({ activity_id: activityId, user_id: actorId }).execute();
            return svc.get(actorId, stableId, activityId);
        });
    }

    async log(actorId: string, stableId: string, horseId: string, input: LogInput): Promise<HorseLog> {
        const stable = await new StableService(this.db).detail(actorId, stableId), horse = stable.horses.find(h => h.id === horseId);
        if (!horse) throw new NotFoundError('Horse not found');
        let query = this.db.selectFrom('stable_activities').selectAll().where('stable_id', '=', stableId).where('horse_id', '=', horseId).where('status', '=', 'completed');
        const limit = Math.min(100, Math.max(1, input.limit ?? 20));
        if (input.from) query = query.where('performed_at', '>=', zonedInstant(validateDate(input.from), '00:00', stable.timeZone));
        if (input.to) query = query.where('performed_at', '<', zonedInstant(addDays(validateDate(input.to), 1), '00:00', stable.timeZone));
        if (input.cursor) {
            let cursor: { time: string; id: string };
            try { cursor = JSON.parse(Buffer.from(input.cursor, 'base64url').toString()); instant(cursor.time); text(cursor.id, 100); } catch { throw new ScheduleError('invalid_cursor'); }
            query = query.where(eb => eb.or([eb('performed_at', '<', cursor.time), eb.and([eb('performed_at', '=', cursor.time), eb('id', '<', cursor.id)])]));
        }
        const rows = await query.orderBy('performed_at', 'desc').orderBy('id', 'desc').limit(limit + 1).execute();
        const page = rows.slice(0, limit), last = page.at(-1);
        return { horse, stableName: stable.name, timeZone: stable.timeZone, items: await this.views(actorId, stable, page), nextCursor: rows.length > limit && last ? Buffer.from(JSON.stringify({ time: last.performed_at, id: last.id })).toString('base64url') : null };
    }

    async finish(actorId: string, stableId: string, activityId: string, input: CompleteActivityInput & { patch?: Omit<UpdateActivityInput, 'version'> }): Promise<Activity> {
        return scheduleTransaction(this.db, async db => {
            const svc = new ScheduleService(db);
            let version = input.version;
            if (input.patch && Object.keys(input.patch).length) version = (await svc.update(actorId, stableId, activityId, { ...input.patch, version })).version;
            return svc.transition(actorId, stableId, activityId, 'completed', { ...input, version });
        });
    }

    async setContent(actorId: string, activityId: string, studentId: string | null, programIds: string[], exerciseIds: string[]): Promise<void> {
        const row = await this.db.selectFrom('stable_activities').select(['stable_id', 'type_id']).where('id', '=', activityId).executeTakeFirstOrThrow();
        const type = await this.db.selectFrom('stable_activity_types').select('category').where('id', '=', row.type_id).executeTakeFirstOrThrow();
        if (type.category !== 'training' && (programIds.length || exerciseIds.length)) throw new ScheduleError('invalid_scope');
        await this.checkContent(actorId, row.stable_id, studentId, programIds, exerciseIds);
        await this.db.deleteFrom('stable_activity_exercises').where('activity_id', '=', activityId).execute();
        await this.db.deleteFrom('stable_activity_programs').where('activity_id', '=', activityId).execute();
        if (programIds.length) {
            const programs = await this.db.selectFrom('programs').select(['id', 'title']).where('id', 'in', [...new Set(programIds)]).execute();
            await this.db.insertInto('stable_activity_programs').values(programs.map(p => ({ activity_id: activityId, program_id: p.id, title: p.title }))).execute();
        }
        const programRows = programIds.length ? await this.db.selectFrom('program_exercise').innerJoin('exercises', 'exercises.id', 'program_exercise.exercise_id')
            .select(['exercises.id', 'exercises.name', 'exercises.description', 'program_exercise.program_id', 'program_exercise.notes', 'exercises.archived_at'])
            .where('program_id', 'in', programIds).orderBy('program_exercise.program_id').orderBy('program_exercise.sort_order').execute() : [];
        const freeRows = exerciseIds.length ? await this.db.selectFrom('exercises').selectAll().where('id', 'in', exerciseIds).execute() : [];
        const used = new Set<string>();
        const snapshots = [...programRows.filter(e => !e.archived_at).map(e => ({ exercise_id: e.id, source_program_id: e.program_id as string | null, name: e.name, description: e.description, notes: e.notes })),
            ...freeRows.map(e => ({ exercise_id: e.id, source_program_id: null as string | null, name: e.name, description: e.description, notes: null as string | null }))]
            .filter(e => !used.has(e.exercise_id) && !!used.add(e.exercise_id));
        if (snapshots.length) await this.db.insertInto('stable_activity_exercises').values(snapshots.map((e, index) => ({ ...e, id: crypto.randomUUID(), activity_id: activityId, sort_order: index }))).execute();
    }

    async catalog(actorId: string, stableId: string, studentId?: string | null, includeArchived = false): Promise<ScheduleCatalog> {
        const role = await new StableService(this.db).requireMember(actorId, stableId);
        if (studentId) await this.members(stableId, [studentId]);
        if (role !== 'admin' && studentId && studentId !== actorId) throw new ForbiddenError('Own training catalog required');
        const authors = async (userId: string) => new Set([userId, ...(await this.db.selectFrom('relations').select('teacher_id').where('student_id', '=', userId).execute()).map(r => r.teacher_id)]);
        const a = await authors(actorId), b = await authors(studentId || actorId), common = [...a].filter(id => b.has(id));
        if (!common.length) return { programs: [], exercises: [] };
        const [programs, exercises] = await Promise.all([
            this.db.selectFrom('programs').innerJoin('users', 'users.id', 'programs.teacher_id').select(['programs.id', 'programs.title', 'users.display_name']).where('teacher_id', 'in', common).$if(!includeArchived, q => q.where('archived_at', 'is', null)).orderBy('programs.title').execute(),
            this.db.selectFrom('exercises').innerJoin('users', 'users.id', 'exercises.teacher_id').select(['exercises.id', 'exercises.name', 'users.display_name']).where('teacher_id', 'in', common).$if(!includeArchived, q => q.where('archived_at', 'is', null)).orderBy('exercises.name').execute(),
        ]);
        return { programs: programs.map(p => ({ id: p.id, title: p.title, author: p.display_name })), exercises: exercises.map(e => ({ id: e.id, name: e.name, author: e.display_name })) };
    }

    async checkContent(actorId: string, stableId: string, studentId: string | null, programIds: string[], exerciseIds: string[], includeArchived = false): Promise<void> {
        if (programIds.length > 20 || exerciseIds.length > 100) throw new ScheduleError('invalid_content');
        if (!programIds.length && !exerciseIds.length) return;
        const catalog = await this.catalog(actorId, stableId, studentId, includeArchived);
        if (programIds.some(id => !catalog.programs.some(p => p.id === id)) || exerciseIds.some(id => !catalog.exercises.some(e => e.id === id))) throw new ScheduleError('catalog_unavailable');
    }
}

export interface ScheduleCatalog { programs: { id: string; title: string; author: string }[]; exercises: { id: string; name: string; author: string }[] }
