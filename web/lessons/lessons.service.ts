import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Lesson, type LessonForUser, type LessonExerciseRef } from '../api';

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

    /**
     * Book a Lesson in the order IA §3.7 specifies: Student, time, Horse, Plan,
     * then one or more Programs.
     *
     * Two of those the create contract cannot take in one call, so this method
     * owns the follow-ups rather than leaking them into the view:
     *
     * - `POST /lessons` accepts a single `programId`, but the IA asks for *one
     *   or more* Programs. The first goes in the create body; the rest are
     *   attached afterwards. Each attach copies that Program's Exercises — the
     *   Lesson never follows the Program.
     * - `POST /lessons` has no `horseId` at all, so the Horse is a PATCH. The
     *   IA calls this out as "Composable after Student selection", which is
     *   exactly what it is: composable, not free.
     *
     * Returns null when the create itself failed, otherwise the created Lesson
     * plus an `incomplete` flag. Losing the booking because a Program could not
     * be attached would be the worse outcome, so a failed follow-up keeps the
     * Lesson — but it must not be reported as a clean success either.
     *
     * `request` clears `error` at the *start* of every call, so a failure in
     * the middle of this sequence is erased by whatever runs next (including
     * the closing `load()`). Failures are therefore captured as they happen and
     * the first one is restored onto `error` at the end; without that the user
     * gets a success toast and a Lesson silently missing a Program or a Horse.
     */
    async create(input: {
        studentId: string;
        scheduledAt: string;
        planId?: string;
        horseId?: string;
        programIds?: string[];
    }): Promise<{ lesson: Lesson; incomplete: boolean } | null> {
        const [firstProgram, ...restPrograms] = input.programIds ?? [];
        const created = await request(this.loading, this.error, () =>
            api.lessons.create({
                studentId: input.studentId,
                scheduledAt: input.scheduledAt,
                ...(input.planId ? { planId: input.planId } : {}),
                ...(firstProgram ? { programId: firstProgram } : {}),
            }),
        );
        if (!created) return null;

        let firstFailure: RequestError | null = null;
        const followUp = async (fn: () => Promise<unknown>): Promise<void> => {
            const ok = await request(this.loading, this.error, fn);
            if (ok === undefined && !firstFailure) firstFailure = this.error.get();
        };

        for (const programId of restPrograms) {
            await followUp(() => api.lessons.attachProgram({ id: created.id, programId }));
        }
        if (input.horseId) {
            await followUp(() => api.lessons.update({ id: created.id, horseId: input.horseId! }));
        }

        // Server returns the base Lesson; reload so the row carries the
        // role + counterparty fields the unified GET /api/lessons supplies.
        await this.load();
        if (firstFailure) this.error.set(firstFailure);
        return { lesson: created, incomplete: firstFailure !== null };
    }

    /**
     * Fetch one Lesson from `GET /lessons/:id` and merge it into `items`, so
     * `/lektioner/:id` deep-links without first pulling the whole list.
     * Returns null when the Lesson is missing or not ours (server answers 404
     * either way — leak-safe).
     */
    async loadOne(id: string): Promise<LessonForUser | null> {
        const result = await request(this.loading, this.error, () => api.lessons.get({ id }));
        if (!result) return null;
        const items = this.items.get();
        const at = items.findIndex((l) => l.id === id);
        this.items.set(at === -1
            ? [...items, result]
            : [...items.slice(0, at), result, ...items.slice(at + 1)]);
        return result;
    }

    /**
     * Resolve a single Lesson from the loaded list — no round-trip. Callers
     * that may not have the list yet should `await loadOne(id)` first; the
     * result lands in `items` and is readable here.
     */
    get(id: string): LessonForUser | null {
        return this.items.get().find((l) => l.id === id) ?? null;
    }

    async update(
        id: string,
        patch: { horseId?: string | null; scheduledAt?: string; planId?: string | null },
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

    async addExercise(lessonId: string, exerciseId: string): Promise<LessonExerciseRef[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.addExercise({ id: lessonId, exerciseId }),
        );
        if (!result) return null;
        await this.load();
        return result;
    }

    async removeExercise(lessonId: string, exerciseId: string): Promise<LessonExerciseRef[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.removeExercise({ id: lessonId, exerciseId }),
        );
        if (!result) return null;
        await this.load();
        return result;
    }

    async attachProgram(lessonId: string, programId: string): Promise<Lesson | null> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.attachProgram({ id: lessonId, programId }),
        );
        if (!result) return null;
        await this.load();
        return result;
    }

    async detachProgram(lessonId: string, programId: string): Promise<Lesson | null> {
        const result = await request(this.loading, this.error, () =>
            api.lessons.detachProgram({ id: lessonId, programId }),
        );
        if (!result) return null;
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
