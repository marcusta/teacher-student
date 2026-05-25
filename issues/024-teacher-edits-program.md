# 024 — Teacher edits a Program

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can rename a Program and update its description. Stranger access (another teacher's Program) returns `NotFoundError` — never `ForbiddenError`, which would leak existence. Mirrors 006 (Exercise edit).

## Acceptance criteria

- [x] `ProgramService.update(actorId, programId, { title?, description? })` updates only the supplied fields, returns the updated row. Throws `NotFoundError` if the program doesn't exist or `teacher_id !== actorId`.
- [x] `title` cannot be set to empty string (typebox enforces).
- [x] API: `PATCH /api/programs/:id`. Codegen run.
- [x] Web: edit affordance on the Program library page (inline or detail page — match the pattern used for Exercise edit in 006).
- [x] Integration tests: owner updates fields; stranger gets `NotFoundError`; nonexistent id gets `NotFoundError`; empty title rejected at schema layer.

## Blocked by

- 023 — Teacher creates and lists own Programs in library
