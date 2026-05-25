# 017 — Teacher writes Notes on a Lesson

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can write multiple **Notes** on a **Lesson**, each tagged `private` (prep — only the author sees it) or `shared` (visible to both sides — used for "we did this" retrospectives). Notes are editable + deletable by their author. Student sees only `shared` notes.

This slice introduces the unified `notes` table (SCOPE.md) but only wires `parent_kind='lesson'` and only teacher-as-author. Student authoring + other parent kinds (training_session, student, exercise_question) come later.

## Acceptance criteria

- [ ] Migration `009_notes.ts` creates `notes(id, author_id FK users, parent_kind TEXT NOT NULL, parent_id TEXT NOT NULL, body TEXT NOT NULL, visibility TEXT NOT NULL, created_at, updated_at)` with index on `(parent_kind, parent_id)`.
- [ ] `NoteService.create(authorId, { parentKind: 'lesson', parentId, body, visibility })`: verifies the author is the teacher of the lesson. Trims body, rejects empty (HTTP 400). Returns the created `Note`.
- [ ] `NoteService.listFor(userId, { parentKind: 'lesson', parentId })`: verifies the user is the teacher OR student of the lesson (NotFoundError otherwise). Returns `shared` notes always; `private` notes only when `author_id === userId`. Sorted `created_at ASC`.
- [ ] `NoteService.update(authorId, noteId, { body?, visibility? })`: author-only (NotFoundError otherwise). Refreshes `updated_at`. Empty trimmed body → HTTP 400.
- [ ] `NoteService.delete(authorId, noteId)`: author-only (NotFoundError otherwise). Idempotent on already-gone.
- [ ] API: `POST /api/notes`, `GET /api/notes?parentKind=lesson&parentId=:id`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`. All `requireAuth()`.
- [ ] Generated client exposes `notes.create / list / update / delete` and a `Note` type.
- [ ] Web: lesson edit page (`/lektioner/:id`) gets an "Anteckningar" section — list of existing notes (body + visibility badge + author + timestamp) + textarea + visibility toggle (Prep / Delad) + Spara. Edit + Ta bort on own notes.
- [ ] Tests: service (create teacher-owned, create on stranger lesson → NotFoundError, list filters private to author, list as student hides private, update own / not author → NotFoundError, delete own / not author → NotFoundError, empty body → Error), routes (200, 404, 400).

## Blocked by

- 012 — Teacher schedules and lists own Lessons
