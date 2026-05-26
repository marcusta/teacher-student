# 035 — Student-owned Plans (träningsplan CRUD)

**Type:** AFK  
**Status:** open  
**Group:** D — Plan umbrella (part 1 of 4)

## What to build

A **Student** can create and manage their own **Plans** — long-running umbrellas for development over weeks or months. A connected **Teacher** can read a student's Plan list (for pickers when linking content in 036/037) but cannot create, edit, or archive Plans in this slice.

Mirrors **008–011** (Horse student CRUD + teacher catalog), adapted for `plan` in `SCOPE.md`.

## Acceptance criteria

- [ ] Migration `021_plans.ts` creates `plans`:
  - `id TEXT PRIMARY KEY`
  - `student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `primary_teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL`
  - `title TEXT NOT NULL`
  - `description TEXT`
  - `start_date TEXT` (optional ISO date `YYYY-MM-DD`)
  - `end_date TEXT` (optional ISO date `YYYY-MM-DD`)
  - `status TEXT NOT NULL DEFAULT 'active'` — `active` | `archived`
  - `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - Index `(student_id, status)`
  - Index `(primary_teacher_id)` where not null
- [ ] `PlanService.create(studentId, { title, description?, startDate?, endDate?, primaryTeacherId? })`: trims title; rejects empty title. If `primaryTeacherId` supplied, must be a **Teacher** in an active **Relation** with the student — else `NotFoundError`.
- [ ] `PlanService.listForStudent(studentId)`: own plans sorted `created_at DESC`. Active plans first or grouped — document choice in service; default all statuses, active before archived.
- [ ] `PlanService.getForStudent(studentId, planId)`: `NotFoundError` when missing or wrong owner.
- [ ] `PlanService.update(studentId, planId, patch)`: student owner only; can change title, description, dates, `primaryTeacherId` (same Relation validation). `NotFoundError` to strangers.
- [ ] `PlanService.archive(studentId, planId)`: sets `status = 'archived'`; idempotent. Student owner only.
- [ ] `PlanService.listForStudentAsTeacher(teacherId, studentId)`: returns the connected student's non-archived plans (or all plans — prefer active-only for pickers). `NotFoundError` when no **Relation** — leak-safe parity with `HorseService.listForStudentAsTeacher`.
- [ ] `PlanService.assertActivePlanForStudent(planId, studentId)`: internal helper for 036/037 — plan exists, owned by student, `status = 'active'`; else `NotFoundError`.
- [ ] API: `POST /api/plans`, `GET /api/plans`, `GET /api/plans/:id`, `PATCH /api/plans/:id`, `POST /api/plans/:id/archive`. `GET /api/students/:id/plans` on students API (teacher catalog). `requireAuth()`.
- [ ] `bun run generate`. Web: `/planer` route — list own plans, create form (title required; description optional). Nav link for students (visible when logged in; empty state OK).
- [ ] Tests: service (CRUD, archive idempotent, invalid primary teacher → NotFoundError, teacher catalog isolation, stranger get → NotFoundError); routes (200, 404, 401).

## Blocked by

- None (004 Relations shipped)

## Reference analogs

- `server/services/horse.service.ts` — student-owned entity + `listForStudentAsTeacher`
- `issues/008-student-creates-and-lists-horses.md`, `issues/011-teacher-sees-student-horses.md`
- `SCOPE.md` — `plan` table and Plan authorization notes

## Out of scope (later slices)

- `plan_id` on lessons / training sessions — **036**, **037**
- Plan detail with linked items — **038**
- `goal` table with `plan_id` — follow-up epic
- Enforcing `start_date` / `end_date` windows (display-only in MVP)
