import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import { SessionStore, createAuth } from '@basics/core/server/auth';
import { mount } from '@basics/core/server/mount';
import { scheduleFixture } from '../testing/schedule';
import { createStablesApi } from './stables.api';
import { createStableActivitiesApi } from './stable-activities.api';

test('real sessions protect the weekly API and validate dates and optimistic versions', async () => {
    const c = await scheduleFixture(), sessions = new SessionStore(':memory:');
    await sessions.init();
    try {
        const app = new Hono();
        app.use(createAuth(sessions, id => c.userService.findById(id)));
        mount(app, '/api', createStablesApi(c.stableService));
        mount(app, '/api', createStableActivitiesApi(c.scheduleService, c.scheduleTrainingService));
        const cookie = `session=${await sessions.create(c.admin.id)}`;
        const request = (path: string, body?: unknown, signed = true) => app.request('/api' + path, { method: body ? 'POST' : 'GET', headers: { ...(signed ? { cookie } : {}), 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
        expect((await request('/stables', undefined, false)).status).toBe(401);
        expect((await request(`/stables/${c.stable.id}/week?startDate=2026-11-16`)).status).toBe(200);
        expect((await request(`/stables/${c.stable.id}/week?startDate=2026-02-30`)).status).toBe(409);
        const created = await request(`/stables/${c.stable.id}/activities`, { requestId: 'api-create', typeId: c.type('care'), horseId: c.horse.id, title: 'Markservice', date: '2026-11-18', assigneeIds: [c.admin.id] });
        expect(created.status).toBe(200);
        const activity = await created.json() as { id: string; version: number };
        const done = await request(`/stables/${c.stable.id}/activities/${activity.id}/complete`, { version: activity.version, resultNote: 'Klart' });
        expect(done.status).toBe(200);
        const other = `session=${await sessions.create(c.stranger.id)}`;
        expect((await app.request(`/api/stables/${c.stable.id}/week?startDate=2026-11-16`, { headers: { cookie: other } })).status).toBe(404);
        const invalid = await request(`/stables/${c.stable.id}/activities`, { requestId: 'bad', title: 'Saknar typ', date: 'fel' });
        expect(invalid.status).toBe(400);
    } finally { await sessions.close(); await c.db.destroy(); }
});
