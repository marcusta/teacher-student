// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Student {
    id: string;
    email: string;
    displayName: string;
}

export interface Horse {
    id: string;
    studentId: string;
    name: string;
    archivedAt: null | string;
    createdAt: string;
    updatedAt: string;
}

export interface TrainingSession {
    id: string;
    studentId: string;
    performedAt: string;
    durationMin: null | number;
    summary: null | string;
    horseId: null | string;
    horseName: null | string;
    sharedWithTeacherIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface StudentsApi {
    list(): Promise<Student[]>;
    get(input: { id: string }): Promise<Student>;
    listHorses(input: { id: string }): Promise<Horse[]>;
    listTrainingSessions(input: { id: string }): Promise<TrainingSession[]>;
}

export function createStudentsClient(baseUrl: string): StudentsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/students` });
        },
        async get(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}${qs ? '?' + qs : ''}` });
        },
        async listHorses(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}/horses${qs ? '?' + qs : ''}` });
        },
        async listTrainingSessions(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}/training-sessions${qs ? '?' + qs : ''}` });
        },
    };
}
