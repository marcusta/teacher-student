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

test('create accepts an own non-archived horse and resolves horseName', async () => {
    const { trainingSessionService, horseService, student } = await seedStudent();
    const horse = await horseService.create(student.id, { name: 'Brunte' });
    const ts = await trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        horseId: horse.id,
    });
    expect(ts.horseId).toBe(horse.id);
    expect(ts.horseName).toBe('Brunte');
});

test('create rejects a horse owned by another student', async () => {
    const ctx = await seedStudent();
    const other = await ctx.userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const otherHorse = await ctx.horseService.create(other.id, { name: 'NotYours' });
    await expect(ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        horseId: otherHorse.id,
    })).rejects.toThrow();
});

test('create rejects an archived horse', async () => {
    const { trainingSessionService, horseService, student } = await seedStudent();
    const horse = await horseService.create(student.id, { name: 'Old' });
    await horseService.archive(student.id, horse.id);
    await expect(trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        horseId: horse.id,
    })).rejects.toThrow();
});

test('update clears horse via null and replaces with another own horse', async () => {
    const { trainingSessionService, horseService, student } = await seedStudent();
    const h1 = await horseService.create(student.id, { name: 'A' });
    const h2 = await horseService.create(student.id, { name: 'B' });
    const ts = await trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        horseId: h1.id,
    });
    const cleared = await trainingSessionService.update(student.id, ts.id, { horseId: null });
    expect(cleared.horseId).toBeNull();
    expect(cleared.horseName).toBeNull();
    const swapped = await trainingSessionService.update(student.id, ts.id, { horseId: h2.id });
    expect(swapped.horseId).toBe(h2.id);
    expect(swapped.horseName).toBe('B');
});

test('listForStudent includes resolved horseName', async () => {
    const { trainingSessionService, horseService, student } = await seedStudent();
    const horse = await horseService.create(student.id, { name: 'Brunte' });
    await trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        horseId: horse.id,
    });
    await trainingSessionService.create(student.id, {
        performedAt: '2026-07-01T10:00:00.000Z',
    });
    const list = await trainingSessionService.listForStudent(student.id);
    expect(list[0].horseId).toBeNull();
    expect(list[0].horseName).toBeNull();
    expect(list[1].horseId).toBe(horse.id);
    expect(list[1].horseName).toBe('Brunte');
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
