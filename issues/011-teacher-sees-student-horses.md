# 011 — Teacher sees a Student's Horses

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can see the non-archived **Horses** of a connected **Student**. Read-only — the teacher cannot create, edit or archive a student's horse. Unlocks the **Lesson** vertical: when a teacher creates a Lesson for a Student, they will pick from this list.

## Acceptance criteria

- [ ] `HorseService.listForStudentAsTeacher(teacherId, studentId)` returns the student's non-archived horses only if a `Relation(teacher_id, student_id)` exists. Throws `NotFoundError` otherwise (leak-safe).
- [ ] API: `GET /api/students/:id/horses`. `requireAuth()`. 404 if no Relation.
- [ ] Generated client exposes `students.listHorses({ id })` (or matching name).
- [ ] Web `/elever/:id` page (StudentDetail) gains a "Hästar" section listing names; empty state "Inga hästar.".
- [ ] Tests: service (own student returns list, archived excluded, no relation → NotFoundError, missing student → NotFoundError), routes (200, 404 for stranger, 401).

## Blocked by

- 008 — Student creates and lists own Horses
- 004 — Teacher sees Students list (already done)
