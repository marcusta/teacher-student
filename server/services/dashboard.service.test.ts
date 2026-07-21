import { test, expect } from 'bun:test';
import { createTestDb, type TestContext } from '../testing/db';
import type { NoteParentKind, NoteVisibility } from '../db/schema';

// --- Clock ---
//
// Every window boundary in this service (nextLesson's `>= now`,
// awaitingFeedback's 90-day floor, goalsNearingTarget's 30-day horizon) is
// driven by the injected `now`. No test here reads the real clock: a suite
// that does cannot assert a boundary, and starts failing on the day the
// fixture drifts past it.
const NOW = new Date('2026-07-20T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO timestamp `days` from NOW (fractional days allowed). */
function at(days: number): string {
    return new Date(NOW.getTime() + days * DAY_MS).toISOString();
}

/** `YYYY-MM-DD` calendar date `days` from NOW. */
function day(days: number): string {
    return at(days).slice(0, 10);
}

// --- Fixture helpers ---

async function user(ctx: TestContext, email: string, displayName: string) {
    return ctx.userService.register({ email, password: 'secret123', displayName });
}

/** Establish a `relations` row via the real invitation flow. */
async function connect(
    ctx: TestContext,
    teacherId: string,
    student: { id: string },
    studentEmail: string,
) {
    const inv = await ctx.invitationService.createInvitation(teacherId, studentEmail);
    await ctx.invitationService.acceptInvitation(inv.id, student.id, studentEmail);
}

/**
 * Insert a Note directly. Deliberately bypasses `NoteService.create`:
 * these tests need exact `created_at` values to assert ordering, and two of
 * them need parent kinds (`student`, `exercise_question`) that
 * `assertCanAuthor` refuses — which is precisely the case the dashboard must
 * still never surface.
 */
async function insertNote(ctx: TestContext, o: {
    authorId: string;
    parentKind: NoteParentKind;
    parentId: string;
    body?: string;
    visibility?: NoteVisibility;
    createdAt?: string;
    /** Pin the id when the test asserts the `created_at` tiebreak, which is `id DESC`. */
    id?: string;
}): Promise<string> {
    const id = o.id ?? crypto.randomUUID();
    const ts = o.createdAt ?? at(-1);
    await ctx.db.insertInto('notes').values({
        id,
        author_id: o.authorId,
        parent_kind: o.parentKind,
        parent_id: o.parentId,
        body: o.body ?? 'note body',
        visibility: o.visibility ?? 'shared',
        created_at: ts,
        updated_at: ts,
    }).execute();
    return id;
}

/** A teacher T connected to a student S, plus a wholly unrelated pair. */
async function pair() {
    const ctx = await createTestDb();
    const teacher = await user(ctx, 'teacher@example.com', 'Teacher T');
    const student = await user(ctx, 'student@example.com', 'Student S');
    await connect(ctx, teacher.id, student, 'student@example.com');
    return { ctx, teacher, student };
}

// ---------------------------------------------------------------------------
// Zero-relation account and capabilities
// ---------------------------------------------------------------------------

test('zero-relation account gets a valid, complete, empty payload', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);

    expect(view.capabilities).toEqual({ teaches: false, rides: false });
    expect(view.nextLesson).toBeNull();
    expect(view.latestFeedback).toBeNull();
    expect(view.awaitingFeedback).toEqual([]);
    expect(view.activePlans).toEqual([]);
    expect(view.goalsNearingTarget).toEqual([]);
    expect(view.pendingInvitations).toBe(0);
    expect(view.generatedAt).toBe(NOW.toISOString());
});

test('ownership is not gated on Relations — a Goal and a Plan appear with no Teacher anywhere', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');

    const goal = await ctx.goalService.create(me.id, { title: 'Galopp', targetDate: day(10) });
    const plan = await ctx.planService.create(me.id, { title: 'Sommarplan' });

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);

    expect(view.capabilities).toEqual({ teaches: false, rides: false });
    expect(view.goalsNearingTarget.map((g) => g.id)).toEqual([goal.id]);
    expect(view.activePlans.map((p) => p.id)).toEqual([plan.id]);
});

test('capabilities.teaches flips only on a relations row with teacher_id = me', async () => {
    const { ctx, teacher } = await pair();
    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.capabilities).toEqual({ teaches: true, rides: false });
});

test('capabilities.rides flips only on a relations row with student_id = me', async () => {
    const { ctx, student } = await pair();
    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.capabilities).toEqual({ teaches: false, rides: true });
});

test('a user on both sides of the graph gets both capabilities', async () => {
    const { ctx, teacher, student } = await pair();
    // The teacher also rides for someone else.
    const coach = await user(ctx, 'coach@example.com', 'Coach C');
    await connect(ctx, coach.id, teacher, 'teacher@example.com');

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.capabilities).toEqual({ teaches: true, rides: true });
    void student;
});

// ---------------------------------------------------------------------------
// nextLesson
// ---------------------------------------------------------------------------

test('nextLesson returns the soonest planned Lesson on either side of the caller', async () => {
    const { ctx, teacher, student } = await pair();
    const later = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(5),
    });
    const soonest = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(2),
    });

    const asTeacher = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(asTeacher.nextLesson?.id).toBe(soonest.id);
    expect(asTeacher.nextLesson?.role).toBe('teacher');
    expect(asTeacher.nextLesson?.counterpartyDisplayName).toBe('Student S');

    const asStudent = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(asStudent.nextLesson?.id).toBe(soonest.id);
    expect(asStudent.nextLesson?.role).toBe('student');
    expect(asStudent.nextLesson?.counterpartyDisplayName).toBe('Teacher T');
    void later;
});

test('nextLesson never shows a Lesson between two other users, even a sooner one', async () => {
    const { ctx, teacher, student } = await pair();
    const otherTeacher = await user(ctx, 'ot@example.com', 'Other T');
    const otherStudent = await user(ctx, 'os@example.com', 'Other S');
    await connect(ctx, otherTeacher.id, otherStudent, 'os@example.com');

    // Strictly sooner than the caller's own — a post-filter would have let it
    // win the ORDER BY and then returned nothing at all.
    await ctx.lessonService.create(otherTeacher.id, {
        studentId: otherStudent.id, scheduledAt: at(1),
    });
    const mine = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(3),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.nextLesson?.id).toBe(mine.id);
});

test('nextLesson excludes cancelled and completed Lessons even when they are sooner', async () => {
    const { ctx, teacher, student } = await pair();
    const cancelled = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(1),
    });
    await ctx.lessonService.transition(teacher.id, cancelled.id, 'cancelled');
    const completed = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(2),
    });
    await ctx.lessonService.transition(teacher.id, completed.id, 'completed');
    const planned = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(3),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.nextLesson?.id).toBe(planned.id);
});

test('nextLesson is forward-looking: scheduled_at == now is in, one second earlier is out', async () => {
    const { ctx, teacher, student } = await pair();
    const exactlyNow = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: NOW.toISOString(),
    });
    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.nextLesson?.id).toBe(exactlyNow.id);

    const later = new Date(NOW.getTime() + 1000);
    const view2 = await ctx.dashboardService.get(student.id, 'student@example.com', later);
    expect(view2.nextLesson).toBeNull();
});

test('nextLesson.exercisePreview caps at 3 in sort_order with the true total in exerciseCount', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(1),
    });
    for (const name of ['A', 'B', 'C', 'D', 'E']) {
        const ex = await ctx.exerciseService.create(teacher.id, { name, description: '' });
        await ctx.lessonService.addExercise(teacher.id, lesson.id, ex.id);
    }

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.nextLesson?.exercisePreview).toEqual(['A', 'B', 'C']);
    expect(view.nextLesson?.exerciseCount).toBe(5);
});

test('nextLesson with no exercises yields [] and 0, never null', async () => {
    const { ctx, teacher, student } = await pair();
    await ctx.lessonService.create(teacher.id, { studentId: student.id, scheduledAt: at(1) });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.nextLesson?.exercisePreview).toEqual([]);
    expect(view.nextLesson?.exerciseCount).toBe(0);
});

test('nextLesson carries horse and plan when set', async () => {
    const { ctx, teacher, student } = await pair();
    const horse = await ctx.horseService.create(student.id, { name: 'Bamse' });
    const plan = await ctx.planService.create(student.id, { title: 'Vinterplan' });
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(1), planId: plan.id,
    });
    await ctx.lessonService.update(teacher.id, lesson.id, { horseId: horse.id });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.nextLesson?.horseName).toBe('Bamse');
    expect(view.nextLesson?.planId).toBe(plan.id);
    expect(view.nextLesson?.planTitle).toBe('Vinterplan');
});

// ---------------------------------------------------------------------------
// latestFeedback — positive resolution per parent kind
// ---------------------------------------------------------------------------

test('latestFeedback resolves a lesson Note to targetKind lesson with the counterparty label', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-2),
    });
    const noteId = await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson', parentId: lesson.id,
        body: 'Bra sits idag', createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback).toEqual({
        noteId,
        parentKind: 'lesson',
        parentId: lesson.id,
        targetKind: 'lesson',
        targetId: lesson.id,
        targetLabel: 'Teacher T',
        exerciseName: null,
        authorId: teacher.id,
        authorDisplayName: 'Teacher T',
        body: 'Bra sits idag',
        createdAt: at(-1),
    });
});

test('latestFeedback resolves a lesson_exercise Note to the owning Lesson and names the Exercise', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-2),
    });
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'Volt', description: '' });
    await ctx.lessonService.addExercise(teacher.id, lesson.id, ex.id);
    const [le] = await ctx.lessonService.listExercises(teacher.id, lesson.id);
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson_exercise', parentId: le.id, createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.parentKind).toBe('lesson_exercise');
    expect(view.latestFeedback?.parentId).toBe(le.id);
    expect(view.latestFeedback?.targetKind).toBe('lesson');
    expect(view.latestFeedback?.targetId).toBe(lesson.id);
    expect(view.latestFeedback?.targetLabel).toBe('Teacher T');
    expect(view.latestFeedback?.exerciseName).toBe('Volt');
});

test('latestFeedback resolves a training_session Note to the owning Student label', async () => {
    const { ctx, teacher, student } = await pair();
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-3), shareWithTeacherIds: [teacher.id],
    });
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'training_session', parentId: ts.id, createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.parentKind).toBe('training_session');
    expect(view.latestFeedback?.targetKind).toBe('training_session');
    expect(view.latestFeedback?.targetId).toBe(ts.id);
    expect(view.latestFeedback?.targetLabel).toBe('Student S');
    expect(view.latestFeedback?.exerciseName).toBeNull();
});

test('latestFeedback resolves a training_session_exercise Note to the Session and names the Exercise', async () => {
    const { ctx, teacher, student } = await pair();
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'Skänkelvikning', description: '' });
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-3), shareWithTeacherIds: [teacher.id],
    });
    await ctx.trainingSessionService.addExercise(student.id, ts.id, ex.id);
    const [tse] = await ctx.trainingSessionService.listExercises(student.id, ts.id);
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'training_session_exercise', parentId: tse.id,
        createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.parentKind).toBe('training_session_exercise');
    expect(view.latestFeedback?.parentId).toBe(tse.id);
    expect(view.latestFeedback?.targetKind).toBe('training_session');
    expect(view.latestFeedback?.targetId).toBe(ts.id);
    expect(view.latestFeedback?.targetLabel).toBe('Student S');
    expect(view.latestFeedback?.exerciseName).toBe('Skänkelvikning');
});

test('latestFeedback resolves a goal Note to the Goal title', async () => {
    const { ctx, teacher, student } = await pair();
    const goal = await ctx.goalService.create(student.id, { title: 'Bättre galopp' });
    await ctx.goalService.share(student.id, goal.id, teacher.id);
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'goal', parentId: goal.id, createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.parentKind).toBe('goal');
    expect(view.latestFeedback?.targetKind).toBe('goal');
    expect(view.latestFeedback?.targetId).toBe(goal.id);
    expect(view.latestFeedback?.targetLabel).toBe('Bättre galopp');
});

test('latestFeedback reaches a Teacher through goal_share and through training_session_share', async () => {
    const { ctx, teacher, student } = await pair();
    const goal = await ctx.goalService.create(student.id, { title: 'Mål' });
    await ctx.goalService.share(student.id, goal.id, teacher.id);
    await insertNote(ctx, {
        authorId: student.id, parentKind: 'goal', parentId: goal.id, createdAt: at(-2),
    });
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-4), shareWithTeacherIds: [teacher.id],
    });
    const newest = await insertNote(ctx, {
        authorId: student.id, parentKind: 'training_session', parentId: ts.id, createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.latestFeedback?.noteId).toBe(newest);
});

test('latestFeedback picks the genuinely newest across different parent kinds', async () => {
    const { ctx, teacher, student } = await pair();
    const goal = await ctx.goalService.create(student.id, { title: 'Mål' });
    await ctx.goalService.share(student.id, goal.id, teacher.id);
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-5),
    });
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'Volt', description: '' });
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-6), shareWithTeacherIds: [teacher.id],
    });
    await ctx.trainingSessionService.addExercise(student.id, ts.id, ex.id);
    const [tse] = await ctx.trainingSessionService.listExercises(student.id, ts.id);

    // Seconds apart, deliberately: this test is about the PRIMARY sort key, so
    // the fixture keeps `created_at` distinct. The tie case is pinned
    // separately, by the `created_at` tiebreak test below.
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'goal', parentId: goal.id,
        createdAt: '2026-07-19T12:00:00.000Z',
    });
    const winner = await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson', parentId: lesson.id,
        createdAt: '2026-07-19T12:00:02.000Z',
    });
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'training_session_exercise', parentId: tse.id,
        createdAt: '2026-07-19T12:00:01.000Z',
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.noteId).toBe(winner);
    expect(view.latestFeedback?.parentKind).toBe('lesson');
});

/**
 * Two qualifying Notes on DIFFERENT parent kinds at a byte-identical
 * `created_at`, with pinned ids so the tiebreak is the only thing that can
 * decide.
 *
 * Ties are routine, not exotic: `NoteService.create` stamps
 * `new Date().toISOString()`, so `created_at` has millisecond granularity and
 * a burst of notes shares one value. Before `id DESC` was added the winner was
 * decided incidentally — by UNION ALL branch order plus a stable sort — which
 * made `lesson` outrank `goal` with nothing documenting or asserting it, and
 * would have flipped silently the day the deferred covering index changed the
 * query plan.
 *
 * Asserted in BOTH directions on purpose. One direction alone is satisfied by
 * branch order; only the pair proves the tiebreak is doing the work.
 */
async function tieFixture(lessonNoteId: string, goalNoteId: string) {
    const { ctx, teacher, student } = await pair();
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-5),
    });
    const goal = await ctx.goalService.create(student.id, { title: 'Mål' });
    await ctx.goalService.share(student.id, goal.id, teacher.id);

    const TIE = '2026-07-19T12:00:00.000Z';
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson', parentId: lesson.id,
        createdAt: TIE, id: lessonNoteId,
    });
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'goal', parentId: goal.id,
        createdAt: TIE, id: goalNoteId,
    });

    return ctx.dashboardService.get(student.id, 'student@example.com', NOW);
}

test('latestFeedback breaks a created_at tie on note id DESC, not on UNION ALL branch order', async () => {
    // Goal note has the higher id. It must win despite `lesson` being branch 1 —
    // this is the direction branch order would get wrong.
    const goalWins = await tieFixture('00000000-aaaa-4000-8000-000000000000',
        'ffffffff-bbbb-4000-8000-000000000000');
    expect(goalWins.latestFeedback?.noteId).toBe('ffffffff-bbbb-4000-8000-000000000000');
    expect(goalWins.latestFeedback?.parentKind).toBe('goal');

    // Reverse the ids and the winner reverses with them.
    const lessonWins = await tieFixture('ffffffff-aaaa-4000-8000-000000000000',
        '00000000-bbbb-4000-8000-000000000000');
    expect(lessonWins.latestFeedback?.noteId).toBe('ffffffff-aaaa-4000-8000-000000000000');
    expect(lessonWins.latestFeedback?.parentKind).toBe('lesson');
});

/**
 * The tie above is resolved by the OUTER sort — one candidate per branch, so
 * each branch's own `LIMIT 1` never has to choose. This one ties two Notes
 * WITHIN a single branch, which is the only fixture that exercises the
 * per-branch `ORDER BY … , n.id DESC`. Verified: without this test, dropping
 * the per-branch tiebreak while keeping the outer one passes the whole suite.
 *
 * Run in both insertion orders, because an untiebroken sort would otherwise be
 * decided by whichever row SQLite happened to visit first.
 */
test('latestFeedback breaks a within-branch created_at tie on note id DESC', async () => {
    const TIE = '2026-07-19T12:00:00.000Z';
    const LOW = '00000000-cccc-4000-8000-000000000000';
    const HIGH = 'ffffffff-cccc-4000-8000-000000000000';

    for (const order of [[LOW, HIGH], [HIGH, LOW]]) {
        const { ctx, teacher, student } = await pair();
        const lesson = await ctx.lessonService.create(teacher.id, {
            studentId: student.id, scheduledAt: at(-5),
        });
        for (const id of order) {
            await insertNote(ctx, {
                authorId: teacher.id, parentKind: 'lesson', parentId: lesson.id,
                createdAt: TIE, id,
            });
        }

        const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
        expect(view.latestFeedback?.noteId).toBe(HIGH);
    }
});

test('latestFeedback is null, not a partial object, when readable parents carry no qualifying Note', async () => {
    const { ctx, teacher, student } = await pair();
    await ctx.lessonService.create(teacher.id, { studentId: student.id, scheduledAt: at(-2) });
    await ctx.goalService.create(student.id, { title: 'Mål' });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
});

// ---------------------------------------------------------------------------
// latestFeedback — leak safety, one per parent kind
// ---------------------------------------------------------------------------

/** A wholly separate teacher/student pair the caller has no edge to. */
async function outsiders(ctx: TestContext) {
    const otherTeacher = await user(ctx, 'ot@example.com', 'Other T');
    const otherStudent = await user(ctx, 'os@example.com', 'Other S');
    await connect(ctx, otherTeacher.id, otherStudent, 'os@example.com');
    return { otherTeacher, otherStudent };
}

test('latestFeedback/lesson: a shared Note on a stranger Lesson never appears, even as the newest in the DB', async () => {
    const { ctx, teacher, student } = await pair();
    const { otherTeacher, otherStudent } = await outsiders(ctx);

    const mine = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-5),
    });
    const mineNote = await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson', parentId: mine.id, createdAt: at(-3),
    });
    const theirs = await ctx.lessonService.create(otherTeacher.id, {
        studentId: otherStudent.id, scheduledAt: at(-5),
    });
    await insertNote(ctx, {
        authorId: otherTeacher.id, parentKind: 'lesson', parentId: theirs.id,
        body: 'SECRET', createdAt: at(-0.1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.noteId).toBe(mineNote);
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('latestFeedback/lesson_exercise: a shared Note on a stranger Lesson junction row never appears', async () => {
    const { ctx, student } = await pair();
    const { otherTeacher, otherStudent } = await outsiders(ctx);

    const theirs = await ctx.lessonService.create(otherTeacher.id, {
        studentId: otherStudent.id, scheduledAt: at(-5),
    });
    const ex = await ctx.exerciseService.create(otherTeacher.id, { name: 'Volt', description: '' });
    await ctx.lessonService.addExercise(otherTeacher.id, theirs.id, ex.id);
    const [le] = await ctx.lessonService.listExercises(otherTeacher.id, theirs.id);
    await insertNote(ctx, {
        authorId: otherTeacher.id, parentKind: 'lesson_exercise', parentId: le.id,
        body: 'SECRET', createdAt: at(-0.1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
});

test('latestFeedback/training_session: Relation is not access — a connected Teacher without a share is excluded', async () => {
    const { ctx, teacher, student } = await pair();
    // Shared with nobody, despite the Relation.
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-3), shareWithTeacherIds: [],
    });
    await insertNote(ctx, {
        authorId: student.id, parentKind: 'training_session', parentId: ts.id,
        body: 'SECRET', createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('latestFeedback/training_session_exercise: Relation without a share is excluded on the junction row too', async () => {
    const { ctx, teacher, student } = await pair();
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'Volt', description: '' });
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-3), shareWithTeacherIds: [],
    });
    await ctx.trainingSessionService.addExercise(student.id, ts.id, ex.id);
    const [tse] = await ctx.trainingSessionService.listExercises(student.id, ts.id);
    await insertNote(ctx, {
        authorId: student.id, parentKind: 'training_session_exercise', parentId: tse.id,
        body: 'SECRET', createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('latestFeedback/goal: a connected Teacher without a goal_share row is excluded', async () => {
    const { ctx, teacher, student } = await pair();
    const goal = await ctx.goalService.create(student.id, { title: 'SECRET' });
    await insertNote(ctx, {
        authorId: student.id, parentKind: 'goal', parentId: goal.id,
        body: 'SECRET', createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('latestFeedback excludes the caller own Notes even when they are the newest', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-5),
    });
    const fromTeacher = await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson', parentId: lesson.id, createdAt: at(-3),
    });
    await insertNote(ctx, {
        authorId: student.id, parentKind: 'lesson', parentId: lesson.id,
        body: 'MINE', createdAt: at(-0.1),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback?.noteId).toBe(fromTeacher);
});

test('latestFeedback excludes private Notes by another author, on every parent kind', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-5),
    });
    const ex = await ctx.exerciseService.create(teacher.id, { name: 'Volt', description: '' });
    await ctx.lessonService.addExercise(teacher.id, lesson.id, ex.id);
    const [le] = await ctx.lessonService.listExercises(teacher.id, lesson.id);
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-6), shareWithTeacherIds: [teacher.id],
    });
    await ctx.trainingSessionService.addExercise(student.id, ts.id, ex.id);
    const [tse] = await ctx.trainingSessionService.listExercises(student.id, ts.id);
    const goal = await ctx.goalService.create(student.id, { title: 'Mål' });
    await ctx.goalService.share(student.id, goal.id, teacher.id);

    const parents: [NoteParentKind, string][] = [
        ['lesson', lesson.id],
        ['lesson_exercise', le.id],
        ['training_session', ts.id],
        ['training_session_exercise', tse.id],
        ['goal', goal.id],
    ];
    for (const [parentKind, parentId] of parents) {
        await insertNote(ctx, {
            authorId: teacher.id, parentKind, parentId,
            visibility: 'private', body: 'SECRET', createdAt: at(-0.1),
        });
    }

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('latestFeedback never selects a hand-inserted parent_kind=student or exercise_question shared Note', async () => {
    const { ctx, teacher, student } = await pair();
    // `NoteService.assertCanRead` throws 'Unsupported parent kind' for both, so
    // no branch of the dashboard query may reach them either. Inserted with the
    // caller's own id as parent_id — the most tempting shape to leak.
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'student', parentId: student.id,
        body: 'SECRET', createdAt: at(-0.1),
    });
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'exercise_question', parentId: student.id,
        body: 'SECRET', createdAt: at(-0.2),
    });

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.latestFeedback).toBeNull();
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

// ---------------------------------------------------------------------------
// awaitingFeedback
// ---------------------------------------------------------------------------

/** Create a Lesson already transitioned to `completed`. */
async function completedLesson(
    ctx: TestContext,
    teacherId: string,
    studentId: string,
    scheduledAt: string,
) {
    const lesson = await ctx.lessonService.create(teacherId, { studentId, scheduledAt });
    await ctx.lessonService.transition(teacherId, lesson.id, 'completed');
    return lesson;
}

test('awaitingFeedback lists past completed Lessons the caller taught with no Note by them', async () => {
    const { ctx, teacher, student } = await pair();
    const horse = await ctx.horseService.create(student.id, { name: 'Bamse' });
    const lesson = await completedLesson(ctx, teacher.id, student.id, at(-2));
    await ctx.lessonService.update(teacher.id, lesson.id, { horseId: horse.id });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback).toEqual([{
        kind: 'lesson',
        id: lesson.id,
        occurredAt: at(-2),
        studentDisplayName: 'Student S',
        horseName: 'Bamse',
    }]);
});

test('awaitingFeedback is the teaching side only — a completed Lesson the caller rode never appears', async () => {
    const { ctx, teacher, student } = await pair();
    await completedLesson(ctx, teacher.id, student.id, at(-2));

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.awaitingFeedback).toEqual([]);
});

test('awaitingFeedback never lists another teacher completed Lesson', async () => {
    const { ctx, teacher } = await pair();
    const { otherTeacher, otherStudent } = await outsiders(ctx);
    await completedLesson(ctx, otherTeacher.id, otherStudent.id, at(-2));

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback).toEqual([]);
});

test('awaitingFeedback excludes a Lesson on which the caller wrote a PRIVATE Note', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await completedLesson(ctx, teacher.id, student.id, at(-2));
    await insertNote(ctx, {
        authorId: teacher.id, parentKind: 'lesson', parentId: lesson.id,
        visibility: 'private', createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback).toEqual([]);
});

test('awaitingFeedback still includes a Lesson on which only the OTHER party wrote a Note', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await completedLesson(ctx, teacher.id, student.id, at(-2));
    await insertNote(ctx, {
        authorId: student.id, parentKind: 'lesson', parentId: lesson.id, createdAt: at(-1),
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id)).toEqual([lesson.id]);
});

test('awaitingFeedback excludes planned and cancelled Lessons — only completed', async () => {
    const { ctx, teacher, student } = await pair();
    // A planned Lesson whose time has passed has not been confirmed to have happened.
    await ctx.lessonService.create(teacher.id, { studentId: student.id, scheduledAt: at(-2) });
    const cancelled = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: at(-3),
    });
    await ctx.lessonService.transition(teacher.id, cancelled.id, 'cancelled');
    const done = await completedLesson(ctx, teacher.id, student.id, at(-4));

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id)).toEqual([done.id]);
});

test('awaitingFeedback excludes a completed Lesson scheduled in the future', async () => {
    const { ctx, teacher, student } = await pair();
    await completedLesson(ctx, teacher.id, student.id, at(3));

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback).toEqual([]);
});

test('awaitingFeedback includes a shared Training Session and excludes one performed in the future', async () => {
    const { ctx, teacher, student } = await pair();
    const past = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-2), shareWithTeacherIds: [teacher.id],
    });
    await ctx.trainingSessionService.create(student.id, {
        performedAt: at(2), shareWithTeacherIds: [teacher.id],
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id)).toEqual([past.id]);
    expect(view.awaitingFeedback[0].kind).toBe('training_session');
});

test('awaitingFeedback: a Training Session the Teacher was unshared from disappears', async () => {
    const { ctx, teacher, student } = await pair();
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-2), shareWithTeacherIds: [teacher.id],
    });
    expect((await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW))
        .awaitingFeedback.map((a) => a.id)).toEqual([ts.id]);

    await ctx.trainingSessionService.update(student.id, ts.id, { shareWithTeacherIds: [] });

    const after = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(after.awaitingFeedback).toEqual([]);
});

test('awaitingFeedback: an unshared Training Session never appears for a merely connected Teacher', async () => {
    const { ctx, teacher, student } = await pair();
    await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-2), shareWithTeacherIds: [], summary: 'SECRET',
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback).toEqual([]);
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('awaitingFeedback 90-day floor: day -89 is in, day -91 is out', async () => {
    const { ctx, teacher, student } = await pair();
    const inside = await completedLesson(ctx, teacher.id, student.id, at(-89));
    await completedLesson(ctx, teacher.id, student.id, at(-91));

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id)).toEqual([inside.id]);
});

/**
 * The floor is INCLUSIVE, on both branches.
 *
 * The -89/-91 test above straddles the boundary without landing on it, so it
 * passes just as happily against `> floorIso` — mutating both branches to the
 * exclusive form left the whole suite green. These land exactly on
 * `now - 90d`, which is the only fixture that can tell the two apart.
 */
test('awaitingFeedback floor is inclusive: exactly now-90d is IN, on both branches', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await completedLesson(ctx, teacher.id, student.id, at(-90));
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-90), shareWithTeacherIds: [teacher.id],
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id).sort()).toEqual([lesson.id, ts.id].sort());
});

/**
 * The upper bound is INCLUSIVE too, on both branches: an occasion timestamped
 * exactly `now` counts as having happened.
 *
 * The "future" tests use `at(3)` and never land on `now`, so mutating
 * `<= nowIso` to `< nowIso` also left the suite green.
 */
test('awaitingFeedback upper bound is inclusive: exactly now is IN, on both branches', async () => {
    const { ctx, teacher, student } = await pair();
    const lesson = await completedLesson(ctx, teacher.id, student.id, NOW.toISOString());
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: NOW.toISOString(), shareWithTeacherIds: [teacher.id],
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id).sort()).toEqual([lesson.id, ts.id].sort());
});

test('awaitingFeedback caps at 5, ordered occurredAt DESC, and carries no total count', async () => {
    const { ctx, teacher, student } = await pair();
    const created: { id: string; at: string }[] = [];
    for (let i = 1; i <= 7; i++) {
        const l = await completedLesson(ctx, teacher.id, student.id, at(-i));
        created.push({ id: l.id, at: at(-i) });
    }

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback).toHaveLength(5);
    // Newest first: days -1 .. -5.
    expect(view.awaitingFeedback.map((a) => a.id)).toEqual(created.slice(0, 5).map((c) => c.id));
    expect(view.awaitingFeedback.map((a) => a.occurredAt))
        .toEqual([...view.awaitingFeedback.map((a) => a.occurredAt)].sort().reverse());
    for (const item of view.awaitingFeedback) {
        expect(Object.keys(item).sort())
            .toEqual(['horseName', 'id', 'kind', 'occurredAt', 'studentDisplayName']);
    }
});

test('awaitingFeedback interleaves Lessons and Training Sessions by occurredAt', async () => {
    const { ctx, teacher, student } = await pair();
    const l1 = await completedLesson(ctx, teacher.id, student.id, at(-1));
    const ts2 = await ctx.trainingSessionService.create(student.id, {
        performedAt: at(-2), shareWithTeacherIds: [teacher.id],
    });
    const l3 = await completedLesson(ctx, teacher.id, student.id, at(-3));

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.awaitingFeedback.map((a) => a.id)).toEqual([l1.id, ts2.id, l3.id]);
    expect(view.awaitingFeedback.map((a) => a.kind))
        .toEqual(['lesson', 'training_session', 'lesson']);
});

// ---------------------------------------------------------------------------
// activePlans
// ---------------------------------------------------------------------------

test('activePlans never shows another Student Plan, even when the caller is their Primary Teacher', async () => {
    const { ctx, teacher, student } = await pair();
    await ctx.planService.create(student.id, {
        title: 'SECRET', primaryTeacherId: teacher.id,
    });

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.activePlans).toEqual([]);
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('activePlans excludes archived Plans, orders updatedAt DESC and caps at 3', async () => {
    const { ctx, teacher, student } = await pair();
    const made: string[] = [];
    for (const title of ['P1', 'P2', 'P3', 'P4']) {
        const p = await ctx.planService.create(student.id, { title });
        made.push(p.id);
    }
    const archived = await ctx.planService.create(student.id, { title: 'Archived' });
    await ctx.planService.archive(student.id, archived.id);

    // Deterministic recency — `create` can stamp several Plans in one millisecond.
    for (const [i, id] of made.entries()) {
        await ctx.db.updateTable('plans')
            .set({ updated_at: at(-10 + i) })
            .where('id', '=', id)
            .execute();
    }

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    expect(view.activePlans.map((p) => p.id)).toEqual([made[3], made[2], made[1]]);
});

test('activePlans carries the primary teacher display name and nullable dates', async () => {
    const { ctx, teacher, student } = await pair();
    await ctx.planService.create(student.id, { title: 'Med tränare', primaryTeacherId: teacher.id });
    const solo = await ctx.planService.create(student.id, { title: 'Utan tränare' });
    await ctx.db.updateTable('plans').set({ updated_at: at(-1) }).where('id', '=', solo.id).execute();

    const view = await ctx.dashboardService.get(student.id, 'student@example.com', NOW);
    const withTeacher = view.activePlans.find((p) => p.title === 'Med tränare');
    const without = view.activePlans.find((p) => p.title === 'Utan tränare');
    expect(withTeacher?.primaryTeacherDisplayName).toBe('Teacher T');
    expect(without?.primaryTeacherDisplayName).toBeNull();
    expect(without?.startDate).toBeNull();
    expect(without?.endDate).toBeNull();
});

// ---------------------------------------------------------------------------
// goalsNearingTarget
// ---------------------------------------------------------------------------

test('goalsNearingTarget never shows another Student Goal, even one shared with the caller', async () => {
    const { ctx, teacher, student } = await pair();
    const goal = await ctx.goalService.create(student.id, {
        title: 'SECRET', targetDate: day(5),
    });
    await ctx.goalService.share(student.id, goal.id, teacher.id);

    const view = await ctx.dashboardService.get(teacher.id, 'teacher@example.com', NOW);
    expect(view.goalsNearingTarget).toEqual([]);
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

test('goalsNearingTarget horizon: today+30 is in, today+31 is out', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const inside = await ctx.goalService.create(me.id, { title: 'D30', targetDate: day(30) });
    await ctx.goalService.create(me.id, { title: 'D31', targetDate: day(31) });

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);
    expect(view.goalsNearingTarget.map((g) => g.id)).toEqual([inside.id]);
});

/**
 * The horizon is computed in the SERVER's zone (UTC) while the reader is in
 * Sweden. Contract §3.6 accepts up to a day of drift at the boundary, on the
 * grounds that the horizon is SOFT — it means "soon" — and that `isOverdue`,
 * where drift would not be acceptable, stays on the client against the
 * browser's local calendar day.
 *
 * This test exists because "±1 day, accepted" and "unbounded, unnoticed" look
 * identical from a suite that never injects a `now` whose UTC day differs from
 * the Swedish day. It pins the exact sanctioned case rather than asserting the
 * drift away: at 23:00Z on 07-20 it is already 01:00 on 07-21 in Stockholm, so
 * the reader's local today+30 is 08-20 — and that goal is EXCLUDED, because
 * the server derives horizonDate = 08-19 from UTC.
 *
 * DO NOT "fix" this by changing the assertion. If the behaviour ever needs to
 * change, §3.6 is what changes first. What this test guarantees is that the
 * drift stays exactly one day and cannot quietly grow.
 */
test('goalsNearingTarget: the ±1 day timezone drift sanctioned by contract §3.6, pinned', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    // 01:00 on 2026-07-21 in Europe/Stockholm (UTC+2 in July).
    const lateUtc = new Date('2026-07-20T23:00:00.000Z');

    // Exactly the READER's local today + 30 days. Excluded — the drift.
    await ctx.goalService.create(me.id, { title: 'Reader D30', targetDate: '2026-08-20' });
    // Exactly the SERVER's horizon, one day earlier. Included.
    const serverHorizon = await ctx.goalService.create(me.id, {
        title: 'Server D30', targetDate: '2026-08-19',
    });

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', lateUtc);
    expect(view.goalsNearingTarget.map((g) => g.id)).toEqual([serverHorizon.id]);
});

test('goalsNearingTarget includes an overdue Goal and sorts it first', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const soon = await ctx.goalService.create(me.id, { title: 'Snart', targetDate: day(10) });
    const overdue = await ctx.goalService.create(me.id, { title: 'Försenat', targetDate: day(-400) });

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);
    expect(view.goalsNearingTarget.map((g) => g.id)).toEqual([overdue.id, soon.id]);
});

test('goalsNearingTarget excludes achieved, abandoned and target_date IS NULL', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const active = await ctx.goalService.create(me.id, { title: 'Aktiv', targetDate: day(1) });
    const achieved = await ctx.goalService.create(me.id, { title: 'Klar', targetDate: day(1) });
    await ctx.goalService.markAchieved(me.id, achieved.id);
    const abandoned = await ctx.goalService.create(me.id, { title: 'Slopat', targetDate: day(1) });
    await ctx.goalService.abandon(me.id, abandoned.id);
    await ctx.goalService.create(me.id, { title: 'Utan datum' });

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);
    expect(view.goalsNearingTarget.map((g) => g.id)).toEqual([active.id]);
});

test('goalsNearingTarget caps at 3 and carries no overdue field', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    for (const d of [1, 2, 3, 4, 5]) {
        await ctx.goalService.create(me.id, { title: `G${d}`, targetDate: day(d) });
    }

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);
    expect(view.goalsNearingTarget).toHaveLength(3);
    expect(view.goalsNearingTarget.map((g) => g.targetDate)).toEqual([day(1), day(2), day(3)]);
    for (const g of view.goalsNearingTarget) {
        expect(Object.keys(g).sort()).toEqual(['id', 'targetDate', 'title']);
    }
});

// ---------------------------------------------------------------------------
// pendingInvitations
// ---------------------------------------------------------------------------

test('pendingInvitations counts only pending rows addressed to the caller', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const t1 = await user(ctx, 't1@example.com', 'T1');
    const t2 = await user(ctx, 't2@example.com', 'T2');
    const t3 = await user(ctx, 't3@example.com', 'T3');
    const other = await user(ctx, 'other@example.com', 'Other');

    await ctx.invitationService.createInvitation(t1.id, 'me@example.com');
    const revoked = await ctx.invitationService.createInvitation(t2.id, 'me@example.com');
    await ctx.invitationService.revokeInvitation(revoked.id, t2.id);
    const declined = await ctx.invitationService.createInvitation(t3.id, 'me@example.com');
    await ctx.invitationService.declineInvitation(declined.id, me.id, 'me@example.com');
    await ctx.invitationService.createInvitation(t1.id, 'other@example.com');

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);
    expect(view.pendingInvitations).toBe(1);
    void other;
});

test('pendingInvitations equals InvitationService.listForUser().length — including a scruffy caller address', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const t1 = await user(ctx, 't1@example.com', 'T1');
    const t2 = await user(ctx, 't2@example.com', 'T2');
    await ctx.invitationService.createInvitation(t1.id, 'me@example.com');
    await ctx.invitationService.createInvitation(t2.id, 'me@example.com');

    // Two independent normalizations of an email is exactly the drift that
    // makes a badge lie. Assert byte-identical behaviour, not just the number.
    for (const address of ['me@example.com', '  ME@Example.COM  ', 'Me@Example.Com']) {
        const view = await ctx.dashboardService.get(me.id, address, NOW);
        const inbox = await ctx.invitationService.listForUser(address);
        expect(view.pendingInvitations).toBe(inbox.length);
        expect(view.pendingInvitations).toBe(2);
    }
});

test('pendingInvitations agrees with listForUser for an address stored with odd casing', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const t1 = await user(ctx, 't1@example.com', 'T1');
    // Bypass createInvitation's normalization to stress the read side.
    await ctx.db.insertInto('invitations').values({
        id: crypto.randomUUID(),
        teacher_id: t1.id,
        invitee_email: '  ME@Example.COM ',
        status: 'pending',
        created_at: at(-1),
        expires_at: at(10),
        accepted_at: null,
    }).execute();

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);
    const inbox = await ctx.invitationService.listForUser('me@example.com');
    expect(view.pendingInvitations).toBe(inbox.length);
});

test('pendingInvitations counts a pre-registration invitation matched by email', async () => {
    const ctx = await createTestDb();
    const teacher = await user(ctx, 't@example.com', 'T');
    // Addressed before the account existed.
    await ctx.invitationService.createInvitation(teacher.id, 'newcomer@example.com');
    const newcomer = await user(ctx, 'newcomer@example.com', 'N');

    const view = await ctx.dashboardService.get(newcomer.id, 'newcomer@example.com', NOW);
    expect(view.pendingInvitations).toBe(1);
    expect((await ctx.invitationService.listForUser('newcomer@example.com')).length).toBe(1);
});

// ---------------------------------------------------------------------------
// Whole-payload leak safety
// ---------------------------------------------------------------------------

test('a stranger rich account leaks nothing into the caller payload, field by field', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const otherTeacher = await user(ctx, 'ot@example.com', 'SECRET Teacher');
    const otherStudent = await user(ctx, 'os@example.com', 'SECRET Student');
    await connect(ctx, otherTeacher.id, otherStudent, 'os@example.com');

    const horse = await ctx.horseService.create(otherStudent.id, { name: 'SECRET Horse' });
    const plan = await ctx.planService.create(otherStudent.id, {
        title: 'SECRET Plan', primaryTeacherId: otherTeacher.id,
    });
    const goal = await ctx.goalService.create(otherStudent.id, {
        title: 'SECRET Goal', targetDate: day(1),
    });
    const lesson = await ctx.lessonService.create(otherTeacher.id, {
        studentId: otherStudent.id, scheduledAt: at(1), planId: plan.id,
    });
    await ctx.lessonService.update(otherTeacher.id, lesson.id, { horseId: horse.id });
    const done = await completedLesson(ctx, otherTeacher.id, otherStudent.id, at(-2));
    const ts = await ctx.trainingSessionService.create(otherStudent.id, {
        performedAt: at(-3), shareWithTeacherIds: [otherTeacher.id], summary: 'SECRET Session',
    });
    for (const [parentKind, parentId] of [
        ['lesson', done.id], ['training_session', ts.id], ['goal', goal.id],
    ] as [NoteParentKind, string][]) {
        await insertNote(ctx, {
            authorId: otherTeacher.id, parentKind, parentId,
            body: 'SECRET Note', createdAt: at(-0.1),
        });
    }
    await ctx.invitationService.createInvitation(otherTeacher.id, 'os@example.com');

    const view = await ctx.dashboardService.get(me.id, 'me@example.com', NOW);

    expect(view.capabilities).toEqual({ teaches: false, rides: false });
    expect(view.nextLesson).toBeNull();
    expect(view.latestFeedback).toBeNull();
    expect(view.awaitingFeedback).toEqual([]);
    expect(view.activePlans).toEqual([]);
    expect(view.goalsNearingTarget).toEqual([]);
    expect(view.pendingInvitations).toBe(0);
    expect(JSON.stringify(view)).not.toContain('SECRET');
});

// ---------------------------------------------------------------------------
// generatedAt
// ---------------------------------------------------------------------------

test('generatedAt is the injected assembly time, not the browser or wall clock', async () => {
    const ctx = await createTestDb();
    const me = await user(ctx, 'me@example.com', 'Me');
    const view = await ctx.dashboardService.get(me.id, 'me@example.com', new Date('2020-01-02T03:04:05.678Z'));
    expect(view.generatedAt).toBe('2020-01-02T03:04:05.678Z');
});
