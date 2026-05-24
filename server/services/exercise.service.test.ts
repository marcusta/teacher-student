import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedTeacher(email = 'teacher@example.com') {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email, password: 'secret123', displayName: 'T',
    });
    return { ...ctx, teacher };
}

test('create persists Exercise owned by teacher with trimmed name', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    const ex = await exerciseService.create(teacher.id, {
        name: '  Skritt   ',
        description: 'Långa skritttag på lös tygel.',
    });

    expect(ex.id).toBeString();
    expect(ex.teacherId).toBe(teacher.id);
    expect(ex.name).toBe('Skritt');
    expect(ex.description).toBe('Långa skritttag på lös tygel.');
    expect(ex.createdAt).toBeString();
    expect(ex.updatedAt).toBeString();
});

test('create rejects empty name', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    await expect(exerciseService.create(teacher.id, { name: '   ', description: '' }))
        .rejects.toThrow();
});

test('listForTeacher returns empty when none', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    expect(await exerciseService.listForTeacher(teacher.id)).toEqual([]);
});

test('listForTeacher returns only own exercises, sorted by created_at DESC', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });

    const ex1 = await ctx.exerciseService.create(ctx.teacher.id, { name: 'First' });
    // Ensure ordering even if timestamps collide at ms granularity.
    await new Promise((r) => setTimeout(r, 5));
    const ex2 = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Second' });
    await ctx.exerciseService.create(t2.id, { name: 'Other-teacher exercise' });

    const list = await ctx.exerciseService.listForTeacher(ctx.teacher.id);
    expect(list.map((e) => e.id)).toEqual([ex2.id, ex1.id]);
});

test('getForTeacher returns own Exercise', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    const ex = await exerciseService.create(teacher.id, { name: 'X' });
    expect(await exerciseService.getForTeacher(teacher.id, ex.id)).toMatchObject({ id: ex.id });
});

test('getForTeacher returns null for other teacher or missing', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'X' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    expect(await ctx.exerciseService.getForTeacher(t2.id, ex.id)).toBeNull();
    expect(await ctx.exerciseService.getForTeacher(ctx.teacher.id, 'missing')).toBeNull();
});

test('update refreshes updated_at and returns updated Exercise', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    const ex = await exerciseService.create(teacher.id, { name: 'Old', description: 'd' });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await exerciseService.update(teacher.id, ex.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.description).toBe('d');
    expect(updated.updatedAt > ex.updatedAt).toBe(true);
});

test('update on other teacher\'s exercise throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'X' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.exerciseService.update(t2.id, ex.id, { name: 'Hack' }))
        .rejects.toThrow();
});

test('update on missing exercise throws NotFoundError', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    await expect(exerciseService.update(teacher.id, 'missing', { name: 'X' }))
        .rejects.toThrow();
});

test('update rejects empty name when provided', async () => {
    const { exerciseService, teacher } = await seedTeacher();
    const ex = await exerciseService.create(teacher.id, { name: 'X' });
    await expect(exerciseService.update(teacher.id, ex.id, { name: '   ' }))
        .rejects.toThrow();
});
