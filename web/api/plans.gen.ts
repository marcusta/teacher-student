// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Plan {
    id: string;
    studentId: string;
    primaryTeacherId: null | string;
    title: string;
    description: null | string;
    startDate: null | string;
    endDate: null | string;
    status: 'active' | 'archived';
    createdAt: string;
    updatedAt: string;
}

export interface PlansApi {
    create(input: { description?: string; startDate?: string; endDate?: string; primaryTeacherId?: string; title: string }): Promise<Plan>;
    list(): Promise<Plan[]>;
    get(input: { id: string }): Promise<Plan>;
    update(input: { title?: string; description?: null | string; startDate?: null | string; endDate?: null | string; primaryTeacherId?: null | string; id: string }): Promise<Plan>;
    archive(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createPlansClient(baseUrl: string): PlansApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/plans`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/plans` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/plans/${input.id}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/plans/${input.id}`, body });
        },
        async archive(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/plans/${input.id}/archive`, body });
        },
    };
}
