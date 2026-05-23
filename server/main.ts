import * as path from 'node:path';
import type { Database } from './db/schema';
import { config } from '@basics/core/server/config';
import { createApp } from '@basics/core/server/app';
import { log } from '@basics/core/server/logger';
import { createServices } from './services/index';

// --- Composition root ---

const { app, db, bootstrapAuth } = await createApp<Database>(path.join(import.meta.dir, 'db/migrations'));

const { userService } = createServices(db);

await bootstrapAuth({
    verify: (u, p) => userService.verify(u, p),
    findUser: (id) => userService.findById(id),
});

// --- Feature API mounts go here ---
// mount(app, '/api', createXxxApi(...));

// --- Dev seed ---

if (process.env.NODE_ENV !== 'production') {
    try {
        await userService.register('alice', 'password123');
        log.info({ msg: 'dev seed: created user alice' });
    } catch {
        // Already exists (unique constraint) — ignore
    }
}

// --- Start ---

export default { port: config.port, fetch: app.fetch };

log.info({ msg: 'server started', port: config.port });
