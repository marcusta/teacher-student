# 038 — Plan detail page with linked Lessons and Training Sessions

**Type:** AFK  
**Status:** open  
**Group:** D — Plan umbrella (part 4 of 4)

## What to build

A **Student** can open a **Plan** detail page, edit metadata (title, description, dates, **Primary Teacher**), archive the plan, and see which **Lessons** and **Training Sessions** are linked via `plan_id`. A **Teacher** in an active **Relation** can open a read-only view of the same plan and its linked items for that student.

Completes Group D — the umbrella is navigable and inspectable, not only a picker target.

## Acceptance criteria

- [ ] `PlanService.getDetail(actorId, planId)`: returns plan fields plus `{ lessons: LinkedLessonRef[], trainingSessions: LinkedTrainingSessionRef[] }`. **Student** owner always allowed. **Teacher** allowed when in **Relation** with plan owner — else `NotFoundError`.
- [ ] Linked lesson refs: `{ id, scheduledAt, teacherDisplayName, status, horseName? }` ordered `scheduled_at ASC`.
- [ ] Linked TS refs: `{ id, performedAt, durationMin?, summary?, horseName? }` ordered `performed_at DESC`.
- [ ] API: `GET /api/plans/:id` returns detail shape (extend existing get from 035 or replace). Teacher uses same route when authorized; or `GET /api/students/:studentId/plans/:id` — pick one surface, document in handoff.
- [ ] Web `/planer/:id`:
  - Student: edit form (title, description, start/end dates, primary teacher `SelectComponent` from connected teachers), **Arkivera** button
  - Read-only sections: linked **Lektioner** + **Träningspass** lists with links to `/lektioner/:id` and `/traningspass/:id`
  - Teacher viewer: read-only metadata + lists (no edit/archive)
- [ ] Optional polish: show `planTitle` on lesson list rows and TS list rows when `planId` set (if not done in 036/037).
- [ ] `$each` keys stable but reflect row content where lists re-render on link changes.
- [ ] Tests: service (detail lists only items with matching `plan_id`, teacher without relation → NotFoundError, archived plan still readable); routes (200, 404).

## Blocked by

- **036** — `plan_id` on lessons
- **037** — `plan_id` on training_sessions

## Reference analogs

- `web/students/student-detail.component.ts` — teacher read-only student sub-resources
- `web/training-sessions/training-session-detail.component.ts` — detail layout pattern

## Out of scope

- Inline detach from plan detail (detach remains on lesson/TS edit surfaces)
- Goals section on plan detail — follow-up epic
- Aggregated stats / progress charts
