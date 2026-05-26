# 037 — Link Training Sessions to a Plan via `plan_id`

**Type:** AFK  
**Status:** open  
**Group:** D — Plan umbrella (part 3 of 4)

## What to build

A **Student** can attach their own **Training Session** to one of their **Plans** when logging or editing a pass. Detach (`plan_id = null`) allowed for the **Student** plan owner or the **Student** session owner (same user today). A **Teacher** with `training_session_share` sees the linked plan read-only — cannot mutate `plan_id` (parity with 033–034 student-only writes).

Mirrors **020** (optional FK on TS) + **033** auth shape.

## Acceptance criteria

- [ ] Migration `023_training_sessions_plan_id.ts` adds to `training_sessions`:
  - `plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL`
  - Index `(plan_id)`
- [ ] `TrainingSessionService.create(studentId, { performedAt, ..., planId? })`: when `planId` supplied, `assertActivePlanForStudent(planId, studentId)`.
- [ ] `TrainingSessionService.update(studentId, sessionId, { ..., planId? })`: **Student** owner may set or clear `planId`. Active-plan validation on set.
- [ ] `TrainingSessionService.detachFromPlan(actorId, sessionId)`: `plan_id = null` when actor is session **Student** owner (also plan owner). Idempotent. Teacher with share → `NotFoundError` on mutate.
- [ ] `TrainingSession` DTO hydrates nullable `planId` + `planTitle` on list/get.
- [ ] Archived / foreign plan attach → `NotFoundError`.
- [ ] API: extend `POST /api/training-sessions` and `PATCH /api/training-sessions/:id` with optional `planId: string | null`.
- [ ] `bun run generate`. Web: `/traningspass` create/edit forms gain optional **Plan** picker from `GET /api/plans` (active only). Detail page shows plan label read-only.
- [ ] Tests: service (attach on create, update, detach, archived rejected, stranger → NotFoundError, teacher with share read-only); routes (200, 404).

## Blocked by

- **035** — `plans` table + `PlanService.assertActivePlanForStudent`

## Reference analogs

- `issues/020-student-attaches-horse-to-training-session.md`
- `issues/033-training-session-exercises.md` — student-only writes, teacher share read-only
- `server/services/training-session.service.ts`

## Out of scope

- Teacher-prescribed TS with `created_by_id` (SCOPE deferred)
- Goals on plan
