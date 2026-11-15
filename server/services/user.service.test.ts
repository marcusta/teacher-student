import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { ConflictError, NotFoundError } from '@basics/core/server/auth';
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

// --- changePassword ---

test('changePassword replaces the password: new one verifies, old one does not', async () => {
    const { userService } = await createTestDb();
    const user = await userService.register({
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna',
    });

    await userService.changePassword(user.id, 'secret123', 'newsecret456');

    const ok = await userService.verify('anna@example.com', 'newsecret456');
    expect(ok).not.toBeNull();
    expect(ok!.id).toBe(user.id);
    expect(await userService.verify('anna@example.com', 'secret123')).toBeNull();
});

test('changePassword with wrong current password throws ConflictError', async () => {
    const { userService } = await createTestDb();
    const user = await userService.register({
        email: 'anna@example.com',
        password: 'secret123',
        displayName: 'Anna',
    });

    await expect(
        userService.changePassword(user.id, 'wrong', 'newsecret456'),
    ).rejects.toBeInstanceOf(ConflictError);

    // Unchanged
    expect(await userService.verify('anna@example.com', 'secret123')).not.toBeNull();
});

test('changePassword for an unknown user throws NotFoundError', async () => {
    const { userService } = await createTestDb();
    await expect(
        userService.changePassword('no-such-user', 'secret123', 'newsecret456'),
    ).rejects.toBeInstanceOf(NotFoundError);
});
