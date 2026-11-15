import { sql, type Kysely } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database } from '../db/schema';
import { PlanService } from './plan.service';
import { ScheduleError } from './schedule-errors';

export interface TrainingSessionExerciseRef {
    /** Surrogate id of the `training_session_exercise` junction row. */
    id: string;
    exerciseId: string;
    name: string;
    sortOrder: number;
    sourceProgramId: string | null;
    /**
     * Static Row note copied verbatim from `program_exercise.notes` at snapshot
     * time (IA §3.10). Null when added free or when the source row had none.
     * This is instructional text, not the Note thread — that hangs off `id`.
     */
    notes: string | null;
}

export interface AttachedProgramRef {
    id: string;
    title: string;
}

export interface TrainingSession {
    id: string;
    studentId: string;
    performedAt: string;
    durationMin: number | null;
    summary: string | null;
    horseId: string | null;
    horseName: string | null;
    planId: string | null;
    planTitle: string | null;
    /**
     * The share set **as this viewer may know it** — see `visibleShareIds`.
     * The owner gets the whole audience; a shared Teacher gets only themselves.
     */
    sharedWithTeacherIds: string[];
    exercises: TrainingSessionExerciseRef[];
    programs: AttachedProgramRef[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTrainingSessionInput {
    performedAt: string;
    durationMin?: number | null;
    summary?: string | null;
    horseId?: string | null;
    planId?: string;
    programId?: string;
    /**
     * Teacher ids the Student wants this session visible to. Each must be a
     * connected Teacher (NotFoundError otherwise). Omit / empty array =
     * private to the Student.
     */
    shareWithTeacherIds?: string[];
}

export interface UpdateTrainingSessionInput {
    performedAt?: string;
    durationMin?: number | null;
    summary?: string | null;
    horseId?: string | null;
    planId?: string | null;
    /** If supplied, replaces the share set entirely. Omit to leave shares unchanged. */
    shareWithTeacherIds?: string[];
}

interface TrainingSessionRow {
    id: string;
    student_id: string;
    performed_at: string;
    duration_min: number | null;
    summary: string | null;
    horse_id: string | null;
    plan_id: string | null;
    horse_name: string | null;
    plan_title: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * The share set scoped to what a given viewer is entitled to know (IA §3.14).
 *
 * §3.10 gives a shared Teacher read access to the Session. It does not give them
 * the audience: who *else* a Student trusts with their practice log is the
 * Student's business, and §3.14 states the principle outright for Goals — read
 * the object without seeing the co-watchers. The full list on the wire leaked
 * exactly that, to every shared Teacher, on every read.
 *
 * The owner keeps the full list: they manage sharing, and the detail view seeds
 * its multi-select straight from this field.
 *
 * A shared Teacher gets **themselves, and nothing else** — not an empty array.
 * The distinction is not cosmetic. `ShareChipComponent` is driven by
 * `shared: sharedWithTeacherIds.length > 0`, so `[]` would render a session that
 * demonstrably IS shared as unshared to the very Teacher it was shared with —
 * trading a privacy leak for a false statement on the trust surface. One id is
 * also all the client can use: `sharedTeacherRecipients` already names only the
 * viewer and pushes every other id behind an unnamed `+N`, so scoping here just
 * makes the `+N` truthfully zero.
 *
 * The filter (rather than a bare `[viewerId]`) keeps it honest: a viewer who is
 * not in the set gets nothing, which is what a non-shared reader would deserve
 * if one ever reached this far past the read gate.
 */
export function visibleShareIds(shareIds: string[], ownerId: string, viewerId: string): string[] {
    if (viewerId === ownerId) return shareIds;
    return shareIds.filter((id) => id === viewerId);
}

function assertIsoDate(value: string): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) throw new Error('Training Session performedAt must be a valid ISO 8601 date');
    return new Date(parsed).toISOString();
}

function assertDuration(value: number | null | undefined): number | null {
    if (value === undefined || value === null) return null;
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error('Training Session durationMin must be a non-negative integer');
    }
    return value;
}

/**
 * Owns a Student's self-directed practice log plus per-Teacher share
 * targeting. Deep module: all input validation, ownership checks
 * (leak-safe NotFoundError on stranger access), and Relation verification
 * of share targets live here. A session with an empty share set is
 * private to the Student; rows in `training_session_share` enumerate
 * which connected Teachers may see it (gated later in 022).
 */
export class TrainingSessionService {
    private planService: PlanService;

    constructor(private db: Kysely<Database>) {
        this.planService = new PlanService(db);
    }

    async create(studentId: string, input: CreateTrainingSessionInput): Promise<TrainingSession> {
        const performedAt = assertIsoDate(input.performedAt);
        const durationMin = assertDuration(input.durationMin);
        const summary = input.summary ?? null;
        const horseId = input.horseId == null ? null : await this.assertOwnUnarchivedHorse(studentId, input.horseId);
        let planId: string | null = null;
        if (input.planId !== undefined) {
            await this.planService.assertActivePlanForStudent(input.planId, studentId);
            planId = input.planId;
        }
        const shareIds = await this.normalizeShareIds(studentId, input.shareWithTeacherIds ?? []);

        let programId: string | null = null;
        let programRows: { exercise_id: string; sort_order: number; notes: string | null }[] = [];
        if (input.programId !== undefined) {
            await this.assertProgramVisibleToStudent(studentId, input.programId);
            programId = input.programId;
            // Archived Exercises are skipped: `addExercise` refuses them
            // directly, so a Program snapshot must not smuggle them back in.
            programRows = await this.db
                .selectFrom('program_exercise')
                .innerJoin('exercises', 'exercises.id', 'program_exercise.exercise_id')
                .select([
                    'program_exercise.exercise_id as exercise_id',
                    'program_exercise.sort_order as sort_order',
                    'program_exercise.notes as notes',
                ])
                .where('program_exercise.program_id', '=', programId)
                .where('exercises.archived_at', 'is', null)
                .orderBy('program_exercise.sort_order', 'asc')
                .execute();
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.transaction().execute(async (tx) => {
            await tx.insertInto('training_sessions').values({
                id,
                student_id: studentId,
                performed_at: performedAt,
                duration_min: durationMin,
                summary,
                horse_id: horseId,
                plan_id: planId,
                created_at: now,
                updated_at: now,
            }).execute();

            if (programId) {
                await tx.insertInto('training_session_program').values({
                    training_session_id: id,
                    program_id: programId,
                    attached_at: now,
                }).execute();
                let nextOrder = 1;
                const toInsert = programRows.map((r) => ({
                    id: crypto.randomUUID(),
                    training_session_id: id,
                    exercise_id: r.exercise_id,
                    sort_order: nextOrder++,
                    notes: r.notes,
                    source_program_id: programId,
                }));
                if (toInsert.length > 0) {
                    await tx.insertInto('training_session_exercise').values(toInsert).execute();
                }
            }

            // The shares belong INSIDE the transaction. Creation is a single call
            // precisely so the client can report one honest outcome, and a
            // session that committed without its share rows would be a partial
            // success reported as a plain one — private when the Student asked
            // for it to be shared, with nothing to tell them so.
            if (shareIds.length > 0) {
                await tx.insertInto('training_session_share').values(
                    shareIds.map((teacherId) => ({
                        training_session_id: id,
                        teacher_id: teacherId,
                    })),
                ).execute();
            }
        });

        return this.loadOne(id, studentId);
    }

    async listForStudent(studentId: string): Promise<TrainingSession[]> {
        const rows = await this.db
            .selectFrom('training_sessions')
            .leftJoin('horses', 'horses.id', 'training_sessions.horse_id')
            .leftJoin('plans', 'plans.id', 'training_sessions.plan_id')
            .select([
                'training_sessions.id as id',
                'training_sessions.student_id as student_id',
                'training_sessions.performed_at as performed_at',
                'training_sessions.duration_min as duration_min',
                'training_sessions.summary as summary',
                'training_sessions.horse_id as horse_id',
                'training_sessions.plan_id as plan_id',
                'training_sessions.created_at as created_at',
                'training_sessions.updated_at as updated_at',
                'horses.name as horse_name',
                'plans.title as plan_title',
            ])
            .where('training_sessions.student_id', '=', studentId)
            .orderBy('training_sessions.performed_at', 'desc')
            .execute();
        const sharesByTs = await this.sharesByTrainingSession(rows.map((r) => r.id));
        const exByTs = await this.exercisesByTrainingSession(rows.map((r) => r.id));
        const progByTs = await this.programsByTrainingSession(rows.map((r) => r.id));
        return rows.map((r) => this.toTrainingSession(
            r as TrainingSessionRow,
            sharesByTs.get(r.id) ?? [],
            exByTs.get(r.id) ?? [],
            progByTs.get(r.id) ?? [],
            studentId,
        ));
    }

    /**
     * Sessions a Teacher may see for a connected Student. Filters to those
     * with a share row addressed to this teacher. NotFoundError if the
     * Relation doesn't exist — leak-safe parity with other teacher-side
     * lookups.
     */
    async listForTeacherOfStudent(teacherId: string, studentId: string): Promise<TrainingSession[]> {
        const rel = await this.db
            .selectFrom('relations')
            .select('id')
            .where('teacher_id', '=', teacherId)
            .where('student_id', '=', studentId)
            .executeTakeFirst();
        if (!rel) throw new NotFoundError('Student not found');

        const rows = await this.db
            .selectFrom('training_sessions')
            .innerJoin('training_session_share', 'training_session_share.training_session_id', 'training_sessions.id')
            .leftJoin('horses', 'horses.id', 'training_sessions.horse_id')
            .leftJoin('plans', 'plans.id', 'training_sessions.plan_id')
            .select([
                'training_sessions.id as id',
                'training_sessions.student_id as student_id',
                'training_sessions.performed_at as performed_at',
                'training_sessions.duration_min as duration_min',
                'training_sessions.summary as summary',
                'training_sessions.horse_id as horse_id',
                'training_sessions.plan_id as plan_id',
                'training_sessions.created_at as created_at',
                'training_sessions.updated_at as updated_at',
                'horses.name as horse_name',
                'plans.title as plan_title',
            ])
            .where('training_sessions.student_id', '=', studentId)
            .where('training_session_share.teacher_id', '=', teacherId)
            .orderBy('training_sessions.performed_at', 'desc')
            .execute();
        const sharesByTs = await this.sharesByTrainingSession(rows.map((r) => r.id));
        const exByTs = await this.exercisesByTrainingSession(rows.map((r) => r.id));
        const progByTs = await this.programsByTrainingSession(rows.map((r) => r.id));
        return rows.map((r) => this.toTrainingSession(
            r as TrainingSessionRow,
            sharesByTs.get(r.id) ?? [],
            exByTs.get(r.id) ?? [],
            progByTs.get(r.id) ?? [],
            teacherId,
        ));
    }

    /**
     * Single-session lookup for the detail route. Resolves for the owning
     * Student in all cases, and for a Teacher only when a matching share
     * row exists. NotFoundError to everyone else.
     */
    async getForViewer(userId: string, sessionId: string): Promise<TrainingSession> {
        const ts = await this.db
            .selectFrom('training_sessions')
            .select(['id', 'student_id'])
            .where('id', '=', sessionId)
            .executeTakeFirst();
        if (!ts) throw new NotFoundError('Training Session not found');
        if (ts.student_id === userId) return this.loadOne(sessionId, userId);

        const share = await this.db
            .selectFrom('training_session_share')
            .select('teacher_id')
            .where('training_session_id', '=', sessionId)
            .where('teacher_id', '=', userId)
            .executeTakeFirst();
        if (!share) throw new NotFoundError('Training Session not found');
        return this.loadOne(sessionId, userId);
    }

    async update(
        studentId: string,
        sessionId: string,
        input: UpdateTrainingSessionInput,
    ): Promise<TrainingSession> {
        const existing = await this.db
            .selectFrom('training_sessions')
            .select(['id', 'student_id'])
            .where('id', '=', sessionId)
            .executeTakeFirst();
        if (!existing || existing.student_id !== studentId) {
            throw new NotFoundError('Training Session not found');
        }

        const patch: Record<string, string | number | null> = {
            updated_at: new Date().toISOString(),
        };
        if (input.performedAt !== undefined) patch.performed_at = assertIsoDate(input.performedAt);
        if (input.durationMin !== undefined) patch.duration_min = assertDuration(input.durationMin);
        if (input.summary !== undefined) patch.summary = input.summary;
        if (input.horseId !== undefined) {
            const scheduled = await this.db.selectFrom('stable_activities').select('horse_id').where('training_session_id', '=', sessionId).executeTakeFirst();
            if (scheduled && input.horseId !== scheduled.horse_id) throw new ScheduleError('training_already_linked');
            patch.horse_id = input.horseId === null
                ? null
                : scheduled ? input.horseId : await this.assertOwnUnarchivedHorse(studentId, input.horseId);
        }
        if (input.planId !== undefined) {
            if (input.planId === null) {
                patch.plan_id = null;
            } else {
                await this.planService.assertActivePlanForStudent(input.planId, studentId);
                patch.plan_id = input.planId;
            }
        }

        await this.db.updateTable('training_sessions')
            .set(patch)
            .where('id', '=', sessionId)
            .execute();

        if (input.shareWithTeacherIds !== undefined) {
            const shareIds = await this.normalizeShareIds(studentId, input.shareWithTeacherIds);
            await this.db.deleteFrom('training_session_share')
                .where('training_session_id', '=', sessionId)
                .execute();
            await this.writeShares(sessionId, shareIds);
        }

        return this.loadOne(sessionId, studentId);
    }

    /**
     * Detach a Training Session from its Plan. Student owner only; idempotent
     * when already detached.
     */
    async detachFromPlan(actorId: string, sessionId: string): Promise<TrainingSession> {
        await this.assertTrainingSessionOwner(actorId, sessionId);
        const row = await this.db
            .selectFrom('training_sessions')
            .select(['plan_id'])
            .where('id', '=', sessionId)
            .executeTakeFirstOrThrow();
        if (row.plan_id === null) return this.loadOne(sessionId, actorId);

        await this.db.updateTable('training_sessions')
            .set({ plan_id: null, updated_at: new Date().toISOString() })
            .where('id', '=', sessionId)
            .execute();
        return this.loadOne(sessionId, actorId);
    }

    async delete(studentId: string, sessionId: string): Promise<void> {
        const existing = await this.db
            .selectFrom('training_sessions')
            .select(['id', 'student_id'])
            .where('id', '=', sessionId)
            .executeTakeFirst();
        if (!existing) return;
        if (existing.student_id !== studentId) {
            throw new NotFoundError('Training Session not found');
        }
        await this.db.deleteFrom('training_sessions')
            .where('id', '=', sessionId)
            .execute();
    }

    /**
     * Append an Exercise to a Training Session. Only the owning Student may
     * write. The Exercise must appear in the student-visible catalog (from
     * connected Teachers). Idempotent on duplicate links.
     */
    async addExercise(actorId: string, sessionId: string, exerciseId: string): Promise<void> {
        const ts = await this.assertTrainingSessionOwner(actorId, sessionId);
        await this.assertExerciseVisibleToStudent(ts.student_id, exerciseId);

        const existing = await this.db
            .selectFrom('training_session_exercise')
            .select(['training_session_id'])
            .where('training_session_id', '=', sessionId)
            .where('exercise_id', '=', exerciseId)
            .executeTakeFirst();
        if (existing) return;

        const max = await this.db
            .selectFrom('training_session_exercise')
            .select(({ fn }) => fn.max('sort_order').as('m'))
            .where('training_session_id', '=', sessionId)
            .executeTakeFirst();
        const nextOrder = ((max?.m as number | null | undefined) ?? 0) + 1;

        await this.db.insertInto('training_session_exercise').values({
            id: crypto.randomUUID(),
            training_session_id: sessionId,
            exercise_id: exerciseId,
            sort_order: nextOrder,
            notes: null,
            source_program_id: null,
        }).execute();
    }

    /**
     * Detach an Exercise from a Training Session. Student owner only;
     * idempotent when the link is already gone.
     */
    async removeExercise(actorId: string, sessionId: string, exerciseId: string): Promise<void> {
        await this.assertTrainingSessionOwner(actorId, sessionId);
        await this.db.deleteFrom('training_session_exercise')
            .where('training_session_id', '=', sessionId)
            .where('exercise_id', '=', exerciseId)
            .execute();
    }

    /**
     * Ordered Exercise list for a Training Session. Callable by the owning
     * Student or a Teacher with a share row; NotFoundError to outsiders.
     */
    async listExercises(actorId: string, sessionId: string): Promise<TrainingSessionExerciseRef[]> {
        await this.assertTrainingSessionViewer(actorId, sessionId);
        const map = await this.exercisesByTrainingSession([sessionId]);
        return map.get(sessionId) ?? [];
    }

    /**
     * Attach a Program to a Training Session. Student owner only. Idempotent
     * on the junction; appends snapshot rows for exercises not already on
     * the session, copying Program `notes` and setting `source_program_id`.
     */
    async attachProgram(actorId: string, sessionId: string, programId: string): Promise<TrainingSession> {
        const ts = await this.assertTrainingSessionOwner(actorId, sessionId);
        await this.assertProgramVisibleToStudent(ts.student_id, programId);

        // Archived Exercises are skipped — see TrainingSessionService.create.
        const programRows = await this.db
            .selectFrom('program_exercise')
            .innerJoin('exercises', 'exercises.id', 'program_exercise.exercise_id')
            .select([
                'program_exercise.exercise_id as exercise_id',
                'program_exercise.sort_order as sort_order',
                'program_exercise.notes as notes',
            ])
            .where('program_exercise.program_id', '=', programId)
            .where('exercises.archived_at', 'is', null)
            .orderBy('program_exercise.sort_order', 'asc')
            .execute();

        const existing = await this.db
            .selectFrom('training_session_exercise')
            .select(['exercise_id', 'sort_order'])
            .where('training_session_id', '=', sessionId)
            .execute();
        const existingIds = new Set(existing.map((e) => e.exercise_id));
        let nextOrder = existing.reduce((m, e) => Math.max(m, e.sort_order), 0) + 1;

        const toInsert = programRows
            .filter((r) => !existingIds.has(r.exercise_id))
            .map((r) => ({
                id: crypto.randomUUID(),
                training_session_id: sessionId,
                exercise_id: r.exercise_id,
                sort_order: nextOrder++,
                notes: r.notes,
                source_program_id: programId,
            }));

        const now = new Date().toISOString();
        await this.db.transaction().execute(async (tx) => {
            const already = await tx
                .selectFrom('training_session_program')
                .select('training_session_id')
                .where('training_session_id', '=', sessionId)
                .where('program_id', '=', programId)
                .executeTakeFirst();
            if (!already) {
                await tx.insertInto('training_session_program').values({
                    training_session_id: sessionId,
                    program_id: programId,
                    attached_at: now,
                }).execute();
            }
            if (toInsert.length > 0) {
                await tx.insertInto('training_session_exercise').values(toInsert).execute();
            }
        });

        return this.loadOne(sessionId, actorId);
    }

    /**
     * Detach a Program from a Training Session. Removes only the junction row;
     * snapshot-copied exercises are preserved. Student owner only; idempotent.
     */
    async detachProgram(actorId: string, sessionId: string, programId: string): Promise<TrainingSession> {
        await this.assertTrainingSessionOwner(actorId, sessionId);
        await this.db.deleteFrom('training_session_program')
            .where('training_session_id', '=', sessionId)
            .where('program_id', '=', programId)
            .execute();
        return this.loadOne(sessionId, actorId);
    }

    private async loadOne(sessionId: string, viewerId: string): Promise<TrainingSession> {
        const row = await this.db
            .selectFrom('training_sessions')
            .leftJoin('horses', 'horses.id', 'training_sessions.horse_id')
            .leftJoin('plans', 'plans.id', 'training_sessions.plan_id')
            .select([
                'training_sessions.id as id',
                'training_sessions.student_id as student_id',
                'training_sessions.performed_at as performed_at',
                'training_sessions.duration_min as duration_min',
                'training_sessions.summary as summary',
                'training_sessions.horse_id as horse_id',
                'training_sessions.plan_id as plan_id',
                'training_sessions.created_at as created_at',
                'training_sessions.updated_at as updated_at',
                'horses.name as horse_name',
                'plans.title as plan_title',
            ])
            .where('training_sessions.id', '=', sessionId)
            .executeTakeFirstOrThrow();
        const shares = await this.sharesByTrainingSession([sessionId]);
        const exMap = await this.exercisesByTrainingSession([sessionId]);
        const progMap = await this.programsByTrainingSession([sessionId]);
        return this.toTrainingSession(
            row as TrainingSessionRow,
            shares.get(sessionId) ?? [],
            exMap.get(sessionId) ?? [],
            progMap.get(sessionId) ?? [],
            viewerId,
        );
    }

    private async assertTrainingSessionOwner(
        actorId: string,
        sessionId: string,
    ): Promise<{ student_id: string }> {
        const ts = await this.db
            .selectFrom('training_sessions')
            .select(['id', 'student_id'])
            .where('id', '=', sessionId)
            .executeTakeFirst();
        if (!ts || ts.student_id !== actorId) {
            throw new NotFoundError('Training Session not found');
        }
        return ts;
    }

    /**
     * Read gate shared with notes: owning Student or Teacher with a share row.
     */
    private async assertTrainingSessionViewer(
        userId: string,
        sessionId: string,
    ): Promise<void> {
        const ts = await this.db
            .selectFrom('training_sessions')
            .select(['id', 'student_id'])
            .where('id', '=', sessionId)
            .executeTakeFirst();
        if (!ts) throw new NotFoundError('Training Session not found');
        if (ts.student_id === userId) return;
        const share = await this.db
            .selectFrom('training_session_share')
            .select('teacher_id')
            .where('training_session_id', '=', sessionId)
            .where('teacher_id', '=', userId)
            .executeTakeFirst();
        if (!share) throw new NotFoundError('Training Session not found');
    }

    private async assertExerciseVisibleToStudent(
        studentId: string,
        exerciseId: string,
    ): Promise<void> {
        const row = await this.db
            .selectFrom('exercises')
            .innerJoin('relations', 'relations.teacher_id', 'exercises.teacher_id')
            .select('exercises.id')
            .where('relations.student_id', '=', studentId)
            .where('exercises.id', '=', exerciseId)
            .where('exercises.archived_at', 'is', null)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Exercise not found');
    }

    private async assertProgramVisibleToStudent(
        studentId: string,
        programId: string,
    ): Promise<void> {
        const row = await this.db
            .selectFrom('programs')
            .innerJoin('relations', 'relations.teacher_id', 'programs.teacher_id')
            .select('programs.id')
            .where('relations.student_id', '=', studentId)
            .where('programs.id', '=', programId)
            .where('programs.archived_at', 'is', null)
            .executeTakeFirst();
        if (!row) throw new NotFoundError('Program not found');
    }

    private async assertOwnUnarchivedHorse(studentId: string, horseId: string): Promise<string> {
        const horse = await this.db
            .selectFrom('horses')
            .select(['id', 'student_id', 'archived_at'])
            .where('id', '=', horseId)
            .executeTakeFirst();
        if (!horse || horse.student_id !== studentId) {
            throw new NotFoundError('Horse not found');
        }
        if (horse.archived_at) throw new NotFoundError('Horse not found');
        return horseId;
    }

    private toTrainingSession(
        row: TrainingSessionRow,
        shareIds: string[],
        exercises: TrainingSessionExerciseRef[],
        programs: AttachedProgramRef[],
        /** Who is reading. Scopes the audience — see `visibleShareIds`. */
        viewerId: string,
    ): TrainingSession {
        return {
            id: row.id,
            studentId: row.student_id,
            performedAt: row.performed_at,
            durationMin: row.duration_min,
            summary: row.summary,
            horseId: row.horse_id,
            horseName: row.horse_name,
            planId: row.plan_id,
            planTitle: row.plan_title,
            sharedWithTeacherIds: visibleShareIds(shareIds, row.student_id, viewerId),
            exercises,
            programs,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    /**
     * Dedupe + verify each candidate is a connected Teacher of the Student.
     * Throws NotFoundError if any id isn't — keeps leak-safety symmetric with
     * other Relation-gated paths.
     */
    private async normalizeShareIds(studentId: string, ids: string[]): Promise<string[]> {
        const unique = Array.from(new Set(ids));
        if (unique.length === 0) return [];
        const rows = await this.db
            .selectFrom('relations')
            .select('teacher_id')
            .where('student_id', '=', studentId)
            .where('teacher_id', 'in', unique)
            .execute();
        if (rows.length !== unique.length) throw new NotFoundError('Teacher not connected');
        return unique;
    }

    private async writeShares(sessionId: string, teacherIds: string[]): Promise<void> {
        if (teacherIds.length === 0) return;
        await this.db.insertInto('training_session_share').values(
            teacherIds.map((teacherId) => ({
                training_session_id: sessionId,
                teacher_id: teacherId,
            })),
        ).execute();
    }

    private async sharesByTrainingSession(ids: string[]): Promise<Map<string, string[]>> {
        const out = new Map<string, string[]>();
        if (ids.length === 0) return out;
        const rows = await this.db
            .selectFrom('training_session_share')
            .select(['training_session_id', 'teacher_id'])
            .where('training_session_id', 'in', ids)
            .execute();
        for (const r of rows) {
            const list = out.get(r.training_session_id) ?? [];
            list.push(r.teacher_id);
            out.set(r.training_session_id, list);
        }
        return out;
    }

    private async programsByTrainingSession(
        sessionIds: string[],
    ): Promise<Map<string, AttachedProgramRef[]>> {
        const out = new Map<string, AttachedProgramRef[]>();
        if (sessionIds.length === 0) return out;
        const rows = await this.db
            .selectFrom('training_session_program')
            .innerJoin('programs', 'programs.id', 'training_session_program.program_id')
            .select([
                'training_session_program.training_session_id as training_session_id',
                'programs.id as id',
                sql<string>`coalesce(training_session_program.snapshot_title, programs.title)`.as('title'),
            ])
            .where('training_session_program.training_session_id', 'in', sessionIds)
            .orderBy('training_session_program.attached_at', 'asc')
            .orderBy(sql`training_session_program.rowid`, 'asc')
            .execute();
        for (const r of rows) {
            const list = out.get(r.training_session_id) ?? [];
            list.push({ id: r.id, title: r.title });
            out.set(r.training_session_id, list);
        }
        return out;
    }

    private async exercisesByTrainingSession(
        sessionIds: string[],
    ): Promise<Map<string, TrainingSessionExerciseRef[]>> {
        const out = new Map<string, TrainingSessionExerciseRef[]>();
        if (sessionIds.length === 0) return out;
        const rows = await this.db
            .selectFrom('training_session_exercise')
            .innerJoin('exercises', 'exercises.id', 'training_session_exercise.exercise_id')
            .select([
                'training_session_exercise.id as id',
                'training_session_exercise.training_session_id as training_session_id',
                'training_session_exercise.sort_order as sort_order',
                'training_session_exercise.source_program_id as source_program_id',
                'training_session_exercise.notes as notes',
                'exercises.id as exercise_id',
                sql<string>`coalesce(training_session_exercise.snapshot_name, exercises.name)`.as('name'),
            ])
            .where('training_session_exercise.training_session_id', 'in', sessionIds)
            .orderBy('training_session_exercise.training_session_id')
            .orderBy('training_session_exercise.sort_order', 'asc')
            .execute();
        for (const r of rows) {
            const list = out.get(r.training_session_id) ?? [];
            list.push({
                id: r.id,
                exerciseId: r.exercise_id,
                name: r.name,
                sortOrder: r.sort_order,
                sourceProgramId: r.source_program_id,
                notes: r.notes,
            });
            out.set(r.training_session_id, list);
        }
        return out;
    }
}
