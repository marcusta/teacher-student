# 021 — Student writes Notes on own Training Session

**Type:** AFK
**Status:** open

## What to build

A **Student** can write multiple **Notes** on their own **Training Session**, each tagged `private` or `shared`. Activates the second `parent_kind` on the unified `notes` table (`parent_kind='training_session'`). Visibility on the **Note** is independent of visibility on the **Training Session** — but a `shared` Note inside a `private` Training Session is effectively private, since no one but the student can reach the parent (see 022 for teacher visibility).

## Acceptance criteria

- [ ] `NoteService.create(authorId, { parentKind: 'training_session', parentId, body, visibility })`: verifies the author is the `student_id` of the Training Session (NotFoundError otherwise). Same body trim / empty rejection as `parent_kind='lesson'`.
- [ ] `NoteService.listFor(userId, { parentKind: 'training_session', parentId })`: verifies the user can see the parent. For this slice, only the student can — teacher access is added in 022. Filters `private` to author. Sorted `created_at ASC`.
- [ ] `NoteService.update` + `delete` already author-only; no changes needed but covered by tests.
- [ ] Web: new `/traningspass/:id` detail route — read-only view of the Training Session fields plus a Notes section identical to the Lesson one (textarea + visibility toggle, list with edit/delete on own rows).
- [ ] List page row links to the detail route.
- [ ] Tests: service (student creates note on own TS works, student creates on someone else's TS → NotFoundError, list as author shows private + shared, list as stranger → NotFoundError, update + delete parity).

## Blocked by

- 019 — Student logs and lists own Training Sessions
- 017 — Teacher writes Notes on a Lesson (note infra)
