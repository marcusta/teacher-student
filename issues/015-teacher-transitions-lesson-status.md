# 015 — Teacher transitions Lesson status

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can mark a **Lesson** as `completed` (it happened) or `cancelled` (it didn't). Transitions are terminal — once `completed` or `cancelled`, the Lesson stops moving. Students see the new status but cannot transition. Cancelled lessons render visually muted in lists.

## Acceptance criteria

- [ ] `LessonService.transition(teacherId, lessonId, target)` where `target` is `'completed' | 'cancelled'`. Idempotent on the same terminal status (no-op success). Reject transitioning from a different terminal status (e.g. `completed → cancelled`) with a `ConflictError`-style error → HTTP 409. NotFoundError leak-safe on other-teacher / missing.
- [ ] API: extend `PATCH /api/lessons/:id` schema with optional `status: 'completed' | 'cancelled'` (does NOT accept `'planned'` — re-opening is out of scope). When `status` is provided, routes to `transition`; other fields route to `update` as in 014. Or — simpler — add a dedicated `POST /api/lessons/:id/transition` if mixing complicates the PATCH handler. Pick whichever keeps the route handler clear.
- [ ] Generated client exposes the chosen method(s); `Lesson.status` typed `'planned' | 'completed' | 'cancelled'`.
- [ ] Web `/lektioner/:id` (teacher view) gains "Markera utförd" + "Ställ in" buttons. Buttons disappear once the Lesson is terminal.
- [ ] Lesson list rows visually de-emphasize cancelled lessons (e.g. opacity 0.5, strikethrough datetime). Completed lessons get a subtle checkmark or muted "Utförd" badge.
- [ ] Tests: service (transition to completed / cancelled works, idempotent on same status, terminal→other-terminal → 409, other-teacher → NotFoundError, missing → NotFoundError), routes (200, 409, 404).

## Blocked by

- 014 — Teacher attaches a Horse to a Lesson (shares the same edit page)
