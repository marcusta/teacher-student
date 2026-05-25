// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Program {
    id: string;
    teacherId: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface ProgramsApi {
    create(input: { description?: string; title: string }): Promise<Program>;
    list(): Promise<Program[]>;
    get(input: { id: string }): Promise<Program>;
    update(input: { title?: string; description?: string; id: string }): Promise<Program>;
    delete(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createProgramsClient(baseUrl: string): ProgramsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/programs`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/programs` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/programs/${input.id}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/programs/${input.id}`, body });
        },
        async delete(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/programs/${input.id}` });
        },
    };
}
