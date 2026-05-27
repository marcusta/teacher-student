# 041 — Student shares Goal with Teachers

**Type:** AFK
**Status:** todo

## What to build

A **Student** owner can share an individual **Goal** with one or more **Teachers** in active **Relations** with them. Shared teachers can read the goal (slice 042 surfaces the read view); status transitions come in 043. This slice adds the **Goal Share** junction and the share-management endpoints.

## Acceptance criteria

### Schema

- [ ] Migration `025_goal_share.ts` creates table `goal_share`:
  - `goal_id` text NOT NULL → `goal.id` ON DELETE CASCADE
  - `teacher_id` text NOT NULL → `users.id` ON DELETE CASCADE
  - `created_at` text NOT NULL
  - PK (`goal_id`, `teacher_id`)
- [ ] Index on `goal_share(teacher_id)`.

### Service

- [ ] `GoalService.share(studentId, goalId, teacherId)` inserts a `goal_share` row. Validates:
  - Goal exists and is owned by `studentId` → else `NotFoundError`.
  - `teacherId` is in an active **Relation** with `studentId` → else `NotFoundError` (leak-safe; do not distinguish unknown teacher from unconnected teacher).
  - Idempotent — re-sharing is a no-op success.
- [ ] `GoalService.unshare(studentId, goalId, teacherId)` deletes the row. Idempotent. `NotFoundError` if goal isn't owned by caller.
- [ ] `GoalService.listSharedTeachers(studentId, goalId)` returns `{ teacherId, displayName }[]` for the goal's shares, ordered by `displayName ASC`. Owner-only.
- [ ] `getForStudent` / `listForStudent` DTOs gain `sharedTeacherIds: string[]` (hydrated from `goal_share`). Empty array when none.

### API

- [ ] `POST /api/goals/:id/shares` body `{ teacherId }` — share. Owner only.
- [ ] `DELETE /api/goals/:id/shares/:teacherId` — unshare. Owner only.
- [ ] `GET /api/goals/:id/shares` — list shared teachers (owner only; teachers cannot enumerate co-watchers in MVP).
- [ ] Regenerate client.

### Web

- [ ] `/mal` goal row gains a "Delning" affordance (button/badge) showing share count.
- [ ] Goal edit/detail view includes a teacher picker (multi-select over `TeachersService.items`, which lists the student's connected teachers). Toggling a teacher calls share / unshare.
- [ ] Visible only to the goal owner.

### Tests

- [ ] Service: share happy path; idempotent re-share; `NotFoundError` for unconnected teacher; `NotFoundError` when caller isn't the goal owner.
- [ ] Service: unshare idempotent + ownership gate.
- [ ] Service: `listSharedTeachers` returns hydrated names sorted; rejects non-owner.
- [ ] Service: `listForStudent` / `getForStudent` hydrate `sharedTeacherIds`.
- [ ] Routes: 200 / 401 / 404 paths.

## Out of scope

- Teacher read of shared goals (slice 042).
- Bulk share-all / share-with-primary-teacher shortcuts.
- Notifications when a goal is shared.

## Blocked by

- 040 — Student-owned Goals CRUD
