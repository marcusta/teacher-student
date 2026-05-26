# 034 — Multiple Programs per Training Session via `training_session_program`

**Type:** AFK  
**Status:** open  
**Group:** C — Training Session ↔ Program parity (part 2 of 2)

## What to build

A **Student** can attach one or more **Programs** from connected **Teachers** to their own **Training Session**, and detach them. Snapshot-copy semantics match **028** + **030** on Lessons: each attach appends non-duplicate `program_exercise` rows into `training_session_exercise` with `source_program_id` set and `notes` copied verbatim. Detach removes only the junction row — snapshot rows stay.

Attach is a **total operation**: idempotent re-attach, skip exercises already on the session, continue `sort_order` after current max.

## Acceptance criteria

- [ ] Migration `020_training_session_program.ts` creates `training_session_program`:
  - `training_session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE`
  - `program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE`
  - `attached_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - `PRIMARY KEY (training_session_id, program_id)`
  - Index on `program_id`
- [ ] `ProgramService.listForStudent(studentId)` (or reuse a single “content from my teachers” query): Programs where `teacher_id` is in an active **Relation** with the student. Sorted `created_at DESC`.
- [ ] `TrainingSessionService.attachProgram(actorId, sessionId, programId)`: student owns session; program must be in `listForStudent` catalog; `INSERT OR IGNORE` junction; append snapshot rows like `LessonService.attachProgram`.
- [ ] `TrainingSessionService.detachProgram(actorId, sessionId, programId)`: student owner; delete junction only; idempotent.
- [ ] `TrainingSessionService.create` accepts optional `programId` — same transaction semantics as lesson create (junction + snapshot rows).
- [ ] `TrainingSession` exposes `programs: { id, title }[]` ordered `attached_at ASC` on list/detail responses.
- [ ] API: `POST /api/training-sessions/:id/programs` body `{ programId }`, `DELETE /api/training-sessions/:id/programs/:programId`. Optional `programId` on `POST /api/training-sessions` create. Codegen run.
- [ ] Web: `/traningspass/:id` gains **Program** section — attached list with Koppla loss, `SelectComponent` for unattached programs + Koppla program. Create form on `/traningspass` list may offer optional program picker. Re-render Övningar after attach.
- [ ] Tests: service (attach copies with `source_program_id`, second program appends non-dupes, re-attach no-op, detach preserves rows, foreign program → NotFoundError, stranger → NotFoundError); routes (200, 404).

## Blocked by

- **033** — `training_session_exercise` table + `source_program_id` column

## Reference analogs

- `issues/028-teacher-attaches-program-at-lesson-create.md`
- `issues/030-multiple-programs-per-lesson.md`
- `server/services/lesson.service.ts` — `attachProgram`, `detachProgram`, `programsByLesson`

## Out of scope

- Teacher mutates programs on a student's session (student-only write in MVP)
- `plan_id` on training_sessions
