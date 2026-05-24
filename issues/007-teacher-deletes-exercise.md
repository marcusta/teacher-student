# 007 — Teacher deletes an Exercise

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can delete an **Exercise** from their **Library**. Hard delete for MVP — there are no other entities referencing `exercises` yet. When **Lesson** / **Program** start referencing exercises, this slice will be revisited (likely soft-delete or block-on-references).

## Acceptance criteria

- [ ] `ExerciseService.delete(teacherId, exerciseId)` deletes the row when owned. Throws `NotFoundError` when the exercise doesn't exist or is owned by another teacher (leak-safe).
- [ ] API: `DELETE /api/exercises/:id`. Returns `{ ok: true }` on success, 404 otherwise.
- [ ] Generated client + `web/api.ts` expose the method.
- [ ] Web `/library/:id` edit page gains a "Ta bort"-button next to "Spara". Uses `window.confirm` for now ("Ta bort övningen?"). On success, navigates to `/library`; the deleted row is gone from the list.
- [ ] Tests: service (delete happy path, delete on other teacher's exercise throws `NotFoundError`, delete on missing id throws `NotFoundError`), routes (auth, 404).

## Blocked by

- 005 — Teacher creates and lists Exercises
