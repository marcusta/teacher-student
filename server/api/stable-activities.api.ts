import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { ScheduleService } from '../services/schedule.service';
import type { ScheduleTrainingService } from '../services/schedule-training.service';
import { Id, DateValue, NoteValue, Version, StablePath, ActivityPath, PlanningFields, OutcomeFields, UpdateFields } from './schedule.schemas';

const WeekInput = Type.Object({ ...StablePath, startDate: DateValue });
const CreateInput = Type.Object({ ...StablePath, requestId: Id, ...PlanningFields, ...OutcomeFields, status: Type.Optional(Type.Union([Type.Literal('planned'), Type.Literal('completed')])) });
const GetInput = Type.Object(ActivityPath);
const RemoveInput = Type.Object({ ...ActivityPath, version: Version });
const UpdateInput = Type.Intersect([Type.Object({ ...ActivityPath, version: Version }), Type.Partial(Type.Object(UpdateFields))]);
const StateInput = Type.Object({ ...ActivityPath, version: Version, ...OutcomeFields });
const FinishInput = Type.Object({ ...ActivityPath, version: Version, ...OutcomeFields, patch: Type.Optional(Type.Partial(Type.Object(UpdateFields))) });
const LogInput = Type.Object({ ...StablePath, horseId: Id, from: Type.Optional(DateValue), to: Type.Optional(DateValue), cursor: Type.Optional(Type.String({ maxLength: 1000 })), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })) });
const CatalogInput = Type.Object({ ...StablePath, studentId: Type.Optional(Id) });
const TrainingInput = Type.Object({ ...ActivityPath, version: Version, sessionId: Type.Optional(Id), ...OutcomeFields,
    durationMin: Type.Optional(Type.Union([Type.Integer({ minimum: 0, maximum: 1440 }), Type.Null()])), summary: Type.Optional(NoteValue) });

export function createStableActivitiesApi(svc: ScheduleService, training: ScheduleTrainingService) {
    return {
        week: { method: 'GET' as const, path: '/stables/:stableId/week', schema: WeekInput, middleware: [requireAuth()], fn: async (input: Static<typeof WeekInput>, c: Context) => svc.week(requireUser(c).id, c.req.param('stableId')!, input.startDate) },
        create: { method: 'POST' as const, path: '/stables/:stableId/activities', schema: CreateInput, middleware: [requireAuth()], fn: async (input: Static<typeof CreateInput>, c: Context) => svc.create(requireUser(c).id, c.req.param('stableId')!, input) },
        get: { method: 'GET' as const, path: '/stables/:stableId/activities/:activityId', schema: GetInput, middleware: [requireAuth()], fn: async (_input: Static<typeof GetInput>, c: Context) => svc.get(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!) },
        update: { method: 'PATCH' as const, path: '/stables/:stableId/activities/:activityId', schema: UpdateInput, middleware: [requireAuth()], fn: async (input: Static<typeof UpdateInput>, c: Context) => svc.update(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, input) },
        remove: { method: 'POST' as const, path: '/stables/:stableId/activities/:activityId/delete', schema: RemoveInput, middleware: [requireAuth()], fn: async (input: Static<typeof RemoveInput>, c: Context) => svc.remove(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, input.version) },
        complete: { method: 'POST' as const, path: '/stables/:stableId/activities/:activityId/complete', schema: FinishInput, middleware: [requireAuth()], fn: async (input: Static<typeof FinishInput>, c: Context) => svc.finish(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, input) },
        reopen: { method: 'POST' as const, path: '/stables/:stableId/activities/:activityId/reopen', schema: StateInput, middleware: [requireAuth()], fn: async (input: Static<typeof StateInput>, c: Context) => svc.transition(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, 'planned', input) },
        cancel: { method: 'POST' as const, path: '/stables/:stableId/activities/:activityId/cancel', schema: StateInput, middleware: [requireAuth()], fn: async (input: Static<typeof StateInput>, c: Context) => svc.transition(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, 'cancelled', input) },
        claim: { method: 'POST' as const, path: '/stables/:stableId/activities/:activityId/claim', schema: StateInput, middleware: [requireAuth()], fn: async (input: Static<typeof StateInput>, c: Context) => svc.claim(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, input.version) },
        log: { method: 'GET' as const, path: '/stables/:stableId/horses/:horseId/log', schema: LogInput, middleware: [requireAuth()], fn: async (input: Static<typeof LogInput>, c: Context) => svc.log(requireUser(c).id, c.req.param('stableId')!, c.req.param('horseId')!, input) },
        catalog: { method: 'GET' as const, path: '/stables/:stableId/catalog', schema: CatalogInput, middleware: [requireAuth()], fn: async (input: Static<typeof CatalogInput>, c: Context) => svc.catalog(requireUser(c).id, c.req.param('stableId')!, input.studentId) },
        training: { method: 'POST' as const, path: '/stables/:stableId/activities/:activityId/training', schema: TrainingInput, middleware: [requireAuth()], fn: async (input: Static<typeof TrainingInput>, c: Context) => training.register(requireUser(c).id, c.req.param('stableId')!, c.req.param('activityId')!, input) },
    };
}
