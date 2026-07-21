# UI implementation decisions

Status: decision record
Scope: decisions taken while turning the [UI design system](https://claude.ai/code/artifact/3bd30fd9-ddf0-4820-af75-ae34f594631d), the [UX proposal](https://claude.ai/code/artifact/8e0083dd-682d-4731-b22c-ceeed9b4468e), and `INFORMATION_ARCHITECTURE.md` into an implementation.

Each entry records what was decided and why, so it does not get re-litigated. Where two source documents disagreed, the winner is named explicitly.

## 1. Navigation stays ungated

**Decision:** the **Undervisning** group renders for every account. Empty states teach the feature.

The two source documents conflict here. Design system §4.1 states that the group is capability-driven and renders only for teachers. `INFORMATION_ARCHITECTURE.md` recommends keeping it visible. **The IA wins.**

Reasoning: role is contextual, not an account type — the same person is a Teacher in one Relation and a Student in another. Gating the group means a new account cannot discover that inviting a student is possible. An always-available **Bjud in elev** entry is required either way, so gating buys nothing and costs discoverability. Capability-gating remains viable later; it is not the first implementation.

Never gate Mål, Planer, Hästar, or Träningspass by a presumed role.

## 2. Design tokens are the source of truth; the legacy aliases are gone

**Decision:** `web/theme.ts` defines the design-system token set (`--bg`, `--surface`, `--surface-2`, `--accent`, `--accent-strong`, `--accent-soft`, `--on-accent`, `--brass-line`, `--border`, `--border-strong`, `--text`, `--text-muted`, the semantic scale with `-soft` variants, `--shadow-1..3`, `--radius-sm/md/pill`, `--dur-fast/base/slow`, `--ease-standard`, `--font-display`, `--font-ui`, `--space-1..8`) and **nothing else**.

Originally it also carried a temporary block aliasing every legacy token name (`radius`, `btn-bg`, `hover-bg`, `primary`, `active-bg`, `shadow-elevated`, …) onto its design-system equivalent, because the framework's CSS recipes (`btn`, `input`, `card`, `badge`) and the `core/client/obs/` dashboard consumed those names, and renaming inside `@basics/core` would have broken other consumers of that repo. Aliasing kept every surface styled while recipes migrated one at a time.

**Status: complete. The alias block was deleted.** The migration that justified it has landed:

- no `core/client/ui/*` recipe reads a legacy name any more — the framework's own `default-theme.ts` states this, and its brand themes define the design-system vocabulary directly;
- `core/client/obs/` self-supplies its tokens by `@scope` from the *framework's* default theme, so it never read this app's block;
- the app's own 100-odd legacy call sites were rewritten to the design-system names they already aliased to, one-for-one: `radius`→`radius-md`, `error`→`danger`, `hover-bg`→`surface-2`, `active-bg`→`accent-soft`, `active-text`→`accent-strong`, `topbar-bg`→`surface`, `topbar-logo`→`text-muted`. Each alias was literally `var(--<target>)`, so every substitution is value-identical by construction — it removes one level of indirection and changes no pixel. Verified by rendering: zero `--<legacy>` custom properties resolve and no emitted stylesheet references one.

The remaining aliases (`primary`, `btn-bg`, `btn-hover`, `input-bg`, `shadow`, `shadow-elevated`, `primary-text`, `done-opacity`) had no app call site at all and were deleted unused.

**Policy:** do not reintroduce aliases; write only design-system names. `token()` is typed `keyof T`, so a legacy name is now a compile error under `bun run check:client` rather than a silently unstyled surface.

The spacing scale needed no reconciliation — the framework's existing `s()` scale (`xs`…`2xl` = 4/8/12/16/24/32px) already equals `--space-1..6` exactly. It gains `3xl` (48px) and `4xl` (64px) to complete the design system's 4-based scale.

## 3. Fonts are self-hosted

**Decision:** Lora (500) and Open Sans (400/600/700) ship from `web/assets/fonts/`, subset to latin + latin-ext, `font-display: swap`, served through the Vite build. No request ever goes to Google.

Reasoning: both families are OFL-1.1, so self-hosting is permitted. The design system makes typography the primary carrier of brand, which makes the fonts load-bearing rather than decorative — a third-party request that can fail, be blocked, or leak visitor IPs is not acceptable for a load-bearing asset. Self-hosting also removes external-DNS FOUT and works offline.

What actually ships is two files per family, not four weight cuts:

- **Open Sans** is Google's *variable* font (`wght` axis 300–800, declared `font-weight: 400 700`). 400, 600 and 700 are all real instances of the axis — measured ink coverage rises 18823 → 23762 → 28398 across them, so nothing is synthesised.
- **Lora** is a *single static 500 cut*. The spec only ever asks for Lora 500 (display 22/30, page title 28/36, section heading 20/28), so this covers 100% of specified usage — but it does **not** cover the full 400–600 the spec permits.

**Constraint that follows: only ever write Lora at weight 500.** With one 500 face declared, the CSS font-matching algorithm does not fall back to Georgia for other weights — it silently mis-renders:

- `font-weight: 400` on Lora resolves to the 500 face and renders as 500 (measured: identical ink, 22007 px).
- `font-weight: 600` (or 700) on Lora resolves to the 500 face and the browser applies **synthetic bold** — Skia stroke-emboldening, +23% ink at an unchanged advance width (22007 → 27064 px). That is precisely the faked `fet` the spec forbids, and it is visibly cruder than a real cut.

Neither case produces a warning, which is what makes it dangerous.

If a future heading genuinely needs Lora 400 or 600, swap to Google's Lora variable font (`wght` 400–700) rather than adding another static cut — it is one file per subset, same as today. Cost, measured: latin 21,928 → 37,792 bytes and latin-ext 12,180 → 20,176 bytes, i.e. **+23,860 bytes total (+70%)**. That was judged not worth paying while every specified use is 500.

## 4. Swedish is the source of truth for copy

**Decision:** all user-visible strings live in per-locale JSON files under `web/i18n/`. Swedish (`sv.json`) is authored first and is authoritative; English (`en.json`) is a translation. A key-parity check fails the build when the two diverge in keys or in interpolation placeholders.

Reasoning: the design system specifies the Swedish voice precisely — warm, brand-near, errors that explain the fix, empty states of at most two sentences. Treating English as the source would erode that voice on first re-translation. The parity check, not the translation itself, is what actually prevents copy drift across 17 views.

Dates, relative times, and counts go through `Intl` (`DateTimeFormat`, `RelativeTimeFormat`, `PluralRules`), not through string tables — the spec renders `22 JUL`, `Onsdag 22 juli · 17:00–18:00`, `2026-07-14`, `för 2 tim sedan`, and `3 av 5 delmål`, none of which survive naive interpolation.

**Two places where the spec deliberately overrides CLDR.** Both are copy/typography decisions, so both are expressed as data rather than as string surgery on `Intl` output:

- **`i går`, not CLDR's `igår`.** The spec's voice spells the day-scale terms with a space (§4.3 feed: `Alva · i går 19:32`). Both spellings are valid Swedish, so the authored voice wins. Implemented as `relative.yesterday` / `relative.today` / `relative.tomorrow` keys in the catalogs, which `formatRelative` prefers over `Intl` for days −1/0/+1. English must define the same keys — lookups fall back to the fallback locale (sv), so if only sv defined them an English UI would silently render `i går`. The parity check is what guarantees it doesn't.
- **`JUL`, not CLDR's `JULI`.** The §4.3 date block (`22 / JUL / 17:00`) is a fixed-width visual element, and sv's four-character months (`JULI`, `MARS`, `JUNI`) break its alignment. `formatMonthBlock()` truncates to three upper-case characters for that block only; `formatMonthAbbrev()` stays CLDR-correct for months in running copy. Verified non-destructive and collision-free for all twelve sv and en months.

**Known name collision: `t`.** `web/theme.ts` exports a design-token helper `t`, and the i18n module exports a translation helper `t`. Twenty-six files import `t` meaning *token*; `web/app/nav.component.ts` is currently the only file that imports `t` meaning *translate*, and it aliases the token helper to `token` to let both coexist. That inversion makes `nav.component.ts` the one file where the repo-wide reading of `t` is actively misleading — `t('nav.home')` reads like a token lookup. This compiles and is correct; the repo-wide rename is a separate scheduled task. Until it lands, any new file mixing the two should follow nav's alias convention.

## 5. Component placement: generic to the framework, domain to the app

**Decision:** components that encode no equestrian or teacher-student concept are built into `@basics/core`. Components that encode domain semantics stay in `web/`.

Reasoning: the design system was written without knowledge of the existing component library, so several of its 15 components already exist in some form. Building the genuinely generic ones into the framework makes `@basics/core` more complete and is a deliberate goal. But the framework must not accrete riding concepts, or it stops being reusable.

Borderline cases are resolved by shape versus semantics: a note thread's *layout* (author, role marker, timestamp, visibility, body, context line) is generic and belongs in the framework; the private/shared visibility *meaning* is domain and is supplied by the app.

See `COMPONENTS.md` for the per-component verdicts.

## 6. Responsive behaviour

The design system is desktop-shaped and specifies no breakpoints; the app today has a single 640px breakpoint. The following are decided here.

### Breakpoints

| Name | Width | Purpose |
|---|---|---|
| `sm` | `< 640px` | Phone. Single column throughout. |
| `md` | `640–1023px` | Tablet. Content is single-column, navigation is still collapsed. |
| `lg` | `≥ 1024px` | Desktop. Persistent sidebar navigation. |

Content area carries a max width of `1100px` and centres beyond it. Long-form reading measures stay at or under `68ch` regardless of viewport.

### Navigation

- **`≥ 1024px`:** persistent left sidebar, grouped, as specified in design system §4.1.
- **`< 1024px`:** the sidebar collapses into a drawer opened from the top bar. The drawer preserves the group structure and letterspaced uppercase group labels — grouping is meaning, not decoration, and does not get flattened on small screens.

The current implementation reflows the sidebar into a horizontal row below 640px. That is replaced: eleven-plus links in a horizontal scroller is not navigable, and it destroys the grouping.

### Tabs (Elevvy, §4.11)

Seven tabs do not fit a phone. Tabs scroll horizontally in a single row with an edge fade indicating overflow; they never wrap to a second row and never collapse into a select. The active tab scrolls into view on mount. Active styling (2px accent line, weight 700) is unchanged across breakpoints.

### Data table (Övningshistorik, §4.15)

- **`≥ 640px`:** the table as specified — tabular numerals, no zebra striping, missing note rendered as `—`.
- **`< 640px`:** the table renders as stacked rows following the §4.3 list-row grammar (date block, then occasion chip and exercise, then note). A four-column table with a free-text note column cannot be made readable in a horizontal scroller, and reusing the existing list grammar avoids inventing a third pattern.

### Detail header (§4.10)

The single primary action remains visible at every breakpoint. Below 640px, secondary actions collapse into the overflow menu that already exists in the spec's action cluster. Parent chips wrap rather than scroll — they are navigation paths upward and must all remain reachable.

### Forms (§4.8)

Paired field rows (for example *Datum & tid* beside *Häst*) collapse to a single column below 640px. Label treatment, field outlines at `--border-strong`, and error copy are unchanged across breakpoints.

### Dashboard (§4.2)

Cards lay out on an auto-fitting grid with a minimum card width, capped at the spec's maximum of four cards. On a phone this yields one column in priority order: next lesson, latest feedback, then capability-dependent blocks.

## 7. Motion and accessibility

The reduced-motion block from the design system is global, not per-component. Focus-visible outlines use `--accent` and are never removed. Status is never carried by colour alone — §4.4's shape grammar (outline = ongoing, filled = completed, dashed = cancelled) is mandatory, which is also what makes the status system legible in both themes.

## 8. Forms live on a panel, and the field is recessed

**Decision:** every form renders inside a `card()` panel, and fields use the recessed treatment from the form-controls handoff — fill `--bg`, hairline `--border` on three sides, and a 2px `--border-strong` bottom rule.

The handoff (`ui-design/design_handoff_form_controls/README.md`) specifies the field fill as `--bg`, describing it as *"recessed vs. the white card"*. That description assumes forms sit on `--surface`. In this app the auth pages did, but every create route rendered its form directly on the page — which is already `--bg`. Applying the spec literally there would have made each field the same colour as its background, leaving only a 1.43:1 hairline and the bottom rule to mark the control.

So the two halves cannot land separately: the new field recipe without panels makes fields invisible on create routes, and panels without the new recipe makes them invisible on the panel. They ship as one change.

Reasoning for panelling rather than adapting the fill per context: design system §4.8 already illustrates a form inside a panel, and the auth pages already followed it — the create routes were the inconsistent ones. A context-aware fill would also mean the same control looks different depending on where it is mounted, which is precisely the kind of drift the recipe layer exists to prevent.

**Consequence to keep in view:** the field's perceivable boundary is now the 2px bottom rule rather than a full outline. `--border-strong` measures 3.22:1 (light) and 3.38:1 (dark) against the field fill, so WCAG 1.4.11 is satisfied by that edge — but any future change to the bottom rule's colour or weight is a contrast change, not a cosmetic one.

## 9. Button tiers are three plus destructive

**Decision:** `primary` (accent fill), `secondary` (transparent, `--border-strong` outline), `text/ghost` (transparent, no border, `--text-muted`), and `destructive` (danger outline that fills on hover). Disabled is a state, not a tier.

Cancel is always the **ghost** tier. The handoff names "two identical OS-style dialog buttons" as one of the four things that made the old controls feel generic, and a bordered Cancel beside a bordered Confirm is exactly that. One primary per view or dialog.

This changed two existing tiers rather than only adding one: `secondary` lost its `--surface-2` fill, and `destructive` went from filled to outline-until-hover. Both appear across every view, so the change is broad by design — a filled destructive button competes with the primary action for attention on a screen where the primary action is the safe one.

Button labels are Open Sans 600/13 and never Lora, in any tier.
