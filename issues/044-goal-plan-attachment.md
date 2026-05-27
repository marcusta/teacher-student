# 044 — Goal ↔ Plan attachment

**Type:** AFK
**Status:** todo

## What to build

A **Student** can link a **Goal** to zero or many of their **Plans** via the **Plan–Goal Link** junction. Goals show up on Plan detail; the Plan detail surfaces its linked goals to anyone who can already read the Plan (owner + connected teacher per existing relation gate). Sharing is unchanged — goal visibility on plan-detail follows the **Plan** read rules, not the goal's individual share list.

> Note: This means a teacher viewing the Plan can see the **titles** of all goals attached to that Plan, even goals not shared with them individually. Decision: acceptable because the student deliberately attached the goal under the plan; the plan is the shared context.

## Acceptance criteria

### Schema

- [ ] Migration `026_goal_plan.ts` creates table `goal_plan`:
  - `goal_id` text NOT NULL → `goal.id` ON DELETE CASCADE
  - `plan_id` text NOT NULL → `plans.id` ON DELETE CASCADE
  - `attached_at` text NOT NULL
  - PK (`goal_id`, `plan_id`)
- [ ] Index on `goal_plan(plan_id)`.

### Service

- [ ] `GoalService.attachToPlan(studentId, goalId, planId)` inserts a junction row. Both goal and plan must be owned by `studentId`; plan must be `active`. Else `NotFoundError`. Idempotent.
- [ ] `GoalService.detachFromPlan(studentId, goalId, planId)` deletes the junction row. Idempotent. `NotFoundError` if goal isn't owned by caller.
- [ ] `PlanService.getDetail` DTO gains `goals: { id, title, status, targetDate }[]` (active before achieved before abandoned, then `created_at DESC`). Visible to anyone allowed to read the plan.
- [ ] `GoalService.getForStudent` / `getForTeacher` DTOs gain `planIds: string[]` so detail views can show "Tillhör planer" (owner sees all; teacher sees only the plan ids — title hydration optional in this slice, defer if unclear).

### API

- [ ] `POST /api/goals/:id/plans/:planId` — attach.
- [ ] `DELETE /api/goals/:id/plans/:planId` — detach.
- [ ] `GET /api/plans/:id` — already exists; verify it now returns hydrated `goals` array.
- [ ] Regenerate client.

### Web

- [ ] Plan detail (`/planer/:id`) gains "Mål" section with goal rows; row click navigates to `/mal/:id`.
- [ ] Goal detail (`/mal/:id`, student view) gets a plan multi-select to attach/detach goal across plans.

### Tests

- [ ] Service: attach happy path; not-owner of either → `NotFoundError`; archived plan → `NotFoundError`; idempotent re-attach.
- [ ] Service: detach idempotent + ownership gate.
- [ ] Service: `PlanService.getDetail` hydrates goals for owner and for connected teacher.
- [ ] Service: `goals` order in plan detail is `active`/`achieved`/`abandoned` then `created_at DESC`.
- [ ] Routes: 200 / 401 / 404 paths.

## Out of scope

- Cross-student plan moves (not possible by ownership invariant).
- Goal reordering inside a plan (alphabetic / created_at only).
- Goal lifecycle bubble-ups (e.g. closing all linked goals when archiving a plan).

## Blocked by

- 040 — Goals CRUD
- 035 / 038 — Plans CRUD + detail (done)
