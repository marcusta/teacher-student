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
    expect(lesson.programId).toBe(ctx.program.id);
    expect(lesson.programTitle).toBe('Uppvärmning');
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
    expect(lesson.programId).toBeNull();
    expect(lesson.programTitle).toBeNull();
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

test('listForTeacher surfaces programId and programTitle', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const list = await ctx.lessonService.listForTeacher(ctx.teacher.id);
    expect(list[0].programId).toBe(ctx.program.id);
    expect(list[0].programTitle).toBe('Uppvärmning');
});

test('listForUser on student side surfaces programId and programTitle', async () => {
    const ctx = await seedConnectedWithProgram();
    await ctx.lessonService.create(ctx.teacher.id, {
        studentId: ctx.student.id,
        scheduledAt: '2026-06-01T10:00:00.000Z',
        programId: ctx.program.id,
    });
    const list = await ctx.lessonService.listForUser(ctx.student.id);
    expect(list[0].programId).toBe(ctx.program.id);
    expect(list[0].programTitle).toBe('Uppvärmning');
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
