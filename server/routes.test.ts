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
import { createLessonsApi } from './api/lessons.api';
import { createNotesApi } from './api/notes.api';
import { createTrainingSessionsApi } from './api/training-sessions.api';
import { createTeachersApi } from './api/teachers.api';

async function setup(seeds: SeedFn[] = []) {
    const {
        userService, invitationService, relationService,
        exerciseService, horseService, lessonService, noteService,
        trainingSessionService,
    } = await createTestDb(...seeds);

    const sessions = new SessionStore(':memory:');
    await sessions.init();

    const app = new Hono();
    app.get('/api/health', (c) => c.json({ ok: true }));
    app.use(createAuth(sessions, (id) => userService.findById(id)));
    mount(app, '/api', createAuthApi({ verify: (u, p) => userService.verify(u, p), sessions }));
    mount(app, '/api', createRegisterApi(userService, sessions));
    mount(app, '/api', createInvitationsApi(invitationService));
    mount(app, '/api', createStudentsApi(relationService, horseService));
    mount(app, '/api', createExercisesApi(exerciseService));
    mount(app, '/api', createHorsesApi(horseService));
    mount(app, '/api', createLessonsApi(lessonService));
    mount(app, '/api', createNotesApi(noteService));
    mount(app, '/api', createTrainingSessionsApi(trainingSessionService));
    mount(app, '/api', createTeachersApi(relationService));

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

test('GET /api/students/:id/horses returns connected student\'s horses', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentCookie = await registerAndLogin(app, 'student@example.com');

    // Invite + accept to create the relation.
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'student@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);

    // Student adds horses.
    await req(app, 'POST', '/api/horses', { name: 'Visible' }, studentCookie);
    const arch = await (await req(app, 'POST', '/api/horses', { name: 'Archived' }, studentCookie)).json();
    await req(app, 'DELETE', `/api/horses/${arch.id}`, undefined, studentCookie);

    // Teacher fetches.
    const meRes = await (await req(app, 'GET', '/api/auth/me', undefined, studentCookie)).json();
    const res = await req(app, 'GET', `/api/students/${meRes.id}/horses`, undefined, teacherCookie);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.map((h: any) => h.name)).toEqual(['Visible']);
});

test('GET /api/students/:id/horses returns 404 for stranger', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const strangerCookie = await registerAndLogin(app, 'stranger@example.com');
    const me = await (await req(app, 'GET', '/api/auth/me', undefined, strangerCookie)).json();
    const res = await req(app, 'GET', `/api/students/${me.id}/horses`, undefined, teacherCookie);
    expect(res.status).toBe(404);
});

test('GET /api/students/:id/horses without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/students/anyone/horses');
    expect(res.status).toBe(401);
});

// --- Lessons ---

async function connectStudent(app: Hono, teacherCookie: string, studentEmail: string): Promise<string> {
    const studentCookie = await registerAndLogin(app, studentEmail);
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: studentEmail }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);
    const me = await (await req(app, 'GET', '/api/auth/me', undefined, studentCookie)).json();
    return me.id;
}

test('GET /api/lessons without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/lessons');
    expect(res.status).toBe(401);
});

test('POST /api/lessons happy path returns created Lesson', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const res = await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.studentId).toBe(studentId);
    expect(body.status).toBe('planned');
});

test('POST /api/lessons on stranger returns 404', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const strangerCookie = await registerAndLogin(app, 'stranger@example.com');
    const me = await (await req(app, 'GET', '/api/auth/me', undefined, strangerCookie)).json();
    const res = await req(app, 'POST', '/api/lessons',
        { studentId: me.id, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie);
    expect(res.status).toBe(404);
});

test('POST /api/lessons invalid scheduledAt returns 400', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const res = await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: 'not-a-date' }, teacherCookie);
    expect(res.status).toBe(400);
});

test('GET /api/lessons returns own lessons sorted by scheduled_at ASC', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-07-01T10:00:00.000Z' }, teacherCookie);
    await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie);

    const res = await req(app, 'GET', '/api/lessons', undefined, teacherCookie);
    const list = await res.json();
    expect(list.length).toBe(2);
    expect(list[0].scheduledAt < list[1].scheduledAt).toBe(true);
});

test('PATCH /api/lessons/:id attaches a Horse and populates horseName', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentCookie = await registerAndLogin(app, 'student@example.com', 'secret123', 'S');
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'student@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);
    const me = await (await req(app, 'GET', '/api/auth/me', undefined, studentCookie)).json();
    const horse = await (await req(app, 'POST', '/api/horses',
        { name: 'Bella' }, studentCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId: me.id, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();

    const res = await req(app, 'PATCH', `/api/lessons/${lesson.id}`,
        { horseId: horse.id }, teacherCookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.horseId).toBe(horse.id);
    expect(body.horseName).toBe('Bella');
});

test('PATCH /api/lessons/:id by non-owner teacher returns 404', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const intruderCookie = await registerAndLogin(app, 'intruder@example.com');
    const res = await req(app, 'PATCH', `/api/lessons/${lesson.id}`,
        { scheduledAt: '2026-06-02T10:00:00.000Z' }, intruderCookie);
    expect(res.status).toBe(404);
});

test('PATCH /api/lessons/:id with foreign Horse returns 500-or-400', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const otherStudentCookie = await registerAndLogin(app, 'other@example.com');
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'other@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, otherStudentCookie);
    const foreignHorse = await (await req(app, 'POST', '/api/horses',
        { name: 'Foreign' }, otherStudentCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();

    const res = await req(app, 'PATCH', `/api/lessons/${lesson.id}`,
        { horseId: foreignHorse.id }, teacherCookie);
    // Plain Error → 500 in the framework. The boundary deliberately doesn't
    // leak the validation reason; the web layer guards via dropdown choices.
    expect(res.status).toBe(500);
});

test('POST /api/lessons/:id/exercises attaches and lists', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const ex = await (await req(app, 'POST', '/api/exercises',
        { name: 'Skritt' }, teacherCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();

    const res = await req(app, 'POST', `/api/lessons/${lesson.id}/exercises`,
        { exerciseId: ex.id }, teacherCookie);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.map((e: { id: string }) => e.id)).toEqual([ex.id]);

    const getRes = await req(app, 'GET', `/api/lessons/${lesson.id}/exercises`,
        undefined, teacherCookie);
    expect(getRes.status).toBe(200);
    expect((await getRes.json()).length).toBe(1);
});

test('DELETE /api/lessons/:id/exercises/:exerciseId detaches', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const ex = await (await req(app, 'POST', '/api/exercises',
        { name: 'Skritt' }, teacherCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    await req(app, 'POST', `/api/lessons/${lesson.id}/exercises`,
        { exerciseId: ex.id }, teacherCookie);

    const res = await req(app, 'DELETE',
        `/api/lessons/${lesson.id}/exercises/${ex.id}`, undefined, teacherCookie);
    expect(res.status).toBe(200);
    expect((await res.json()).length).toBe(0);
});

test('POST /api/lessons/:id/exercises on stranger Lesson returns 404', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const ex = await (await req(app, 'POST', '/api/exercises',
        { name: 'Skritt' }, teacherCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const intruderCookie = await registerAndLogin(app, 'intruder@example.com');
    const res = await req(app, 'POST', `/api/lessons/${lesson.id}/exercises`,
        { exerciseId: ex.id }, intruderCookie);
    expect(res.status).toBe(404);
});

test('POST /api/lessons/:id/transition marks completed', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const res = await req(app, 'POST', `/api/lessons/${lesson.id}/transition`,
        { target: 'completed' }, teacherCookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
});

test('POST /api/lessons/:id/transition terminal→other-terminal returns 409', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    await req(app, 'POST', `/api/lessons/${lesson.id}/transition`,
        { target: 'completed' }, teacherCookie);
    const res = await req(app, 'POST', `/api/lessons/${lesson.id}/transition`,
        { target: 'cancelled' }, teacherCookie);
    expect(res.status).toBe(409);
});

test('POST /api/lessons/:id/transition by non-owner teacher returns 404', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const intruderCookie = await registerAndLogin(app, 'intruder@example.com');
    const res = await req(app, 'POST', `/api/lessons/${lesson.id}/transition`,
        { target: 'completed' }, intruderCookie);
    expect(res.status).toBe(404);
});

test('GET /api/lessons returns student-side lessons with role + counterparty', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentCookie = await registerAndLogin(app, 'student@example.com', 'secret123', 'Stina Studentsson');

    // Teacher invites + student accepts.
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'student@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);

    const me = await (await req(app, 'GET', '/api/auth/me', undefined, studentCookie)).json();
    await req(app, 'POST', '/api/lessons',
        { studentId: me.id, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie);

    const studentList = await (await req(app, 'GET', '/api/lessons', undefined, studentCookie)).json();
    expect(studentList.length).toBe(1);
    expect(studentList[0].role).toBe('student');
    expect(studentList[0].counterpartyDisplayName).toBe('Anna Andersson');

    const teacherList = await (await req(app, 'GET', '/api/lessons', undefined, teacherCookie)).json();
    expect(teacherList[0].role).toBe('teacher');
    expect(teacherList[0].counterpartyDisplayName).toBe('Stina Studentsson');
});

// --- Notes ---

test('POST /api/notes creates a note on own Lesson', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();

    const res = await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'prep', visibility: 'private',
    }, teacherCookie);
    expect(res.status).toBe(200);
    const note = await res.json();
    expect(note.body).toBe('prep');
});

test('GET /api/notes hides private notes from the other side', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentCookie = await registerAndLogin(app, 'student@example.com');
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'student@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);
    const me = await (await req(app, 'GET', '/api/auth/me', undefined, studentCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId: me.id, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'prep', visibility: 'private',
    }, teacherCookie);
    await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'rapport', visibility: 'shared',
    }, teacherCookie);

    const qs = `parentKind=lesson&parentId=${lesson.id}`;
    const teacherList = await (await req(app, 'GET', `/api/notes?${qs}`,
        undefined, teacherCookie)).json();
    expect(teacherList.length).toBe(2);

    const studentList = await (await req(app, 'GET', `/api/notes?${qs}`,
        undefined, studentCookie)).json();
    expect(studentList.length).toBe(1);
    expect(studentList[0].body).toBe('rapport');
});

test('POST /api/notes on a stranger Lesson returns 404', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const intruderCookie = await registerAndLogin(app, 'intruder@example.com');
    const res = await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'nope', visibility: 'shared',
    }, intruderCookie);
    expect(res.status).toBe(404);
});

test('POST /api/notes by a student on own Lesson works and interleaves on teacher view (018)', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentCookie = await registerAndLogin(app, 'student@example.com');
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'student@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);
    const me = await (await req(app, 'GET', '/api/auth/me', undefined, studentCookie)).json();
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId: me.id, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();

    await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'teacher-prep', visibility: 'shared',
    }, teacherCookie);
    const stRes = await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'student-reply', visibility: 'shared',
    }, studentCookie);
    expect(stRes.status).toBe(200);

    const qs = `parentKind=lesson&parentId=${lesson.id}`;
    const teacherView = await (await req(app, 'GET', `/api/notes?${qs}`,
        undefined, teacherCookie)).json();
    expect(teacherView.map((n: { body: string }) => n.body))
        .toEqual(['teacher-prep', 'student-reply']);
});

test('POST /api/notes by an outsider on a Lesson returns 404 (018)', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const outsiderCookie = await registerAndLogin(app, 'outsider@example.com');
    const res = await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'nope', visibility: 'shared',
    }, outsiderCookie);
    expect(res.status).toBe(404);
});

test('DELETE /api/notes/:id removes own note', async () => {
    const { app } = await setup([seedUser]);
    const teacherCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const studentId = await connectStudent(app, teacherCookie, 'student@example.com');
    const lesson = await (await req(app, 'POST', '/api/lessons',
        { studentId, scheduledAt: '2026-06-01T10:00:00.000Z' }, teacherCookie)).json();
    const note = await (await req(app, 'POST', '/api/notes', {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'gone', visibility: 'shared',
    }, teacherCookie)).json();

    const res = await req(app, 'DELETE', `/api/notes/${note.id}`, undefined, teacherCookie);
    expect(res.status).toBe(200);
});

// --- Training Sessions (019) ---

test('GET /api/training-sessions without session returns 401', async () => {
    const { app } = await setup();
    const res = await req(app, 'GET', '/api/training-sessions');
    expect(res.status).toBe(401);
});

test('POST /api/training-sessions happy path returns created session with empty share set', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/training-sessions',
        { performedAt: '2026-06-01T10:00:00.000Z', durationMin: 30, summary: 'Easy hack.' }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.performedAt).toBe('2026-06-01T10:00:00.000Z');
    expect(body.durationMin).toBe(30);
    expect(body.summary).toBe('Easy hack.');
    expect(body.sharedWithTeacherIds).toEqual([]);
});

test('POST /api/training-sessions with non-connected teacher in share set returns 404', async () => {
    const { app } = await setup([seedUser]);
    const studentCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const strangerCookie = await registerAndLogin(app, 'stranger@example.com');
    const stranger = await (await req(app, 'GET', '/api/auth/me', undefined, strangerCookie)).json();
    const res = await req(app, 'POST', '/api/training-sessions',
        { performedAt: '2026-06-01T10:00:00.000Z', shareWithTeacherIds: [stranger.id] }, studentCookie);
    expect(res.status).toBe(404);
});

test('POST /api/training-sessions invalid performedAt returns 400', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const res = await req(app, 'POST', '/api/training-sessions',
        { performedAt: 'not-a-date' }, cookie);
    expect(res.status).toBe(400);
});

test('GET /api/training-sessions returns own sessions newest first', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    await req(app, 'POST', '/api/training-sessions',
        { performedAt: '2026-06-01T10:00:00.000Z' }, cookie);
    await req(app, 'POST', '/api/training-sessions',
        { performedAt: '2026-07-01T10:00:00.000Z' }, cookie);
    const res = await req(app, 'GET', '/api/training-sessions', undefined, cookie);
    const list = await res.json();
    expect(list.length).toBe(2);
    expect(list[0].performedAt > list[1].performedAt).toBe(true);
});

test('PATCH /api/training-sessions/:id updates own session and replaces shares; stranger gets 404', async () => {
    const { app } = await setup([seedUser]);
    // anna is the student; register a teacher and connect them so we have a valid share target.
    const studentCookie = await loginAs(app, 'anna@example.com', 'secret123');
    const teacherCookie = await registerAndLogin(app, 'teacher@example.com');
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'anna@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);
    const teacher = await (await req(app, 'GET', '/api/auth/me', undefined, teacherCookie)).json();

    const ts = await (await req(app, 'POST', '/api/training-sessions',
        { performedAt: '2026-06-01T10:00:00.000Z' }, studentCookie)).json();
    const ok = await req(app, 'PATCH', `/api/training-sessions/${ts.id}`,
        { summary: 'Updated', shareWithTeacherIds: [teacher.id] }, studentCookie);
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.summary).toBe('Updated');
    expect(body.sharedWithTeacherIds).toEqual([teacher.id]);

    const strangerCookie = await registerAndLogin(app, 'stranger@example.com');
    const bad = await req(app, 'PATCH', `/api/training-sessions/${ts.id}`,
        { summary: 'hijack' }, strangerCookie);
    expect(bad.status).toBe(404);
});

test('GET /api/teachers lists the calling student’s connected teachers', async () => {
    const { app } = await setup([seedUser]);
    const studentCookie = await loginAs(app, 'anna@example.com', 'secret123');
    // No teachers yet → empty.
    const empty = await (await req(app, 'GET', '/api/teachers', undefined, studentCookie)).json();
    expect(empty).toEqual([]);

    const teacherCookie = await registerAndLogin(app, 'teacher@example.com', 'secret123', 'T');
    const inv = await (await req(app, 'POST', '/api/invitations',
        { inviteeEmail: 'anna@example.com' }, teacherCookie)).json();
    await req(app, 'POST', '/api/invitations/accept', { invitationId: inv.id }, studentCookie);

    const list = await (await req(app, 'GET', '/api/teachers', undefined, studentCookie)).json();
    expect(list.length).toBe(1);
    expect(list[0].displayName).toBe('T');
});

test('DELETE /api/training-sessions/:id removes own session', async () => {
    const { app } = await setup([seedUser]);
    const cookie = await loginAs(app, 'anna@example.com', 'secret123');
    const ts = await (await req(app, 'POST', '/api/training-sessions',
        { performedAt: '2026-06-01T10:00:00.000Z' }, cookie)).json();
    const res = await req(app, 'DELETE', `/api/training-sessions/${ts.id}`, undefined, cookie);
    expect(res.status).toBe(200);
    const list = await (await req(app, 'GET', '/api/training-sessions', undefined, cookie)).json();
    expect(list).toEqual([]);
});
