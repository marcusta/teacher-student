/**
 * Shared safety gate for local-only agent tooling (`dev-seed`, `dev-session`).
 *
 * Both scripts refuse to run unless:
 *   1. `NODE_ENV` is not `production`
 *   2. every given DB path resolves to a local SQLite file under the project cwd
 *
 * Remote schemes (`postgres://`, `https://`, …) and absolute paths outside the
 * repo are rejected so a mis-set env var cannot mint sessions against a shared
 * or production database.
 */

import * as path from 'node:path';

export class DevGuardError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DevGuardError';
    }
}

/**
 * True when `dbPath` looks like a local SQLite file that lives under `cwd`
 * (default: `process.cwd()`). `:memory:` is rejected — these scripts persist.
 */
export function isLocalSqlitePath(dbPath: string, cwd: string = process.cwd()): boolean {
    const trimmed = dbPath.trim();
    if (trimmed.length === 0 || trimmed === ':memory:') return false;

    // Any URL-like scheme (`postgres://`, `file://`, `https://`, …) is remote
    // or ambiguous — only bare filesystem paths are allowed.
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false;

    if (!/\.sqlite3?$/i.test(trimmed)) return false;

    const resolved = path.resolve(cwd, trimmed);
    const root = path.resolve(cwd);
    return resolved === root || resolved.startsWith(root + path.sep);
}

/**
 * Throw {@link DevGuardError} when the environment is not safe for agent tooling.
 *
 * @param dbPaths - Absolute or relative SQLite paths that will be opened
 * @param opts.env - Injectable `NODE_ENV` (defaults to `process.env.NODE_ENV`)
 * @param opts.cwd - Injectable project root (defaults to `process.cwd()`)
 */
export function assertDevOnly(
    dbPaths: string[],
    opts: { env?: string | undefined; cwd?: string } = {},
): void {
    const nodeEnv = opts.env ?? process.env.NODE_ENV;
    if (nodeEnv === 'production') {
        throw new DevGuardError('Refusing to run: NODE_ENV is production');
    }

    const cwd = opts.cwd ?? process.cwd();
    for (const dbPath of dbPaths) {
        if (!isLocalSqlitePath(dbPath, cwd)) {
            throw new DevGuardError(
                `Refusing to run: not a local project SQLite path (${dbPath})`,
            );
        }
    }
}

/** Print the error and exit 1. For script entrypoints only. */
export function die(err: unknown): never {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exit(1);
}
