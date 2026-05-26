// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Exercise {
    id: string;
    teacherId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExercisesApi {
    create(input: { description?: string; name: string }): Promise<Exercise>;
    list(): Promise<Exercise[]>;
    get(input: { id: string }): Promise<Exercise>;
    update(input: { name?: string; description?: string; id: string }): Promise<Exercise>;
    delete(input: { id: string }): Promise<{ ok: boolean }>;
    listForStudent(): Promise<Exercise[]>;
}

export function createExercisesClient(baseUrl: string): ExercisesApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/exercises`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/exercises` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/exercises/${input.id}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/exercises/${input.id}`, body });
        },
        async delete(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/exercises/${input.id}` });
        },
        async listForStudent() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/exercises/for-student` });
        },
    };
}
