// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Program {
    id: string;
    teacherId: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface ProgramExerciseRef {
    id: string;
    name: string;
    description: string;
    sortOrder: number;
    notes: null | string;
}

export interface ProgramsApi {
    create(input: { description?: string; title: string }): Promise<Program>;
    list(): Promise<Program[]>;
    get(input: { id: string }): Promise<Program>;
    update(input: { title?: string; description?: string; id: string }): Promise<Program>;
    delete(input: { id: string }): Promise<{ ok: boolean }>;
    listExercises(input: { id: string }): Promise<ProgramExerciseRef[]>;
    addExercise(input: { notes?: string; id: string; exerciseId: string }): Promise<{ ok: boolean }>;
    reorderExercises(input: { id: string; exerciseIds: string[] }): Promise<{ ok: boolean }>;
    removeExercise(input: { id: string; exerciseId: string }): Promise<{ ok: boolean }>;
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
        async listExercises(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/programs/${input.id}/exercises${qs ? '?' + qs : ''}` });
        },
        async addExercise(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/programs/${input.id}/exercises`, body });
        },
        async reorderExercises(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PUT', url: `${baseUrl}/programs/${input.id}/exercises/order`, body });
        },
        async removeExercise(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/programs/${input.id}/exercises/${input.exerciseId}` });
        },
    };
}
