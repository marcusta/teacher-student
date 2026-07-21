import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import { createTestDb } from '../server/testing/db';
import { ownerRecipients, sharedTeacherRecipients } from '../web/training-sessions/training-session-copy';
import { shareDescription, shareLabel } from '../web/ui/copy';

/**
 * End-to-end for the §4.5 trust surface on Training Sessions.
 *
 * `tests/training-session-copy.test.ts` asserts the copy rules against
 * hand-written recipient lists, and `server/routes.test.ts` asserts the wire
 * shape. Neither joins the two, so nothing catches a projection that ships ids
 * the client cannot name — the chip would degrade to `Delad: okänd mottagare`
 * and every existing test would still pass.
 *
 * So these drive the REAL service output through the REAL copy functions, once
 * per read path, and assert the string a reader actually sees. Two claims per
 * path: the recipient is named, and a co-watcher is not.
 */

await import('../web/i18n');
setLocale('sv');

async function seedTwiceSharedSession() {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'Elin',
    });
    const connect = async (email: string, displayName: string) => {
        const teacher = await ctx.userService.register({ email, password: 'secret123', displayName });
        const inv = await ctx.invitationService.createInvitation(teacher.id, student.email);
        await ctx.invitationService.acceptInvitation(inv.id, student.id, student.email);
        return teacher;
    };
    // Alva sorts before Björn, which is the order `listTeachersForStudent`
    // returns and therefore the name the owner's chip leads with.
    const alva = await connect('alva@example.com', 'Alva');
    const bjorn = await connect('bjorn@example.com', 'Björn');

    const session = await ctx.trainingSessionService.create(student.id, {
        performedAt: '2026-06-01T10:00:00.000Z',
        summary: 'Skritt och trav.',
        shareWithTeacherIds: [alva.id, bjorn.id],
    });

    return { ...ctx, student, alva, bjorn, session };
}

test('owner list path: every recipient resolves to a name from GET /teachers', async () => {
    const ctx = await seedTwiceSharedSession();
    const [row] = await ctx.trainingSessionService.listForStudent(ctx.student.id);
    const teachers = await ctx.relationService.listTeachersForStudent(ctx.student.id);

    const recipients = ownerRecipients(row!.sharedWithTeacherIds, teachers);
    // No blank name anywhere: a blank is what `shareLabel` degrades on.
    expect(recipients.every((r) => r.name.trim().length > 0)).toBe(true);
    expect(recipients.map((r) => r.name).sort()).toEqual(['Alva', 'Björn']);

    // Which of the two the label LEADS with is not asserted: the share rows come
    // back without an ORDER BY, so the leading name is whatever SQLite's plan
    // yields. The §4.5 claim is that a name is there at all — pinning the
    // particular one would make this test fail for a reason nobody cares about.
    const label = shareLabel(recipients);
    expect(label).toMatch(/^Delad: (Alva|Björn) \+1$/);
    expect(label).not.toBe('Delad: okänd mottagare');
    // The name behind the +1 is still reachable, so nobody is anonymous.
    expect(shareDescription(recipients)).toContain('Alva');
    expect(shareDescription(recipients)).toContain('Björn');
});

test('owner detail path: the audience is named, not counted', async () => {
    const ctx = await seedTwiceSharedSession();
    const session = await ctx.trainingSessionService.getForViewer(ctx.student.id, ctx.session.id);
    const teachers = await ctx.relationService.listTeachersForStudent(ctx.student.id);

    const recipients = ownerRecipients(session.sharedWithTeacherIds, teachers);
    expect(recipients.every((r) => r.name.trim().length > 0)).toBe(true);
    expect(shareLabel(recipients)).toMatch(/^Delad: (Alva|Björn) \+1$/);
});

test('shared teacher detail path: names themselves and hides the co-watcher entirely', async () => {
    const ctx = await seedTwiceSharedSession();
    const session = await ctx.trainingSessionService.getForViewer(ctx.alva.id, ctx.session.id);

    // The privacy half: Björn is not on the wire at all, under any key.
    expect(session.sharedWithTeacherIds).toEqual([ctx.alva.id]);
    expect(JSON.stringify(session)).not.toContain(ctx.bjorn.id);
    expect(JSON.stringify(session)).not.toContain('Björn');

    // The trust-surface half: still shared, still named, and — because the
    // audience is scoped — with a truthful zero instead of a `+1` standing in
    // for a person this reader is not entitled to know about.
    const recipients = sharedTeacherRecipients(session.sharedWithTeacherIds, ctx.alva.id, 'du');
    const label = shareLabel(recipients);
    expect(label).toBe('Delad: du');
    expect(label).not.toBe('Delad: okänd mottagare');
    expect(label).not.toBe('Delad: du +1');

    // Symmetric for the other reader — neither teacher is the privileged one.
    const forBjorn = await ctx.trainingSessionService.getForViewer(ctx.bjorn.id, ctx.session.id);
    expect(forBjorn.sharedWithTeacherIds).toEqual([ctx.bjorn.id]);
    expect(JSON.stringify(forBjorn)).not.toContain(ctx.alva.id);
    expect(shareLabel(sharedTeacherRecipients(forBjorn.sharedWithTeacherIds, ctx.bjorn.id, 'du')))
        .toBe('Delad: du');
});

test('teacher list path: same scoping as detail, so the row cannot name a co-watcher', async () => {
    const ctx = await seedTwiceSharedSession();
    const rows = await ctx.trainingSessionService
        .listForTeacherOfStudent(ctx.alva.id, ctx.student.id);

    expect(rows.length).toBe(1);
    expect(rows[0]!.sharedWithTeacherIds).toEqual([ctx.alva.id]);
    expect(JSON.stringify(rows)).not.toContain(ctx.bjorn.id);
    expect(shareLabel(sharedTeacherRecipients(rows[0]!.sharedWithTeacherIds, ctx.alva.id, 'du')))
        .toBe('Delad: du');
});

test('a teacher cannot name the other teachers even by enumerating their own students', async () => {
    const ctx = await seedTwiceSharedSession();
    // `GET /teachers` is the only id→name directory, and it answers for the
    // CALLER as a student. Asked on a teacher's behalf it returns nothing, so
    // there is no path by which a teacher resolves a co-watcher id to a name —
    // which is why the scoped audience above is the whole defence.
    expect(await ctx.relationService.listTeachersForStudent(ctx.alva.id)).toEqual([]);
});
