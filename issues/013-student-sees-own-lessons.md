# 013 — Student sees own Lessons

**Type:** AFK
**Status:** done

## What to build

A **Student** can see the **Lessons** scheduled for them by any **Teacher** they're connected to. Same `/lektioner` page as the teacher view; the page asks "show me everything I'm involved in" and the row renders the counterparty's display name. Folds teacher + student views into one endpoint to keep the navigation simple.

## Acceptance criteria

- [ ] `LessonService.listForUser(userId)` returns all Lessons where the user is the teacher OR the student, sorted by `scheduled_at ASC`. Each item carries a `role: 'teacher' | 'student'` discriminator plus the counterparty's `displayName`.
- [ ] `GET /api/lessons` now returns `listForUser(user.id)` instead of teacher-only. `LessonService.listForTeacher` stays as the internal helper used by 014/015.
- [ ] Generated client `Lesson` type gains `role` and `counterpartyDisplayName` fields.
- [ ] Web `/lektioner` list rows render `{counterpartyDisplayName}` (no role-aware label needed — the side-bar context already tells the user who they are). Form (create new Lesson) is only visible when the current user has at least one Student (i.e. is acting as Teacher).
- [ ] Tests: service (returns lessons from both sides, sorted, no duplicates if user is somehow both teacher and student of the same lesson — impossible by FK but assert anyway), routes (student-only user gets their lessons; user with no lessons gets `[]`).

## Blocked by

- 012 — Teacher schedules and lists own Lessons
