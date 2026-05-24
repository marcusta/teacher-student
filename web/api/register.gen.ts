// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface User {
    id: string;
    email: string;
    displayName: string;
}

export interface RegisterApi {
    register(input: { email: string; password: string; displayName: string }): Promise<User>;
}

export function createRegisterClient(baseUrl: string): RegisterApi {
    return {
        async register(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/auth/register`, body: input });
        },
    };
}
