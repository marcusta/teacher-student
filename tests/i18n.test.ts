import { test, expect } from 'bun:test';
import { checkMessageParity } from '@basics/core/client/i18n';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

// Same check as `bun run check:i18n`, wired into `bun test` so CI catches drift.
test('i18n: sv and en catalogs are in key + placeholder parity', () => {
    expect(checkMessageParity(sv, en, { reference: 'sv', target: 'en' })).toEqual([]);
});

test('i18n: catalogs are flat, non-empty string maps', () => {
    for (const [name, catalog] of [['sv', sv], ['en', en]] as const) {
        const entries = Object.entries(catalog);
        expect(entries.length).toBeGreaterThan(0);
        for (const [key, value] of entries) {
            expect(typeof value, `${name}.${key} must be a string`).toBe('string');
            // trim(): a whitespace-only value has length > 0 but renders as nothing.
            expect(value.trim().length, `${name}.${key} must not be blank`).toBeGreaterThan(0);
        }
    }
});

test('i18n: Swedish nav copy is unchanged', () => {
    expect(sv['nav.home']).toBe('Hem');
    expect(sv['nav.invitations']).toBe('Inbjudningar');
    expect(sv['nav.students']).toBe('Mina elever');
    expect(sv['nav.library']).toBe('Bibliotek');
    expect(sv['nav.programs']).toBe('Program');
    expect(sv['nav.stable']).toBe('Hästar');
    expect(sv['nav.plans']).toBe('Planer');
    expect(sv['nav.goals']).toBe('Mål');
    expect(sv['nav.lessons']).toBe('Lektioner');
    expect(sv['nav.trainingSessions']).toBe('Träningspass');
    expect(sv['nav.inbox']).toBe('Inkorg');
});

test('i18n: Swedish day-scale copy follows the spec voice, not CLDR', () => {
    // UI_DECISIONS §4 / design spec §4.3 ("Alva · i går 19:32"): the authored
    // voice spells these with a space. CLDR renders 'igår' / 'imorgon'.
    expect(sv['relative.yesterday']).toBe('i går');
    expect(sv['relative.today']).toBe('i dag');
    expect(sv['relative.tomorrow']).toBe('i morgon');
    expect(en['relative.yesterday']).toBe('yesterday');
});

test('i18n: formatRelative renders the Swedish override, English unaffected', async () => {
    const { formatRelative, formatMonthBlock, formatMonthAbbrev } = await import('../web/i18n');
    const { setLocale } = await import('@basics/core/client/i18n');
    const now = new Date(2026, 6, 22, 12, 0);
    const norm = (v: string) => v.replace(/\s+/gu, ' ').trim();

    setLocale('sv');
    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('i går');
    expect(norm(formatRelative(new Date(2026, 6, 23, 9, 0), now))).toBe('i morgon');
    // §4.3 date block is fixed-width: 3 chars, even though sv CLDR says 'JULI'.
    expect(formatMonthBlock(new Date(2026, 6, 22))).toBe('JUL');
    expect(formatMonthAbbrev(new Date(2026, 6, 22))).toBe('JULI');

    setLocale('en');
    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('yesterday');
    expect(formatMonthBlock(new Date(2026, 6, 22))).toBe('JUL');
    setLocale('sv');
});
