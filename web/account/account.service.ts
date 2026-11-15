import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';

/**
 * Kontoinställningar's one write. Wraps `POST /api/account/password` in the
 * loading/error signals the view binds to, exactly as `RegisterService` does.
 *
 * `request()` is called WITHOUT `{ sessionExpiry: false }`, and that is the
 * decision worth stating: the auth endpoints opt out because a 401 from
 * `POST /auth/login` means "wrong credentials". This call is different — it
 * already carries a session, and a wrong current password comes back as a 409.
 * So a 401 here means the session really has lapsed, and the default handling
 * (clear the client's auth state) is the correct response rather than something
 * to suppress.
 */
export class AccountService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async changePassword(input: { currentPassword: string; newPassword: string }): Promise<boolean> {
        const result = await request(this.loading, this.error, () => api.account.changePassword(input));
        return result !== undefined;
    }
}
