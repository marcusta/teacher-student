import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/** Deploy supplies a snapshot; a typo must not create or select another database. */
export function deploymentDbPath(): string {
    const configured = process.env.DB_PATH;
    if (!configured?.trim()) throw new Error('DB_PATH is required. Set it to the deployment snapshot path.');
    const file = resolve(configured);
    if (!existsSync(file) || !statSync(file).isFile()) {
        throw new Error(`DB_PATH must point to an existing SQLite file: ${file}`);
    }
    return file;
}
