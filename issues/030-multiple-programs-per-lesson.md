# 030 — Multiple Programs per Lesson via `lesson_program` junction

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can attach more than one **Program** to a **Lesson**, and detach any of them. Replaces the single-scalar `lesson.program_id` (slice 028) with a `lesson_program(lesson_id, program_id, attached_at)` junction. Each attach idempotently snapshot-copies the Program's exercises into `lesson_exercise`, marking new rows with `source_program_id = programId` (slice 029). Detach removes the junction row only — already-copied `lesson_exercise` rows stay, because they are snapshot data the teacher may still want.

Attach is a **total operation** (Ousterhout): for each `program_exercise`, if its `exercise_id` is not yet linked to the lesson, append a new `lesson_exercise` row continuing `sort_order = max + 1 + i` with `source_program_id = programId` and `notes` copied verbatim. Already-linked exercises are silently skipped. Re-attaching the same Program is a no-op (no new junction row, no new exercise rows).

Lesson responses now expose `programs: { id, title }[]` (ordered by `attached_at ASC`) instead of the previous scalar `programId` / `programTitle`.

## Acceptance criteria

- [ ] Migration `017_lesson_program.ts` creates table `lesson_program(lesson_id TEXT FK lessons.id ON DELETE CASCADE, program_id TEXT FK programs.id ON DELETE CASCADE, attached_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY(lesson_id, program_id))` with index `(program_id)`.
- [ ] Migration `018_lessons_drop_program_id.ts` data-migrates: for every `lessons` row with `program_id NOT NULL`, insert a `lesson_program` row, then drops the `lessons.program_id` column (SQLite table recreate).
- [ ] `LessonService.attachProgram(teacherId, lessonId, programId)`: ownership checks on both (NotFoundError). Inserts the `lesson_program` row (`INSERT OR IGNORE` for idempotence). Appends `program_exercise` rows whose `exercise_id` is not already in the lesson, with continuing `sort_order`, copying `notes` and setting `source_program_id = programId`.
- [ ] `LessonService.detachProgram(teacherId, lessonId, programId)`: ownership check. Deletes the `lesson_program` row; idempotent (no-op if absent). Does **not** delete `lesson_exercise` rows.
- [ ] `LessonService.create` (slice 028 path): the `programId` create-time option now inserts a `lesson_program` row in the same transaction as the lesson + exercise inserts (in addition to filling `source_program_id`). Internally collapses into `attachProgram` semantics.
- [ ] `Lesson` / `LessonForUser` interface drops `programId` / `programTitle`; gains `programs: { id: string; title: string }[]` ordered by `attached_at ASC`.
- [ ] API: `POST /api/lessons/:id/programs` body `{ programId }`, `DELETE /api/lessons/:id/programs/:programId`. Existing `POST /api/lessons` still accepts the optional `programId` shorthand. Codegen run.
- [ ] Web: lesson edit page `/lektioner/:id` gets a "Program" section listing attached Programs (each with "Koppla loss" button) and a SelectComponent + "Koppla program" button to attach more (lists teacher's Programs not yet attached to this lesson). After attach, the Övningar list re-renders with appended rows. Lesson list rows replace the single "Från program: X" badge with a comma-separated list when multiple are attached.
- [ ] Tests: service (attach to lesson with no programs adds junction row + copies all exercises with `source_program_id`; attach a second Program appends only its non-duplicate exercises; re-attaching same Program is a no-op for both tables; attach with stranger lesson → NotFoundError; attach with foreign Program → NotFoundError; detach removes junction row only; detach of not-attached is no-op; data migration moves single `lessons.program_id` into junction), routes (200, 404).

## Blocked by

- 029 — `lesson_exercise` surrogate id + `source_program_id` (this slice writes to that column)
