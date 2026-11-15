import type { Kysely } from 'kysely';
import { NotFoundError, ForbiddenError } from '@basics/core/server/auth';
import type { Database } from '../db/schema';
import type { StableRole, ActivityCategory } from '../db/schedule-schema';
import { ScheduleError, text } from './schedule-errors';

export interface StableSummary { id: string; name: string; timeZone: string; role: StableRole }
export interface StableMember { userId: string; displayName: string; role: StableRole; active: boolean }
export interface StableHorse { id: string; name: string; ownerId: string; active: boolean }
export interface ActivityType { id: string; name: string; code: string | null; category: ActivityCategory; scope: 'stable' | 'horse' | 'any'; defaultTime: string | null; sortOrder: number; archived: boolean }
export interface StableInvitation { id: string; stableId: string; stableName: string; inviteeEmail: string; status: string; expiresAt: string }
export interface StableDetail extends StableSummary { members: StableMember[]; horses: StableHorse[]; types: ActivityType[]; invitations: StableInvitation[] }

export const DEFAULT_ACTIVITY_TYPES = [
    ['morning_feed', 'Morgonfodring', 'routine', 'stable', '06:30'],
    ['turnout', 'Utsläpp', 'routine', 'stable', '08:00'],
    ['lunch_feed', 'Lunchfodring', 'routine', 'stable', '12:00'],
    ['bring_in', 'Insläpp', 'routine', 'stable', '16:00'],
    ['evening_feed', 'Kvällsfodring', 'routine', 'stable', '20:00'],
    ['care', 'Markservice', 'care', 'horse', null],
    ['training', 'Träning', 'training', 'horse', null],
    ['vet', 'Veterinär', 'visit', 'horse', null],
    ['farrier', 'Hovslagare', 'visit', 'horse', null],
    ['custom', 'Egen aktivitet', 'other', 'any', null],
] as const;

export class StableService {
    constructor(private db: Kysely<Database>) {}

    async requireMember(actorId: string, stableId: string, admin = false): Promise<StableRole> {
        const member = await this.db.selectFrom('stable_members').select('role')
            .where('stable_id', '=', stableId).where('user_id', '=', actorId).where('ended_at', 'is', null).executeTakeFirst();
        if (!member) throw new NotFoundError('Stable not found');
        if (admin && member.role !== 'admin') throw new ForbiddenError('Stable administrator required');
        return member.role;
    }

    async create(actorId: string, input: { name: string; timeZone?: string }): Promise<StableSummary> {
        const name = text(input.name), timeZone = input.timeZone ?? 'Europe/Stockholm';
        try { new Intl.DateTimeFormat('sv-SE', { timeZone }).format(); } catch { throw new ScheduleError('invalid_time_zone'); }
        return this.db.transaction().execute(async db => {
            const id = crypto.randomUUID(), now = new Date().toISOString();
            await db.insertInto('stables').values({ id, name, time_zone: timeZone, created_by: actorId }).execute();
            await db.insertInto('stable_members').values({ stable_id: id, user_id: actorId, role: 'admin', joined_at: now, ended_at: null }).execute();
            await db.insertInto('stable_activity_types').values(DEFAULT_ACTIVITY_TYPES.map(([code, label, category, scope, defaultTime], sortOrder) => ({
                id: crypto.randomUUID(), stable_id: id, code, name: label, category, scope, default_time: defaultTime, sort_order: sortOrder, archived_at: null,
            }))).execute();
            return { id, name, timeZone, role: 'admin' as const };
        });
    }

    async list(actorId: string): Promise<StableSummary[]> {
        const rows = await this.db.selectFrom('stables').innerJoin('stable_members', 'stable_members.stable_id', 'stables.id')
            .select(['stables.id', 'stables.name', 'stables.time_zone', 'stable_members.role'])
            .where('stable_members.user_id', '=', actorId).where('stable_members.ended_at', 'is', null).orderBy('stables.name').execute();
        return rows.map(r => ({ id: r.id, name: r.name, timeZone: r.time_zone, role: r.role }));
    }

    async detail(actorId: string, stableId: string): Promise<StableDetail> {
        const role = await this.requireMember(actorId, stableId);
        const stable = await this.db.selectFrom('stables').selectAll().where('id', '=', stableId).executeTakeFirstOrThrow();
        const [members, horses, types, invitations] = await Promise.all([
            this.db.selectFrom('stable_members').innerJoin('users', 'users.id', 'stable_members.user_id')
                .select(['users.id', 'users.display_name', 'stable_members.role', 'stable_members.ended_at']).where('stable_id', '=', stableId).orderBy('users.display_name').execute(),
            this.db.selectFrom('stable_horses').innerJoin('horses', 'horses.id', 'stable_horses.horse_id')
                .select(['horses.id', 'horses.name', 'horses.student_id', 'horses.archived_at', 'stable_horses.ended_at']).where('stable_id', '=', stableId).orderBy('horses.name').execute(),
            this.db.selectFrom('stable_activity_types').selectAll().where('stable_id', '=', stableId).orderBy('sort_order').orderBy('id').execute(),
            role === 'admin' ? this.invitations(actorId, stableId) : Promise.resolve([]),
        ]);
        return {
            id: stable.id, name: stable.name, timeZone: stable.time_zone, role,
            members: members.map(r => ({ userId: r.id, displayName: r.display_name, role: r.role, active: !r.ended_at })),
            horses: horses.map(r => ({ id: r.id, name: r.name, ownerId: r.student_id, active: !r.ended_at && !r.archived_at })),
            types: types.map(r => ({ id: r.id, name: r.name, code: r.code, category: r.category, scope: r.scope, defaultTime: r.default_time, sortOrder: r.sort_order, archived: !!r.archived_at })),
            invitations,
        };
    }

    async attachHorse(actorId: string, stableId: string, horseId: string): Promise<void> {
        await this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId);
            const horse = await db.selectFrom('horses').select(['student_id', 'archived_at']).where('id', '=', horseId).executeTakeFirst();
            if (!horse || horse.student_id !== actorId || horse.archived_at) throw new NotFoundError('Horse not found');
            await db.insertInto('stable_horses').values({ stable_id: stableId, horse_id: horseId, approved_by: actorId, joined_at: new Date().toISOString(), ended_at: null })
                .onConflict(oc => oc.columns(['stable_id', 'horse_id']).doUpdateSet({ approved_by: actorId, ended_at: null })).execute();
        });
    }

    async detachHorse(actorId: string, stableId: string, horseId: string): Promise<void> {
        await this.db.transaction().execute(async db => {
            const horse = await db.selectFrom('horses').select('student_id').where('id', '=', horseId).executeTakeFirst();
            if (horse?.student_id !== actorId) await new StableService(db).requireMember(actorId, stableId, true);
            await db.updateTable('stable_horses').set({ ended_at: new Date().toISOString() }).where('stable_id', '=', stableId).where('horse_id', '=', horseId).execute();
        });
    }

    async requireHorse(stableId: string, horseId: string): Promise<void> {
        const row = await this.db.selectFrom('stable_horses').innerJoin('horses', 'horses.id', 'stable_horses.horse_id')
            .select('horses.id').where('stable_id', '=', stableId).where('horse_id', '=', horseId)
            .where('ended_at', 'is', null).where('archived_at', 'is', null).executeTakeFirst();
        if (!row) throw new ScheduleError('horse_inactive');
    }

    async invitations(actorId: string, stableId: string): Promise<StableInvitation[]> {
        await this.requireMember(actorId, stableId, true);
        const rows = await this.db.selectFrom('stable_invitations').innerJoin('stables', 'stables.id', 'stable_invitations.stable_id')
            .selectAll('stable_invitations').select('stables.name').where('stable_id', '=', stableId).orderBy('created_at', 'desc').execute();
        return rows.map(r => ({ id: r.id, stableId: r.stable_id, stableName: r.name, inviteeEmail: r.invitee_email, status: r.status, expiresAt: r.expires_at }));
    }

    async invite(actorId: string, stableId: string, address: string): Promise<StableInvitation> {
        const email = address.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ScheduleError('invalid_email');
        return this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            const now = new Date().toISOString();
            await db.updateTable('stable_invitations').set({ status: 'revoked' }).where('stable_id', '=', stableId)
                .where('invitee_email', '=', email).where('status', '=', 'pending').where('expires_at', '<=', now).execute();
            const existing = await db.selectFrom('stable_invitations').select('id').where('stable_id', '=', stableId)
                .where('invitee_email', '=', email).where('status', '=', 'pending').executeTakeFirst();
            if (existing) throw new ScheduleError('invitation_pending');
            const id = crypto.randomUUID(), expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
            await db.insertInto('stable_invitations').values({ id, stable_id: stableId, invitee_email: email, invited_by: actorId, status: 'pending', expires_at: expiresAt, created_at: now }).execute();
            const stable = await db.selectFrom('stables').select('name').where('id', '=', stableId).executeTakeFirstOrThrow();
            return { id, stableId, stableName: stable.name, inviteeEmail: email, status: 'pending', expiresAt };
        });
    }

    async inbox(actorId: string): Promise<StableInvitation[]> {
        const user = await this.db.selectFrom('users').select('email').where('id', '=', actorId).executeTakeFirstOrThrow();
        const rows = await this.db.selectFrom('stable_invitations').innerJoin('stables', 'stables.id', 'stable_invitations.stable_id')
            .selectAll('stable_invitations').select('stables.name').where('invitee_email', '=', user.email.toLowerCase())
            .where('status', '=', 'pending').where('expires_at', '>', new Date().toISOString()).orderBy('created_at', 'desc').execute();
        return rows.map(r => ({ id: r.id, stableId: r.stable_id, stableName: r.name, inviteeEmail: r.invitee_email, status: r.status, expiresAt: r.expires_at }));
    }

    async respond(actorId: string, invitationId: string, accept: boolean): Promise<void> {
        await this.db.transaction().execute(async db => {
            const user = await db.selectFrom('users').select('email').where('id', '=', actorId).executeTakeFirstOrThrow();
            const invitation = await db.selectFrom('stable_invitations').selectAll().where('id', '=', invitationId).executeTakeFirst();
            if (!invitation || invitation.invitee_email !== user.email.toLowerCase()) throw new NotFoundError('Invitation not found');
            // Retrying a previously accepted invitation must never restore a revoked membership.
            if (invitation.status === 'accepted' && accept) return;
            if (invitation.status !== 'pending' || invitation.expires_at <= new Date().toISOString()) throw new ScheduleError('invitation_expired');
            if (accept) {
                const member = await db.selectFrom('stable_members').select('ended_at').where('stable_id', '=', invitation.stable_id).where('user_id', '=', actorId).executeTakeFirst();
                // An extra invitation must not demote an existing administrator.
                if (!member || member.ended_at) await db.insertInto('stable_members').values({ stable_id: invitation.stable_id, user_id: actorId, role: 'member', joined_at: new Date().toISOString(), ended_at: null })
                    .onConflict(oc => oc.columns(['stable_id', 'user_id']).doUpdateSet({ role: 'member', joined_at: new Date().toISOString(), ended_at: null })).execute();
            }
            await db.updateTable('stable_invitations').set({ status: accept ? 'accepted' : 'declined' }).where('id', '=', invitationId).execute();
        });
    }

    async revoke(actorId: string, stableId: string, invitationId: string): Promise<void> {
        await this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            await db.updateTable('stable_invitations').set({ status: 'revoked' }).where('stable_id', '=', stableId)
                .where('id', '=', invitationId).where('status', '=', 'pending').execute();
        });
    }

    async setMember(actorId: string, stableId: string, userId: string, role: StableRole, remove: boolean): Promise<void> {
        await this.db.transaction().execute(async db => {
            const svc = new StableService(db);
            const actorRole = await svc.requireMember(actorId, stableId);
            if (actorRole !== 'admin' && !(remove && actorId === userId)) throw new ForbiddenError('Stable administrator required');
            const target = await db.selectFrom('stable_members').selectAll().where('stable_id', '=', stableId).where('user_id', '=', userId).where('ended_at', 'is', null).executeTakeFirst();
            if (!target) throw new NotFoundError('Member not found');
            if (target.role === 'admin' && (remove || role !== 'admin')) {
                const admins = await db.selectFrom('stable_members').select('user_id').where('stable_id', '=', stableId).where('role', '=', 'admin').where('ended_at', 'is', null).execute();
                if (admins.length <= 1) throw new ScheduleError('last_admin');
            }
            await db.updateTable('stable_members').set({ role: remove ? target.role : role, ended_at: remove ? new Date().toISOString() : null })
                .where('stable_id', '=', stableId).where('user_id', '=', userId).execute();
        });
    }

    async saveType(actorId: string, stableId: string, input: { typeId?: string; name: string; category: ActivityCategory; scope: 'stable' | 'horse' | 'any'; defaultTime?: string | null; archived?: boolean }): Promise<void> {
        await this.db.transaction().execute(async db => {
            await new StableService(db).requireMember(actorId, stableId, true);
            if (input.defaultTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.defaultTime)) throw new ScheduleError('invalid_time');
            const values = { name: text(input.name), category: input.category, scope: input.scope, default_time: input.defaultTime || null, archived_at: input.archived ? new Date().toISOString() : null };
            if (input.typeId) {
                const existing = await db.selectFrom('stable_activity_types').select(['id', 'category', 'scope']).where('id', '=', input.typeId).where('stable_id', '=', stableId).executeTakeFirst();
                if (!existing) throw new NotFoundError('Activity type not found');
                if (existing.category !== input.category || existing.scope !== input.scope) {
                    const used = await db.selectFrom('stable_activities').select('id').where('type_id', '=', input.typeId).limit(1).executeTakeFirst();
                    if (used) throw new ScheduleError('type_in_use');
                }
                await db.updateTable('stable_activity_types').set(values).where('id', '=', input.typeId).execute();
            } else {
                const count = await db.selectFrom('stable_activity_types').select(({ fn }) => fn.countAll<number>().as('count')).where('stable_id', '=', stableId).executeTakeFirstOrThrow();
                await db.insertInto('stable_activity_types').values({ id: crypto.randomUUID(), stable_id: stableId, code: null, sort_order: Number(count.count), ...values }).execute();
            }
        });
    }
}
