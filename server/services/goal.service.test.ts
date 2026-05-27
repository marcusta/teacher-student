import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

async function seedStudent(email = 'student@example.com') {
    const ctx = await createTestDb();
    const student = await ctx.userService.register({
        email, password: 'secret123', displayName: 'S',
    });
    return { ...ctx, student };
}

async function seedTeacherWithStudent() {
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

test('create persists Goal owned by student with trimmed title', async () => {
    const { goalService, student } = await seedStudent();
    const goal = await goalService.create(student.id, { title: '  Bättre galopp   ' });

    expect(goal.id).toBeString();
    expect(goal.studentId).toBe(student.id);
    expect(goal.title).toBe('Bättre galopp');
    expect(goal.status).toBe('active');
    expect(goal.achievedAt).toBeNull();
    expect(goal.sharedTeacherIds).toEqual([]);
    expect(goal.createdAt).toBeString();
    expect(goal.updatedAt).toBeString();
});

test('create rejects empty title', async () => {
    const { goalService, student } = await seedStudent();
    await expect(goalService.create(student.id, { title: '   ' })).rejects.toThrow();
});

test('create rejects invalid targetDate', async () => {
    const { goalService, student } = await seedStudent();
    await expect(goalService.create(student.id, {
        title: 'X',
        targetDate: 'not-a-date',
    })).rejects.toThrow();
});

test('listForStudent returns empty when none', async () => {
    const { goalService, student } = await seedStudent();
    expect(await goalService.listForStudent(student.id)).toEqual([]);
});

test('listForStudent returns only own goals sorted active before achieved before abandoned then created_at DESC', async () => {
    const ctx = await seedStudent('s1@example.com');
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });

    const active1 = await ctx.goalService.create(ctx.student.id, { title: 'Active 1' });
    await new Promise((r) => setTimeout(r, 5));
    const active2 = await ctx.goalService.create(ctx.student.id, { title: 'Active 2' });
    const achieved = await ctx.goalService.create(ctx.student.id, { title: 'Done' });
    await ctx.db.updateTable('goal').set({ status: 'achieved' }).where('id', '=', achieved.id).execute();
    const abandoned = await ctx.goalService.create(ctx.student.id, { title: 'Old' });
    await ctx.db.updateTable('goal').set({ status: 'abandoned' }).where('id', '=', abandoned.id).execute();
    await ctx.goalService.create(s2.id, { title: 'Other student' });

    const list = await ctx.goalService.listForStudent(ctx.student.id);
    expect(list.map((g) => g.id)).toEqual([active2.id, active1.id, achieved.id, abandoned.id]);
    expect(list[0].status).toBe('active');
    expect(list[2].status).toBe('achieved');
    expect(list[3].status).toBe('abandoned');
});

test('getForStudent returns own Goal', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    expect(await goalService.getForStudent(student.id, g.id)).toMatchObject({ id: g.id });
});

test('getForStudent throws NotFoundError for other student or missing', async () => {
    const ctx = await seedStudent('s1@example.com');
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.goalService.getForStudent(s2.id, g.id)).rejects.toThrow();
    await expect(ctx.goalService.getForStudent(ctx.student.id, 'missing')).rejects.toThrow();
});

test('update refreshes updated_at and returns updated Goal', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'Old' });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await goalService.update(student.id, g.id, { title: 'New' });
    expect(updated.title).toBe('New');
    expect(updated.updatedAt > g.updatedAt).toBe(true);
});

test('update allows clearing description and targetDate', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, {
        title: 'X',
        description: 'Desc',
        targetDate: '2026-12-01',
    });
    const updated = await goalService.update(student.id, g.id, {
        description: null,
        targetDate: null,
    });
    expect(updated.description).toBeNull();
    expect(updated.targetDate).toBeNull();
});

test('update does not mutate status', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.update(student.id, g.id, { title: 'Y' });
    expect((await goalService.getForStudent(student.id, g.id)).status).toBe('active');
});

test('update on other student\'s goal throws NotFoundError', async () => {
    const ctx = await seedStudent('s1@example.com');
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.goalService.update(s2.id, g.id, { title: 'Hack' })).rejects.toThrow();
});

test('update rejects empty title when provided', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await expect(goalService.update(student.id, g.id, { title: '   ' })).rejects.toThrow();
});

test('abandon sets status abandoned on own goal', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.abandon(student.id, g.id);
    expect((await goalService.getForStudent(student.id, g.id)).status).toBe('abandoned');
});

test('abandon on already-abandoned goal is idempotent', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.abandon(student.id, g.id);
    await goalService.abandon(student.id, g.id);
    expect((await goalService.getForStudent(student.id, g.id)).status).toBe('abandoned');
});

test('abandon on other student\'s goal throws NotFoundError', async () => {
    const ctx = await seedStudent('s1@example.com');
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.goalService.abandon(s2.id, g.id)).rejects.toThrow();
    expect((await ctx.goalService.getForStudent(ctx.student.id, g.id)).status).toBe('active');
});

test('share inserts goal_share for connected teacher', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.sharedTeacherIds).toEqual([teacher.id]);
});

test('share is idempotent', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    await goalService.share(student.id, g.id, teacher.id);
    expect((await goalService.getForStudent(student.id, g.id)).sharedTeacherIds).toEqual([teacher.id]);
});

test('share throws NotFoundError for unconnected teacher', async () => {
    const ctx = await seedStudent();
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    const stranger = await ctx.userService.register({
        email: 't@example.com', password: 'secret123', displayName: 'T',
    });
    await expect(ctx.goalService.share(ctx.student.id, g.id, stranger.id)).rejects.toThrow();
});

test('share throws NotFoundError when caller is not goal owner', async () => {
    const ctx = await seedTeacherWithStudent();
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.goalService.share(s2.id, g.id, ctx.teacher.id)).rejects.toThrow();
});

test('unshare removes goal_share row', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    await goalService.unshare(student.id, g.id, teacher.id);
    expect((await goalService.getForStudent(student.id, g.id)).sharedTeacherIds).toEqual([]);
});

test('unshare is idempotent', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.unshare(student.id, g.id, teacher.id);
    await goalService.unshare(student.id, g.id, teacher.id);
});

test('unshare throws NotFoundError when caller is not goal owner', async () => {
    const ctx = await seedTeacherWithStudent();
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    await ctx.goalService.share(ctx.student.id, g.id, ctx.teacher.id);
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.goalService.unshare(s2.id, g.id, ctx.teacher.id)).rejects.toThrow();
});

test('listSharedTeachers returns hydrated names sorted', async () => {
    const ctx = await createTestDb();
    const t1 = await ctx.userService.register({
        email: 't1@example.com', password: 'secret123', displayName: 'Zara',
    });
    const t2 = await ctx.userService.register({
        email: 't2@example.com', password: 'secret123', displayName: 'Anna',
    });
    const student = await ctx.userService.register({
        email: 'student@example.com', password: 'secret123', displayName: 'S',
    });
    for (const teacher of [t1, t2]) {
        const inv = await ctx.invitationService.createInvitation(teacher.id, 'student@example.com');
        await ctx.invitationService.acceptInvitation(inv.id, student.id, 'student@example.com');
    }
    const g = await ctx.goalService.create(student.id, { title: 'X' });
    await ctx.goalService.share(student.id, g.id, t1.id);
    await ctx.goalService.share(student.id, g.id, t2.id);
    const list = await ctx.goalService.listSharedTeachers(student.id, g.id);
    expect(list.map((x) => x.displayName)).toEqual(['Anna', 'Zara']);
});

test('listSharedTeachers throws NotFoundError for non-owner', async () => {
    const ctx = await seedTeacherWithStudent();
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    await expect(ctx.goalService.listSharedTeachers(s2.id, g.id)).rejects.toThrow();
});

test('listForStudent hydrates sharedTeacherIds', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    const list = await goalService.listForStudent(student.id);
    expect(list.find((x) => x.id === g.id)?.sharedTeacherIds).toEqual([teacher.id]);
});

test('listForStudentAsTeacher returns only shared goals in status order', async () => {
    const ctx = await seedTeacherWithStudent();
    const active = await ctx.goalService.create(ctx.student.id, { title: 'Active' });
    await new Promise((r) => setTimeout(r, 5));
    const shared2 = await ctx.goalService.create(ctx.student.id, { title: 'Active 2' });
    const privateGoal = await ctx.goalService.create(ctx.student.id, { title: 'Private' });
    const abandoned = await ctx.goalService.create(ctx.student.id, { title: 'Old' });
    await ctx.db.updateTable('goal').set({ status: 'abandoned' }).where('id', '=', abandoned.id).execute();
    await ctx.goalService.share(ctx.student.id, active.id, ctx.teacher.id);
    await ctx.goalService.share(ctx.student.id, shared2.id, ctx.teacher.id);
    await ctx.goalService.share(ctx.student.id, abandoned.id, ctx.teacher.id);

    const list = await ctx.goalService.listForStudentAsTeacher(ctx.teacher.id, ctx.student.id);
    expect(list.map((g) => g.id)).toEqual([shared2.id, active.id, abandoned.id]);
    expect(list.every((g) => g.id !== privateGoal.id)).toBe(true);
    expect(list[0]).not.toHaveProperty('sharedTeacherIds');
});

test('listForStudentAsTeacher throws NotFoundError when no Relation exists', async () => {
    const ctx = await seedTeacherWithStudent();
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.goalService.listForStudentAsTeacher(ctx.teacher.id, stranger.id)).rejects.toThrow();
});

test('getForTeacher returns shared Goal without sharedTeacherIds', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    const got = await goalService.getForTeacher(teacher.id, g.id);
    expect(got.title).toBe('X');
    expect(got).not.toHaveProperty('sharedTeacherIds');
});

test('getForTeacher throws NotFoundError for unshared goal with active relation', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'Private' });
    await expect(goalService.getForTeacher(teacher.id, g.id)).rejects.toThrow();
});

test('getForTeacher throws NotFoundError for non-relation teacher', async () => {
    const ctx = await seedTeacherWithStudent();
    const g = await ctx.goalService.create(ctx.student.id, { title: 'X' });
    await ctx.goalService.share(ctx.student.id, g.id, ctx.teacher.id);
    const stranger = await ctx.userService.register({
        email: 'stranger@example.com', password: 'secret123', displayName: 'X',
    });
    await expect(ctx.goalService.getForTeacher(stranger.id, g.id)).rejects.toThrow();
});

// --- 043: status transitions ---

test('markAchieved by owner sets status=achieved and achieved_at', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.markAchieved(student.id, g.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.status).toBe('achieved');
    expect(got.achievedAt).toBeString();
});

test('markAchieved by shared teacher transitions the Goal', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    await goalService.markAchieved(teacher.id, g.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.status).toBe('achieved');
});

test('markAchieved by unshared teacher throws NotFoundError', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await expect(goalService.markAchieved(teacher.id, g.id)).rejects.toThrow();
});

test('markAchieved is idempotent — achieved_at is not rewritten', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.markAchieved(student.id, g.id);
    const first = (await goalService.getForStudent(student.id, g.id)).achievedAt;
    await new Promise((r) => setTimeout(r, 10));
    await goalService.markAchieved(student.id, g.id);
    const second = (await goalService.getForStudent(student.id, g.id)).achievedAt;
    expect(second).toBe(first);
});

test('markAchieved from abandoned throws ConflictError', async () => {
    const { ConflictError } = await import('@basics/core/server/auth');
    const { goalService, db, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await db.updateTable('goal').set({ status: 'abandoned' }).where('id', '=', g.id).execute();
    await expect(goalService.markAchieved(student.id, g.id)).rejects.toBeInstanceOf(ConflictError);
});

test('reopen clears achieved_at and flips status to active', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.markAchieved(student.id, g.id);
    await goalService.reopen(student.id, g.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.status).toBe('active');
    expect(got.achievedAt).toBeNull();
});

test('reopen by shared teacher transitions the Goal', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    await goalService.markAchieved(student.id, g.id);
    await goalService.reopen(teacher.id, g.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.status).toBe('active');
});

test('reopen is idempotent when already active', async () => {
    const { goalService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.reopen(student.id, g.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.status).toBe('active');
    expect(got.achievedAt).toBeNull();
});

test('abandon by shared teacher throws NotFoundError (owner-only)', async () => {
    const { goalService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'X' });
    await goalService.share(student.id, g.id, teacher.id);
    await expect(goalService.abandon(teacher.id, g.id)).rejects.toThrow();
});

// --- 044: Goal–Plan attachment ---

test('attachToPlan links Goal to owned active Plan', async () => {
    const { goalService, planService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'G' });
    const p = await planService.create(student.id, { title: 'P' });
    await goalService.attachToPlan(student.id, g.id, p.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.planIds).toEqual([p.id]);
});

test('attachToPlan is idempotent', async () => {
    const { goalService, planService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'G' });
    const p = await planService.create(student.id, { title: 'P' });
    await goalService.attachToPlan(student.id, g.id, p.id);
    await goalService.attachToPlan(student.id, g.id, p.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.planIds).toEqual([p.id]);
});

test('attachToPlan throws NotFoundError when goal not owned', async () => {
    const ctx = await seedStudent('s1@example.com');
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    const g = await ctx.goalService.create(s2.id, { title: 'G' });
    const p = await ctx.planService.create(ctx.student.id, { title: 'P' });
    await expect(ctx.goalService.attachToPlan(ctx.student.id, g.id, p.id)).rejects.toThrow();
});

test('attachToPlan throws NotFoundError when plan not owned', async () => {
    const ctx = await seedStudent('s1@example.com');
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    const g = await ctx.goalService.create(ctx.student.id, { title: 'G' });
    const p = await ctx.planService.create(s2.id, { title: 'P' });
    await expect(ctx.goalService.attachToPlan(ctx.student.id, g.id, p.id)).rejects.toThrow();
});

test('attachToPlan throws NotFoundError when plan archived', async () => {
    const { goalService, planService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'G' });
    const p = await planService.create(student.id, { title: 'P' });
    await planService.archive(student.id, p.id);
    await expect(goalService.attachToPlan(student.id, g.id, p.id)).rejects.toThrow();
});

test('detachFromPlan removes the link and is idempotent', async () => {
    const { goalService, planService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'G' });
    const p = await planService.create(student.id, { title: 'P' });
    await goalService.attachToPlan(student.id, g.id, p.id);
    await goalService.detachFromPlan(student.id, g.id, p.id);
    await goalService.detachFromPlan(student.id, g.id, p.id);
    const got = await goalService.getForStudent(student.id, g.id);
    expect(got.planIds).toEqual([]);
});

test('detachFromPlan throws NotFoundError when goal not owned', async () => {
    const ctx = await seedStudent('s1@example.com');
    const s2 = await ctx.userService.register({
        email: 's2@example.com', password: 'secret123', displayName: 'S2',
    });
    const g = await ctx.goalService.create(s2.id, { title: 'G' });
    const p = await ctx.planService.create(s2.id, { title: 'P' });
    await expect(ctx.goalService.detachFromPlan(ctx.student.id, g.id, p.id)).rejects.toThrow();
});

test('getForTeacher hydrates planIds', async () => {
    const { goalService, planService, teacher, student } = await seedTeacherWithStudent();
    const g = await goalService.create(student.id, { title: 'G' });
    const p = await planService.create(student.id, { title: 'P' });
    await goalService.attachToPlan(student.id, g.id, p.id);
    await goalService.share(student.id, g.id, teacher.id);
    const got = await goalService.getForTeacher(teacher.id, g.id);
    expect(got.planIds).toEqual([p.id]);
});

test('listForStudent hydrates planIds', async () => {
    const { goalService, planService, student } = await seedStudent();
    const g = await goalService.create(student.id, { title: 'G' });
    const p = await planService.create(student.id, { title: 'P' });
    await goalService.attachToPlan(student.id, g.id, p.id);
    const list = await goalService.listForStudent(student.id);
    expect(list.find((x) => x.id === g.id)?.planIds).toEqual([p.id]);
});
