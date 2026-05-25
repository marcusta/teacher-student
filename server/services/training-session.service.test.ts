import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedStudent() {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    return { ...ctx, student };
}

async function connect(ctx: Awaited<ReturnType<typeof seedStudent>>, teacherEmail: string) {
    const teacher = await ctx.userService.register({
        email: teacherEmail, password: 'secret123', displayName: teacherEmail,
    });
    const inv = await ctx.invitationService.createInvitation(teacher.id, ctx.student.email);
    await ctx.invitationService.acceptInvitation(inv.id, ctx.student.id, ctx.student.email);
    return teacher;
}

test('create persists Training Session owned by student with empty share set by default', async () => {
    const { trainingSessionService, student } = await seedStudent();
    const when = '2026-06-01T10:00:00.000Z';
    const ts = await trainingSessionService.create(student.id, { performedAt: when });

    expect(ts.id).toBeString();
    expect(ts.studentId).toBe(student.id);
    expect(ts.performedAt).toBe(when);
    expect(ts.durationMin).toBeNull();
    expect(ts.summary).toBeNull();
    expect(ts.sharedWithTeacherIds).toEqual([]);
    expect(ts.createdAt).toBeString();
    expect(ts.updatedAt).toBeString();
});

test('create accepts share targets that are connected teachers', async () => {
    const ctx = await seedStudent();
    const t1 = await connect(ctx, 't1@example.com');
    const t2 = await connect(ctx, 't2@example.com');
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        durationMin: 45,
        summary: 'Worked on shoulder-in.',
        shareWithTeacherIds: [t1.id, t2.id],
    });
    expect(ts.durationMin).toBe(45);
    expect(ts.summary).toBe('Worked on shoulder-in.');
    expect(ts.sharedWithTeacherIds.sort()).toEqual([t1.id, t2.id].sort());
});

test('create rejects share targets that are not connected teachers', async () => {
    const ctx = await seedStudent();
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [stranger.id],
    })).rejects.toThrow();
});

test('create rejects invalid performedAt', async () => {
    const { trainingSessionService, student } = await seedStudent();
    await expect(trainingSessionService.create(student.id, {
        performedAt: 'not-a-date',
    })).rejects.toThrow();
});

test('create rejects negative durationMin', async () => {
    const { trainingSessionService, student } = await seedStudent();
    await expect(trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        durationMin: -5,
    })).rejects.toThrow();
});

test('listForStudent returns empty when none', async () => {
    const { trainingSessionService, student } = await seedStudent();
    expect(await trainingSessionService.listForStudent(student.id)).toEqual([]);
});

test('listForStudent returns own sessions sorted DESC with their share targets, isolated between students', async () => {
    const ctx = await seedStudent();
    const t1 = await connect(ctx, 't1@example.com');
    const other = await ctx.userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const earlier = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [t1.id],
    });
    const later = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-07-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.create(other.id, {
        performedAt: '2026-06-15T10:00:00.000Z',
    });

    const list = await ctx.trainingSessionService.listForStudent(ctx.student.id);
    expect(list.map((s) => s.id)).toEqual([later.id, earlier.id]);
    expect(list[0].sharedWithTeacherIds).toEqual([]);
    expect(list[1].sharedWithTeacherIds).toEqual([t1.id]);
});

test('update replaces share set when supplied; leaves it untouched when omitted', async () => {
    const ctx = await seedStudent();
    const t1 = await connect(ctx, 't1@example.com');
    const t2 = await connect(ctx, 't2@example.com');
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [t1.id],
    });

    // Patch summary only — share set should remain [t1].
    const patched = await ctx.trainingSessionService.update(ctx.student.id, ts.id, {
        summary: 'Reflection added',
    });
    expect(patched.summary).toBe('Reflection added');
    expect(patched.sharedWithTeacherIds).toEqual([t1.id]);

    // Replace share set.
    const reshared = await ctx.trainingSessionService.update(ctx.student.id, ts.id, {
        shareWithTeacherIds: [t2.id],
    });
    expect(reshared.sharedWithTeacherIds).toEqual([t2.id]);

    // Empty array unshares entirely.
    const unshared = await ctx.trainingSessionService.update(ctx.student.id, ts.id, {
        shareWithTeacherIds: [],
    });
    expect(unshared.sharedWithTeacherIds).toEqual([]);
});

test('update rejects non-connected teacher in share set', async () => {
    const ctx = await seedStudent();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.trainingSessionService.update(ctx.student.id, ts.id, {
        shareWithTeacherIds: [stranger.id],
    })).rejects.toThrow();
});

test('update by stranger throws NotFoundError', async () => {
    const ctx = await seedStudent();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.trainingSessionService.update(stranger.id, ts.id, {
        summary: 'hijack',
    })).rejects.toThrow();
});

test('delete removes own session and its shares; stranger throws; missing is idempotent', async () => {
    const ctx = await seedStudent();
    const t1 = await connect(ctx, 't1@example.com');
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [t1.id],
    });
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.trainingSessionService.delete(stranger.id, ts.id)).rejects.toThrow();

    await ctx.trainingSessionService.delete(ctx.student.id, ts.id);
    expect(await ctx.trainingSessionService.listForStudent(ctx.student.id)).toEqual([]);

    // Idempotent on missing.
    await ctx.trainingSessionService.delete(ctx.student.id, ts.id);
});
