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

test('getForTeacher returns own Program', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'X' });
    expect(await programService.getForTeacher(teacher.id, p.id)).toMatchObject({ id: p.id });
});

test('getForTeacher returns null for other teacher or missing', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'X' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    expect(await ctx.programService.getForTeacher(t2.id, p.id)).toBeNull();
    expect(await ctx.programService.getForTeacher(ctx.teacher.id, 'missing')).toBeNull();
});

test('update returns updated Program with new title', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'Old', description: 'd' });
    const updated = await programService.update(teacher.id, p.id, { title: 'New' });
    expect(updated.title).toBe('New');
    expect(updated.description).toBe('d');
});

test('update preserves untouched fields when only description supplied', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'T', description: 'old' });
    const updated = await programService.update(teacher.id, p.id, { description: 'new' });
    expect(updated.title).toBe('T');
    expect(updated.description).toBe('new');
});

test('update on other teacher\'s program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'X' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.programService.update(t2.id, p.id, { title: 'Hack' }))
        .rejects.toThrow();
});

test('update on missing program throws NotFoundError', async () => {
    const { programService, teacher } = await seedTeacher();
    await expect(programService.update(teacher.id, 'missing', { title: 'X' }))
        .rejects.toThrow();
});

test('update rejects empty title when provided', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'X' });
    await expect(programService.update(teacher.id, p.id, { title: '   ' }))
        .rejects.toThrow();
});

test('delete removes own program', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'X' });
    await programService.delete(teacher.id, p.id);
    expect(await programService.getForTeacher(teacher.id, p.id)).toBeNull();
});

test('delete on other teacher\'s program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'X' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.programService.delete(t2.id, p.id)).rejects.toThrow();
    // Still exists for original owner.
    expect(await ctx.programService.getForTeacher(ctx.teacher.id, p.id)).not.toBeNull();
});

test('delete on missing program throws NotFoundError', async () => {
    const { programService, teacher } = await seedTeacher();
    await expect(programService.delete(teacher.id, 'missing')).rejects.toThrow();
});

test('addExercise on empty Program inserts row with sort_order = 0', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });

    await programService.addExercise(teacher.id, p.id, e.id);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list).toEqual([{
        id: e.id, name: 'E', description: '', sortOrder: 0, notes: null,
    }]);
});

test('addExercise on non-empty Program appends with sort_order = max + 1', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    const e3 = await exerciseService.create(teacher.id, { name: 'E3' });

    await programService.addExercise(teacher.id, p.id, e1.id);
    await programService.addExercise(teacher.id, p.id, e2.id);
    await programService.addExercise(teacher.id, p.id, e3.id);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((r) => [r.id, r.sortOrder])).toEqual([
        [e1.id, 0], [e2.id, 1], [e3.id, 2],
    ]);
});

test('addExercise stores trimmed notes when provided', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id, { notes: '  3 varv  ' });
    const list = await programService.listExercises(teacher.id, p.id);
    expect(list[0].notes).toBe('3 varv');
});

test('addExercise on cross-teacher Program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'P' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const e2 = await ctx.exerciseService.create(t2.id, { name: 'E' });
    await expect(ctx.programService.addExercise(t2.id, p.id, e2.id))
        .rejects.toThrow();
});

test('addExercise on cross-teacher Exercise throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'P' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const otherExercise = await ctx.exerciseService.create(t2.id, { name: 'E' });
    await expect(ctx.programService.addExercise(ctx.teacher.id, p.id, otherExercise.id))
        .rejects.toThrow();
});

test('addExercise duplicate is rejected', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id);
    await expect(programService.addExercise(teacher.id, p.id, e.id))
        .rejects.toThrow();
});

test('listExercises on empty Program returns []', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    expect(await programService.listExercises(teacher.id, p.id)).toEqual([]);
});

test('listExercises on cross-teacher Program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'P' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.programService.listExercises(t2.id, p.id)).rejects.toThrow();
});

test('deleting a Program cascades to program_exercise rows', async () => {
    const { programService, exerciseService, teacher, db } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id);
    await programService.delete(teacher.id, p.id);
    const rows = await db.selectFrom('program_exercise').selectAll().execute();
    expect(rows).toEqual([]);
});
