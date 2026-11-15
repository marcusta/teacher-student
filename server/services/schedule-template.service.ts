import { createHash } from 'node:crypto';
import type { Selectable } from 'kysely';
import type { ScheduleDatabase } from '../db/schedule-schema';
import { addDays, mondayOf } from '../../shared/schedule-calendar';
import { ScheduleService, validateDate, type ScheduleDb } from './schedule.service';
import type { CreateActivityInput } from './schedule.types';
import { StableService } from './stable.service';
import { ScheduleError, text } from './schedule-errors';
import { NotFoundError } from '@basics/core/server/auth';

type Snapshot = { programs: { program_id: string; title: string }[]; exercises: { exercise_id: string; source_program_id: string | null; name: string; description: string; notes: string | null; sort_order: number }[] };
type Planned = Omit<CreateActivityInput, 'requestId'> & { content: Snapshot };
export interface CopyScheduleInput { requestId: string; sourceDate: string; targetDates: string[]; week?: boolean; keepAssignees: boolean; preview?: boolean; sourceVersion?: string }
export interface ScheduleCopyResult { count: number; sourceCount: number; sourceVersion: string; createdIds: string[] }
export interface ScheduleTemplate { id: string; name: string; count: number }

export class ScheduleTemplateService {
    constructor(private db: ScheduleDb) {}

    async snapshot(activityId: string): Promise<Snapshot> {
        const [programs, exercises] = await Promise.all([
            this.db.selectFrom('stable_activity_programs').select(['program_id', 'title']).where('activity_id', '=', activityId).execute(),
            this.db.selectFrom('stable_activity_exercises').select(['exercise_id', 'source_program_id', 'name', 'description', 'notes', 'sort_order']).where('activity_id', '=', activityId).orderBy('sort_order').execute(),
        ]);
        return { programs, exercises };
    }

    async planning(row: Selectable<ScheduleDatabase['stable_activities']>, date: string, keep: boolean): Promise<Planned> {
        const assignees = keep ? (await this.db.selectFrom('stable_activity_assignees').select('user_id').where('activity_id', '=', row.id).execute()).map(a => a.user_id) : [];
        return { typeId: row.type_id, horseId: row.horse_id, title: row.title, date, time: row.scheduled_time,
            offsetMinutes: null, instruction: row.instruction, assigneeIds: assignees, trainingStudentId: keep ? row.training_student_id : null,
            content: await this.snapshot(row.id) };
    }

    async validate(actorId: string, stableId: string, plans: Planned[]): Promise<void> {
        if (plans.length > 2000) throw new ScheduleError('too_many_activities');
        const svc = new ScheduleService(this.db);
        for (const plan of plans) {
            await svc.validatePlanning(actorId, stableId, plan);
            await svc.checkContent(actorId, stableId, plan.trainingStudentId ?? null, plan.content.programs.map(p => p.program_id), plan.content.exercises.map(e => e.exercise_id));
        }
    }

    async write(actorId: string, stableId: string, plans: Planned[]): Promise<string[]> {
        await this.validate(actorId, stableId, plans);
        const svc = new ScheduleService(this.db), ids: string[] = [];
        for (const plan of plans) {
            const id = await svc.insertActivity(actorId, stableId, plan);
            if (plan.content.programs.length) await this.db.insertInto('stable_activity_programs').values(plan.content.programs.map(p => ({ ...p, activity_id: id }))).execute();
            if (plan.content.exercises.length) await this.db.insertInto('stable_activity_exercises').values(plan.content.exercises.map(e => ({ ...e, id: crypto.randomUUID(), activity_id: id }))).execute();
            ids.push(id);
        }
        return ids;
    }

    async copy(actorId: string, stableId: string, input: CopyScheduleInput): Promise<ScheduleCopyResult> {
        return this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            validateDate(input.sourceDate);
            const targets = [...new Set(input.targetDates)];
            if (!targets.length || targets.length > 14 || targets.includes(input.sourceDate)) throw new ScheduleError('invalid_targets');
            targets.forEach(validateDate);
            if (input.week && [input.sourceDate, ...targets].some(d => mondayOf(d) !== d)) throw new ScheduleError('monday_required');
            const rows = await db.selectFrom('stable_activities').selectAll().where('stable_id', '=', stableId)
                .where('scheduled_date', '>=', input.sourceDate).where('scheduled_date', '<', addDays(input.sourceDate, input.week ? 7 : 1)).orderBy('id').execute();
            const sourceVersion = createHash('sha256').update(JSON.stringify(rows.map(r => [r.id, r.version]))).digest('hex');
            const svc = new ScheduleTemplateService(db), count = rows.length * targets.length;
            const execute = async () => {
                if (input.sourceVersion && input.sourceVersion !== sourceVersion) throw new ScheduleError('source_changed');
                const plans: Planned[] = [];
                for (const target of targets) for (const row of rows) {
                    const weekday = input.week ? Math.round((Date.parse(row.scheduled_date + 'T12:00Z') - Date.parse(input.sourceDate + 'T12:00Z')) / 86400000) : 0;
                    plans.push(await svc.planning(row, addDays(target, weekday), input.keepAssignees));
                }
                await svc.validate(actorId, stableId, plans);
                return input.preview ? [] : svc.write(actorId, stableId, plans);
            };
            const createdIds = input.preview ? await execute() : await new ScheduleService(db).operation(actorId, stableId, input.requestId, { kind: 'copy', input }, execute);
            return { count: input.preview ? count : createdIds.length, sourceCount: rows.length, sourceVersion, createdIds };
        });
    }

    async list(actorId: string, stableId: string): Promise<ScheduleTemplate[]> {
        await new StableService(this.db).requireMember(actorId, stableId);
        const rows = await this.db.selectFrom('schedule_templates').leftJoin('schedule_template_items', 'schedule_template_items.template_id', 'schedule_templates.id')
            .select(['schedule_templates.id', 'schedule_templates.name']).select(({ fn }) => fn.count<number>('schedule_template_items.id').as('count'))
            .where('schedule_templates.stable_id', '=', stableId).groupBy(['schedule_templates.id', 'schedule_templates.name']).orderBy('schedule_templates.name').execute();
        return rows.map(r => ({ id: r.id, name: r.name, count: Number(r.count) }));
    }

    async save(actorId: string, stableId: string, input: { requestId: string; name: string; startDate: string }): Promise<ScheduleTemplate> {
        return this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            if (mondayOf(validateDate(input.startDate)) !== input.startDate) throw new ScheduleError('monday_required');
            const svc = new ScheduleTemplateService(db);
            const ids = await new ScheduleService(db).operation(actorId, stableId, input.requestId, { kind: 'save-template', input }, async () => {
                const rows = await db.selectFrom('stable_activities').selectAll().where('stable_id', '=', stableId).where('scheduled_date', '>=', input.startDate).where('scheduled_date', '<', addDays(input.startDate, 7)).orderBy('id').execute();
                const plans = await Promise.all(rows.map(r => svc.planning(r, r.scheduled_date, true)));
                await svc.validate(actorId, stableId, plans);
                const id = crypto.randomUUID();
                await db.insertInto('schedule_templates').values({ id, stable_id: stableId, name: text(input.name), created_by: actorId, created_at: new Date().toISOString() }).execute();
                for (const [index, plan] of plans.entries()) {
                    const itemId = crypto.randomUUID(), weekday = Math.round((Date.parse(plan.date + 'T12:00Z') - Date.parse(input.startDate + 'T12:00Z')) / 86400000);
                    await db.insertInto('schedule_template_items').values({ id: itemId, template_id: id, weekday, type_id: plan.typeId, horse_id: plan.horseId ?? null, title: plan.title, scheduled_time: plan.time ?? null, instruction: plan.instruction ?? '', training_student_id: plan.trainingStudentId ?? null, content_json: JSON.stringify(plan.content), sort_order: index }).execute();
                    if (plan.assigneeIds?.length) await db.insertInto('schedule_template_assignees').values(plan.assigneeIds.map(userId => ({ item_id: itemId, user_id: userId }))).execute();
                }
                return [id];
            });
            return (await new ScheduleTemplateService(db).list(actorId, stableId)).find(t => t.id === ids[0])!;
        });
    }

    async apply(actorId: string, stableId: string, input: { requestId: string; templateId: string; startDate: string; keepAssignees: boolean }): Promise<ScheduleCopyResult> {
        return this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            if (mondayOf(validateDate(input.startDate)) !== input.startDate) throw new ScheduleError('monday_required');
            const template = await db.selectFrom('schedule_templates').select('id').where('id', '=', input.templateId).where('stable_id', '=', stableId).executeTakeFirst();
            if (!template) throw new NotFoundError('Template not found');
            const svc = new ScheduleTemplateService(db);
            const createdIds = await new ScheduleService(db).operation(actorId, stableId, input.requestId, { kind: 'apply-template', input }, async () => {
                const items = await db.selectFrom('schedule_template_items').selectAll().where('template_id', '=', input.templateId).orderBy('sort_order').execute();
                const plans: Planned[] = [];
                for (const item of items) {
                    const assigned = input.keepAssignees ? (await db.selectFrom('schedule_template_assignees').select('user_id').where('item_id', '=', item.id).execute()).map(a => a.user_id) : [];
                    plans.push({ typeId: item.type_id, horseId: item.horse_id, title: item.title, date: addDays(input.startDate, item.weekday), time: item.scheduled_time, instruction: item.instruction, trainingStudentId: input.keepAssignees ? item.training_student_id : null, assigneeIds: assigned, content: JSON.parse(item.content_json) as Snapshot });
                }
                return svc.write(actorId, stableId, plans);
            });
            return { count: createdIds.length, sourceCount: createdIds.length, sourceVersion: '', createdIds };
        });
    }

    async routines(actorId: string, stableId: string, input: { requestId: string; startDate: string; typeIds: string[] }): Promise<ScheduleCopyResult> {
        return this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            if (mondayOf(validateDate(input.startDate)) !== input.startDate) throw new ScheduleError('monday_required');
            const createdIds = await new ScheduleService(db).operation(actorId, stableId, input.requestId, { kind: 'routines', input }, async () => {
                if (!input.typeIds.length || input.typeIds.length > 30) throw new ScheduleError('invalid_types');
                const types = await db.selectFrom('stable_activity_types').selectAll().where('stable_id', '=', stableId).where('id', 'in', [...new Set(input.typeIds)]).where('archived_at', 'is', null).execute();
                if (types.length !== new Set(input.typeIds).size || types.some(t => t.scope === 'horse')) throw new ScheduleError('type_inactive');
                const plans: Planned[] = [];
                for (let d = 0; d < 7; d++) for (const type of types) plans.push({ typeId: type.id, title: type.name, date: addDays(input.startDate, d), time: type.default_time, assigneeIds: [], content: { programs: [], exercises: [] } });
                return new ScheduleTemplateService(db).write(actorId, stableId, plans);
            });
            return { count: createdIds.length, sourceCount: createdIds.length, sourceVersion: '', createdIds };
        });
    }
}
