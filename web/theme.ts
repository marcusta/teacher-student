import { createTokens } from '@basics/core/client/core';

/**
 * Design-system token layer.
 *
 * Values are taken verbatim from the design system (sections 01–05).
 * `createTokens` emits `[data-theme="light"]` / `[data-theme="dark"]` blocks,
 * and `Theme` flips the attribute from prefers-color-scheme + localStorage.
 */

/** Theme-invariant tokens — must be present in both maps. */
const invariant = {
    // Typography
    'font-display': "Lora,Georgia,'Times New Roman',serif",
    'font-ui': "'Open Sans','Segoe UI',system-ui,sans-serif",

    // Spacing scale
    'space-1': '4px',
    'space-2': '8px',
    'space-3': '12px',
    'space-4': '16px',
    'space-5': '24px',
    'space-6': '32px',
    'space-7': '48px',
    'space-8': '64px',

    // Radii
    'radius-sm': '4px',
    'radius-md': '8px',
    'radius-pill': '999px',

    // Motion
    'dur-fast': '120ms',
    'dur-base': '200ms',
    'dur-slow': '320ms',
    'ease-standard': 'cubic-bezier(.2,.7,.3,1)',
};

/**
 * CONTROL TOKENS — this product's field and button treatment.
 *
 * The framework's field and button recipes are structurally neutral: they ship
 * a uniform 1px box and filled tiers, and read every visual decision from a
 * custom property. The design system's editorial choices live HERE, in the one
 * theme that wants them, instead of in the shared component where they used to
 * sit and where every other consumer had to work around them.
 *
 * Only the deltas from the framework's neutral defaults are listed. Anything
 * absent — the 1px border, the 4px radius, the 14/21 field type, the 3px focus
 * ring, the disabled treatment — is already what this product wants.
 */
const controls = {
    /*
     * The "logbook line" (§4.8). The field is RECESSED: it fills with --bg, the
     * page-paper colour, so it reads as cut into the card rather than drawn on
     * it, and the 3:1 control edge WCAG 1.4.11 asks for is carried by a
     * weighted 2px bottom rule rather than a uniform outline.
     *
     * CONSEQUENCE — a field styled this way is only visible on a --surface
     * parent. On a --bg page the fill matches the page and only the borders
     * remain, so every form in this app has to sit in a card() panel. That is a
     * real coupling, and it is precisely why this belongs in the app theme: it
     * is a constraint this product accepts, not one the framework may impose on
     * projects that never asked for a recessed field.
     */
    'field-bg': 'var(--bg)',
    /*
     * Hairlines on three sides, deliberately. The framework's neutral default
     * puts --border-strong on all four because that is where a uniform box has
     * to carry its 3:1 control edge; here the edge is the 2px bottom rule
     * below, so the other three sides are free to recede.
     */
    'field-border': 'var(--border)',
    'field-bg-focus': 'var(--surface)',
    'field-rule': 'var(--border-strong)',
    'field-rule-width': '2px',
    'field-padding-y': '10px',
    'field-padding-x': '12px',
    /*
     * Only the rule turns red on an invalid field; the other three sides keep
     * their resting hairline. The framework default reddens the whole box,
     * which is the right reading for a uniform box and the wrong one here.
     */
    'field-invalid-border': 'var(--border)',

    // Buttons: 9×20, Open Sans 600 at 13/20. The serif is forbidden on a
    // button entirely (§02), and 700 was too heavy.
    'btn-padding-y': '9px',
    'btn-padding-x': '20px',
    'btn-font-size': '13px',
    'btn-font-weight': '600',

    'btn-primary-shadow': 'var(--shadow-1)',

    /*
     * Secondary is UNFILLED. A filled secondary beside a filled primary reads
     * as a second primary, so the tier is carried by the --border-strong edge
     * alone; hover moves the edge and the label to accent and never paints in
     * a background.
     */
    'btn-secondary-bg': 'transparent',
    'btn-secondary-bg-hover': 'transparent',
    'btn-secondary-fg-hover': 'var(--accent)',
    'btn-secondary-border': 'var(--border-strong)',
    'btn-secondary-border-hover': 'var(--accent)',

    'btn-ghost-bg-hover': 'var(--accent-soft)',
    'btn-ghost-fg-hover': 'var(--accent)',

    /*
     * Destructive is an OUTLINE that fills only on hover. A permanently
     * red-filled button shouts before the user has done anything. This is the
     * clearest example of an editorial choice that must not be the framework's
     * default — it is expressed here purely as values.
     */
    'btn-danger-bg': 'transparent',
    'btn-danger-fg': 'var(--danger)',
    'btn-danger-border': 'var(--danger)',
    'btn-danger-bg-hover': 'var(--danger)',
    'btn-danger-fg-hover': 'var(--on-danger)',
    'btn-danger-border-hover': 'var(--danger)',
};

export const token = createTokens({
    ...invariant,
    ...controls,

    bg: '#F6F4F1',
    surface: '#FFFFFF',
    'surface-2': '#EFEBE4',
    text: '#1C1F21',
    'text-muted': '#696159',
    border: '#DED7CF',
    'border-strong': '#9A8E7B',
    accent: '#845C24',
    'accent-strong': '#6B4A1D',
    'accent-soft': '#F3EADD',
    'on-accent': '#FFFFFF',
    'brass-line': '#CFAA81',
    cream: '#FFE9C2',
    success: '#2E6047',
    'success-soft': '#E4EFE8',
    warning: '#9A4A1E',
    'warning-soft': '#F7E9DE',
    danger: '#A3292F',
    'danger-soft': '#F8E6E6',
    'on-danger': '#FFFFFF',
    info: '#3E5974',
    'info-soft': '#E3EAF1',
    'shadow-1': '0 1px 2px rgba(28,31,33,.06)',
    'shadow-2': '0 4px 12px rgba(28,31,33,.10)',
    'shadow-3': '0 16px 40px rgba(28,31,33,.22)',
}, {
    ...invariant,
    ...controls,

    bg: '#131A20',
    surface: '#1C1F21',
    'surface-2': '#262A2B',
    text: '#F1ECE3',
    'text-muted': '#AFA698',
    border: '#3B372F',
    'border-strong': '#7A7059',
    accent: '#CFAA81',
    'accent-strong': '#E2C29C',
    'accent-soft': '#2C271F',
    'on-accent': '#1C1F21',
    'brass-line': '#8A6B45',
    cream: '#FFE9C2',
    success: '#8CC5A4',
    'success-soft': '#1E2B23',
    warning: '#E1955F',
    'warning-soft': '#2E231A',
    danger: '#E39396',
    'danger-soft': '#332122',
    'on-danger': '#1C1F21',
    info: '#93B3CE',
    'info-soft': '#1E2733',
    'shadow-1': '0 1px 2px rgba(0,0,0,.4)',
    'shadow-2': '0 4px 14px rgba(0,0,0,.5)',
    'shadow-3': '0 16px 44px rgba(0,0,0,.6)',
});
