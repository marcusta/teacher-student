import type { Generated } from 'kysely';

export interface Database {
    users: UsersTable;
    invitations: InvitationsTable;
}

export interface UsersTable {
    id: string;
    email: string;
    display_name: string;
    password_hash: string;
    created_at: Generated<string>;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface InvitationsTable {
    id: string;
    teacher_id: string;
    invitee_email: string;
    status: InvitationStatus;
    created_at: Generated<string>;
    expires_at: string;
    accepted_at: string | null;
}
