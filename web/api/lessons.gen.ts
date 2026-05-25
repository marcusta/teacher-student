// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: 'planned' | 'completed' | 'cancelled';
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
    createdAt: string;
    updatedAt: string;
}

export interface LessonsApi {
    create(input: { studentId: string; scheduledAt: string }): Promise<Lesson>;
    list(): Promise<LessonForUser[]>;
}

export function createLessonsClient(baseUrl: string): LessonsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/lessons`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/lessons` });
        },
    };
}
