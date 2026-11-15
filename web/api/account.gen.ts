// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface AccountApi {
    changePassword(input: { currentPassword: string; newPassword: string }): Promise<{ ok: true }>;
}

export function createAccountClient(baseUrl: string): AccountApi {
    return {
        async changePassword(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/account/password`, body: input });
        },
    };
}
