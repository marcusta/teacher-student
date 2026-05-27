# Handoff — Goal feature (040–044)

Use this document to start a **fresh agent session**. Slice 039 (teacher views student plans) and the two tech-debt fixes should be shipped on `main` before starting this group.

---

## Project context

- **Repo:** `teacher-student` — Bun + Hono + Kysely + SQLite, TypeBox, signals/MVVM web client (`@basics/core/client`).
- **Conventions:** actor-scoped service methods; `NotFoundError` (leak-safe) not `ForbiddenError`; `SelectComponent` not native `<select>`; `$each` keys must change when row content changes; Ousterhout total ops; no `Co-Authored-By` in commits.
- **Glossary:** `UBIQUITOUS_LANGUAGE.md` — **Goal**, **Goal Share**, **Plan–Goal Link** are the new terms.
- **Domain spec:** `SCOPE.md`.
- **Tests:** `bun test`; `bun run check:client` / `check:server`; after API changes `bun run generate`.
- **TDD:** vertical slices, one behavior RED → GREEN at a time (see `/tdd` skill). Do **040 → 041 → 042 → 043 → 044** in order.

---

## Goal of this session

Implement the **Goal** vertical: student-owned long-term objectives, per-goal teacher sharing, status transitions, and Plan attachment.

| Slice | Issue file | Delivers |
|-------|------------|----------|
| **040** | `issues/040-student-goals-crud.md` | `goal` table + student CRUD + `/mal` page |
| **041** | `issues/041-goal-teacher-sharing.md` | `goal_share` junction + share/unshare endpoints |
| **042** | `issues/042-teacher-views-student-goals.md` | Teacher reads shared goals via student-detail |
| **043** | `issues/043-goal-status-transitions.md` | `markAchieved` / `reopen` for owner + shared teacher |
| **044** | `issues/044-goal-plan-attachment.md` | `goal_plan` junction; goals on Plan detail |

---

## Architectural decisions (already agreed)

1. **Goal ownership:** Only the owning **Student** creates, edits, abandons, deletes, or manages sharing.
2. **Sharing:** Per-goal explicit list via `goal_share` junction. Teacher must be in an active **Relation** with the student. Idempotent share/unshare. Teachers do **not** see co-watchers in MVP.
3. **Goal fields:** `title`, `description`, `target_date` (ISO date), `achieved_at` (ISO timestamp), `status` (`active` / `achieved` / `abandoned`).
4. **Status transitions:**
   - `markAchieved` / `reopen` — student owner OR shared teacher.
   - `abandon` — student owner only.
   - `achieved_at` set on first transition to `achieved`, cleared on `reopen`, not rewritten on idempotent re-achieve.
   - `achieved` ↔ `abandoned` requires going through `active` first (`ConflictError` otherwise).
5. **Plan link:** Many-to-many via `goal_plan(goal_id, plan_id)`. Both rows must be owned by the same student. Archived plans reject new attaches (existing links preserved, mirroring lesson/TS plan_id rule).
6. **Plan-detail visibility leak (deliberate):** Anyone who can read a Plan sees the titles of goals attached to it, even goals not individually shared. The student attached them under that shared context.
7. **DTO hydration:**
   - `Goal` (owner view) → includes `sharedTeacherIds: string[]` and `planIds: string[]`.
   - `Goal` (teacher view) → omits `sharedTeacherIds`; includes `planIds`.
   - `PlanDetail` → includes `goals: { id, title, status, targetDate }[]`.
8. **Out of scope (whole group):** goal-scoped exercise history, achievement evidence (notes/media), notifications, bulk share-all.

---

## Auth matrix

| Action | Allowed |
|--------|---------|
| Create / edit / abandon Goal | Student owner |
| Share / unshare Goal | Student owner |
| Read Goal | Owner + teachers in `goal_share` |
| Transition `active ↔ achieved` | Owner OR shared teacher |
| Attach / detach Goal ↔ Plan | Student owner (of both, by invariant) |
| Read Plan goals on `/api/plans/:id` | Anyone who can read the Plan (owner + connected teacher) |

---

## Suggested TDD order for 040

1. Migration `024_goals.ts` + schema types
2. `GoalService.create` — happy path, empty title rejected, invalid date rejected
3. `listForStudent` — ordering + isolation
4. `getForStudent` — 404 for stranger
5. `update` — patch semantics + status not mutable
6. `abandon` — idempotent + 404 for stranger
7. Routes + `bun run generate`
8. Web `/mal` page + nav link

## Suggested TDD order for 041

1. Migration `025_goal_share.ts`
2. `share` — happy path, idempotent, unconnected teacher → NotFoundError
3. `unshare` — idempotent + ownership gate
4. `listSharedTeachers` — sorted, owner-only
5. DTO hydration of `sharedTeacherIds`
6. Routes + codegen + teacher picker UI

## Suggested TDD order for 042

1. `listForStudentAsTeacher` — only shared goals; non-relation → NotFoundError
2. `getForTeacher` — shared returns; unshared → NotFoundError
3. Extend `/api/goals/:id` route to allow shared teacher
4. Add `/api/students/:id/goals` route
5. Web: student-detail Mål section

## Suggested TDD order for 043

1. `markAchieved` — owner path, sets `achieved_at`
2. `markAchieved` — shared teacher path
3. `markAchieved` — idempotent (no rewrite)
4. `markAchieved` — from `abandoned` → ConflictError
5. `reopen` — clears `achieved_at`
6. `abandon` — shared teacher attempt → NotFoundError
7. Routes + web buttons (both student and teacher views)

## Suggested TDD order for 044

1. Migration `026_goal_plan.ts`
2. `attachToPlan` — happy path; both owned; active plan only
3. `detachFromPlan` — idempotent + ownership gate
4. Hydrate `PlanDetail.goals`
5. Hydrate `Goal.planIds`
6. Routes + codegen + Plan-detail Mål section + Goal-detail plan picker

---

## Key files to read first

| Area | Path |
|------|------|
| Student-owned entity pattern | `server/services/plan.service.ts` (035) |
| Teacher student catalog | `server/api/students.api.ts`, slice 039 |
| Per-row sharing (junction reference) | `server/services/training-session.service.ts` (share table on TS) |
| Status transition + ConflictError pattern | `server/services/lesson.service.ts` (`transition`) |
| Web plan list/detail | `web/plans/plans.component.ts`, `plan-detail.component.ts` |
| Domain glossary | `UBIQUITOUS_LANGUAGE.md` |

---

## Suggested skills

- `/tdd` — RED → GREEN per behavior
- `/ubiquitous-language` — glossary already updated; revisit if Goal terms evolve
- Issue files are the source of truth for acceptance.

---

## Copy-paste prompt for new session

```
Pick up teacher-student on main (slice 039 + tech debt shipped).

Implement the Goal vertical in order:
1. Slice 040 — issues/040-student-goals-crud.md
2. Slice 041 — issues/041-goal-teacher-sharing.md
3. Slice 042 — issues/042-teacher-views-student-goals.md
4. Slice 043 — issues/043-goal-status-transitions.md
5. Slice 044 — issues/044-goal-plan-attachment.md

Read issues/HANDOFF-040-044.md for architecture decisions and TDD order.

Use /tdd: vertical slices, RED → GREEN one behavior at a time.
After server API changes: bun run generate.
Verify: bun run check:client, bun run check:server, bun test.

Conventions: actorId-first services; NotFoundError leak-safe; SelectComponent;
$each keys change when row content changes; no Co-Authored-By in commits.

Glossary: UBIQUITOUS_LANGUAGE.md — Goal, Goal Share, Plan–Goal Link.

Start 040 with migration + GoalService.create — confirm plan then first failing test.

/tdd /ubiquitous-language
```

---

## After 040–044 (not this session)

- **045** (proposed): Notes on `training_session_exercise` (mirror 031)
- **046** (proposed): Exercise history includes Training Session appearances
- **047** (proposed): Teacher-prescribed TS + `created_by_id`
- **048** (proposed): Goal-scoped exercise history (cross-cut once Goal + history exist)
