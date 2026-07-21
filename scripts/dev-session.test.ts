import { test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync } from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import { SessionStore } from '@basics/core/server/auth';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { seedDevData, DEV_STUDENT_EMAIL } from './dev-seed';
import { mintDevSession } from './dev-session';

const TMP = path.join(import.meta.dir, '../data/test-dev-session');
const APP_DB = path.join(TMP, 'app.sqlite');
const SESSION_DB = path.join(TMP, 'sessions.sqlite');

beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
});

test('mintDevSession creates a validateable session for the seeded user', async () => {
    const db = createDb<Database>(APP_DB);
    try {
        await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
        await seedDevData(createServices(db));
    } finally {
        await db.destroy();
    }

    const minted = await mintDevSession(DEV_STUDENT_EMAIL, {
        dbPath: APP_DB,
        sessionDbPath: SESSION_DB,
        sessionTtl: 86_400_000,
        cookieName: 'session',
    });

    expect(minted.email).toBe(DEV_STUDENT_EMAIL);
    expect(minted.token.length).toBe(64);
    expect(minted.cookieName).toBe('session');

    const sessions = new SessionStore(SESSION_DB, { ttl: 86_400_000 });
    try {
        await sessions.init();
        const userId = await sessions.validate(minted.token);
        expect(userId).toBe(minted.userId);
    } finally {
        await sessions.close();
    }
});

test('mintDevSession refuses unknown emails', async () => {
    const db = createDb<Database>(APP_DB);
    try {
        await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
    } finally {
        await db.destroy();
    }

    await expect(mintDevSession('nobody@example.com', {
        dbPath: APP_DB,
        sessionDbPath: SESSION_DB,
    })).rejects.toThrow(/No user with email/);
});
