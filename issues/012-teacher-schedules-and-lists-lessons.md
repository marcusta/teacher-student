# 012 — Teacher schedules and lists own Lessons

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can schedule a **Lesson** for a connected **Student** at a specific time, and see their own list of upcoming + past Lessons. Tracer bullet for the Lesson vertical — establishes the (teacher, student, scheduled_at, status) shape and own-only visibility. No Horse or Program yet (added in 014 / a later vertical).

## Acceptance criteria

- [ ] Migration `006_lessons.ts` adds a `lessons` table: `id` (text PK), `teacher_id` (text FK → users.id ON DELETE CASCADE), `student_id` (text FK → users.id ON DELETE CASCADE), `scheduled_at` (text NOT NULL — ISO 8601), `status` (text NOT NULL DEFAULT 'planned' — one of `planned` / `completed` / `cancelled`), `created_at`, `updated_at`. Index `(teacher_id, scheduled_at)` and `(student_id, scheduled_at)`.
- [ ] `LessonService.create(teacherId, { studentId, scheduledAt })` persists a row with `status='planned'`. Verifies the (teacher, student) Relation exists; throws `NotFoundError` otherwise. Rejects `scheduledAt` that isn't a valid ISO date string.
- [ ] `LessonService.listForTeacher(teacherId)` returns the teacher's lessons sorted by `scheduled_at ASC`.
- [ ] API: `POST /api/lessons` (TypeBox: `studentId` min 1, `scheduledAt` ISO string), `GET /api/lessons`. Both `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose both methods + `Lesson` type.
- [ ] Web `/lektioner` route: form (student picker from roster, datetime-local input) and a list grouped into "Kommande" / "Tidigare" sections; empty state ("Inga lektioner än.") when empty. Each row shows counterparty display name, formatted datetime, and a status badge.
- [ ] Nav gains "Lektioner" link visible to all logged-in users.
- [ ] Tests: service (create persists + defaults `status='planned'`, create on non-connected student → NotFoundError, list sorted by scheduled_at ASC, list isolated between teachers), routes (auth 401, happy path, validation 400, stranger 404).

## Blocked by

- 004 — Teacher sees Students list
