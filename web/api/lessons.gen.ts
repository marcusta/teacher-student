// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: 'completed' | 'cancelled' | 'planned';
    horseId: null | string;
    horseName: null | string;
    programs: AttachedProgramRef[];
    exercises: LessonExerciseRef[];
    createdAt: string;
    updatedAt: string;
}

export interface LessonForUser {
    role: 'student' | 'teacher';
    counterpartyDisplayName: string;
    id: string;
    teacherId: string;
    studentId: string;
    scheduledAt: string;
    status: 'completed' | 'cancelled' | 'planned';
    horseId: null | string;
    horseName: null | string;
    programs: AttachedProgramRef[];
    exercises: LessonExerciseRef[];
    createdAt: string;
    updatedAt: string;
}

export interface LessonExerciseRef {
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

export interface LessonsApi {
    create(input: { programId?: string; studentId: string; scheduledAt: string }): Promise<Lesson>;
    list(): Promise<LessonForUser[]>;
    addExercise(input: { id: string; exerciseId: string }): Promise<LessonExerciseRef[]>;
    removeExercise(input: { id: string; exerciseId: string }): Promise<LessonExerciseRef[]>;
    listExercises(input: { id: string }): Promise<LessonExerciseRef[]>;
    transition(input: { id: string; target: 'completed' | 'cancelled' }): Promise<Lesson>;
    attachProgram(input: { id: string; programId: string }): Promise<Lesson>;
    detachProgram(input: { id: string; programId: string }): Promise<Lesson>;
    update(input: { horseId?: null | string; scheduledAt?: string; id: string }): Promise<Lesson>;
}

export function createLessonsClient(baseUrl: string): LessonsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/lessons`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/lessons` });
        },
        async addExercise(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/lessons/${input.id}/exercises`, body });
        },
        async removeExercise(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/lessons/${input.id}/exercises/${input.exerciseId}` });
        },
        async listExercises(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/lessons/${input.id}/exercises${qs ? '?' + qs : ''}` });
        },
        async transition(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/lessons/${input.id}/transition`, body });
        },
        async attachProgram(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/lessons/${input.id}/programs`, body });
        },
        async detachProgram(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/lessons/${input.id}/programs/${input.programId}` });
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
