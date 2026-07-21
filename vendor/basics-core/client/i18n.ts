// Basics-JS i18n
// Flat-key message catalogs, interpolation, plurals, date/relative-time formatting.
//
// Catalogs are FLAT maps of dot-separated key → string. Nesting is deliberately
// not supported: flat files diff cleanly and can be checked for parity key by key.
//
//   { 'nav.home': 'Hem', 'notes.sharedWith': 'Delad: {name}' }
//
// Plural forms are ordinary flat keys with a CLDR category suffix, so a catalog
// stays a plain string map:
//
//   { 'notes.count.zero': 'inga anteckningar',
//     'notes.count.one': '{count} anteckning',
//     'notes.count.other': '{count} anteckningar' }
//
// `zero` is not a CLDR category for sv/en — it is an explicit-zero override that
// wins when count === 0 and the key exists. `two`/`few`/`many` are looked up the
// same way for locales whose Intl.PluralRules produce them.

import { Signal, effect } from './core';

export type Messages = Record<string, string>;
export type Params = Record<string, string | number>;
export type DateInput = Date | string | number;

const catalogs = new Map<string, Messages>();
const current = new Signal('en');
const warned = new Set<string>();
let fallbackLocale = 'en';
let autoDetect = false;

// ─── Registration ────────────────────────────────────────────────

/** Register (or merge into) the catalog for a locale, e.g. registerMessages('sv', sv). */
export function registerMessages(locale: string, messages: Messages): void {
    catalogs.set(locale, { ...catalogs.get(locale), ...messages });
}

/** Locale used when a key is missing from the active catalog. Also the seed default. */
export function setFallbackLocale(locale: string): void {
    fallbackLocale = locale;
    if (!catalogs.has(current.peek())) current.set(locale);
}

/**
 * Opt into seeding a first-visit locale from `navigator.language`. OFF by default.
 *
 * A product ships in a language. `setFallbackLocale('sv')` is that statement, and
 * a browser's `Accept-Language` must not silently overrule it — otherwise every
 * developer and every visitor with an en-US browser sees a Swedish product in
 * English, which is a bug that looks like a feature. So auto-detection is a
 * deliberate choice a multilingual app makes, not the default.
 *
 * A locale the user PICKED always wins regardless of this setting: their stored
 * choice is an explicit instruction, `navigator.language` is only a hint.
 */
export function setLocaleAutoDetect(enabled: boolean): void {
    autoDetect = enabled;
}

/** Locale codes that have a registered catalog. */
export function locales(): string[] {
    return [...catalogs.keys()];
}

/** Drop all catalogs and reset state. Test helper. */
export function resetMessages(): void {
    catalogs.clear();
    warned.clear();
    fallbackLocale = 'en';
    autoDetect = false;
    current.set('en');
}

// ─── Active locale ───────────────────────────────────────────────

/**
 * Reactive read of the active locale. Every lookup/format helper below reads it,
 * which is what makes `() => t('nav.home')` bindings re-run on a locale switch.
 */
export function getLocale(): string {
    return current.get();
}

/** Switch locale. Prefer `Locale.set()` in apps — that variant also persists. */
export function setLocale(locale: string): void {
    current.set(locale);
}

// ─── Lookup ──────────────────────────────────────────────────────

function raw(key: string): string | undefined {
    return catalogs.get(current.get())?.[key] ?? catalogs.get(fallbackLocale)?.[key];
}

/**
 * Missing keys return the key itself and warn ONCE per key. Rationale: a missing
 * translation must be visible in the UI and loud in the console, but must never
 * throw — a typo in a rarely-hit branch should not blank out a page.
 */
function missing(key: string): string {
    if (!warned.has(key)) {
        warned.add(key);
        console.warn(`[i18n] missing key "${key}" for locale "${current.peek()}"`);
    }
    return key;
}

/** Placeholders are `{name}`. Unknown placeholders are left untouched. */
function interpolate(text: string, params?: Params): string {
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in params ? String(params[name]) : whole);
}

/** Translate a flat key, interpolating `{name}` placeholders. */
export function t(key: string, params?: Params): string {
    const text = raw(key);
    return text === undefined ? missing(key) : interpolate(text, params);
}

const pluralRules = new Map<string, Intl.PluralRules>();

function rulesFor(locale: string): Intl.PluralRules {
    let rules = pluralRules.get(locale);
    if (!rules) {
        rules = new Intl.PluralRules(locale);
        pluralRules.set(locale, rules);
    }
    return rules;
}

/**
 * Translate a pluralised key. Picks `<key>.zero` when count is 0 and that key
 * exists, otherwise `<key>.<Intl.PluralRules category>`, otherwise `<key>.other`.
 * `{count}` is available as a placeholder without passing it explicitly.
 */
export function plural(key: string, count: number, params?: Params): string {
    const locale = current.get();
    const category = count === 0 && raw(`${key}.zero`) !== undefined
        ? 'zero'
        : rulesFor(locale).select(count);
    const text = raw(`${key}.${category}`) ?? raw(`${key}.other`);
    return text === undefined
        ? missing(`${key}.${category}`)
        : interpolate(text, { count, ...params });
}

/** Upper-case the first character using the active locale's casing rules. */
export function capitalize(value: string): string {
    return value ? value.charAt(0).toLocaleUpperCase(current.get()) + value.slice(1) : value;
}

// ─── Dates ───────────────────────────────────────────────────────

function toDate(value: DateInput): Date {
    return value instanceof Date ? value : new Date(value);
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();

function dateFormat(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const cacheKey = locale + JSON.stringify(opts);
    let fmt = dateFormats.get(cacheKey);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat(locale, opts);
        dateFormats.set(cacheKey, fmt);
    }
    return fmt;
}

/**
 * Intl.DateTimeFormat in the active locale. Recipes:
 *   day of month    → formatDate(d, { day: 'numeric' })                      → '22'
 *   clock time      → formatDate(d, { hour: '2-digit', minute: '2-digit' })  → '17:00'
 *   long day        → formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })
 *                                                                            → 'onsdag 22 juli'
 *   note timestamp  → formatDate(d, { day: 'numeric', month: 'long',
 *                                     hour: '2-digit', minute: '2-digit' })  → '14 juli 19:04'
 */
export function formatDate(
    value: DateInput,
    opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
    return dateFormat(current.get(), opts).format(toDate(value));
}

/** '17:00–18:00'. Uses Intl range formatting, so the separator is locale-correct. */
export function formatTimeRange(
    start: DateInput,
    end: DateInput,
    opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
    return dateFormat(current.get(), opts).formatRange(toDate(start), toDate(end));
}

/**
 * Abbreviated month, CLDR-correct for the locale: locale short month, trailing
 * abbreviation dot stripped, upper-cased (sv 'juli' → 'JULI', en 'Jul' → 'JUL').
 * Use this anywhere the month stands on its own in running copy.
 */
export function formatMonthAbbrev(value: DateInput): string {
    const locale = current.get();
    return formatDate(value, { month: 'short' }).replace(/\.$/, '').toLocaleUpperCase(locale);
}

/**
 * Month for the fixed-width DATE BLOCK ('22 / JUL / 17:00') — exactly three
 * upper-case characters.
 *
 * This is a TYPOGRAPHIC constraint, not a linguistic one: the block is a
 * fixed-width visual element and a four-character month ('JULI', 'MARS',
 * 'JUNI') breaks its alignment. It is therefore deliberately NOT CLDR-correct
 * and is kept separate from formatMonthAbbrev, which stays faithful to the
 * locale. Verified non-destructive for every sv month (jan feb mar apr maj jun
 * jul aug sep okt nov dec) and every en month — no month in either locale is
 * made ambiguous by the truncation.
 */
export function formatMonthBlock(value: DateInput): string {
    return formatMonthAbbrev(value).slice(0, 3);
}

/**
 * '2026-07-14'. Deliberately NOT locale-formatted — this is the ISO calendar date
 * used in tables and as a machine-readable value, computed from local time parts.
 */
export function formatIsoDate(value: DateInput): string {
    const d = toDate(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const relativeFormats = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Clock-scale units (second/minute/hour) use style:'short' so they read
 * 'för 2 tim sedan'; the day unit uses style:'long' so it reads 'för 3 dagar
 * sedan' rather than the cryptic short form 'för 3 d sedan'. Both styles use
 * numeric:'auto', which is what turns -1 day into 'igår' / 'yesterday'.
 */
function relativeFormat(locale: string, style: 'long' | 'short'): Intl.RelativeTimeFormat {
    const cacheKey = locale + '|' + style;
    let fmt = relativeFormats.get(cacheKey);
    if (!fmt) {
        fmt = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });
        relativeFormats.set(cacheKey, fmt);
    }
    return fmt;
}

function startOfDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Human-relative time: 'för 2 tim sedan', 'igår', 'om 5 min'.
 *
 * Everything inside a 7-day window goes through Intl.RelativeTimeFormat with
 * numeric:'auto' — that is what yields 'igår' / 'imorgon' rather than 'för 1 dag
 * sedan'. Beyond 7 days we switch to an absolute date.
 *
 * DELIBERATE NON-GOAL: Swedish weekday forms like 'i måndags' ("last Monday") are
 * NOT produced. Intl has no such output, and generating them means hand-writing
 * Swedish grammar (i måndags / i tisdags / i onsdags / i torsdags / i fredags /
 * i lördags / i söndags) that no other locale shares — exactly the kind of
 * per-language special-casing this module exists to avoid. Days 2–6 render as
 * 'för 3 dagar sedan'; from day 7 they render as '14 juli'. If a design truly
 * needs 'i måndags', it belongs in the app's sv catalog as a keyed message, not
 * in the framework.
 *
 * DAY-SCALE COPY OVERRIDES: CLDR's Swedish data spells the day-1 forms 'igår' /
 * 'imorgon' (no space); an app's authored voice may want 'i går' / 'i morgon'.
 * Both spellings are valid Swedish, so this is a copy decision, not a bug — and
 * copy decisions belong in the catalog. If the active catalog defines
 * `relative.yesterday` / `relative.today` / `relative.tomorrow`, those strings
 * win for days -1/0/+1; everything else stays with Intl.
 *
 * The override is a CATALOG LOOKUP, never a string replacement on Intl output:
 * post-editing 'igår' → 'i går' would be a per-language hack that silently
 * corrupts any locale whose output happens to contain the same substring.
 *
 * Because lookups fall back to the fallback locale, a locale that defines these
 * keys obliges the others to define them too — the parity check enforces that,
 * which is what stops sv's 'i går' leaking into an English UI.
 */
const RELATIVE_DAY_KEYS: Record<number, string> = {
    [-1]: 'relative.yesterday',
    0: 'relative.today',
    1: 'relative.tomorrow',
};
export function formatRelative(value: DateInput, now: DateInput = new Date()): string {
    const target = toDate(value);
    const base = toDate(now);
    const locale = current.get();
    const clock = relativeFormat(locale, 'short');
    const seconds = (target.getTime() - base.getTime()) / 1000;
    const abs = Math.abs(seconds);
    const days = Math.round((startOfDay(target) - startOfDay(base)) / (DAY * 1000));

    // Clock units while we are still on the same calendar day, or while the gap
    // is small enough that the day boundary is not the interesting fact — so
    // 04:00 today reads 'för 8 tim sedan' (not 'idag') and 09:00 tomorrow reads
    // 'imorgon' (not 'om 21 tim'), while 00:30 tonight still reads 'om 1 tim'.
    if (days === 0 || abs < 6 * HOUR) {
        if (abs < MINUTE) return clock.format(Math.round(seconds), 'second');
        if (abs < HOUR) return clock.format(Math.round(seconds / MINUTE), 'minute');
        return clock.format(Math.round(seconds / HOUR), 'hour');
    }

    if (Math.abs(days) < 7) {
        const overrideKey = RELATIVE_DAY_KEYS[days];
        const override = overrideKey === undefined ? undefined : raw(overrideKey);
        return override ?? relativeFormat(locale, 'long').format(days, 'day');
    }

    return target.getFullYear() === base.getFullYear()
        ? formatDate(target, { day: 'numeric', month: 'long' })
        : formatDate(target, { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Locale service ──────────────────────────────────────────────

const LOCALE_KEY = 'basics-js-locale';

function resolve(candidate: string | null | undefined): string | undefined {
    if (!candidate) return undefined;
    if (catalogs.has(candidate)) return candidate;
    const language = candidate.split('-')[0]!;
    return catalogs.has(language) ? language : undefined;
}

/**
 * Persisted locale preference. Same shape as `Theme`: one signal, one effect
 * that writes the derived state out (module locale, localStorage, <html lang>).
 *
 * Seed precedence, highest first:
 *   1. the stored choice — the user picked this, so nothing overrules it;
 *   2. `navigator.language` — ONLY when `setLocaleAutoDetect(true)` opted in;
 *   3. the product's `setFallbackLocale()`.
 *
 * Note that 2 sits BELOW an explicit choice and ABOVE the product default only
 * on request. See `setLocaleAutoDetect` for why that ordering is the safe one.
 *
 * ONLY `set()` writes to storage, and that is load-bearing for the precedence
 * above. If construction persisted its seed, the very first page view would
 * write the fallback locale out, and from then on rule 1 would match a value
 * NOBODY CHOSE — making rules 2 and 3 permanently unreachable for every
 * returning visitor. In particular `setLocaleAutoDetect(true)` would silently
 * become a no-op for everyone who had ever loaded the app before. A stored
 * value must therefore mean exactly one thing: someone picked it.
 */
export class Locale {
    readonly code = new Signal(fallbackLocale);

    constructor() {
        const stored = localStorage.getItem(LOCALE_KEY);
        const detected = autoDetect ? resolve(navigator.language) : undefined;
        this.code.set(resolve(stored) ?? detected ?? fallbackLocale);
        effect(() => {
            const code = this.code.get();
            setLocale(code);
            document.documentElement.setAttribute('lang', code);
        });
    }

    /** Switch and remember. This is the only path that persists a preference. */
    set(code: string): void {
        this.code.set(code);
        localStorage.setItem(LOCALE_KEY, code);
    }
}

// ─── Parity checking ─────────────────────────────────────────────

function placeholders(text: string): string[] {
    return [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]!).sort();
}

function describePlaceholders(names: string[]): string {
    return names.length ? names.map(n => `{${n}}`).join(' ') : 'none';
}

/**
 * Compare two catalogs and report every divergence: keys present in one but not
 * the other, keys whose value is blank, and keys whose `{placeholder}` sets
 * differ. Returns human-readable problems; an empty array means parity.
 *
 * A blank value counts as a problem in EITHER catalog: `"key": ""` passes a
 * naive key-set comparison while rendering as nothing on screen, which is the
 * most invisible drift there is. Whitespace-only is treated as blank for the
 * same reason — `" "` is not a translation.
 */
export function checkMessageParity(
    reference: Messages,
    target: Messages,
    names: { reference: string; target: string } = { reference: 'reference', target: 'target' }
): string[] {
    const problems: string[] = [];

    for (const key of Object.keys(reference).sort()) {
        if (!(key in target)) problems.push(`missing in ${names.target}: ${key}`);
    }
    for (const [name, catalog] of [[names.reference, reference], [names.target, target]] as const) {
        for (const key of Object.keys(catalog).sort()) {
            const value = catalog[key];
            if (typeof value !== 'string' || value.trim() === '') {
                problems.push(`blank value in ${name}: ${key}`);
            }
        }
    }
    for (const key of Object.keys(target).sort()) {
        if (!(key in reference)) problems.push(`extra in ${names.target} (not in ${names.reference}): ${key}`);
    }
    for (const key of Object.keys(reference).sort()) {
        if (!(key in target)) continue;
        const a = placeholders(reference[key]!);
        const b = placeholders(target[key]!);
        if (a.join(',') !== b.join(',')) {
            problems.push(
                `placeholder mismatch: ${key} — ${names.reference} has ${describePlaceholders(a)}, `
                + `${names.target} has ${describePlaceholders(b)}`
            );
        }
    }

    return problems;
}
