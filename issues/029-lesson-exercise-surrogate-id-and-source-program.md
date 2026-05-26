# 029 — `lesson_exercise` gains surrogate `id` + `source_program_id`

**Type:** AFK
**Status:** done

## What to build

Refactor migration of `lesson_exercise` to add a surrogate `id` primary key (SCOPE says it's required for `note.parent_kind='lesson_exercise'`) and a nullable `source_program_id` column that records which **Program**, if any, an Exercise instance came from when the row was snapshot-copied into a Lesson. Free additions via `LessonService.addExercise` keep `source_program_id = NULL`. The composite `unique(lesson_id, exercise_id)` constraint stays — the same Exercise still appears at most once per Lesson; per-instance history lives in **Notes** (slice 031), not duplicate rows.

The snapshot path from slice 028 starts filling `source_program_id` with the Program it copied from. No new API surface yet — `Lesson.exercises[]` gains `sourceProgramId: string | null` so later UI can group by Program.

## Acceptance criteria

- [x] Migration `016_lesson_exercise_surrogate_id.ts` recreates `lesson_exercise` in SQLite with: `id TEXT PRIMARY KEY`, existing columns `lesson_id`, `exercise_id`, `sort_order`, `notes`, `created_at`, new nullable `source_program_id TEXT REFERENCES programs.id ON DELETE SET NULL`. Composite `UNIQUE(lesson_id, exercise_id)` retained. Existing rows are migrated with newly generated UUIDs. Index `(lesson_id, sort_order)` recreated. Indexes on `source_program_id` added.
- [x] `LessonService.create` (slice 028 snapshot path) sets `source_program_id = input.programId` on every row it copies from `program_exercise`. Existing free `addExercise` continues to insert with `source_program_id = NULL`.
- [x] `LessonExerciseRef` gains `sourceProgramId: string | null`. `listExercises` / `listForTeacher` / `listForUser` populate it from the new column.
- [x] Codegen run.
- [x] Tests: service (snapshot path fills `source_program_id` with the program's id; `addExercise` leaves `source_program_id` null; existing tests still pass; `lesson_exercise.id` is unique across rows; same exercise still rejected as duplicate within a lesson via the unique constraint).

## Blocked by

- 028 — Teacher attaches Program when creating Lesson (this slice changes the table the snapshot writes into)
