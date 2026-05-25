import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Teacher } from '../api';

/** Observable list of the current student's connected Teachers (acting as student). */
export class TeachersService {
    readonly items = new Signal<Teacher[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.teachers.list());
        if (result) this.items.set(result);
    }
}
