# 028 — Teacher attaches Program when creating Lesson

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can optionally select one of their own **Programs** when scheduling a **Lesson**. On create, the Program's exercises are **snapshot-copied** into the Lesson's exercise list (`lesson_exercise`) preserving order and per-row notes, and the Lesson remembers the source via `lesson.program_id`. Later edits to the Program do not affect the Lesson — this is the snapshot semantics defined in SCOPE "Tre-lagers planering".

If the teacher does not pick a Program, behavior is unchanged from slice 012: empty exercise list, `program_id` null.

## Acceptance criteria

- [x] Migration adds nullable `program_id TEXT NULL` column to `lessons` with FK → `programs.id` ON DELETE SET NULL, plus index on `(program_id)`.
- [x] `LessonService.create(teacherId, { studentId, scheduledAt, programId? })` accepts optional `programId`. When supplied: verifies the teacher owns the Program (`NotFoundError` on missing / foreign-owned), then snapshot-copies every `program_exercise` row into `lesson_exercise` preserving `sort_order` and `notes` (verbatim copy), in one transaction with the lesson insert. Sets `lessons.program_id = programId`. When omitted: existing behavior (no exercises, `program_id` null).
- [x] API: `POST /api/lessons` body gains optional `programId` (TypeBox optional string, min 1). `Lesson` / `LessonForUser` response shape gains `programId: string | null` and `programTitle: string | null` (left join `programs`). Codegen run; `web/api.ts` reflects the new fields.
- [x] Web: `/lektioner` create form gets a Program SelectComponent listing the teacher's own Programs, with "(inget program)" as the first option (value `""` → omit from request). On the lesson list rows (and lesson edit page when applicable) show a "Från program: <title>" badge when `programTitle` is set.
- [x] Tests: service (create with `programId` copies all `program_exercise` rows into `lesson_exercise` preserving order; `notes` on program rows are copied verbatim; create with foreign / non-existent program → `NotFoundError`; create without `programId` leaves `program_id` null and exercise list empty; the copy is a true snapshot — later mutating the source Program leaves the lesson's `lesson_exercise` rows unchanged), routes (200 happy path, 404 for stranger program, 400 validation), web smoke if pattern exists in repo.

## Blocked by

- 026 — Teacher adds an Exercise to a Program (need `program_exercise` rows to snapshot)
- 012 — Teacher schedules and lists own Lessons (extends the create path)
