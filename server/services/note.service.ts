import type { Kysely, Selectable } from 'kysely';
import { NotFoundError } from '@basics/core/server/auth';
import type { Database, NoteParentKind, NoteVisibility, NotesTable } from '../db/schema';

export interface Note {
    id: string;
    authorId: string;
    authorDisplayName: string;
    parentKind: NoteParentKind;
    parentId: string;
    body: string;
    visibility: NoteVisibility;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteInput {
    parentKind: NoteParentKind;
    parentId: string;
    body: string;
    visibility: NoteVisibility;
}

export interface UpdateNoteInput {
    body?: string;
    visibility?: NoteVisibility;
}

function toNote(row: Selectable<NotesTable> & { author_display_name: string }): Note {
    return {
        id: row.id,
        authorId: row.author_id,
        authorDisplayName: row.author_display_name,
        parentKind: row.parent_kind,
        parentId: row.parent_id,
        body: row.body,
        visibility: row.visibility,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Owns the unified Note feed. Deep module: callers pass `(authorId, ...)`
 * for writes and `(userId, ...)` for reads; all parent-kind dispatching,
 * authorization (Lesson teacher/student membership, author-only mutation),
 * body trimming, and visibility filtering live here.
 *
 * MVP wires only `parent_kind='lesson'` and only teacher authoring.
 * Student authoring is unlocked in slice 018; other parent kinds land
 * with their owning features.
 */
export class NoteService {
    constructor(private db: Kysely<Database>) {}

    async create(authorId: string, input: CreateNoteInput): Promise<Note> {
        await this.assertCanAuthor(authorId, input.parentKind, input.parentId);
        const body = input.body.trim();
        if (body.length === 0) throw new Error('Note body must not be empty');

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.insertInto('notes').values({
            id,
            author_id: authorId,
            parent_kind: input.parentKind,
            parent_id: input.parentId,
            body,
            visibility: input.visibility,
            created_at: now,
            updated_at: now,
        }).execute();

        return this.loadOne(id);
    }

    /**
     * List Notes attached to `(parentKind, parentId)` visible to `userId`.
     * Always returns `shared` notes; includes `private` only when authored
     * by `userId`. Throws NotFoundError to outsiders so the parent's
     * existence doesn't leak.
     */
    async listFor(
        userId: string,
        parent: { parentKind: NoteParentKind; parentId: string },
    ): Promise<Note[]> {
        await this.assertCanRead(userId, parent.parentKind, parent.parentId);
        const rows = await this.db
            .selectFrom('notes')
            .innerJoin('users', 'users.id', 'notes.author_id')
            .select([
                'notes.id as id',
                'notes.author_id as author_id',
                'notes.parent_kind as parent_kind',
                'notes.parent_id as parent_id',
                'notes.body as body',
                'notes.visibility as visibility',
                'notes.created_at as created_at',
                'notes.updated_at as updated_at',
                'users.display_name as author_display_name',
            ])
            .where('notes.parent_kind', '=', parent.parentKind)
            .where('notes.parent_id', '=', parent.parentId)
            .where((eb) => eb.or([
                eb('notes.visibility', '=', 'shared'),
                eb('notes.author_id', '=', userId),
            ]))
            .orderBy('notes.created_at', 'asc')
            .execute();
        return rows.map(toNote);
    }

    async update(authorId: string, noteId: string, input: UpdateNoteInput): Promise<Note> {
        const row = await this.db
            .selectFrom('notes')
            .select(['id', 'author_id'])
            .where('id', '=', noteId)
            .executeTakeFirst();
        if (!row || row.author_id !== authorId) {
            throw new NotFoundError('Note not found');
        }
        const patch: Record<string, string> = { updated_at: new Date().toISOString() };
        if (input.body !== undefined) {
            const body = input.body.trim();
            if (body.length === 0) throw new Error('Note body must not be empty');
            patch.body = body;
        }
        if (input.visibility !== undefined) patch.visibility = input.visibility;

        await this.db.updateTable('notes')
            .set(patch)
            .where('id', '=', noteId)
            .execute();
        return this.loadOne(noteId);
    }

    async delete(authorId: string, noteId: string): Promise<void> {
        const row = await this.db
            .selectFrom('notes')
            .select(['id', 'author_id'])
            .where('id', '=', noteId)
            .executeTakeFirst();
        if (!row) return; // idempotent on already-gone
        if (row.author_id !== authorId) throw new NotFoundError('Note not found');
        await this.db.deleteFrom('notes').where('id', '=', noteId).execute();
    }

    /**
     * Author-side authorization. For `lesson` either participant (teacher
     * or student) may author; visibility selects the audience.
     */
    private async assertCanAuthor(
        userId: string,
        parentKind: NoteParentKind,
        parentId: string,
    ): Promise<void> {
        if (parentKind === 'lesson') {
            const lesson = await this.db
                .selectFrom('lessons')
                .select(['id', 'teacher_id', 'student_id'])
                .where('id', '=', parentId)
                .executeTakeFirst();
            if (!lesson || (lesson.teacher_id !== userId && lesson.student_id !== userId)) {
                throw new NotFoundError('Lesson not found');
            }
            return;
        }
        if (parentKind === 'training_session') {
            await this.assertTrainingSessionViewer(userId, parentId);
            return;
        }
        throw new NotFoundError('Unsupported parent kind');
    }

    /**
     * Shared author/read gate for training_session notes. The owning
     * Student always passes; a connected Teacher passes only when a
     * `training_session_share` row addresses them. Leak-safe NotFoundError
     * otherwise.
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

    /** Read-side authorization. Lessons: either teacher or student. */
    private async assertCanRead(
        userId: string,
        parentKind: NoteParentKind,
        parentId: string,
    ): Promise<void> {
        if (parentKind === 'lesson') {
            const lesson = await this.db
                .selectFrom('lessons')
                .select(['id', 'teacher_id', 'student_id'])
                .where('id', '=', parentId)
                .executeTakeFirst();
            if (!lesson || (lesson.teacher_id !== userId && lesson.student_id !== userId)) {
                throw new NotFoundError('Lesson not found');
            }
            return;
        }
        if (parentKind === 'training_session') {
            await this.assertTrainingSessionViewer(userId, parentId);
            return;
        }
        throw new NotFoundError('Unsupported parent kind');
    }

    private async loadOne(id: string): Promise<Note> {
        const row = await this.db
            .selectFrom('notes')
            .innerJoin('users', 'users.id', 'notes.author_id')
            .select([
                'notes.id as id',
                'notes.author_id as author_id',
                'notes.parent_kind as parent_kind',
                'notes.parent_id as parent_id',
                'notes.body as body',
                'notes.visibility as visibility',
                'notes.created_at as created_at',
                'notes.updated_at as updated_at',
                'users.display_name as author_display_name',
            ])
            .where('notes.id', '=', id)
            .executeTakeFirstOrThrow();
        return toNote(row);
    }
}
