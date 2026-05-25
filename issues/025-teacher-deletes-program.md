# 025 — Teacher deletes a Program

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can hard-delete an own Program. Deletion cascades to `program_exercise` rows (once that table exists in 026; until then there are no junction rows to cascade). No `lesson.program_id` / `training_session.program_id` references to null — Lesson↔Program attachment is a later group, so the snapshot reference column either doesn't carry data yet or is added with `ON DELETE SET NULL` from the start.

Stranger access returns `NotFoundError`. Mirrors 007 (Exercise delete).

## Acceptance criteria

- [ ] `ProgramService.delete(actorId, programId)` removes the row. Throws `NotFoundError` if not owned by `actorId` or nonexistent.
- [ ] Foreign-key cascade: `program_exercise.program_id` is declared `ON DELETE CASCADE` when that table is created in 026. This slice's migration does not need to alter anything if 026 hasn't landed.
- [ ] API: `DELETE /api/programs/:id`. Codegen run.
- [ ] Web: delete button on Program list (confirm dialog — match Exercise delete pattern from 007).
- [ ] Integration tests: owner deletes successfully; stranger gets `NotFoundError`; deletion of a program with `program_exercise` rows cascades (defer this assertion until after 026 if 026 not yet landed; track as a TODO in the test file).

## Blocked by

- 023 — Teacher creates and lists own Programs in library
