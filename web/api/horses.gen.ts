// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Horse {
    id: string;
    studentId: string;
    name: string;
    archivedAt: null | string;
    createdAt: string;
    updatedAt: string;
}

export interface HorsesApi {
    create(input: { name: string }): Promise<Horse>;
    list(): Promise<Horse[]>;
    get(input: { id: string }): Promise<Horse>;
    update(input: { name?: string; id: string }): Promise<Horse>;
}

export function createHorsesClient(baseUrl: string): HorsesApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/horses`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/horses` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/horses/${input.id}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/horses/${input.id}`, body });
        },
    };
}
