/**
 * The framework's default theme: the design-system token layer expressed in a
 * neutral slate/indigo palette (Open Color based).
 *
 * This is the framework's own neutral default — deliberately unbranded. An app
 * with a brand supplies its own values for the same names; it should not have
 * to invent the *vocabulary* as well, which is what every `core/client/ui/*`
 * recipe reads. Spread into `createTokens()` and override.
 *
 * `createTokens` emits `[data-theme="light"]` / `[data-theme="dark"]` blocks and
 * `Theme` flips the attribute from prefers-color-scheme + localStorage.
 */

/**
 * CONTROL TOKENS — the neutral look of fields and buttons.
 *
 * Every visual decision the field and button recipes make is a value here, so
 * a project dials in its own controls from its own theme instead of forking a
 * component. Structural differences are values too, which is the point of the
 * shape: `--field-rule-width: 0` is a uniform box and `2px` is a weighted
 * bottom rule; `--btn-danger-bg: var(--danger)` is a filled destructive button
 * and `transparent` is an outline. Neither look is owned by the framework.
 *
 * These defaults are deliberately UNBRANDED: a uniform 1px box, filled tiers
 * including a filled danger, no editorial character. Opinionated enough that a
 * new project gets something sane on day one, but nothing that reads as any
 * particular product.
 *
 * Every entry resolves through the palette tokens below, so the map is
 * theme-invariant — light and dark follow from the palette, not from a second
 * copy of these values.
 *
 * `ui/css.ts` imports this map and uses each entry as the fallback arm of its
 * `var(--field-*, …)` / `var(--btn-*, …)` references. That makes THIS the
 * single source of truth: an app that spreads `neutralLight`/`neutralDark`
 * gets these as real custom properties, and an app that defines its own
 * palette without spreading them gets the identical values through the
 * fallback arm. The two paths cannot drift, because there is only one copy.
 */
export const controlTokens: Record<string, string> = {
    // ─── Fields ───
    'field-bg': 'var(--surface)',
    'field-bg-focus': 'var(--surface)',
    /*
     * --border-strong, not the decorative --border hairline. This is a CONTROL
     * boundary, and WCAG 1.4.11 wants 3:1 against the page behind it; the
     * hairline measures 1.2–1.9:1 across the demo themes and the strong border
     * 3.1–5.5:1. A theme that carries its control edge some other way — a
     * weighted bottom rule, say — sets this back to its own hairline.
     */
    'field-border': 'var(--border-strong)',
    'field-border-width': '1px',
    /*
     * The bottom rule is an EXTRA on top of the uniform border, not a
     * replacement for it: the recipe takes max(border-width, rule-width), so 0
     * leaves a plain 1px box with its bottom edge intact rather than deleting
     * the edge and with it the 3:1 control boundary WCAG 1.4.11 asks for.
     * `--field-rule` therefore tracks --field-border — at rule-width 0 the
     * bottom is indistinguishable from the other three sides, and a theme that
     * recolours the border gets a matching bottom for free.
     */
    'field-rule': 'var(--field-border, var(--border-strong))',
    'field-rule-width': '0px',
    'field-radius': 'var(--radius-sm)',
    'field-padding-y': '8px',
    'field-padding-x': '10px',
    'field-font-size': '14px',
    'field-line-height': '21px',
    'field-focus-border': 'var(--accent)',
    'field-focus-ring': 'var(--accent-soft)',
    'field-focus-ring-width': '3px',
    /*
     * Invalid recolours the whole box by default, which is the uniform-box
     * reading. A theme with a weighted rule sets --field-invalid-border back to
     * its resting border colour so that only the rule turns red.
     */
    'field-invalid-border': 'var(--danger)',
    'field-invalid-rule': 'var(--danger)',
    'field-invalid-ring': 'var(--danger-soft)',

    // ─── Buttons ───
    'btn-radius': 'var(--radius-sm)',
    'btn-border-width': '1px',
    'btn-padding-y': '8px',
    'btn-padding-x': '16px',
    'btn-font-size': '14px',
    'btn-line-height': '20px',
    'btn-font-weight': '500',
    'btn-focus-ring': 'var(--accent-soft)',
    'btn-focus-ring-width': '3px',

    'btn-primary-bg': 'var(--accent)',
    'btn-primary-fg': 'var(--on-accent)',
    'btn-primary-border': 'var(--accent)',
    'btn-primary-shadow': 'none',
    'btn-primary-bg-hover': 'var(--accent-strong)',
    'btn-primary-fg-hover': 'var(--on-accent)',
    'btn-primary-border-hover': 'var(--accent-strong)',

    'btn-secondary-bg': 'var(--surface-2)',
    'btn-secondary-fg': 'var(--text)',
    'btn-secondary-border': 'var(--border)',
    'btn-secondary-shadow': 'none',
    'btn-secondary-bg-hover': 'var(--accent-soft)',
    'btn-secondary-fg-hover': 'var(--text)',
    'btn-secondary-border-hover': 'var(--border-strong)',

    'btn-ghost-bg': 'transparent',
    'btn-ghost-fg': 'var(--text-muted)',
    'btn-ghost-border': 'transparent',
    'btn-ghost-shadow': 'none',
    'btn-ghost-bg-hover': 'var(--surface-2)',
    'btn-ghost-fg-hover': 'var(--text)',
    'btn-ghost-border-hover': 'transparent',

    /*
     * FILLED, not an outline. A destructive button that fills only on hover is
     * a defensible editorial choice, but it IS an editorial choice, and the
     * neutral default should not make it on a project's behalf. An app that
     * wants the outline sets --btn-danger-bg to transparent.
     */
    'btn-danger-bg': 'var(--danger)',
    'btn-danger-fg': 'var(--on-danger)',
    'btn-danger-border': 'var(--danger)',
    'btn-danger-shadow': 'none',
    'btn-danger-bg-hover': 'var(--danger-strong, var(--danger))',
    'btn-danger-fg-hover': 'var(--on-danger)',
    'btn-danger-border-hover': 'var(--danger-strong, var(--danger))',

    'btn-disabled-bg': 'var(--surface-2)',
    'btn-disabled-fg': 'var(--text-muted)',
    'btn-disabled-border': 'var(--border)',
    'btn-disabled-opacity': '0.7',
};

/** Theme-invariant tokens — identical in both maps. */
const invariant = {
    // Typography. Both stacks are web-safe: the framework ships no fonts, and a
    // theme that names an unavailable family renders as the browser default
    // rather than as the design system's type pairing.
    'font-display': "Georgia,'Times New Roman',serif",
    'font-ui': "system-ui,-apple-system,'Segoe UI',sans-serif",

    // Spacing scale (4-based).
    'space-1': '4px',
    'space-2': '8px',
    'space-3': '12px',
    'space-4': '16px',
    'space-5': '24px',
    'space-6': '32px',
    'space-7': '48px',
    'space-8': '64px',

    // Radii. `radius-sm` and `radius-pill` carry the same meaning in the legacy
    // vocabulary, so they are not aliased below — these ARE the legacy values.
    'radius-sm': '4px',
    'radius-md': '8px',
    'radius-pill': '999px',

    // Motion.
    'dur-fast': '120ms',
    'dur-base': '200ms',
    'dur-slow': '320ms',
    'ease-standard': 'cubic-bezier(.2,.7,.3,1)',
};

/**
 * COMPAT ALIASES — TEMPORARY.
 *
 * Apps written before the design-system token set still style their own markup
 * with these names. Each one points at the closest design-system token so that
 * CSS keeps rendering; no `core/client/ui/*` recipe reads them any more.
 *
 * Delete this block once the last consumer has been rewritten against the
 * design-system names. Do not add new usages of these names.
 *
 * Two of them are the reason the aliases point THIS way round rather than the
 * other. `--accent` and `--surface` exist in both vocabularies with different
 * meanings: legacy `--accent` was a decorative highlight (the action colour was
 * `--primary`), and legacy `--surface` was the card/panel fill, distinct from
 * `--input-bg`. Defining the design-system meaning as the real token and the
 * legacy name as the alias resolves the collision in one direction, once, here
 * — which is what lets the recipes reference `--accent` and `--surface` plainly
 * instead of guessing with a `var(--a, var(--b))` chain.
 */
const aliasesLight = {
    primary: 'var(--accent)',
    'primary-text': 'var(--on-accent)',
    'btn-bg': 'var(--surface-2)',
    'btn-hover': 'var(--accent-soft)',
    'input-bg': 'var(--surface)',
    'topbar-bg': 'var(--surface)',
    'topbar-logo': 'var(--text-muted)',
    'active-bg': 'var(--accent-soft)',
    'active-text': 'var(--accent-strong)',
    'hover-bg': 'var(--surface-2)',
    error: 'var(--danger)',
    radius: 'var(--radius-md)',
    shadow: 'var(--shadow-1)',
    'shadow-elevated': 'var(--shadow-2)',
    'done-opacity': '0.4',
};

const aliasesDark = {
    ...aliasesLight,
    'done-opacity': '0.35',
};

export const neutralLight: Record<string, string> = {
    ...invariant,
    ...aliasesLight,
    ...controlTokens,

    bg: '#f8f9fa',
    surface: '#ffffff',
    'surface-2': '#f1f3f5',
    text: '#212529',
    'text-muted': '#5c636a',
    border: '#dee2e6',
    'border-strong': '#868e96',
    accent: '#3b5bdb',
    'accent-strong': '#2f44ad',
    'accent-soft': '#edf2ff',
    'on-accent': '#ffffff',
    success: '#217a36',
    'success-soft': '#ebfbee',
    warning: '#a85400',
    'warning-soft': '#fff4e6',
    danger: '#c92a2a',
    'danger-strong': '#a51111',
    'danger-soft': '#fff5f5',
    'on-danger': '#ffffff',
    info: '#1864ab',
    'info-soft': '#e7f5ff',
    'shadow-1': '0 1px 2px rgba(33,37,41,.06)',
    'shadow-2': '0 4px 12px rgba(33,37,41,.10)',
    'shadow-3': '0 16px 40px rgba(33,37,41,.22)',
};

export const neutralDark: Record<string, string> = {
    ...invariant,
    ...aliasesDark,
    ...controlTokens,

    bg: '#141517',
    surface: '#1a1b1e',
    'surface-2': '#25262b',
    text: '#e9ecef',
    'text-muted': '#a6a7ab',
    border: '#373a40',
    'border-strong': '#868e96',
    accent: '#91a7ff',
    'accent-strong': '#bac8ff',
    'accent-soft': '#232840',
    'on-accent': '#141517',
    success: '#69db7c',
    'success-soft': '#17301e',
    warning: '#ffa94d',
    'warning-soft': '#33260f',
    danger: '#ff8787',
    'danger-strong': '#ffa8a8',
    'danger-soft': '#331f1f',
    'on-danger': '#141517',
    info: '#74c0fc',
    'info-soft': '#17242f',
    'shadow-1': '0 1px 2px rgba(0,0,0,.4)',
    'shadow-2': '0 4px 14px rgba(0,0,0,.5)',
    'shadow-3': '0 16px 44px rgba(0,0,0,.6)',
};
