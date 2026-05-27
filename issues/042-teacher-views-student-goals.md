# 042 — Teacher views Student's shared Goals

**Type:** AFK
**Status:** todo

## What to build

A **Teacher** in an active **Relation** with a **Student** can see the **Goals** that the student has explicitly shared with them via **Goal Share**. Read-only in this slice (status transitions arrive in 043). Surface lives on the student-detail page (mirroring slice 039 for Plans).

## Acceptance criteria

### Service

- [ ] `GoalService.listForStudentAsTeacher(teacherId, studentId)` returns the student's goals where a `goal_share(goal_id, teacher_id=teacherId)` row exists. Requires an active **Relation**; else `NotFoundError`.
  - Order: `active` before `achieved` before `abandoned`, then `created_at DESC`.
  - Includes the same DTO shape as `listForStudent` (title, description, targetDate, status, achievedAt, createdAt, updatedAt) but **omits** `sharedTeacherIds` (teachers do not see co-watchers in MVP).
- [ ] `GoalService.getForTeacher(teacherId, goalId)` returns the goal if and only if a share exists. Else `NotFoundError`. Same omit-co-watchers rule.

### API

- [ ] `GET /api/students/:id/goals` — connected teacher catalog of shared goals. 404 for non-relation; 401 unauthed.
- [ ] `GET /api/goals/:id` — already returns goal for owner; extend to also return for a teacher with an active share. Else 404.
- [ ] Regenerate client.

### Web

- [ ] Student-detail (`/elever/:id`) gains a "Mål" section between "Träningsplaner" and "Träningspass". Lists rows: title, status badge, target date if set.
- [ ] Empty state: "Inga delade mål."
- [ ] Row click → goal detail (`/mal/:id` — same route, reused; read-only view for teachers in slice 043).

### Tests

- [ ] Service: `listForStudentAsTeacher` returns only shared goals; non-shared excluded; archived included with correct ordering; `NotFoundError` for non-relation.
- [ ] Service: `getForTeacher` returns shared goal; `NotFoundError` for non-shared (even with active relation) and for non-relation.
- [ ] Routes: 200 / 401 / 404; verify a teacher cannot see goals the student did not share, even if the relation is active.

## Out of scope

- Teacher status transitions (slice 043).
- Plan-side display of goals (slice 044).
- Notes on goals.

## Blocked by

- 041 — Goal Share junction
