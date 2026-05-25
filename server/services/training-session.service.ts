import type { Kysely } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database } from '../db/schema';

export interface TrainingSession {
    id: string;
    studentId: string;
    performedAt: string;
    durationMin: number | null;
    summary: string | null;
    horseId: string | null;
    horseName: string | null;
    sharedWithTeacherIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTrainingSessionInput {
    performedAt: string;
    durationMin?: number | null;
    summary?: string | null;
    horseId?: string | null;
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
    horse_name: string | null;
    created_at: string;
    updated_at: string;
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
    constructor(private db: Kysely<Database>) {}

    async create(studentId: string, input: CreateTrainingSessionInput): Promise<TrainingSession> {
        const performedAt = assertIsoDate(input.performedAt);
        const durationMin = assertDuration(input.durationMin);
        const summary = input.summary ?? null;
        const horseId = input.horseId == null ? null : await this.assertOwnUnarchivedHorse(studentId, input.horseId);
        const shareIds = await this.normalizeShareIds(studentId, input.shareWithTeacherIds ?? []);

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.insertInto('training_sessions').values({
            id,
            student_id: studentId,
            performed_at: performedAt,
            duration_min: durationMin,
            summary,
            horse_id: horseId,
            created_at: now,
            updated_at: now,
        }).execute();
        await this.writeShares(id, shareIds);

        return this.loadOne(id);
    }

    async listForStudent(studentId: string): Promise<TrainingSession[]> {
        const rows = await this.db
            .selectFrom('training_sessions')
            .leftJoin('horses', 'horses.id', 'training_sessions.horse_id')
            .select([
                'training_sessions.id as id',
                'training_sessions.student_id as student_id',
                'training_sessions.performed_at as performed_at',
                'training_sessions.duration_min as duration_min',
                'training_sessions.summary as summary',
                'training_sessions.horse_id as horse_id',
                'training_sessions.created_at as created_at',
                'training_sessions.updated_at as updated_at',
                'horses.name as horse_name',
            ])
            .where('training_sessions.student_id', '=', studentId)
            .orderBy('training_sessions.performed_at', 'desc')
            .execute();
        const sharesByTs = await this.sharesByTrainingSession(rows.map((r) => r.id));
        return rows.map((r) => this.toTrainingSession(
            r as TrainingSessionRow,
            sharesByTs.get(r.id) ?? [],
        ));
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
            patch.horse_id = input.horseId === null
                ? null
                : await this.assertOwnUnarchivedHorse(studentId, input.horseId);
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

        return this.loadOne(sessionId);
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

    private async loadOne(sessionId: string): Promise<TrainingSession> {
        const row = await this.db
            .selectFrom('training_sessions')
            .leftJoin('horses', 'horses.id', 'training_sessions.horse_id')
            .select([
                'training_sessions.id as id',
                'training_sessions.student_id as student_id',
                'training_sessions.performed_at as performed_at',
                'training_sessions.duration_min as duration_min',
                'training_sessions.summary as summary',
                'training_sessions.horse_id as horse_id',
                'training_sessions.created_at as created_at',
                'training_sessions.updated_at as updated_at',
                'horses.name as horse_name',
            ])
            .where('training_sessions.id', '=', sessionId)
            .executeTakeFirstOrThrow();
        const shares = await this.sharesByTrainingSession([sessionId]);
        return this.toTrainingSession(row as TrainingSessionRow, shares.get(sessionId) ?? []);
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

    private toTrainingSession(row: TrainingSessionRow, shareIds: string[]): TrainingSession {
        return {
            id: row.id,
            studentId: row.student_id,
            performedAt: row.performed_at,
            durationMin: row.duration_min,
            summary: row.summary,
            horseId: row.horse_id,
            horseName: row.horse_name,
            sharedWithTeacherIds: shareIds,
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
}
