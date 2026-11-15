import type { ActivityStatus, ActivityCategory } from '../db/schedule-schema';
import type { StableDetail, StableHorse } from './stable.service';

export interface ProgramSnapshot { id: string; title: string }
export interface ExerciseSnapshot { exerciseId: string; sourceProgramId: string | null; name: string; description: string; notes: string | null; sortOrder: number }
export interface Activity {
    id: string; stableId: string; typeId: string; category: ActivityCategory; horseId: string | null;
    title: string; date: string; time: string | null; offsetMinutes: number | null; instruction: string;
    status: ActivityStatus; resultNote: string; performedAt: string | null; completedAt: string | null;
    completedBy: string | null; createdBy: string; updatedBy: string; version: number;
    assigneeIds: string[]; performerIds: string[]; horseInactive: boolean;
    trainingStudentId: string | null; trainingSessionId: string | null; hasTrainingSession: boolean;
    hasProgram: boolean; programs: ProgramSnapshot[]; exercises: ExerciseSnapshot[];
    canEdit: boolean; canComplete: boolean; canClaim: boolean; canRegisterTraining: boolean;
}
export interface CreateActivityInput {
    requestId: string; typeId: string; horseId?: string | null; title: string; date: string;
    time?: string | null; offsetMinutes?: number | null; instruction?: string; assigneeIds?: string[];
    status?: 'planned' | 'completed'; resultNote?: string; performerIds?: string[]; performedAt?: string;
    trainingStudentId?: string | null; programIds?: string[]; exerciseIds?: string[];
}
export interface UpdateActivityInput {
    version: number; typeId?: string; horseId?: string | null; title?: string; date?: string;
    time?: string | null; offsetMinutes?: number | null; instruction?: string; resultNote?: string;
    assigneeIds?: string[]; trainingStudentId?: string | null; programIds?: string[]; exerciseIds?: string[];
    performedAt?: string; performerIds?: string[];
}
export interface CompleteActivityInput { version: number; resultNote?: string; performerIds?: string[]; performedAt?: string }
export interface ScheduleWeek { stable: StableDetail; startDate: string; activities: Activity[]; total: number; completed: number; unassigned: number }
export interface HorseLog { horse: StableHorse; stableName: string; timeZone: string; items: Activity[]; nextCursor: string | null }
export interface LogInput { from?: string; to?: string; cursor?: string; limit?: number }
