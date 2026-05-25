# 024 — Teacher edits a Program

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can rename a Program and update its description. Stranger access (another teacher's Program) returns `NotFoundError` — never `ForbiddenError`, which would leak existence. Mirrors 006 (Exercise edit).

## Acceptance criteria

- [ ] `ProgramService.update(actorId, programId, { title?, description? })` updates only the supplied fields, returns the updated row. Throws `NotFoundError` if the program doesn't exist or `teacher_id !== actorId`.
- [ ] `title` cannot be set to empty string (typebox enforces).
- [ ] API: `PATCH /api/programs/:id`. Codegen run.
- [ ] Web: edit affordance on the Program library page (inline or detail page — match the pattern used for Exercise edit in 006).
- [ ] Integration tests: owner updates fields; stranger gets `NotFoundError`; nonexistent id gets `NotFoundError`; empty title rejected at schema layer.

## Blocked by

- 023 — Teacher creates and lists own Programs in library
