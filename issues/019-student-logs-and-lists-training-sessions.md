# 019 — Student logs and lists own Training Sessions

**Type:** AFK
**Status:** open

## What to build

A **Student** can log a **Training Session** (self-directed practice between Lessons) and see their own list of past sessions. Tracer bullet for the Training Session vertical — establishes the `(student_id, performed_at)` shape, student-only authoring, and **per-Teacher share targeting**. No Horse, no Program, no Notes yet (added in 020 / 021).

Visibility lives in a join table `training_session_share(training_session_id, teacher_id)`: empty = private to the **Student**; rows = visible to those specific connected **Teachers** (gated later in 022). When a Student has multiple Teachers, the UI lets them pick which ones to share with; with one Teacher, a single "Dela med [name]" checkbox; with zero, no share UI at all.

## Acceptance criteria

- [x] Migration `010_training_sessions.ts` adds a `training_sessions` table: `id` (text PK), `student_id` (text FK → users.id ON DELETE CASCADE), `performed_at` (text NOT NULL — ISO 8601), `duration_min` (integer NULL), `summary` (text NULL), `created_at`, `updated_at`. Index `(student_id, performed_at)`.
- [x] Migration `011_training_session_share.ts` adds a `training_session_share` table: composite PK `(training_session_id, teacher_id)`, FKs to `training_sessions.id` (CASCADE) and `users.id` (CASCADE). Index on `teacher_id`.
- [x] `TrainingSessionService.create(studentId, { performedAt, durationMin?, summary?, shareWithTeacherIds? })` persists a row plus its share targets. Each `shareWithTeacherIds[i]` must be a connected Teacher of the Student (NotFoundError otherwise). Rejects invalid ISO `performedAt`, negative `durationMin`. Returns `TrainingSession` with `sharedWithTeacherIds: string[]`.
- [x] `TrainingSessionService.listForStudent(studentId)` returns the student's own sessions sorted by `performed_at DESC`, each hydrated with its `sharedWithTeacherIds`.
- [x] `TrainingSessionService.update(studentId, sessionId, { performedAt?, durationMin?, summary?, shareWithTeacherIds? })`: author-only (NotFoundError otherwise). When `shareWithTeacherIds` is supplied, it replaces the share set entirely; omit to leave it unchanged. Same validation as `create`.
- [x] `TrainingSessionService.delete(studentId, sessionId)`: author-only (NotFoundError otherwise). Idempotent. Cascade removes share rows.
- [x] `RelationService.listTeachersForStudent(studentId)` mirrors `listStudentsForTeacher`.
- [x] API: `POST /api/training-sessions`, `GET /api/training-sessions`, `PATCH /api/training-sessions/:id`, `DELETE /api/training-sessions/:id`, plus `GET /api/teachers` (the calling user's connected Teachers). All `requireAuth()`.
- [x] Generated client + `web/api.ts` expose all methods and `TrainingSession` + `Teacher` types.
- [x] Web `/traningspass` route: form (datetime-local for `performedAt`, optional duration + summary inputs, share section described above) and a list sorted newest first. Each row shows formatted datetime, duration, summary excerpt, and a share label (`Privat` or `Delad: Anna, Erik`). Edit + Ta bort on own rows. Nav gains "Träningspass" link visible to all logged-in users.
- [x] Tests: service (create defaults to empty share set, create with connected teacher persists, create with non-connected teacher → NotFoundError, listForStudent sorted DESC + isolated + carries shares, update replaces share set / omitting leaves it, update by stranger → NotFoundError, delete own / stranger → NotFoundError + cascades shares, validation errors), routes (auth 401, happy path, stranger share target → 404, `GET /api/teachers` parity).

## Blocked by

- 004 — Teacher sees Students list (only because the auth/user infra needs to be in place)
