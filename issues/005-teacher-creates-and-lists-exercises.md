# 005 — Teacher creates and lists Exercises

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can add an **Exercise** to their private **Library** (name + description, no media yet) and see the list of all their own **Exercises**. This is the tracer bullet for the Exercise vertical — it cuts through migration → service → API → web client and establishes the ownership pattern (`teacher_id` foreign key, own-only visibility) that 006 and 007 build on.

## Acceptance criteria

- [ ] Migration `004_exercises.ts` adds an `exercises` table: `id` (text PK), `teacher_id` (text FK → `users.id` ON DELETE CASCADE), `name` (text, NOT NULL, min length 1), `description` (text, NOT NULL, default `''`), `created_at`, `updated_at`.
- [ ] `ExerciseService.create(teacherId, { name, description })` persists a new row and returns the created `Exercise`. Trims whitespace; rejects empty `name`.
- [ ] `ExerciseService.listForTeacher(teacherId)` returns only this teacher's exercises, sorted by `created_at DESC`.
- [ ] API: `POST /api/exercises` (TypeBox schema: `name` min 1, max 200; `description` max 4000), `GET /api/exercises`. Both `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose both methods + `Exercise` type.
- [ ] Web `/library` route: form (name, description) with submit; list below the form showing each exercise's name + description; empty state ("Inga övningar än.") when none.
- [ ] Nav gains a "Bibliotek" link visible to all logged-in users.
- [ ] Tests: service (create persists + trims, list isolates between teachers, list sorted by created_at DESC, empty list), routes (auth 401, happy path, validation 400).

## Blocked by

- 004 — Teacher sees Students list
