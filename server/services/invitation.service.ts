import type { Kysely } from 'kysely';
import type { Database, InvitationStatus } from '../db/schema';
import { UniqueViolationError, parseUniqueViolation } from '@basics/core/server/unique-violation';
import { ConflictError, ForbiddenError } from '@basics/core/server/auth';

// --- Output types ---

export interface Relation {
    id: string;
    teacherId: string;
    studentId: string;
    invitationId: string;
    createdAt: string;
}

export interface Invitation {
    id: string;
    teacherId: string;
    inviteeEmail: string;
    status: InvitationStatus;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
}

/** Invitation enriched with inviting teacher's identity for the invitee's inbox. */
export interface InboxInvitation extends Invitation {
    teacherDisplayName: string;
    teacherEmail: string;
}

const INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Thrown when a user tries to act on an invitation they don't own. */
export class NotOwnerError extends ForbiddenError {
    constructor(public readonly invitationId: string) {
        super(`Invitation ${invitationId} not owned by caller`);
        this.name = 'NotOwnerError';
    }
}

/** Thrown when a user tries to accept/decline an invitation addressed to someone else. */
export class NotInviteeError extends ForbiddenError {
    constructor(public readonly invitationId: string) {
        super(`Invitation ${invitationId} not addressed to caller`);
        this.name = 'NotInviteeError';
    }
}

/**
 * Thrown when an invitation can no longer be acted on because it is in a
 * terminal non-`accepted` state (revoked, declined, expired). Carries the
 * current status so clients can render the right message.
 */
export class InvitationNotPendingError extends ConflictError {
    readonly detail: { currentStatus: InvitationStatus };
    constructor(public readonly invitationId: string, currentStatus: InvitationStatus) {
        super(`Invitation ${invitationId} is ${currentStatus}, no longer pending`);
        this.name = 'InvitationNotPendingError';
        this.detail = { currentStatus };
    }
}

/** Thrown when a pending invitation already exists for the (teacher, email) pair. */
export class DuplicatePendingInvitationError extends UniqueViolationError {
    constructor(public readonly teacherId: string, public readonly inviteeEmail: string) {
        super('invitations', 'teacher_id');
        this.message = `Pending invitation already exists for ${inviteeEmail}`;
        this.name = 'DuplicatePendingInvitationError';
    }
}

function toInvitation(row: {
    id: string;
    teacher_id: string;
    invitee_email: string;
    status: InvitationStatus;
    created_at: string;
    expires_at: string;
    accepted_at: string | null;
}): Invitation {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        inviteeEmail: row.invitee_email,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        acceptedAt: row.accepted_at,
    };
}

function toRelation(row: {
    id: string;
    teacher_id: string;
    student_id: string;
    invitation_id: string;
    created_at: string;
}): Relation {
    return {
        id: row.id,
        teacherId: row.teacher_id,
        studentId: row.student_id,
        invitationId: row.invitation_id,
        createdAt: row.created_at,
    };
}

export class InvitationService {
    constructor(private db: Kysely<Database>) {}

    async createInvitation(teacherId: string, inviteeEmail: string): Promise<Invitation> {
        const id = crypto.randomUUID();
        const now = new Date();
        const createdAt = now.toISOString();
        const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS).toISOString();
        const email = inviteeEmail.trim().toLowerCase();

        try {
            await this.db.insertInto('invitations').values({
                id,
                teacher_id: teacherId,
                invitee_email: email,
                status: 'pending',
                created_at: createdAt,
                expires_at: expiresAt,
                accepted_at: null,
            }).execute();
        } catch (err) {
            const uv = parseUniqueViolation(err);
            if (uv?.table === 'invitations') throw new DuplicatePendingInvitationError(teacherId, email);
            throw err;
        }

        return {
            id,
            teacherId,
            inviteeEmail: email,
            status: 'pending',
            createdAt,
            expiresAt,
            acceptedAt: null,
        };
    }

    /**
     * Accept an invitation on behalf of `userId`. The caller must already
     * be the invitee (their `userEmail` must match the invitation's
     * `invitee_email`).
     *
     * Idempotent at the (teacher, student) level: if the user already has
     * a Relation with this teacher (perhaps from a previously accepted
     * invitation), this call marks the new invitation accepted and returns
     * the existing Relation — no error. The student's intent ("be
     * connected to this teacher") is already satisfied.
     */
    async acceptInvitation(invitationId: string, userId: string, userEmail: string): Promise<Relation> {
        const email = userEmail.trim().toLowerCase();
        return this.db.transaction().execute(async (trx) => {
            const inv = await trx
                .selectFrom('invitations')
                .selectAll()
                .where('id', '=', invitationId)
                .executeTakeFirst();
            if (!inv || inv.invitee_email !== email) {
                throw new NotInviteeError(invitationId);
            }
            if (inv.status !== 'pending' && inv.status !== 'accepted') {
                throw new InvitationNotPendingError(invitationId, inv.status);
            }

            // Idempotent: re-use existing Relation if any.
            const existing = await trx
                .selectFrom('relations')
                .selectAll()
                .where('teacher_id', '=', inv.teacher_id)
                .where('student_id', '=', userId)
                .executeTakeFirst();

            if (existing) {
                if (inv.status === 'pending') {
                    await trx.updateTable('invitations')
                        .set({ status: 'accepted', accepted_at: new Date().toISOString() })
                        .where('id', '=', invitationId)
                        .execute();
                }
                return toRelation(existing);
            }

            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();
            await trx.insertInto('relations').values({
                id,
                teacher_id: inv.teacher_id,
                student_id: userId,
                invitation_id: invitationId,
                created_at: createdAt,
            }).execute();

            await trx.updateTable('invitations')
                .set({ status: 'accepted', accepted_at: new Date().toISOString() })
                .where('id', '=', invitationId)
                .execute();

            return {
                id,
                teacherId: inv.teacher_id,
                studentId: userId,
                invitationId,
                createdAt,
            };
        });
    }

    async declineInvitation(invitationId: string, _userId: string, userEmail: string): Promise<void> {
        const email = userEmail.trim().toLowerCase();
        const inv = await this.db
            .selectFrom('invitations')
            .select(['invitee_email', 'status'])
            .where('id', '=', invitationId)
            .executeTakeFirst();
        if (!inv || inv.invitee_email !== email) throw new NotInviteeError(invitationId);
        if (inv.status !== 'pending') throw new InvitationNotPendingError(invitationId, inv.status);

        await this.db.updateTable('invitations')
            .set({ status: 'declined' })
            .where('id', '=', invitationId)
            .where('status', '=', 'pending')
            .execute();
    }

    async listForUser(userEmail: string): Promise<InboxInvitation[]> {
        const email = userEmail.trim().toLowerCase();
        const rows = await this.db
            .selectFrom('invitations')
            .innerJoin('users', 'users.id', 'invitations.teacher_id')
            .select([
                'invitations.id as id',
                'invitations.teacher_id as teacher_id',
                'invitations.invitee_email as invitee_email',
                'invitations.status as status',
                'invitations.created_at as created_at',
                'invitations.expires_at as expires_at',
                'invitations.accepted_at as accepted_at',
                'users.display_name as teacher_display_name',
                'users.email as teacher_email',
            ])
            .where('invitations.invitee_email', '=', email)
            .where('invitations.status', '=', 'pending')
            .orderBy('invitations.created_at', 'desc')
            .execute();
        return rows.map((r) => ({
            ...toInvitation(r),
            teacherDisplayName: r.teacher_display_name,
            teacherEmail: r.teacher_email,
        }));
    }

    async listByTeacher(teacherId: string): Promise<Invitation[]> {
        const rows = await this.db
            .selectFrom('invitations')
            .selectAll()
            .where('teacher_id', '=', teacherId)
            .orderBy('created_at', 'desc')
            .execute();
        return rows.map(toInvitation);
    }

    /**
     * Revoke an invitation. Idempotent on state: returns `false` if the
     * invitation is already terminal (the caller's intent — "invitation is
     * not active" — is already satisfied). Returns `true` if this call
     * performed the transition pending → revoked.
     *
     * Throws `NotOwnerError` if the invitation belongs to a different
     * teacher or does not exist. Ownership is an authorization concern,
     * which is separate from state and surfaces as HTTP 403.
     */
    async revokeInvitation(invitationId: string, teacherId: string): Promise<boolean> {
        const row = await this.db
            .selectFrom('invitations')
            .select(['teacher_id', 'status'])
            .where('id', '=', invitationId)
            .executeTakeFirst();
        if (!row) throw new NotOwnerError(invitationId);
        if (row.teacher_id !== teacherId) throw new NotOwnerError(invitationId);
        if (row.status !== 'pending') return false;

        const rows = await this.db
            .updateTable('invitations')
            .set({ status: 'revoked' })
            .where('id', '=', invitationId)
            .where('status', '=', 'pending')
            .returning('id')
            .execute();
        return rows.length > 0;
    }
}
