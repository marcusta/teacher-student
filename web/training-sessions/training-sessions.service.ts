import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type TrainingSession, type TrainingSessionExerciseRef } from '../api';

/**
 * Owns the current user's Training Sessions as observable state. Deep module:
 * exposes `items`, `loading`, `error` signals plus the mutations. The server
 * scopes everything to the authenticated user, so no studentId is ever passed
 * from the client.
 *
 * `items` holds sessions the user can *reach*, which is not the same as sessions
 * they own: `GET /training-sessions` returns the owner's own log, but `loadOne`
 * also resolves a session a Teacher was shared into. Ownership is therefore a
 * per-session question (`studentId === me`), answered by the view, not a
 * property of this list.
 */
export class TrainingSessionsService {
    readonly items = new Signal<TrainingSession[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.trainingSessions.list());
        if (result) this.items.set(result);
    }

    /**
     * Log a session — IA §3.9 "Creation", in one call.
     *
     * Unlike `POST /lessons`, this contract takes **everything the creation
     * sequence collects**: performed time, duration, summary, horse, plan, one
     * Program, and the whole share set. The service writes the session and its
     * Program snapshot inside a transaction, so there is no follow-up PATCH and
     * therefore no partial-success state to report — a session either exists
     * complete or was never created. That is why this method returns the session
     * rather than the `{ session, incomplete }` shape the Lesson equivalent
     * needs, and why the view can honestly show a plain success.
     *
     * The one thing the IA asks for that the contract does not take is *more
     * than one* Program — and it does not ask: §3.9 step 6 is "Optional Program",
     * singular. Additional Programs are attached from the detail view, where each
     * attach is its own call with its own outcome.
     */
    async create(input: {
        performedAt: string;
        durationMin?: number | null;
        summary?: string | null;
        horseId?: string | null;
        planId?: string;
        programId?: string;
        shareWithTeacherIds?: string[];
    }): Promise<TrainingSession | null> {
        const created = await request(this.loading, this.error, () =>
            api.trainingSessions.create(input),
        );
        if (!created) return null;
        this.merge(created);
        return created;
    }

    /**
     * Fetch one session from `GET /training-sessions/:id` and merge it into
     * `items`, so `/traningspass/:id` deep-links without first pulling the list.
     * Returns null when the session is missing, not ours and not shared with us —
     * the server answers 404 for all three, which is what keeps it leak-safe.
     */
    async loadOne(id: string): Promise<TrainingSession | null> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.get({ id }),
        );
        if (!result) return null;
        this.merge(result);
        return result;
    }

    /** Resolve a loaded session — no round-trip. `loadOne(id)` fills this in. */
    get(id: string): TrainingSession | null {
        return this.items.get().find((s) => s.id === id) ?? null;
    }

    async update(
        id: string,
        patch: {
            performedAt?: string;
            durationMin?: number | null;
            summary?: string | null;
            horseId?: string | null;
            planId?: string | null;
            shareWithTeacherIds?: string[];
        },
    ): Promise<TrainingSession | null> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.update({ id, ...patch }),
        );
        if (!result) return null;
        this.merge(result);
        return result;
    }

    /**
     * Add an Exercise occurrence. The endpoint answers with the occurrence list
     * rather than the session, so the session is re-read to pick up the new row's
     * surrogate id — Notes hang off that id, and a thread cannot be mounted
     * against an occurrence the client has not seen.
     */
    async addExercise(id: string, exerciseId: string): Promise<TrainingSessionExerciseRef[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.addExercise({ id, exerciseId }),
        );
        if (!result) return null;
        await this.loadOne(id);
        return result;
    }

    async removeExercise(
        id: string,
        exerciseId: string,
    ): Promise<TrainingSessionExerciseRef[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.removeExercise({ id, exerciseId }),
        );
        if (!result) return null;
        await this.loadOne(id);
        return result;
    }

    async attachProgram(id: string, programId: string): Promise<TrainingSession | null> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.attachProgram({ id, programId }),
        );
        if (!result) return null;
        this.merge(result);
        return result;
    }

    async detachProgram(id: string, programId: string): Promise<TrainingSession | null> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.detachProgram({ id, programId }),
        );
        if (!result) return null;
        this.merge(result);
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.delete({ id }),
        );
        if (!result) return false;
        this.items.set(this.items.get().filter((s) => s.id !== id));
        return true;
    }

    /**
     * Replace one session in `items` in place, or append it.
     *
     * Every mutation here answers with the full session, so the list is updated
     * from the response instead of being refetched. That keeps the row the user
     * is looking at from flickering through a stale render, and it avoids the
     * trap `request()` sets: it clears `error` at the start of every call, so a
     * reload issued right after a failed write would erase the failure before
     * anyone could read it.
     */
    private merge(session: TrainingSession): void {
        const items = this.items.get();
        const at = items.findIndex((s) => s.id === session.id);
        this.items.set(at === -1
            ? [...items, session]
            : [...items.slice(0, at), session, ...items.slice(at + 1)]);
    }
}
