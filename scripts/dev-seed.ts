/**
 * Dev-only seed: realistic Swedish riding data that lights up all four Hem cards.
 *
 * Usage:  bun run dev:seed
 *
 * Primary login user: anna@example.com (student who also teaches).
 * Pair with `bun run dev:session -- anna@example.com` to mint a session cookie
 * without ever touching a password.
 *
 * Idempotent: re-running fills any missing pieces and leaves existing rows alone.
 * Guarded by `assertDevOnly` — refuses production and non-local DB paths.
 */

import { mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import { config } from '@basics/core/server/config';
import type { Kysely } from 'kysely';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { DuplicateEmailError } from '../server/services/user.service';
import { assertDevOnly, die } from './dev-guard';
import { seedDevSchedule } from './dev-schedule-seed';

type Services = ReturnType<typeof createServices>;

/** Well-known emails — stable for agent docs and re-runs. */
export const DEV_STUDENT_EMAIL = 'anna@example.com';
export const DEV_TEACHER_EMAIL = 'lisa@example.com';
export const DEV_JUNIOR_EMAIL = 'maja@example.com';

/** Password is hashed into the row but never printed or used by agents. */
const DEV_PASSWORD = 'dev-only-not-for-login';

const PLAN_TITLE = 'Sommarträning 2026';
const GOAL_TITLE = 'Stabil galopp i ytterspår';
const HORSE_NAME = 'Saga';
const EXERCISE_NAMES = ['Övergångar skritt–trav', 'Voltarbete', 'Galoppfattning'] as const;
const SHARED_NOTE_BODY =
    'Fint arbete i voltarna i dag — håll blicken längre fram i nästa galopp.';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DevSeedResult {
    stableId: string;
    student: { id: string; email: string; displayName: string };
    teacher: { id: string; email: string; displayName: string };
    junior: { id: string; email: string; displayName: string };
    lessonId: string;
    planId: string;
    goalId: string;
    created: string[];
}

async function findUserByEmail(db: Kysely<Database>, email: string) {
    return db
        .selectFrom('users')
        .select(['id', 'email', 'display_name'])
        .where('email', '=', email)
        .executeTakeFirst();
}

async function ensureUser(
    svc: Services,
    email: string,
    displayName: string,
    created: string[],
): Promise<{ id: string; email: string; displayName: string }> {
    const existing = await findUserByEmail(svc.db, email);
    if (existing) {
        return { id: existing.id, email: existing.email, displayName: existing.display_name };
    }
    try {
        const user = await svc.userService.register({ email, password: DEV_PASSWORD, displayName });
        created.push(`user ${email}`);
        return user;
    } catch (err) {
        if (err instanceof DuplicateEmailError) {
            const raced = await findUserByEmail(svc.db, email);
            if (raced) {
                return { id: raced.id, email: raced.email, displayName: raced.display_name };
            }
        }
        throw err;
    }
}

async function ensureRelation(
    svc: Services,
    teacherId: string,
    student: { id: string; email: string },
    created: string[],
    label: string,
): Promise<void> {
    const existing = await svc.db
        .selectFrom('relations')
        .select('id')
        .where('teacher_id', '=', teacherId)
        .where('student_id', '=', student.id)
        .executeTakeFirst();
    if (existing) return;

    const inv = await svc.invitationService.createInvitation(teacherId, student.email);
    await svc.invitationService.acceptInvitation(inv.id, student.id, student.email);
    created.push(`relation ${label}`);
}

async function ensureHorse(svc: Services, studentId: string, created: string[]): Promise<string> {
    const existing = await svc.db
        .selectFrom('horses')
        .select('id')
        .where('student_id', '=', studentId)
        .where('name', '=', HORSE_NAME)
        .where('archived_at', 'is', null)
        .executeTakeFirst();
    if (existing) return existing.id;

    const horse = await svc.horseService.create(studentId, { name: HORSE_NAME });
    created.push(`horse ${HORSE_NAME}`);
    return horse.id;
}

async function ensureExercises(
    svc: Services,
    teacherId: string,
    created: string[],
): Promise<string[]> {
    const ids: string[] = [];
    for (const name of EXERCISE_NAMES) {
        const existing = await svc.db
            .selectFrom('exercises')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('name', '=', name)
            .where('archived_at', 'is', null)
            .executeTakeFirst();
        if (existing) {
            ids.push(existing.id);
            continue;
        }
        const ex = await svc.exerciseService.create(teacherId, {
            name,
            description: `Övning för ${name.toLowerCase()}.`,
        });
        created.push(`exercise ${name}`);
        ids.push(ex.id);
    }
    return ids;
}

async function ensurePlan(
    svc: Services,
    studentId: string,
    teacherId: string,
    created: string[],
): Promise<string> {
    const existing = await svc.db
        .selectFrom('plans')
        .select('id')
        .where('student_id', '=', studentId)
        .where('title', '=', PLAN_TITLE)
        .where('status', '=', 'active')
        .executeTakeFirst();
    if (existing) return existing.id;

    const start = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 90 * DAY_MS).toISOString().slice(0, 10);
    const plan = await svc.planService.create(studentId, {
        title: PLAN_TITLE,
        description: 'Fokus på balans, övergångar och galopp på ytterspår.',
        startDate: start,
        endDate: end,
        primaryTeacherId: teacherId,
    });
    created.push(`plan ${PLAN_TITLE}`);
    return plan.id;
}

async function ensureGoal(svc: Services, studentId: string, created: string[]): Promise<string> {
    const existing = await svc.db
        .selectFrom('goal')
        .select('id')
        .where('student_id', '=', studentId)
        .where('title', '=', GOAL_TITLE)
        .where('status', '=', 'active')
        .executeTakeFirst();
    if (existing) return existing.id;

    // Inside the dashboard's 30-day "nearing target" horizon.
    const targetDate = new Date(Date.now() + 14 * DAY_MS).toISOString().slice(0, 10);
    const goal = await svc.goalService.create(studentId, {
        title: GOAL_TITLE,
        description: 'Kunna hålla jämn galopp ett varv utan att falla in.',
        targetDate,
    });
    created.push(`goal ${GOAL_TITLE}`);
    return goal.id;
}

async function ensureUpcomingLesson(
    svc: Services,
    teacherId: string,
    studentId: string,
    horseId: string,
    planId: string,
    exerciseIds: string[],
    created: string[],
): Promise<string> {
    const nowIso = new Date().toISOString();
    const existing = await svc.db
        .selectFrom('lessons')
        .select('id')
        .where('teacher_id', '=', teacherId)
        .where('student_id', '=', studentId)
        .where('status', '=', 'planned')
        .where('scheduled_at', '>=', nowIso)
        .orderBy('scheduled_at', 'asc')
        .executeTakeFirst();

    if (existing) {
        await svc.lessonService.update(teacherId, existing.id, { horseId, planId });
        for (const exerciseId of exerciseIds) {
            await svc.lessonService.addExercise(teacherId, existing.id, exerciseId);
        }
        return existing.id;
    }

    // Next Wednesday-ish afternoon — three days out at 15:00 UTC ≈ 17:00 Swedish summer time.
    const scheduled = new Date(Date.now() + 3 * DAY_MS);
    scheduled.setUTCHours(15, 0, 0, 0);

    const lesson = await svc.lessonService.create(teacherId, {
        studentId,
        scheduledAt: scheduled.toISOString(),
        planId,
    });
    await svc.lessonService.update(teacherId, lesson.id, { horseId });
    for (const exerciseId of exerciseIds) {
        await svc.lessonService.addExercise(teacherId, lesson.id, exerciseId);
    }
    created.push(`upcoming lesson ${lesson.id}`);
    return lesson.id;
}

async function ensureSharedNote(
    svc: Services,
    teacherId: string,
    lessonId: string,
    created: string[],
): Promise<void> {
    const existing = await svc.db
        .selectFrom('notes')
        .select('id')
        .where('parent_kind', '=', 'lesson')
        .where('parent_id', '=', lessonId)
        .where('author_id', '=', teacherId)
        .where('visibility', '=', 'shared')
        .executeTakeFirst();
    if (existing) return;

    await svc.noteService.create(teacherId, {
        parentKind: 'lesson',
        parentId: lessonId,
        body: SHARED_NOTE_BODY,
        visibility: 'shared',
    });
    created.push('shared lesson note');
}

/**
 * Completed lesson Anna taught Maja — no note from Anna → awaitingFeedback card.
 */
async function ensureAwaitingLesson(
    svc: Services,
    teacherId: string,
    studentId: string,
    created: string[],
): Promise<void> {
    const existing = await svc.db
        .selectFrom('lessons')
        .select('id')
        .where('teacher_id', '=', teacherId)
        .where('student_id', '=', studentId)
        .where('status', '=', 'completed')
        .executeTakeFirst();
    if (existing) return;

    const performed = new Date(Date.now() - 2 * DAY_MS);
    performed.setUTCHours(14, 0, 0, 0);

    const lesson = await svc.lessonService.create(teacherId, {
        studentId,
        scheduledAt: performed.toISOString(),
    });
    await svc.lessonService.transition(teacherId, lesson.id, 'completed');
    created.push(`completed lesson awaiting feedback ${lesson.id}`);
}

/**
 * Seed the four Hem cards for `anna@example.com`:
 *   nextLesson · latestFeedback · awaitingFeedback · riding (plan + goal)
 */
export async function seedDevData(svc: Services): Promise<DevSeedResult> {
    const created: string[] = [];

    const student = await ensureUser(svc, DEV_STUDENT_EMAIL, 'Anna Andersson', created);
    const teacher = await ensureUser(svc, DEV_TEACHER_EMAIL, 'Lisa Lindgren', created);
    const junior = await ensureUser(svc, DEV_JUNIOR_EMAIL, 'Maja Mattsson', created);

    // Lisa teaches Anna (Anna rides); Anna teaches Maja (Anna teaches → awaiting card).
    await ensureRelation(svc, teacher.id, student, created, 'Lisa→Anna');
    await ensureRelation(svc, student.id, junior, created, 'Anna→Maja');

    const horseId = await ensureHorse(svc, student.id, created);
    const exerciseIds = await ensureExercises(svc, teacher.id, created);
    const planId = await ensurePlan(svc, student.id, teacher.id, created);
    const goalId = await ensureGoal(svc, student.id, created);
    const lessonId = await ensureUpcomingLesson(
        svc, teacher.id, student.id, horseId, planId, exerciseIds, created,
    );
    await ensureSharedNote(svc, teacher.id, lessonId, created);
    await ensureAwaitingLesson(svc, student.id, junior.id, created);

    const stableId = await seedDevSchedule(svc, student, teacher, junior, horseId, exerciseIds, created);

    return { student, teacher, junior, lessonId, planId, goalId, stableId, created };
}

async function main(): Promise<void> {
    assertDevOnly([config.dbPath]);

    mkdirSync(path.dirname(path.resolve(config.dbPath)), { recursive: true });
    const db = createDb<Database>(config.dbPath);
    try {
        await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
        const svc = createServices(db);
        const result = await seedDevData(svc);

        console.log('Dev seed ready.');
        console.log(`  Primary user:  ${result.student.email}  (${result.student.displayName})`);
        console.log(`  Teacher:       ${result.teacher.email}  (${result.teacher.displayName})`);
        console.log(`  Junior:        ${result.junior.email}  (${result.junior.displayName})`);
        console.log(`  Weekly view:   http://localhost:4811/veckoschema/${result.stableId}`);
        if (result.created.length === 0) {
            console.log('  (already seeded — nothing new created)');
        } else {
            console.log(`  Created: ${result.created.join(', ')}`);
        }
        console.log('');
        console.log('Mint a session cookie (no password):');
        console.log(`  bun run dev:session -- ${result.student.email}`);
    } finally {
        await db.destroy();
    }
}

if (import.meta.main) {
    main().catch(die);
}
