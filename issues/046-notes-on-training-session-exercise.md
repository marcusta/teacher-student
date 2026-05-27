# 046 — Notes on a `training_session_exercise` row

**Type:** AFK
**Status:** done

## What to build

Both the owning **Student** and any **Teacher** addressed by a **Training Session Share** can post **Notes** against a single `training_session_exercise` row — i.e. against this Exercise as performed in this Training Session, not against the abstract library Exercise.

Mirrors slice 031 (lesson_exercise notes) and slice 045 (goal notes). `NoteService` is already polymorphic; this slice adds `parent_kind='training_session_exercise'` with the proper authorization scope.

## Acceptance criteria

### Schema

- [x] `NoteParentKind` in `server/db/schema.ts` widens to include `'training_session_exercise'`. No migration.

### Service

- [x] `NoteService.assertCanAuthor` + `assertCanRead` dispatch `training_session_exercise` to a new `assertTrainingSessionExerciseViewer` gate.
- [x] Gate resolves `training_session_exercise.id → training_session_id`, then reuses the `training_session` rule: owner Student passes; Teacher passes only when a `training_session_share` row addresses them. Leak-safe `NotFoundError` otherwise.
- [x] `update` / `delete` reuse existing author-only path; no changes.

### API

- [x] `notes.api.ts` `ParentKind` union includes `Type.Literal('training_session_exercise')`.
- [x] Regenerate client.

### Web

- [x] `web/lessons/notes.service.ts` `ParentKind` widens to include `'training_session_exercise'`.
- [x] Training-session detail page: each exercise row gets an inline "Anteckningar" disclosure that mounts an `ExerciseNotesComponent`-style thread (or a small dedicated wrapper around `NotesService`). `$each` key includes `training_session_exercise.id`.

### Tests

- [x] Owner Student authors private + shared notes.
- [x] Shared Teacher authors a note.
- [x] Unshared Teacher (in relation, no share row) → `NotFoundError` on author + list.
- [x] Stranger → `NotFoundError`.
- [x] List ordered `created_at ASC`; visibility filter (teacher sees own private + everyone's shared).

## Out of scope

- Notification on new shared note (general notifications feature).
- Cross-session aggregation (slice 048-ish — TS appearances in exercise history).
- Media attachments (phase 2).

## Blocked by

- 029 — `lesson_exercise.id` surrogate pattern (precedent)
- The training-session vertical (already shipped).
- 045 — Goal notes (last polymorphic Note extension; reuses pattern).
