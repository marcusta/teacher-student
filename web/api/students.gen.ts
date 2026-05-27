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

export interface Plan {
    id: string;
    studentId: string;
    primaryTeacherId: null | string;
    primaryTeacherDisplayName: null | string;
    title: string;
    description: null | string;
    startDate: null | string;
    endDate: null | string;
    status: 'active' | 'archived';
    createdAt: string;
    updatedAt: string;
}

export interface GoalTeacherView {
    id: string;
    studentId: string;
    title: string;
    description: null | string;
    targetDate: null | string;
    achievedAt: null | string;
    status: 'active' | 'achieved' | 'abandoned';
    planIds: string[];
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
    planId: null | string;
    planTitle: null | string;
    sharedWithTeacherIds: string[];
    exercises: TrainingSessionExerciseRef[];
    programs: AttachedProgramRef[];
    createdAt: string;
    updatedAt: string;
}

export interface ExerciseHistoryEntry {
    lessonExerciseId: string;
    lessonId: string;
    scheduledAt: string;
    sourceProgramId: null | string;
    sourceProgramTitle: null | string;
    rowNotes: null | string;
    notes: Note[];
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

export interface Note {
    id: string;
    authorId: string;
    authorDisplayName: string;
    parentKind: 'lesson' | 'student' | 'training_session' | 'training_session_exercise' | 'exercise_question' | 'lesson_exercise' | 'goal';
    parentId: string;
    body: string;
    visibility: 'private' | 'shared';
    createdAt: string;
    updatedAt: string;
}

export interface StudentsApi {
    list(): Promise<Student[]>;
    get(input: { id: string }): Promise<Student>;
    listHorses(input: { id: string }): Promise<Horse[]>;
    listPlans(input: { id: string }): Promise<Plan[]>;
    listGoals(input: { id: string }): Promise<GoalTeacherView[]>;
    listTrainingSessions(input: { id: string }): Promise<TrainingSession[]>;
    exerciseHistory(input: { id: string; exerciseId: string }): Promise<ExerciseHistoryEntry[]>;
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
        async listPlans(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}/plans${qs ? '?' + qs : ''}` });
        },
        async listGoals(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}/goals${qs ? '?' + qs : ''}` });
        },
        async listTrainingSessions(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}/training-sessions${qs ? '?' + qs : ''}` });
        },
        async exerciseHistory(input) {
            const pathParams = new Set(['id', 'exerciseId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/students/${input.id}/exercises/${input.exerciseId}/history${qs ? '?' + qs : ''}` });
        },
    };
}
