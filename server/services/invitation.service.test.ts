import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import {
    DuplicatePendingInvitationError,
    InvitationNotPendingError,
    NotInviteeError,
    NotOwnerError,
} from './invitation.service';

async function seedTeacher() {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: 'teacher@example.com',
        password: 'secret123',
        displayName: 'T',
    });
    return { ...ctx, teacher };
}

async function seedTeacherAndStudent() {
    const ctx = await seedTeacher();
    const student = await ctx.userService.register({
        email: 'student@example.com',
        password: 'secret123',
        displayName: 'S',
    });
    return { ...ctx, student };
}

test('createInvitation persists pending row with expires_at ~30 days out', async () => {
    const { invitationService, teacher } = await seedTeacher();
    const before = Date.now();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    const after = Date.now();

    expect(inv.id).toBeString();
    expect(inv.teacherId).toBe(teacher.id);
    expect(inv.inviteeEmail).toBe('student@example.com');
    expect(inv.status).toBe('pending');

    const createdAt = Date.parse(inv.createdAt);
    const expiresAt = Date.parse(inv.expiresAt);
    expect(createdAt).toBeGreaterThanOrEqual(before - 1000);
    expect(createdAt).toBeLessThanOrEqual(after + 1000);
    const diffDays = (expiresAt - createdAt) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(29.9);
    expect(diffDays).toBeLessThan(30.1);
});

test('createInvitation lowercases and trims invitee email', async () => {
    const { invitationService, teacher } = await seedTeacher();
    const inv = await invitationService.createInvitation(teacher.id, '  Student@Example.COM  ');
    expect(inv.inviteeEmail).toBe('student@example.com');
});

test('createInvitation duplicate pending throws DuplicatePendingInvitationError', async () => {
    const { invitationService, teacher } = await seedTeacher();
    await invitationService.createInvitation(teacher.id, 'student@example.com');
    await expect(
        invitationService.createInvitation(teacher.id, 'STUDENT@example.com'),
    ).rejects.toBeInstanceOf(DuplicatePendingInvitationError);
});

test('createInvitation allowed again after previous was revoked', async () => {
    const { invitationService, teacher } = await seedTeacher();
    const first = await invitationService.createInvitation(teacher.id, 'student@example.com');
    await invitationService.revokeInvitation(first.id, teacher.id);

    const second = await invitationService.createInvitation(teacher.id, 'student@example.com');
    expect(second.status).toBe('pending');
    expect(second.id).not.toBe(first.id);
});

test('revokeInvitation on pending returns true and sets status to revoked', async () => {
    const { invitationService, teacher, db } = await seedTeacher();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    const changed = await invitationService.revokeInvitation(inv.id, teacher.id);
    expect(changed).toBe(true);
    const row = await db.selectFrom('invitations').selectAll().where('id', '=', inv.id).executeTakeFirstOrThrow();
    expect(row.status).toBe('revoked');
});

test('revokeInvitation on already-terminal invitation returns false (no-op)', async () => {
    const { invitationService, teacher } = await seedTeacher();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    await invitationService.revokeInvitation(inv.id, teacher.id);

    const changedSecondTime = await invitationService.revokeInvitation(inv.id, teacher.id);
    expect(changedSecondTime).toBe(false);
});

test('listByTeacher returns only this teacher\'s invitations, newest first', async () => {
    const { invitationService, userService, teacher } = await seedTeacher();
    const other = await userService.register({
        email: 'other@example.com',
        password: 'secret123',
        displayName: 'Other',
    });
    const a = await invitationService.createInvitation(teacher.id, 'a@example.com');
    await new Promise((r) => setTimeout(r, 5));
    const b = await invitationService.createInvitation(teacher.id, 'b@example.com');
    await invitationService.createInvitation(other.id, 'noise@example.com');

    const list = await invitationService.listByTeacher(teacher.id);
    expect(list.map((i) => i.id)).toEqual([b.id, a.id]);
});

test('revokeInvitation by non-owner throws NotOwnerError', async () => {
    const { invitationService, userService, teacher } = await seedTeacher();
    const other = await userService.register({
        email: 'other@example.com',
        password: 'secret123',
        displayName: 'Other',
    });
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    await expect(
        invitationService.revokeInvitation(inv.id, other.id),
    ).rejects.toBeInstanceOf(NotOwnerError);
});

// --- listForUser ---

test('listForUser returns pending invitations matching email case-insensitively', async () => {
    const { invitationService, teacher } = await seedTeacher();
    await invitationService.createInvitation(teacher.id, 'student@example.com');

    const list = await invitationService.listForUser('STUDENT@Example.COM');
    expect(list.length).toBe(1);
    expect(list[0].inviteeEmail).toBe('student@example.com');
    expect(list[0].status).toBe('pending');
});

test('listForUser includes inviting teacher display name and email', async () => {
    const { invitationService, userService } = await seedTeacher();
    const teacher2 = await userService.register({
        email: 'mary@example.com', password: 'secret123', displayName: 'Mary Equestrian',
    });
    await invitationService.createInvitation(teacher2.id, 'student@example.com');

    const list = await invitationService.listForUser('student@example.com');
    expect(list.length).toBe(1);
    expect(list[0].teacherDisplayName).toBe('Mary Equestrian');
    expect(list[0].teacherEmail).toBe('mary@example.com');
});

test('listForUser excludes non-pending and other emails', async () => {
    const { invitationService, userService, teacher } = await seedTeacher();
    const other = await userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'Other',
    });

    const a = await invitationService.createInvitation(teacher.id, 'student@example.com');
    await invitationService.revokeInvitation(a.id, teacher.id); // terminal
    await invitationService.createInvitation(other.id, 'someone-else@example.com'); // wrong email
    const c = await invitationService.createInvitation(teacher.id, 'student@example.com'); // pending

    const list = await invitationService.listForUser('student@example.com');
    expect(list.map((i) => i.id)).toEqual([c.id]);
});

// --- acceptInvitation ---

test('acceptInvitation transitions invitation to accepted and creates Relation', async () => {
    const { invitationService, teacher, student, db } = await seedTeacherAndStudent();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');

    const relation = await invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');

    expect(relation.id).toBeString();
    expect(relation.teacherId).toBe(teacher.id);
    expect(relation.studentId).toBe(student.id);
    expect(relation.invitationId).toBe(inv.id);
    expect(relation.createdAt).toBeString();

    const row = await db.selectFrom('invitations').selectAll().where('id', '=', inv.id).executeTakeFirstOrThrow();
    expect(row.status).toBe('accepted');
    expect(row.accepted_at).not.toBeNull();
});

test('acceptInvitation by non-invitee throws NotInviteeError', async () => {
    const { invitationService, userService, teacher } = await seedTeacher();
    const other = await userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');

    await expect(
        invitationService.acceptInvitation(inv.id, other.id, 'other@example.com'),
    ).rejects.toBeInstanceOf(NotInviteeError);
});

test('acceptInvitation on revoked throws InvitationNotPendingError with currentStatus', async () => {
    const { invitationService, teacher, student } = await seedTeacherAndStudent();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    await invitationService.revokeInvitation(inv.id, teacher.id);

    try {
        await invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
        throw new Error('expected throw');
    } catch (err) {
        expect(err).toBeInstanceOf(InvitationNotPendingError);
        expect((err as InvitationNotPendingError).detail.currentStatus).toBe('revoked');
    }
});

test('acceptInvitation is idempotent at the (teacher, student) level', async () => {
    const { invitationService, teacher, student } = await seedTeacherAndStudent();
    const first = await invitationService.createInvitation(teacher.id, 'student@example.com');
    const relationA = await invitationService.acceptInvitation(first.id, student.id, 'student@example.com');

    // Teacher invites again, student accepts second invitation
    const second = await invitationService.createInvitation(teacher.id, 'student@example.com');
    const relationB = await invitationService.acceptInvitation(second.id, student.id, 'student@example.com');

    expect(relationB.id).toBe(relationA.id);
});

test('acceptInvitation on already-accepted-by-me returns same Relation', async () => {
    const { invitationService, teacher, student } = await seedTeacherAndStudent();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    const a = await invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    const b = await invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    expect(b.id).toBe(a.id);
});

// --- declineInvitation ---

test('declineInvitation transitions invitation to declined, creates no Relation', async () => {
    const { invitationService, teacher, student, db } = await seedTeacherAndStudent();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');

    await invitationService.declineInvitation(inv.id, student.id, 'student@example.com');

    const row = await db.selectFrom('invitations').selectAll().where('id', '=', inv.id).executeTakeFirstOrThrow();
    expect(row.status).toBe('declined');

    const rels = await db.selectFrom('relations').selectAll().execute();
    expect(rels.length).toBe(0);
});

test('declineInvitation by non-invitee throws NotInviteeError', async () => {
    const { invitationService, userService, teacher } = await seedTeacher();
    const other = await userService.register({
        email: 'other@example.com', password: 'secret123', displayName: 'O',
    });
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');

    await expect(
        invitationService.declineInvitation(inv.id, other.id, 'other@example.com'),
    ).rejects.toBeInstanceOf(NotInviteeError);
});

test('declineInvitation on non-pending throws InvitationNotPendingError', async () => {
    const { invitationService, teacher, student } = await seedTeacherAndStudent();
    const inv = await invitationService.createInvitation(teacher.id, 'student@example.com');
    await invitationService.declineInvitation(inv.id, student.id, 'student@example.com');

    await expect(
        invitationService.declineInvitation(inv.id, student.id, 'student@example.com'),
    ).rejects.toBeInstanceOf(InvitationNotPendingError);
});
