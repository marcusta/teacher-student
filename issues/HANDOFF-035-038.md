# Handoff — Plan umbrella (035–038)

Use this document to start a **fresh agent session**. Group C (033–034) should be shipped on `main` before starting Group D.

---

## Project context

- **Repo:** `teacher-student` — Bun + Hono + Kysely + SQLite, TypeBox, signals/MVVM web client (`@basics/core/client`).
- **Conventions:** actor-scoped service methods; `NotFoundError` (leak-safe) not `ForbiddenError`; `SelectComponent` not native `<select>`; `$each` keys must change when row content changes; Ousterhout total ops; no `Co-Authored-By` in commits.
- **Glossary:** `UBIQUITOUS_LANGUAGE.md` — **Plan** vs **Program** distinction is critical.
- **Domain spec:** `SCOPE.md` — `plan` table, three-layer planning, Plan authorization.
- **Tests:** `bun test`; `bun run check:client` / `check:server`; after API changes `bun run generate`.
- **TDD:** vertical slices, one behavior RED → GREEN at a time (see `/tdd` skill). Do **035 → 036 → 037 → 038** in order; 038 last.

---

## Goal of this session

Implement **Group D** — **Plan** (träningsplan): student-owned umbrella with `plan_id` on **Lessons** and **Training Sessions**.

| Slice | Issue file | Delivers |
|-------|------------|----------|
| **035** | `issues/035-student-plans-crud.md` | `plans` table + student CRUD + teacher catalog |
| **036** | `issues/036-lessons-plan-id.md` | `plan_id` on lessons (teacher attach/detach) |
| **037** | `issues/037-training-sessions-plan-id.md` | `plan_id` on training sessions (student attach/detach) |
| **038** | `issues/038-plan-detail-and-linked-items.md` | Plan detail + linked lesson/TS lists |

---

## Architectural decisions (already agreed)

1. **Plan ownership:** Only the owning **Student** creates, updates, or archives a **Plan**. No hard delete in MVP — `status: archived` only.
2. **`primary_teacher_id`:** Optional soft label. Must be a connected **Teacher** or `null`. No elevated permissions in MVP.
3. **Dates:** Optional `start_date` / `end_date` (ISO date strings). Display-only — no enforcement logic.
4. **`plan_id` FK:** Nullable on `lessons` and `training_sessions`. `REFERENCES plans(id) ON DELETE SET NULL`. Index on `plan_id`.
5. **Attach rules:** `plan.student_id` must match the lesson/TS student; plan must be `active`. Archived plans reject new links; existing links remain.
6. **Lesson plan writes:** Lesson **Teacher** sets/clears `plan_id` on create/update (row author).
7. **Training Session plan writes:** **Student** session owner only. Teacher with `training_session_share` is **read-only** for plan fields (same as 033–034).
8. **Detach rules:** Setting `plan_id = null` allowed for **Plan owner (Student)** OR **row author** (lesson teacher / TS student). Detach ≠ delete the lesson or session.
9. **DTO hydration:** Expose nullable `planId` + `planTitle` on `Lesson` and `TrainingSession` list/detail responses.
10. **Teacher catalog:** `GET /api/students/:id/plans` for connected teachers (mirror horses). Student list: `GET /api/plans`.
11. **Out of scope:** `goal` table, `created_by_id` on TS, teacher-prescribed TS, plan-scoped exercise history.

---

## Auth matrix

| Action | Lesson | Training Session |
|--------|--------|------------------|
| Attach to plan | Lesson **Teacher** | TS **Student** owner |
| Detach from plan | Plan **Student** or lesson **Teacher** | Plan **Student** or TS **Student** owner |
| Read plan catalog | Teacher via `/students/:id/plans` | Student via `/plans` |
| Mutate plan entity | **Student** owner only | **Student** owner only |

---

## Suggested TDD order for 035

1. Migration `021_plans.ts` + schema types
2. `PlanService.create` — happy path, empty title rejected
3. `listForStudent` — empty, isolation between students
4. `update` — title, `primaryTeacherId` validation (connected teacher / NotFoundError)
5. `archive` — idempotent
6. `listForStudentAsTeacher` — relation gate
7. `assertActivePlanForStudent` — active vs archived
8. Routes + `bun run generate`
9. Web `/planer` list + create

## Suggested TDD order for 036

1. Migration `022_lessons_plan_id.ts`
2. `create` with `planId` — happy path + foreign/archived → NotFoundError
3. `update` planId set/clear by teacher
4. `detachFromPlan` — student owner + teacher row author
5. Hydrate `planId` + `planTitle`
6. Routes + codegen + lesson form picker

## Suggested TDD order for 037

1. Migration `023_training_sessions_plan_id.ts`
2. `create` / `update` with `planId` — student owner
3. `detachFromPlan` — student paths
4. Teacher with share cannot mutate planId
5. Hydrate on list/get
6. Routes + codegen + TS form picker

## Suggested TDD order for 038

1. `getDetail` — linked lessons + TS queries
2. Teacher read via relation gate
3. Route
4. Web `/planer/:id` detail + edit + archive
5. Optional plan label on lesson/TS list rows

---

## Key files to read first

| Area | Path |
|------|------|
| Student-owned entity pattern | `server/services/horse.service.ts` |
| Optional FK on lesson | `server/services/lesson.service.ts` (`horseId`) |
| Student-only TS writes | `server/services/training-session.service.ts` |
| Teacher student catalog | `server/api/students.api.ts`, `server/services/horse.service.ts` |
| Web stable / horses | `web/stable/stable.component.ts` |
| Web lesson create | `web/lessons/lessons.component.ts` |
| Web TS create | `web/training-sessions/training-sessions.component.ts` |
| Domain glossary | `UBIQUITOUS_LANGUAGE.md`, `SCOPE.md` |

---

## Suggested skills

- `/tdd` — RED → GREEN per behavior
- `/ubiquitous-language` — update glossary if Plan terms evolve
- `issues/035-*.md` … `issues/038-*.md` — acceptance criteria source of truth

---

## Copy-paste prompt for new session

```
Pick up teacher-student on main (Group C shipped: 033 TS exercises + 034 TS programs, 333+ tests).

Implement Group D in order:
1. Slice 035 — issues/035-student-plans-crud.md
2. Slice 036 — issues/036-lessons-plan-id.md
3. Slice 037 — issues/037-training-sessions-plan-id.md
4. Slice 038 — issues/038-plan-detail-and-linked-items.md

Read issues/HANDOFF-035-038.md for architecture decisions and TDD order.

Use /tdd: vertical slices, RED → GREEN one behavior at a time.
After server API changes: bun run generate.
Verify: bun run check:client, bun run check:server, bun test.

Conventions: actorId-first services; NotFoundError leak-safe; SelectComponent;
$each keys change when row content changes; no Co-Authored-By in commits.

Mirror analogs: 008/011 (Plan CRUD + teacher catalog), 014 (lesson plan_id),
020/033 (TS plan_id + student-only writes), student-detail (038 read-only teacher view).

Plan vs Program: Plan = student umbrella (träningsplan); Program = teacher routine (ridprogram).

Start 035 with migration + PlanService.create — confirm plan then first failing test.

/tdd /ubiquitous-language
```

---

## After 035–038 (not this session)

- **039** (proposed): `goal` table + `plan_id` on goals
- **040** (proposed): Notes on `training_session_exercise` (mirror 031)
- **041** (proposed): Exercise history includes Training Session appearances
- **042** (proposed): Teacher-prescribed TS + `created_by_id`
