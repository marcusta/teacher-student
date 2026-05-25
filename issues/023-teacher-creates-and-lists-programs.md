# 023 — Teacher creates and lists own Programs in library

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can create reusable **Programs** (named exercise routines / "ridprogram") in their own library, and list them. A Program is a teacher-owned template, not bound to a student or a date. Mirrors how 005 introduced the Exercise library — same library surface, distinct entity.

This slice introduces the `program` table per the updated SCOPE.md (`id, teacher_id, title, description?, created_at`). Earlier scope had a different shape (per-student umbrella with dates); since no feature has shipped against the old shape, supersede / rewrite the relevant migration.

## Acceptance criteria

- [x] Migration creates `program` table: `id TEXT PRIMARY KEY`, `teacher_id TEXT NOT NULL REFERENCES user(id)`, `title TEXT NOT NULL`, `description TEXT`, `created_at INTEGER NOT NULL`. Any pre-existing `program` / `program_exercise` migration with the old shape is replaced (no feature uses it yet). `program_exercise` table is **not** created in this slice — comes in 026.
- [x] `ProgramService.create(actorId, { title, description? })` inserts and returns the row. Enforces `title` non-empty (typebox validates).
- [x] `ProgramService.listForTeacher(actorId)` returns all Programs where `teacher_id = actorId`, sorted `created_at DESC`.
- [x] API: `POST /api/programs` and `GET /api/programs`. Auth required. Both scoped to `actor.id`.
- [x] Typebox schemas for request/response. Codegen run (`bun run generate` with `BASICS_API_OUT_DIR=web/api`).
- [x] Web: minimal teacher-side "Program" library page (mirror exercise library from 005) — list + create form. `$each` keys use `${id}:${createdAt}`.
- [x] Integration tests: create returns row; listForTeacher returns own programs only; another teacher's programs not visible; unauthenticated request rejected at route level.

## Blocked by

None — can start immediately (uses only `user` + auth, both shipped).
