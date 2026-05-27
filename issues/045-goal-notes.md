# 045 — Goal notes

**Type:** AFK
**Status:** done

## What to build

Both the owning **Student** and any **Teacher** addressed by a **Goal Share** can post **Notes** on a **Goal**. Reuse the polymorphic Note feed (`parent_kind='goal'`); visibility (`private` / `shared`) follows the standard rule.

## Acceptance criteria

### Schema

- [x] No migration — existing `notes` table; widen `NoteParentKind` to include `goal`.

### Service

- [x] `NoteService.assertCanAuthor` + `assertCanRead` dispatch `goal` to a new `assertGoalViewer` gate.
- [x] Owner Student always passes; Teacher passes only when a `goal_share` row addresses them; otherwise leak-safe `NotFoundError`.

### API

- [x] `notes.api.ts` ParentKind union includes `Type.Literal('goal')`.
- [x] Regenerate client.

### Web

- [x] `GoalNotesComponent` mirrors `ExerciseNotesComponent` (own NotesService, private/shared toggle, edit/delete by author).
- [x] Mounted on goal-detail under the plans section. Student-facing wording on the shared checkbox flips by viewer role.
- [x] Nav: drop the "hide Mål for teacher-only users" rule — any user can own a personal goal.

### Tests

- [x] Owner authors; shared teacher authors; unshared teacher rejected; stranger rejected (author + list); visibility filtering (teacher sees own private + everyone-shared).

## Out of scope

- Notification on new shared note (general notifications feature).
- Media attachments (phase 2).

## Blocked by

- 040–041 — Goal CRUD + Goal Share (done).
