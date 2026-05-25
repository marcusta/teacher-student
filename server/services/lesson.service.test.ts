import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedConnected() {
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

test('create persists Lesson owned by teacher with status=planned', async () => {
    const { lessonService, teacher, student } = await seedConnected();
    const when = '2026-06-01T10:00:00.000Z';
    const lesson = await lessonService.create(teacher.id, {
        studentId: student.id,
        scheduledAt: when,
    });

    expect(lesson.id).toBeString();
    expect(lesson.teacherId).toBe(teacher.id);
    expect(lesson.studentId).toBe(student.id);
    expect(lesson.scheduledAt).toBe(when);
    expect(lesson.status).toBe('planned');
    expect(lesson.createdAt).toBeString();
    expect(lesson.updatedAt).toBeString();
});

test('create throws NotFoundError when no Relation exists', async () => {
    const { lessonService, userService, teacher } = await seedConnected();
    const stranger = await userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(lessonService.create(teacher.id, {
        studentId: stranger.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
    })).rejects.toThrow();
});

test('create rejects invalid scheduledAt', async () => {
    const { lessonService, teacher, student } = await seedConnected();
    await expect(lessonService.create(teacher.id, {
        studentId: student.id,
        scheduledAt: 'not-a-date',
    })).rejects.toThrow();
});

test('listForTeacher returns empty when none', async () => {
    const { lessonService, teacher } = await seedConnected();
    expect(await lessonService.listForTeacher(teacher.id)).toEqual([]);
});

test('listForTeacher returns only own lessons sorted by scheduled_at ASC', async () => {
    const ctx = await seedConnected();
    // Second teacher connected to a different student.
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const inv2 = await ctx.invitationService.createInvitation(t2.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv2.id, ctx.student.id, 'student@example.com');

    const later = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-07-01T10:00:00.000Z',
    });
    const earlier = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    // Different teacher's lesson — must not appear.
    await ctx.lessonService.create(t2.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-15T10:00:00.000Z',
    });

    const list = await ctx.lessonService.listForTeacher(ctx.teacher.id);
    expect(list.map((l) => l.id)).toEqual([earlier.id, later.id]);
});

// --- listForUser (013: same endpoint serves teacher + student sides) ---

test('listForUser returns lessons from teacher side with role + counterparty', async () => {
    const { lessonService, teacher, student } = await seedConnected();
    await lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const list = await lessonService.listForUser(teacher.id);
    expect(list.length).toBe(1);
    expect(list[0].role).toBe('teacher');
    expect(list[0].counterpartyDisplayName).toBe('S');
});

test('listForUser returns lessons from student side with role + counterparty', async () => {
    const { lessonService, teacher, student } = await seedConnected();
    await lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const list = await lessonService.listForUser(student.id);
    expect(list.length).toBe(1);
    expect(list[0].role).toBe('student');
    expect(list[0].counterpartyDisplayName).toBe('T');
});

test('listForUser merges both sides sorted by scheduled_at ASC', async () => {
    const ctx = await seedConnected();
    // ctx.teacher schedules a lesson with ctx.student.
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-07-01T10:00:00.000Z',
    });
    // ctx.teacher is also a student of another teacher.
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const inv = await ctx.invitationService.createInvitation(t2.id, 'teacher@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, ctx.teacher.id, 'teacher@example.com');
    await ctx.lessonService.create(t2.id, {
        studentId: ctx.teacher.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const list = await ctx.lessonService.listForUser(ctx.teacher.id);
    expect(list.length).toBe(2);
    expect(list[0].scheduledAt).toBe('2026-06-01T10:00:00.000Z');
    expect(list[0].role).toBe('student');
    expect(list[0].counterpartyDisplayName).toBe('T2');
    expect(list[1].role).toBe('teacher');
    expect(list[1].counterpartyDisplayName).toBe('S');
});

test('listForUser returns [] for user with no lessons', async () => {
    const ctx = await seedConnected();
    const lonely = await ctx.userService.register({
        email: 'lonely@example.com', password: 'secret123', displayName: 'L',
    });
    expect(await ctx.lessonService.listForUser(lonely.id)).toEqual([]);
});
