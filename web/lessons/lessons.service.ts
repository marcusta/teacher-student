import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Lesson, type LessonForUser } from '../api';

/**
 * Owns the current user's Lessons as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals plus `load` / `create`.
 * For 012 the list is the teacher's own lessons (server-side scope);
 * 013 will widen the endpoint to include lessons-where-I'm-the-student
 * without changing this surface.
 */
export class LessonsService {
    readonly items = new Signal<LessonForUser[]>([]);
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
        // Server returns the base Lesson; reload so the row carries the
        // role + counterparty fields the unified GET /api/lessons supplies.
        await this.load();
        return true;
    }

    /** Resolve a single Lesson from the loaded list — no extra round-trip. */
    get(id: string): LessonForUser | null {
        return this.items.get().find((l) => l.id === id) ?? null;
    }

    async update(
        id: string,
        patch: { horseId?: string | null; scheduledAt?: string },
    ): Promise<Lesson | null> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.update({ id, ...patch }),
        );
        if (!result) return null;
        // The PATCH response is a plain Lesson (no role/counterparty); reload
        // to keep the list rows consistent with what GET /api/lessons returns.
        await this.load();
        return result;
    }

    async transition(id: string, target: 'completed' | 'cancelled'): Promise<Lesson | null> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.transition({ id, target }),
        );
        if (!result) return null;
        await this.load();
        return result;
    }
}
