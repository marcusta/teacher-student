import { afterEach, expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { sql } from 'kysely';
import { scheduleFixture } from '../server/testing/schedule';
import deploy from '../deploy.json';
import pkg from '../package.json';

const root = path.join(import.meta.dir, '..');
const folders: string[] = [];
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });

function temporary() {
    const folder = mkdtempSync(path.join(tmpdir(), 'teacher-student-deploy-'));
    folders.push(folder);
    return { folder, file: path.join(folder, 'snapshot.sqlite') };
}

async function command(script: string, file: string, folder: string) {
    const child = Bun.spawn([process.execPath, 'run', script], {
        cwd: root,
        env: { ...process.env, NODE_ENV: 'production', DB_PATH: file,
            SESSION_DB_PATH: path.join(folder, 'sessions.sqlite'), OBS_DB_PATH: path.join(folder, 'obs.sqlite') },
        stdout: 'pipe', stderr: 'pipe',
    });
    const [code, stdout, stderr] = await Promise.all([
        child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ]);
    return { code, output: stdout + stderr };
}

test('deploy config wires the application database and its migration directory to real commands', () => {
    expect(deploy).toHaveProperty('database', {
        path: 'data/app.sqlite', migrate: 'bun run db:migrate', validate: 'bun run db:health',
        migrationsDir: 'server/db/migrations',
    });
    expect(pkg.scripts).toHaveProperty('db:migrate', 'bun scripts/db-migrate.ts');
    expect(pkg.scripts).toHaveProperty('db:health', 'bun scripts/db-health.ts');
});

for (const script of ['db:migrate', 'db:health']) {
    test(`${script} requires an explicit DB_PATH and never creates a missing database`, async () => {
        const { folder, file } = temporary();
        const missingEnv = await command(script, '', folder);
        expect(missingEnv.code).not.toBe(0);
        expect(missingEnv.output).toContain('DB_PATH is required');
        const missingFile = await command(script, file, folder);
        expect(missingFile.code).not.toBe(0);
        expect(missingFile.output).toContain('existing SQLite file');
        expect(existsSync(file)).toBe(false);
    });
}

test('migration and health commands upgrade only the supplied snapshot and preserve weekly activities', async () => {
    const { folder, file } = temporary();
    const c = await scheduleFixture();
    try {
        await c.scheduleTemplateService.routines(c.admin.id, c.stable.id, {
            requestId: 'deploy-preserves-week', startDate: '2026-11-16',
            typeIds: ['morning_feed', 'turnout', 'lunch_feed', 'bring_in', 'evening_feed'].map(c.type),
        });
        await sql`VACUUM INTO ${file}`.execute(c.db);
    } finally { await c.db.destroy(); }

    const old = new Database(file);
    // Recreate the schema immediately before migration 031.
    old.exec(`ALTER TABLE training_session_exercise DROP COLUMN snapshot_name;
        ALTER TABLE training_session_exercise DROP COLUMN snapshot_description;
        ALTER TABLE training_session_program DROP COLUMN snapshot_title;
        DELETE FROM kysely_migration WHERE name = '031_scheduled_training_snapshots';`);
    const before = old.query('SELECT * FROM stable_activities ORDER BY id').all();
    expect(before).toHaveLength(35);
    old.close();

    const pending = await command('db:health', file, folder);
    expect(pending.code).not.toBe(0);
    expect(pending.output).toContain('031_scheduled_training_snapshots');

    for (let attempt = 0; attempt < 2; attempt++) {
        const migrated = await command('db:migrate', file, folder);
        expect(migrated.output).toContain(file);
        expect(migrated.code).toBe(0);
        const healthy = await command('db:health', file, folder);
        expect(healthy.output).toContain(file);
        expect(healthy.code).toBe(0);
    }
    const checked = new Database(file, { readonly: true });
    try {
        expect(checked.query('SELECT * FROM stable_activities ORDER BY id').all()).toEqual(before);
        expect(checked.query("SELECT name FROM kysely_migration WHERE name = '031_scheduled_training_snapshots'").get()).not.toBeNull();
        expect(() => checked.query('SELECT snapshot_name, snapshot_description FROM training_session_exercise').all()).not.toThrow();
        expect(() => checked.query('SELECT snapshot_title FROM training_session_program').all()).not.toThrow();
    } finally { checked.close(); }
    expect(existsSync(path.join(folder, 'sessions.sqlite'))).toBe(false);
    expect(existsSync(path.join(folder, 'obs.sqlite'))).toBe(false);
});

test('health validation rejects an empty database, missing tables and broken foreign keys', async () => {
    const { folder, file } = temporary();
    new Database(file).close();
    expect((await command('db:health', file, folder)).code).not.toBe(0);
    expect((await command('db:migrate', file, folder)).code).toBe(0);
    const broken = new Database(file);
    broken.exec(`INSERT INTO horses (id, student_id, name) VALUES ('orphan', 'missing-user', 'Saga')`);
    broken.close();
    const foreignKey = await command('db:health', file, folder);
    expect(foreignKey.code).not.toBe(0);
    expect(foreignKey.output).toContain('foreign key');

    const missing = new Database(file);
    missing.exec("DELETE FROM horses; DROP TABLE stable_activities");
    missing.close();
    const missingTable = await command('db:health', file, folder);
    expect(missingTable.code).not.toBe(0);
    expect(missingTable.output).toContain('stable_activities');
});
