import { test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Component, effect, template } from './core';
import {
    registerMessages, setFallbackLocale, resetMessages, locales,
    getLocale, setLocale, t, plural, capitalize,
    formatDate, formatTimeRange, formatMonthAbbrev, formatMonthBlock, formatIsoDate, formatRelative,
    checkMessageParity, Locale, setLocaleAutoDetect,
} from './i18n';

const sv = {
    'nav.home': 'Hem',
    'notes.sharedWith': 'Delad: {name}',
    'notes.count.zero': 'inga anteckningar',
    'notes.count.one': '{count} anteckning',
    'notes.count.other': '{count} anteckningar',
    'goals.progress': '{done} av {total} delmål',
    'weekday.long': 'onsdag',
};

const en = {
    'nav.home': 'Home',
    'notes.sharedWith': 'Shared with: {name}',
    'notes.count.zero': 'no notes',
    'notes.count.one': '{count} note',
    'notes.count.other': '{count} notes',
    'goals.progress': '{done} of {total} sub-goals',
    'weekday.long': 'wednesday',
};

beforeEach(() => {
    resetMessages();
    registerMessages('sv', sv);
    registerMessages('en', en);
    setFallbackLocale('sv');
    setLocale('sv');
});

afterEach(() => {
    resetMessages();
});

// --- Lookup ---

test('t: returns the message for the active locale', () => {
    expect(t('nav.home')).toBe('Hem');
    setLocale('en');
    expect(t('nav.home')).toBe('Home');
});

test('t: falls back to the fallback locale when the key is absent', () => {
    registerMessages('de', { 'nav.other': 'Anderes' });
    setLocale('de');
    expect(t('nav.home')).toBe('Hem');
});

test('t: missing key returns the key itself and warns once', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
});

test('t: the warn-once throttle is per key, not global', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    t('missing.one');
    t('missing.one');
    t('missing.two');
    t('missing.three');
    t('missing.two');
    expect(warn, 'each distinct key must warn exactly once').toHaveBeenCalledTimes(3);
    warn.mockRestore();
});

test('t: falls back to the fallback locale BEFORE reporting a key as missing', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    registerMessages('de', {});
    setLocale('de');
    expect(t('nav.home')).toBe('Hem');
    expect(warn, 'a key resolvable via fallback is not missing').not.toHaveBeenCalled();
    warn.mockRestore();
});

test('locales: lists registered catalogs', () => {
    expect(locales().sort()).toEqual(['en', 'sv']);
});

// --- Interpolation ---

test('t: interpolates {name} placeholders', () => {
    expect(t('notes.sharedWith', { name: 'Anna' })).toBe('Delad: Anna');
});

test('t: interpolates multiple placeholders and coerces numbers', () => {
    expect(t('goals.progress', { done: 3, total: 5 })).toBe('3 av 5 delmål');
});

test('t: leaves unknown placeholders untouched', () => {
    expect(t('notes.sharedWith')).toBe('Delad: {name}');
    expect(t('notes.sharedWith', { other: 'x' })).toBe('Delad: {name}');
});

// --- Plurals ---

test('plural: selects one/other via Intl.PluralRules', () => {
    expect(plural('notes.count', 1)).toBe('1 anteckning');
    expect(plural('notes.count', 2)).toBe('2 anteckningar');
});

test('plural: explicit zero form wins at count 0', () => {
    expect(plural('notes.count', 0)).toBe('inga anteckningar');
});

test('plural: falls back to other when no zero form exists', () => {
    registerMessages('sv', { 'sessions.count.one': '{count} pass', 'sessions.count.other': '{count} pass' });
    expect(plural('sessions.count', 0)).toBe('0 pass');
});

test('plural: count is available without passing it', () => {
    setLocale('en');
    expect(plural('notes.count', 3)).toBe('3 notes');
});

test('plural: extra params merge with count', () => {
    registerMessages('sv', { 'feedback.pending.other': 'Väntar på feedback: {count} träningspass från {students} elever' });
    expect(plural('feedback.pending', 3, { students: 2 })).toBe(
        'Väntar på feedback: 3 träningspass från 2 elever'
    );
});

test('plural: missing form returns the suffixed key and warns', () => {
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    expect(plural('nope.count', 1)).toBe('nope.count.one');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
});

test('plural: richer CLDR category sets are not broken by the zero override', () => {
    // Only sv/en ship, but the design must not assume a two-category world.
    // Polish: 1 one, 2 few, 5 many, 0 many.
    registerMessages('pl', {
        'items.one': '{count} rzecz',
        'items.few': '{count} rzeczy',
        'items.many': '{count} rzeczy (many)',
        'items.other': '{count} rzeczy (other)',
    });
    setFallbackLocale('pl');
    setLocale('pl');
    expect(plural('items', 1)).toBe('1 rzecz');
    expect(plural('items', 2)).toBe('2 rzeczy');
    expect(plural('items', 5)).toBe('5 rzeczy (many)');
    // No .zero defined, so 0 follows CLDR ('many' in Polish), not 'other'.
    expect(plural('items', 0)).toBe('0 rzeczy (many)');

    // An explicit .zero override still wins over the CLDR category.
    registerMessages('pl', { 'items.zero': 'brak rzeczy' });
    expect(plural('items', 0)).toBe('brak rzeczy');
});

test('plural: zero override is used only at count 0', () => {
    expect(plural('notes.count', 0)).toBe('inga anteckningar');
    expect(plural('notes.count', 1)).toBe('1 anteckning');
    expect(plural('notes.count', 2)).toBe('2 anteckningar');
});

// --- capitalize ---

test('capitalize: upper-cases the first character', () => {
    expect(capitalize(t('weekday.long'))).toBe('Onsdag');
    expect(capitalize('')).toBe('');
});

// --- Reactivity ---

test('locale switch re-runs effects that read t()', () => {
    const seen: string[] = [];
    const dispose = effect(() => { seen.push(t('nav.home')); });
    expect(seen).toEqual(['Hem']);

    setLocale('en');
    expect(seen).toEqual(['Hem', 'Home']);

    setLocale('sv');
    expect(seen).toEqual(['Hem', 'Home', 'Hem']);
    dispose();
});

test('locale switch re-runs effects that read plural() and formatDate()', () => {
    const seen: string[] = [];
    const dispose = effect(() => {
        seen.push(plural('notes.count', 2) + ' / ' + formatDate(new Date(2026, 6, 22), { month: 'long' }));
    });
    expect(seen[0]).toBe('2 anteckningar / juli');

    setLocale('en');
    expect(seen[1]).toBe('2 notes / July');
    dispose();
});

test('locale switch re-renders a mounted component wired with t()', () => {
    // Mirrors how app components bind copy: a `() => t(key)` inside wire().
    const tpl = template('<nav><a bind="home"></a><span bind="shared"></span></nav>');

    class NavProbe extends Component {
        render(): DocumentFragment {
            return this.wire(tpl, {
                home: { textContent: () => t('nav.home') },
                shared: () => t('notes.sharedWith', { name: 'Anna' }),
            });
        }
    }

    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    const comp = new NavProbe();
    comp.mount(host);

    expect(host.querySelector('a')!.textContent).toBe('Hem');
    expect(host.querySelector('span')!.textContent).toBe('Delad: Anna');

    setLocale('en');
    expect(host.querySelector('a')!.textContent).toBe('Home');
    expect(host.querySelector('span')!.textContent).toBe('Shared with: Anna');

    comp.destroy();
});

test('locale switch: components mounted before and after behave identically', () => {
    const tpl = template('<div><span bind="label"></span></div>');
    let renders = 0;
    class Probe extends Component {
        render(): DocumentFragment {
            return this.wire(tpl, { label: { textContent: () => { renders++; return t('nav.home'); } } });
        }
    }
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';

    const before = new Probe();
    before.mount(document.getElementById('a')!);
    setLocale('en');

    const after = new Probe();
    after.mount(document.getElementById('b')!);

    const textOf = (id: string) => document.getElementById(id)!.querySelector('span')!.textContent;
    expect(textOf('a')).toBe('Home');
    expect(textOf('b')).toBe('Home');

    setLocale('sv');
    expect(textOf('a')).toBe('Hem');
    expect(textOf('b')).toBe('Hem');

    // Each binding re-runs exactly once per switch — no double-subscribe. The
    // effect re-registers its deps on every run (runTracked tears down first),
    // so repeated switches must not compound.
    renders = 0;
    setLocale('en');
    expect(renders).toBe(2);
    setLocale('sv');
    expect(renders).toBe(4);

    before.destroy();
    after.destroy();
});

test('locale switch: a destroyed component stops re-rendering (no effect leak)', () => {
    const tpl = template('<div><span bind="label"></span></div>');
    let renders = 0;
    class Probe extends Component {
        render(): DocumentFragment {
            return this.wire(tpl, { label: { textContent: () => { renders++; return t('nav.home'); } } });
        }
    }
    document.body.innerHTML = '<div id="host"></div>';
    const comp = new Probe();
    comp.mount(document.getElementById('host')!);

    setLocale('en');
    const afterSwitch = renders;
    comp.destroy();

    setLocale('sv');
    setLocale('en');
    expect(renders, 'destroyed component must not react to later switches').toBe(afterSwitch);
});

test('getLocale: reflects the active locale', () => {
    expect(getLocale()).toBe('sv');
    setLocale('en');
    expect(getLocale()).toBe('en');
});

// --- Dates ---

/**
 * Collapse every Unicode space separator to a plain ASCII space.
 *
 * Intl separates a number from its unit with whatever space ICU's current data
 * prescribes: U+00A0 (no-break) and U+202F (narrow no-break) BOTH occur, and
 * which one appears varies by ICU/Bun version and even between units in the
 * same locale — at the time of writing sv gives 'om 5 min' but
 * 'för 15 min sen' with an ordinary space. Asserting those bytes verbatim
 * yields tests that pass today and fail on the next runtime bump, showing a
 * diff of two strings that look character-for-character identical.
 *
 * Every assertion on Intl output therefore goes through this helper. It still
 * pins the words, the numbers and their order — it just stops pinning ICU's
 * choice of space character, which was never this suite's to specify.
 */
const norm = (value: string): string => value.replace(/\s+/gu, ' ').trim();

const wednesday = new Date(2026, 6, 22, 17, 0);

test('formatDate: day of month', () => {
    expect(formatDate(wednesday, { day: 'numeric' })).toBe('22');
});

test('formatDate: clock time', () => {
    expect(formatDate(wednesday, { hour: '2-digit', minute: '2-digit' })).toBe('17:00');
});

test('formatDate: long weekday with day and month', () => {
    expect(norm(capitalize(formatDate(wednesday, { weekday: 'long', day: 'numeric', month: 'long' }))))
        .toBe('Onsdag 22 juli');
});

test('formatDate: note timestamp', () => {
    const noted = new Date(2026, 6, 14, 19, 4);
    expect(norm(formatDate(noted, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })))
        .toBe('14 juli 19:04');
});

test('formatDate: accepts ISO strings and epoch millis', () => {
    expect(formatDate(wednesday.toISOString(), { day: 'numeric' })).toBe('22');
    expect(formatDate(wednesday.getTime(), { day: 'numeric' })).toBe('22');
});

test('formatMonthAbbrev: uppercase short month without trailing dot', () => {
    expect(formatMonthAbbrev(wednesday)).toBe('JULI');
    setLocale('en');
    expect(formatMonthAbbrev(wednesday)).toBe('JUL');
    expect(formatMonthAbbrev(new Date(2026, 8, 1))).toBe('SEP');
});

test('formatMonthBlock: truncates to three characters for the fixed-width block', () => {
    expect(formatMonthBlock(wednesday)).toBe('JUL');
    setLocale('en');
    expect(formatMonthBlock(wednesday)).toBe('JUL');
});

test('formatMonthBlock: every sv and en month is exactly 3 chars and stays distinct', () => {
    // The truncation must not corrupt or collide any month in either locale —
    // sv 'MARS'→'MAR', 'JUNI'→'JUN', 'JULI'→'JUL'; en 'MAY' must survive intact.
    for (const [locale, expected] of [
        ['sv', ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC']],
        ['en', ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']],
    ] as const) {
        setLocale(locale);
        const actual = expected.map((_, month) => formatMonthBlock(new Date(2026, month, 15)));
        expect(actual, `${locale} month blocks`).toEqual([...expected]);
        expect(new Set(actual).size, `${locale} months must stay distinct`).toBe(12);
    }
});

test('formatMonthAbbrev: stays CLDR-correct and is NOT truncated', () => {
    // The date-block truncation is a separate concern; the general helper must
    // keep rendering the locale's real short month.
    expect(formatMonthAbbrev(wednesday)).toBe('JULI');
    expect(formatMonthAbbrev(new Date(2026, 2, 15))).toBe('MARS');
});

test('formatTimeRange: renders a locale-correct range', () => {
    const range = formatTimeRange(wednesday, new Date(2026, 6, 22, 18, 0));
    expect(range).toMatch(/^17:00.*18:00$/);
});

test('formatIsoDate: renders YYYY-MM-DD independent of locale', () => {
    expect(formatIsoDate(new Date(2026, 6, 14))).toBe('2026-07-14');
    setLocale('en');
    expect(formatIsoDate(new Date(2026, 6, 14))).toBe('2026-07-14');
    expect(formatIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
});

// --- Relative time ---

const now = new Date(2026, 6, 22, 12, 0);

test('formatRelative: seconds', () => {
    expect(formatRelative(new Date(2026, 6, 22, 11, 59, 30), now)).toContain('30');
});

test('formatRelative: minutes use the short unit', () => {
    expect(norm(formatRelative(new Date(2026, 6, 22, 11, 45), now))).toBe('för 15 min sen');
});

test('formatRelative: hours use the short unit', () => {
    expect(norm(formatRelative(new Date(2026, 6, 22, 10, 0), now))).toBe('för 2 tim sedan');
});

test('formatRelative: yesterday uses numeric:auto wording', () => {
    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('igår');
});

test('formatRelative: mid-week days stay numeric, not "i måndags"', () => {
    const result = norm(formatRelative(new Date(2026, 6, 19, 9, 0), now));
    expect(result).toBe('för 3 dagar sedan');
    expect(result).not.toContain('måndags');
});

test('formatRelative: beyond 7 days switches to an absolute date', () => {
    expect(norm(formatRelative(new Date(2026, 6, 14, 9, 0), now))).toBe('14 juli');
});

test('formatRelative: a different year includes the year', () => {
    expect(norm(formatRelative(new Date(2025, 6, 14, 9, 0), now))).toBe('14 juli 2025');
});

test('formatRelative: future times', () => {
    expect(norm(formatRelative(new Date(2026, 6, 22, 12, 5), now))).toBe('om 5 min');
    expect(norm(formatRelative(new Date(2026, 6, 23, 9, 0), now))).toBe('imorgon');
});

test('formatRelative: a catalog override replaces the CLDR day-scale wording', () => {
    // CLDR sv says 'igår'; an app whose authored voice wants 'i går' says so in
    // its catalog. The override is a lookup, never a replace() on Intl output.
    registerMessages('sv', { 'relative.yesterday': 'i går', 'relative.tomorrow': 'i morgon' });
    registerMessages('en', { 'relative.yesterday': 'yesterday', 'relative.tomorrow': 'tomorrow' });

    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('i går');
    expect(norm(formatRelative(new Date(2026, 6, 23, 9, 0), now))).toBe('i morgon');
});

test('formatRelative: a sv override does not leak into English', () => {
    // Lookups fall back to the fallback locale (sv here), so if only sv defined
    // these keys English would silently render 'i går'. en must define them —
    // and the parity check is what guarantees it does.
    registerMessages('sv', { 'relative.yesterday': 'i går' });
    registerMessages('en', { 'relative.yesterday': 'yesterday' });
    setLocale('en');
    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('yesterday');
});

test('formatRelative: overrides do not touch days 2-6 or the clock scale', () => {
    registerMessages('sv', { 'relative.yesterday': 'i går' });
    expect(norm(formatRelative(new Date(2026, 6, 19, 9, 0), now))).toBe('för 3 dagar sedan');
    expect(norm(formatRelative(new Date(2026, 6, 22, 10, 0), now))).toBe('för 2 tim sedan');
});

test('formatRelative: without overrides the CLDR wording still stands', () => {
    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('igår');
});

test('formatRelative: follows the active locale', () => {
    setLocale('en');
    expect(norm(formatRelative(new Date(2026, 6, 21, 9, 0), now))).toBe('yesterday');
});

// --- Parity ---

test('checkMessageParity: reports nothing for matching catalogs', () => {
    expect(checkMessageParity(sv, en, { reference: 'sv', target: 'en' })).toEqual([]);
});

test('checkMessageParity: reports keys missing from the target', () => {
    const { 'nav.home': _dropped, ...partial } = en;
    const problems = checkMessageParity(sv, partial, { reference: 'sv', target: 'en' });
    expect(problems).toEqual(['missing in en: nav.home']);
});

test('checkMessageParity: reports keys the target has and the reference lacks', () => {
    const problems = checkMessageParity(sv, { ...en, 'nav.extra': 'Extra' }, { reference: 'sv', target: 'en' });
    expect(problems).toEqual(['extra in en (not in sv): nav.extra']);
});

test('checkMessageParity: reports an empty-string value', () => {
    // The most invisible drift there is: key sets match, screen shows nothing.
    const problems = checkMessageParity(sv, { ...en, 'nav.home': '' }, { reference: 'sv', target: 'en' });
    expect(problems).toEqual(['blank value in en: nav.home']);
});

test('checkMessageParity: treats a whitespace-only value as blank', () => {
    const problems = checkMessageParity(sv, { ...en, 'nav.home': '   ' }, { reference: 'sv', target: 'en' });
    expect(problems).toEqual(['blank value in en: nav.home']);
});

test('checkMessageParity: reports a blank value in the reference too', () => {
    const problems = checkMessageParity({ ...sv, 'nav.home': '' }, en, { reference: 'sv', target: 'en' });
    expect(problems).toEqual(['blank value in sv: nav.home']);
});

test('checkMessageParity: catches a plural suffix present in only one catalog', () => {
    const problems = checkMessageParity(
        { 'x.one': '{count} sak', 'x.other': '{count} saker' },
        { 'x.other': '{count} things' },
        { reference: 'sv', target: 'en' }
    );
    expect(problems).toEqual(['missing in en: x.one']);
});

test('checkMessageParity: counts repeated placeholders, not just the set', () => {
    const problems = checkMessageParity(
        { 'a': '{name} och {name}' },
        { 'a': '{name}' },
        { reference: 'sv', target: 'en' }
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('placeholder mismatch: a');
});

test('checkMessageParity: reports placeholder-set mismatches', () => {
    const problems = checkMessageParity(
        sv,
        { ...en, 'notes.sharedWith': 'Shared' },
        { reference: 'sv', target: 'en' }
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('placeholder mismatch: notes.sharedWith');
    expect(problems[0]).toContain('sv has {name}');
});

// --- Locale service ---

test('Locale: seeds from localStorage when the stored locale is registered', () => {
    localStorage.setItem('basics-js-locale', 'en');
    const locale = new Locale();
    expect(locale.code.get()).toBe('en');
    expect(getLocale()).toBe('en');
    localStorage.removeItem('basics-js-locale');
});

/** Run `fn` with a stubbed navigator.language, restoring it afterwards. */
function withNavigatorLanguage(value: string, fn: () => void): void {
    const original = navigator.language;
    Object.defineProperty(navigator, 'language', { value, configurable: true });
    try { fn(); } finally {
        Object.defineProperty(navigator, 'language', { value: original, configurable: true });
    }
}

// Precedence: stored choice → navigator.language (opt-in only) → product fallback.

test('Locale: ignores navigator.language by default — the product fallback wins', () => {
    localStorage.removeItem('basics-js-locale');
    withNavigatorLanguage('en-GB', () => {
        expect(new Locale().code.get()).toBe('sv');
    });
});

test('Locale: seeds from navigator.language once auto-detect is enabled, matching on the language subtag', () => {
    localStorage.removeItem('basics-js-locale');
    setLocaleAutoDetect(true);
    withNavigatorLanguage('en-GB', () => {
        expect(new Locale().code.get()).toBe('en');
    });
    setLocaleAutoDetect(false);
});

test('Locale: a stored choice outranks navigator.language even with auto-detect on', () => {
    localStorage.setItem('basics-js-locale', 'sv');
    setLocaleAutoDetect(true);
    withNavigatorLanguage('en-GB', () => {
        expect(new Locale().code.get()).toBe('sv');
    });
    setLocaleAutoDetect(false);
    localStorage.removeItem('basics-js-locale');
});

test('Locale: falls back when auto-detect is on but nothing matches', () => {
    localStorage.removeItem('basics-js-locale');
    setLocaleAutoDetect(true);
    withNavigatorLanguage('ja-JP', () => {
        expect(new Locale().code.get()).toBe('sv');
    });
    setLocaleAutoDetect(false);
});

test('Locale: an unregistered stored locale is ignored, not trusted', () => {
    localStorage.setItem('basics-js-locale', 'ja');
    withNavigatorLanguage('ja-JP', () => {
        expect(new Locale().code.get()).toBe('sv');
    });
    localStorage.removeItem('basics-js-locale');
});

test('Locale: set() persists, updates <html lang> and drives t()', () => {
    localStorage.removeItem('basics-js-locale');
    const locale = new Locale();
    locale.set('en');
    expect(t('nav.home')).toBe('Home');
    expect(localStorage.getItem('basics-js-locale')).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    localStorage.removeItem('basics-js-locale');
});

/**
 * Construction must NOT write its seed back. A stored value has to mean "someone
 * picked this" — if the first page view persisted the fallback, rule 1 of the
 * precedence would thereafter match a value nobody chose, and rules 2 and 3
 * would be unreachable for every returning visitor.
 */
test('Locale: construction does not persist the seed it derived', () => {
    localStorage.removeItem('basics-js-locale');
    withNavigatorLanguage('en-GB', () => { new Locale(); });
    expect(localStorage.getItem('basics-js-locale'),
        'a seed nobody chose must not masquerade as a stored choice').toBeNull();
});

test('Locale: enabling auto-detect later still reaches an untouched visitor', () => {
    // The regression this guards: v1 ships without auto-detect and the visitor's
    // first load writes 'sv'; v2 turns auto-detect on and it does nothing at all,
    // because the seed is now indistinguishable from an explicit preference.
    localStorage.removeItem('basics-js-locale');
    withNavigatorLanguage('en-GB', () => {
        expect(new Locale().code.get()).toBe('sv');

        setLocaleAutoDetect(true);
        expect(new Locale().code.get(),
            'the earlier visit must not have poisoned the stored preference').toBe('en');
        setLocaleAutoDetect(false);
    });
});

test('Locale: an explicit choice still survives a later auto-detect rollout', () => {
    // The other half of the same contract: once someone HAS picked, that wins.
    localStorage.removeItem('basics-js-locale');
    withNavigatorLanguage('en-GB', () => {
        new Locale().set('sv');
        setLocaleAutoDetect(true);
        expect(new Locale().code.get()).toBe('sv');
        setLocaleAutoDetect(false);
    });
    localStorage.removeItem('basics-js-locale');
});

/**
 * Guards the reset itself, not just the behaviour it enables. Every auto-detect
 * test above also clears the flag by hand, so without this case `resetMessages`
 * could stop resetting it and the whole suite would still pass — leaving the
 * next test author's state leak to be found at random.
 */
test('resetMessages: clears the auto-detect flag so it cannot leak between tests', () => {
    localStorage.removeItem('basics-js-locale');
    setLocaleAutoDetect(true);

    resetMessages();
    registerMessages('sv', sv);
    registerMessages('en', en);
    setFallbackLocale('sv');

    withNavigatorLanguage('en-GB', () => {
        expect(new Locale().code.get(),
            'auto-detect must not survive resetMessages()').toBe('sv');
    });
});
