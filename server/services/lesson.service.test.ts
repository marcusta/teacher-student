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

// --- listForUser (013: same endpoint serves teacher + student sides) ---

test('listForUser returns lessons from teacher side with role + counterparty', async () => {
    const { lessonService, teacher, student } = await seedConnected();
    await lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const list = await lessonService.listForUser(teacher.id);
    expect(list.length).toBe(1);
    expect(list[0].role).toBe('teacher');
    expect(list[0].counterpartyDisplayName).toBe('S');
});

test('listForUser returns lessons from student side with role + counterparty', async () => {
    const { lessonService, teacher, student } = await seedConnected();
    await lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const list = await lessonService.listForUser(student.id);
    expect(list.length).toBe(1);
    expect(list[0].role).toBe('student');
    expect(list[0].counterpartyDisplayName).toBe('T');
});

test('listForUser merges both sides sorted by scheduled_at ASC', async () => {
    const ctx = await seedConnected();
    // ctx.teacher schedules a lesson with ctx.student.
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-07-01T10:00:00.000Z',
    });
    // ctx.teacher is also a student of another teacher.
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const inv = await ctx.invitationService.createInvitation(t2.id, 'teacher@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, ctx.teacher.id, 'teacher@example.com');
    await ctx.lessonService.create(t2.id, {
        studentId: ctx.teacher.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const list = await ctx.lessonService.listForUser(ctx.teacher.id);
    expect(list.length).toBe(2);
    expect(list[0].scheduledAt).toBe('2026-06-01T10:00:00.000Z');
    expect(list[0].role).toBe('student');
    expect(list[0].counterpartyDisplayName).toBe('T2');
    expect(list[1].role).toBe('teacher');
    expect(list[1].counterpartyDisplayName).toBe('S');
});

// --- update (014: attach Horse + reschedule) ---

async function seedConnectedWithHorse() {
    const ctx = await seedConnected();
    const horse = await ctx.horseService.create(ctx.student.id, { name: 'Bella' });
    return { ...ctx, horse };
}

test('update attaches a Horse owned by the lesson Student', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    const updated = await ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        horseId: ctx.horse.id,
    });

    expect(updated.horseId).toBe(ctx.horse.id);
    expect(updated.horseName).toBe('Bella');
});

test('update detaches the Horse when horseId is null', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.update(ctx.teacher.id, lesson.id, { horseId: ctx.horse.id });

    const cleared = await ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        horseId: null,
    });
    expect(cleared.horseId).toBeNull();
    expect(cleared.horseName).toBeNull();
});

test('update reschedules without touching horse', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.update(ctx.teacher.id, lesson.id, { horseId: ctx.horse.id });

    const updated = await ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        scheduledAt: '2026-07-15T09:30:00.000Z',
    });
    expect(updated.scheduledAt).toBe('2026-07-15T09:30:00.000Z');
    expect(updated.horseId).toBe(ctx.horse.id);
});

test('update by a different teacher throws NotFoundError', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const intruder = await ctx.userService.register({
        email: 'intruder@example.com', password: 'secret123', displayName: 'I',
    });
    await expect(ctx.lessonService.update(intruder.id, lesson.id, {
        horseId: ctx.horse.id,
    })).rejects.toThrow();
});

test('update rejects a Horse owned by a different Student', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    // A second student with their own horse, connected to the same teacher.
    const other = await ctx.userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const inv = await ctx.invitationService.createInvitation(ctx.teacher.id, 'other@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, other.id, 'other@example.com');
    const otherHorse = await ctx.horseService.create(other.id, { name: 'Foreign' });

    await expect(ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        horseId: otherHorse.id,
    })).rejects.toThrow();
});

test('update rejects an archived Horse', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.horseService.archive(ctx.student.id, ctx.horse.id);

    await expect(ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        horseId: ctx.horse.id,
    })).rejects.toThrow();
});

test('listForUser populates horseName when attached', async () => {
    const ctx = await seedConnectedWithHorse();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.update(ctx.teacher.id, lesson.id, { horseId: ctx.horse.id });

    const list = await ctx.lessonService.listForUser(ctx.student.id);
    expect(list[0].horseId).toBe(ctx.horse.id);
    expect(list[0].horseName).toBe('Bella');
});

// --- plan_id (036: attach Plan to Lesson) ---

async function seedConnectedWithPlan() {
    const ctx = await seedConnected();
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Sommarplan' });
    return { ...ctx, plan };
}

test('create attaches an active Plan for the lesson Student', async () => {
    const ctx = await seedConnectedWithPlan();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    });
    expect(lesson.planId).toBe(ctx.plan.id);
    expect(lesson.planTitle).toBe('Sommarplan');
});

test('create rejects archived Plan', async () => {
    const ctx = await seedConnectedWithPlan();
    await ctx.planService.archive(ctx.student.id, ctx.plan.id);
    await expect(ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    })).rejects.toThrow();
});

test('create rejects foreign Plan (wrong student)', async () => {
    const ctx = await seedConnectedWithPlan();
    const other = await ctx.userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const foreign = await ctx.planService.create(other.id, { title: 'Foreign' });
    await expect(ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: foreign.id,
    })).rejects.toThrow();
});

test('update attaches and detaches Plan by lesson Teacher', async () => {
    const ctx = await seedConnectedWithPlan();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const linked = await ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        planId: ctx.plan.id,
    });
    expect(linked.planId).toBe(ctx.plan.id);
    expect(linked.planTitle).toBe('Sommarplan');

    const cleared = await ctx.lessonService.update(ctx.teacher.id, lesson.id, { planId: null });
    expect(cleared.planId).toBeNull();
    expect(cleared.planTitle).toBeNull();
});

test('detachFromPlan by lesson Teacher clears plan_id', async () => {
    const ctx = await seedConnectedWithPlan();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    });
    const detached = await ctx.lessonService.detachFromPlan(ctx.teacher.id, lesson.id);
    expect(detached.planId).toBeNull();
});

test('detachFromPlan by plan Student owner clears plan_id', async () => {
    const ctx = await seedConnectedWithPlan();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    });
    const detached = await ctx.lessonService.detachFromPlan(ctx.student.id, lesson.id);
    expect(detached.planId).toBeNull();
});

test('detachFromPlan by stranger throws NotFoundError', async () => {
    const ctx = await seedConnectedWithPlan();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        planId: ctx.plan.id,
    });
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.lessonService.detachFromPlan(stranger.id, lesson.id)).rejects.toThrow();
});

test('update rejects attach to archived Plan', async () => {
    const ctx = await seedConnectedWithPlan();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.planService.archive(ctx.student.id, ctx.plan.id);
    await expect(ctx.lessonService.update(ctx.teacher.id, lesson.id, {
        planId: ctx.plan.id,
    })).rejects.toThrow();
});

// --- exercises (016: attach Exercises to a Lesson) ---

test('addExercise links Teacher\'s Exercise to own Lesson', async () => {
    const ctx = await seedConnected();
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ex.id);
    const list = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(list.map((e) => e.exerciseId)).toEqual([ex.id]);
    expect(list[0].name).toBe('Skritt');
    expect(list[0].sortOrder).toBe(1);
});

test('addExercise on a stranger Lesson throws NotFoundError', async () => {
    const ctx = await seedConnected();
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const inv = await ctx.invitationService.createInvitation(t2.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, ctx.student.id, 'student@example.com');
    const otherLesson = await ctx.lessonService.create(t2.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    await expect(ctx.lessonService.addExercise(ctx.teacher.id, otherLesson.id, ex.id))
        .rejects.toThrow();
});

test('addExercise with a foreign Exercise throws NotFoundError', async () => {
    const ctx = await seedConnected();
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const foreign = await ctx.exerciseService.create(t2.id, { name: 'Foreign' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    await expect(ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, foreign.id))
        .rejects.toThrow();
});

test('addExercise is idempotent on a duplicate link', async () => {
    const ctx = await seedConnected();
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ex.id);
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ex.id);
    const list = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(list.length).toBe(1);
});

test('listExercises orders by sort_order ASC', async () => {
    const ctx = await seedConnected();
    const a = await ctx.exerciseService.create(ctx.teacher.id, { name: 'A' });
    const b = await ctx.exerciseService.create(ctx.teacher.id, { name: 'B' });
    const c = await ctx.exerciseService.create(ctx.teacher.id, { name: 'C' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, b.id);
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, a.id);
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, c.id);

    const list = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(list.map((e) => e.exerciseId)).toEqual([b.id, a.id, c.id]);
});

test('removeExercise unlinks; idempotent on missing link', async () => {
    const ctx = await seedConnected();
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ex.id);

    await ctx.lessonService.removeExercise(ctx.teacher.id, lesson.id, ex.id);
    expect(await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id)).toEqual([]);
    // second removal is a no-op
    await ctx.lessonService.removeExercise(ctx.teacher.id, lesson.id, ex.id);
});

test('listExercises is readable by the Lesson\'s Student', async () => {
    const ctx = await seedConnected();
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ex.id);

    const list = await ctx.lessonService.listExercises(ctx.student.id, lesson.id);
    expect(list.map((e) => e.exerciseId)).toEqual([ex.id]);
});

test('listExercises by an outsider throws NotFoundError', async () => {
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.lessonService.listExercises(stranger.id, lesson.id)).rejects.toThrow();
});

test('listForUser includes exercises array on each row', async () => {
    const ctx = await seedConnected();
    const ex = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ex.id);

    const list = await ctx.lessonService.listForUser(ctx.student.id);
    expect(list[0].exercises.map((e) => e.exerciseId)).toEqual([ex.id]);
    expect(list[0].exercises[0].name).toBe('Skritt');
});

// --- transition (015: terminal status moves) ---

test('transition to completed sets status', async () => {
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const moved = await ctx.lessonService.transition(ctx.teacher.id, lesson.id, 'completed');
    expect(moved.status).toBe('completed');
});

test('transition to cancelled sets status', async () => {
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const moved = await ctx.lessonService.transition(ctx.teacher.id, lesson.id, 'cancelled');
    expect(moved.status).toBe('cancelled');
});

test('transition is idempotent on the same terminal status', async () => {
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.transition(ctx.teacher.id, lesson.id, 'completed');
    const again = await ctx.lessonService.transition(ctx.teacher.id, lesson.id, 'completed');
    expect(again.status).toBe('completed');
});

test('transition from one terminal to the other throws ConflictError', async () => {
    const { ConflictError } = await import('@basics/core/server/auth');
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.transition(ctx.teacher.id, lesson.id, 'completed');
    await expect(ctx.lessonService.transition(ctx.teacher.id, lesson.id, 'cancelled'))
        .rejects.toBeInstanceOf(ConflictError);
});

test('transition by a different teacher throws NotFoundError', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const intruder = await ctx.userService.register({
        email: 'intruder@example.com', password: 'secret123', displayName: 'I',
    });
    await expect(ctx.lessonService.transition(intruder.id, lesson.id, 'completed'))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('listForUser returns [] for user with no lessons', async () => {
    const ctx = await seedConnected();
    const lonely = await ctx.userService.register({
        email: 'lonely@example.com', password: 'secret123', displayName: 'L',
    });
    expect(await ctx.lessonService.listForUser(lonely.id)).toEqual([]);
});

// --- 028: snapshot-copy Program exercises into a Lesson on create ---

async function seedConnectedWithProgram() {
    const ctx = await seedConnected();
    const ex1 = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Skritt' });
    const ex2 = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Trav' });
    const ex3 = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Galopp' });
    const program = await ctx.programService.create(ctx.teacher.id, { title: 'Uppvärmning' });
    await ctx.programService.addExercise(ctx.teacher.id, program.id, ex1.id, { notes: 'lugnt' });
    await ctx.programService.addExercise(ctx.teacher.id, program.id, ex2.id);
    await ctx.programService.addExercise(ctx.teacher.id, program.id, ex3.id, { notes: 'sista' });
    return { ...ctx, program, ex1, ex2, ex3 };
}

test('create with programId snapshot-copies program exercises in order', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    expect(lesson.programs.map((p) => p.id)).toEqual([ctx.program.id]);
    expect(lesson.programs.map((p) => p.title)).toEqual(['Uppvärmning']);
    expect(lesson.exercises.map((e) => e.name)).toEqual(['Skritt', 'Trav', 'Galopp']);
});

test('create with foreign-owned programId throws NotFoundError', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const inv2 = await ctx.invitationService.createInvitation(t2.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv2.id, ctx.student.id, 'student@example.com');
    await expect(ctx.lessonService.create(t2.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('create with non-existent programId throws NotFoundError', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    await expect(ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: 'does-not-exist',
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('create without programId leaves programId null and exercises empty', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    expect(lesson.programs).toEqual([]);
    expect(lesson.exercises).toEqual([]);
});

test('snapshot is independent of later Program edits', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    // Mutate source program — remove an exercise and add a new one.
    await ctx.programService.removeExercise(ctx.teacher.id, ctx.program.id, ctx.ex1.id);
    const exNew = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Nytt' });
    await ctx.programService.addExercise(ctx.teacher.id, ctx.program.id, exNew.id);

    const list = await ctx.lessonService.listForTeacher(ctx.teacher.id);
    const fresh = list.find((l) => l.id === lesson.id)!;
    expect(fresh.exercises.map((e) => e.name)).toEqual(['Skritt', 'Trav', 'Galopp']);
});

test('listForTeacher surfaces attached programs', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const list = await ctx.lessonService.listForTeacher(ctx.teacher.id);
    expect(list[0].programs).toEqual([{ id: ctx.program.id, title: 'Uppvärmning' }]);
});

test('listForUser on student side surfaces attached programs', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const list = await ctx.lessonService.listForUser(ctx.student.id);
    expect(list[0].programs).toEqual([{ id: ctx.program.id, title: 'Uppvärmning' }]);
});

test('create with programId fills source_program_id on every snapshot row', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const rows = await ctx.db.selectFrom('lesson_exercise')
        .select(['id', 'source_program_id'])
        .where('lesson_id', '=', lesson.id)
        .execute();
    expect(rows.length).toBe(3);
    for (const r of rows) {
        expect(r.id).toBeString();
        expect(r.source_program_id).toBe(ctx.program.id);
    }
    // Surrogate ids are unique.
    expect(new Set(rows.map((r) => r.id)).size).toBe(3);
});

test('addExercise (free add) inserts row with source_program_id = null', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const exFree = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Frittstå' });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, exFree.id);
    const row = await ctx.db.selectFrom('lesson_exercise')
        .select(['id', 'source_program_id'])
        .where('lesson_id', '=', lesson.id)
        .where('exercise_id', '=', exFree.id)
        .executeTakeFirstOrThrow();
    expect(row.id).toBeString();
    expect(row.source_program_id).toBeNull();
});

test('listExercises returns the lesson_exercise surrogate id and sourceProgramId', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const refs = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(refs.length).toBe(3);
    for (const r of refs) {
        expect(r.id).toBeString();
        expect(r.sourceProgramId).toBe(ctx.program.id);
    }
});

test('create with programId copies notes and sort_order verbatim into lesson_exercise', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const rows = await ctx.db.selectFrom('lesson_exercise')
        .select(['exercise_id', 'sort_order', 'notes'])
        .where('lesson_id', '=', lesson.id)
        .orderBy('sort_order', 'asc')
        .execute();
    expect(rows).toEqual([
        { exercise_id: ctx.ex1.id, sort_order: 0, notes: 'lugnt' },
        { exercise_id: ctx.ex2.id, sort_order: 1, notes: null },
        { exercise_id: ctx.ex3.id, sort_order: 2, notes: 'sista' },
    ]);
});

test('the static Row note is projected on listExercises, getForUser and listForUser', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });

    // Copied verbatim from program_exercise.notes — IA §3.8's static Row note.
    const expected = [
        { exerciseId: ctx.ex1.id, notes: 'lugnt' },
        { exerciseId: ctx.ex2.id, notes: null },
        { exerciseId: ctx.ex3.id, notes: 'sista' },
    ];
    const project = (refs: { exerciseId: string; notes: string | null }[]) =>
        refs.map((r) => ({ exerciseId: r.exerciseId, notes: r.notes }));

    expect(project(await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id)))
        .toEqual(expected);

    const detail = await ctx.lessonService.getForUser(ctx.teacher.id, lesson.id);
    expect(project(detail.exercises)).toEqual(expected);

    // The Student sees the same instructional text on their own detail view.
    const studentDetail = await ctx.lessonService.getForUser(ctx.student.id, lesson.id);
    expect(project(studentDetail.exercises)).toEqual(expected);

    const listed = (await ctx.lessonService.listForUser(ctx.teacher.id))
        .find((l) => l.id === lesson.id)!;
    expect(project(listed.exercises)).toEqual(expected);
});

test('an Exercise added free carries a null Row note', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ctx.ex1.id);
    const refs = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(refs.length).toBe(1);
    expect(refs[0]!.notes).toBeNull();
});

test('attachProgram on empty lesson appends all program exercises in order', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const updated = await ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    expect(updated.programs).toEqual([{ id: ctx.program.id, title: 'Uppvärmning' }]);
    expect(updated.exercises.map((e) => e.name)).toEqual(['Skritt', 'Trav', 'Galopp']);
    for (const e of updated.exercises) {
        expect(e.sourceProgramId).toBe(ctx.program.id);
    }
});

test('attachProgram appends only non-duplicate exercises, preserving existing rows', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    // Free-add ex2 first so it's already on the lesson before attach.
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ctx.ex2.id);
    const updated = await ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    // ex2 remains free (source null); ex1 and ex3 get appended with source set.
    const byId = new Map(updated.exercises.map((e) => [e.exerciseId, e]));
    expect(byId.get(ctx.ex2.id)!.sourceProgramId).toBeNull();
    expect(byId.get(ctx.ex1.id)!.sourceProgramId).toBe(ctx.program.id);
    expect(byId.get(ctx.ex3.id)!.sourceProgramId).toBe(ctx.program.id);
    expect(updated.exercises.length).toBe(3);
});

test('attachProgram is idempotent: re-attaching the same program is a no-op', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const again = await ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    expect(again.programs.length).toBe(1);
    expect(again.exercises.length).toBe(3);
    const junctionRows = await ctx.db.selectFrom('lesson_program')
        .selectAll().where('lesson_id', '=', lesson.id).execute();
    expect(junctionRows.length).toBe(1);
});

test('attachProgram supports multiple distinct programs on one lesson', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const p2 = await ctx.programService.create(ctx.teacher.id, { title: 'Stretch' });
    const exX = await ctx.exerciseService.create(ctx.teacher.id, { name: 'Box' });
    await ctx.programService.addExercise(ctx.teacher.id, p2.id, exX.id);
    const updated = await ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, p2.id);
    expect(updated.programs.map((p) => p.title)).toEqual(['Uppvärmning', 'Stretch']);
    expect(updated.exercises.map((e) => e.name)).toEqual(['Skritt', 'Trav', 'Galopp', 'Box']);
});

test('lesson_program ordering is stable when attached_at timestamps tie', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const p2 = await ctx.programService.create(ctx.teacher.id, { title: 'Stretch' });
    const p3 = await ctx.programService.create(ctx.teacher.id, { title: 'Cooldown' });
    // Force tied timestamps to expose ordering flake.
    const sameTs = '2026-06-01T09:00:00.000Z';
    await ctx.db.deleteFrom('lesson_program').where('lesson_id', '=', lesson.id).execute();
    await ctx.db.insertInto('lesson_program').values({
        lesson_id: lesson.id, program_id: ctx.program.id, attached_at: sameTs,
    }).execute();
    await ctx.db.insertInto('lesson_program').values({
        lesson_id: lesson.id, program_id: p2.id, attached_at: sameTs,
    }).execute();
    await ctx.db.insertInto('lesson_program').values({
        lesson_id: lesson.id, program_id: p3.id, attached_at: sameTs,
    }).execute();

    const list = await ctx.lessonService.listForTeacher(ctx.teacher.id);
    const found = list.find((l) => l.id === lesson.id);
    expect(found!.programs.map((p) => p.title)).toEqual(['Uppvärmning', 'Stretch', 'Cooldown']);
});

test('attachProgram on stranger lesson throws NotFoundError', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.lessonService.attachProgram(t2.id, lesson.id, ctx.program.id))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('attachProgram with foreign-owned program throws NotFoundError', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const p2 = await ctx.programService.create(t2.id, { title: 'Other' });
    await expect(ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, p2.id))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('detachProgram removes junction row but preserves snapshot exercises', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const updated = await ctx.lessonService.detachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    expect(updated.programs).toEqual([]);
    // Exercises stick around (with sourceProgramId still set — history).
    expect(updated.exercises.length).toBe(3);
    expect(updated.exercises.every((e) => e.sourceProgramId === ctx.program.id)).toBe(true);
});

test('detachProgram is idempotent when program is not attached', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const updated = await ctx.lessonService.detachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    expect(updated.programs).toEqual([]);
});

test('detachProgram on stranger lesson throws NotFoundError', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    await expect(ctx.lessonService.detachProgram(t2.id, lesson.id, ctx.program.id))
        .rejects.toBeInstanceOf(NotFoundError);
});

// --- 032: exercise history per student ---

test('exerciseHistory throws NotFoundError for outsider and unconnected teacher', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });

    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.lessonService.exerciseHistory(
        stranger.id, ctx.student.id, ctx.ex1.id,
    )).rejects.toBeInstanceOf(NotFoundError);

    const otherTeacher = await ctx.userService.register({
        email: 'other-t@example.com', password: 'secret123', displayName: 'OT',
    });
    await expect(ctx.lessonService.exerciseHistory(
        otherTeacher.id, ctx.student.id, ctx.ex1.id,
    )).rejects.toBeInstanceOf(NotFoundError);

    const otherStudent = await ctx.userService.register({
        email: 'other-s@example.com', password: 'secret123', displayName: 'OS',
    });
    await expect(ctx.lessonService.exerciseHistory(
        otherStudent.id, ctx.student.id, ctx.ex1.id,
    )).rejects.toBeInstanceOf(NotFoundError);
});

test('exerciseHistory returns only matching (student, exercise) rows sorted scheduledAt DESC', async () => {
    const ctx = await seedConnectedWithProgram();
    const earlier = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const later = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-07-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const ex2OnlyLesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-08-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, ex2OnlyLesson.id, ctx.ex2.id);

    const teacherView = await ctx.lessonService.exerciseHistory(
        ctx.teacher.id, ctx.student.id, ctx.ex1.id,
    );
    expect(teacherView.map((e) => e.lessonId)).toEqual([later.id, earlier.id]);
    expect(teacherView.every((e) => e.notes.length === 0)).toBe(true);

    const studentView = await ctx.lessonService.exerciseHistory(
        ctx.student.id, ctx.student.id, ctx.ex1.id,
    );
    expect(studentView.map((e) => e.lessonId)).toEqual([later.id, earlier.id]);

    const ex2Only = await ctx.lessonService.exerciseHistory(
        ctx.teacher.id, ctx.student.id, ctx.ex2.id,
    );
    expect(ex2Only.map((e) => e.lessonId)).toEqual([ex2OnlyLesson.id, later.id, earlier.id]);

    const empty = await ctx.lessonService.exerciseHistory(
        ctx.teacher.id, ctx.student.id, '00000000-0000-4000-8000-000000000099',
    );
    expect(empty).toEqual([]);
});

test('exerciseHistory includes program snapshot and free-add origins with sourceProgramTitle', async () => {
    const ctx = await seedConnectedWithProgram();
    const fromProgram = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const freeAddLesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-07-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, freeAddLesson.id, ctx.ex1.id);

    const history = await ctx.lessonService.exerciseHistory(
        ctx.teacher.id, ctx.student.id, ctx.ex1.id,
    );
    expect(history.length).toBe(2);

    const snapshot = history.find((e) => e.lessonId === fromProgram.id)!;
    expect(snapshot.sourceProgramId).toBe(ctx.program.id);
    expect(snapshot.sourceProgramTitle).toBe('Uppvärmning');
    expect(snapshot.rowNotes).toBe('lugnt');

    const free = history.find((e) => e.lessonId === freeAddLesson.id)!;
    expect(free.sourceProgramId).toBeNull();
    expect(free.sourceProgramTitle).toBeNull();
    expect(free.rowNotes).toBeNull();
});

test('exerciseHistory note visibility matches NoteService.listFor', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const refs = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    const leId = refs.find((r) => r.exerciseId === ctx.ex1.id)!.id;

    await ctx.noteService.create(ctx.teacher.id, {
        parentKind: 'lesson_exercise', parentId: leId,
        body: 'teacher private', visibility: 'private',
    });
    await ctx.noteService.create(ctx.teacher.id, {
        parentKind: 'lesson_exercise', parentId: leId,
        body: 'teacher shared', visibility: 'shared',
    });
    await ctx.noteService.create(ctx.student.id, {
        parentKind: 'lesson_exercise', parentId: leId,
        body: 'student private', visibility: 'private',
    });

    const studentHistory = await ctx.lessonService.exerciseHistory(
        ctx.student.id, ctx.student.id, ctx.ex1.id,
    );
    expect(studentHistory[0]!.notes.map((n) => n.body)).toEqual([
        'teacher shared', 'student private',
    ]);

    const teacherHistory = await ctx.lessonService.exerciseHistory(
        ctx.teacher.id, ctx.student.id, ctx.ex1.id,
    );
    expect(teacherHistory[0]!.notes.map((n) => n.body)).toEqual([
        'teacher private', 'teacher shared',
    ]);
});

// --- getForUser (Lesson detail lookup) ---

test('getForUser returns the LessonForUser shape for the teacher side', async () => {
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const got = await ctx.lessonService.getForUser(ctx.teacher.id, lesson.id);
    expect(got.id).toBe(lesson.id);
    expect(got.role).toBe('teacher');
    expect(got.counterpartyDisplayName).toBe('S');
    expect(got.status).toBe('planned');
});

test('getForUser returns the student side with the teacher as counterparty', async () => {
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const got = await ctx.lessonService.getForUser(ctx.student.id, lesson.id);
    expect(got.role).toBe('student');
    expect(got.counterpartyDisplayName).toBe('T');
});

test('getForUser hydrates horse, plan, exercises and programs like listForUser', async () => {
    const ctx = await seedConnectedWithProgram();
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Sommar' });
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
        planId: plan.id,
    });
    const horse = await ctx.horseService.create(ctx.student.id, { name: 'Bella' });
    await ctx.lessonService.update(ctx.teacher.id, lesson.id, { horseId: horse.id });

    const got = await ctx.lessonService.getForUser(ctx.teacher.id, lesson.id);
    const fromList = (await ctx.lessonService.listForUser(ctx.teacher.id))
        .find((l) => l.id === lesson.id)!;
    expect(got).toEqual(fromList);
    expect(got.horseName).toBe('Bella');
    expect(got.planTitle).toBe('Sommar');
    expect(got.programs.map((p) => p.id)).toEqual([ctx.program.id]);
    expect(got.exercises.length).toBeGreaterThan(0);
});

test('getForUser throws NotFoundError for an outsider', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnected();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const intruder = await ctx.userService.register({
        email: 'intruder@example.com', password: 'secret123', displayName: 'I',
    });
    await expect(ctx.lessonService.getForUser(intruder.id, lesson.id))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('getForUser throws NotFoundError for a missing Lesson', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnected();
    await expect(ctx.lessonService.getForUser(ctx.teacher.id, 'missing'))
        .rejects.toBeInstanceOf(NotFoundError);
});

// --- terminal-state lock: structural mutations only ---
//
// A Completed/Cancelled Lesson is the historical record of what was actually
// ridden, so the four mutations that rewrite its exercise/program set are
// refused with ConflictError (409). `update`, `detachFromPlan` and Notes stay
// open on purpose — corrections and post-hoc feedback need no reopen flow.

async function seedTerminalLesson(target: 'completed' | 'cancelled') {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.transition(ctx.teacher.id, lesson.id, target);
    return { ...ctx, lesson };
}

for (const target of ['completed', 'cancelled'] as const) {
    test(`addExercise on a ${target} Lesson throws ConflictError`, async () => {
        const { ConflictError } = await import('@basics/core/server/auth');
        const ctx = await seedTerminalLesson(target);
        await expect(ctx.lessonService.addExercise(ctx.teacher.id, ctx.lesson.id, ctx.ex1.id))
            .rejects.toBeInstanceOf(ConflictError);
    });

    test(`removeExercise on a ${target} Lesson throws ConflictError`, async () => {
        const { ConflictError } = await import('@basics/core/server/auth');
        const ctx = await seedTerminalLesson(target);
        await expect(ctx.lessonService.removeExercise(ctx.teacher.id, ctx.lesson.id, ctx.ex1.id))
            .rejects.toBeInstanceOf(ConflictError);
    });

    test(`attachProgram on a ${target} Lesson throws ConflictError`, async () => {
        const { ConflictError } = await import('@basics/core/server/auth');
        const ctx = await seedTerminalLesson(target);
        await expect(ctx.lessonService.attachProgram(ctx.teacher.id, ctx.lesson.id, ctx.program.id))
            .rejects.toBeInstanceOf(ConflictError);
    });

    test(`detachProgram on a ${target} Lesson throws ConflictError`, async () => {
        const { ConflictError } = await import('@basics/core/server/auth');
        const ctx = await seedTerminalLesson(target);
        await expect(ctx.lessonService.detachProgram(ctx.teacher.id, ctx.lesson.id, ctx.program.id))
            .rejects.toBeInstanceOf(ConflictError);
    });
}

test('attachProgram on a completed Lesson does not copy exercise rows in', async () => {
    const ctx = await seedTerminalLesson('completed');
    const before = await ctx.lessonService.listExercises(ctx.teacher.id, ctx.lesson.id);
    await expect(ctx.lessonService.attachProgram(ctx.teacher.id, ctx.lesson.id, ctx.program.id))
        .rejects.toThrow();
    const after = await ctx.lessonService.listExercises(ctx.teacher.id, ctx.lesson.id);
    expect(after).toEqual(before);
});

test('the terminal lock does not apply to a planned Lesson', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ctx.ex1.id);
    await ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    await ctx.lessonService.detachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    await ctx.lessonService.removeExercise(ctx.teacher.id, lesson.id, ctx.ex1.id);
    const refs = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(refs.every((r) => r.exerciseId !== ctx.ex1.id)).toBe(true);
});

test('update still reschedules a completed Lesson (corrections stay open)', async () => {
    const ctx = await seedTerminalLesson('completed');
    const moved = await ctx.lessonService.update(ctx.teacher.id, ctx.lesson.id, {
        scheduledAt: '2026-06-02T11:00:00.000Z',
    });
    expect(moved.scheduledAt).toBe('2026-06-02T11:00:00.000Z');
    expect(moved.status).toBe('completed');
});

test('update still swaps the horse on a cancelled Lesson', async () => {
    const ctx = await seedTerminalLesson('cancelled');
    const horse = await ctx.horseService.create(ctx.student.id, { name: 'Bella' });
    const updated = await ctx.lessonService.update(ctx.teacher.id, ctx.lesson.id, {
        horseId: horse.id,
    });
    expect(updated.horseId).toBe(horse.id);
});

test('update still links and detachFromPlan still unlinks a completed Lesson', async () => {
    const ctx = await seedTerminalLesson('completed');
    const plan = await ctx.planService.create(ctx.student.id, { title: 'Sommar' });
    const linked = await ctx.lessonService.update(ctx.teacher.id, ctx.lesson.id, {
        planId: plan.id,
    });
    expect(linked.planId).toBe(plan.id);

    const detached = await ctx.lessonService.detachFromPlan(ctx.teacher.id, ctx.lesson.id);
    expect(detached.planId).toBeNull();
});

test('Notes stay open on a completed Lesson (the core feedback loop)', async () => {
    const ctx = await seedTerminalLesson('completed');
    const note = await ctx.noteService.create(ctx.teacher.id, {
        parentKind: 'lesson', parentId: ctx.lesson.id,
        body: 'Bra ridning!', visibility: 'shared',
    });
    expect(note.id).toBeString();
    const notes = await ctx.noteService.listFor(ctx.student.id, {
        parentKind: 'lesson', parentId: ctx.lesson.id,
    });
    expect(notes.map((n) => n.body)).toEqual(['Bra ridning!']);
});

// --- archived Exercises / Programs as attach targets (soft-delete) ---

test('addExercise rejects an archived Exercise', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex1.id);
    await expect(ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ctx.ex1.id))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('attachProgram rejects an archived Program', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.programService.archive(ctx.teacher.id, ctx.program.id);
    await expect(ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, ctx.program.id))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('create rejects an archived Program as the snapshot source', async () => {
    const { NotFoundError } = await import('@basics/core/server/auth');
    const ctx = await seedConnectedWithProgram();
    await ctx.programService.archive(ctx.teacher.id, ctx.program.id);
    await expect(ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('archiving an Exercise keeps existing lesson_exercise rows resolving', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    await ctx.lessonService.addExercise(ctx.teacher.id, lesson.id, ctx.ex1.id);
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex1.id);

    // exercisesByLesson inner-joins `exercises` by id, not by archived state.
    const refs = await ctx.lessonService.listExercises(ctx.teacher.id, lesson.id);
    expect(refs.map((r) => r.exerciseId)).toEqual([ctx.ex1.id]);
    expect(refs[0]!.name).toBe('Skritt');
    expect((await ctx.lessonService.getForUser(ctx.teacher.id, lesson.id)).exercises)
        .toHaveLength(1);
});

test('exerciseHistory still resolves sourceProgramTitle for an archived Program', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    await ctx.programService.archive(ctx.teacher.id, ctx.program.id);

    const history = await ctx.lessonService.exerciseHistory(
        ctx.teacher.id, ctx.student.id, ctx.ex1.id,
    );
    expect(history).toHaveLength(1);
    expect(history[0]!.sourceProgramId).toBe(ctx.program.id);
    // Preserving this label is the entire point of archiving instead of deleting.
    expect(history[0]!.sourceProgramTitle).toBe('Uppvärmning');
});

// --- archived Exercises must not re-enter via a Program snapshot ---
// `addExercise` refuses an archived Exercise directly; the Program copy paths
// must agree, or archiving would be trivially bypassable.

test('create with programId skips Exercises archived since the Program was built', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex2.id);
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    expect(lesson.exercises.map((e) => e.name)).toEqual(['Skritt', 'Galopp']);
});

test('attachProgram skips archived Exercises', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex1.id);
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    const after = await ctx.lessonService.attachProgram(ctx.teacher.id, lesson.id, ctx.program.id);
    expect(after.exercises.map((e) => e.name)).toEqual(['Trav', 'Galopp']);
});

test('archiving an Exercise does not remove it from Lessons that already used it', async () => {
    const ctx = await seedConnectedWithProgram();
    const lesson = await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    await ctx.exerciseService.archive(ctx.teacher.id, ctx.ex2.id);
    const reloaded = await ctx.lessonService.getForUser(ctx.teacher.id, lesson.id);
    expect(reloaded.exercises.map((e) => e.name)).toEqual(['Skritt', 'Trav', 'Galopp']);
});
