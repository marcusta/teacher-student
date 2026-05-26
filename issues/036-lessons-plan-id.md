# 036 — Link Lessons to a Plan via `plan_id`

**Type:** AFK  
**Status:** open  
**Group:** D — Plan umbrella (part 2 of 4)

## What to build

A **Teacher** can attach their **Lesson** to one of the **Student**'s **Plans** when scheduling or editing. A **Student** (plan owner) or the lesson's **Teacher** (row author) can detach (`plan_id = null`). Detach does not delete the Lesson.

Mirrors **014** (optional FK on lesson) + SCOPE Plan authorization.

## Acceptance criteria

- [ ] Migration `022_lessons_plan_id.ts` adds to `lessons`:
  - `plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL`
  - Index `(plan_id)`
- [ ] `LessonService.create(teacherId, { studentId, scheduledAt, programId?, planId? })`: when `planId` supplied, call `assertActivePlanForStudent(planId, studentId)`. Persist `plan_id` on insert.
- [ ] `LessonService.update(teacherId, lessonId, { horseId?, scheduledAt?, planId? })`: lesson **Teacher** may set or clear `planId`. Setting requires active plan for lesson's student; clearing allowed (detach). `NotFoundError` when lesson not owned by teacher.
- [ ] `LessonService.detachFromPlan(actorId, lessonId)`: sets `plan_id = null`. Allowed when `actorId` is the plan's **Student** owner OR the lesson's **Teacher**. Else `NotFoundError`. Idempotent when already null.
- [ ] `Lesson` DTO hydrates nullable `planId` + `planTitle` on list/get (batch join like `horseName`).
- [ ] Reject attach to **archived** plan (`NotFoundError` or validation error — match `assertActivePlanForStudent`).
- [ ] Foreign plan (wrong `student_id`) → `NotFoundError` (leak-safe).
- [ ] API: extend `POST /api/lessons` and `PATCH /api/lessons/:id` with optional `planId: string | null`. Optional `POST /api/lessons/:id/detach-plan` only if PATCH null is awkward — prefer PATCH.
- [ ] `bun run generate`. Web: lesson create form + teacher lesson edit gain **Plan** `SelectComponent` populated from `GET /api/students/:studentId/plans`. Clear / detach control when linked.
- [ ] Tests: service (attach on create, update link, teacher detach, student detach, archived plan rejected, foreign plan → NotFoundError, hydrate title); routes (200, 404).

## Blocked by

- **035** — `plans` table + `PlanService.assertActivePlanForStudent`

## Reference analogs

- `issues/014-teacher-attaches-horse-to-lesson.md`
- `server/services/lesson.service.ts` — `horseId` attach on create/update
- `server/services/plan.service.ts` — `listForStudentAsTeacher` (picker)

## Out of scope

- Student rescheduling lesson via plan (existing student edit paths unchanged unless needed for detach UI)
- Multiple plans per lesson (cardinality is 0..1 per SCOPE)
