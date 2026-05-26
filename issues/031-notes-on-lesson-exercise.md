# 031 — Notes on a `lesson_exercise` row (per-instance reflection)

**Type:** AFK
**Status:** done

## What to build

Both **Teacher** and **Student** of a Lesson can post Notes against a single `lesson_exercise` row — i.e. against this Exercise as performed in this Lesson, not against the abstract library Exercise. Each Note has a **Visibility** (`private` author-only / `shared` to both parties). This is the foundation for "see evolution of Exercise X for Rider Y over time" (slice 032).

`NoteService` already speaks polymorphically (`parent_kind` is open); this slice extends it to accept `parent_kind='lesson_exercise'` with the proper authorization scope.

## Acceptance criteria

- [x] `NoteParentKind` in `db/schema.ts` already lists `lesson_exercise`; ensure no service-level branch rejects it.
- [x] `NoteService.create(authorId, { parentKind: 'lesson_exercise', parentId, body, visibility })`: looks up `lesson_exercise.id = parentId`, joins to `lessons`. Author must be the lesson's teacher OR the lesson's student — else `NotFoundError`. Persists.
- [x] `NoteService.list(actorId, { parentKind: 'lesson_exercise', parentId })`: lookup same as above; if actor isn't either party → `NotFoundError`. Returns notes where `author_id = actorId OR visibility = 'shared'`, ordered `created_at ASC`.
- [x] `NoteService.update` / `delete` reuse existing author-only path; no auth changes needed since identity is on `author_id`.
- [x] API: existing `POST /api/notes` already accepts `parentKind` — verify TypeBox enum includes `lesson_exercise`. `GET /api/notes?parentKind=lesson_exercise&parentId=…`. Codegen run.
- [x] Web: lesson edit page `/lektioner/:id` exercises list — each Exercise row gets an inline "Anteckningar" disclosure with the existing notes thread UI (mirroring the lesson-level notes UI from slice 017). `$each` key includes the lesson_exercise.id so reorder doesn't lose thread state.
- [x] Tests: service (teacher can post a private note → invisible to student; teacher can post a shared note → student sees it; student can post on their own lesson's exercise; outsider blocked with NotFoundError; list returns ordered created_at ASC; only the lesson's two parties resolve the parent), routes (200, 404).

## Blocked by

- 029 — `lesson_exercise.id` surrogate (the parentId target)
- 017 — Teacher writes Notes on a Lesson (NoteService scaffolding + thread UI to mirror)
