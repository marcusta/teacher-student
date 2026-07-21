import { test, expect, describe } from 'bun:test';
import * as path from 'node:path';
import { assertDevOnly, isLocalSqlitePath, DevGuardError } from './dev-guard';
import { seedDevData, DEV_STUDENT_EMAIL } from './dev-seed';
import { createTestDb } from '../server/testing/db';

const CWD = path.join(import.meta.dir, '..');

describe('isLocalSqlitePath', () => {
    test('accepts relative project sqlite paths', () => {
        expect(isLocalSqlitePath('./data/app.sqlite', CWD)).toBe(true);
        expect(isLocalSqlitePath('data/sessions.sqlite', CWD)).toBe(true);
        expect(isLocalSqlitePath('data/app.sqlite3', CWD)).toBe(true);
    });

    test('accepts absolute paths under cwd', () => {
        expect(isLocalSqlitePath(path.join(CWD, 'data/app.sqlite'), CWD)).toBe(true);
    });

    test('rejects :memory:, empty, remote schemes, and paths outside cwd', () => {
        expect(isLocalSqlitePath(':memory:', CWD)).toBe(false);
        expect(isLocalSqlitePath('', CWD)).toBe(false);
        expect(isLocalSqlitePath('postgres://localhost/db', CWD)).toBe(false);
        expect(isLocalSqlitePath('https://example.com/db.sqlite', CWD)).toBe(false);
        expect(isLocalSqlitePath('file:///tmp/app.sqlite', CWD)).toBe(false);
        expect(isLocalSqlitePath('/tmp/app.sqlite', CWD)).toBe(false);
        expect(isLocalSqlitePath('./data/app.db', CWD)).toBe(false);
    });
});

describe('assertDevOnly', () => {
    test('throws when NODE_ENV is production', () => {
        expect(() => assertDevOnly(['./data/app.sqlite'], { env: 'production', cwd: CWD }))
            .toThrow(DevGuardError);
    });

    test('throws when a path is not local project sqlite', () => {
        expect(() => assertDevOnly(['postgres://x/y'], { env: 'development', cwd: CWD }))
            .toThrow(/not a local project SQLite path/);
    });

    test('passes for local paths outside production', () => {
        expect(() => assertDevOnly(
            ['./data/app.sqlite', './data/sessions.sqlite'],
            { env: 'development', cwd: CWD },
        )).not.toThrow();
        expect(() => assertDevOnly(
            ['./data/app.sqlite'],
            { env: undefined, cwd: CWD },
        )).not.toThrow();
    });
});

describe('seedDevData', () => {
    test('lights up all four Hem cards for the primary student', async () => {
        const svc = await createTestDb();
        const result = await seedDevData(svc);

        expect(result.student.email).toBe(DEV_STUDENT_EMAIL);
        expect(result.created.length).toBeGreaterThan(0);

        const view = await svc.dashboardService.get(
            result.student.id,
            result.student.email,
            new Date(),
        );

        expect(view.capabilities).toEqual({ teaches: true, rides: true });
        expect(view.nextLesson).not.toBeNull();
        expect(view.nextLesson!.horseName).toBe('Saga');
        expect(view.nextLesson!.exerciseCount).toBeGreaterThanOrEqual(3);
        expect(view.latestFeedback).not.toBeNull();
        expect(view.latestFeedback!.authorDisplayName).toBe('Lisa Lindgren');
        expect(view.awaitingFeedback.length).toBeGreaterThanOrEqual(1);
        expect(view.activePlans.map((p) => p.title)).toContain('Sommarträning 2026');
        expect(view.goalsNearingTarget.map((g) => g.title)).toContain('Stabil galopp i ytterspår');
    });

    test('is idempotent on a second run', async () => {
        const svc = await createTestDb();
        const first = await seedDevData(svc);
        const second = await seedDevData(svc);

        expect(second.student.id).toBe(first.student.id);
        expect(second.lessonId).toBe(first.lessonId);
        expect(second.planId).toBe(first.planId);
        expect(second.goalId).toBe(first.goalId);
        expect(second.created).toEqual([]);
    });
});
