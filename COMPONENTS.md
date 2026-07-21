# Component plan of record

Status: implementation specification
Scope: the 15 components in design system §04, mapped onto the existing `@basics/core` UI library.
Placement rule: see `UI_DECISIONS.md` §5 — generic UI goes to the framework, domain semantics stay in `web/`.

## Starting position

Two facts shape this plan.

**The app barely uses the framework's UI layer.** The only component imported anywhere in `web/` is `SelectComponent` (7 call sites), plus `web/css.ts` re-exporting the `s`, `btn`, `input` recipes. `tabs.ts`, `toast.ts`, `confirm.ts`, `badge.ts`, `menu.ts`, `popover.ts`, `drawer.ts`, `avatar.ts`, `calendar.ts` and `image-crop.ts` have zero consumers in this app. Every list row, status pill, empty state, navigation and note thread in `web/` is hand-rolled per feature folder.

So "reuse" verdicts below are mostly adoption, not preservation. That is good news — there is little to unpick — but it means the component layer is genuinely new work rather than a restyle.

**The design-system tokens have already landed**, with a compat alias block covering the legacy names. Framework recipes still read legacy names and therefore still work; each one is rewritten as its component is touched, and the alias block is deleted when the last is done.

## Verdict table

| § | Component | Existing | Verdict | Placement |
|---|---|---|---|---|
| 4.1 | Appskal — navigering | — | build new | `web/` |
| 4.2 | Dashboardkort | `card()` recipe | extend | recipe in framework, cards in `web/` |
| 4.3 | Listrader — grupperade | — | build new | split: row primitive in framework, grouping in `web/` |
| 4.4 | Statuspiller | `badge.ts` (wrong abstraction) | build new | framework |
| 4.5 | Delningschips | — | build new | `web/` |
| 4.6 | Personmarkeringar | `avatar.ts` (spec forbids) | build new | `web/` |
| 4.7 | Anteckningstråd | — | build new | `web/` |
| 4.8 | Formulär | `btn()`, `input()`, `select.ts` | extend | framework |
| 4.9 | Väljare | `select.ts` (single-value) | extend | framework |
| 4.10 | Detaljsidhuvud | `menu.ts` for ⋯ | build new | `web/` |
| 4.11 | Flikar | `tabs.ts` | extend (conflicts) | framework |
| 4.12 | Bekräfta & ångra | `confirm.ts`, `toast.ts` | extend (conflicts) | framework |
| 4.13 | Inkorg — aktivitetsrader | — | build new | `web/` |
| 4.14 | Tomlägen | — | build new | framework shell, copy in `web/` |
| 4.15 | Tabell | — | build new | framework primitive, schema in `web/` |

**Framework gains six things:** `StatusPill` (§4.4), `Table` (§4.15), `EmptyState` (§4.14), form recipes with `--border-strong` and button variants (§4.8), multi-select on `select.ts` (§4.9), and corrections to `tabs.ts` and `toast.ts`.

**`web/` gains eight:** app shell navigation (§4.1), dashboard cards (§4.2), grouped list rows (§4.3), sharing chips (§4.5), person markers (§4.6), note thread (§4.7), detail header (§4.10), inbox activity rows (§4.13).

## Conflicts between spec and existing behaviour

These are defects to fix, not preferences.

1. **`toast.ts` renders `background: var(--surface)`** — white in light theme. Spec §4.12 states the toast is *always* charcoal: it is where the dark brand lives in the light theme. Currently white-on-white.
2. **`toast.ts` has no action slot** and defaults to 3s. An undo toast — the spec shows "Ångra" plus an 8s countdown — is unimplementable with today's `ToastOptions`.
3. **`tabs.ts` active tab has no weight change.** The 2px accent line is correct; spec §4.11 also mandates weight 700.
4. **`badge.ts` is a colour-first API** — it takes an arbitrary `bg` prop and hardcodes `color: #fff`. Spec §4.4 demands a *shape* grammar legible without colour (outline = ongoing, filled = completed, dashed = cancelled) and explicitly forbids per-view hues. Badge survives for count badges (the inbox counter); it is not the status pill.
5. **`avatar.ts` is the wrong answer for §4.6**, which says avatars must not substitute for person markers. Avatar remains valid elsewhere.
6. **`select.ts` is single-value.** Spec §4.9 needs multi-select with checkboxes, accent fill and a visible selected count. Its existing group-header support (via disabled options, already styled uppercase and letterspaced) maps cleanly onto "grouped by owning teacher".
7. **Hardcoded `#fff`** in `badge.ts`, `avatar.ts` and `confirm.ts` breaks dark theme, where `--on-accent` is `#1C1F21`.
8. **`tabs.ts` `pill` variant** has no counterpart in the spec. Retire it.

## App-level spec violations to fix during migration

- **Bare "Delad"** at `web/goals/goal-notes.component.ts:212` and `web/training-sessions/training-session-detail.component.ts:559`. Spec §4.5 forbids an unlabelled shared state — name the recipient. `training-session-detail.component.ts:364` renders `Delad (2 lärare)` — a count, not a name; the spec wants `Delad: Alva +1`. A third wording, `Delad med läraren`, appears at `goal-notes.component.ts:159`. Three inconsistent phrasings for one concept.
- **Every empty state has zero actions.** Ten-plus hand-rolled sites across `stable/`, `inbox/`, `goals/`, `plans/` and `training-sessions/`. Spec §4.14 requires exactly one action. Consolidating these onto `EmptyState` is a large, cheap win.
- **`web/students/exercise-history.component.ts` is a collapsible timeline**, not the table §4.15 specifies. This is a view rewrite, not a restyle — scheduled with Övningshistorik, not with the component layer.
- **Three near-duplicate note threads** exist (`goals/goal-notes.component.ts`, `lessons/exercise-notes.component.ts`, and an inline block in `training-sessions/training-session-detail.component.ts`). None has the spec's context row or the teacher's hairline brass rule. Consolidate to one.

## Borderline placements, and why

**Note thread (§4.7) → `web/`.** The shape is generic — context row, stacked non-bubble entries, composer. But the hairline brass rule keys off *author role is teacher*, and the composer footer is the Privat/Delad trust control. A generic extraction would be a shell whose entire API is domain hooks.

**Detail header (§4.10) → `web/`.** The layout is generic; its parent chips are navigational edges in the Mål → Plan → Lektion/Träningspass → Övning hierarchy, which is domain structure. Composes the framework's `menu.ts` for the ⋯ overflow and the generic pill for chips.

**Grouped list rows (§4.3) → split.** A `ListRow` primitive (leading block, title and meta, trailing chips) is generic. Kommande/Tidigare bucketing, horse names, note counts and cancelled dimming are domain.

**Person marker (§4.6) → `web/`.** Lärare/Elev is the app's role vocabulary. The generic residue is too thin to extract; it reuses the framework pill for its visual.

## Untouched by the spec — reuse as-is

`overlay.ts` (scrim, scroll lock, click-outside — pure mechanism), `drawer.ts` (needed for the responsive nav in `UI_DECISIONS.md` §6), `popover.ts`, `menu.ts`, `calendar.ts`, `image-crop.ts`, and `avatar.ts` outside §4.6. Several need the legacy-token swap when touched; none need behavioural change.

Note that `calendar.ts` and `select.ts` hardcode English month and day names, overridable by props. In a Swedish app that is a call-site burden — they should draw from the i18n date helpers instead.

## Spacing scale

The framework's `s()` scale and the design system's `--space-*` scale correspond one-to-one in order and value: `xs`=4=`--space-1`, `sm`=8=`--space-2`, `md`=12=`--space-3`, `lg`=16=`--space-4`, `xl`=24=`--space-5`, `2xl`=32=`--space-6`, plus the newly added `3xl`=48=`--space-7` and `4xl`=64=`--space-8`. `s()` is used pervasively in `web/` and stays. No migration needed; the two names denote the same steps.
