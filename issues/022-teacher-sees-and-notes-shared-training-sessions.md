# 022 — Teacher sees and writes Notes on a Student's shared Training Sessions

**Type:** AFK
**Status:** open

## What to build

A **Teacher** can see Training Sessions logged by a connected **Student** when the student marked them `visibility='shared'`. Teacher can write Notes on them (`private` for own prep, `shared` for feedback the student sees). Mirrors how 017+018 paired up Lesson note authoring across roles.

`private` Training Sessions remain invisible to the teacher.

## Acceptance criteria

- [x] `TrainingSessionService.listForTeacherOfStudent(teacherId, studentId)` returns Training Sessions where `student_id = studentId` AND `visibility='shared'` AND a Relation exists between `(teacherId, studentId)`. Throws `NotFoundError` if no Relation. Sorted `performed_at DESC`. Includes `horseName`.
- [x] `TrainingSessionService.getForViewer(userId, sessionId)` resolves a single TS for either the owning student (any visibility) or a connected teacher (only if `shared`). NotFoundError otherwise. Used by the detail route.
- [x] API: `GET /api/training-sessions?studentId=:id` switches behavior on the actor — if `studentId` is omitted, returns `listForStudent(user.id)`; if provided, returns `listForTeacherOfStudent(user.id, studentId)`. `GET /api/training-sessions/:id` uses `getForViewer`.
- [x] `NoteService.create` accepts the connected teacher of `ts.student_id` as author for `parent_kind='training_session'` when the TS is `shared`. `NoteService.listFor` accepts the same viewers (student always; teacher when TS is shared). Visibility filtering same as Lesson notes.
- [x] Web: on the teacher-side student detail page (or roster row click-through — pick whatever surface is shortest), add a "Träningspass" section listing the student's shared TS with a link to `/traningspass/:id`. Detail page renders for both roles; teacher sees the same Notes section, can author with visibility toggle.
- [x] Tests: service (teacher sees only shared TS for connected student, stranger teacher → NotFoundError, private TS hidden from teacher, getForViewer gates correctly), notes (teacher creates note on shared TS works, teacher cannot note on private TS → NotFoundError, listFor as teacher returns student's shared + own private), routes parity.

## Blocked by

- 021 — Student writes Notes on own Training Session
