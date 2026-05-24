import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedAcceptedRelation(opts: {
    teacherEmail: string;
    teacherName: string;
    studentEmail: string;
    studentName: string;
}) {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: opts.teacherEmail, password: 'secret123', displayName: opts.teacherName,
    });
    const student = await ctx.userService.register({
        email: opts.studentEmail, password: 'secret123', displayName: opts.studentName,
    });
    const inv = await ctx.invitationService.createInvitation(teacher.id, opts.studentEmail);
    await ctx.invitationService.acceptInvitation(inv.id, student.id, opts.studentEmail);
    return { ...ctx, teacher, student };
}

test('listStudentsForTeacher returns students with accepted Relation, sorted by display_name', async () => {
    const ctx = await seedAcceptedRelation({
        teacherEmail: 't@example.com', teacherName: 'T',
        studentEmail: 'beta@example.com', studentName: 'Beta',
    });
    // Add a second student with name "Alfa" so we can verify sort.
    const alfa = await ctx.userService.register({
        email: 'alfa@example.com', password: 'secret123', displayName: 'Alfa',
    });
    const inv2 = await ctx.invitationService.createInvitation(ctx.teacher.id, 'alfa@example.com');
    await ctx.invitationService.acceptInvitation(inv2.id, alfa.id, 'alfa@example.com');

    const list = await ctx.relationService.listStudentsForTeacher(ctx.teacher.id);

    expect(list.map((s) => s.displayName)).toEqual(['Alfa', 'Beta']);
    expect(list[0]).toMatchObject({ id: alfa.id, email: 'alfa@example.com', displayName: 'Alfa' });
});

test('listStudentsForTeacher isolates between teachers', async () => {
    const ctx = await seedAcceptedRelation({
        teacherEmail: 't1@example.com', teacherName: 'T1',
        studentEmail: 's1@example.com', studentName: 'S1',
    });
    const otherTeacher = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    const otherStudent = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    const inv = await ctx.invitationService.createInvitation(otherTeacher.id, 's2@example.com');
    await ctx.invitationService.acceptInvitation(inv.id, otherStudent.id, 's2@example.com');

    const list = await ctx.relationService.listStudentsForTeacher(ctx.teacher.id);
    expect(list.map((s) => s.email)).toEqual(['s1@example.com']);
});

test('listStudentsForTeacher returns empty when no relations', async () => {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: 'lonely@example.com', password: 'secret123', displayName: 'L',
    });
    expect(await ctx.relationService.listStudentsForTeacher(teacher.id)).toEqual([]);
});

test('getStudentForTeacher returns student when Relation exists', async () => {
    const ctx = await seedAcceptedRelation({
        teacherEmail: 't@example.com', teacherName: 'T',
        studentEmail: 's@example.com', studentName: 'S',
    });
    const got = await ctx.relationService.getStudentForTeacher(ctx.teacher.id, ctx.student.id);
    expect(got).toMatchObject({ id: ctx.student.id, email: 's@example.com', displayName: 'S' });
});

test('getStudentForTeacher returns null when no Relation (other teacher\'s student)', async () => {
    const ctx = await seedAcceptedRelation({
        teacherEmail: 't1@example.com', teacherName: 'T1',
        studentEmail: 's1@example.com', studentName: 'S1',
    });
    const otherTeacher = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'T2',
    });
    expect(await ctx.relationService.getStudentForTeacher(otherTeacher.id, ctx.student.id)).toBeNull();
});
