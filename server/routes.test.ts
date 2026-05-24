import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import { createTestDb, type SeedFn } from './testing/db';
import { seedUser } from './db/seeds/users';
import { mount } from '@basics/core/server/mount';
import { SessionStore, createAuth, createAuthApi } from '@basics/core/server/auth';
import { createRegisterApi } from './api/register.api';

async function setup(seeds: SeedFn[] = []) {
    const { userService } = await createTestDb(...seeds);

    const sessions = new SessionStore(':memory:');
    await sessions.init();

    const app = new Hono();
    app.get('/api/health', (c) => c.json({ ok: true }));
    app.use(createAuth(sessions, (id) => userService.findById(id)));
    mount(app, '/api', createAuthApi({ verify: (u, p) => userService.verify(u, p), sessions }));
    mount(app, '/api', createRegisterApi(userService, sessions));

    return { app, sessions };
}

async function req(app: Hono, method: string, path: string, body?: any, cookie?: string): Promise<Response> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers['Cookie'] = cookie;

    return app.fetch(new Request(`http://localhost${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }));
}

function extractSessionCookie(res: Response): string | undefined {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return undefined;
    const match = setCookie.match(/session=([^;]+)/);
    return match ? `session=${match[1]}` : undefined;
}

async function loginAs(app: Hono, username: string, password: string): Promise<string> {
    const res = await req(app, 'POST', '/api/auth/login', { username, password });
    const cookie = extractSessionCookie(res);
    if (!cookie) throw new Error('Login failed — no session cookie');
    return cookie;
}

// --- Health ---

test('GET /api/health returns ok', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/health');
    expect(await res.json()).toEqual({ ok: true });
});

// --- Auth ---

test('POST /api/auth/login success returns user and sets cookie', async () => {
    const { app } = await setup([seedUser]);
    const res = await req(app, 'POST', '/api/auth/login', { username: 'anna@example.com', password: 'secret123' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe('anna@example.com');
    expect(extractSessionCookie(res)).toBeTruthy();
});

test('POST /api/auth/login failure returns 401', async () => {
    const { app } = await setup([seedUser]);
    const res = await req(app, 'POST', '/api/auth/login', { username: 'anna@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
});

test('GET /api/auth/me without session returns 401', async () => {
    const { app } = await setup([seedUser]);
    const res = await req(app, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
});

test('GET /api/auth/me with session returns user', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe('anna@example.com');
});

// --- Register ---

test('POST /api/auth/register creates user, returns user and sets cookie', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/auth/register', {
        email: 'new@example.com',
        password: 'secret123',
        displayName: 'New User',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe('new@example.com');
    expect(data.displayName).toBe('New User');
    expect(data.id).toBeString();
    expect(extractSessionCookie(res)).toBeTruthy();
});

test('POST /api/auth/register with duplicate email returns 409', async () => {
    const { app } = await setup([seedUser]);
    const res = await req(app, 'POST', '/api/auth/register', {
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna 2',
    });
    expect(res.status).toBe(409);
});

test('POST /api/auth/register with short password returns 400', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/auth/register', {
        email: 'new@example.com',
        password: 'short',
        displayName: 'New User',
    });
    expect(res.status).toBe(400);
});

test('POST /api/auth/register with empty displayName returns 400', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/auth/register', {
        email: 'new@example.com',
        password: 'secret123',
        displayName: '',
    });
    expect(res.status).toBe(400);
});

test('POST /api/auth/register with invalid email returns 400', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/auth/register', {
        email: 'not-an-email',
        password: 'secret123',
        displayName: 'New User',
    });
    expect(res.status).toBe(400);
});

test('after register, login with same credentials succeeds', async () => {
    const { app } = await setup();
    await req(app, 'POST', '/api/auth/register', {
        email: 'new@example.com',
        password: 'secret123',
        displayName: 'New User',
    });
    const res = await req(app, 'POST', '/api/auth/login', {
        username: 'new@example.com',
        password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(extractSessionCookie(res)).toBeTruthy();
});

test('POST /api/auth/logout clears session', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/auth/logout', {}, cookie);
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(401);
});
