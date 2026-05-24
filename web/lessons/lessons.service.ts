import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Lesson } from '../api';

/**
 * Owns the current user's Lessons as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals plus `load` / `create`.
 * For 012 the list is the teacher's own lessons (server-side scope);
 * 013 will widen the endpoint to include lessons-where-I'm-the-student
 * without changing this surface.
 */
export class LessonsService {
    readonly items = new Signal<Lesson[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.lessons.list());
        if (result) this.items.set(result);
    }

    async create(input: { studentId: string; scheduledAt: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.create(input),
        );
        if (!result) return false;
        // listForTeacher is ordered scheduled_at ASC — re-sort the local list.
        const next = [...this.items.get(), result].sort((a, b) =>
            a.scheduledAt < b.scheduledAt ? -1 : 1,
        );
        this.items.set(next);
        return true;
    }
}
