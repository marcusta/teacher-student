import { Signal, batch } from '@basics/core/client/core';
import { ApiError } from '@basics/core/client/api-error';
import { request, type RequestError } from '@basics/core/client/request';

/**
 * One independently-loading slice of a view.
 *
 * IA §3.3 and §3.4 both ask for the same thing in different words: "Students
 * and invitations load independently; one failing must not erase the other",
 * and "Each tab owns its loading, empty, and error state." A single service
 * with one shared `loading`/`error` pair cannot express either — which is
 * exactly what `StudentsService` used to be, so a failed goals request painted
 * the horses list as broken too, and a slow one made every section inert.
 *
 * So state is per-fetch, and each holder is a plain object a component can own
 * as many of as it has sections. Deliberately not a service: two Elevvy tabs
 * reading the same endpoint for different students must not share a signal.
 *
 * `resolved` is separate from `loading` because "finished, and the answer was
 * nothing" and "not asked yet" are different states, and only the first may
 * render an empty state. Without it, every section flashes its empty copy in
 * the moment before its request goes out.
 */
export class Async<T> {
    readonly data = new Signal<T | null>(null);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    /** True once a fetch has completed, successfully or not. */
    readonly resolved = new Signal(false);
    /** HTTP status of the last failure, where there was one. See `notFound`. */
    readonly status = new Signal<number | undefined>(undefined);

    private started = false;

    /**
     * Run the fetch. Errors land in `error`, never thrown — a section that
     * cannot load is a state this view renders, not an exception it propagates.
     */
    async run(fn: () => Promise<T>): Promise<void> {
        this.started = true;
        this.status.set(undefined);
        const result = await request(this.loading, this.error, () => fn().catch((err) => {
            // `request()` flattens every ApiError to a RequestError code, and
            // 404 lands in the same 'server' bucket as a 500. Elevvy has to
            // tell those apart — one is "not your student", the other is "we
            // are broken" — so the status is captured on the way past.
            if (err instanceof ApiError) this.status.set(err.status);
            throw err;
        }));
        batch(() => {
            if (this.error.peek() === null) this.data.set(result as T);
            this.resolved.set(true);
        });
    }

    /**
     * Run once. Elevvy's tabs load on first activation, and switching back to a
     * tab must not refetch — the tab row is navigation, not a refresh button.
     */
    async runOnce(fn: () => Promise<T>): Promise<void> {
        if (this.started) return;
        await this.run(fn);
    }

    /** Force the next `runOnce` to fetch again. Used by the retry action. */
    reset(): void {
        this.started = false;
    }

    /** True when the section resolved to nothing, and nothing went wrong. */
    isEmpty(count: (data: T) => number): boolean {
        const data = this.data.get();
        return this.resolved.get()
            && this.error.get() === null
            && (data === null || count(data) === 0);
    }
}
