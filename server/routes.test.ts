import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import { createTestDb, type SeedFn } from './testing/db';
import { seedUser } from './db/seeds/users';
import { mount } from '@basics/core/server/mount';
import { SessionStore, createAuth, createAuthApi } from '@basics/core/server/auth';
import { createRegisterApi } from './api/register.api';
import { createInvitationsApi } from './api/invitations.api';
import { createStudentsApi } from './api/students.api';
import { createExercisesApi } from './api/exercises.api';
import { createHorsesApi } from './api/horses.api';

async function setup(seeds: SeedFn[] = []) {
    const { userService, invitationService, relationService, exerciseService, horseService } = await createTestDb(...seeds);

    const sessions = new SessionStore(':memory:');
    await sessions.init();

    const app = new Hono();
    app.get('/api/health', (c) => c.json({ ok: true }));
    app.use(createAuth(sessions, (id) => userService.findById(id)));
    mount(app, '/api', createAuthApi({ verify: (u, p) => userService.verify(u, p), sessions }));
    mount(app, '/api', createRegisterApi(userService, sessions));
    mount(app, '/api', createInvitationsApi(invitationService));
    mount(app, '/api', createStudentsApi(relationService));
    mount(app, '/api', createExercisesApi(exerciseService));
    mount(app, '/api', createHorsesApi(horseService));

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

// --- Invitations ---

test('POST /api/invitations without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'x@example.com' });
    expect(res.status).toBe(401);
});

test('POST /api/invitations happy path creates pending invitation', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.inviteeEmail).toBe('student@example.com');
    expect(data.status).toBe('pending');
    expect(data.id).toBeString();
});

test('POST /api/invitations duplicate pending returns 409', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, cookie);
    const res = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, cookie);
    expect(res.status).toBe(409);
});

test('POST /api/invitations/revoke happy path', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, cookie);
    const { id } = await created.json();

    const res = await req(app, 'POST', '/api/invitations/revoke', { invitationId: id }, cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ changed: true });
});

test('POST /api/invitations/revoke by non-owner returns 403', async () => {
    const { app } = await setup([seedUser]);
    // Anna creates invitation
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, annaCookie);
    const { id } = await created.json();

    // Register a second user (Bob) and try to revoke Anna's invitation
    await req(app, 'POST', '/api/auth/register', {
        email: 'bob@example.com', password: 'secret123', displayName: 'Bob',
    });
    const bobCookie = await loginAs(app, 'bob@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/invitations/revoke', { invitationId: id }, bobCookie);
    expect(res.status).toBe(403);
});

test('GET /api/invitations returns this teacher\'s invitations', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/invitations', { inviteeEmail: 'a@example.com' }, cookie);
    await req(app, 'POST', '/api/invitations', { inviteeEmail: 'b@example.com' }, cookie);

    const res = await req(app, 'GET', '/api/invitations', undefined, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data.map((i: { inviteeEmail: string }) => i.inviteeEmail).sort()).toEqual(['a@example.com', 'b@example.com']);
});

test('POST /api/auth/logout clears session', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/auth/logout', {}, cookie);
    const res = await req(app, 'GET', '/api/auth/me', undefined, cookie);
    expect(res.status).toBe(401);
});

// --- Invitations: inbox + accept/decline ---

async function registerAndLogin(app: Hono, email: string, password = 'secret123', displayName = email): Promise<string> {
    await req(app, 'POST', '/api/auth/register', { email, password, displayName });
    return loginAs(app, email, password);
}

test('GET /api/invitations/inbox without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/invitations/inbox');
    expect(res.status).toBe(401);
});

test('GET /api/invitations/inbox returns pending invitations addressed to me', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, teacherCookie);

    const studentCookie = await registerAndLogin(app, 'student@example.com');
    const res = await req(app, 'GET', '/api/invitations/inbox', undefined, studentCookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].inviteeEmail).toBe('student@example.com');
});

test('POST /api/invitations/accept happy path returns Relation', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, teacherCookie);
    const { id: invitationId } = await created.json();

    const studentCookie = await registerAndLogin(app, 'student@example.com');
    const res = await req(app, 'POST', '/api/invitations/accept', { invitationId }, studentCookie);
    expect(res.status).toBe(200);
    const relation = await res.json();
    expect(relation.id).toBeString();
    expect(relation.invitationId).toBe(invitationId);
});

test('POST /api/invitations/accept by non-invitee returns 403', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, teacherCookie);
    const { id: invitationId } = await created.json();

    const intruderCookie = await registerAndLogin(app, 'someone-else@example.com');
    const res = await req(app, 'POST', '/api/invitations/accept', { invitationId }, intruderCookie);
    expect(res.status).toBe(403);
});

test('POST /api/invitations/accept on revoked returns 409 with currentStatus', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, teacherCookie);
    const { id: invitationId } = await created.json();
    await req(app, 'POST', '/api/invitations/revoke', { invitationId }, teacherCookie);

    const studentCookie = await registerAndLogin(app, 'student@example.com');
    const res = await req(app, 'POST', '/api/invitations/accept', { invitationId }, studentCookie);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.detail?.currentStatus).toBe('revoked');
});

test('POST /api/invitations/decline happy path returns ok', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: 'student@example.com' }, teacherCookie);
    const { id: invitationId } = await created.json();

    const studentCookie = await registerAndLogin(app, 'student@example.com');
    const res = await req(app, 'POST', '/api/invitations/decline', { invitationId }, studentCookie);
    expect(res.status).toBe(200);
});

// --- Students ---

async function acceptInvitationFor(app: Hono, teacherCookie: string, studentEmail: string): Promise<string> {
    const created = await req(app, 'POST', '/api/invitations', { inviteeEmail: studentEmail }, teacherCookie);
    const { id: invitationId } = await created.json();
    const studentCookie = await registerAndLogin(app, studentEmail);
    await req(app, 'POST', '/api/invitations/accept', { invitationId }, studentCookie);
    return studentCookie;
}

test('GET /api/students without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/students');
    expect(res.status).toBe(401);
});

test('GET /api/students returns only my accepted students', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    await acceptInvitationFor(app, teacherCookie, 'student@example.com');

    // Another teacher with another student — must not leak into Anna's list.
    const otherTeacherCookie = await registerAndLogin(app, 'other-teacher@example.com');
    await acceptInvitationFor(app, otherTeacherCookie, 'other-student@example.com');

    const res = await req(app, 'GET', '/api/students', undefined, teacherCookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.map((s: { email: string }) => s.email)).toEqual(['student@example.com']);
});

test('GET /api/students/:id returns student when Relation exists', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    await acceptInvitationFor(app, teacherCookie, 'student@example.com');

    const list = await (await req(app, 'GET', '/api/students', undefined, teacherCookie)).json();
    const studentId = list[0].id;

    const res = await req(app, 'GET', `/api/students/${studentId}`, undefined, teacherCookie);
    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe('student@example.com');
});

test('GET /api/students/:id returns 404 for another teacher\'s student', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const otherTeacherCookie = await registerAndLogin(app, 'other-teacher@example.com');
    await acceptInvitationFor(app, otherTeacherCookie, 'other-student@example.com');

    const list = await (await req(app, 'GET', '/api/students', undefined, otherTeacherCookie)).json();
    const studentId = list[0].id;

    const res = await req(app, 'GET', `/api/students/${studentId}`, undefined, teacherCookie);
    expect(res.status).toBe(404);
});

// --- Exercises ---

test('GET /api/exercises without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/exercises');
    expect(res.status).toBe(401);
});

test('POST /api/exercises happy path returns created Exercise', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/exercises',
        { name: 'Skritt', description: 'Lös tygel.' }, cookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBeString();
    expect(data.name).toBe('Skritt');
    expect(data.description).toBe('Lös tygel.');
});

test('POST /api/exercises empty name returns 400', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/exercises', { name: '' }, cookie);
    expect(res.status).toBe(400);
});

test('GET /api/exercises lists only my exercises', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/exercises', { name: 'A1' }, annaCookie);

    const otherCookie = await registerAndLogin(app, 'other@example.com');
    await req(app, 'POST', '/api/exercises', { name: 'O1' }, otherCookie);

    const res = await req(app, 'GET', '/api/exercises', undefined, annaCookie);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.map((e: { name: string }) => e.name)).toEqual(['A1']);
});

test('GET /api/exercises/:id returns 200 for own', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'X' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'GET', `/api/exercises/${id}`, undefined, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('X');
});

test('GET /api/exercises/:id returns 404 for other teacher', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'X' }, annaCookie);
    const { id } = await created.json();

    const otherCookie = await registerAndLogin(app, 'other@example.com');
    const res = await req(app, 'GET', `/api/exercises/${id}`, undefined, otherCookie);
    expect(res.status).toBe(404);
});

test('PATCH /api/exercises/:id updates own', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'Old' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'PATCH', `/api/exercises/${id}`, { name: 'New' }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('New');
});

test('PATCH /api/exercises/:id on other teacher returns 404', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'X' }, annaCookie);
    const { id } = await created.json();

    const otherCookie = await registerAndLogin(app, 'other@example.com');
    const res = await req(app, 'PATCH', `/api/exercises/${id}`, { name: 'Hack' }, otherCookie);
    expect(res.status).toBe(404);
});

test('PATCH /api/exercises/:id empty name returns 400', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'X' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'PATCH', `/api/exercises/${id}`, { name: '' }, cookie);
    expect(res.status).toBe(400);
});

test('DELETE /api/exercises/:id removes own', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'X' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'DELETE', `/api/exercises/${id}`, undefined, cookie);
    expect(res.status).toBe(200);

    const list = await (await req(app, 'GET', '/api/exercises', undefined, cookie)).json();
    expect(list.length).toBe(0);
});

test('DELETE /api/exercises/:id on other teacher returns 404', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/exercises', { name: 'X' }, annaCookie);
    const { id } = await created.json();

    const otherCookie = await registerAndLogin(app, 'other@example.com');
    const res = await req(app, 'DELETE', `/api/exercises/${id}`, undefined, otherCookie);
    expect(res.status).toBe(404);
});

test('DELETE /api/exercises/:id without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'DELETE', '/api/exercises/anything');
    expect(res.status).toBe(401);
});

// --- Horses ---

test('GET /api/horses without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/horses');
    expect(res.status).toBe(401);
});

test('POST /api/horses happy path returns created Horse', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/horses', { name: 'Pegasus' }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Pegasus');
    expect(body.archivedAt).toBeNull();
});

test('POST /api/horses empty name returns 400', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/horses', { name: '' }, cookie);
    expect(res.status).toBe(400);
});

test('GET /api/horses lists only my horses', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/horses', { name: 'A1' }, annaCookie);
    const otherCookie = await registerAndLogin(app, 'other@example.com');
    await req(app, 'POST', '/api/horses', { name: 'O1' }, otherCookie);

    const res = await req(app, 'GET', '/api/horses', undefined, annaCookie);
    const list = await res.json();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('A1');
});

test('GET /api/horses/:id returns 200 for own', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'X' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'GET', `/api/horses/${id}`, undefined, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('X');
});

test('GET /api/horses/:id returns 404 for other student', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'X' }, annaCookie);
    const { id } = await created.json();
    const otherCookie = await registerAndLogin(app, 'other@example.com');
    const res = await req(app, 'GET', `/api/horses/${id}`, undefined, otherCookie);
    expect(res.status).toBe(404);
});

test('PATCH /api/horses/:id updates own', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'Old' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'PATCH', `/api/horses/${id}`, { name: 'New' }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe('New');
});

test('PATCH /api/horses/:id on other student returns 404', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'X' }, annaCookie);
    const { id } = await created.json();
    const otherCookie = await registerAndLogin(app, 'other@example.com');
    const res = await req(app, 'PATCH', `/api/horses/${id}`, { name: 'Hack' }, otherCookie);
    expect(res.status).toBe(404);
});

test('PATCH /api/horses/:id empty name returns 400', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'X' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'PATCH', `/api/horses/${id}`, { name: '' }, cookie);
    expect(res.status).toBe(400);
});

test('DELETE /api/horses/:id archives own (excluded from list)', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'X' }, cookie);
    const { id } = await created.json();
    const res = await req(app, 'DELETE', `/api/horses/${id}`, undefined, cookie);
    expect(res.status).toBe(200);
    const list = await (await req(app, 'GET', '/api/horses', undefined, cookie)).json();
    expect(list.length).toBe(0);
});

test('DELETE /api/horses/:id on other student returns 404', async () => {
    const { app } = await setup([seedUser]);
    const annaCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const created = await req(app, 'POST', '/api/horses', { name: 'X' }, annaCookie);
    const { id } = await created.json();
    const otherCookie = await registerAndLogin(app, 'other@example.com');
    const res = await req(app, 'DELETE', `/api/horses/${id}`, undefined, otherCookie);
    expect(res.status).toBe(404);
});
