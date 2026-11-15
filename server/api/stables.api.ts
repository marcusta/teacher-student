import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { StableService } from '../services/stable.service';
import { Id, StablePath, TimeValue } from './schedule.schemas';

const StableInput = Type.Object(StablePath);
const CreateInput = Type.Object({ name: Type.String({ minLength: 1, maxLength: 200 }), timeZone: Type.Optional(Type.String({ maxLength: 100 })) });
const HorseInput = Type.Object({ ...StablePath, horseId: Id });
const InviteInput = Type.Object({ ...StablePath, inviteeEmail: Type.String({ minLength: 3, maxLength: 254 }) });
const RespondInput = Type.Object({ invitationId: Id, accept: Type.Boolean() });
const RevokeInput = Type.Object({ ...StablePath, invitationId: Id });
const MemberInput = Type.Object({ ...StablePath, userId: Id, role: Type.Union([Type.Literal('admin'), Type.Literal('member')]), remove: Type.Boolean() });
const TypeInput = Type.Object({ ...StablePath, typeId: Type.Optional(Id), name: Type.String({ minLength: 1, maxLength: 200 }),
    category: Type.Union([Type.Literal('routine'), Type.Literal('care'), Type.Literal('training'), Type.Literal('visit'), Type.Literal('other')]),
    scope: Type.Union([Type.Literal('stable'), Type.Literal('horse'), Type.Literal('any')]), defaultTime: Type.Optional(TimeValue), archived: Type.Optional(Type.Boolean()) });

export function createStablesApi(svc: StableService) {
    return {
        list: { method: 'GET' as const, path: '/stables', middleware: [requireAuth()], fn: async (c: Context) => svc.list(requireUser(c).id) },
        create: { method: 'POST' as const, path: '/stables', schema: CreateInput, middleware: [requireAuth()], fn: async (input: Static<typeof CreateInput>, c: Context) => svc.create(requireUser(c).id, input) },
        detail: { method: 'GET' as const, path: '/stables/:stableId', schema: StableInput, middleware: [requireAuth()], fn: async (_input: Static<typeof StableInput>, c: Context) => svc.detail(requireUser(c).id, c.req.param('stableId')!) },
        attachHorse: { method: 'POST' as const, path: '/stables/:stableId/horses', schema: HorseInput, middleware: [requireAuth()], fn: async (input: Static<typeof HorseInput>, c: Context) => { await svc.attachHorse(requireUser(c).id, c.req.param('stableId')!, input.horseId); return { ok: true }; } },
        detachHorse: { method: 'DELETE' as const, path: '/stables/:stableId/horses/:horseId', schema: HorseInput, middleware: [requireAuth()], fn: async (_input: Static<typeof HorseInput>, c: Context) => { await svc.detachHorse(requireUser(c).id, c.req.param('stableId')!, c.req.param('horseId')!); return { ok: true }; } },
        invite: { method: 'POST' as const, path: '/stables/:stableId/invitations', schema: InviteInput, middleware: [requireAuth()], fn: async (input: Static<typeof InviteInput>, c: Context) => svc.invite(requireUser(c).id, c.req.param('stableId')!, input.inviteeEmail) },
        inbox: { method: 'GET' as const, path: '/stable-invitations/inbox', middleware: [requireAuth()], fn: async (c: Context) => svc.inbox(requireUser(c).id) },
        respond: { method: 'POST' as const, path: '/stable-invitations/:invitationId/respond', schema: RespondInput, middleware: [requireAuth()], fn: async (input: Static<typeof RespondInput>, c: Context) => { await svc.respond(requireUser(c).id, c.req.param('invitationId')!, input.accept); return { ok: true }; } },
        revoke: { method: 'POST' as const, path: '/stables/:stableId/invitations/:invitationId/revoke', schema: RevokeInput, middleware: [requireAuth()], fn: async (_input: Static<typeof RevokeInput>, c: Context) => { await svc.revoke(requireUser(c).id, c.req.param('stableId')!, c.req.param('invitationId')!); return { ok: true }; } },
        member: { method: 'PATCH' as const, path: '/stables/:stableId/members/:userId', schema: MemberInput, middleware: [requireAuth()], fn: async (input: Static<typeof MemberInput>, c: Context) => { await svc.setMember(requireUser(c).id, c.req.param('stableId')!, c.req.param('userId')!, input.role, input.remove); return { ok: true }; } },
        saveType: { method: 'POST' as const, path: '/stables/:stableId/activity-types', schema: TypeInput, middleware: [requireAuth()], fn: async (input: Static<typeof TypeInput>, c: Context) => { await svc.saveType(requireUser(c).id, c.req.param('stableId')!, input); return { ok: true }; } },
    };
}
