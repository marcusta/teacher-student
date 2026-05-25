// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Program {
    id: string;
    teacherId: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface ProgramsApi {
    create(input: { description?: string; title: string }): Promise<Program>;
    list(): Promise<Program[]>;
}

export function createProgramsClient(baseUrl: string): ProgramsApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/programs`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/programs` });
        },
    };
}
