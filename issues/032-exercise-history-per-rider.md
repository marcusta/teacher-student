# 032 — "Övningshistorik": Exercise history for a Student

**Type:** AFK
**Status:** open

## What to build

A **Teacher** in a Relation with a **Student**, or the Student themselves, can view the chronological history of one **Exercise** as performed in that Student's Lessons. Each entry shows the Lesson's `scheduledAt`, optional source Program label (from `source_program_id`), the row's `notes` (pre-written comment), and the visible **Notes** (per-instance reflection thread from slice 031) for that `lesson_exercise` row.

Read-only and additive — no new mutations. Surfaces the "evolution" view the model has been built toward.

## Acceptance criteria

- [ ] `LessonService.exerciseHistory(actorId, studentId, exerciseId)`: authorization — actor must be the student OR a teacher in an active Relation with the student. Else `NotFoundError`. Returns entries shaped roughly `{ lessonExerciseId, lessonId, scheduledAt, sourceProgramId, sourceProgramTitle, rowNotes, notes: Note[] }[]` ordered by `scheduledAt DESC`. Each entry's `notes` list applies the same visibility filter as `NoteService.list` (caller sees own private + all shared).
- [ ] API: `GET /api/students/:studentId/exercises/:exerciseId/history`. Codegen run.
- [ ] Web: from the lesson edit page Övningar list, each Exercise row gains a "Historik" link → opens a route `/elever/:studentId/ovningar/:exerciseId/historik` rendering a timeline (date, source-program label, row notes, expanded note thread). Also reachable from the teacher's exercise library detail by picking a Student.
- [ ] Tests: service (returns rows for the right (student, exercise) pair only; sorted by scheduledAt DESC; includes lesson_exercise rows from both snapshot-from-Program and free-add origins; outsider → NotFoundError; the Note visibility filter matches NoteService.list — a private note authored by the other party is hidden), routes (200, 404).

## Blocked by

- 031 — Notes on `lesson_exercise` (the thread shown per entry)
