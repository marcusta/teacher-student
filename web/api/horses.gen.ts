// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Horse {
    id: string;
    studentId: string;
    name: string;
    archivedAt: null | string;
    createdAt: string;
    updatedAt: string;
}

export interface HorsesApi {
    create(input: { name: string }): Promise<Horse>;
    list(): Promise<Horse[]>;
}

export function createHorsesClient(baseUrl: string): HorsesApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/horses`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/horses` });
        },
    };
}
