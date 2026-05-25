# 009 — Student edits a Horse

**Type:** AFK
**Status:** done

## What to build

A **Student** can edit the name of one of their own **Horses**. Leak-safe authorization: editing another student's horse returns the same response as editing a missing one (404). Mirrors the Exercise edit pattern (006).

## Acceptance criteria

- [ ] `HorseService.update(studentId, horseId, { name? })` updates the row only if owned by `studentId`; throws `NotFoundError` otherwise. Trims; rejects empty name when provided. Refreshes `updated_at`.
- [ ] API: `PATCH /api/horses/:id` with TypeBox schema (`name` min 1, max 200). `requireAuth()`. 404 for missing or other-owner.
- [ ] Generated client exposes `update`.
- [ ] Web `/hastar/:id` route: prefilled name field; "Spara" submits; "Tillbaka" link to `/hastar`; "Hästen kunde inte hittas." missing state.
- [ ] Tests: service (own update refreshes updated_at, other-owner → NotFoundError, missing → NotFoundError, empty name reject), routes (200, 404, 400).

## Blocked by

- 008 — Student creates and lists own Horses
