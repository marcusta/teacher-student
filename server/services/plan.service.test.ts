import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedStudent(email = 'student@example.com') {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email, password: 'secret123', displayName: 'S',
    });
    return { ...ctx, student };
}

async function seedTeacherWithStudent() {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: 'teacher@example.com', password: 'secret123', displayName: 'T',
    });
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    const inv = await ctx.invitationService.createInvitation(teacher.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    return { ...ctx, teacher, student };
}

test('create persists Plan owned by student with trimmed title', async () => {
    const { planService, student } = await seedStudent();
    const plan = await planService.create(student.id, { title: '  Sommar 2026   ' });

    expect(plan.id).toBeString();
    expect(plan.studentId).toBe(student.id);
    expect(plan.title).toBe('Sommar 2026');
    expect(plan.status).toBe('active');
    expect(plan.primaryTeacherId).toBeNull();
    expect(plan.createdAt).toBeString();
    expect(plan.updatedAt).toBeString();
});

test('create rejects empty title', async () => {
    const { planService, student } = await seedStudent();
    await expect(planService.create(student.id, { title: '   ' })).rejects.toThrow();
});

test('create with connected primaryTeacherId stores teacher', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    const plan = await planService.create(student.id, {
        title: 'Plan A',
        primaryTeacherId: teacher.id,
    });
    expect(plan.primaryTeacherId).toBe(teacher.id);
});

test('create with unconnected primaryTeacherId throws NotFoundError', async () => {
    const ctx = await seedStudent();
    const stranger = await ctx.userService.register({
        email: 't@example.com', password: 'secret123', displayName: 'T',
    });
    await expect(ctx.planService.create(ctx.student.id, {
        title: 'Plan A',
        primaryTeacherId: stranger.id,
    })).rejects.toThrow();
});

test('listForStudent returns empty when none', async () => {
    const { planService, student } = await seedStudent();
    expect(await planService.listForStudent(student.id)).toEqual([]);
});

test('listForStudent returns only own plans sorted active before archived then created_at DESC', async () => {
    const ctx = await seedStudent('s1@example.com');
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });

    const active1 = await ctx.planService.create(ctx.student.id, { title: 'Active 1' });
    await new Promise((r) => setTimeout(r, 5));
    const active2 = await ctx.planService.create(ctx.student.id, { title: 'Active 2' });
    const archived = await ctx.planService.create(ctx.student.id, { title: 'Old' });
    await ctx.planService.archive(ctx.student.id, archived.id);
    await ctx.planService.create(s2.id, { title: 'Other student' });

    const list = await ctx.planService.listForStudent(ctx.student.id);
    expect(list.map((p) => p.id)).toEqual([active2.id, active1.id, archived.id]);
    expect(list[0].status).toBe('active');
    expect(list[2].status).toBe('archived');
});

test('getForStudent returns own Plan', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'X' });
    expect(await planService.getForStudent(student.id, p.id)).toMatchObject({ id: p.id });
});

test('getForStudent throws NotFoundError for other student or missing', async () => {
    const ctx = await seedStudent('s1@example.com');
    const p = await ctx.planService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.planService.getForStudent(s2.id, p.id)).rejects.toThrow();
    await expect(ctx.planService.getForStudent(ctx.student.id, 'missing')).rejects.toThrow();
});

test('update refreshes updated_at and returns updated Plan', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'Old' });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await planService.update(student.id, p.id, { title: 'New' });
    expect(updated.title).toBe('New');
    expect(updated.updatedAt > p.updatedAt).toBe(true);
});

test('update primaryTeacherId validates connected teacher', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    const p = await planService.create(student.id, { title: 'X' });
    const updated = await planService.update(student.id, p.id, { primaryTeacherId: teacher.id });
    expect(updated.primaryTeacherId).toBe(teacher.id);
});

test('update with unconnected primaryTeacherId throws NotFoundError', async () => {
    const ctx = await seedStudent();
    const p = await ctx.planService.create(ctx.student.id, { title: 'X' });
    const stranger = await ctx.userService.register({
        email: 't@example.com', password: 'secret123', displayName: 'T',
    });
    await expect(ctx.planService.update(ctx.student.id, p.id, {
        primaryTeacherId: stranger.id,
    })).rejects.toThrow();
});

test('update on other student\'s plan throws NotFoundError', async () => {
    const ctx = await seedStudent('s1@example.com');
    const p = await ctx.planService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.planService.update(s2.id, p.id, { title: 'Hack' })).rejects.toThrow();
});

test('update rejects empty title when provided', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'X' });
    await expect(planService.update(student.id, p.id, { title: '   ' })).rejects.toThrow();
});

test('archive sets status archived on own plan', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'X' });
    await planService.archive(student.id, p.id);
    const got = await planService.getForStudent(student.id, p.id);
    expect(got.status).toBe('archived');
});

test('archive on already-archived plan is idempotent', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'X' });
    await planService.archive(student.id, p.id);
    await planService.archive(student.id, p.id);
    expect((await planService.getForStudent(student.id, p.id)).status).toBe('archived');
});

test('archive on other student\'s plan throws NotFoundError', async () => {
    const ctx = await seedStudent('s1@example.com');
    const p = await ctx.planService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.planService.archive(s2.id, p.id)).rejects.toThrow();
    expect((await ctx.planService.getForStudent(ctx.student.id, p.id)).status).toBe('active');
});

test('listForStudentAsTeacher returns connected student\'s active plans only', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    await planService.create(student.id, { title: 'Visible' });
    const archived = await planService.create(student.id, { title: 'Archived' });
    await planService.archive(student.id, archived.id);

    const list = await planService.listForStudentAsTeacher(teacher.id, student.id);
    expect(list.map((p) => p.title)).toEqual(['Visible']);
});

test('listForStudent hydrates primaryTeacherDisplayName', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    await planService.create(student.id, { title: 'With teacher', primaryTeacherId: teacher.id });
    await planService.create(student.id, { title: 'Without teacher' });

    const list = await planService.listForStudent(student.id);
    const byTitle = Object.fromEntries(list.map((p) => [p.title, p]));
    expect(byTitle['With teacher'].primaryTeacherDisplayName).toBe('T');
    expect(byTitle['Without teacher'].primaryTeacherDisplayName).toBeNull();
});

test('getDetail hydrates primaryTeacherDisplayName', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    const p = await planService.create(student.id, { title: 'X', primaryTeacherId: teacher.id });
    const detail = await planService.getDetail(student.id, p.id);
    expect(detail.primaryTeacherDisplayName).toBe('T');
});

test('listForStudentAsTeacher hydrates primaryTeacherDisplayName', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    await planService.create(student.id, { title: 'With teacher', primaryTeacherId: teacher.id });
    await planService.create(student.id, { title: 'Without teacher' });

    const list = await planService.listForStudentAsTeacher(teacher.id, student.id);
    const byTitle = Object.fromEntries(list.map((p) => [p.title, p]));
    expect(byTitle['With teacher'].primaryTeacherDisplayName).toBe('T');
    expect(byTitle['Without teacher'].primaryTeacherDisplayName).toBeNull();
});

test('listForStudentAsTeacher throws NotFoundError when no Relation exists', async () => {
    const { planService, userService, teacher } = await seedTeacherWithStudent();
    const stranger = await userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(planService.listForStudentAsTeacher(teacher.id, stranger.id)).rejects.toThrow();
});

test('assertActivePlanForStudent succeeds for active owned plan', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'X' });
    await planService.assertActivePlanForStudent(p.id, student.id);
});

test('assertActivePlanForStudent throws for archived plan', async () => {
    const { planService, student } = await seedStudent();
    const p = await planService.create(student.id, { title: 'X' });
    await planService.archive(student.id, p.id);
    await expect(planService.assertActivePlanForStudent(p.id, student.id)).rejects.toThrow();
});

test('assertActivePlanForStudent throws for wrong student', async () => {
    const ctx = await seedStudent('s1@example.com');
    const p = await ctx.planService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.planService.assertActivePlanForStudent(p.id, s2.id)).rejects.toThrow();
});

// --- getDetail (038) ---

test('getDetail returns linked lessons and training sessions for student owner', async () => {
    const ctx = await seedTeacherWithStudent();
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Plan' });
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: plan.id,
    });
    await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-07-01T10:00:00.000Z',
        planId: plan.id,
    });

    const detail = await ctx.planService.getDetail(ctx.student.id, plan.id);
    expect(detail.lessons.length).toBe(1);
    expect(detail.lessons[0].teacherDisplayName).toBe('T');
    expect(detail.trainingSessions.length).toBe(1);
});

test('getDetail allows connected teacher read-only access', async () => {
    const { planService, teacher, student } = await seedTeacherWithStudent();
    const plan = await planService.create(student.id, { title: 'Plan' });
    const detail = await planService.getDetail(teacher.id, plan.id);
    expect(detail.title).toBe('Plan');
    expect(detail.lessons).toEqual([]);
});

test('getDetail throws NotFoundError for teacher without relation', async () => {
    const ctx = await seedTeacherWithStudent();
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Plan' });
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.planService.getDetail(stranger.id, plan.id)).rejects.toThrow();
});

test('getDetail still readable when plan is archived', async () => {
    const { planService, student } = await seedStudent();
    const plan = await planService.create(student.id, { title: 'Old' });
    await planService.archive(student.id, plan.id);
    const detail = await planService.getDetail(student.id, plan.id);
    expect(detail.status).toBe('archived');
});

test('getDetail lists only items with matching plan_id', async () => {
    const ctx = await seedTeacherWithStudent();
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Plan' });
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: plan.id,
    });
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-07-01T10:00:00.000Z',
    });
    const detail = await ctx.planService.getDetail(ctx.student.id, plan.id);
    expect(detail.lessons.length).toBe(1);
});
