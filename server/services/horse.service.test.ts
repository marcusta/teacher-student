import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedStudent(email = 'student@example.com') {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email, password: 'secret123', displayName: 'S',
    });
    return { ...ctx, student };
}

test('create persists Horse owned by student with trimmed name', async () => {
    const { horseService, student } = await seedStudent();
    const horse = await horseService.create(student.id, { name: '  Pegasus   ' });

    expect(horse.id).toBeString();
    expect(horse.studentId).toBe(student.id);
    expect(horse.name).toBe('Pegasus');
    expect(horse.archivedAt).toBeNull();
    expect(horse.createdAt).toBeString();
    expect(horse.updatedAt).toBeString();
});

test('create rejects empty name', async () => {
    const { horseService, student } = await seedStudent();
    await expect(horseService.create(student.id, { name: '   ' })).rejects.toThrow();
});

test('listForStudent returns empty when none', async () => {
    const { horseService, student } = await seedStudent();
    expect(await horseService.listForStudent(student.id)).toEqual([]);
});

test('getForStudent returns own Horse', async () => {
    const { horseService, student } = await seedStudent();
    const h = await horseService.create(student.id, { name: 'X' });
    expect(await horseService.getForStudent(student.id, h.id)).toMatchObject({ id: h.id });
});

test('getForStudent returns null for other student or missing', async () => {
    const ctx = await seedStudent('s1@example.com');
    const h = await ctx.horseService.create(ctx.student.id, { name: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    expect(await ctx.horseService.getForStudent(s2.id, h.id)).toBeNull();
    expect(await ctx.horseService.getForStudent(ctx.student.id, 'missing')).toBeNull();
});

test('update refreshes updated_at and returns updated Horse', async () => {
    const { horseService, student } = await seedStudent();
    const h = await horseService.create(student.id, { name: 'Old' });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await horseService.update(student.id, h.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.updatedAt > h.updatedAt).toBe(true);
});

test('update on other student\'s horse throws NotFoundError', async () => {
    const ctx = await seedStudent('s1@example.com');
    const h = await ctx.horseService.create(ctx.student.id, { name: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.horseService.update(s2.id, h.id, { name: 'Hack' })).rejects.toThrow();
});

test('update on missing horse throws NotFoundError', async () => {
    const { horseService, student } = await seedStudent();
    await expect(horseService.update(student.id, 'missing', { name: 'X' })).rejects.toThrow();
});

test('update rejects empty name when provided', async () => {
    const { horseService, student } = await seedStudent();
    const h = await horseService.create(student.id, { name: 'X' });
    await expect(horseService.update(student.id, h.id, { name: '   ' })).rejects.toThrow();
});

test('listForStudent returns only own horses sorted by created_at DESC', async () => {
    const ctx = await seedStudent('s1@example.com');
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });

    const h1 = await ctx.horseService.create(ctx.student.id, { name: 'First' });
    await new Promise((r) => setTimeout(r, 5));
    const h2 = await ctx.horseService.create(ctx.student.id, { name: 'Second' });
    await ctx.horseService.create(s2.id, { name: 'Other-student horse' });

    const list = await ctx.horseService.listForStudent(ctx.student.id);
    expect(list.map((h) => h.id)).toEqual([h2.id, h1.id]);
});
