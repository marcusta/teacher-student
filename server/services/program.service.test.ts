import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedTeacher(email = 'teacher@example.com') {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email, password: 'secret123', displayName: 'T',
    });
    return { ...ctx, teacher };
}

test('create persists Program owned by teacher with trimmed title', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, {
        title: '  Uppvärmning   ',
        description: 'Standardprogram för uppvärmning.',
    });

    expect(p.id).toBeString();
    expect(p.teacherId).toBe(teacher.id);
    expect(p.title).toBe('Uppvärmning');
    expect(p.description).toBe('Standardprogram för uppvärmning.');
    expect(p.createdAt).toBeString();
});

test('create rejects empty title', async () => {
    const { programService, teacher } = await seedTeacher();
    await expect(programService.create(teacher.id, { title: '   ', description: '' }))
        .rejects.toThrow();
});

test('create stores empty description when omitted', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'X' });
    expect(p.description).toBe('');
});

test('listForTeacher returns empty when none', async () => {
    const { programService, teacher } = await seedTeacher();
    expect(await programService.listForTeacher(teacher.id)).toEqual([]);
});

test('listForTeacher returns only own programs, sorted by created_at DESC', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });

    const p1 = await ctx.programService.create(ctx.teacher.id, { title: 'First' });
    await new Promise((r) => setTimeout(r, 5));
    const p2 = await ctx.programService.create(ctx.teacher.id, { title: 'Second' });
    await ctx.programService.create(t2.id, { title: 'Other-teacher program' });

    const list = await ctx.programService.listForTeacher(ctx.teacher.id);
    expect(list.map((p) => p.id)).toEqual([p2.id, p1.id]);
});
