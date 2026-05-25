// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface TrainingSession {
    id: string;
    studentId: string;
    performedAt: string;
    durationMin: null | number;
    summary: null | string;
    sharedWithTeacherIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TrainingSessionsApi {
    create(input: { durationMin?: null | number; summary?: null | string; shareWithTeacherIds?: string[]; performedAt: string }): Promise<TrainingSession>;
    list(): Promise<TrainingSession[]>;
    update(input: { performedAt?: string; durationMin?: null | number; summary?: null | string; shareWithTeacherIds?: string[]; id: string }): Promise<TrainingSession>;
    delete(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createTrainingSessionsClient(baseUrl: string): TrainingSessionsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/training-sessions`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/training-sessions` });
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
    };
}
