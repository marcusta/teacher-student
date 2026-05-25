// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: 'planned' | 'completed' | 'cancelled';
    horseId: null | string;
    horseName: null | string;
    createdAt: string;
    updatedAt: string;
}

export interface LessonForUser {
    role: 'teacher' | 'student';
    counterpartyDisplayName: string;
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: 'planned' | 'completed' | 'cancelled';
    horseId: null | string;
    horseName: null | string;
    createdAt: string;
    updatedAt: string;
}

export interface LessonsApi {
    create(input: { studentId: string; scheduledAt: string }): Promise<Lesson>;
    list(): Promise<LessonForUser[]>;
    update(input: { scheduledAt?: string; horseId?: null | string; id: string }): Promise<Lesson>;
}

export function createLessonsClient(baseUrl: string): LessonsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/lessons`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/lessons` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/lessons/${input.id}`, body });
        },
    };
}
