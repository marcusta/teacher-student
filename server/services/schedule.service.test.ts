import { test, expect } from 'bun:test';
import { scheduleFixture } from '../testing/schedule';

test('a shared horse activity is persisted, completed once and read from the same horse log', async () => {
    const c = await scheduleFixture();
    const input = { requestId: 'care-1', typeId: c.type('care'), horseId: c.horse.id, title: 'Markservice', date: '2026-11-18', time: '14:00', assigneeIds: [c.member.id] };
    const activity = await c.scheduleService.create(c.admin.id, c.stable.id, input);
    expect((await c.scheduleService.create(c.admin.id, c.stable.id, input)).id).toBe(activity.id);
    await expect(c.scheduleService.week(c.stranger.id, c.stable.id, '2026-11-16')).rejects.toThrow();
    expect((await c.scheduleService.week(c.member.id, c.stable.id, '2026-11-16')).activities).toHaveLength(1);
    await c.scheduleService.transition(c.member.id, c.stable.id, activity.id, 'completed', { version: activity.version, resultNote: 'Hovarna kontrollerade.', performerIds: [c.member.id], performedAt: '2026-11-18T13:20:00Z' });
    await c.scheduleService.transition(c.member.id, c.stable.id, activity.id, 'completed', { version: activity.version });
    const log = await c.scheduleService.log(c.admin.id, c.stable.id, c.horse.id, {});
    expect(log.items).toHaveLength(1);
    expect(log.items[0]?.resultNote).toBe('Hovarna kontrollerade.');
    expect(log.items[0]?.performerIds).toEqual([c.member.id]);
});

test('scheduled training on another owners horse preserves snapshots and private catalog access', async () => {
    const c = await scheduleFixture();
    const relation = await c.invitationService.createInvitation(c.admin.id, c.member.email);
    await c.invitationService.acceptInvitation(relation.id, c.member.id, c.member.email);
    const invitation = await c.stableService.invite(c.admin.id, c.stable.id, c.stranger.email);
    await c.stableService.respond(c.stranger.id, invitation.id, true);
    const exercise = await c.exerciseService.create(c.admin.id, { name: 'Övergångar', description: 'Skritt och trav.' });
    const program = await c.programService.create(c.admin.id, { title: 'Lösgjordhet' });
    await c.programService.addExercise(c.admin.id, program.id, exercise.id, { notes: 'Bibehåll rytmen.' });
    const activity = await c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'training', typeId: c.type('training'), horseId: c.horse.id, title: 'Dressyrpass', date: '2026-11-18', assigneeIds: [c.member.id], programIds: [program.id] });
    await c.programService.update(c.admin.id, program.id, { title: 'Ändrad mall' });
    await c.exerciseService.update(c.admin.id, exercise.id, { name: 'Ändrad övning' });
    await c.programService.archive(c.admin.id, program.id);
    expect((await c.scheduleService.get(c.member.id, c.stable.id, activity.id)).programs[0]?.title).toBe('Lösgjordhet');
    const hidden = await c.scheduleService.get(c.stranger.id, c.stable.id, activity.id);
    expect(hidden.hasProgram).toBe(true);
    expect(hidden.programs).toEqual([]);
    expect(hidden.exercises).toEqual([]);
    await expect(c.trainingSessionService.create(c.member.id, { horseId: c.horse.id, performedAt: '2026-11-18T16:00:00Z' })).rejects.toThrow();
    const result = await c.scheduleTrainingService.register(c.member.id, c.stable.id, activity.id, { version: activity.version, performedAt: '2026-11-18T16:00:00Z', durationMin: 40, summary: 'Privat reflektion', resultNote: 'Utfört enligt plan.' });
    expect(result.trainingSessionId).toBeString();
    const pass = await c.trainingSessionService.getForViewer(c.member.id, result.trainingSessionId!);
    expect(pass.summary).toBe('Privat reflektion');
    expect(pass.horseId).toBe(c.horse.id);
    expect(pass.exercises[0]?.notes).toBe('Bibehåll rytmen.');
    expect(pass.exercises[0]?.name).toBe('Övergångar');
    expect(pass.programs[0]?.title).toBe('Lösgjordhet');
    await expect(c.trainingSessionService.update(c.member.id, result.trainingSessionId!, { horseId: null })).rejects.toThrow('training_already_linked');
    const repeated = await c.scheduleTrainingService.register(c.member.id, c.stable.id, activity.id, { version: activity.version });
    expect(repeated.trainingSessionId).toBe(result.trainingSessionId);
    const publicView = await c.scheduleService.get(c.admin.id, c.stable.id, activity.id);
    expect(publicView.trainingSessionId).toBeNull();
    expect(publicView.resultNote).toBe('Utfört enligt plan.');
    expect((await c.trainingSessionService.listForStudent(c.member.id))).toHaveLength(1);
});

test('changing the main performer revalidates catalog access and preserves a failed edit atomically', async () => {
    const c = await scheduleFixture();
    const invite = await c.stableService.invite(c.admin.id, c.stable.id, c.stranger.email);
    await c.stableService.respond(c.stranger.id, invite.id, true);
    const program = await c.programService.create(c.admin.id, { title: 'Privat planering' });
    const activity = await c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'private-plan', typeId: c.type('training'), horseId: c.horse.id, title: 'Dressyr', date: '2026-11-18', assigneeIds: [c.admin.id], programIds: [program.id] });
    await expect(c.scheduleService.update(c.admin.id, c.stable.id, activity.id, { version: activity.version, assigneeIds: [c.stranger.id], trainingStudentId: c.stranger.id })).rejects.toThrow('catalog_unavailable');
    expect((await c.scheduleService.get(c.admin.id, c.stable.id, activity.id)).assigneeIds).toEqual([c.admin.id]);
    const care = await c.scheduleService.update(c.admin.id, c.stable.id, activity.id, { version: activity.version, typeId: c.type('care') });
    expect(care.hasProgram).toBe(false);
    expect(care.exercises).toEqual([]);
});

test('invalid copy and completion roll back the whole operation, and detached horses retain history', async () => {
    const c = await scheduleFixture();
    const activity = await c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'atomic', typeId: c.type('care'), horseId: c.horse.id, title: 'Kontroll', date: '2026-11-18', assigneeIds: [c.member.id] });
    await expect(c.scheduleService.finish(c.admin.id, c.stable.id, activity.id, { version: activity.version, patch: { title: 'Ska rullas tillbaka' }, performerIds: [c.stranger.id] })).rejects.toThrow('member_inactive');
    expect((await c.scheduleService.get(c.admin.id, c.stable.id, activity.id)).title).toBe('Kontroll');
    await c.stableService.setMember(c.admin.id, c.stable.id, c.member.id, 'member', true);
    await expect(c.scheduleTemplateService.copy(c.admin.id, c.stable.id, { requestId: 'bad-copy', sourceDate: '2026-11-18', targetDates: ['2026-11-19', '2026-11-20'], keepAssignees: true })).rejects.toThrow('member_inactive');
    expect((await c.scheduleService.week(c.admin.id, c.stable.id, '2026-11-16')).activities).toHaveLength(1);
    await expect(c.scheduleService.get(c.member.id, c.stable.id, activity.id)).rejects.toThrow();
    const completed = await c.scheduleService.transition(c.admin.id, c.stable.id, activity.id, 'completed', { version: activity.version });
    await c.stableService.detachHorse(c.admin.id, c.stable.id, c.horse.id);
    expect((await c.scheduleService.log(c.admin.id, c.stable.id, c.horse.id, {})).items[0]?.id).toBe(completed.id);
    await expect(c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'detached', typeId: c.type('care'), horseId: c.horse.id, title: 'Ny', date: '2026-11-19' })).rejects.toThrow();
});

test('an assignee can correct the recorded event time and performers without creating a second log entry', async () => {
    const c = await scheduleFixture();
    const activity = await c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'correct-outcome', typeId: c.type('care'), horseId: c.horse.id, title: 'Kontroll', date: '2026-11-18', assigneeIds: [c.member.id], status: 'completed', performedAt: '2026-11-18T13:00:00Z' });
    const corrected = await c.scheduleService.update(c.member.id, c.stable.id, activity.id, { version: activity.version, performedAt: '2026-11-18T14:00:00Z', performerIds: [c.member.id], resultNote: 'Rättad händelsetid.' });
    expect(corrected.performedAt).toBe('2026-11-18T14:00:00.000Z');
    expect(corrected.performerIds).toEqual([c.member.id]);
    expect(corrected.completedBy).toBe(c.admin.id);
    expect(corrected.updatedBy).toBe(c.member.id);
    expect((await c.scheduleService.log(c.admin.id, c.stable.id, c.horse.id, {})).items).toHaveLength(1);
});

test('stale edits and competing claims cannot overwrite another member', async () => {
    const c = await scheduleFixture();
    const activity = await c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'unassigned', typeId: c.type('lunch_feed'), title: 'Lunchfodring', date: '2026-11-18' });
    const claimed = await c.scheduleService.claim(c.member.id, c.stable.id, activity.id, activity.version);
    expect(claimed.assigneeIds).toEqual([c.member.id]);
    await expect(c.scheduleService.claim(c.admin.id, c.stable.id, activity.id, activity.version)).rejects.toThrow();
    await expect(c.scheduleService.update(c.admin.id, c.stable.id, activity.id, { version: activity.version, title: 'Fel rubrik' })).rejects.toThrow('version_conflict');
    await expect(c.scheduleService.update(c.member.id, c.stable.id, activity.id, { version: claimed.version, title: 'Fel rubrik' })).rejects.toThrow();
    expect((await c.scheduleService.get(c.admin.id, c.stable.id, activity.id)).title).toBe('Lunchfodring');
});

test('copying and weekly templates retain planning but exclude outcomes and survive retries', async () => {
    const c = await scheduleFixture();
    await c.scheduleService.create(c.admin.id, c.stable.id, { requestId: 'source', typeId: c.type('care'), horseId: c.horse.id, title: 'Markservice', date: '2026-11-18', instruction: 'Kontrollera hovar', assigneeIds: [c.member.id], status: 'completed', resultNote: 'Klart', performedAt: '2026-11-18T13:00:00Z' });
    const copy = { requestId: 'copy', sourceDate: '2026-11-18', targetDates: ['2026-11-19'], keepAssignees: true };
    const first = await c.scheduleTemplateService.copy(c.admin.id, c.stable.id, copy);
    expect((await c.scheduleTemplateService.copy(c.admin.id, c.stable.id, copy)).createdIds).toEqual(first.createdIds);
    const week = await c.scheduleService.week(c.admin.id, c.stable.id, '2026-11-16');
    expect(week.activities).toHaveLength(2);
    expect(week.activities.find(a => a.date === '2026-11-19')).toMatchObject({ status: 'planned', resultNote: '', performerIds: [], instruction: 'Kontrollera hovar', assigneeIds: [c.member.id] });
    const template = await c.scheduleTemplateService.save(c.admin.id, c.stable.id, { requestId: 'save', name: 'Basvecka', startDate: '2026-11-16' });
    await c.scheduleTemplateService.apply(c.admin.id, c.stable.id, { requestId: 'apply', templateId: template.id, startDate: '2026-11-23', keepAssignees: false });
    const next = await c.scheduleService.week(c.member.id, c.stable.id, '2026-11-23');
    expect(next.activities).toHaveLength(2);
    expect(next.activities.every(a => a.status === 'planned' && !a.assigneeIds.length && !a.resultNote)).toBe(true);
});
