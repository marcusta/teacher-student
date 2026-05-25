# 018 — Student writes Notes on a shared Lesson

**Type:** AFK
**Status:** open

## What to build

The **Student** side of the Lesson gains a detail page and the ability to author **Notes** on Lessons they participate in (visibility `private` for own use, `shared` for the teacher to see). Mirrors 017 but from the student perspective.

## Acceptance criteria

- [ ] `NoteService.create` accepts `authorId === lesson.student_id` for `parent_kind='lesson'` (in addition to the teacher).
- [ ] Web: new student-side lesson detail route (likely `/lektioner/:id` for both roles, but the Shell picks a read-only-for-edit-fields layout when `role === 'student'`): shows time, teacher, attached Horse + Exercises read-only; surfaces the Notes section (author = student, visibility toggle).
- [ ] Teacher view of lesson notes shows student-authored shared notes interleaved by `created_at ASC` (already works once `create` accepts students).
- [ ] Tests: service (student create on own lesson works, student create on lesson they're not in → NotFoundError), routes parity.

## Blocked by

- 017 — Teacher writes Notes on a Lesson
- 013 — Student sees own Lessons
