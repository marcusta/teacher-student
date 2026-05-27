# 043 — Goal status transitions (achieved / reopen)

**Type:** AFK
**Status:** todo

## What to build

A **Goal** can be transitioned to `achieved` (or back to `active`) by the **Student** owner or by any **Teacher** the goal is shared with. `achieved_at` is set on transition into `achieved` and cleared on transition out. The existing `abandon` action (slice 040) remains student-only.

## Acceptance criteria

### Service

- [ ] `GoalService.markAchieved(actorId, goalId)` sets `status='achieved'` and `achieved_at = now()`. Allowed when:
  - `actorId` is the goal's owning student, OR
  - `actorId` is a teacher with an active `goal_share` row for this goal.
  - Else `NotFoundError`.
  - Idempotent if already achieved (no second `achieved_at` rewrite).
  - Rejected (`ConflictError`) when current status is `abandoned` — must reopen first.
- [ ] `GoalService.reopen(actorId, goalId)` sets `status='active'` and `achieved_at = null`. Same actor rules as `markAchieved`. Idempotent if already active.
- [ ] `GoalService.abandon` (slice 040) remains **student-owner only** — teachers cannot abandon a goal.

### API

- [ ] `POST /api/goals/:id/achieve` — student or shared teacher.
- [ ] `POST /api/goals/:id/reopen` — student or shared teacher.
- [ ] Existing `POST /api/goals/:id/abandon` — student only (unchanged).

### Web

- [ ] Goal detail/row in `/mal` (student) shows "Markera klart" / "Återöppna" buttons depending on status. Plus existing "Arkivera" (abandon) for owner only.
- [ ] Goal detail row in student-detail (`/elever/:id`) Mål section gains "Markera klart" / "Återöppna" actions for the teacher when the goal is shared. No abandon control.
- [ ] On transition, refresh the list/detail.

### Tests

- [ ] Service: student owner achieves; shared teacher achieves; unshared teacher → `NotFoundError`.
- [ ] Service: `achieved_at` is set on first achieve and **not** rewritten on second achieve.
- [ ] Service: reopen clears `achieved_at` and flips status to `active`.
- [ ] Service: cannot achieve from `abandoned` → `ConflictError`.
- [ ] Service: abandon remains student-only — shared teacher attempt → `NotFoundError`.
- [ ] Routes: 200 / 401 / 404 / 409 paths.

## Out of scope

- Achievement evidence (notes / attachments). Defer.
- Notifications.

## Blocked by

- 041 — Goal Share (defines who can transition)
