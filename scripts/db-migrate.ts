import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { deploymentDbPath } from './db-path';

try {
    const file = deploymentDbPath(); // DB_PATH points to the deploy snapshot.
    const db = createDb<Database>(file);
    try {
        await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
        console.log(`Migrations complete for ${file}`);
    } finally { await db.destroy(); }
} catch (error) {
    console.error(`Database migration failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
}
