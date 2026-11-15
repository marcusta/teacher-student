import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { ScheduleTemplateService } from '../services/schedule-template.service';
import { Id, Ids, DateValue, StablePath } from './schedule.schemas';

const StableInput = Type.Object(StablePath);
const CopyInput = Type.Object({ ...StablePath, requestId: Id, sourceDate: DateValue, targetDates: Type.Array(DateValue, { minItems: 1, maxItems: 14, uniqueItems: true }), week: Type.Optional(Type.Boolean()), keepAssignees: Type.Boolean(), preview: Type.Optional(Type.Boolean()), sourceVersion: Type.Optional(Type.String({ maxLength: 100 })) });
const SaveInput = Type.Object({ ...StablePath, requestId: Id, name: Type.String({ minLength: 1, maxLength: 200 }), startDate: DateValue });
const ApplyInput = Type.Object({ ...StablePath, requestId: Id, templateId: Id, startDate: DateValue, keepAssignees: Type.Boolean() });
const RoutinesInput = Type.Object({ ...StablePath, requestId: Id, startDate: DateValue, typeIds: Ids });

export function createScheduleTemplatesApi(svc: ScheduleTemplateService) {
    return {
        list: { method: 'GET' as const, path: '/stables/:stableId/templates', schema: StableInput, middleware: [requireAuth()], fn: async (_input: Static<typeof StableInput>, c: Context) => svc.list(requireUser(c).id, c.req.param('stableId')!) },
        save: { method: 'POST' as const, path: '/stables/:stableId/templates', schema: SaveInput, middleware: [requireAuth()], fn: async (input: Static<typeof SaveInput>, c: Context) => svc.save(requireUser(c).id, c.req.param('stableId')!, input) },
        apply: { method: 'POST' as const, path: '/stables/:stableId/templates/apply', schema: ApplyInput, middleware: [requireAuth()], fn: async (input: Static<typeof ApplyInput>, c: Context) => svc.apply(requireUser(c).id, c.req.param('stableId')!, input) },
        routines: { method: 'POST' as const, path: '/stables/:stableId/routines', schema: RoutinesInput, middleware: [requireAuth()], fn: async (input: Static<typeof RoutinesInput>, c: Context) => svc.routines(requireUser(c).id, c.req.param('stableId')!, input) },
        copy: { method: 'POST' as const, path: '/stables/:stableId/copy', schema: CopyInput, middleware: [requireAuth()], fn: async (input: Static<typeof CopyInput>, c: Context) => svc.copy(requireUser(c).id, c.req.param('stableId')!, input) },
    };
}
