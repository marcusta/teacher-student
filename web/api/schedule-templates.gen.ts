// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface ScheduleTemplate {
    id: string;
    name: string;
    count: number;
    kind: 'day' | 'week';
    isDefault: boolean;
}

export interface ScheduleCopyResult {
    count: number;
    sourceCount: number;
    sourceVersion: string;
    createdIds: string[];
}

export interface ScheduleDayResult {
    added: boolean;
    count: number;
}

export interface ScheduleTemplatesApi {
    list(input: { stableId: string }): Promise<ScheduleTemplate[]>;
    save(input: { kind?: 'day' | 'week'; stableId: string; requestId: string; name: string; startDate: string }): Promise<ScheduleTemplate>;
    apply(input: { stableId: string; requestId: string; startDate: string; templateId: string; keepAssignees: boolean }): Promise<ScheduleCopyResult>;
    setDefault(input: { stableId: string; templateId: null | string }): Promise<{ ok: true }>;
    addDay(input: { stableId: string; date: string }): Promise<ScheduleDayResult>;
    routines(input: { stableId: string; requestId: string; startDate: string; typeIds: string[] }): Promise<ScheduleCopyResult>;
    copy(input: { week?: boolean; preview?: boolean; sourceVersion?: string; stableId: string; requestId: string; keepAssignees: boolean; sourceDate: string; targetDates: string[] }): Promise<ScheduleCopyResult>;
}

export function createScheduleTemplatesClient(baseUrl: string): ScheduleTemplatesApi {
    return {
        async list(input) {
            const pathParams = new Set(['stableId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/stables/${input.stableId}/templates${qs ? '?' + qs : ''}` });
        },
        async save(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/templates`, body });
        },
        async apply(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/templates/apply`, body });
        },
        async setDefault(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PUT', url: `${baseUrl}/stables/${input.stableId}/templates/default`, body });
        },
        async addDay(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/days`, body });
        },
        async routines(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/routines`, body });
        },
        async copy(input) {
            const pathParams = new Set(['stableId']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/stables/${input.stableId}/copy`, body });
        },
    };
}
