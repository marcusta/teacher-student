import { createTestDb } from './db';

export async function scheduleFixture() {
    const ctx = await createTestDb();
    const admin = await ctx.userService.register({ email: 'admin@schedule.test', password: 'test-password', displayName: 'Anna' });
    const member = await ctx.userService.register({ email: 'member@schedule.test', password: 'test-password', displayName: 'Lisa' });
    const stranger = await ctx.userService.register({ email: 'stranger@schedule.test', password: 'test-password', displayName: 'Maja' });
    const stable = await ctx.stableService.create(admin.id, { name: 'Lindängen' });
    const invitation = await ctx.stableService.invite(admin.id, stable.id, member.email);
    await ctx.stableService.respond(member.id, invitation.id, true);
    const horse = await ctx.horseService.create(admin.id, { name: 'Saga' });
    await ctx.stableService.attachHorse(admin.id, stable.id, horse.id);
    const detail = await ctx.stableService.detail(admin.id, stable.id);
    const type = (code: string) => detail.types.find(t => t.code === code)!.id;
    return { ...ctx, admin, member, stranger, stable, horse, type };
}
