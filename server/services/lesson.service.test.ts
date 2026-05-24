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
