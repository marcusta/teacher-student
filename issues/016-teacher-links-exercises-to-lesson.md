# 016 — Teacher links Exercises to a Lesson

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can attach **Exercises** from their own library to a **Lesson**, see them as an ordered list on the Lesson edit page, and remove them. The **Student** sees the same ordered list read-only on their Lesson row (or detail when added later).

Notes on the link row (`lesson_exercise.notes`) are out of scope for this slice — the column exists in SCOPE but stays unused for now.

## Acceptance criteria

- [ ] Migration `008_lesson_exercise.ts` creates `lesson_exercise(lesson_id, exercise_id, sort_order INTEGER NOT NULL, notes TEXT NULL, created_at)` with composite PK `(lesson_id, exercise_id)` and FKs to `lessons.id` / `exercises.id` ON DELETE CASCADE.
- [ ] `LessonService.addExercise(teacherId, lessonId, exerciseId)`: verifies the Lesson is owned by the teacher AND the Exercise is owned by the teacher (both NotFoundError on miss / wrong owner). Appends with `sort_order = max(existing) + 1`. Idempotent if already linked (no-op success).
- [ ] `LessonService.removeExercise(teacherId, lessonId, exerciseId)`: same ownership checks. Idempotent on already-absent.
- [ ] `LessonService.listExercises(userId, lessonId)`: returns `{ id, title, sortOrder }[]` ordered by `sort_order ASC` for the lesson — accessible to both sides (teacher OR student of the lesson); NotFoundError otherwise.
- [ ] API: `POST /api/lessons/:id/exercises` (body: `{ exerciseId }`), `DELETE /api/lessons/:id/exercises/:exerciseId`, `GET /api/lessons/:id/exercises`. All `requireAuth()`.
- [ ] `Lesson` / `LessonForUser` gains `exercises: { id, title, sortOrder }[]` so list rows and the edit page render without a follow-up call.
- [ ] Web: lesson edit page (`/lektioner/:id`) gets an "Övningar" section with a `<select>` of unattached library Exercises + Lägg till button + ordered list with Ta bort. Read-only list also shown on lesson timeline rows (compact, comma-separated).
- [ ] Tests: service (add own works, add stranger lesson → NotFoundError, add foreign exercise → NotFoundError, idempotent add, remove, list ordered, list as student of the lesson works, list as outsider → NotFoundError), routes (200, 404).

## Blocked by

- 014 — Teacher attaches a Horse to a Lesson (same edit page)
- 005 — Teacher creates and lists Exercises
