// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Invitation {
    id: string;
    teacherId: string;
    inviteeEmail: string;
    status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
    createdAt: string;
    expiresAt: string;
    acceptedAt: null | string;
}

export interface Relation {
    id: string;
    teacherId: string;
    studentId: string;
    invitationId: string;
    createdAt: string;
}

export interface InvitationsApi {
    create(input: { inviteeEmail: string }): Promise<Invitation>;
    revoke(input: { invitationId: string }): Promise<{ changed: boolean }>;
    list(): Promise<Invitation[]>;
    inbox(): Promise<Invitation[]>;
    accept(input: { invitationId: string }): Promise<Relation>;
    decline(input: { invitationId: string }): Promise<{ ok: boolean }>;
}

export function createInvitationsClient(baseUrl: string): InvitationsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/invitations`, body: input });
        },
        async revoke(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/invitations/revoke`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/invitations` });
        },
        async inbox() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/invitations/inbox` });
        },
        async accept(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/invitations/accept`, body: input });
        },
        async decline(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/invitations/decline`, body: input });
        },
    };
}
