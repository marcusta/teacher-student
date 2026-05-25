import { test, expect } from 'bun:test';
import { NotFoundError } from '@basics/core/server/auth';
import { createTestDb } from '../testing/db';

async function seedLesson() {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: 'teacher@example.com', password: 'secret123', displayName: 'T',
    });
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    const inv = await ctx.invitationService.createInvitation(teacher.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    const lesson = await ctx.lessonService.create(teacher.id, {
        studentId: student.id, scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    return { ...ctx, teacher, student, lesson };
}

test('create persists a shared note authored by the teacher', async () => {
    const { noteService, teacher, lesson } = await seedLesson();
    const note = await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'Hej', visibility: 'shared',
    });
    expect(note.id).toBeString();
    expect(note.authorId).toBe(teacher.id);
    expect(note.authorDisplayName).toBe('T');
    expect(note.body).toBe('Hej');
    expect(note.visibility).toBe('shared');
});

test('create trims body and rejects empty', async () => {
    const { noteService, teacher, lesson } = await seedLesson();
    const n = await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: '   trimmed   ', visibility: 'private',
    });
    expect(n.body).toBe('trimmed');
    await expect(noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: '   ', visibility: 'private',
    })).rejects.toThrow();
});

test('create on a stranger lesson throws NotFoundError', async () => {
    const { noteService, userService, lesson } = await seedLesson();
    const stranger = await userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(noteService.create(stranger.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'nope', visibility: 'shared',
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('student can author a note on a lesson they participate in (018)', async () => {
    const { noteService, student, teacher, lesson } = await seedLesson();
    const n = await noteService.create(student.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'mina tankar', visibility: 'private',
    });
    expect(n.authorId).toBe(student.id);
    expect(n.authorDisplayName).toBe('S');

    // Visible to the student (own private), hidden from the teacher.
    const teacherView = await noteService.listFor(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
    });
    expect(teacherView.map((x) => x.body)).toEqual([]);
});

test('student create on a lesson they are not in throws NotFoundError (018)', async () => {
    const { noteService, userService, lesson } = await seedLesson();
    const outsider = await userService.register({
        email: 'outsider@example.com', password: 'secret123', displayName: 'O',
    });
    await expect(noteService.create(outsider.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'nope', visibility: 'shared',
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('listFor returns shared notes to both sides and hides private from others', async () => {
    const { noteService, teacher, student, lesson } = await seedLesson();
    await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'prep notes', visibility: 'private',
    });
    await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'we did this', visibility: 'shared',
    });

    const teacherView = await noteService.listFor(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
    });
    expect(teacherView.map((n) => n.body)).toEqual(['prep notes', 'we did this']);

    const studentView = await noteService.listFor(student.id, {
        parentKind: 'lesson', parentId: lesson.id,
    });
    expect(studentView.map((n) => n.body)).toEqual(['we did this']);
});

test('listFor by an outsider throws NotFoundError', async () => {
    const { noteService, userService, lesson } = await seedLesson();
    const stranger = await userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(noteService.listFor(stranger.id, {
        parentKind: 'lesson', parentId: lesson.id,
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('update by author edits body and visibility', async () => {
    const { noteService, teacher, lesson } = await seedLesson();
    const n = await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'v1', visibility: 'private',
    });
    const updated = await noteService.update(teacher.id, n.id, {
        body: 'v2', visibility: 'shared',
    });
    expect(updated.body).toBe('v2');
    expect(updated.visibility).toBe('shared');
});

test('update by a non-author throws NotFoundError', async () => {
    const { noteService, teacher, student, lesson } = await seedLesson();
    const n = await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'mine', visibility: 'shared',
    });
    await expect(noteService.update(student.id, n.id, { body: 'hacked' }))
        .rejects.toBeInstanceOf(NotFoundError);
});

test('delete by author removes the note; non-author throws NotFoundError', async () => {
    const { noteService, teacher, student, lesson } = await seedLesson();
    const n = await noteService.create(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
        body: 'gone', visibility: 'shared',
    });
    await expect(noteService.delete(student.id, n.id)).rejects.toBeInstanceOf(NotFoundError);
    await noteService.delete(teacher.id, n.id);
    const after = await noteService.listFor(teacher.id, {
        parentKind: 'lesson', parentId: lesson.id,
    });
    expect(after.length).toBe(0);
    // Idempotent on already-gone.
    await noteService.delete(teacher.id, n.id);
});

// --- 021: Notes on Training Sessions ---

async function seedTrainingSession() {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    const ts = await ctx.trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
    });
    return { ...ctx, student, ts };
}

test('student creates a note on own Training Session', async () => {
    const { noteService, student, ts } = await seedTrainingSession();
    const n = await noteService.create(student.id, {
        parentKind: 'training_session', parentId: ts.id,
        body: 'Reflektion', visibility: 'shared',
    });
    expect(n.authorId).toBe(student.id);
    expect(n.parentKind).toBe('training_session');
    expect(n.parentId).toBe(ts.id);
});

test('stranger cannot create a note on someone elses Training Session', async () => {
    const { noteService, userService, ts } = await seedTrainingSession();
    const stranger = await userService.register({
        email: 'x@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(noteService.create(stranger.id, {
        parentKind: 'training_session', parentId: ts.id,
        body: 'no', visibility: 'shared',
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('listFor as the author shows private + shared notes on own Training Session', async () => {
    const { noteService, student, ts } = await seedTrainingSession();
    await noteService.create(student.id, {
        parentKind: 'training_session', parentId: ts.id,
        body: 'priv', visibility: 'private',
    });
    await noteService.create(student.id, {
        parentKind: 'training_session', parentId: ts.id,
        body: 'shared', visibility: 'shared',
    });
    const list = await noteService.listFor(student.id, {
        parentKind: 'training_session', parentId: ts.id,
    });
    expect(list.length).toBe(2);
});

test('listFor by stranger throws NotFoundError on a Training Session', async () => {
    const { noteService, userService, ts } = await seedTrainingSession();
    const stranger = await userService.register({
        email: 'x@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(noteService.listFor(stranger.id, {
        parentKind: 'training_session', parentId: ts.id,
    })).rejects.toBeInstanceOf(NotFoundError);
});

// --- 022: Teacher Notes on Training Sessions ---

async function seedSharedTS() {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    const teacher = await ctx.userService.register({
        email: 'teacher@example.com', password: 'secret123', displayName: 'T',
    });
    const inv = await ctx.invitationService.createInvitation(teacher.id, 'student@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    const sharedTs = await ctx.trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        shareWithTeacherIds: [teacher.id],
    });
    const privateTs = await ctx.trainingSessionService.create(student.id, {
        performedAt: '2026-06-02T10:00:00.000Z',
    });
    return { ...ctx, student, teacher, sharedTs, privateTs };
}

test('teacher can author a note on a Training Session shared with them', async () => {
    const { noteService, teacher, sharedTs } = await seedSharedTS();
    const n = await noteService.create(teacher.id, {
        parentKind: 'training_session', parentId: sharedTs.id,
        body: 'Bra jobbat!', visibility: 'shared',
    });
    expect(n.authorId).toBe(teacher.id);
});

test('teacher cannot author a note on a private (unshared) Training Session', async () => {
    const { noteService, teacher, privateTs } = await seedSharedTS();
    await expect(noteService.create(teacher.id, {
        parentKind: 'training_session', parentId: privateTs.id,
        body: 'nope', visibility: 'shared',
    })).rejects.toBeInstanceOf(NotFoundError);
});

test('teacher listFor on a shared TS returns the students shared notes + teachers own private', async () => {
    const { noteService, teacher, student, sharedTs } = await seedSharedTS();
    await noteService.create(student.id, {
        parentKind: 'training_session', parentId: sharedTs.id,
        body: 'student priv', visibility: 'private',
    });
    await noteService.create(student.id, {
        parentKind: 'training_session', parentId: sharedTs.id,
        body: 'student shared', visibility: 'shared',
    });
    await noteService.create(teacher.id, {
        parentKind: 'training_session', parentId: sharedTs.id,
        body: 'teacher prep', visibility: 'private',
    });
    const list = await noteService.listFor(teacher.id, {
        parentKind: 'training_session', parentId: sharedTs.id,
    });
    const bodies = list.map((n) => n.body).sort();
    expect(bodies).toEqual(['student shared', 'teacher prep']);
});

test('teacher listFor on a private TS throws NotFoundError', async () => {
    const { noteService, teacher, privateTs } = await seedSharedTS();
    await expect(noteService.listFor(teacher.id, {
        parentKind: 'training_session', parentId: privateTs.id,
    })).rejects.toBeInstanceOf(NotFoundError);
});
