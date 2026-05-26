# 033 — `training_session_exercise` junction (link Exercises to a Training Session)

**Type:** AFK  
**Status:** open  
**Group:** C — Training Session ↔ Program parity (part 1 of 2)

## What to build

A **Student** can attach **Exercises** from their connected **Teachers'** libraries to their own **Training Session**, see an ordered list on the session detail page, and remove links. A **Teacher** who can view the session (via `training_session_share`, slice 022) can read the same list but cannot mutate it in this slice.

Mirrors **016** + **029** on the Lesson side: surrogate row `id`, `sort_order`, nullable `notes` (row notes / radkommentar), nullable `source_program_id` (filled by slice 034).

## Acceptance criteria

- [ ] Migration `019_training_session_exercise.ts` creates `training_session_exercise`:
  - `id TEXT PRIMARY KEY`
  - `training_session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE`
  - `exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE`
  - `sort_order INTEGER NOT NULL`
  - `notes TEXT`
  - `source_program_id TEXT REFERENCES programs(id) ON DELETE SET NULL`
  - `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - `UNIQUE (training_session_id, exercise_id)`
  - Indexes: `(training_session_id, sort_order)`, `(source_program_id)`
- [ ] `ExerciseService.listForStudent(studentId)` (or equivalent total op): returns Exercises where `exercises.teacher_id` is in an active **Relation** with the student. Sorted by `name` or `created_at`. `NotFoundError` only if student id invalid — empty list when no relations. (Powers the student picker.)
- [ ] `TrainingSessionService.addExercise(actorId, sessionId, exerciseId)`: **Student** must own the session. Exercise must appear in `listForStudent` for that student. Append `sort_order = max + 1`, `source_program_id = null`, `notes = null`. Idempotent duplicate link.
- [ ] `TrainingSessionService.removeExercise(actorId, sessionId, exerciseId)`: student owner only; idempotent.
- [ ] `TrainingSessionService.listExercises(actorId, sessionId)`: student owner OR teacher with a `training_session_share` row for that session; else `NotFoundError`. Ordered `sort_order ASC`. Returns `{ id, exerciseId, name, sortOrder, sourceProgramId }[]`.
- [ ] `TrainingSession` DTO + `listForStudent` / `getForViewer` hydrate `exercises[]` (batch query like `LessonService.exercisesByLesson`).
- [ ] API: `POST /api/training-sessions/:id/exercises` body `{ exerciseId }`, `DELETE /api/training-sessions/:id/exercises/:exerciseId`, `GET /api/training-sessions/:id/exercises`. `GET /api/exercises/for-student` (or name aligned with codegen) for picker. `requireAuth()`. Stranger / private session → 404.
- [ ] `bun run generate`. Web: `/traningspass/:id` detail gains **Övningar** section — `SelectComponent` + Lägg till + list with Ta bort (student owner only; read-only for teacher viewer). `$each` keys include `sortOrder` + `sourceProgramId` + `notes` when present.
- [ ] Tests: service (add/remove/list ordering, idempotent add, foreign exercise → NotFoundError, stranger session → NotFoundError, teacher with share can list not mutate, teacher without share → NotFoundError, listForStudent exercise catalog from connected teachers only); routes (200, 404).

## Blocked by

- None (022 share visibility already shipped)

## Reference analogs

- `server/db/migrations/016_lesson_exercise_surrogate_id.ts`
- `server/services/lesson.service.ts` — `addExercise`, `removeExercise`, `listExercises`, `exercisesByLesson`
- `issues/016-teacher-links-exercises-to-lesson.md`, `issues/029-lesson-exercise-surrogate-id-and-source-program.md`

## Out of scope (later slices)

- Notes on `training_session_exercise` (`note.parent_kind`) — mirror 031
- Teacher prescribes / creates TS on behalf of student (`created_by_id` in SCOPE)
- Exercise history including Training Sessions — extend 032
