// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Student {
    id: string;
    email: string;
    displayName: string;
}

export interface TeachersApi {
    list(): Promise<Student[]>;
}

export function createTeachersClient(baseUrl: string): TeachersApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/teachers` });
        },
    };
}
