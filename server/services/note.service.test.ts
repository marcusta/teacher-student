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
