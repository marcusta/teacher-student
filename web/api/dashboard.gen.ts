// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface DashboardView {
    capabilities: DashboardCapabilities;
    nextLesson: null | DashboardNextLesson;
    latestFeedback: null | DashboardFeedback;
    awaitingFeedback: DashboardAwaitingItem[];
    activePlans: DashboardPlanRef[];
    goalsNearingTarget: DashboardGoalRef[];
    pendingInvitations: number;
    generatedAt: string;
}

export interface DashboardCapabilities {
    teaches: boolean;
    rides: boolean;
}

export interface DashboardNextLesson {
    id: string;
    scheduledAt: string;
    role: 'student' | 'teacher';
    counterpartyDisplayName: string;
    horseName: null | string;
    planId: null | string;
    planTitle: null | string;
    exercisePreview: string[];
    exerciseCount: number;
}

export interface DashboardFeedback {
    noteId: string;
    parentKind: 'lesson' | 'training_session' | 'training_session_exercise' | 'lesson_exercise' | 'goal';
    parentId: string;
    targetKind: 'lesson' | 'training_session' | 'goal';
    targetId: string;
    targetLabel: string;
    exerciseName: null | string;
    authorId: string;
    authorDisplayName: string;
    body: string;
    createdAt: string;
}

export interface DashboardAwaitingItem {
    kind: 'lesson' | 'training_session';
    id: string;
    occurredAt: string;
    studentDisplayName: string;
    horseName: null | string;
}

export interface DashboardPlanRef {
    id: string;
    title: string;
    startDate: null | string;
    endDate: null | string;
    primaryTeacherDisplayName: null | string;
}

export interface DashboardGoalRef {
    id: string;
    title: string;
    targetDate: string;
}

export interface DashboardApi {
    get(): Promise<DashboardView>;
}

export function createDashboardClient(baseUrl: string): DashboardApi {
    return {
        async get() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/dashboard` });
        },
    };
}
