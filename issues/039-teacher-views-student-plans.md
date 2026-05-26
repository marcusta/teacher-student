# 039 — Teacher views a Student's Plans

**Type:** AFK
**Status:** todo

## What to build

A **Teacher** in an active **Relation** with a **Student** can see that student's active **Plans** from the student-detail page (`/elever/:id`), and open any plan's detail view read-only. Mirrors how a Teacher already sees a student's **Horses** (011). Closes the gap left after 035–038, where Plan endpoints existed for Teachers but no web entry point did.

## Acceptance criteria

### Server

- [ ] `PlanService.listForStudentAsTeacher(teacherId, studentId)` continues to return **active** plans only, ordered `created_at DESC`. Existing relation gate (`NotFoundError` when no Relation) stays.
- [ ] DTO hydrates `primaryTeacherId` **and** `primaryTeacherDisplayName` (nullable) so rows can render the label without an extra fetch. Add hydration to `Plan` (or a `PlanListItem` shape) consistently across `listForStudent`, `listForStudentAsTeacher`, and `getDetail`.
- [ ] No new route — `GET /api/students/:id/plans` already exists.

### Web — student-detail

- [ ] `/elever/:id` (`student-detail.component.ts`) gains a "Träningsplaner" section between existing sections (placement: after Hästar, before Träningspass — confirm during impl).
- [ ] Section fetches via generated client `students.listPlans({ id })`.
- [ ] Each row shows: title, optional date range (`startDate – endDate` if either set), optional primary-teacher display name as soft label.
- [ ] Row click navigates to `/planer/:id` (existing route, server already allows connected teachers via `getDetail`).
- [ ] Empty state: "Inga träningsplaner.".

### Web — plan-detail (teacher read-only)

- [ ] `plan-detail.component.ts` hides edit and archive controls when `actor.id !== plan.studentId`. Linked lessons / training sessions remain visible.
- [ ] No teacher-side mutations are reachable from the view.

## Behaviors to test (TDD order)

1. Server: `listForStudentAsTeacher` returns active plans with hydrated `primaryTeacherDisplayName` when the plan has a primary teacher.
2. Server: `listForStudentAsTeacher` returns `primaryTeacherDisplayName: null` when `primary_teacher_id` is null.
3. Server: `getDetail` and `listForStudent` also hydrate `primaryTeacherDisplayName` (consistency — only if shape is unified).
4. Web: student-detail renders Träningsplaner rows for a teacher with one active plan.
5. Web: student-detail renders empty state when student has no active plans.
6. Web: plan-detail hides edit/archive controls when actor is not the owning student.

(Existing tests for the relation gate, archived exclusion, and `getDetail` teacher access should already be green; do not duplicate.)

## Out of scope

- Archived plans on student-detail (defer; reachable by direct URL only for now).
- Cross-student "all plans" teacher dashboard.
- Disabled-with-tooltip variants of teacher controls — controls are hidden.
- Plan rollups (progress, exercise history scoped to plan).

## Blocked by

- 035 — Student-owned Plans CRUD + teacher catalog (done)
- 038 — Plan detail with linked lessons and training sessions (done)
- 011 — Teacher sees a Student's Horses (pattern reference; done)
