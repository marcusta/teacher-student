# 048 — Hem dashboard view

**Type:** AFK
**Status:** open

## What to build

Turn `web/home/home.component.ts` from the scaffold placeholder into the dashboard IA §3.1
specifies: a **launchpad** that answers "what needs me today?" and deep-links back into the
training loop. No inline editing, no authoring, at most four cards.

Consumes `GET /api/dashboard` from slice 047 — one request, `DashboardView` in, blocks out.

The shape of the module split follows the `nav.structure.ts` / `student-copy.ts` precedent: all
selection, ordering, state-choosing and copy lives in a **DOM-free** `home-copy.ts` that
`tests/home-copy.test.ts` asserts directly, and the component is the part that only mounts things.

## Acceptance criteria

### Web

**`web/home/home-copy.ts` — DOM-free block selection**

- [x] New module, importing only `../i18n` and other `*-copy.ts` modules. **No `../theme`, no
      `@basics/core/client/core`, no `document`.** `theme.ts`'s `createTokens()` writes a `<style>`
      at import time, which is what makes the component modules unloadable in a DOM-less test
      process — the same reason `nav.structure.ts`, `route-guard.ts`, `student-copy.ts` and
      `goal-copy.ts` exist as separate files. Carry that reason in the module docstring.
- [x] `homeState(view, args): HomeState` returning `'unknown' | 'invited' | 'fresh' | 'ready'`.
      Modelled on `student-copy.rosterState`: **`'unknown'` while the fetch is unresolved or
      failed**, so a failed request can never render as "you have nothing". That substitution is the
      one that misinforms rather than merely underinforms.
- [x] `visibleBlocks(view): HomeBlock[]` — the ordered block list, **capped at four**
      (`UI_DECISIONS.md` §6 Dashboard, design system §4.2). Priority order, from IA §3.1:
      `nextLesson`, `latestFeedback`, then the capability-dependent two. When both the teaching and
      the riding block have content, `awaitingFeedback` precedes `activePlans`/`goalsNearingTarget`
      — a person owing feedback is owed by someone else. The riding facts share one card.
- [x] `quickActions(capabilities): QuickAction[]`. **Logga pass is always present**
      (`TrainingSessionService.create` requires no Relation). **Boka lektion only when
      `capabilities.teaches`** — `LessonService.create` requires a `relations` row, so the action is
      genuinely unavailable otherwise. This is the *only* capability gate in the slice.
- [x] `feedbackHref(f)` — builds the route from `targetKind`/`targetId`:
      `lesson` → `/lektioner/:id`, `training_session` → `/traningspass/:id`, `goal` → `/mal/:id`.
      The server sends **no `deepLink`**; `web/app/route-guard.ts`'s `APP_ROUTES` is this app's
      single route enumeration, and every href in `web/` is already built in a `*-copy.ts`.
- [x] `feedbackContext(f)` — the context line, switching on `parentKind` (not `targetKind`) so an
      exercise-occurrence note reads "På övningen … i lektionen med …".
- [x] `awaitingHref(item)`, `planHref`, `goalHref`, `nextLessonHref` likewise.
- [x] `homeRowKey(...)` helpers for every `$each` list, including the fields the row renders — same
      convention as `studentRowKey` / `goalRowKey`.

**Reuse rather than reimplement.** Each of these already exists and already carries a decision:

| Need | Use | Do not |
|---|---|---|
| Is a goal overdue | `goals/goal-copy.isOverdue(goal, todayIso)` | write a second date comparison |
| `YYYY-MM-DD` → `Date` | `goals/goal-copy.calendarDate` | `new Date(iso)` — parses as UTC midnight |
| Target-date label | `goals/goal-copy.targetDateLabel` | — |
| Lesson date/time phrase | `lessons/lesson-copy.lessonWhen` | — |
| Lesson counterparty wording | `lessons/lesson-copy.counterpartyRole` | assume a role |
| §4.3 date block | `lessons/lesson-copy.dateBlock` (or the session twin) | a third `dateBlock` |
| Training-session date phrase | `training-sessions/training-session-copy.sessionWhen` | — |
| Plan date range | `plans/plan-copy.dateRangeLabel` | — |
| Primary teacher label | `plans/plan-copy.primaryTeacherLabel` | — |
| Truncating the feedback body | `plans/plan-copy.descriptionExcerpt` | a new excerpt length |
| Note timestamp | `ui/copy.noteTimestamp` | — |
| Boka lektion href | `students/student-copy.bookLessonHref` | rebuild the query param |
| Dates, relative times, counts | `i18n` `formatDate` / `formatRelative` / `plural` | interpolate into a string table |

- [x] The server sends **no `overdue` flag** (IA §3.13: overdue is supporting metadata, not a
      status). The view derives it with `goal-copy.isOverdue` against the frozen `nowIso`. It is
      rendered beside the target date, never as a status pill.

**`web/home/home.component.ts`**

- [x] One `Async<DashboardView>` from `web/students/async.ts` owns the fetch, plus **one `Async`-shaped
      holder per block** so each block renders its own loading / empty / error state independently
      (IA §4 "partial failure for multi-source overview pages"; §3.1 "preserve available blocks and
      show a scoped retry").
      **Name the limitation in the module docstring:** 047 is one endpoint, so today a failure is
      page-scoped and all blocks fail together. The per-block structure is what makes a later split
      into per-block endpoints a service change rather than a view rewrite — it is not a claim that
      partial failure already works.
- [x] `nowIso` is a `Signal<string>` **frozen at mount**, passed into every derivation. Same rule as
      `student-detail.component.ts`: a page that reads the clock inside a render reclassifies rows
      mid-render on a signal nothing subscribed to, and cannot be tested at a boundary. `nowIso` is
      the **client's** local instant — `view.generatedAt` is the server's and is used only to say
      how old the data is, never as the clock.
- [x] A page-level retry that calls `Async.reset()` then re-runs. IA §4 requires "retry for failed
      reads" on every view.
- [x] Cards deep-link and do nothing else. No form, no toggle, no status transition, no note
      composer anywhere on this page (IA §3.1: "No data is edited inline on the dashboard").
- [x] Card elements are `<a>` when they navigate and `<div>` when they do not — a card that goes
      nowhere must not look or focus like a link. Copy `student-detail.component.ts`'s `card()`
      helper shape.
- [x] **`web/app/nav.structure.ts` is not touched.** `UI_DECISIONS.md` §1: navigation is never
      capability-gated. Nothing in this slice may hide a nav group.

**Three states, from IA §3.1**

- [x] **`invited`** — `pendingInvitations > 0` and no other content: welcome message plus a single
      **Öppna Inkorgen** action. This is the post-registration landing IA §3.20 describes.
- [x] **`fresh`** — no Relations and no content: **two equally clear starting paths**, side by side
      at equal visual weight, `Bjud in elev` → `/students` and `Lägg till häst` → `/hastar`, with
      `Skapa mål` → `/mal` as a ghost-tier link beneath the second. Design system §4.14 wants
      exactly one action per empty state, and IA §3.1 wants two equal paths; two panels of one
      action each satisfies both. The third link is deliberately a lower tier so the two paths stay
      equal to each other. **Neither path may be hidden by capability** — a brand-new account has
      `teaches: false` and must still be able to discover that inviting a student is possible
      (`UI_DECISIONS.md` §1).
- [x] **`ready`** — the normal dashboard.
- [x] **`unknown`** — the fourth, non-negotiable state: while unresolved or failed, render neither
      empty state. Nothing on this page may claim "you have nothing" without an answer in hand.
- [x] Every block has its own empty copy, and each empty state has **exactly one action**
      (§4.14). `COMPONENTS.md` records that all ten-plus existing empty states in `web/` have zero;
      this one does not add an eleventh.

**Styling — design system §4.2, `UI_DECISIONS.md` §6**

- [x] Auto-fitting grid, reusing `student-detail.component.ts`'s Översikt conventions verbatim so
      the two overview surfaces are one pattern:
      `grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr))`, `gap: s('md')`;
      card = `flex column`, `gap: s('xs')`, `padding: s('lg')`, `1px solid token('border')`,
      `token('radius-md')`, `background: token('surface')`;
      hover → `border-color: token('border-strong')`; `:focus-visible` → `2px solid token('accent')`
      with `outline-offset: 2px`;
      label = 0.6875rem / 700 / `letter-spacing: 0.14em` / uppercase / `text-muted`;
      value = 1rem / 600 / `text`; meta = 0.8125rem / `text-muted`.
- [x] **Phone (`< 640px`) yields one column in priority order** — a consequence of `auto-fit` with a
      `15rem` minimum, so no extra media query; assert the order comes from `visibleBlocks`, not
      from source order.
- [x] **Four cards maximum.** Enforced in `visibleBlocks`, not by CSS.
- [x] Lora is only ever written at weight 500 (`UI_DECISIONS.md` §3 — any other weight silently
      synthesises bold). Status is never carried by colour alone (§7).
- [x] Import the token helper **as `token`**, following `nav.component.ts`'s alias convention, since
      this file also imports `t` from `../i18n` (`UI_DECISIONS.md` §4, the known `t` collision).
- [x] Do **not** use the framework's `badge.ts` for the invitation count — it is a colour-first API
      that hardcodes `color: #fff` and breaks dark theme (`COMPONENTS.md` conflicts 4 and 7). Do not
      use `toast.ts` — it renders white-on-white in light theme and has no action slot (conflicts 1
      and 2). Do not use `avatar.ts` as a person marker (conflict 5). The framework `EmptyState`
      (§4.14) does not exist yet, so hand-roll the empty states here and leave a comment pointing at
      the component slice.

### i18n

- [x] All strings in a new `home.*` namespace in `web/i18n/sv.json`, with **exact key and
      placeholder parity** in `en.json` (`bun run check:i18n` must pass; it also rejects duplicate
      keys). Swedish is authored first and is authoritative.
- [x] Dates, relative times and counts go through `Intl` via the `i18n` helpers, never through the
      string table. Plurals use `.one` / `.other` pairs and `plural()`.
- [x] **No greeting with the account's display name.** IA §3.1 item 1 permits it *"only after the
      authenticated-session contract exposes it reliably"* — and it does not: `AuthUser` is
      `{ id, username }` where `username` is the email (`node_modules/@basics/core/server/auth.ts`,
      `UserService.findById`). There is no display name in the session. Greeting the reader by
      email address is worse than not greeting them.

Proposed Swedish strings (the authoritative set; `en.json` translates these):

```
home.title                          Hem
home.lede                           Det här behöver dig i dag.
home.loading                        Hämtar din översikt …
home.error                          Översikten kunde inte hämtas.
home.retry                          Försök igen
home.unavailable                    Kunde inte hämtas
home.updated                        Uppdaterad {when}

home.nextLesson                     Nästa lektion
home.nextLesson.none                Ingen bokad lektion
home.nextLesson.exercises.more.one  +{count} övning till
home.nextLesson.exercises.more.other +{count} övningar till
home.nextLesson.noExercises         Inga övningar upplagda än

home.feedback                       Senaste återkoppling
home.feedback.none                  Ingen delad återkoppling än.
home.feedback.byline                {name} · {when}
home.feedback.on.lesson             På lektionen med {name}
home.feedback.on.lessonExercise     På övningen {exercise} i lektionen med {name}
home.feedback.on.trainingSession    På träningspasset
home.feedback.on.trainingSessionExercise  På övningen {exercise} i träningspasset
home.feedback.on.goal               På målet {title}

home.awaiting                       Väntar på din återkoppling
home.awaiting.none                  Du har svarat på allt.
home.awaiting.count.one             {count} tillfälle
home.awaiting.count.other           {count} tillfällen
home.awaiting.lesson                Lektion med {name}
home.awaiting.session               Träningspass · {name}
home.awaiting.all                   Visa alla lektioner

home.riding                         Din träning
home.plans.none                     Ingen aktiv plan
home.plans.count.one                {count} aktiv plan
home.plans.count.other              {count} aktiva planer
home.goals.nearing                  Mål som närmar sig
home.goals.none                     Inga mål med datum inom en månad.
home.goals.overdue                  Datum passerat

home.invitations.one                Du har en inbjudan som väntar.
home.invitations.other              Du har {count} inbjudningar som väntar.
home.invitations.cta                Öppna Inkorgen

home.action.logSession              Logga pass
home.action.bookLesson              Boka lektion

home.welcome.title                  Välkommen hit
home.welcome.body                   Någon har bjudit in dig. Svara i Inkorgen, så kommer resten igång.

home.start.title                    Kom igång
home.start.teach.body               Bjud in din första elev och börja planera lektioner.
home.start.teach.action             Bjud in elev
home.start.ride.body                Lägg upp din häst och sätt ett mål att träna mot.
home.start.ride.action              Lägg till häst
home.start.ride.goal                Skapa mål
```

Voice notes: "Senaste återkoppling", never "Ny återkoppling" — there is no read-state and the copy
must not imply one (IA §3.1). `home.awaiting.none` states completion rather than absence.
`home.start.*` bodies are one sentence each, per the design system's two-sentence ceiling for
empty states.

### Tests

- [x] New `tests/home-copy.test.ts`, DOM-free, following `tests/nav.test.ts` and
      `tests/student-copy.test.ts`.
- [x] `homeState` returns `'unknown'` while unresolved **and** while failed; `'invited'` only with a
      pending invitation and no other content; `'fresh'` only when everything is empty and both
      capabilities are false; `'ready'` otherwise. Assert the failed case explicitly — that is the
      regression this function exists to prevent.
- [x] `visibleBlocks` never returns more than four, and returns them in IA §3.1 priority order for:
      teacher-only, rider-only, both, and neither.
- [x] `quickActions`: Logga pass present for every capability combination, including
      `{ teaches: false, rides: false }`; Boka lektion present **iff** `teaches`.
- [x] `feedbackHref` covers all three `targetKind` values, and **every route it can produce is
      matched by `route-guard.APP_ROUTES`** — import `safeReturnTo` and assert it accepts each. This
      keeps the client-built hrefs inside the app's single route enumeration.
- [x] `feedbackContext` covers all five `parentKind` values, including both junction kinds.
- [x] Overdue goals: `isOverdue` is applied against the injected `nowIso`, an overdue goal renders
      the `home.goals.overdue` marker, and an `achieved` goal never does (guaranteed twice — the
      047 filter and `goal-copy.isOverdue` both exclude it).
- [x] Row-key helpers change when a rendered field changes.
- [x] i18n: every `home.*` key used by `home-copy.ts` exists in both catalogs — covered by
      `bun run check:i18n` in CI, and by `tests/i18n.test.ts` conventions for the interpolations.
- [x] A DOM test (`tests/home-empty.dom.test.ts`, modelled on `tests/lessons-empty.dom.test.ts`)
      mounting the component for the `invited` and `fresh` states and asserting each empty state
      renders **exactly one primary action** (§4.14).
- [x] `bun run check:client`, `bun run check:i18n` and `bun test tests/ web/` pass.

## Out of scope

- **The endpoint.** 047 owns `DashboardService`, `dashboard.api.ts` and `bun run generate`.
- **Read-state, unread badges, an activity feed on Hem.** IA §3.1 forbids deriving "new" from
  timestamps, and IA §3.2 puts the activity inbox behind an event log that does not exist.
- **The framework component layer** — `StatusPill`, `EmptyState`, `Table`, the `toast.ts` /
  `tabs.ts` / `badge.ts` fixes (`COMPONENTS.md`). This slice hand-rolls what it needs and leaves
  pointers; consolidation is the component slice's job.
- **Per-block endpoints and true partial failure** — see the note under Web; structural only.
- **Elevvy's Översikt aggregate** (IA §3.4 / §5). Same problem, different view.
- **Nav changes of any kind.** No gating, no new destination, no badge behaviour change.
- **A greeting with the account name**, until the session contract carries a display name.

## Blocked by

- **047** — `GET /api/dashboard`. This slice cannot begin before `web/api/dashboard.gen.ts` exists.
