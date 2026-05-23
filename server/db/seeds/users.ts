import type { TestContext } from '../../testing/db';

export async function seedUser(ctx: TestContext): Promise<void> {
    await ctx.userService.register('alice', 'password123');
}
