import * as path from 'node:path';
import type { Database } from './db/schema';
import { config } from '@basics/core/server/config';
import { createApp } from '@basics/core/server/app';
import { mount } from '@basics/core/server/mount';
import { log } from '@basics/core/server/logger';
import { createServices } from './services/index';
import { createRegisterApi } from './api/register.api';
import { createInvitationsApi } from './api/invitations.api';
import { createStudentsApi } from './api/students.api';

// --- Composition root ---

const { app, db, bootstrapAuth } = await createApp<Database>(path.join(import.meta.dir, 'db/migrations'));

const { userService, invitationService, relationService } = createServices(db);

const { sessions } = await bootstrapAuth({
    verify: (u, p) => userService.verify(u, p),
    findUser: (id) => userService.findById(id),
});

// --- Feature API mounts ---

mount(app, '/api', createRegisterApi(userService, sessions));
mount(app, '/api', createInvitationsApi(invitationService));
mount(app, '/api', createStudentsApi(relationService));

// --- Dev seed ---

if (process.env.NODE_ENV !== 'production') {
    try {
        await userService.register({
            email: 'anna@example.com',
            password: 'secret123',
            displayName: 'Anna Andersson',
        });
        log.info({ msg: 'dev seed: created user anna@example.com' });
    } catch {
        // Already exists (unique constraint) — ignore
    }
}

// --- Start ---

export default { port: config.port, fetch: app.fetch };

log.info({ msg: 'server started', port: config.port });
