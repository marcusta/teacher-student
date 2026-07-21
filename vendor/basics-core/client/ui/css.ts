import { createScale } from '../core';
import { controlTokens } from '../default-theme';

/**
 * Reference a design-system CSS custom property.
 *
 * Plain reference — every theme the framework ships now defines these names,
 * so there is no `var(--new, var(--legacy))` fallback arm to write.
 *
 * `--accent` and `--surface` in particular must never be wrapped in such a
 * chain: both names also exist in the legacy vocabulary meaning something else
 * (a decorative highlight, and the card/panel fill as opposed to a field), so a
 * chain resolves to a wrong-but-plausible colour rather than failing loudly.
 * See the long note in tabs.ts.
 */
const t = (name: string) => `var(--${name})`;

/**
 * Reference a CONTROL property — a `--field-*` / `--btn-*` name — with a
 * fallback for themes that have not declared it.
 *
 * A fallback chain is safe for exactly these names and unsafe for the others.
 * `var()` cannot ask whether a token carries the intended MEANING, only whether
 * it is defined, so a chain is only sound when the fallback name was never used
 * for something else. `--accent` and `--surface` fail that test — legacy
 * `--accent` was a decorative highlight (apps/stable set it to coral while its
 * action colour was `--primary`, so a chain painted the primary button coral at
 * 2.59:1) and legacy `--surface` was the panel fill as distinct from
 * `--input-bg`. See the note on `t` above and the long note in tabs.ts.
 *
 * `--field-*` and `--btn-*` are new names that no vocabulary has ever used, so
 * the chain cannot resolve to a different meaning. That is what lets apps which
 * define their own palettes without spreading `neutralLight`/`neutralDark`
 * (apps/stable and apps/starter both do) keep rendering complete controls
 * without being forced to adopt every token at once.
 *
 * The fallback arms below are kept identical to the values `default-theme.ts`
 * declares, so the token path and the fallback path render the same control.
 * `css.test.ts` asserts that equivalence rather than trusting it.
 */
const c = (name: string, fallback: string) => `var(--${name}, ${fallback})`;

/**
 * The neutral default for a control property, read from the one map that
 * defines them. Recipes never spell a fallback value out inline — doing so
 * would put a second copy of the neutral look in the component layer, which is
 * the exact mistake this indirection exists to prevent.
 *
 * Throws on an unknown name so a typo surfaces at import time rather than
 * silently emitting an unstyled control.
 */
const d = (name: string): string => {
    const value = controlTokens[name];
    if (value === undefined) throw new Error(`unknown control token: --${name}`);
    return value;
};

export const s = createScale({
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    '4xl': '4rem',
});

/**
 * Button tiers.
 *
 * At most ONE `primary` per form. Everything else is `secondary`; `danger` is
 * for destructive submits and `disabled` for a button that is present but not
 * yet actionable.
 *
 * The tier names are structural — which job the button does — and carry no
 * appearance of their own. What each tier LOOKS like is three custom properties
 * per state, so a project decides whether its destructive button is filled or
 * outlined, whether its secondary competes with its primary, and so on, without
 * forking this recipe. See `controlTokens` in default-theme.ts.
 */
export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'disabled';

/** One tier's resting + hover skin, entirely token-driven. */
const tier = (name: string) => `
    background: ${c(`btn-${name}-bg`, d(`btn-${name}-bg`))};
    color: ${c(`btn-${name}-fg`, d(`btn-${name}-fg`))};
    border-color: ${c(`btn-${name}-border`, d(`btn-${name}-border`))};
    box-shadow: ${c(`btn-${name}-shadow`, d(`btn-${name}-shadow`))};
    &:hover {
        background: ${c(`btn-${name}-bg-hover`, d(`btn-${name}-bg-hover`))};
        color: ${c(`btn-${name}-fg-hover`, d(`btn-${name}-fg-hover`))};
        border-color: ${c(`btn-${name}-border-hover`, d(`btn-${name}-border-hover`))};
    }`;

const disabledSkin = `
    background: ${c('btn-disabled-bg', d('btn-disabled-bg'))};
    color: ${c('btn-disabled-fg', d('btn-disabled-fg'))};
    border-color: ${c('btn-disabled-border', d('btn-disabled-border'))};
    box-shadow: none;
    opacity: ${c('btn-disabled-opacity', d('btn-disabled-opacity'))};
    cursor: not-allowed;`;

const btnVariants: Record<BtnVariant, string> = {
    primary: tier('primary'),
    secondary: tier('secondary'),
    ghost: tier('ghost'),
    danger: tier('danger'),
    disabled: disabledSkin,
};

/**
 * Button recipe. Both arguments stay optional and the radius stays positional
 * and first, so every existing `btn()`, `btn(t('radius-sm'))` and
 * `btn(t('radius-pill'))` call site is unchanged.
 *
 * Passing no radius now defers to `--btn-radius` rather than hard-coding one,
 * which is what lets a theme set the radius for every button at once.
 */
export const btn = (radius = c('btn-radius', d('btn-radius')), variant: BtnVariant = 'secondary') => `
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${c('btn-border-width', d('btn-border-width'))} solid transparent;
    border-radius: ${radius};
    padding: ${c('btn-padding-y', d('btn-padding-y'))} ${c('btn-padding-x', d('btn-padding-x'))};
    font-family: ${t('font-ui')};
    font-size: ${c('btn-font-size', d('btn-font-size'))};
    line-height: ${c('btn-line-height', d('btn-line-height'))};
    font-weight: ${c('btn-font-weight', d('btn-font-weight'))};
    cursor: pointer;
    transition:
        background ${t('dur-fast')} ${t('ease-standard')},
        border-color ${t('dur-fast')} ${t('ease-standard')},
        color ${t('dur-fast')} ${t('ease-standard')},
        box-shadow ${t('dur-fast')} ${t('ease-standard')};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${c('btn-focus-ring-width', d('btn-focus-ring-width'))} ${c('btn-focus-ring', d('btn-focus-ring'))};
    }
    ${btnVariants[variant]}
    &:disabled {${disabledSkin}}
`;

/**
 * Field recipe.
 *
 * Everything visual is a custom property, so the same recipe renders a uniform
 * box or a weighted-bottom-rule "logbook" field depending only on the theme.
 *
 * The bottom edge is `max(--field-border-width, --field-rule-width)`: the rule
 * is an EXTRA on top of the uniform border rather than a replacement for it, so
 * `--field-rule-width: 0` leaves an ordinary 1px box with its bottom edge — and
 * the 3:1 control boundary WCAG 1.4.11 wants — intact. Because the width is a
 * max() rather than a swap, and the same expression is used in every state,
 * focusing or invalidating a field only ever recolours it; the box never
 * reflows.
 *
 * The error hook is `aria-invalid`, not a class: the recipe is shared by every
 * component prefix and cannot name a per-component BEM modifier, and the state
 * has to reach assistive tech anyway. It is declared AFTER the focus rules
 * because it has equal specificity and must win in the unfocused case.
 */
const ruleWidth = `max(${c('field-border-width', d('field-border-width'))}, ${c('field-rule-width', d('field-rule-width'))})`;

export const input = () => `
    border: ${c('field-border-width', d('field-border-width'))} solid ${c('field-border', d('field-border'))};
    border-bottom: ${ruleWidth} solid ${c('field-rule', d('field-rule'))};
    border-radius: ${c('field-radius', d('field-radius'))};
    padding: ${c('field-padding-y', d('field-padding-y'))} ${c('field-padding-x', d('field-padding-x'))};
    background: ${c('field-bg', d('field-bg'))};
    color: ${t('text')};
    font-family: ${t('font-ui')};
    font-size: ${c('field-font-size', d('field-font-size'))};
    line-height: ${c('field-line-height', d('field-line-height'))};
    font-weight: 400;
    transition:
        border-color ${t('dur-fast')} ${t('ease-standard')},
        box-shadow ${t('dur-fast')} ${t('ease-standard')},
        background ${t('dur-fast')} ${t('ease-standard')};
    &::placeholder { color: ${t('text-muted')}; }
    &:focus-visible {
        outline: none;
        border-color: ${c('field-focus-border', d('field-focus-border'))};
        background: ${c('field-bg-focus', d('field-bg-focus'))};
        box-shadow: 0 0 0 ${c('field-focus-ring-width', d('field-focus-ring-width'))} ${c('field-focus-ring', d('field-focus-ring'))};
    }
    &[aria-invalid='true'] {
        border-color: ${c('field-invalid-border', d('field-invalid-border'))};
        border-bottom-color: ${c('field-invalid-rule', d('field-invalid-rule'))};
    }
    &[aria-invalid='true']:focus-visible {
        border-color: ${c('field-invalid-border', d('field-invalid-border'))};
        border-bottom-color: ${c('field-invalid-rule', d('field-invalid-rule'))};
        background: ${c('field-bg-focus', d('field-bg-focus'))};
        box-shadow: 0 0 0 ${c('field-focus-ring-width', d('field-focus-ring-width'))} ${c('field-invalid-ring', d('field-invalid-ring'))};
    }
`;

/**
 * Field label — the design system's "spärrade versaletiketter"
 * (Open Sans 700, 11/16, uppercase, .14em tracking).
 *
 * Labels are always visible and always above the field: §4.8 rejects floating
 * labels and placeholder-as-label outright.
 */
export const label = () => `
    display: block;
    font-family: ${t('font-ui')};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${t('text-muted')};
`;

/**
 * Validation text under a field.
 *
 * §4.8: the copy explains what is wrong AND how to fix it — "Tidpunkten har
 * redan passerat. Välj en tid efter i dag.", not "Ogiltigt datum". No
 * apologies.
 */
export const errorText = () => `
    display: block;
    font-family: ${t('font-ui')};
    font-size: 13px;
    line-height: 20px;
    color: ${t('danger')};
`;

/**
 * Card surface, plus the dashboard-card slots of design system §4.2.
 *
 * The base rules are unchanged, so every existing `card()` / `card({ hover })`
 * call site renders as before. The nested `.ui-card__*` rules are additive —
 * they only apply to markup that opts in by using those class names.
 *
 * A dashboard card carries one fact and exactly one link onward:
 *
 *   <article class="…card()…">
 *     <p class="ui-card__eyebrow">Väntar på feedback</p>
 *     <p class="ui-card__value">3</p>
 *     <p class="ui-card__meta">träningspass från 2 elever</p>
 *     <a class="ui-card__link" href="/inbox">Öppna inkorgen →</a>
 *   </article>
 *
 * Avoid charts on the dashboard, more than four cards, and more than one
 * action per card.
 */
export const card = (options?: { hover?: boolean }) => `
    background: ${t('surface')};
    border: 1px solid ${t('border')};
    border-radius: ${t('radius-md')};
    box-shadow: ${t('shadow-1')};
    ${options?.hover ? `
    transition:
        box-shadow ${t('dur-base')} ${t('ease-standard')},
        border-color ${t('dur-base')} ${t('ease-standard')};
    &:hover { box-shadow: ${t('shadow-2')}; }` : ''}
    & .ui-card__eyebrow {
        ${label()}
        margin: 0 0 ${s('sm')} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${t('font-ui')};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${t('text')};
    }
    & .ui-card__meta {
        margin: ${s('xs')} 0 0 0;
        font-family: ${t('font-ui')};
        font-size: 13px;
        line-height: 20px;
        color: ${t('text-muted')};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${s('md')};
        font-family: ${t('font-ui')};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${t('accent')};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;
