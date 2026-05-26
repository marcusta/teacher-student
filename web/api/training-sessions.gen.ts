// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface TrainingSession {
    id: string;
    studentId: string;
    performedAt: string;
    durationMin: null | number;
    summary: null | string;
    horseId: null | string;
    horseName: null | string;
    sharedWithTeacherIds: string[];
    exercises: TrainingSessionExerciseRef[];
    programs: AttachedProgramRef[];
    createdAt: string;
    updatedAt: string;
}

export interface TrainingSessionExerciseRef {
    id: string;
    exerciseId: string;
    name: string;
    sortOrder: number;
    sourceProgramId: null | string;
}

export interface AttachedProgramRef {
    id: string;
    title: string;
}

export interface TrainingSessionsApi {
    create(input: { durationMin?: null | number; summary?: null | string; horseId?: null | string; shareWithTeacherIds?: string[]; programId?: string; performedAt: string }): Promise<TrainingSession>;
    list(): Promise<TrainingSession[]>;
    get(input: { id: string }): Promise<TrainingSession>;
    update(input: { performedAt?: string; durationMin?: null | number; summary?: null | string; horseId?: null | string; shareWithTeacherIds?: string[]; id: string }): Promise<TrainingSession>;
    delete(input: { id: string }): Promise<{ ok: boolean }>;
    addExercise(input: { id: string; exerciseId: string }): Promise<TrainingSessionExerciseRef[]>;
    removeExercise(input: { id: string; exerciseId: string }): Promise<TrainingSessionExerciseRef[]>;
    listExercises(input: { id: string }): Promise<TrainingSessionExerciseRef[]>;
    attachProgram(input: { id: string; programId: string }): Promise<TrainingSession>;
    detachProgram(input: { id: string; programId: string }): Promise<TrainingSession>;
}

export function createTrainingSessionsClient(baseUrl: string): TrainingSessionsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/training-sessions`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/training-sessions` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/training-sessions/${input.id}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/training-sessions/${input.id}`, body });
        },
        async delete(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/training-sessions/${input.id}` });
        },
        async addExercise(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/training-sessions/${input.id}/exercises`, body });
        },
        async removeExercise(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/training-sessions/${input.id}/exercises/${input.exerciseId}` });
        },
        async listExercises(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/training-sessions/${input.id}/exercises${qs ? '?' + qs : ''}` });
        },
        async attachProgram(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/training-sessions/${input.id}/programs`, body });
        },
        async detachProgram(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/training-sessions/${input.id}/programs/${input.programId}` });
        },
    };
}
