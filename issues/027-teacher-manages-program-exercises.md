# 027 — Teacher reorders and removes Exercises in a Program

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can reorder the Exercises within an own Program and can remove an Exercise from it. Reorder is expressed as the full new order (list of `exerciseId`) rather than pairwise swaps — server rewrites all `sort_order` values atomically in one transaction. Remove deletes one junction row; remaining rows keep their relative order (gaps in `sort_order` are tolerated and normalized on next reorder).

Both operations are scoped to the actor; stranger Program or non-member Exercise → `NotFoundError`.

## Acceptance criteria

- [ ] `ProgramService.reorderExercises(actorId, programId, orderedExerciseIds)` verifies ownership of Program; verifies the supplied set exactly matches the current set of `exerciseId`s in that Program (no missing, no extra) — else throws a clear validation error (not `NotFoundError`, since the request is malformed, not unauthorized); rewrites `sort_order` in one transaction (`0..n-1` in supplied order).
- [ ] `ProgramService.removeExercise(actorId, programId, exerciseId)` verifies Program ownership; deletes the junction row; returns silently if the row didn't exist (idempotent) **or** throws `NotFoundError` — pick the same idiom used by `LessonService` for `removeExercise` in 016 to stay consistent.
- [ ] API: `PUT /api/programs/:id/exercises/order` (body: `{ exerciseIds: string[] }`), `DELETE /api/programs/:id/exercises/:exerciseId`. Codegen run.
- [ ] Web: drag-to-reorder UI on Program detail (or up/down buttons — match whatever 016/Lesson-exercise UI does); remove button per row. `$each` keys must change when order changes — use `${exerciseId}:${sort_order}`.
- [ ] Integration tests: reorder rewrites `sort_order` to `0..n-1`; mismatched id set (missing, extra, or different) rejected with validation error; cross-teacher Program → `NotFoundError`; remove deletes the row and leaves siblings intact; remove of nonexistent row behaves per chosen idiom.

## Blocked by

- 026 — Teacher adds an Exercise to a Program
