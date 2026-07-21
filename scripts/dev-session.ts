/**
 * Dev-only session mint: insert a sessions row and print the cookie value.
 *
 * Usage:  bun run dev:session -- anna@example.com
 *
 * Agents set this cookie in the browser and are signed in. No password is
 * entered anywhere — this bypasses POST /api/auth/login entirely.
 *
 * Guarded by `assertDevOnly` on both the app DB (user lookup) and the
 * sessions DB (token insert).
 */

import { mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { SessionStore } from '@basics/core/server/auth';
import { config } from '@basics/core/server/config';
import type { Database } from '../server/db/schema';
import { assertDevOnly, die } from './dev-guard';

export interface MintedSession {
    email: string;
    userId: string;
    displayName: string;
    cookieName: string;
    token: string;
    expiresAt: string;
    /** Origin agents usually hit in Vite proxy mode. */
    viteOrigin: string;
    /** Origin when browsing the Hono-served build directly. */
    serverOrigin: string;
}

/**
 * Look up `email` in the app DB and mint a session token in the sessions DB.
 * Caller owns closing both stores.
 */
export async function mintDevSession(
    email: string,
    opts: {
        dbPath?: string;
        sessionDbPath?: string;
        sessionTtl?: number;
        cookieName?: string;
        port?: number;
    } = {},
): Promise<MintedSession> {
    const dbPath = opts.dbPath ?? config.dbPath;
    const sessionDbPath = opts.sessionDbPath ?? config.sessionDbPath;
    const cookieName = opts.cookieName ?? config.sessionCookie;
    const ttl = opts.sessionTtl ?? config.sessionTtl;
    const port = opts.port ?? Number(process.env.PORT ?? 4810);

    assertDevOnly([dbPath, sessionDbPath]);

    mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    mkdirSync(path.dirname(path.resolve(sessionDbPath)), { recursive: true });

    const db = createDb<Database>(dbPath);
    const sessions = new SessionStore(sessionDbPath, { ttl });

    try {
        await sessions.init();

        const normalized = email.trim().toLowerCase();
        const user = await db
            .selectFrom('users')
            .select(['id', 'email', 'display_name'])
            .where('email', '=', normalized)
            .executeTakeFirst();

        if (!user) {
            // Also try the raw email in case the seed stored mixed case
            // (UserService.register does not currently normalize).
            const raw = await db
                .selectFrom('users')
                .select(['id', 'email', 'display_name'])
                .where('email', '=', email.trim())
                .executeTakeFirst();
            if (!raw) {
                throw new Error(
                    `No user with email "${email}". Run \`bun run dev:seed\` first.`,
                );
            }
            const token = await sessions.create(raw.id);
            return {
                email: raw.email,
                userId: raw.id,
                displayName: raw.display_name,
                cookieName,
                token,
                expiresAt: new Date(Date.now() + ttl).toISOString(),
                viteOrigin: 'http://localhost:4811',
                serverOrigin: `http://localhost:${port}`,
            };
        }

        const token = await sessions.create(user.id);
        return {
            email: user.email,
            userId: user.id,
            displayName: user.display_name,
            cookieName,
            token,
            expiresAt: new Date(Date.now() + ttl).toISOString(),
            viteOrigin: 'http://localhost:4811',
            serverOrigin: `http://localhost:${port}`,
        };
    } finally {
        await sessions.close();
        await db.destroy();
    }
}

function printSession(s: MintedSession): void {
    console.log(`Signed in as ${s.displayName} <${s.email}>`);
    console.log(`User id:    ${s.userId}`);
    console.log(`Expires:    ${s.expiresAt}`);
    console.log('');
    console.log(`Cookie name:  ${s.cookieName}`);
    console.log(`Cookie value: ${s.token}`);
    console.log('');
    console.log('Playwright / CDP (Vite proxy on :4811):');
    console.log(JSON.stringify({
        name: s.cookieName,
        value: s.token,
        url: s.viteOrigin,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
    }, null, 2));
    console.log('');
    console.log('Playwright / CDP (Hono server on :4810):');
    console.log(JSON.stringify({
        name: s.cookieName,
        value: s.token,
        url: s.serverOrigin,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
    }, null, 2));
}

async function main(): Promise<void> {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: bun run dev:session -- <email>');
        console.error('Example: bun run dev:session -- anna@example.com');
        process.exit(1);
    }

    const session = await mintDevSession(email);
    printSession(session);
}

if (import.meta.main) {
    main().catch(die);
}
