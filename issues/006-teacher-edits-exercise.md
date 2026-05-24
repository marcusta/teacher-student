# 006 — Teacher edits an Exercise

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can open an **Exercise** from their **Library** and edit its name and description. Establishes the `get-by-id` + `update` pattern with leak-safe authorization (404 — not 403 — for other teachers' exercises).

## Acceptance criteria

- [ ] `ExerciseService.getForTeacher(teacherId, exerciseId)` returns the `Exercise` if owned, otherwise `null`.
- [ ] `ExerciseService.update(teacherId, exerciseId, { name?, description? })` updates the row (refreshing `updated_at`) and returns the updated `Exercise`. Throws `NotFoundError` when the exercise doesn't exist or is owned by another teacher (leak-safe: same response either way).
- [ ] API: `GET /api/exercises/:id` (404 for not-found / other teacher), `PATCH /api/exercises/:id` (same body validation as create; partial: each field optional).
- [ ] Generated client + `web/api.ts` expose both methods.
- [ ] Web `/library/:id` route: prefilled form, "Spara"-button updates and navigates back to `/library`; "missing" state if 404.
- [ ] Clicking an exercise row in the `/library` list navigates to `/library/:id`.
- [ ] Tests: service (update happy path refreshes `updated_at`, update on other teacher's exercise throws `NotFoundError`, update on missing id throws `NotFoundError`, get isolates), routes (404 vs 200, 400 on invalid payload).

## Blocked by

- 005 — Teacher creates and lists Exercises
