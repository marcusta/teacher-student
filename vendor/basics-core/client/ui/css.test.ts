import { test, expect } from 'bun:test';
import { s, btn, input, label, errorText, card } from './css';
import { controlTokens, neutralLight, neutralDark } from '../default-theme';

const TIERS = ['primary', 'secondary', 'ghost', 'danger'] as const;

// ─── Scale ──────────────────────────────────────────────────────

test('s: maps onto the design system 4-based scale', () => {
    expect(s('xs')).toBe('0.25rem');
    expect(s('sm')).toBe('0.5rem');
    expect(s('md')).toBe('0.75rem');
    expect(s('lg')).toBe('1rem');
    expect(s('xl')).toBe('1.5rem');
    expect(s('2xl')).toBe('2rem');
    expect(s('3xl')).toBe('3rem');
    expect(s('4xl')).toBe('4rem');
});

// ─── input ──────────────────────────────────────────────────────

/*
 * The recipe is STRUCTURALLY NEUTRAL. It no longer decides what a field looks
 * like; it decides which properties a field has and reads each value from a
 * custom property. These tests assert the wiring, not a particular look — the
 * look is a theme's business and is asserted in default-theme.test.ts (for the
 * framework's neutral default) and in each app's own tests.
 */
test('input: every visual decision is a control token, not a literal', () => {
    const css = input();
    for (const token of [
        'field-border-width', 'field-border', 'field-rule', 'field-rule-width',
        'field-radius', 'field-padding-y', 'field-padding-x', 'field-bg',
        'field-font-size', 'field-line-height', 'field-focus-border',
        'field-bg-focus', 'field-focus-ring', 'field-focus-ring-width',
        'field-invalid-border', 'field-invalid-rule', 'field-invalid-ring',
    ]) {
        expect(css).toContain(`var(--${token},`);
    }
});

/*
 * The one number a field may not get from a token is the relationship between
 * its border and its rule. The bottom edge is max(border-width, rule-width) so
 * that the rule is an EXTRA rather than a replacement: --field-rule-width: 0
 * leaves an ordinary box with its bottom edge — and the 3:1 control boundary
 * WCAG 1.4.11 asks for — intact, instead of deleting it.
 */
test('input: the bottom edge is max(border, rule) so rule-width 0 is a plain box', () => {
    expect(input()).toContain(
        'border-bottom: max(var(--field-border-width, 1px), var(--field-rule-width, 0px))');
});

/*
 * Focus and invalid recolour; they never resize. The same width expression
 * appears in the base rule and nothing overrides a width in any state, so a
 * field cannot reflow when focused or invalidated.
 */
test('input: no state changes the box metrics, only the colours', () => {
    const css = input();
    const stateBlocks = css.slice(css.indexOf('&:focus-visible'));
    for (const metric of ['padding', 'border-width', 'border-bottom:', 'font-size', 'line-height']) {
        expect(stateBlocks).not.toContain(metric);
    }
});

test('input: error state hangs off aria-invalid, not a class', () => {
    expect(input()).toContain("&[aria-invalid='true']");
});

test('input: focus is a ring and never the OS outline', () => {
    const css = input();
    expect(css).toContain('&:focus-visible');
    expect(css).toContain('outline: none');
});

test('input: placeholder is styled but never the label', () => {
    expect(input()).toContain('&::placeholder');
});

// ─── btn ────────────────────────────────────────────────────────

test('btn: existing zero-arg call still works and is secondary', () => {
    const css = btn();
    expect(css).toContain('cursor: pointer');
    expect(css).toContain('var(--btn-secondary-bg,');
});

test('btn: the radius argument is still positional and still first', () => {
    expect(btn('50%')).toContain('border-radius: 50%');
    expect(btn(s('lg'))).toContain('border-radius: 1rem');
});

/* Passing no radius defers to the token, so a theme can set every button's
   radius at once instead of every call site passing the same argument. */
test('btn: omitting the radius defers to --btn-radius', () => {
    expect(btn()).toContain('border-radius: var(--btn-radius,');
});

/*
 * A tier is a JOB — which action the button performs — and carries no
 * appearance of its own. Each tier reads the same six properties, so a project
 * decides for itself whether its destructive button is filled or outlined and
 * whether its secondary competes with its primary.
 */
test('btn: each tier is six control tokens and nothing hardcoded', () => {
    for (const variant of TIERS) {
        const css = btn(undefined, variant);
        for (const part of ['bg', 'fg', 'border', 'bg-hover', 'fg-hover', 'border-hover']) {
            expect(css).toContain(`var(--btn-${variant}-${part},`);
        }
    }
});

test('btn: shared metrics and focus ring are tokens too', () => {
    const css = btn(undefined, 'primary');
    for (const token of [
        'btn-border-width', 'btn-padding-y', 'btn-padding-x', 'btn-font-size',
        'btn-line-height', 'btn-font-weight', 'btn-focus-ring', 'btn-focus-ring-width',
    ]) {
        expect(css).toContain(`var(--${token},`);
    }
});

/* Every tier keeps the same border width, so swapping tiers recolours the box
   without resizing it. */
test('btn: every tier carries the same border width and padding', () => {
    for (const variant of TIERS) {
        const css = btn(undefined, variant);
        expect(css).toContain('border: var(--btn-border-width, 1px) solid');
        expect(css).toContain('padding: var(--btn-padding-y,');
    }
});

test('btn: focus is a ring on every tier and never the OS outline', () => {
    for (const variant of TIERS) {
        const css = btn(undefined, variant);
        expect(css).toContain('outline: none');
        expect(css).toContain('box-shadow: 0 0 0 var(--btn-focus-ring-width,');
    }
});

test('btn: disabled is muted and not clickable', () => {
    const css = btn(undefined, 'disabled');
    expect(css).toContain('cursor: not-allowed');
    expect(css).toContain('var(--btn-disabled-fg,');
    expect(css).toContain('var(--btn-disabled-opacity,');
});

test('btn: every variant also covers the :disabled state', () => {
    for (const variant of TIERS) {
        expect(btn(undefined, variant)).toContain('&:disabled {');
    }
});

test('btn: the five variants are distinct', () => {
    const all = [...TIERS, 'disabled'] as const;
    const rendered = all.map(v => btn(undefined, v));
    expect(new Set(rendered).size).toBe(all.length);
});

// ─── label ──────────────────────────────────────────────────────

/*
 * §02 / §4.8: "spärrade versaletiketter" — Open Sans 700, 11/16, uppercase,
 * .14em tracking.
 */
test('label: letterspaced uppercase, to spec', () => {
    const css = label();
    expect(css).toContain('text-transform: uppercase');
    expect(css).toContain('letter-spacing: 0.14em');
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('font-size: 11px');
    expect(css).toContain('line-height: 16px');
});

// ─── errorText ──────────────────────────────────────────────────

test('errorText: uses the danger token at small-text size', () => {
    const css = errorText();
    expect(css).toContain('color: var(--danger)');
    expect(css).toContain('font-size: 13px');
    expect(css).toContain('line-height: 20px');
});

// ─── card ───────────────────────────────────────────────────────

test('card: base surface is unchanged for existing callers', () => {
    const css = card();
    expect(css).toContain('background: var(--surface)');
    expect(css).toContain('border: 1px solid var(--border)');
    expect(css).toContain('border-radius: var(--radius-md)');
    expect(css).toContain('box-shadow: var(--shadow-1)');
});

test('card: hover option still adds the elevation transition', () => {
    expect(card({ hover: true })).toContain('&:hover { box-shadow: var(--shadow-2)');
    expect(card({ hover: false })).not.toContain('&:hover { box-shadow');
    expect(card()).not.toContain('&:hover { box-shadow');
});

// §4.2: eyebrow, one large value, meta, and a single link onward.
test('card: provides the dashboard-card slots', () => {
    const css = card();
    expect(css).toContain('.ui-card__eyebrow');
    expect(css).toContain('.ui-card__value');
    expect(css).toContain('.ui-card__meta');
    expect(css).toContain('.ui-card__link');
});

test('card: the eyebrow is the letterspaced label treatment', () => {
    expect(card()).toContain('letter-spacing: 0.14em');
});

/*
 * §4.2 and §02: big numbers stay in Open Sans with lining figures — the serif
 * is not allowed to carry a value.
 */
test('card: the value uses the UI font with tabular numerals', () => {
    const css = card();
    const start = css.indexOf('.ui-card__value');
    const rule = css.slice(start, css.indexOf('}', start));
    expect(rule).toContain('font-variant-numeric: tabular-nums');
    expect(rule).toContain('var(--font-ui)');
    expect(rule).not.toContain('font-display');
});

// ─── Regression guard: no app's look may leak into the shared layer ──────

/**
 * WHY THIS SECTION EXISTS.
 *
 * `input()` and `btn()` once hardcoded one product's editorial choices — a 2px
 * "logbook" bottom rule, a --bg recessed fill, 10/12 padding, 14/21 type, an
 * outline-until-hover destructive button. The tell was that eight files across
 * the three demo apps had to change to absorb it: two theme rewrites, two
 * re-exports and four components that wrapped a form in a card() purely so the
 * recessed field would still be visible.
 *
 * That is the signal to watch for. A change to a shared component that forces
 * every consumer to adapt did not belong in the shared layer, and nothing was
 * asserting it. These tests assert it.
 */

/** Resolve var(--x[, fallback]) against a token map, to a fixpoint. */
const resolve = (css: string, tokens: Record<string, string>): string => {
    let out = css;
    for (let i = 0; i < 30; i++) {
        const next = out.replace(
            /var\(\s*--([a-z0-9-]+)\s*(?:,([^()]*(?:\([^()]*\)[^()]*)*))?\)/gi,
            (_whole, name: string, fb?: string) =>
                tokens[name] ?? (fb !== undefined ? fb.trim() : `UNRESOLVED(--${name})`));
        if (next === out) return out;
        out = next;
    }
    return out;
};

const everyRecipe = () => [input(), ...TIERS.map(v => btn(undefined, v)), btn(undefined, 'disabled')].join('\n');

/**
 * A theme with the design-system PALETTE but not one control token — exactly
 * the position apps/stable and apps/starter are in, since both define their
 * own palettes rather than spreading neutralLight/neutralDark.
 *
 * Built by stripping the control tokens back out of the neutral theme, so it
 * cannot drift as tokens are added.
 */
const paletteOnly = (): Record<string, string> => {
    const out = { ...neutralLight };
    for (const name of Object.keys(controlTokens)) delete out[name];
    return out;
};

/*
 * THE CORE GUARD. An app that has adopted none of the control tokens must
 * still get a complete, fully-styled control from the neutral defaults alone.
 * If a value ever goes missing here, a recipe has started depending on
 * something only one app defines — which is how the leak happened.
 */
test('guard: neutral defaults alone render a complete control', () => {
    const resolved = resolve(everyRecipe(), paletteOnly());
    expect(resolved).not.toContain('UNRESOLVED');

    // No declaration may resolve to nothing.
    for (const [, prop, value] of resolved.matchAll(/([a-z-]+):\s*([^;{}]*)/g)) {
        expect({ prop, value: value!.trim() }).toEqual({ prop, value: expect.any(String) });
        expect(value!.trim().length).toBeGreaterThan(0);
    }
});

/*
 * The same recipes resolved against a theme that HAS adopted the control
 * tokens must render identically to the fallback path. The fallback arms are
 * read from controlTokens rather than spelled out inline precisely so these two
 * paths cannot diverge; this proves the wiring actually holds.
 */
test('guard: the token path and the fallback path agree exactly', () => {
    const withTokens = resolve(everyRecipe(), neutralLight);
    const viaFallback = resolve(everyRecipe(), paletteOnly());
    expect(viaFallback).toBe(withTokens);
});

test('guard: the neutral default is neutral — uniform box, filled danger', () => {
    // A uniform 1px box: no weighted rule, and a fill that shows on any parent.
    expect(controlTokens['field-rule-width']).toBe('0px');
    expect(controlTokens['field-border-width']).toBe('1px');
    expect(controlTokens['field-bg']).toBe('var(--surface)');

    /*
     * The uniform box carries its own 3:1 control edge (WCAG 1.4.11), so the
     * neutral boundary is --border-strong and not the decorative --border
     * hairline — the hairline measures 1.2–1.9:1 against the demo pages. A
     * theme that carries the edge on a weighted rule instead overrides this.
     */
    expect(controlTokens['field-border']).toBe('var(--border-strong)');

    // A FILLED destructive button. Outline-until-hover is an editorial choice
    // and must be a theme's to make, not the framework's to impose.
    expect(controlTokens['btn-danger-bg']).toBe('var(--danger)');
    expect(controlTokens['btn-danger-fg']).toBe('var(--on-danger)');

    // Filled tiers generally — a tier is legible before it is hovered.
    for (const tier of ['primary', 'secondary', 'danger'] as const) {
        expect(controlTokens[`btn-${tier}-bg`]).not.toBe('transparent');
    }
});

/*
 * The specific values that leaked, named so they cannot come back. Each is a
 * real editorial decision from the teacher-student design system; each now
 * lives in that app's own theme.
 */
test('guard: no consuming app\'s editorial values are hardcoded in the recipes', () => {
    const all = everyRecipe();

    // Metrics: 9x20 buttons at 13/20, 10x12 fields at 14/21, a 2px rule.
    for (const literal of [
        'padding: 9px 20px', 'padding: 10px 12px',
        'font-size: 13px', 'font-size: 14px',
        'line-height: 20px', 'line-height: 21px',
        'font-weight: 600', 'border-bottom: 2px',
    ]) {
        expect(all).not.toContain(literal);
    }

    // Colour decisions: a recessed --bg fill, and tier skins painted straight
    // from the palette instead of through a --btn-* property.
    expect(all).not.toContain('background: var(--bg)');
    for (const palette of ['accent', 'accent-strong', 'accent-soft', 'danger', 'surface-2', 'border-strong']) {
        expect(all).not.toContain(`background: var(--${palette})`);
        expect(all).not.toContain(`border-color: var(--${palette})`);
    }
});

/*
 * The neutral defaults must resolve through the palette rather than restating
 * colours, so that an app which overrides only its palette gets controls in its
 * own brand without touching a single control token.
 */
test('guard: neutral control colours are palette references, never literals', () => {
    for (const [name, value] of Object.entries(controlTokens)) {
        const isColour = /-(bg|fg|border|rule|ring|shadow)(-hover|-focus)?$/.test(name)
            && !name.includes('width');
        if (!isColour) continue;
        if (value === 'transparent' || value === 'none') continue;
        expect({ name, value }).toEqual({ name, value: expect.stringContaining('var(--') });
    }
});

test('guard: both neutral themes carry the full control vocabulary', () => {
    for (const theme of [neutralLight, neutralDark]) {
        for (const name of Object.keys(controlTokens)) {
            expect(theme[name]).toBe(controlTokens[name]!);
        }
    }
});

// ─── Token migration ──
// ─── Token migration ────────────────────────────────────────────

/**
 * Legacy names are gone from the recipes — not demoted to the fallback arm of
 * `var(--new, var(--legacy))`, removed.
 *
 * Note the asymmetry with the `--field-*` / `--btn-*` fallbacks above, which
 * ARE safe. `var()` cannot ask whether a token carries the intended meaning,
 * only whether it is defined, so a chain is sound exactly when the fallback
 * name was never used for something else. The control tokens are new names no
 * vocabulary has ever used. These legacy names are not: `--accent` meant a
 * decorative highlight (apps/stable set it to coral while its action colour was
 * `--primary`, so a chain painted the primary button coral at 2.59:1) and
 * `--surface` meant the panel fill as distinct from `--input-bg`.
 */
const references = (css: string, name: string): boolean =>
    new RegExp(`var\\(--${name}[,)]`).test(css);

test('recipes: legacy token names are gone entirely', () => {
    const all = [everyRecipe(), label(), errorText(), card({ hover: true })].join('\n');

    for (const legacy of [
        'radius', 'shadow', 'shadow-elevated', 'btn-bg', 'btn-hover',
        'primary', 'primary-text', 'hover-bg', 'error', 'input-bg',
    ]) {
        expect(references(all, legacy)).toBe(false);
    }
});

/**
 * card() still references the two colliding names directly, and must keep
 * doing so plainly rather than through a chain in either direction. The
 * collision is resolved once in the theme, where a legacy-vocabulary app
 * aliases its old names onto the design-system tokens.
 */
test('recipes: the two colliding names are referenced plainly, never chained', () => {
    const all = [everyRecipe(), label(), errorText(), card({ hover: true })].join('\n');
    expect(all).not.toContain('var(--accent,');
    expect(all).not.toContain('var(--surface,');
    expect(all).not.toContain('var(--primary');
    expect(card()).toContain('background: var(--surface)');
});
