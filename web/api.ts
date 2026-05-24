import { createRegisterClient } from './api/register.gen';

export { ApiError } from '@basics/core/client/api-error';

export const api = {
    register: createRegisterClient('/api'),
};
