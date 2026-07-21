# Handoff: Teacher–Student form & control language

## Overview
Design system + component spec for an equestrian teacher/student training app (Swedish UI).
This handoff focuses on the **form fields, selects, and buttons** — the "logbook" control
treatment that replaces flat, generic (Bootstrap/OS-default) form controls. The full spec
page (all 15 components, both themes) is included as reference.

## About the design files
`Teacher-Student Designsystem.dc.html` is a **design reference authored in HTML** — a
prototype of intended look and behavior, not production code to copy verbatim. Recreate these
patterns in your codebase using its existing framework and conventions (React/Vue/etc.). The
values below (tokens, sizes, states) are the source of truth; the markup is illustrative.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and states are final. Match them exactly.

---

## Design tokens
Define once (`:root`), override for dark under both `@media (prefers-color-scheme: dark)`
and `[data-theme="dark"]`. Neutrals are warm (brass-biased) — never use `#888`/`#ccc`/cool grays.

### Light (default)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#F6F4F1` | page paper; also the *recessed field fill* |
| `--surface` | `#FFFFFF` | cards, focused field fill |
| `--surface-2` | `#EFEBE4` | secondary fill, group headers |
| `--text` | `#1C1F21` | text |
| `--text-muted` | `#696159` | metadata, ghost-button label |
| `--border` | `#DED7CF` | hairlines (decorative) |
| `--border-strong` | `#9A8E7B` | control outlines / field bottom rule (3:1) |
| `--accent` | `#845C24` | links, primary, focus (functional brass) |
| `--accent-strong` | `#6B4A1D` | accent hover/active |
| `--accent-soft` | `#F3EADD` | focus ring, active fills |
| `--brass-line` | `#CFAA81` | **decorative brass — ornaments/rules ONLY, never text/UI on light** |
| `--on-accent` | `#FFFFFF` | text on accent |
| `--danger` / `--danger-soft` | `#A3292F` / `#F8E6E6` | errors, destructive |

### Dark
`--bg #131A20` · `--surface #1C1F21` · `--surface-2 #262A2B` · `--text #F1ECE3` ·
`--text-muted #AFA698` · `--border #3B372F` · `--border-strong #7A7059` ·
`--accent #CFAA81` · `--accent-strong #E2C29C` · `--accent-soft #2C271F` ·
`--danger #E39396` / `--danger-soft #332122` · `--on-accent #1C1F21`

### Scales
- Spacing (4-base): `4 8 12 16 24 32 48 64`. Field padding 10×12; card padding 16–24; gap between cards 16; between sections 48.
- Radius: `sm 4` (fields, buttons) · `md 8` (cards, dialogs) · `pill 999` (status/chips). Nothing between 8 and pill.
- Motion: `--dur-fast 120ms` (hover/focus) · `--dur-base 200ms` · `--dur-slow 320ms` · ease `cubic-bezier(.2,.7,.3,1)`. Honor `prefers-reduced-motion`.
- Type: **Lora** (500) for titles/headings only; **Open Sans** for all UI/body. Labels = Open Sans 700, 11px, `letter-spacing:.1–.14em`, uppercase. Numbers/times use `font-variant-numeric: tabular-nums`.

---

## The control redesign (what changed and why)
The old controls felt generic because of: flat uniform 1px boxes on white, native `<select>`
chevrons, hard focus outlines, and two identical OS-style dialog buttons. The fix:

### Text field / textarea
- **Base:** `background: var(--bg)` (recessed vs. the white card), `border: 1px solid var(--border)`, **`border-bottom: 2px solid var(--border-strong)`** (the weighted "logbook line"), `border-radius: 4px`, `padding: 10px 12px`, font Open Sans 400/14 (21 line-height).
- **Focus:** `outline: none; border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-soft);` — soft brass ring, no OS outline. Fill brightens to `--surface` (works in both themes since surface is lighter than bg in each).
- **Error:** base `border-bottom: 2px solid var(--danger)` (keep other borders `--border`); focus ring `--danger-soft`. Error text: Open Sans 600/12 in `--danger`, stating what's wrong and how to fix.
- Transition `border-color, box-shadow, background` at `--dur-fast`.
- Bottom border is 2px in *both* states (only color changes) to avoid focus jitter.

### Select
- Same field base, plus `appearance: none; -webkit-/-moz-appearance: none; padding-right: 34px`.
- Custom chevron: absolutely-positioned inline SVG, `pointer-events: none`, `color: var(--text-muted)`, 1.5px stroke to match hairline weight:
  `<svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`

### Buttons (3 tiers + destructive)
| Tier | Base | Hover |
|---|---|---|
| **Primary** | `bg var(--accent)`, `border 1px var(--accent)`, `color var(--on-accent)`, radius 4, `padding 9px 20px`, `box-shadow var(--shadow-1)` | `bg/border var(--accent-strong)` |
| **Secondary** | transparent, `border 1px var(--border-strong)`, `color var(--text)` | `border-color/color var(--accent)` |
| **Text / ghost** | transparent, `border 1px transparent`, `color var(--text-muted)` | `color var(--accent)`, `bg var(--accent-soft)` |
| **Destructive** | transparent, `border 1px var(--danger)`, `color var(--danger)` | `bg var(--danger)`, `color var(--on-accent)` |
| Disabled | `bg var(--surface-2)`, `border var(--border)`, `color var(--text-muted)`, `opacity .7` | — |

Button focus: `outline: none; box-shadow: 0 0 0 3px var(--accent-soft)`.
Button labels are Open Sans 600/13 — **never Lora**.

### Rules
- One primary per view/dialog. Cancel is the **Text/ghost** tier, not a second bordered button.
- Brass is brand + action only; never a status color. Status colors come from the semantic scale and are never used for decoration.
- Labels sit above fields (spaced uppercase caps) — no floating/placeholder-only labels.

## Files
- `Teacher-Student Designsystem.dc.html` — full spec (§4.8 Formulär, §4.9 Väljare, §4.12 Bekräfta & ångra cover the controls above; §01 lists every token with live WCAG ratios).

## Assets
Fonts: Lora + Open Sans (Google Fonts). No image assets; the chevron is inline SVG.
