# 004 — Teacher sees Students list

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can see a list of all **Students** they have an accepted **Relation** with. Clicking a **Student** opens a placeholder detail page that later features (Horses, Programs, Lessons, Notes) will plug into.

This closes the foundational loop: invite → accept → relation visible to teacher. After this slice the full two-party graph is established and every downstream feature (Horse, Exercise, Lesson, Program, Note, Question, Goal) can be built independently against it.

## Acceptance criteria

- [ ] `RelationService.listStudentsForTeacher(teacherId)` returns all **Students** with an active **Relation** to this **Teacher** (joined with `users` for `email` + `display_name`), sorted by `display_name`.
- [ ] `RelationService.getStudentForTeacher(teacherId, studentId)` returns the single **Student** if the **Relation** exists, otherwise null (used by detail page to enforce access).
- [ ] API descriptors: `GET /api/students`, `GET /api/students/:id`. Both `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose both methods.
- [ ] `/students` route in web client: list of students with `display_name` and `email`. Empty state when none.
- [ ] `/students/:id` route shows a placeholder detail page with the student's basic info and a "Mer kommer snart" stub for future features.
- [ ] Navigation gains a "Mina elever" link visible to all logged-in users (since any user may be a teacher in some relation).
- [ ] Authorization: requesting another teacher's student returns 404 (not 403, to avoid leaking existence).
- [ ] Tests: service tests (list returns only own students, get enforces ownership, sort order), route tests (auth, isolation between teachers).

## Blocked by

- 003 — Student sees and responds to Invitation
