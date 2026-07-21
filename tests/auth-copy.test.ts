import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import type { RequestError } from '@basics/core/client/request';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';
import {
    MIN_PASSWORD_LENGTH,
    isValid,
    loginErrorKey,
    message,
    registerErrorKey,
    validateLogin,
    validateRegister,
} from '../web/auth/auth-copy';

// Importing the app's i18n module is what registers the catalogs; the component
// modules themselves cannot be imported here because `web/theme.ts` writes a
// <style> at import time and there is no DOM in this process.
await import('../web/i18n');

const err = (code: RequestError['code']): RequestError =>
    ({ code, message: 'raw developer text that must never reach a screen' });

const VALID_LOGIN = { email: 'alva@exempel.se', password: 'hemligt123' };
const VALID_REGISTER = { email: 'alva@exempel.se', displayName: 'Alva', password: 'hemligt123' };

// --- Login validation ---

test('validateLogin: accepts a well-formed email and a non-empty password', () => {
    expect(validateLogin(VALID_LOGIN)).toEqual({});
    expect(isValid(validateLogin(VALID_LOGIN))).toBe(true);
});

test('validateLogin: a blank email asks for one', () => {
    expect(validateLogin({ ...VALID_LOGIN, email: '' }).email).toBe('auth.error.emailRequired');
    expect(validateLogin({ ...VALID_LOGIN, email: '   ' }).email).toBe('auth.error.emailRequired');
});

test('validateLogin: a malformed email is distinguished from a missing one', () => {
    for (const email of ['alva', 'alva@', '@exempel.se', 'alva@exempel', 'al va@exempel.se']) {
        expect(validateLogin({ ...VALID_LOGIN, email }).email).toBe('auth.error.emailInvalid');
    }
});

test('validateLogin: surrounding whitespace does not make a valid address invalid', () => {
    expect(validateLogin({ ...VALID_LOGIN, email: '  alva@exempel.se  ' })).toEqual({});
});

test('validateLogin: a blank password asks for one', () => {
    expect(validateLogin({ ...VALID_LOGIN, password: '' }).password).toBe('auth.error.passwordRequired');
});

/**
 * The length rule belongs to registration only. Enforcing it on login would
 * lock out anyone whose account predates the current minimum — they would never
 * reach the server that would happily accept them.
 */
test('validateLogin: does NOT apply the registration length rule', () => {
    expect(validateLogin({ ...VALID_LOGIN, password: 'kort' })).toEqual({});
});

test('validateLogin: reports both fields at once', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
        email: 'auth.error.emailRequired',
        password: 'auth.error.passwordRequired',
    });
});

// --- Register validation ---

test('validateRegister: accepts a complete, well-formed registration', () => {
    expect(validateRegister(VALID_REGISTER)).toEqual({});
});

test('validateRegister: requires a display name that is not just whitespace', () => {
    expect(validateRegister({ ...VALID_REGISTER, displayName: '' }).displayName)
        .toBe('auth.error.displayNameRequired');
    expect(validateRegister({ ...VALID_REGISTER, displayName: '   ' }).displayName)
        .toBe('auth.error.displayNameRequired');
});

test('validateRegister: a short password is told it is short, not that it is missing', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateRegister({ ...VALID_REGISTER, password: short }).password)
        .toBe('auth.error.passwordTooShort');
    expect(validateRegister({ ...VALID_REGISTER, password: '' }).password)
        .toBe('auth.error.passwordRequired');
});

/** Matches the server's `RegisterInput` minLength, so the boundary is not off by one. */
test('validateRegister: exactly the minimum length is accepted', () => {
    expect(validateRegister({ ...VALID_REGISTER, password: 'a'.repeat(MIN_PASSWORD_LENGTH) }))
        .toEqual({});
});

test('validateRegister: reports every bad field at once rather than one at a time', () => {
    expect(validateRegister({ email: 'nope', displayName: '', password: 'x' })).toEqual({
        email: 'auth.error.emailInvalid',
        displayName: 'auth.error.displayNameRequired',
        password: 'auth.error.passwordTooShort',
    });
});

// --- Request-error mapping ---

/**
 * 401 and 400 deliberately collapse into one message: telling the two apart
 * would confirm whether a given address has an account here, on the one view
 * that is public by definition.
 */
test('loginErrorKey: rejected credentials and validation share one non-enumerating message', () => {
    expect(loginErrorKey(err('auth'))).toBe('auth.error.credentials');
    expect(loginErrorKey(err('validation'))).toBe('auth.error.credentials');
});

test('loginErrorKey: transport failures are separated from server failures', () => {
    expect(loginErrorKey(err('network'))).toBe('auth.error.network');
    expect(loginErrorKey(err('timeout'))).toBe('auth.error.network');
    expect(loginErrorKey(err('server'))).toBe('auth.error.server');
    expect(loginErrorKey(err('unknown'))).toBe('auth.error.server');
});

test('registerErrorKey: 409 becomes the duplicate-email conflict of IA §3.17', () => {
    expect(registerErrorKey(err('conflict'))).toBe('auth.error.emailTaken');
});

test('registerErrorKey: covers the remaining codes', () => {
    expect(registerErrorKey(err('validation'))).toBe('auth.error.validation');
    expect(registerErrorKey(err('network'))).toBe('auth.error.network');
    expect(registerErrorKey(err('timeout'))).toBe('auth.error.network');
    expect(registerErrorKey(err('server'))).toBe('auth.error.server');
    expect(registerErrorKey(err('auth'))).toBe('auth.error.server');
});

/** The whole point of the mapping: developer English must never reach a screen. */
test('error mapping never passes the raw server message through', () => {
    const codes: RequestError['code'][] =
        ['auth', 'conflict', 'validation', 'server', 'network', 'timeout', 'unknown'];
    for (const code of codes) {
        for (const key of [loginErrorKey(err(code)), registerErrorKey(err(code))]) {
            expect(key.startsWith('auth.error.')).toBe(true);
            expect(message(key)).not.toContain('raw developer text');
        }
    }
});

// --- Resolved copy ---

test('every key these rules can produce resolves in both catalogs', () => {
    const keys = [
        ...Object.values(validateRegister({ email: '', displayName: '', password: '' })),
        'auth.error.emailInvalid',
        'auth.error.passwordTooShort',
        'auth.error.credentials',
        'auth.error.emailTaken',
        'auth.error.validation',
        'auth.error.network',
        'auth.error.server',
    ];
    // Bracket lookups, not toHaveProperty: these are FLAT dot-separated keys and
    // toHaveProperty would read 'auth.error.x' as a nested path that never exists.
    for (const key of keys) {
        expect((sv as Record<string, string>)[key]).toBeString();
        expect((en as Record<string, string>)[key]).toBeString();
    }
});

test('message(): resolves against the active locale and is empty for no error', () => {
    setLocale('sv');
    expect(message('auth.error.emailRequired')).toBe('Fyll i din e-postadress.');
    setLocale('en');
    expect(message('auth.error.emailRequired')).toBe('Enter your email address.');
    setLocale('sv');
    expect(message(undefined)).toBe('');
});

/**
 * §4.8: an error says what is wrong AND how to fix it, without apologising.
 * Asserted as a property of the catalog rather than left to code review.
 *
 * BOTH catalogs are checked. English is shipped copy too, and a rule enforced
 * only against sv lets the translation drift into exactly the apologetic,
 * fragmentary register the spec rules out — invisibly, because nothing failed.
 *
 * There is no exemption list. There used to be one, for `auth.error.heading` —
 * a key no component ever read, kept alive only by the test that excused it
 * from the rule. Both are gone: every `auth.error.*` key is now copy that some
 * branch of `loginErrorKey`/`registerErrorKey` can actually put on a screen,
 * and every one of them is held to the sentence rule.
 */
const ERROR_KEYS = Object.keys(sv).filter((k) => k.startsWith('auth.error.'));

for (const [locale, catalog] of [['sv', sv], ['en', en]] as const) {
    test(`${locale} error copy is a full sentence and never apologises`, () => {
        expect(ERROR_KEYS.length).toBeGreaterThan(0);
        for (const key of ERROR_KEYS) {
            const text = (catalog as Record<string, string>)[key];
            expect(text, `${locale} is missing ${key}`).toBeString();
            expect(text!, `${locale}:${key} must end a sentence`).toMatch(/[.!?]$/);
            for (const apology of ['tyvärr', 'ursäkta', 'förlåt', 'sorry', 'apolog']) {
                expect(text!.toLowerCase(), `${locale}:${key} apologises`).not.toContain(apology);
            }
        }
    });
}

/**
 * A rate-limited sign-in says so, rather than apologising for the server.
 *
 * `core/server/auth.ts` throws `RateLimitError` → HTTP 429 after LOGIN_MAX (5)
 * attempts in LOGIN_WINDOW (60s). This used to be a pinned KNOWN GAP: the
 * framework's `toRequestError` had no 429 branch, so a 429 fell through to the
 * `ApiError` fallback and reached this module as
 * `{ code: 'server', message: 'Server error' }` — byte-for-byte identical to a
 * 500, with the server's own 'Too many attempts' discarded. There was no
 * app-side signal to branch on, and the sixth attempt read "Något gick fel hos
 * oss": the app apologising for the reader's own doing, and advising a retry
 * that was exactly what would not work.
 *
 * The framework now maps 429 → `rateLimit`, and these assert the fixed
 * behaviour. A compile-time tripwire stood here until it landed.
 */
test('a rate-limited sign-in names the limit and the wait', () => {
    expect(loginErrorKey(err('rateLimit'))).toBe('auth.error.rateLimit');
});

test('a rate limit is NOT reported as a server fault', () => {
    // The regression this guards is the gap itself returning: any route from a
    // 429 back into the apology copy.
    expect(loginErrorKey(err('rateLimit'))).not.toBe(loginErrorKey(err('server')));
});

test('a rate limit is NOT folded into the credentials message', () => {
    // The enumeration argument that merges 401 and 400 does not reach here: a
    // 429 is a fact about this browser's recent attempts, not about whether the
    // account exists. Collapsing it would tell the reader their password is
    // wrong when it may well be right.
    expect(loginErrorKey(err('rateLimit'))).not.toBe(loginErrorKey(err('auth')));
});

test('the rate-limit copy states the wait the real limiter enforces', () => {
    // LOGIN_WINDOW is 60s, so "a minute" is the honest instruction — the copy
    // has to keep matching the limiter it describes.
    expect((sv as Record<string, string>)['auth.error.rateLimit']).toContain('minut');
    expect((en as Record<string, string>)['auth.error.rateLimit']).toContain('minute');
});

/**
 * The register page's email hint has to be true on BOTH paths into it. It used
 * to read "Samma adress som inbjudan skickades till." — which asserts an
 * invitation, and roughly half the people reading it are signing up cold and do
 * not have one. Conditional now, so it informs the invited without lying to
 * anyone else.
 */
test('auth.hint.email does not assume the reader was invited', () => {
    for (const [locale, catalog] of [['sv', sv], ['en', en]] as const) {
        const hint = (catalog as Record<string, string>)['auth.hint.email']!;
        expect(hint, `${locale} hint`).toBeString();
        // The claim is conditional, not asserted: an unconditional mention of
        // the invitation is the bug.
        const conditional = locale === 'sv' ? /\bHar du\b/ : /\bIf you\b/;
        expect(hint, `${locale} hint must not assert an invitation`).toMatch(conditional);
    }
});
