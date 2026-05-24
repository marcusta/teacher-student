import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { AuthService } from '@basics/core/client/auth';
import { di } from '@basics/core/client/core';
import { api } from '../api';

/**
 * Self-registration flow. Wraps the register API call and, on success,
 * triggers `AuthService.load()` so the new session is reflected in
 * `currentUser` without an extra round-trip from the caller.
 */
export class RegisterService {
    private auth = di.get(AuthService);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async register(input: { email: string; password: string; displayName: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.register.register(input));
        if (!result) return false;
        await this.auth.load();
        return this.auth.currentUser.get() !== null;
    }
}
