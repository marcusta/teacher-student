# 008 — Student creates and lists own Horses

**Type:** AFK
**Status:** done

## What to build

A **Student** can add a **Horse** to their stable (name only for now) and see the list of all their own non-archived **Horses**. This is the tracer bullet for the Horse vertical — it cuts through migration → service → API → web client and establishes the ownership pattern (`student_id` foreign key, own-only visibility) that 009/010/011 build on. Horses are needed first because **Lessons**, **Training Sessions** and **Notes** will reference them.

## Acceptance criteria

- [ ] Migration `005_horses.ts` adds a `horses` table: `id` (text PK), `student_id` (text FK → `users.id` ON DELETE CASCADE), `name` (text NOT NULL min length 1), `archived_at` (text NULL), `created_at`, `updated_at`.
- [ ] `HorseService.create(studentId, { name })` persists a new row and returns the created `Horse`. Trims whitespace; rejects empty `name`.
- [ ] `HorseService.listForStudent(studentId)` returns only this student's non-archived horses, sorted by `created_at DESC`.
- [ ] API: `POST /api/horses` (TypeBox: `name` min 1, max 200), `GET /api/horses`. Both `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose both methods + `Horse` type.
- [ ] Web `/hastar` route: form (name) with submit; list below the form showing each horse's name; empty state ("Inga hästar än.") when none.
- [ ] Nav gains a "Hästar" link visible to all logged-in users.
- [ ] Tests: service (create persists + trims, list isolates between students, sorted by created_at DESC, empty list, archived excluded), routes (auth 401, happy path, validation 400).

## Blocked by

- 004 — Teacher sees Students list (relation graph complete; horses build on the same user-owned pattern)
