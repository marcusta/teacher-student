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

test('archive sets archived_at on own horse', async () => {
    const { horseService, student } = await seedStudent();
    const h = await horseService.create(student.id, { name: 'X' });
    await horseService.archive(student.id, h.id);
    const got = await horseService.getForStudent(student.id, h.id);
    expect(got?.archivedAt).toBeString();
});

test('listForStudent excludes archived horses', async () => {
    const { horseService, student } = await seedStudent();
    const keep = await horseService.create(student.id, { name: 'Keep' });
    const drop = await horseService.create(student.id, { name: 'Drop' });
    await horseService.archive(student.id, drop.id);
    const list = await horseService.listForStudent(student.id);
    expect(list.map((h) => h.id)).toEqual([keep.id]);
});

test('archive on other student\'s horse throws NotFoundError', async () => {
    const ctx = await seedStudent('s1@example.com');
    const h = await ctx.horseService.create(ctx.student.id, { name: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.horseService.archive(s2.id, h.id)).rejects.toThrow();
    // Still active for original owner.
    expect((await ctx.horseService.getForStudent(ctx.student.id, h.id))?.archivedAt).toBeNull();
});

test('archive on missing horse throws NotFoundError', async () => {
    const { horseService, student } = await seedStudent();
    await expect(horseService.archive(student.id, 'missing')).rejects.toThrow();
});

test('archive on already-archived horse is idempotent', async () => {
    const { horseService, student } = await seedStudent();
    const h = await horseService.create(student.id, { name: 'X' });
    await horseService.archive(student.id, h.id);
    const first = (await horseService.getForStudent(student.id, h.id))?.archivedAt;
    await horseService.archive(student.id, h.id);
    const second = (await horseService.getForStudent(student.id, h.id))?.archivedAt;
    expect(first).toBe(second!);
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

// --- listForStudentAsTeacher (teacher views student's stable) ---

async function seedTeacherWithStudent() {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: 'teacher@example.com', password: 'secret123', displayName: 'T',
    });
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    // Use invitation flow to create the relation.
    const inv = await ctx.invitationService.createInvitation(teacher.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    return { ...ctx, teacher, student };
}

test('listForStudentAsTeacher returns the connected Student\'s non-archived horses', async () => {
    const { horseService, teacher, student } = await seedTeacherWithStudent();
    await horseService.create(student.id, { name: 'Visible' });
    const archived = await horseService.create(student.id, { name: 'Archived' });
    await horseService.archive(student.id, archived.id);

    const list = await horseService.listForStudentAsTeacher(teacher.id, student.id);
    expect(list.map((h) => h.name)).toEqual(['Visible']);
});

test('listForStudentAsTeacher throws NotFoundError when no Relation exists', async () => {
    const { horseService, userService, teacher } = await seedTeacherWithStudent();
    const stranger = await userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(horseService.listForStudentAsTeacher(teacher.id, stranger.id)).rejects.toThrow();
});

test('listForStudentAsTeacher throws NotFoundError when Student does not exist', async () => {
    const { horseService, teacher } = await seedTeacherWithStudent();
    await expect(horseService.listForStudentAsTeacher(teacher.id, 'missing')).rejects.toThrow();
});
