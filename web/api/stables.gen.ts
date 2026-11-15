// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface StableSummary {
    id: string;
    name: string;
    timeZone: string;
    role: 'admin' | 'member';
}

export interface StableDetail {
    members: StableMember[];
    horses: StableHorse[];
    types: ActivityType[];
    invitations: StableInvitation[];
    id: string;
    name: string;
    timeZone: string;
    role: 'admin' | 'member';
}

export interface StableInvitation {
    id: string;
    stableId: string;
    stableName: string;
    inviteeEmail: string;
    status: string;
    expiresAt: string;
}

export interface StableMember {
    userId: string;
    displayName: string;
    role: 'admin' | 'member';
    active: boolean;
}

export interface StableHorse {
    id: string;
    name: string;
    ownerId: string;
    active: boolean;
}

export interface ActivityType {
    id: string;
    name: string;
    code: null | string;
    category: 'routine' | 'care' | 'training' | 'visit' | 'other';
    scope: 'stable' | 'horse' | 'any';
    defaultTime: null | string;
    sortOrder: number;
    archived: boolean;
}

export interface StablesApi {
    list(): Promise<StableSummary[]>;
    create(input: { timeZone?: string; name: string }): Promise<StableSummary>;
    detail(input: { stableId: string }): Promise<StableDetail>;
    attachHorse(input: { stableId: string; horseId: string }): Promise<{ ok: boolean }>;
    detachHorse(input: { stableId: string; horseId: string }): Promise<{ ok: boolean }>;
    invite(input: { stableId: string; inviteeEmail: string }): Promise<StableInvitation>;
    inbox(): Promise<StableInvitation[]>;
    respond(input: { invitationId: string; accept: boolean }): Promise<{ ok: boolean }>;
    revoke(input: { stableId: string; invitationId: string }): Promise<{ ok: boolean }>;
    member(input: { stableId: string; userId: string; role: 'admin' | 'member'; remove: boolean }): Promise<{ ok: boolean }>;
    saveType(input: { archived?: boolean; typeId?: string; defaultTime?: null | string; stableId: string; name: string; category: 'routine' | 'care' | 'training' | 'visit' | 'other'; scope: 'stable' | 'horse' | 'any' }): Promise<{ ok: boolean }>;
}

export function createStablesClient(baseUrl: string): StablesApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables`, body: input });
        },
        async detail(input) {
            const pathParams = new Set(['stableId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables/${input.stableId}${qs ? '?' + qs : ''}` });
        },
        async attachHorse(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/horses`, body });
        },
        async detachHorse(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/stables/${input.stableId}/horses/${input.horseId}` });
        },
        async invite(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/invitations`, body });
        },
        async inbox() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/stable-invitations/inbox` });
        },
        async respond(input) {
            const pathParams = new Set(['invitationId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stable-invitations/${input.invitationId}/respond`, body });
        },
        async revoke(input) {
            const pathParams = new Set(['stableId', 'invitationId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/invitations/${input.invitationId}/revoke`, body });
        },
        async member(input) {
            const pathParams = new Set(['stableId', 'userId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/stables/${input.stableId}/members/${input.userId}`, body });
        },
        async saveType(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activity-types`, body });
        },
    };
}
