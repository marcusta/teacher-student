import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Student, type Horse, type TrainingSession, type ExerciseHistoryEntry } from '../api';

/**
 * Owns the teacher's roster of Students plus lookup-by-id for the detail
 * page. Deep module: callers read `items`, `loading`, `error` or call
 * `load()` / `get(id)`. The HTTP calls and request lifecycle stay here.
 */
export class StudentsService {
    readonly items = new Signal<Student[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.students.list());
        if (result) this.items.set(result);
    }

    async get(id: string): Promise<Student | null> {
        const result = await request(this.loading, this.error, () => api.students.get({ id }));
        return result ?? null;
    }

    async listHorses(studentId: string): Promise<Horse[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.students.listHorses({ id: studentId }),
        );
        return result ?? null;
    }

    async listTrainingSessions(studentId: string): Promise<TrainingSession[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.students.listTrainingSessions({ id: studentId }),
        );
        return result ?? null;
    }

    async exerciseHistory(
        studentId: string,
        exerciseId: string,
    ): Promise<ExerciseHistoryEntry[] | null> {
        const result = await request(this.loading, this.error, () =>
            api.students.exerciseHistory({ id: studentId, exerciseId }),
        );
        return result ?? null;
    }
}
