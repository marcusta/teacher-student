// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Exercise {
    id: string;
    teacherId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExercisesApi {
    create(input: { description?: string; name: string }): Promise<Exercise>;
    list(): Promise<Exercise[]>;
}

export function createExercisesClient(baseUrl: string): ExercisesApi {
    return {
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/exercises`, body: input });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/exercises` });
        },
    };
}
