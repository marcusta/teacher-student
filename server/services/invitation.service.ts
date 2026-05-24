import type { Kysely } from 'kysely';
import type { Database, InvitationStatus } from '../db/schema';
import { UniqueViolationError, parseUniqueViolation } from '@basics/core/server/unique-violation';
import { ForbiddenError } from '@basics/core/server/auth';

// --- Output type ---

export interface Invitation {
    id: string;
    teacherId: string;
    inviteeEmail: string;
    status: InvitationStatus;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
}

const INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Thrown when a user tries to act on an invitation they don't own. */
export class NotOwnerError extends ForbiddenError {
    constructor(public readonly invitationId: string) {
        super(`Invitation ${invitationId} not owned by caller`);
        this.name = 'NotOwnerError';
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
