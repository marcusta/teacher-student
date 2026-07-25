# 049 — Goal ↔ Horse link

**Type:** AFK
**Status:** todo

## What to build

A **Student** can point a **Goal** at one of their own **Horses** — "Flygande galoppombyten med Saga" is a
different goal from the same wording on another horse. The link is a single optional `horse_id` on `goal`,
exactly like **Lesson** (007) and **Training Session** (012); it is not a junction.

A Goal without a horse stays valid — horse is optional and stays optional. Rider-level goals ("bli tryggare
i skritt") have no horse; horse-level goals do.

Sharing is unchanged: a Teacher who can already read the Goal (via `goal_share`, slice 041) also sees its
horse name. The Teacher gets no new access to the stable beyond the one horse named on a shared goal — that
is a strictly narrower leak than `GET /students/:id/horses` (011), which the connected Teacher already has.

## Acceptance criteria

### Schema

- [ ] Migration `029_goals_horse_id.ts` adds `horse_id` text NULL → `horses.id` `ON DELETE SET NULL` to `goal`.
- [ ] Index `goal_horse_id_idx` on `goal(horse_id)`.
- [ ] `GoalTable` in `server/db/schema.ts` gains `horse_id: string | null`.

### Service

- [ ] `CreateGoalInput` / `UpdateGoalInput` gain `horseId?: string | null` with the tri-state patch semantics
      used by `TrainingSessionService`: `undefined` = leave alone, `null` = clear, id = set.
- [ ] `GoalService` validates via `assertOwnUnarchivedHorse(studentId, horseId)` — the horse must exist, be
      owned by the caller, and not be archived. Otherwise `NotFoundError('Horse not found')` (leak-safe).
- [ ] `Goal` and `GoalTeacherView` DTOs gain `horseId: string | null` and server-resolved
      `horseName: string | null`, hydrated by `leftJoin('horses', 'horses.id', 'goal.horse_id')`.
- [ ] Every read path carries the horse: `listForStudent`, `getForStudent`, `listForStudentAsTeacher`,
      `getForTeacher`, and the `create` return value.
- [ ] Archiving a Horse does **not** clear the link — an existing goal keeps naming the archived horse; the
      horse only disappears from the *picker*. Same rule as `horse.danger.body` copy for lessons and passes.

### API

- [ ] `POST /api/goals` and `PATCH /api/goals/:id` accept
      `horseId: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()]))`.
- [ ] `bun run generate` regenerates `web/api/goals.gen.ts`.

### Web

- [ ] `/mal/nytt` create form gains a horse `SelectComponent` below the target date, first option
      `{ value: '', label: t('goal.horse.none') }`. Field is hidden entirely when the student has no
      unarchived horses (same `className` trick as `training-session-create.component.ts`).
- [ ] `/mal/:id` detail: horse is an editable field in the "Uppgifter" section for the owner, read-only text
      for a viewing Teacher. `''` in the select patches to `null`.
- [ ] Goal list rows and the detail header show the horse in the **meta** line, not as a
      `DetailHeaderChip` — chips require an `href` and `/hastar/:id` is owner-only, so a chip would be
      a dead link for the Teacher who is precisely the reader that needs the horse named.
- [ ] Selectable horses filter `archivedAt === null`; if the goal's current horse is archived it still renders
      its name, it is just not re-selectable.
- [ ] New i18n keys in **both** `web/i18n/sv.json` and `web/i18n/en.json`:
      `goal.field.horse`, `goal.horse.none`, `goal.meta.horse`, `goalCreate.field.horse`,
      `goalCreate.field.horse.hint`.

### Tests

- [ ] Service: create with `horseId` happy path; create with another student's horse → `NotFoundError`;
      create with an archived horse → `NotFoundError`.
- [ ] Service: update tri-state — omit keeps, `null` clears, id sets; foreign/archived horse rejected.
- [ ] Service: `horseName` hydrated in `listForStudent`, `getForStudent`, `getForTeacher`,
      `listForStudentAsTeacher`.
- [ ] Service: archiving the horse leaves `horseId` intact and `horseName` still resolving.
- [ ] Routes: `POST /api/goals` and `PATCH /api/goals/:id` with `horseId`, 200 / 401 / 404 paths.
- [ ] `bun run check:i18n` passes (sv/en key parity).

## Out of scope

- Many horses per goal. If a goal genuinely covers two horses, write two goals. Revisit only with real use.
- Filtering the `/mal` list by horse.
- A "goals for this horse" section on horse detail (reverse view) — separate slice if wanted.
- Any change to who can read a Goal. Horse adds a field, not a permission.

## Blocked by

- 040 — Goals CRUD (done)
- 008 — Student Horses CRUD (done)
