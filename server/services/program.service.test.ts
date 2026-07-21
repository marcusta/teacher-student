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

test('archive stamps archived_at and hides the program from listForTeacher', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'X' });
    expect(p.archivedAt).toBeNull();

    await programService.archive(teacher.id, p.id);

    expect(await programService.listForTeacher(teacher.id)).toEqual([]);
    // Still resolvable by id — past Lessons render their provenance label from it.
    const after = await programService.getForTeacher(teacher.id, p.id);
    expect(after).not.toBeNull();
    expect(after!.archivedAt).toBeString();
});

test('archive is idempotent and keeps the first timestamp', async () => {
    const { programService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'X' });
    await programService.archive(teacher.id, p.id);
    const first = (await programService.getForTeacher(teacher.id, p.id))!.archivedAt;
    await programService.archive(teacher.id, p.id);
    const second = (await programService.getForTeacher(teacher.id, p.id))!.archivedAt;
    expect(second).toBe(first);
});

test('archive on other teacher\'s program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'X' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.programService.archive(t2.id, p.id)).rejects.toThrow();
    // Still active for original owner.
    expect(await ctx.programService.listForTeacher(ctx.teacher.id)).toHaveLength(1);
});

test('archive on missing program throws NotFoundError', async () => {
    const { programService, teacher } = await seedTeacher();
    await expect(programService.archive(teacher.id, 'missing')).rejects.toThrow();
});

test('addExercise on empty Program inserts row with sort_order = 0', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });

    await programService.addExercise(teacher.id, p.id, e.id);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list).toEqual([{
        id: e.id, name: 'E', description: '', sortOrder: 0, notes: null, archivedAt: null,
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

test('updateExerciseNotes rewrites the row note in place', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id, { notes: 'first' });

    await programService.updateExerciseNotes(teacher.id, p.id, e.id, '  3 varv  ');
    const list = await programService.listExercises(teacher.id, p.id);
    expect(list[0]!.notes).toBe('3 varv');
    // The row keeps its place — an edit is not a remove-and-re-add.
    expect(list[0]!.sortOrder).toBe(0);
});

test('updateExerciseNotes adds a note to a row that had none', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id);
    expect((await programService.listExercises(teacher.id, p.id))[0]!.notes).toBeNull();

    await programService.updateExerciseNotes(teacher.id, p.id, e.id, 'nytt');
    expect((await programService.listExercises(teacher.id, p.id))[0]!.notes).toBe('nytt');
});

test('updateExerciseNotes clears the note on null or blank', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    await programService.addExercise(teacher.id, p.id, e1.id, { notes: 'gone' });
    await programService.addExercise(teacher.id, p.id, e2.id, { notes: 'gone too' });

    await programService.updateExerciseNotes(teacher.id, p.id, e1.id, null);
    // Whitespace-only is the same answer as null — never stored as ''.
    await programService.updateExerciseNotes(teacher.id, p.id, e2.id, '   ');
    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((r) => r.notes)).toEqual([null, null]);
});

test('updateExerciseNotes touches only the addressed row', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    await programService.addExercise(teacher.id, p.id, e1.id, { notes: 'keep me' });
    await programService.addExercise(teacher.id, p.id, e2.id, { notes: 'change me' });

    await programService.updateExerciseNotes(teacher.id, p.id, e2.id, 'changed');
    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((r) => r.notes)).toEqual(['keep me', 'changed']);
});

test('updateExerciseNotes leaves the same Exercise in ANOTHER Program alone', async () => {
    // The note is what THIS Program says about the exercise. Two Programs may
    // say different things about the same one.
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p1 = await programService.create(teacher.id, { title: 'P1' });
    const p2 = await programService.create(teacher.id, { title: 'P2' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p1.id, e.id, { notes: 'p1 says' });
    await programService.addExercise(teacher.id, p2.id, e.id, { notes: 'p2 says' });

    await programService.updateExerciseNotes(teacher.id, p1.id, e.id, 'p1 now says');
    expect((await programService.listExercises(teacher.id, p1.id))[0]!.notes).toBe('p1 now says');
    expect((await programService.listExercises(teacher.id, p2.id))[0]!.notes).toBe('p2 says');
});

test('updateExerciseNotes on another teacher\'s Program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'P' });
    const e = await ctx.exerciseService.create(ctx.teacher.id, { name: 'E' });
    await ctx.programService.addExercise(ctx.teacher.id, p.id, e.id, { notes: 'mine' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });

    await expect(ctx.programService.updateExerciseNotes(t2.id, p.id, e.id, 'yours'))
        .rejects.toThrow();
    // And the note is untouched.
    expect((await ctx.programService.listExercises(ctx.teacher.id, p.id))[0]!.notes).toBe('mine');
});

test('updateExerciseNotes on a row that is not in the Program throws NotFoundError', async () => {
    // Not a silent no-op: an edit that lands nowhere has no idempotent reading.
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const loose = await exerciseService.create(teacher.id, { name: 'Loose' });
    await expect(programService.updateExerciseNotes(teacher.id, p.id, loose.id, 'x'))
        .rejects.toThrow();
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

test('reorderExercises rewrites sort_order to 0..n-1 in supplied order', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    const e3 = await exerciseService.create(teacher.id, { name: 'E3' });
    await programService.addExercise(teacher.id, p.id, e1.id);
    await programService.addExercise(teacher.id, p.id, e2.id);
    await programService.addExercise(teacher.id, p.id, e3.id);

    await programService.reorderExercises(teacher.id, p.id, [e3.id, e1.id, e2.id]);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((r) => [r.id, r.sortOrder])).toEqual([
        [e3.id, 0], [e1.id, 1], [e2.id, 2],
    ]);
});

test('reorderExercises rejects when supplied set has missing id', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    await programService.addExercise(teacher.id, p.id, e1.id);
    await programService.addExercise(teacher.id, p.id, e2.id);
    await expect(programService.reorderExercises(teacher.id, p.id, [e1.id]))
        .rejects.toThrow();
});

test('reorderExercises rejects when supplied set has extra id', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    await programService.addExercise(teacher.id, p.id, e1.id);
    await expect(programService.reorderExercises(teacher.id, p.id, [e1.id, e2.id]))
        .rejects.toThrow();
});

test('reorderExercises on cross-teacher Program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'P' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.programService.reorderExercises(t2.id, p.id, []))
        .rejects.toThrow();
});

test('removeExercise deletes the row and leaves siblings intact', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e1 = await exerciseService.create(teacher.id, { name: 'E1' });
    const e2 = await exerciseService.create(teacher.id, { name: 'E2' });
    const e3 = await exerciseService.create(teacher.id, { name: 'E3' });
    await programService.addExercise(teacher.id, p.id, e1.id);
    await programService.addExercise(teacher.id, p.id, e2.id);
    await programService.addExercise(teacher.id, p.id, e3.id);

    await programService.removeExercise(teacher.id, p.id, e2.id);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((r) => r.id)).toEqual([e1.id, e3.id]);
});

test('removeExercise on nonexistent row is silent (idempotent)', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    // Never added — should not throw.
    await programService.removeExercise(teacher.id, p.id, e.id);
});

test('removeExercise on cross-teacher Program throws NotFoundError', async () => {
    const ctx = await seedTeacher('t1@example.com');
    const p = await ctx.programService.create(ctx.teacher.id, { title: 'P' });
    const e = await ctx.exerciseService.create(ctx.teacher.id, { name: 'E' });
    await ctx.programService.addExercise(ctx.teacher.id, p.id, e.id);
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.programService.removeExercise(t2.id, p.id, e.id))
        .rejects.toThrow();
    // Still present for original owner.
    const list = await ctx.programService.listExercises(ctx.teacher.id, p.id);
    expect(list).toHaveLength(1);
});

test('archiving a Program preserves its program_exercise rows', async () => {
    const { programService, exerciseService, teacher, db } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id);
    await programService.archive(teacher.id, p.id);
    const rows = await db.selectFrom('program_exercise').selectAll().execute();
    expect(rows).toHaveLength(1);
});

// --- listForStudent (student-visible catalog from connected Teachers) ---

async function seedStudentForPrograms() {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    return { ...ctx, student };
}

async function connectStudentForPrograms(
    ctx: Awaited<ReturnType<typeof seedStudentForPrograms>>,
    teacherEmail: string,
) {
    const teacher = await ctx.userService.register({
        email: teacherEmail, password: 'secret123', displayName: teacherEmail,
    });
    const inv = await ctx.invitationService.createInvitation(teacher.id, ctx.student.email);
    await ctx.invitationService.acceptInvitation(inv.id, ctx.student.id, ctx.student.email);
    return teacher;
}

test('listForStudent returns empty when no relations', async () => {
    const { programService, student } = await seedStudentForPrograms();
    expect(await programService.listForStudent(student.id)).toEqual([]);
});

test('listForStudent throws NotFoundError for invalid student id', async () => {
    const { programService } = await seedStudentForPrograms();
    await expect(programService.listForStudent('missing')).rejects.toThrow();
});

test('listForStudent returns programs from connected teachers only, sorted created_at DESC', async () => {
    const ctx = await seedStudentForPrograms();
    const t1 = await connectStudentForPrograms(ctx, 't1@example.com');
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const p1 = await ctx.programService.create(t1.id, { title: 'First' });
    await new Promise((r) => setTimeout(r, 5));
    const p2 = await ctx.programService.create(t1.id, { title: 'Second' });
    await ctx.programService.create(t2.id, { title: 'Unconnected' });

    const list = await ctx.programService.listForStudent(ctx.student.id);
    expect(list.map((p) => p.id)).toEqual([p2.id, p1.id]);
});

test('listForStudent hides archived programs from a connected student', async () => {
    const ctx = await seedStudentForPrograms();
    const teacher = await connectStudentForPrograms(ctx, 't1@example.com');
    const keep = await ctx.programService.create(teacher.id, { title: 'Keep' });
    const gone = await ctx.programService.create(teacher.id, { title: 'Gone' });
    await ctx.programService.archive(teacher.id, gone.id);

    const list = await ctx.programService.listForStudent(ctx.student.id);
    expect(list.map((p) => p.id)).toEqual([keep.id]);
});

test('addExercise rejects an archived Exercise as an attach target', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await exerciseService.archive(teacher.id, e.id);
    await expect(programService.addExercise(teacher.id, p.id, e.id)).rejects.toThrow();
});

test('listExercises still resolves an archived Exercise already in the Program', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const e = await exerciseService.create(teacher.id, { name: 'E' });
    await programService.addExercise(teacher.id, p.id, e.id);
    await exerciseService.archive(teacher.id, e.id);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((x) => x.id)).toEqual([e.id]);
    expect(list[0]!.name).toBe('E');
    // And it SAYS so. The builder used to infer this from the row's absence
    // from GET /exercises; the row now carries the fact itself.
    expect(list[0]!.archivedAt).toBeString();
});

test('listExercises reports archivedAt per row, not for the whole Program', async () => {
    const { programService, exerciseService, teacher } = await seedTeacher();
    const p = await programService.create(teacher.id, { title: 'P' });
    const live = await exerciseService.create(teacher.id, { name: 'Live' });
    const dead = await exerciseService.create(teacher.id, { name: 'Dead' });
    await programService.addExercise(teacher.id, p.id, live.id);
    await programService.addExercise(teacher.id, p.id, dead.id);
    await exerciseService.archive(teacher.id, dead.id);

    const list = await programService.listExercises(teacher.id, p.id);
    expect(list.map((x) => x.archivedAt === null)).toEqual([true, false]);
});
