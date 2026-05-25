# 019 — Student logs and lists own Training Sessions

**Type:** AFK
**Status:** open

## What to build

A **Student** can log a **Training Session** (self-directed practice between Lessons) and see their own list of past sessions. Tracer bullet for the Training Session vertical — establishes the `(student_id, performed_at, visibility, status)` shape and student-only authoring. No Horse, no Program, no Notes yet (added in 020 / 021).

`visibility` lives on the Training Session itself (unlike Lesson): `private` (only the student sees it) or `shared` (connected Teachers of the student may see it via 022). Default `private`.

## Acceptance criteria

- [ ] Migration `010_training_sessions.ts` adds a `training_sessions` table: `id` (text PK), `student_id` (text FK → users.id ON DELETE CASCADE), `performed_at` (text NOT NULL — ISO 8601), `duration_min` (integer NULL), `summary` (text NULL), `visibility` (text NOT NULL DEFAULT `'private'` — one of `private` / `shared`), `created_at`, `updated_at`. Index `(student_id, performed_at)`.
- [ ] `TrainingSessionService.create(studentId, { performedAt, durationMin?, summary?, visibility? })` persists a row. Rejects invalid ISO `performedAt`, negative `durationMin`, `visibility` not in the enum. Defaults `visibility` to `private`. Returns the created row.
- [ ] `TrainingSessionService.listForStudent(studentId)` returns the student's own sessions sorted by `performed_at DESC`.
- [ ] `TrainingSessionService.update(studentId, sessionId, { performedAt?, durationMin?, summary?, visibility? })`: author-only (NotFoundError otherwise). Same validation as `create`.
- [ ] `TrainingSessionService.delete(studentId, sessionId)`: author-only (NotFoundError otherwise). Idempotent.
- [ ] API: `POST /api/training-sessions`, `GET /api/training-sessions`, `PATCH /api/training-sessions/:id`, `DELETE /api/training-sessions/:id`. All `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose all four methods and a `TrainingSession` type.
- [ ] Web `/traningspass` route: form (datetime-local for `performedAt`, optional duration + summary inputs, visibility toggle `Privat` / `Delad`) and a list sorted newest first. Each row shows formatted datetime, duration, summary excerpt, and a visibility badge. Edit + Ta bort on own rows. Nav gains "Träningspass" link visible to all logged-in users.
- [ ] Tests: service (create persists + defaults `visibility='private'`, list sorted DESC + isolated between students, update own / stranger → NotFoundError, delete own / stranger → NotFoundError, validation errors), routes (auth 401, happy path, 400, 404).

## Blocked by

- 004 — Teacher sees Students list (only because the auth/user infra needs to be in place; no direct dependency on Relation)
