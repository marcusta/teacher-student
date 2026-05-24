import { createRegisterClient } from './api/register.gen';
import { createInvitationsClient } from './api/invitations.gen';
import { createStudentsClient } from './api/students.gen';

export { ApiError } from '@basics/core/client/api-error';
export type { Invitation } from './api/invitations.gen';
export type { Student } from './api/students.gen';

export const api = {
    register: createRegisterClient('/api'),
    invitations: createInvitationsClient('/api'),
    students: createStudentsClient('/api'),
};
