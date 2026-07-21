import * as path from 'node:path';
import { serveStatic } from 'hono/bun';
import type { Database } from './db/schema';
import { createApp } from '@basics/core/server/app';
import { mount } from '@basics/core/server/mount';
import { log } from '@basics/core/server/logger';
import { createServices } from './services/index';
import { createRegisterApi } from './api/register.api';
import { createInvitationsApi } from './api/invitations.api';
import { createStudentsApi } from './api/students.api';
import { createExercisesApi } from './api/exercises.api';
import { createHorsesApi } from './api/horses.api';
import { createLessonsApi } from './api/lessons.api';
import { createNotesApi } from './api/notes.api';
import { createTrainingSessionsApi } from './api/training-sessions.api';
import { createTeachersApi } from './api/teachers.api';
import { createProgramsApi } from './api/programs.api';
import { createPlansApi } from './api/plans.api';
import { createGoalsApi } from './api/goals.api';
import { createDashboardApi } from './api/dashboard.api';

// --- Composition root ---

const { app, db, bootstrapAuth } = await createApp<Database>(path.join(import.meta.dir, 'db/migrations'));

const {
    userService, invitationService, relationService,
    exerciseService, horseService, lessonService, noteService,
    trainingSessionService, programService, planService, goalService,
    dashboardService,
} = createServices(db);

const { sessions } = await bootstrapAuth({
    verify: (u, p) => userService.verify(u, p),
    findUser: (id) => userService.findById(id),
});

// --- Feature API mounts ---

mount(app, '/api', createRegisterApi(userService, sessions));
mount(app, '/api', createInvitationsApi(invitationService));
mount(app, '/api', createStudentsApi(
    relationService, horseService, planService, trainingSessionService, lessonService, goalService,
));
mount(app, '/api', createExercisesApi(exerciseService));
mount(app, '/api', createHorsesApi(horseService));
mount(app, '/api', createLessonsApi(lessonService));
mount(app, '/api', createNotesApi(noteService));
mount(app, '/api', createTrainingSessionsApi(trainingSessionService));
mount(app, '/api', createTeachersApi(relationService));
mount(app, '/api', createProgramsApi(programService));
mount(app, '/api', createPlansApi(planService));
mount(app, '/api', createGoalsApi(goalService));
mount(app, '/api', createDashboardApi(dashboardService));

// --- Static client ---

// Serve the Vite-built SPA from ./public (committed to git, no build step on
// the server). Registered after the /api routes so they take precedence; any
// other path falls through to index.html for client-side routing.
app.use('/*', serveStatic({ root: './public' }));
app.get('/*', serveStatic({ path: './public/index.html' }));

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

// Default to 4810 (this service's assigned sig-infra port) when PORT is unset,
// instead of the framework's shared 3000 default — the systemd unit sets only
// NODE_ENV. `bun run dev:server` still overrides via PORT.
const port = Number(process.env.PORT ?? 4810);

export default { port, fetch: app.fetch };

log.info({ msg: 'server started', port });
