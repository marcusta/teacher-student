# 047 — Dashboard read model (`GET /api/dashboard`)

**Type:** AFK
**Status:** done (backend)

## What to build

One server-side read model answering IA §3.1's question — *"what needs me today?"* — in a single
request. `DashboardService` + `dashboard.api.ts` + regenerated client, as one slice: the service
return type **is** the wire contract (the generator derives it), so splitting them would ship half
a contract.

Six facts, all first-person, all derived from data rather than from a presumed role:

- `nextLesson` — soonest `planned` Lesson on either side of the caller
- `latestFeedback` — the single newest **shared** Note authored by **someone else**, across every
  parent the caller may read
- `awaitingFeedback[]` — past teaching-side occasions the caller has written no Note on
- `activePlans[]` / `goalsNearingTarget[]` — the caller's **own** Plans and Goals
- `pendingInvitations` — count
- `capabilities { teaches, rides }` — which side(s) of `relations` the caller occupies

The full field-by-field contract, with every query and every authorization rule, is the frozen
contract sketch delivered alongside this issue. **Do not re-derive the semantics from this file** —
it lists acceptance criteria, not definitions.

Three definitions worth restating here because they are the ones easiest to get wrong:

- **"Nearing target"** = `status='active'` AND `target_date` set AND `target_date <= today + 30d`.
  **Overdue Goals are included** (they need the reader more, not less), and the payload carries
  **no `overdue` flag** — IA §3.13 makes overdue supporting metadata, and `goal-copy.isOverdue`
  already owns that definition on the client.
- **"Awaiting feedback"** = the occasion has happened, the caller is on the teaching side of it,
  and the caller has authored **no Note of any visibility** on the occasion itself. Bounded to the
  last 90 days and to 5 rows, with no total count. Note this deviates from IA §3.1's word
  *"upcoming"*: feedback on an occasion that has not happened is not a thing anyone can write, and
  upcoming Lessons are already served by `nextLesson`.
- **`latestFeedback` has no read-state.** IA §3.1 forbids deriving "new" from timestamps and this
  slice adds no `read_at`. It is *the latest*, not *the unread*.

## Acceptance criteria

### Schema

- [x] **No migration.** Verified against `server/db/schema.ts`: every field reads existing columns
      on `relations`, `lessons`, `lesson_exercise`, `exercises`, `horses`, `plans`, `goal`,
      `goal_share`, `training_sessions`, `training_session_share`, `notes`, `invitations`, `users`.
      No new table, no new column, no widened union.
- [x] **No new index either.** Every driving query is covered by an index that already exists:
      `relations_teacher_idx` / `relations_student_idx` (003), `invitations_invitee_idx` (002),
      `lessons_teacher_idx` / `lessons_student_idx` (006), `notes_parent_idx (parent_kind,
      parent_id)` (009), `training_sessions_student_idx` (010),
      `training_session_share_teacher_idx` (011), `plans_student_status_idx` (021),
      `goal_student_status_idx` (024), `goal_share_teacher_idx` (025).
      `notes_parent_idx` in particular is what makes the `latestFeedback` strategy viable; if a
      future change makes a covering `notes(parent_kind, parent_id, created_at)` necessary, that is
      a migration and therefore a different slice.
- [x] `server/db/migrations/` is untouched by this slice. State this in the PR body.

### Service

- [x] New `server/services/dashboard.service.ts` exporting `DashboardService` and the response
      interfaces `DashboardView`, `DashboardCapabilities`, `DashboardNextLesson`,
      `DashboardFeedback`, `DashboardAwaitingItem`, `DashboardPlanRef`, `DashboardGoalRef`.
      All must be **exported interfaces** — the generator only expands named, interface-like
      symbols declared under `/server/`.
- [x] Single entry point `get(userId: string, userEmail: string, now?: Date): Promise<DashboardView>`.
      `now` is injected (defaulting to `new Date()`) so every window boundary is assertable — same
      convention as `goal-copy.isOverdue(goal, todayIso)` and `student-copy.nextLessonWith(…, nowIso)`.
- [x] Registered in `server/services/index.ts` and destructured in `server/main.ts`.
- [x] `capabilities` from two `EXISTS` probes on `relations` in one statement. Never from a column,
      never from a count of anything else.
- [x] `nextLesson`: `(teacher_id = me OR student_id = me) AND status='planned' AND scheduled_at >= now`,
      `ORDER BY scheduled_at ASC LIMIT 1`; the disjunction **is** the authorization. Exercise
      preview is a second keyed query, skipped entirely when no Lesson was found, capped at 3 names
      with `exerciseCount` carrying the total.
- [x] `latestFeedback` is five `UNION ALL` branches each `ORDER BY notes.created_at DESC,
      notes.id DESC LIMIT 1`, not a scan of `notes` with a five-way `OR` of `EXISTS`. The naive form
      puts an unbounded global table in the driving position and evaluates five correlated
      subqueries per row. **The stronger claim — that this is "driven from the caller's own graph" —
      is measured false; see implementation note 1.** The tiebreak is note 3.
- [x] Each branch's parent rule is transcribed from the corresponding `NoteService` gate:
      `assertLessonMember`, `assertLessonExerciseMember`, `assertTrainingSessionViewer`,
      `assertTrainingSessionExerciseViewer`, `assertGoalViewer`.
- [x] `parent_kind` values `'student'` and `'exercise_question'` are **unreachable** — `assertCanRead`
      rejects both — and must not be selectable by any branch.
- [x] `DashboardFeedback` carries `targetKind`/`targetId`/`targetLabel` alongside
      `parentKind`/`parentId`, because `lesson_exercise` and `training_session_exercise` have no
      route of their own. Enrichment runs **once, on the winning row only**.
- [x] **No `deepLink` field.** The client builds hrefs (§3.8 of the contract):
      `web/app/route-guard.ts`'s `APP_ROUTES` is this app's single route enumeration and a
      server-emitted path bypasses it; every existing href in `web/` is built in a `*-copy.ts`; and
      the routes are Swedish while the API is English.
- [x] `awaitingFeedback`: two `UNION ALL` branches (`lessons.teacher_id = me AND status='completed'`;
      `training_session_share.teacher_id = me`), each with a `NOT EXISTS` on a Note authored by the
      caller **of any visibility**, a 90-day floor, `ORDER BY occurred_at DESC`, `LIMIT 5`, and
      **no total count**.
- [x] `activePlans` and `goalsNearingTarget` are scoped by **ownership** (`student_id = me`), never
      by Relation. A Teacher's view of a connected Student's Plans and Goals belongs to Elevvy
      (IA §3.4), and surfacing them here would put another person's deadlines on my dashboard.
- [x] `goalsNearingTarget` compares `YYYY-MM-DD` strings against a `horizonDate` computed in the
      service from `now`. No `overdue` boolean on the wire.
- [x] `pendingInvitations` normalizes the email with `trim().toLowerCase()` — byte-identical to
      `InvitationService.listForUser`. `DashboardService` does **not** depend on `InvitationService`.
- [x] `generatedAt` carries the server's assembly time.
- [x] Statement count is **constant in the number of rows**: 7 minimum, 9 maximum (the contract's
      "6–8" was an arithmetic slip — see implementation note 2). No per-row display-name lookup, no
      per-parent note query, no per-Lesson exercise query.

### API

- [x] New `server/api/dashboard.api.ts` exporting `createDashboardApi(svc: DashboardService)` with a
      single `get` descriptor: `method: 'GET'`, `path: '/dashboard'`, `middleware: [requireAuth()]`.
- [x] **No `schema` field** — the endpoint takes no input, exactly like `lessons.list` and
      `students.list`. And **no TypeBox response schema**: this repo derives response types from the
      `fn` return type via `node_modules/@basics/core/generate-api.ts`; a hand-written response schema
      would be a second source of truth that nothing validates against.
- [x] `fn` reads `requireUser(c)` and passes `user.id` **and** `user.username` — `AuthUser.username`
      is the email (`UserService` returns `{ id, username: row.email }`), which
      `pendingInvitations` needs.
- [x] Mounted in `server/main.ts`: `mount(app, '/api', createDashboardApi(dashboardService))`.
- [x] `bun run generate` run, and `web/api/dashboard.gen.ts` committed. Verify the generated
      interfaces match §1 of the contract field-for-field — a nested type that came out inlined or
      `any` means an interface was not exported.
- [x] `bun run check:server`, `bun run check:client` and `bun run check:test` all pass.

### Tests

New `server/services/dashboard.service.test.ts`, following the existing service-test conventions.

- [x] **Zero-relation account.** A freshly registered user with no Relations and no content gets a
      **valid, complete** response: `capabilities.teaches === false`, `capabilities.rides === false`,
      `nextLesson === null`, `latestFeedback === null`, and `awaitingFeedback` / `activePlans` /
      `goalsNearingTarget` all `[]`. Never a throw, never a 404. This is the post-registration state
      every account lands in (IA §3.20).
- [x] Same user, after creating a Goal and a Plan with no Teacher anywhere: both appear.
      Ownership is not gated on Relations (SCOPE.md "Roller"; IA §3.13).
- [x] `capabilities.teaches` flips to `true` only once a `relations` row with `teacher_id = me`
      exists; `rides` likewise for `student_id = me`; a user who is both gets both `true`.

**Leak-safe 404 / non-disclosure, one per field.** The dashboard takes no id so it never 404s as a
whole; the obligation is that no field ever contains a row the caller could not have fetched
directly. Each of these asserts absence, and the paired positive control asserts the fixture is
otherwise correct:

- [x] `nextLesson`: a Lesson between two *other* users, scheduled sooner than the caller's own,
      never appears — and the caller's own still does.
- [x] `latestFeedback` / `lesson`: a shared Note on a Lesson the caller is neither teacher nor
      student of never appears, even when it is the newest shared Note in the database.
- [x] `latestFeedback` / `lesson_exercise`: same, via the junction row.
- [x] `latestFeedback` / `training_session`: a shared Note on a Training Session the caller is
      neither owner of nor shared into never appears. A Teacher **in a Relation but without a
      `training_session_share` row** is excluded — Relation is not access.
- [x] `latestFeedback` / `training_session_exercise`: same, via the junction row.
- [x] `latestFeedback` / `goal`: a shared Note on a Goal the caller neither owns nor has a
      `goal_share` row for never appears. A Teacher in a Relation but without the share is excluded.
- [x] `latestFeedback` excludes the caller's **own** notes even when they are the newest.
- [x] `latestFeedback` excludes `visibility='private'` notes authored by others, on every parent kind.
- [x] `latestFeedback` never selects a hand-inserted `parent_kind='student'` or
      `'exercise_question'` shared note — those kinds are unreadable via `NoteService.assertCanRead`
      and must be unreachable here too.
- [x] `latestFeedback` picks the genuinely newest across **different** parent kinds — fixture with a
      Goal note, a Lesson note and a `training_session_exercise` note seconds apart.
- [x] `latestFeedback` returns `null`, not a partial object, when the caller has readable parents
      but no qualifying Note.
- [x] `awaitingFeedback`: a completed Lesson the caller **rode** (was the student on) never appears —
      this block is the teaching side only.
- [x] `awaitingFeedback`: a Training Session the caller was **unshared** from disappears.
- [x] `awaitingFeedback`: a Lesson on which the caller wrote a **private** note is excluded (any
      visibility counts as engagement — and counting only shared notes would make a private note's
      existence inferable from the card).
- [x] `awaitingFeedback`: a Lesson on which the **other party** wrote a note is still included.
- [x] `awaitingFeedback`: `planned` and `cancelled` Lessons are excluded; only `completed`.
      A Training Session with `performed_at` in the future is excluded.
- [x] `awaitingFeedback`: occurrences older than the 90-day floor are excluded; the result is capped
      at 5 and ordered `occurredAt DESC`; no total count is present in the payload.
- [x] `activePlans`: another Student's Plan never appears, **including when the caller is that
      Student's Teacher and even their Primary Teacher.**
- [x] `activePlans`: `archived` Plans excluded; ordered `updatedAt DESC`; capped at 3.
- [x] `goalsNearingTarget`: another Student's Goal never appears, **including when it is shared
      with the caller via `goal_share`.**
- [x] `goalsNearingTarget` boundary, with an injected `now`: target = today + 30d is **in**;
      today + 31d is **out**; a target 400 days in the past (still `active`) is **in** and sorts
      first; `achieved` and `abandoned` are out regardless of date; `target_date IS NULL` is out.
- [x] `goalsNearingTarget` carries no `overdue` field.
- [x] `pendingInvitations` counts only `status='pending'` rows addressed to the caller's email, and
      **equals `InvitationService.listForUser(email).length`** for the same fixture — including for
      an address stored with different casing/whitespace, which is the drift this test exists to catch.
- [x] `pendingInvitations` for a *pre-registration* invitation matched by email works the same way
      (IA §3.2: "A pre-registration invitation appears after login when the email matches").
- [x] `nextLesson.exercisePreview` returns at most 3 names in `sort_order` order with
      `exerciseCount` carrying the true total; a Lesson with no exercises yields `[]` and `0`, not null.

Route-level, in `server/routes.test.ts`:

- [x] `GET /api/dashboard` unauthenticated → 401.
- [x] `GET /api/dashboard` authenticated → 200 with the full shape.

## Out of scope

- The **view**. `web/home/home.component.ts` stays as it is — slice 048.
- **Read-state, unread badges, notifications, an activity event log.** IA §3.2 and §5 put these
  behind a separate backend gap; nothing here may imply them.
- **Per-block endpoints and true partial failure.** One endpoint means one failure mode: if the
  query throws, the page has nothing. Accepted and recorded — 048 still builds the view block-by-block
  so a later split is a service change, not a view rewrite.
- **A student-workspace aggregate** for Elevvy's Översikt (IA §3.4, §5). Same shape of problem,
  different slice.
- **Pagination or a total count on `awaitingFeedback`.** The card deep-links to `/lektioner`.
- **A covering `notes(parent_kind, parent_id, created_at)` index.** Only if profiling demands it,
  and then as a migration in its own slice.
- **Horse and Exercise activity counts** (IA §5 "proposed extensions").

## Blocked by

- Nothing outstanding. Every table this reads is shipped: 003 (relations), 002 (invitations),
  006/016 (lessons + `lesson_exercise.id`), 009 (notes), 010–011 (training sessions + share),
  019 (`training_session_exercise`), 021 (plans), 024–025 (goal + goal share),
  031 / 045 / 046 (the polymorphic Note parent kinds this reads across).

## Implementation notes — divergences from the frozen contract

Both divergences below were reported to the contract owner and are now recorded as amendments A1
and A4 in the contract's own §6, along with three further amendments (A2, A3, A5) raised by review.
The contract is no longer silently wrong about any of this.

1. **`latestFeedback` does not get the query plan the contract claims.** Contract §3.3 / §4.2
   assert the five-branch `UNION ALL` "drives from a bounded set the caller owns" and thereby
   closes the unbounded-scan risk for accounts with no feedback. Measured with
   `EXPLAIN QUERY PLAN`, every branch instead gives:

   ```
   SEARCH n USING INDEX notes_parent_idx (parent_kind=?)
   SEARCH <parent> USING INDEX sqlite_autoindex_... (id=?)
   USE TEMP B-TREE FOR ORDER BY
   ```

   SQLite drives from `notes`, walks every note of that `parent_kind` globally, probes the parent
   per row, and sorts the whole survivor set before `LIMIT 1` — the plan §3.3 says it rejected.
   Rewriting the `FROM` clause parent-first does **not** change it. Forcing the parent as the outer
   loop with `CROSS JOIN` does, and yields the contract's intended plan on the Lesson branches
   (`MULTI-INDEX OR` over `lessons_teacher_idx` / `lessons_student_idx`, then
   `notes_parent_idx (parent_kind=? AND parent_id=?)`); on the Training Session branches it
   degrades to `SCAN training_sessions`, because the owner-OR-share disjunction is not
   index-drivable as written. The SQL ships exactly as the contract specifies. **Correctness is
   unaffected — only cost.** Choosing between `CROSS JOIN`, splitting the Training Session branch
   in two, and the deferred covering `notes(parent_kind, parent_id, created_at)` index is a
   contract-owner decision, not an implementation one.

2. **Statement count is 7–9, not 6–8.** The contract's own §4.1 table lists seven fields at one
   statement each and then totals them as six. The property that matters — *constant in the number
   of rows* — holds: seven statements always, plus one only when a `nextLesson` exists and one only
   when a `latestFeedback` exists. No per-row query anywhere.

3. **`latestFeedback` sorts with an explicit `note id DESC` tiebreak** — contract amendment A2, and
   the one behaviour change made after review. The contract specifies `ORDER BY created_at DESC`
   alone, on both the per-branch and the outer sort. `created_at` is millisecond-granular
   (`note.service.ts` stamps `new Date().toISOString()`), so ties are ordinary rather than exotic,
   and the winner was previously decided only incidentally — by `UNION ALL` branch order plus
   SQLite's sort happening to be stable, which made `lesson` silently outrank `goal` with nothing
   documenting or asserting it. That incidental order would have **flipped** the day the deferred
   covering `notes(parent_kind, parent_id, created_at)` index lands, since a new index changes the
   plan and hence the tie winner — a silent change to which Note the card shows, inside a slice
   that believes it is pure optimisation. Both the within-branch and the cross-branch tie are now
   pinned by tests.

## Test-suite gaps closed by review

Behaviour is unchanged by all of these; they defend what already shipped.

- [x] `awaitingFeedback`'s 90-day floor and its `<= now` upper bound are pinned **exactly on** the
      boundary, on **both** branches. The pre-existing `-89`/`-91` fixture straddles the floor
      without landing on it, and the "future" fixture uses `at(3)`; mutating `>=`→`>` and `<=`→`<`
      left the whole suite green. Each of the four branch-boundary mutations is now caught
      independently.
- [x] The ±1 day timezone drift on `goalsNearingTarget`, accepted by contract §3.6, is pinned by a
      test injecting a `now` whose UTC day differs from the Swedish day — otherwise an *unbounded*
      drift would have looked identical to the sanctioned one.
- [x] Removed an assertion that could not fail (`expect(Object.keys(view)).not.toContain('awaitingFeedbackTotal')`
      — the absence of a field never implemented, with no code path). Filler
      `expect(x.id).toBeString()` assertions used only to silence unused-variable lint are now
      `void x`, which says what it means.

`server/db/migrations/` is untouched by this slice.
