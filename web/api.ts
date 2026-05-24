import { createRegisterClient } from './api/register.gen';
import { createInvitationsClient } from './api/invitations.gen';

export { ApiError } from '@basics/core/client/api-error';
export type { Invitation } from './api/invitations.gen';

export const api = {
    register: createRegisterClient('/api'),
    invitations: createInvitationsClient('/api'),
};
