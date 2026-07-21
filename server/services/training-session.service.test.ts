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

// --- plan_id (037) ---

async function seedStudentWithPlan() {
    const ctx = await seedStudent();
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Vinterplan' });
    return { ...ctx, plan };
}

test('create attaches active Plan with hydrated planTitle', async () => {
    const { trainingSessionService, student, plan } = await seedStudentWithPlan();
    const ts = await trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        planId: plan.id,
    });
    expect(ts.planId).toBe(plan.id);
    expect(ts.planTitle).toBe('Vinterplan');
});

test('create rejects archived Plan', async () => {
    const ctx = await seedStudentWithPlan();
    await ctx.planService.archive(ctx.student.id, ctx.plan.id);
    await expect(ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    })).rejects.toThrow();
});

test('update attaches and clears planId by student owner', async () => {
    const ctx = await seedStudentWithPlan();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    const linked = await ctx.trainingSessionService.update(ctx.student.id, ts.id, {
        planId: ctx.plan.id,
    });
    expect(linked.planId).toBe(ctx.plan.id);
    const cleared = await ctx.trainingSessionService.update(ctx.student.id, ts.id, { planId: null });
    expect(cleared.planId).toBeNull();
});

test('detachFromPlan clears plan_id for student owner', async () => {
    const ctx = await seedStudentWithPlan();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    });
    const detached = await ctx.trainingSessionService.detachFromPlan(ctx.student.id, ts.id);
    expect(detached.planId).toBeNull();
});

test('teacher with share cannot detachFromPlan (student-only write)', async () => {
    const ctx = await seedStudentWithPlan();
    const teacher = await connect(ctx, 't@example.com');
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
        shareWithTeacherIds: [teacher.id],
    });
    await expect(ctx.trainingSessionService.detachFromPlan(teacher.id, ts.id)).rejects.toThrow();
});

test('listForStudent includes resolved planTitle', async () => {
    const ctx = await seedStudentWithPlan();
    await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    });
    const list = await ctx.trainingSessionService.listForStudent(ctx.student.id);
    expect(list[0].planId).toBe(ctx.plan.id);
    expect(list[0].planTitle).toBe('Vinterplan');
});

test('listForTeacherOfStudent returns shared TS with read-only planTitle', async () => {
    const ctx = await seedStudentWithPlan();
    const teacher = await connect(ctx, 't@example.com');
    await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
        shareWithTeacherIds: [teacher.id],
    });
    const list = await ctx.trainingSessionService.listForTeacherOfStudent(teacher.id, ctx.student.id);
    expect(list[0].planTitle).toBe('Vinterplan');
});

test('listForTeacherOfStudent returns only TS shared with the calling teacher, sorted DESC, with horseName', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 'tA@example.com');
    const other = await connect(ctx, 'tB@example.com');
    const horse = await ctx.horseService.create(ctx.student.id, { name: 'Brunte' });

    const sharedA = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [teacher.id],
        horseId: horse.id,
    });
    const sharedB = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-07-01T10:00:00.000Z',
        shareWithTeacherIds: [teacher.id, other.id],
    });
    // Private (no shares) and one shared only with the other teacher.
    await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-05-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-04-01T10:00:00.000Z',
        shareWithTeacherIds: [other.id],
    });

    const list = await ctx.trainingSessionService.listForTeacherOfStudent(teacher.id, ctx.student.id);
    expect(list.map((s) => s.id)).toEqual([sharedB.id, sharedA.id]);
    expect(list[1].horseName).toBe('Brunte');
});

test('listForTeacherOfStudent throws NotFoundError when not a connected teacher', async () => {
    const ctx = await seedStudent();
    const stranger = await ctx.userService.register({
        email: 'x@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.trainingSessionService.listForTeacherOfStudent(stranger.id, ctx.student.id))
        .rejects.toThrow();
});

test('getForViewer resolves for the owning student regardless of share', async () => {
    const ctx = await seedStudent();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    const got = await ctx.trainingSessionService.getForViewer(ctx.student.id, ts.id);
    expect(got.id).toBe(ts.id);
});

test('getForViewer resolves for a teacher only when a share row exists', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't@example.com');
    const privateTs = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    const sharedTs = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-07-01T10:00:00.000Z',
        shareWithTeacherIds: [teacher.id],
    });
    await expect(ctx.trainingSessionService.getForViewer(teacher.id, privateTs.id))
        .rejects.toThrow();
    const got = await ctx.trainingSessionService.getForViewer(teacher.id, sharedTs.id);
    expect(got.id).toBe(sharedTs.id);
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

// --- Training Session exercises (033) ---

test('addExercise links connected Teacher Exercise to own session with source_program_id null', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'Skritt' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });

    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id);
    const list = await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id);
    expect(list).toHaveLength(1);
    expect(list[0].exerciseId).toBe(ex.id);
    expect(list[0].name).toBe('Skritt');
    expect(list[0].sourceProgramId).toBeNull();
    expect(list[0].sortOrder).toBe(1);
});

test('addExercise on stranger session throws NotFoundError', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'X' });
    const other = await ctx.userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const ts = await ctx.trainingSessionService.create(other.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await expect(ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id))
        .rejects.toThrow();
});

test('addExercise with foreign Exercise throws NotFoundError', async () => {
    const ctx = await seedStudent();
    await connect(ctx, 't1@example.com');
    const stranger = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const foreign = await ctx.exerciseService.create(stranger.id, { name: 'Foreign' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await expect(ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, foreign.id))
        .rejects.toThrow();
});

test('addExercise is idempotent on duplicate link', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'X' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id);
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id);
    const list = await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id);
    expect(list).toHaveLength(1);
});

test('listExercises returns rows ordered by sort_order ASC', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const a = await ctx.exerciseService.create(teacher.id, { name: 'A' });
    const b = await ctx.exerciseService.create(teacher.id, { name: 'B' });
    const c = await ctx.exerciseService.create(teacher.id, { name: 'C' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, b.id);
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, a.id);
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, c.id);
    const list = await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id);
    expect(list.map((e) => e.exerciseId)).toEqual([b.id, a.id, c.id]);
});

test('removeExercise detaches; idempotent on missing link', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'X' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id);
    await ctx.trainingSessionService.removeExercise(ctx.student.id, ts.id, ex.id);
    expect(await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id)).toEqual([]);
    await ctx.trainingSessionService.removeExercise(ctx.student.id, ts.id, ex.id);
});

test('listExercises allows teacher with share; teacher without share throws', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'X' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [teacher.id],
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id);
    const asTeacher = await ctx.trainingSessionService.listExercises(teacher.id, ts.id);
    expect(asTeacher).toHaveLength(1);
    await expect(ctx.trainingSessionService.listExercises(stranger.id, ts.id))
        .rejects.toThrow();
});

test('teacher with share cannot addExercise (student-only write)', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'X' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [teacher.id],
    });
    await expect(ctx.trainingSessionService.addExercise(teacher.id, ts.id, ex.id))
        .rejects.toThrow();
});

test('getForViewer and listForStudent hydrate exercises', async () => {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'X' });
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ex.id);
    const got = await ctx.trainingSessionService.getForViewer(ctx.student.id, ts.id);
    expect(got.exercises).toHaveLength(1);
    const list = await ctx.trainingSessionService.listForStudent(ctx.student.id);
    expect(list[0].exercises).toHaveLength(1);
});

// --- Training Session programs (034) ---

async function seedConnectedWithProgram() {
    const ctx = await seedStudent();
    const teacher = await connect(ctx, 't1@example.com');
    const ex1 = await ctx.exerciseService.create(teacher.id, { name: 'Skritt' });
    const ex2 = await ctx.exerciseService.create(teacher.id, { name: 'Trav' });
    const ex3 = await ctx.exerciseService.create(teacher.id, { name: 'Galopp' });
    const program = await ctx.programService.create(teacher.id, { title: 'Uppvärmning' });
    await ctx.programService.addExercise(teacher.id, program.id, ex1.id, { notes: 'lugnt' });
    await ctx.programService.addExercise(teacher.id, program.id, ex2.id);
    await ctx.programService.addExercise(teacher.id, program.id, ex3.id, { notes: 'sista' });
    return { ...ctx, teacher, program, ex1, ex2, ex3 };
}

test('create with programId snapshot-copies program exercises and attaches junction', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    expect(ts.programs.map((p) => p.id)).toEqual([ctx.program.id]);
    expect(ts.exercises.map((e) => e.name)).toEqual(['Skritt', 'Trav', 'Galopp']);
    expect(ts.exercises.every((e) => e.sourceProgramId === ctx.program.id)).toBe(true);
});

test('create with foreign programId throws NotFoundError', async () => {
    const ctx = await seedConnectedWithProgram();
    const stranger = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const foreign = await ctx.programService.create(stranger.id, { title: 'Foreign' });
    await expect(ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        programId: foreign.id,
    })).rejects.toThrow();
});

test('the static Row note is projected on listExercises, getForViewer and both lists', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
        shareWithTeacherIds: [ctx.teacher.id],
    });

    // Copied verbatim from program_exercise.notes — IA §3.10's static Row note.
    const expected = [
        { exerciseId: ctx.ex1.id, notes: 'lugnt' },
        { exerciseId: ctx.ex2.id, notes: null },
        { exerciseId: ctx.ex3.id, notes: 'sista' },
    ];
    const project = (refs: { exerciseId: string; notes: string | null }[]) =>
        refs.map((r) => ({ exerciseId: r.exerciseId, notes: r.notes }));

    expect(project(await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id)))
        .toEqual(expected);

    const detail = await ctx.trainingSessionService.getForViewer(ctx.student.id, ts.id);
    expect(project(detail.exercises)).toEqual(expected);

    // The shared Teacher reads the same instructional text on the same session.
    const teacherView = await ctx.trainingSessionService.getForViewer(ctx.teacher.id, ts.id);
    expect(project(teacherView.exercises)).toEqual(expected);

    const owned = (await ctx.trainingSessionService.listForStudent(ctx.student.id))
        .find((s) => s.id === ts.id)!;
    expect(project(owned.exercises)).toEqual(expected);

    const shared = (await ctx.trainingSessionService
        .listForTeacherOfStudent(ctx.teacher.id, ctx.student.id))
        .find((s) => s.id === ts.id)!;
    expect(project(shared.exercises)).toEqual(expected);
});

test('an Exercise added free carries a null Row note', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ctx.ex1.id);
    const refs = await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id);
    expect(refs).toHaveLength(1);
    expect(refs[0]!.notes).toBeNull();
});

test('attachProgram copies exercises with source_program_id and skips duplicates', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ctx.ex1.id);
    const attached = await ctx.trainingSessionService.attachProgram(
        ctx.student.id, ts.id, ctx.program.id,
    );
    expect(attached.programs.map((p) => p.id)).toEqual([ctx.program.id]);
    expect(attached.exercises.map((e) => e.exerciseId)).toEqual([
        ctx.ex1.id, ctx.ex2.id, ctx.ex3.id,
    ]);
    expect(attached.exercises.filter((e) => e.sourceProgramId === ctx.program.id)).toHaveLength(2);
});

test('attachProgram is idempotent on re-attach', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.attachProgram(ctx.student.id, ts.id, ctx.program.id);
    const again = await ctx.trainingSessionService.attachProgram(ctx.student.id, ts.id, ctx.program.id);
    expect(again.exercises).toHaveLength(3);
    expect(again.programs).toHaveLength(1);
});

test('detachProgram removes junction only; snapshot rows preserved', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const detached = await ctx.trainingSessionService.detachProgram(
        ctx.student.id, ts.id, ctx.program.id,
    );
    expect(detached.programs).toEqual([]);
    expect(detached.exercises).toHaveLength(3);
});

test('attachProgram on stranger session throws NotFoundError', async () => {
    const ctx = await seedConnectedWithProgram();
    const other = await ctx.userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const ts = await ctx.trainingSessionService.create(other.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await expect(ctx.trainingSessionService.attachProgram(
        ctx.student.id, ts.id, ctx.program.id,
    )).rejects.toThrow();
});

test('teacher with share cannot attachProgram (student-only write)', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [ctx.teacher.id],
    });
    await expect(ctx.trainingSessionService.attachProgram(
        ctx.teacher.id, ts.id, ctx.program.id,
    )).rejects.toThrow();
});

// --- soft-deleted Exercises / Programs are not attachable (043/044) ---

test('addExercise rejects an archived Exercise', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex1.id);
    await expect(ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ctx.ex1.id))
        .rejects.toThrow();
});

test('attachProgram rejects an archived Program', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.programService.archive(ctx.teacher.id, ctx.program.id);
    await expect(ctx.trainingSessionService.attachProgram(ctx.student.id, ts.id, ctx.program.id))
        .rejects.toThrow();
});

test('create rejects an archived Program as the snapshot source', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.programService.archive(ctx.teacher.id, ctx.program.id);
    await expect(ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    })).rejects.toThrow();
});

test('archiving an Exercise keeps existing training_session_exercise rows resolving', async () => {
    const ctx = await seedConnectedWithProgram();
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.trainingSessionService.addExercise(ctx.student.id, ts.id, ctx.ex1.id);
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex1.id);

    const refs = await ctx.trainingSessionService.listExercises(ctx.student.id, ts.id);
    expect(refs.map((r) => r.exerciseId)).toEqual([ctx.ex1.id]);
    expect(refs[0]!.name).toBe('Skritt');
});

// --- archived Exercises must not re-enter via a Program snapshot ---

test('create with programId skips archived Exercises', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex2.id);
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    expect(ts.exercises.map((e) => e.name)).toEqual(['Skritt', 'Galopp']);
});

test('attachProgram skips archived Exercises', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex1.id);
    const ts = await ctx.trainingSessionService.create(ctx.student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    const after = await ctx.trainingSessionService.attachProgram(ctx.student.id, ts.id, ctx.program.id);
    expect(after.exercises.map((e) => e.name)).toEqual(['Trav', 'Galopp']);
});
