import { createRegisterClient } from './api/register.gen';
import { createInvitationsClient } from './api/invitations.gen';
import { createStudentsClient } from './api/students.gen';
import { createExercisesClient } from './api/exercises.gen';

export { ApiError } from '@basics/core/client/api-error';
export type { Invitation, InboxInvitation } from './api/invitations.gen';
export type { Student } from './api/students.gen';
export type { Exercise } from './api/exercises.gen';

export const api = {
    register: createRegisterClient('/api'),
    invitations: createInvitationsClient('/api'),
    students: createStudentsClient('/api'),
    exercises: createExercisesClient('/api'),
};
