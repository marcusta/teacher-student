// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface ScheduleWeek {
    stable: StableDetail;
    startDate: string;
    activities: Activity[];
    total: number;
    completed: number;
    unassigned: number;
}

export interface Activity {
    id: string;
    stableId: string;
    typeId: string;
    category: 'routine' | 'care' | 'training' | 'visit' | 'other';
    horseId: null | string;
    title: string;
    date: string;
    time: null | string;
    offsetMinutes: null | number;
    instruction: string;
    status: 'planned' | 'completed' | 'cancelled';
    resultNote: string;
    performedAt: null | string;
    completedAt: null | string;
    completedBy: null | string;
    createdBy: string;
    updatedBy: string;
    version: number;
    assigneeIds: string[];
    performerIds: string[];
    horseInactive: boolean;
    trainingStudentId: null | string;
    trainingSessionId: null | string;
    hasTrainingSession: boolean;
    hasProgram: boolean;
    programs: ProgramSnapshot[];
    exercises: ExerciseSnapshot[];
    canEdit: boolean;
    canComplete: boolean;
    canClaim: boolean;
    canRegisterTraining: boolean;
}

export interface HorseLog {
    horse: StableHorse;
    stableName: string;
    timeZone: string;
    items: Activity[];
    nextCursor: null | string;
}

export interface ScheduleCatalog {
    programs: { id: string; title: string; author: string }[];
    exercises: { id: string; name: string; author: string }[];
}

export interface StableDetail {
    members: StableMember[];
    horses: StableHorse[];
    types: ActivityType[];
    invitations: StableInvitation[];
    id: string;
    name: string;
    timeZone: string;
    role: 'admin' | 'member';
}

export interface ProgramSnapshot {
    id: string;
    title: string;
}

export interface ExerciseSnapshot {
    exerciseId: string;
    sourceProgramId: null | string;
    name: string;
    description: string;
    notes: null | string;
    sortOrder: number;
}

export interface StableHorse {
    id: string;
    name: string;
    ownerId: string;
    active: boolean;
}

export interface StableMember {
    userId: string;
    displayName: string;
    role: 'admin' | 'member';
    active: boolean;
}

export interface ActivityType {
    id: string;
    name: string;
    code: null | string;
    category: 'routine' | 'care' | 'training' | 'visit' | 'other';
    scope: 'stable' | 'horse' | 'any';
    defaultTime: null | string;
    sortOrder: number;
    archived: boolean;
}

export interface StableInvitation {
    id: string;
    stableId: string;
    stableName: string;
    inviteeEmail: string;
    status: string;
    expiresAt: string;
}

export interface StableActivitiesApi {
    week(input: { stableId: string; startDate: string }): Promise<ScheduleWeek>;
    create(input: { exerciseIds?: string[]; status?: 'planned' | 'completed'; resultNote?: string; performerIds?: string[]; performedAt?: string; horseId?: null | string; time?: null | string; offsetMinutes?: null | number; instruction?: string; assigneeIds?: string[]; trainingStudentId?: null | string; programIds?: string[]; stableId: string; requestId: string; title: string; typeId: string; date: string }): Promise<Activity>;
    get(input: { stableId: string; activityId: string }): Promise<Activity>;
    update(input: { stableId: string; activityId: string; version: number; title?: string; exerciseIds?: string[]; resultNote?: string; performerIds?: string[]; performedAt?: string; typeId?: string; horseId?: null | string; date?: string; time?: null | string; offsetMinutes?: null | number; instruction?: string; assigneeIds?: string[]; trainingStudentId?: null | string; programIds?: string[] }): Promise<Activity>;
    complete(input: { resultNote?: string; performerIds?: string[]; performedAt?: string; patch?: { title?: string; exerciseIds?: string[]; resultNote?: string; performerIds?: string[]; performedAt?: string; typeId?: string; horseId?: null | string; date?: string; time?: null | string; offsetMinutes?: null | number; instruction?: string; assigneeIds?: string[]; trainingStudentId?: null | string; programIds?: string[] }; stableId: string; activityId: string; version: number }): Promise<Activity>;
    reopen(input: { resultNote?: string; performerIds?: string[]; performedAt?: string; stableId: string; activityId: string; version: number }): Promise<Activity>;
    cancel(input: { resultNote?: string; performerIds?: string[]; performedAt?: string; stableId: string; activityId: string; version: number }): Promise<Activity>;
    claim(input: { resultNote?: string; performerIds?: string[]; performedAt?: string; stableId: string; activityId: string; version: number }): Promise<Activity>;
    log(input: { from?: string; to?: string; cursor?: string; limit?: number; stableId: string; horseId: string }): Promise<HorseLog>;
    catalog(input: { studentId?: string; stableId: string }): Promise<ScheduleCatalog>;
    training(input: { resultNote?: string; performerIds?: string[]; performedAt?: string; sessionId?: string; durationMin?: null | number; summary?: string; stableId: string; activityId: string; version: number }): Promise<Activity>;
}

export function createStableActivitiesClient(baseUrl: string): StableActivitiesApi {
    return {
        async week(input) {
            const pathParams = new Set(['stableId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables/${input.stableId}/week${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activities`, body });
        },
        async get(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}`, body });
        },
        async complete(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}/complete`, body });
        },
        async reopen(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}/reopen`, body });
        },
        async cancel(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}/cancel`, body });
        },
        async claim(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}/claim`, body });
        },
        async log(input) {
            const pathParams = new Set(['stableId', 'horseId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables/${input.stableId}/horses/${input.horseId}/log${qs ? '?' + qs : ''}` });
        },
        async catalog(input) {
            const pathParams = new Set(['stableId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables/${input.stableId}/catalog${qs ? '?' + qs : ''}` });
        },
        async training(input) {
            const pathParams = new Set(['stableId', 'activityId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/activities/${input.activityId}/training`, body });
        },
    };
}
