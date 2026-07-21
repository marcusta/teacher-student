import { registerMessages, setFallbackLocale } from '@basics/core/client/i18n';
import sv from './i18n/sv.json';
import en from './i18n/en.json';

/**
 * Message catalogs.
 *
 * Swedish is the SOURCE OF TRUTH — the design spec is written in Swedish and its
 * voice matters. English is a translation and must stay in key parity with sv;
 * `bun run check:i18n` (and tests/i18n.test.ts) fail loudly when it drifts.
 *
 * Catalogs are flat key → string maps. Plural forms are flat keys with a CLDR
 * category suffix (`.zero` / `.one` / `.other`) read via `plural()`.
 *
 * The `relative.*` keys are day-scale copy overrides picked up by
 * `formatRelative`. CLDR Swedish renders 'igår' / 'imorgon'; the design spec's
 * authored voice is 'i går' / 'i morgon' (§4.3 feed: "Alva · i går 19:32").
 * Both spellings are correct Swedish, so the spec wins — and it wins in the
 * catalog, where copy decisions belong, not by post-editing Intl output.
 * English must define the same keys or sv's wording would fall through into an
 * English UI; `check:i18n` is what enforces that.
 */
registerMessages('sv', sv);
registerMessages('en', en);
setFallbackLocale('sv');
// NOT calling setLocaleAutoDetect(true) is the point: this is a Swedish product,
// so a browser sending Accept-Language: en-US must not turn it into an English
// one. A locale the user picks themselves still wins — see the framework's
// `setLocaleAutoDetect` for the full precedence.

export { t, plural, capitalize, getLocale, Locale } from '@basics/core/client/i18n';
// formatMonthAbbrev is the CLDR-correct month ('JULI'); formatMonthBlock is the
// 3-char truncation the fixed-width date block needs ('JUL'). Pick per §4.3.
export { formatDate, formatTimeRange, formatMonthAbbrev, formatMonthBlock, formatIsoDate, formatRelative } from '@basics/core/client/i18n';
