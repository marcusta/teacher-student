import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

test('a stable starts with its creator as administrator and does not expose private horses', async () => {
    const ctx = await createTestDb();
    const anna = await ctx.userService.register({ email: 'anna@stable.test', password: 'test-password', displayName: 'Anna' });
    const lisa = await ctx.userService.register({ email: 'lisa@stable.test', password: 'test-password', displayName: 'Lisa' });
    const horse = await ctx.horseService.create(anna.id, { name: 'Saga' });
    const stable = await ctx.stableService.create(anna.id, { name: 'Lindängen' });
    expect(stable.role).toBe('admin');
    expect(await ctx.stableService.list(lisa.id)).toEqual([]);
    await expect(ctx.stableService.detail(lisa.id, stable.id)).rejects.toThrow();
    expect((await ctx.stableService.detail(anna.id, stable.id)).horses).toEqual([]);
    await ctx.stableService.attachHorse(anna.id, stable.id, horse.id);
    expect((await ctx.stableService.detail(anna.id, stable.id)).horses[0]?.id).toBe(horse.id);
});

test('stable invitations require the intended account and revocation removes access immediately', async () => {
    const ctx = await createTestDb();
    const anna = await ctx.userService.register({ email: 'anna@stable.test', password: 'test-password', displayName: 'Anna' });
    const lisa = await ctx.userService.register({ email: 'lisa@stable.test', password: 'test-password', displayName: 'Lisa' });
    const stable = await ctx.stableService.create(anna.id, { name: 'Lindängen' });
    const invitation = await ctx.stableService.invite(anna.id, stable.id, lisa.email);
    await expect(ctx.stableService.respond(anna.id, invitation.id, true)).rejects.toThrow();
    expect((await ctx.stableService.inbox(lisa.id))[0]?.stableName).toBe('Lindängen');
    await ctx.stableService.respond(lisa.id, invitation.id, true);
    expect((await ctx.stableService.list(lisa.id))[0]?.role).toBe('member');
    await expect(ctx.stableService.setMember(lisa.id, stable.id, anna.id, 'member', false)).rejects.toThrow();
    await expect(ctx.stableService.setMember(anna.id, stable.id, anna.id, 'admin', true)).rejects.toThrow();
    await ctx.stableService.setMember(anna.id, stable.id, lisa.id, 'member', true);
    await expect(ctx.stableService.detail(lisa.id, stable.id)).rejects.toThrow();
    await ctx.stableService.respond(lisa.id, invitation.id, true);
    expect(await ctx.stableService.list(lisa.id)).toEqual([]);
    const redundant = await ctx.stableService.invite(anna.id, stable.id, anna.email);
    await ctx.stableService.respond(anna.id, redundant.id, true);
    expect((await ctx.stableService.list(anna.id))[0]?.role).toBe('admin');
});
