// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Note {
    id: string;
    authorId: string;
    authorDisplayName: string;
    parentKind: 'lesson' | 'student' | 'training_session' | 'exercise_question';
    parentId: string;
    body: string;
    visibility: 'private' | 'shared';
    createdAt: string;
    updatedAt: string;
}

export interface NotesApi {
    create(input: { parentKind: 'lesson' | 'student' | 'training_session' | 'exercise_question'; parentId: string; body: string; visibility: 'private' | 'shared' }): Promise<Note>;
    list(input: { parentKind: 'lesson' | 'student' | 'training_session' | 'exercise_question'; parentId: string }): Promise<Note[]>;
    update(input: { body?: string; visibility?: 'private' | 'shared'; id: string }): Promise<Note>;
    delete(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createNotesClient(baseUrl: string): NotesApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/notes`, body: input });
        },
        async list(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/notes${qs ? '?' + qs : ''}` });
        },
        async update(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'PATCH', url: `${baseUrl}/notes/${input.id}`, body });
        },
        async delete(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/notes/${input.id}` });
        },
    };
}
