import { test, expect } from 'bun:test';
import { neutralLight, neutralDark } from './default-theme';

/*
 * The framework's recipes read design-system names directly — no
 * `var(--new, var(--legacy))` fallback arm — so a theme that omits one of these
 * renders that property as if it were never set: a borderless card, an
 * unstyled button. The default theme is the contract, and this is it in full.
 */
const DESIGN_SYSTEM_TOKENS = [
    'bg', 'surface', 'surface-2', 'text', 'text-muted', 'border', 'border-strong',
    'accent', 'accent-strong', 'accent-soft', 'on-accent',
    'success', 'success-soft', 'warning', 'warning-soft',
    'danger', 'danger-soft', 'on-danger', 'info', 'info-soft',
    'shadow-1', 'shadow-2', 'shadow-3',
    'radius-sm', 'radius-md', 'radius-pill',
    'dur-fast', 'dur-base', 'dur-slow', 'ease-standard',
    'font-ui', 'font-display',
    'space-1', 'space-2', 'space-3', 'space-4',
    'space-5', 'space-6', 'space-7', 'space-8',
];

test('default theme: both maps define every design-system token', () => {
    for (const name of DESIGN_SYSTEM_TOKENS) {
        expect(neutralLight[name]).toBeDefined();
        expect(neutralDark[name]).toBeDefined();
    }
});

test('default theme: light and dark define exactly the same names', () => {
    expect(Object.keys(neutralLight).sort()).toEqual(Object.keys(neutralDark).sort());
});

/*
 * The legacy vocabulary is kept as aliases, not as second definitions: obs/ and
 * older app CSS still read these names. Pointing each one at a design-system
 * token is what resolves the --accent / --surface collision once, centrally,
 * instead of every recipe guessing at read time.
 */
const LEGACY_ALIASES = [
    'primary', 'primary-text', 'btn-bg', 'btn-hover', 'input-bg', 'topbar-bg',
    'topbar-logo', 'active-bg', 'active-text', 'hover-bg', 'error', 'radius',
    'shadow', 'shadow-elevated',
];

test('default theme: legacy names survive as aliases onto design-system tokens', () => {
    for (const name of LEGACY_ALIASES) {
        expect(neutralLight[name]).toMatch(/^var\(--[a-z0-9-]+\)$/);
        expect(neutralDark[name]).toMatch(/^var\(--[a-z0-9-]+\)$/);
    }
});

/*
 * The two names that carried a different meaning in the legacy vocabulary. The
 * alias must point FROM the legacy name TO the design-system token, never the
 * other way round: legacy --accent was a decorative highlight and legacy
 * --surface was the card fill as opposed to --input-bg.
 */
test('default theme: the colliding legacy names alias onto the DS meaning', () => {
    for (const map of [neutralLight, neutralDark]) {
        expect(map['primary']).toBe('var(--accent)');
        expect(map['input-bg']).toBe('var(--surface)');
        // ...and the design-system names hold real values, not aliases.
        expect(map['accent']).toMatch(/^#/);
        expect(map['surface']).toMatch(/^#/);
    }
});

/*
 * `--accent-strong` is the hover fill for every primary button (css.ts,
 * confirm.ts). It was previously undefined in every framework theme, so hover
 * silently resolved to the base colour and no demo app had a hover state.
 */
test('default theme: accent-strong is a distinct colour from accent', () => {
    expect(neutralLight['accent-strong']).not.toBe(neutralLight['accent']);
    expect(neutralDark['accent-strong']).not.toBe(neutralDark['accent']);
});
