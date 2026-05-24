import type { TestContext } from '../../testing/db';

export const TEST_USER = {
    email: 'anna@example.com',
    password: 'secret123',
    displayName: 'Anna Andersson',
};

export async function seedUser(ctx: TestContext): Promise<void> {
    await ctx.userService.register(TEST_USER);
}
