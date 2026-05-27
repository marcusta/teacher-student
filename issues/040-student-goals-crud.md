# 040 — Student-owned Goals CRUD

**Type:** AFK
**Status:** todo

## What to build

A **Student** can create, list, read, update, and abandon long-term **Goals** from a `/mal` page. Foundation slice — no sharing, no plan attachment, no status transitions beyond `abandoned` archival yet. Mirrors the Plan CRUD pattern (035).

## Acceptance criteria

### Schema

- [ ] Migration `024_goals.ts` creates table `goal`:
  - `id` text PK
  - `student_id` text NOT NULL → `users.id` ON DELETE CASCADE
  - `title` text NOT NULL (1..200 chars, trimmed)
  - `description` text NULL (max 5000 chars)
  - `target_date` text NULL (ISO date `YYYY-MM-DD`)
  - `achieved_at` text NULL (ISO timestamp; always null in this slice)
  - `status` text NOT NULL CHECK in (`active`, `achieved`, `abandoned`), default `active`
  - `created_at`, `updated_at` text NOT NULL
- [ ] Index on `goal(student_id, status)`.

### Service

- [ ] `GoalService.create(studentId, { title, description?, targetDate? })` returns `Goal`. Empty trimmed title rejected. `targetDate` validated as `YYYY-MM-DD` regex.
- [ ] `GoalService.listForStudent(studentId)` returns the student's goals, `active` before `achieved` before `abandoned`, then `created_at DESC` within each group.
- [ ] `GoalService.getForStudent(studentId, goalId)` returns `Goal` or throws `NotFoundError` (leak-safe).
- [ ] `GoalService.update(studentId, goalId, patch)` updates `title` / `description` / `targetDate`. Empty title rejected; `description` and `targetDate` can be set to `null`. Bumps `updated_at`. Status is **not** mutable in this slice.
- [ ] `GoalService.abandon(studentId, goalId)` sets `status='abandoned'`, idempotent. (Achieved transition lives in 043.)

### API (Hono)

- [ ] `POST /api/goals` — create. `requireAuth()`.
- [ ] `GET /api/goals` — list own.
- [ ] `GET /api/goals/:id` — get one (own; 404 otherwise).
- [ ] `PATCH /api/goals/:id` — update own.
- [ ] `POST /api/goals/:id/abandon` — abandon own. Returns `{ ok: true }`.
- [ ] `bun run generate` regenerates client.

### Web

- [ ] New nav link "Mål" → `/mal` (student-only visibility; teacher sees no link).
- [ ] `/mal` page (`goals.component.ts`): list rows (title, target date if set, status badge), create form (title + optional description + optional target date), inline edit, abandon button with confirm.
- [ ] Empty state: "Inga mål än."
- [ ] Route registered in `app.component.ts`.

### Tests

- [ ] Service: `create` happy path, empty title rejected, invalid date rejected.
- [ ] Service: `listForStudent` ordering (`active`/`achieved`/`abandoned` groups) and isolation between students.
- [ ] Service: `getForStudent` 404 for stranger.
- [ ] Service: `update` patch semantics + status not mutable here.
- [ ] Service: `abandon` is idempotent + 404 for stranger.
- [ ] Routes: 200 / 401 / 404 paths for each endpoint.

## Out of scope

- Sharing with teachers (slice 041).
- Status transition to `achieved` (slice 043).
- Plan attachment (slice 044).
- Teacher visibility (slice 042).

## Blocked by

- 035 — Student-owned Plans CRUD (pattern reference; done)
