// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Goal {
    id: string;
    studentId: string;
    title: string;
    description: null | string;
    targetDate: null | string;
    achievedAt: null | string;
    status: 'active' | 'achieved' | 'abandoned';
    sharedTeacherIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface GoalTeacherView {
    id: string;
    studentId: string;
    title: string;
    description: null | string;
    targetDate: null | string;
    achievedAt: null | string;
    status: 'active' | 'achieved' | 'abandoned';
    createdAt: string;
    updatedAt: string;
}

export interface SharedTeacherRef {
    teacherId: string;
    displayName: string;
}

export interface GoalsApi {
    create(input: { description?: string; targetDate?: string; title: string }): Promise<Goal>;
    list(): Promise<Goal[]>;
    get(input: { id: string }): Promise<GoalTeacherView>;
    update(input: { title?: string; description?: null | string; targetDate?: null | string; id: string }): Promise<Goal>;
    abandon(input: { id: string }): Promise<{ ok: true }>;
    achieve(input: { id: string }): Promise<{ ok: true }>;
    reopen(input: { id: string }): Promise<{ ok: true }>;
    share(input: { id: string; teacherId: string }): Promise<{ ok: true }>;
    unshare(input: { id: string; teacherId: string }): Promise<{ ok: true }>;
    listShares(input: { id: string }): Promise<SharedTeacherRef[]>;
}

export function createGoalsClient(baseUrl: string): GoalsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/goals`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/goals` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/goals/${input.id}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/goals/${input.id}`, body });
        },
        async abandon(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/goals/${input.id}/abandon`, body });
        },
        async achieve(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/goals/${input.id}/achieve`, body });
        },
        async reopen(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/goals/${input.id}/reopen`, body });
        },
        async share(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/goals/${input.id}/shares`, body });
        },
        async unshare(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/goals/${input.id}/shares/${input.teacherId}` });
        },
        async listShares(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/goals/${input.id}/shares${qs ? '?' + qs : ''}` });
        },
    };
}
