# Teacher–Student information architecture

Status: implementation specification  
Scope: the views explicitly named in the UX proposal’s **Site map — both roles**  
Sources: [UI design system](https://claude.ai/code/artifact/3bd30fd9-ddf0-4820-af75-ae34f594631d), [UX proposal](https://claude.ai/code/artifact/8e0083dd-682d-4731-b22c-ceeed9b4468e), the current web client, backend services/tests, `SCOPE.md`, and `UBIQUITOUS_LANGUAGE.md`

## 1. Product-level IA decisions

### One account, contextual capabilities

There is no permanent Teacher/Student account mode and no role switch. A person can be a Teacher in one Relation and a Student in another. The shell and each view derive available content and actions from the current user’s ownership and Relations.

This means:

- universal personal areas remain available even with no Relations;
- teacher-only content appears when the account has students or owns library content;
- shared detail views adapt actions to the user’s relationship to that specific object;
- labels name the other person or audience instead of relying on a global role mode.

### Canonical content hierarchy

The primary walkable hierarchy is:

`Goal → Plan → Lesson / Training Session → Exercise occurrence → Note`

Every detail view must expose its parents as links and its children as navigable sections. The UI must preserve these domain distinctions:

- **Program / Ridprogram:** a Teacher-owned reusable, ordered exercise routine.
- **Plan / Träningsplan:** a Student-owned, long-running umbrella for goals, lessons, and training sessions.
- **Lesson:** a scheduled occasion with the Teacher present.
- **Training Session:** practice performed without the Teacher present and shared selectively.
- **Row note:** static instructional text copied with an Exercise occurrence.
- **Note:** an authored, timestamped conversation item with private/shared visibility.

### Navigation

Authenticated navigation is grouped by activity:

| Group | Destinations | Visibility |
|---|---|---|
| Top | Hem, Inkorg | Always |
| Träning | Lektioner, Träningspass | Always |
| Planering & stall | Planer, Mål, Hästar | Always |
| Undervisning | Mina elever, Bibliotek | Capability-composed; see decision below |

Recommended first implementation: keep **Undervisning** visible and let useful empty states teach the feature. Capability-gating it is viable later, but an always-available **Bjud in elev** entry is required either way. Never gate Mål, Planer, Hästar, or Träningspass by a presumed role.

Structural changes from the test client:

- `Hem` becomes a real dashboard.
- `Bibliotek` contains two tabs: **Övningar** and **Program**.
- outgoing invitations move into `Mina elever` rather than remaining top-level navigation.
- `Inkorg` initially remains invitation-focused; activity is phased separately.

### Shared interface grammar

- List views put retrieval first. Creation opens in a dedicated panel, dialog, or route; it must not dominate the list as it does in the test client.
- Occasion lists use **Kommande / Tidigare** grouping, a date block, status, counterparty, Horse, Plan, Programs, Exercises, and explicit sharing where relevant.
- Detail headers show object type, title, status, parent chips, audience chip, metadata, then at most one primary action.
- Notes are chronological, single-column threads. Each Note shows author, contextual Teacher/Student marker, timestamp, visibility, body, and author-only edit/delete.
- Every authoring point shows visibility at the point of writing. Never use an unlabeled “shared” state; name recipients.
- Unauthorized and cross-owner resources use the same not-found state rather than revealing that the object exists.
- Terminal state changes explain consequences before confirmation. Recoverable deletion uses an undo toast where the backend permits it.
- Cross-user changes are request/response only today. Views provide an explicit refresh path and never imply realtime or reliable unread state.

### Delivery status legend

- **Ready:** existing backend and current UI prove the required capability.
- **Composable:** implementable by combining existing endpoints, but a production read model would improve reliability or speed.
- **Backend gap:** requires a new endpoint, event/read model, or changed domain behavior.
- **Decision:** product or privacy semantics must be resolved before implementation.

## 2. Sitemap inventory

The sitemap contains 17 view groups. A group may include a list and its existing detail route when the UX proposal treats them as one destination.

| # | View group | Routes | Primary capability |
|---|---|---|---|
| 1 | Hem | `/home` | Shared, capability-composed |
| 2 | Inkorg | `/inbox` | Shared |
| 3 | Mina elever | `/students` | Teacher-context |
| 4 | Elevvy | `/students/:id` | Teacher-context |
| 5 | Bibliotek · Övningar | `/library`, `/library/:id` | Teacher-context |
| 6 | Bibliotek · Program | `/program`, `/program/:id` | Teacher-context |
| 7 | Lektioner | `/lektioner` | Shared |
| 8 | Lektion | `/lektioner/:id` | Shared, role-adaptive |
| 9 | Träningspass | `/traningspass` | Student-owner |
| 10 | Träningspass-detalj | `/traningspass/:id` | Student-owner + shared Teacher |
| 11 | Planer | `/planer` | Student-owner |
| 12 | Plan | `/planer/:id` | Student-owner + connected Teacher read-only |
| 13 | Mål | `/mal` | Personal owner |
| 14 | Mål-detalj | `/mal/:id` | Owner + explicitly shared Teacher |
| 15 | Hästar | `/hastar`, `/hastar/:id` | Student-owner |
| 16 | Övningshistorik | `/students/:studentId/exercises/:exerciseId/history` | Teacher + own Student history |
| 17 | Login / Registrera | `/login`, `/register` | Public entry |

## 3. View specifications

### 3.1 Hem — dashboard

**Purpose:** answer “what needs me today?” and provide the shortest route back into the training loop. This is a launchpad, not an authoring destination.

**Information order**

1. Page title. Add the account display name only after the authenticated-session contract exposes it reliably.
2. Time-sensitive primary card: next Lesson, including date/time, counterparty, Horse, and a compact Exercise preview.
3. Feedback block: latest shared feedback received, linking to its exact Lesson, Training Session, Goal, or Exercise occurrence.
4. Teaching block, when relevant: upcoming Lessons and Training Sessions that may need feedback.
5. Riding block, when relevant: active Plan snapshot and Goals nearing target date.
6. Quick actions: **Logga pass** and/or **Boka lektion**, shown by capability.

**Actions and navigation**

- Cards deep-link to the owning detail view.
- Quick actions open creation with known context prefilled.
- No data is edited inline on the dashboard.

**States**

- New account with pending invitation: welcome message plus Inkorg CTA.
- New account without Relations/content: two equally clear starting paths, **Bjud in elev** and **Lägg till häst / skapa mål**.
- Partial block failure: preserve available blocks and show a scoped retry, not a page-level failure.

**Delivery:** **Composable / Backend gap.** Next Lesson and active-plan data can be composed from existing lists. “Latest feedback” and “awaiting feedback” currently require expensive cross-parent inspection and have no unread/event semantics. Add a dashboard read endpoint before treating those blocks as production-ready. Do not derive “new” from timestamps alone.

### 3.2 Inkorg

**Purpose:** contain items addressed to the current user that expect a response. Replies happen on the object itself, keeping conversation in context.

**MVP information order**

1. Page title and pending count.
2. **Inbjudningar** group with inviting Teacher name/email, sent date, and Accept/Decline actions.
3. Empty state explaining that new invitations will appear here.

**Future activity groups**

- feedback received on Lessons, Training Sessions, Goals, or Exercise occurrences;
- a Goal or Training Session newly shared with the user;
- exercise Questions when that domain slice exists.

Activity rows show actor, action, object/context line, relative time, read state, and link to the parent detail. They do not host reply controls.

**States**

- Stale Accept/Decline returns a recoverable conflict and refreshes the row.
- A pre-registration invitation appears after login when the email matches.
- Badge count is invitations-only until notification read state exists.

**Delivery:** invitation inbox is **Ready**. A general activity inbox is a **Backend gap**: there is no notification/event log or `read_at`. Ship invitations first; do not imply reliable unread activity by scanning current rows.

### 3.3 Mina elever

**Purpose:** Teacher-context roster and relationship management, including outgoing invitations.

**Information order**

1. Header: `Mina elever` and primary action **Bjud in elev**.
2. Connected students, sorted by display name.
3. Each student row: display name, email, and optional next-Lesson summary when cheaply available.
4. **Inbjudna** section: email, sent time, status, and Revoke for pending invitations.

**Actions and navigation**

- Student row opens Elevvy.
- Invite form accepts email and reports duplicate-pending conflicts inline.
- Pending invitations may be revoked; terminal rows are read-only.
- Do not promise automatic expiry behavior yet: `expired` exists in the type, but no active expiration process currently produces it.

**States**

- No students/no invitations: one branded empty state with **Bjud in elev**.
- Invitations but no accepted Relations: preserve the invitation list and explain the next step.
- Students and invitations load independently; one failing must not erase the other.

**Delivery:** **Ready.** The view is a frontend merge of current `/students` and `/invitations` capabilities.

### 3.4 Elevvy — student workspace

**Purpose:** the Teacher’s main hub for everything they are allowed to see about one Student.

**Persistent header**

- Student display name and relation context.
- Primary action **Boka lektion**, prefilled with this Student.
- Tabs: **Översikt · Lektioner · Pass · Planer · Mål · Hästar · Historik**.

**Tab IA**

- **Översikt:** next Lesson, latest Training Session shared with this Teacher, active Plan count, shared Goal count, and compact recent activity.
- **Lektioner:** only Lessons involving this Student; rows use the shared occasion grammar.
- **Pass:** only Training Sessions explicitly shared with this Teacher.
- **Planer:** active Plans, date range, Primary Teacher label, links to read-only Plan detail.
- **Mål:** Goals explicitly shared with this Teacher, with status and target date.
- **Hästar:** non-archived Horses, read-only.
- **Historik:** choose Exercise, then open Övningshistorik for this Student.

**Actions**

- Book Lesson.
- Open linked Lesson, Training Session, Plan, Goal, or history.
- Change status on a shared Goal only where the Goal contract permits it.
- Feedback is authored on linked objects, not on the overview.

**States**

- Each tab owns its loading, empty, and error state.
- Revoked/missing Relation resolves as not found.
- Do not expose a Goal merely because its title is visible through a Plan unless the Goal itself is shared.

**Delivery:** tab content is mostly **Ready/Composable**. The overview is best served by a student-workspace aggregate endpoint. General Notes directly on a Student are **not in this IA**: the schema suggests them, but the service rejects them and their privacy semantics are unresolved.

### 3.5 Bibliotek — Övningar

**Purpose:** Teacher-owned private library of atomic Exercises. Students never browse this destination directly; they encounter its content in occasions and pickers.

**List**

1. `Bibliotek` header with tabs **Övningar · Program**.
2. Search/filter when volume requires it.
3. Primary action **Ny övning**.
4. Exercise rows: name, description excerpt, and optional Program usage count when supported.

**Detail**

1. Exercise name and description.
2. Edit action.
3. **Används i program** links when supported.
4. **Övningshistorik** entry: choose a Student, then open the scoped history.
5. Destructive Delete in a separated danger area.

**States and safety**

- Empty state leads to **Skapa första övningen**.
- Foreign/missing Exercise is not found.
- Duplicate or validation errors remain with the form.
- Delete confirmation must state the historical consequence. Current hard-delete behavior cascades out of historical Lesson/Session rows; this should be changed or explicitly blocked before production.

**Delivery:** CRUD and history entry are **Ready**. “Used in” counts are a **Backend gap**. Safe historical deletion is a **Decision / backend change**.

### 3.6 Bibliotek — Program

**Purpose:** Teacher-owned reusable ordered routines, presented as the second Bibliotek tab.

**List**

1. Shared `Bibliotek` header and tabs.
2. Primary action **Nytt program**.
3. Program rows: title, description excerpt, Exercise count; optional historical attachment count only when supported.

**Detail / builder**

1. Program title and description.
2. Ordered Exercise sequence.
3. Each row: order, Exercise name, optional instructional Row note, reorder, and remove.
4. Add Exercise picker scoped to the Teacher’s own library.
5. Delete in a separated danger area.

**Interaction rules**

- Reject duplicate Exercises with a row-level explanation.
- Reorder is explicit and keyboard accessible.
- Explain snapshot semantics near the builder: changing a Program does not rewrite Lessons or Training Sessions that already copied it.
- Delete confirmation must explain that copied Exercises remain but Program provenance links on past occasions disappear under the current backend behavior. Prefer soft archive once Programs are in real use.

**Delivery:** core builder is **Ready**. Historical attachment counts are a **Backend gap**. Merging Programs under Bibliotek is frontend navigation and does not require route migration in the first slice.

### 3.7 Lektioner

**Purpose:** one shared timeline of all Lessons the user teaches or attends.

**Information order**

1. Header and **Boka lektion** for users with at least one Student Relation.
2. **Kommande** group, sorted soonest first.
3. **Tidigare** group, sorted newest first.
4. Row: date block, time, title/summary, counterparty, Horse, Plan chip, Program badges, compact Exercise summary, status.

**Creation**

1. Student.
2. Date/time.
3. Horse from the selected Student’s non-archived stable.
4. Active Plan.
5. One or more Programs, clearly described as copying their Exercises.
6. Optional title/description if retained by the contract.

**States**

- No Lessons as rider: explain where booked Lessons will appear.
- No Students as Teacher: omit creation and link to **Bjud in elev**.
- Cancelled rows are muted but readable; completed and planned remain distinguishable without color alone.

**Delivery:** list and creation are **Ready**. Adding Horse at creation is **Composable** after Student selection; current UI defers it to edit.

### 3.8 Lektion — detail

**Purpose:** Teacher cockpit and Student record for the same taught occasion; primary home of taught-work feedback.

**Information order**

1. Detail header: Lesson, date/time, status, Teacher/Student, Horse, Plan chip, Program source chips, audience.
2. Summary/description.
3. **Övningar**: ordered occurrence rows, source Program, static Row note, Exercise history link.
4. Per-Exercise Note thread, expandable in place or in a stable side panel.
5. Lesson-level **Anteckningar** thread.
6. Change history is future; do not invent it from current timestamps.

**Teacher actions**

- Reschedule; select Horse; link/detach Plan.
- Attach/detach Programs; add/remove Exercises.
- Mark Completed or Cancelled while Planned.
- Author private/shared Lesson and Exercise-occurrence Notes.

**Student actions**

- Read structure.
- Author private/shared Lesson and Exercise-occurrence Notes.
- Open own Exercise history.

**State rules**

- Completed/Cancelled are terminal. Confirm with the irreversible consequence before transition.
- Notes remain available after a terminal transition.
- The production UI should lock structural editing after a terminal transition while leaving Notes open. The backend currently permits some non-status mutations after completion/cancellation, so this requires an explicit product decision and preferably a server-side guard.
- Removing a Program label does not remove Exercises already copied from it.
- Not found covers missing and unauthorized Lessons.

**Delivery:** mutations and current display are **Ready**, but production routing needs a **Backend gap** fixed: there is no single Lesson detail GET endpoint; the current UI finds the item inside the list response.

### 3.9 Träningspass

**Purpose:** Student-owned training journal. A Teacher reaches shared sessions through Elevvy, not through this owner list.

**Information order**

1. Header and primary action **Logga pass**.
2. Own sessions, newest first.
3. Row: performed date/time, duration, summary excerpt, Horse, Plan chip, named sharing chip, and attached Program/Exercise summary.

**Creation**

1. Performed date/time.
2. Duration.
3. Horse.
4. Summary.
5. Active Plan.
6. Optional Program from the Student-visible catalog.
7. Sharing: no Teacher control when none exist; a simple choice for one; named multi-selection for several. Default is Private.

**Actions**

- Open detail.
- Edit own metadata and sharing.
- Delete only after a consequence-aware confirmation.

**States**

- Empty state: **Logga ditt första pass**.
- Missing optional catalog/Teacher/Horse/Plan data hides that field without blocking a basic log.

**Delivery:** **Ready.** Teacher-prescribed Training Sessions are not implemented and are excluded from this IA. Hard delete currently destroys attached feedback; soften it to archive or block/strengthen confirmation once Teacher Notes exist.

### 3.10 Träningspass — detail

**Purpose:** mirror Lesson detail with authorship reversed: Student owns the structure; explicitly shared Teachers read and respond.

**Information order**

1. Header: performed date/time, duration, Horse, Plan, sharing recipients.
2. Summary.
3. Program sources.
4. Ordered Exercise occurrences with Row notes.
5. Per-Exercise Note threads.
6. Session-level Notes.

**Student-owner actions**

- Edit metadata, Horse, Plan, summary, and sharing.
- Attach/remove Programs and Exercises from the connected Teachers’ catalog.
- Author private/shared Notes.
- Delete subject to the feedback-retention decision.

**Shared-Teacher actions**

- Read the same structure.
- Author private/shared Notes on the session and Exercise occurrences.
- No mutation of metadata, sharing, Programs, or Exercises.

**Picker rules**

- Group catalog options by owning Teacher.
- Show selected count and exclude already attached items.
- When attaching a Program, offer—not silently force—sharing with its owning Teacher.

**Delivery:** **Ready** for owner/shared-Teacher behavior. Student-side Exercise history for Training Session occurrences is not currently part of the history backend; do not link it until implemented.

### 3.11 Planer

**Purpose:** Student-owned list of long-running training umbrellas.

**Information order**

1. Header and **Ny plan**.
2. Active Plans, then an archived filter/section.
3. Row: title, date range, status, Primary Teacher label, description excerpt.
4. Optional counts—Goals, upcoming Lessons, recent Training Sessions—only when available without per-row fan-out.

**Creation**

- Title, description, start/end dates, optional Primary Teacher.
- Primary Teacher is a label and defaulting convenience, not elevated permission.

**States**

- Empty state explains that a Plan brings Goals, Lessons, and Training Sessions together.
- Archived Plans stay readable but reject new links.
- Invalid date range is field-level.

**Delivery:** core is **Ready**. Per-row counts are **Composable/Backend gap**; prefer a summary read model before adding them.

### 3.12 Plan — detail

**Purpose:** hub where Goals and all linked training occasions become readable together.

**Information order**

1. Header: title, status, date range, Primary Teacher.
2. Description.
3. **Mål** with status and target date.
4. **Lektioner**, upcoming first then recent past.
5. **Träningspass**, newest first.
6. Archived-state explanation when applicable.

**Student-owner actions**

- Edit metadata and Primary Teacher.
- Attach/detach Goals.
- Archive.
- Detach linked occasions only after a product decision confirms that plan owners may detach Teacher-authored Lessons from this hub. Detach never deletes the occasion.

**Connected-Teacher actions**

- Read metadata and linked items.
- Navigate into accessible items.
- No edit/archive actions.

**Privacy rule requiring decision**

Current behavior exposes titles of Goals linked to a readable Plan even when the Goal is not individually shared with that Teacher. Either affirm this as deliberate Plan membership disclosure or return only a redacted count/placeholder. The UI must not make a hidden Goal navigable.

**Delivery:** **Ready**, with the privacy and inline-detach decisions above.

### 3.13 Mål

**Purpose:** list of Goals owned by the current user. Goals remain available to every account regardless of Relations.

**Information order**

1. Header and **Nytt mål**.
2. **Aktiva**.
3. **Uppnådda**.
4. **Avbrutna**, preferably behind a filter or collapsed section.
5. Row: title, target date, status, Plan membership summary, named sharing summary.

**Actions**

- Create Goal.
- Open detail.
- Status transitions may be offered in detail rather than overcrowding rows.

**States**

- Empty state: create a first Goal.
- No Teachers: sharing is simply absent; Goal ownership is unaffected.
- Overdue is supporting metadata, not a new domain status.

**Delivery:** **Ready.** Ensure every row links to `/mal/:id`; the current list does not consistently expose that path.

### 3.14 Mål — detail

**Purpose:** full state and conversation for one Goal.

**Information order**

1. Header: title, status, target date, achieved timestamp.
2. Description.
3. **Tillhör planer** links.
4. **Delat med** named Teachers; owner-only management.
5. Goal Note thread.

**Owner actions**

- Edit title, description, and target date.
- Share/unshare with connected Teachers.
- Attach/detach active Plans.
- Mark Achieved, Reopen, or Abandon.
- Author private/shared Notes.

**Shared-Teacher actions**

- Read the Goal without seeing co-watchers.
- Mark Achieved or Reopen.
- Author private/shared Notes.
- No metadata, sharing, Plan membership, or Abandon controls.

**State rules**

- Abandoned cannot transition directly to Achieved; reopen first.
- Shared access disappearing resolves as not found on refresh.
- Plans inaccessible to a Teacher are shown only to the degree explicitly allowed by the Goal contract.

**Delivery:** **Ready.** Confirm that Plan labels returned to shared Teachers are user-meaningful; identifiers alone are not acceptable IA.

### 3.15 Hästar

**Purpose:** Student-owned stable administration. Teachers read Horses only inside Elevvy and occasion pickers.

**List**

1. Header and **Lägg till häst**.
2. Non-archived Horses, newest first.
3. Row: name; optional activity summary only when supported.

**Detail**

1. Horse name.
2. Save action.
3. Archive in separated danger area with history-preservation explanation.

**States**

- Empty state links to adding the first Horse.
- Missing/foreign Horse is not found.
- Archived Horses disappear from active pickers but remain attached to historical occasions.

**Delivery:** CRUD/archive is **Ready**. Activity counts are a **Backend gap** and should not block the useful stable view.

### 3.16 Övningshistorik

**Purpose:** read-only longitudinal view of one Exercise for one rider—the payoff of per-occurrence Row notes and Notes.

**Context header**

- Student name.
- Exercise name.
- Back link to Elevvy or Exercise detail according to entry path.

**Timeline**

- Reverse chronological Lesson occurrences.
- Each entry: Lesson date, source Program or Standalone, Row note, visible Note thread, and link to Lesson detail.
- Shared Notes plus the current user’s private Notes; never the other party’s private Notes.

**States**

- No occurrences: explain that history appears after the Exercise is used in a Lesson.
- Missing Relation, Student, or Exercise resolves as not found.
- Read-only: writing happens on the Lesson occurrence.

**Delivery:** **Ready** for Lesson Exercise history. Training Session occurrences are not part of the current history contract and must not be implied.

### 3.17 Login / Registrera

**Purpose:** quiet, brand-led entry that preserves the email-keyed invitation onboarding path.

**Login**

- Email.
- Password.
- Submit, inline error, link to Register.

**Register**

- Email.
- Display name.
- Password.
- Required/email/password validation and duplicate-email conflict.
- Submit establishes a session.

**Post-auth routing**

- Land on `/home`.
- If pending invitations exist, surface the Inkorg badge and a dashboard invitation card.
- Never ask the person to choose Teacher or Student.

**States**

- Loading disables resubmission without clearing entered values.
- Authentication errors use actionable Swedish copy rather than raw server messages.
- Existing authenticated sessions skip public entry.

**Delivery:** **Ready.** Align the login label with the actual email-based identity contract; the test client’s “username” wording is misleading.

## 4. Cross-view state requirements

Every view must define these independently rather than relying on blank space or disabled content:

- initial loading;
- empty collection;
- not found/unauthorized;
- field validation;
- recoverable conflict caused by stale state;
- partial failure for multi-source overview pages;
- destructive confirmation with the specific consequence;
- success acknowledgement appropriate to the action;
- retry for failed reads;
- reduced-motion and keyboard-visible focus.

Pagination is not required for the first UI slice, but list contracts and layouts should not assume all records remain small forever.

## 5. Backend work implied by the IA

### Required before production-quality implementation

1. Add a single Lesson detail read endpoint for `/lektioner/:id`.
2. Decide and fix historical deletion semantics for Exercises and Training Sessions once feedback exists.
3. Resolve Plan-to-Goal title visibility for connected Teachers.
4. Add dashboard/student-workspace read models or explicitly accept client fan-out and partial results.
5. Decide whether terminal Lessons lock structural mutations and enforce the same rule in service and UI.
6. Decide whether Programs archive instead of deleting provenance from historical occasions.

### Required only for proposed extensions

1. Notification/activity event log and read state for the expanded Inkorg and unread badges.
2. Cross-parent feedback/dashboard query.
3. “Used in” and activity counts for Exercises, Programs, Horses, and Plans.
4. General Student Notes after privacy semantics are defined.
5. Exercise Questions.
6. Teacher-prescribed Training Sessions.
7. Training Session occurrences in Övningshistorik.

## 6. Suggested implementation slices

1. **Shell and navigation:** grouped navigation, common list/detail headers, status/share chips, responsive behavior.
2. **Occasion loop:** Lektioner + Lesson detail + Träningspass + Training Session detail + reusable Notes.
3. **Long horizon:** Planer/Plan + Mål/Goal + cross-links.
4. **Teaching workspace:** Mina elever + Elevvy tabs + merged Bibliotek.
5. **Personal foundation:** Hästar + Övningshistorik + refined auth/onboarding.
6. **Dashboard:** only after its read contract is fixed.
7. **Activity inbox:** only after event/read semantics are fixed; invitations ship earlier.

This ordering builds the core feedback loop first and postpones the two surfaces most likely to become unreliable if implemented only as client-side aggregation.
