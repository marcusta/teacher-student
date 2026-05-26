# Handoff — Training Session exercises + programs (033–034)

Use this document to start a **fresh agent session**. Do not re-discover Group B; it is shipped on `main` through slice **032** (`ea77b02`).

---

## Project context

- **Repo:** `teacher-student` — Bun + Hono + Kysely + SQLite, TypeBox, signals/MVVM web client (`@basics/core/client`).
- **Conventions:** actor-scoped service methods; `NotFoundError` (leak-safe) not `ForbiddenError`; `SelectComponent` not native `<select>`; `$each` keys must change when row content changes; Ousterhout total ops; no `Co-Authored-By` in commits.
- **Glossary:** `UBIQUITOUS_LANGUAGE.md`
- **Tests:** `bun test` (303 pass after 032); `bun run check:client` / `check:server`; after API changes `bun run generate`.
- **TDD:** vertical slices, one behavior RED → GREEN at a time (see `/tdd` skill). Do **033 fully** before **034**.

---

## Goal of this session

Implement **Group C** — symmetric **Program + Exercise** tracking on **Training Sessions**, mirroring Lesson slices **016 / 029 / 028 / 030**.

| Slice | Issue file | Delivers |
|-------|------------|----------|
| **033** | `issues/033-training-session-exercises.md` | `training_session_exercise` + student add/list/remove + teacher read via share |
| **034** | `issues/034-training-session-programs.md` | `training_session_program` + attach/detach snapshot-copy |

---

## Architectural decisions (already agreed)

1. **Write auth:** Only the **Student** who owns `training_sessions.student_id` may add/remove exercises or attach/detach programs. Teachers with `training_session_share` get **read-only** exercise/program lists (same gate as `getForViewer` / notes in 022).
2. **Exercise/Program catalog for students:** Exercises and Programs come from **connected Teachers** (`relations` table), not the student's own library. Add `listForStudent` (or one combined “teacher content”) on `ExerciseService` / `ProgramService` — do not reuse `listForTeacher`.
3. **No `created_by_id` yet:** Teacher-prescribed Training Sessions (SCOPE) are **out of scope**; do not add `created_by_id` in 033–034 unless you hit a hard blocker (document in issue instead).
4. **Row shape:** Match `lesson_exercise`: surrogate `id`, `source_program_id`, `notes` (row notes). Slice 034 writes `source_program_id`; 033 creates the column null for free-adds.
5. **Notes on `training_session_exercise`:** **Not** in 033–034 — follow-up slice (mirror 031) if needed.

---

## Suggested TDD order for 033

1. Migration + schema types
2. `ExerciseService.listForStudent` — empty / connected teachers / isolation
3. `addExercise` — happy path, idempotent, foreign exercise → NotFoundError
4. `listExercises` — student owner; teacher with share; teacher without share → NotFoundError
5. `removeExercise` — idempotent
6. Hydrate `exercises` on `TrainingSession` list/get
7. Routes + `bun run generate`
8. Web `/traningspass/:id` Övningar UI

## Suggested TDD order for 034

1. Migration `training_session_program`
2. `ProgramService.listForStudent`
3. `attachProgram` — snapshot rows + `source_program_id`
4. `detachProgram` — junction only, rows preserved
5. `create(programId?)` shorthand
6. Hydrate `programs[]`
7. Routes + codegen + web Program section

---

## Key files to read first

| Area | Path |
|------|------|
| Lesson exercise pattern | `server/services/lesson.service.ts` (`addExercise`, `exercisesByLesson`) |
| Lesson program pattern | `server/services/lesson.service.ts` (`attachProgram`, `programsByLesson`) |
| Training session today | `server/services/training-session.service.ts` |
| Share gate | `server/services/note.service.ts` → `assertTrainingSessionViewer` |
| Web lesson edit | `web/lessons/lesson-edit.component.ts` (Övningar + Program sections) |
| Web TS detail | `web/training-sessions/training-session-detail.component.ts` |
| API mount | `server/api/training-sessions.api.ts` |

---

## Suggested skills

- `/tdd` — RED → GREEN per behavior
- `/ubiquitous-language` — if new terms (e.g. student-visible catalog)
- `issues/033-*.md` / `issues/034-*.md` — acceptance criteria source of truth

---

## Copy-paste prompt for new session

```
Pick up teacher-student on main (032 Övningshistorik shipped, 303+ tests).

Implement Group C in order:
1. Slice 033 — issues/033-training-session-exercises.md
2. Slice 034 — issues/034-training-session-programs.md

Read issues/HANDOFF-033-034.md for architecture decisions and TDD order.

Use /tdd: vertical slices, RED → GREEN one behavior at a time.
After server API changes: bun run generate.
Verify: bun run check:client, bun run check:server, bun test.

Conventions: actorId-first services; NotFoundError leak-safe; SelectComponent;
$each keys change when row content changes; no Co-Authored-By in commits.

Mirror lesson analogs: 016/029 (exercises), 028/030 (programs).
Student-only writes on Training Session; teacher with share is read-only for 033–034.

Start 033 with migration + ExerciseService.listForStudent — confirm plan then first failing test.
```

---

## After 033–034 (not this session)

- **035** (proposed): Notes on `training_session_exercise` (mirror 031)
- **036** (proposed): Extend exercise history to include Training Session appearances
- **Plan / Goal / Question** entities per `SCOPE.md` (no issue files yet)
