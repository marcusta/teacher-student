import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type TrainingSession } from '../api';

/**
 * Owns the current student's Training Sessions as observable state. Deep
 * module: exposes `items`, `loading`, `error` signals plus CRUD methods.
 * The server scopes everything to the authenticated user, so we never
 * need to pass a studentId from the client.
 */
export class TrainingSessionsService {
    readonly items = new Signal<TrainingSession[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.trainingSessions.list());
        if (result) this.items.set(result);
    }

    async create(input: {
        performedAt: string;
        durationMin?: number | null;
        summary?: string | null;
        horseId?: string | null;
        planId?: string;
        shareWithTeacherIds?: string[];
        programId?: string;
    }): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.create(input),
        );
        if (!result) return false;
        await this.load();
        return true;
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
        await this.load();
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.trainingSessions.delete({ id }),
        );
        if (!result) return false;
        await this.load();
        return true;
    }
}
