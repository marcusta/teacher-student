# 010 — Student archives a Horse

**Type:** AFK
**Status:** open

## What to build

A **Student** can archive a **Horse** (soft-delete via `archived_at`). Archived horses disappear from the default list but their rows persist so future **Lessons**, **Training Sessions** and **Notes** that reference them stay intact. Per SCOPE: "Soft-delete: bara `horse.archived_at` initialt."

## Acceptance criteria

- [ ] `HorseService.archive(studentId, horseId)` sets `archived_at = now()` only if owned; throws `NotFoundError` otherwise. Idempotent: archiving an already-archived horse is a no-op success.
- [ ] `HorseService.listForStudent` continues to exclude rows where `archived_at IS NOT NULL`.
- [ ] API: `DELETE /api/horses/:id` performs archive (not hard delete). `requireAuth()`. 404 for missing/other-owner.
- [ ] Generated client exposes `delete` (returns `{ ok: true }`).
- [ ] Web `/hastar/:id` edit page gains "Arkivera" button with `window.confirm('Arkivera hästen?')`; on success navigates back to `/hastar`.
- [ ] Tests: service (archive sets archived_at, listForStudent excludes it, other-owner → NotFoundError, missing → NotFoundError, idempotent on already-archived), routes (200, 404).

## Blocked by

- 008 — Student creates and lists own Horses
