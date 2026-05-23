import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';

test('register creates a user', async () => {
    const { userService } = await createTestDb();
    const user = await userService.register('alice', 'password123');
    expect(user.username).toBe('alice');
    expect(user.id).toBeString();
});

test('verify with correct password returns AuthUser', async () => {
    const { userService } = await createTestDb();
    await userService.register('alice', 'password123');
    const result = await userService.verify('alice', 'password123');
    expect(result).not.toBeNull();
    expect(result!.username).toBe('alice');
});

test('verify with wrong password returns null', async () => {
    const { userService } = await createTestDb();
    await userService.register('alice', 'password123');
    const result = await userService.verify('alice', 'wrongpassword');
    expect(result).toBeNull();
});

test('verify with nonexistent user returns null', async () => {
    const { userService } = await createTestDb();
    const result = await userService.verify('nonexistent', 'password123');
    expect(result).toBeNull();
});

test('register duplicate username throws', async () => {
    const { userService } = await createTestDb();
    await userService.register('alice', 'password123');
    await expect(userService.register('alice', 'different')).rejects.toThrow();
});
