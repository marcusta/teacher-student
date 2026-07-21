import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Student, type ExerciseHistoryEntry } from '../api';

/**
 * The teacher's roster, as observable state.
 *
 * Callers read `items`, `loading`, `error`, `resolved` or call `load()`. It is a
 * singleton in the DI container and is prefetched by the app shell, so several
 * views share this one list.
 *
 * **It deliberately no longer owns the per-Student fetches** (horses, plans,
 * goals, training sessions). Those used to run through the same `loading` and
 * `error` signals as the roster, which meant a failed goals request rendered
 * the roster as broken and a slow one made unrelated sections inert — the exact
 * shape of failure IA §3.3 and §3.4 forbid. They now live in the views that
 * show them, one `Async` per section (see `./async.ts`), so a section that
 * fails fails alone.
 */
export class StudentsService {
    readonly items = new Signal<Student[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    /** True once a load has completed, successfully or not. See `Async.resolved`. */
    readonly resolved = new Signal(false);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.students.list());
        if (result) this.items.set(result);
        this.resolved.set(true);
    }

    async get(id: string): Promise<Student | null> {
        const result = await request(this.loading, this.error, () => api.students.get({ id }));
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
