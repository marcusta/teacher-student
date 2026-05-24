import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { DuplicateEmailError } from './user.service';

test('register creates a User with email and displayName', async () => {
    const { userService } = await createTestDb();
    const user = await userService.register({
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna Andersson',
    });
    expect(user.id).toBeString();
    expect(user.email).toBe('anna@example.com');
    expect(user.displayName).toBe('Anna Andersson');
});

test('register with duplicate email throws DuplicateEmailError', async () => {
    const { userService } = await createTestDb();
    await userService.register({
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna',
    });
    await expect(
        userService.register({
            email: 'anna@example.com',
            password: 'other-pass',
            displayName: 'Anna 2',
        }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
});

test('verify with correct email and password returns AuthUser', async () => {
    const { userService } = await createTestDb();
    await userService.register({
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna',
    });
    const result = await userService.verify('anna@example.com', 'secret123');
    expect(result).not.toBeNull();
    expect(result!.username).toBe('anna@example.com');
    expect(result!.id).toBeString();
});

test('verify with wrong password returns null', async () => {
    const { userService } = await createTestDb();
    await userService.register({
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna',
    });
    expect(await userService.verify('anna@example.com', 'wrong')).toBeNull();
});

test('verify with unknown email returns null', async () => {
    const { userService } = await createTestDb();
    expect(await userService.verify('nobody@example.com', 'secret123')).toBeNull();
});
