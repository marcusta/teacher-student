import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { DuplicatePendingInvitationError, NotOwnerError } from './invitation.service';

async function seedTeacher() {
    const ctx = await createTestDb();
    const teacher = await ctx.userService.register({
        email: 'teacher@example.com',
        password: 'secret123',
        displayName: 'T',
    });
    return { ...ctx, teacher };
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
