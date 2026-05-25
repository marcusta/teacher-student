# 026 — Teacher adds an Exercise to a Program

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can add an own Exercise to an own Program. New rows append to the end (`sort_order = max(sort_order) + 1`, starting at 0). Optional per-row `notes` (teacher's prescription note for this exercise within this routine). The same exercise cannot appear twice in the same Program (unique composite key). Mirrors 016 (linking Exercises to a Lesson).

Introduces the `program_exercise` junction table.

## Acceptance criteria

- [x] Migration creates `program_exercise` table: `program_id TEXT NOT NULL REFERENCES program(id) ON DELETE CASCADE`, `exercise_id TEXT NOT NULL REFERENCES exercise(id) ON DELETE CASCADE`, `sort_order INTEGER NOT NULL`, `notes TEXT`, `PRIMARY KEY (program_id, exercise_id)`.
- [x] `ProgramService.addExercise(actorId, programId, exerciseId, { notes? })` verifies both the Program and the Exercise are owned by `actorId` (else `NotFoundError`); inserts row with `sort_order = (max sort_order for programId) + 1` or `0` if empty; rejects duplicate `(program_id, exercise_id)` with a clear error (typebox-level or unique-constraint translation).
- [x] `ProgramService.listExercises(actorId, programId)` returns the program's exercises joined with `exercise` fields, ordered by `sort_order ASC`. Stranger / nonexistent → `NotFoundError`.
- [x] API: `POST /api/programs/:id/exercises` (body: `{ exerciseId, notes? }`), `GET /api/programs/:id/exercises`. Codegen run.
- [x] Web: Program detail page lists current exercises and offers a picker from the teacher's Exercise library to add. `$each` keys include `sort_order` since reorder will change row identity (e.g. `${exerciseId}:${sort_order}`).
- [x] Integration tests: append on empty program → `sort_order = 0`; append on non-empty → `max + 1`; cross-teacher Program → `NotFoundError`; cross-teacher Exercise → `NotFoundError`; duplicate insert rejected; listExercises returns rows in `sort_order` ASC.

## Blocked by

- 023 — Teacher creates and lists own Programs in library
- 005 — Teacher creates and lists Exercises
