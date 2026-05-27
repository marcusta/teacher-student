import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Note } from '../api';

type ParentKind = 'lesson' | 'student' | 'training_session' | 'exercise_question' | 'lesson_exercise' | 'training_session_exercise' | 'goal';

/**
 * Owns Notes for a single parent (e.g. a Lesson) as observable state.
 * Scoped per-mount: `load(parentKind, parentId)` (re)points the feed,
 * mutations reload to stay consistent with server-side visibility rules.
 */
export class NotesService {
    readonly items = new Signal<Note[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    private parentKind: ParentKind | null = null;
    private parentId: string | null = null;

    async load(parentKind: ParentKind, parentId: string): Promise<void> {
        this.parentKind = parentKind;
        this.parentId = parentId;
        const result = await request(this.loading, this.error, () =>
            api.notes.list({ parentKind, parentId }),
        );
        if (result) this.items.set(result);
    }

    async create(body: string, visibility: 'private' | 'shared'): Promise<boolean> {
        if (!this.parentKind || !this.parentId) return false;
        const result = await request(this.loading, this.error, () =>
            api.notes.create({
                parentKind: this.parentKind!,
                parentId: this.parentId!,
                body,
                visibility,
            }),
        );
        if (!result) return false;
        await this.reload();
        return true;
    }

    async update(id: string, patch: { body?: string; visibility?: 'private' | 'shared' }): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.notes.update({ id, ...patch }),
        );
        if (!result) return false;
        await this.reload();
        return true;
    }

    async delete(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.notes.delete({ id }),
        );
        if (!result) return false;
        await this.reload();
        return true;
    }

    private async reload(): Promise<void> {
        if (this.parentKind && this.parentId) {
            await this.load(this.parentKind, this.parentId);
        }
    }
}
