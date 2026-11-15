import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import type { RequestError } from '@basics/core/client/request';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';
import {
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    changePasswordErrorKey,
    isValid,
    message,
    validateChangePassword,
} from '../web/account/account-copy';

// Importing the app's i18n module is what registers the catalogs; the component
// module itself cannot be imported here because `web/theme.ts` writes a <style>
// at import time and there is no DOM in this process. That is the whole reason
// this file exists apart from the view.
await import('../web/i18n');

const err = (code: RequestError['code']): RequestError =>
    ({ code, message: 'raw developer text that must never reach a screen' });

const VALID = {
    currentPassword: 'gammalt123',
    newPassword: 'nytt-losenord',
    confirmPassword: 'nytt-losenord',
};

// --- Validation ---

test('validateChangePassword: accepts a complete, well-formed change', () => {
    expect(validateChangePassword(VALID)).toEqual({});
    expect(isValid(validateChangePassword(VALID))).toBe(true);
});

test('validateChangePassword: a blank current password asks for it', () => {
    expect(validateChangePassword({ ...VALID, currentPassword: '' }).currentPassword)
        .toBe('account.error.currentPasswordRequired');
});

/**
 * No length rule on the CURRENT password. The minimum may have changed since
 * the account was made, and refusing to submit an existing password would lock
 * its owner out of the one form that lets them replace it.
 */
test('validateChangePassword: the current password is never judged on length', () => {
    expect(validateChangePassword({ ...VALID, currentPassword: 'kort' })).toEqual({});
});

test('validateChangePassword: a blank new password asks for one', () => {
    expect(validateChangePassword({ ...VALID, newPassword: '', confirmPassword: '' }).newPassword)
        .toBe('account.error.newPasswordRequired');
});

test('validateChangePassword: a short new password is told it is short, not that it is missing', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateChangePassword({ ...VALID, newPassword: short, confirmPassword: short }).newPassword)
        .toBe('account.error.newPasswordTooShort');
});

/** Matches the server minimum, so the boundary is not off by one. */
test('validateChangePassword: exactly the minimum length is accepted', () => {
    const min = 'a'.repeat(MIN_PASSWORD_LENGTH);
    expect(validateChangePassword({ currentPassword: 'gammalt123', newPassword: min, confirmPassword: min }))
        .toEqual({});
});

/**
 * The server caps both fields at 200 characters. Without this rule a generated
 * passphrase passes every local check and comes back a 400 — which maps to the
 * generic "något i formuläret gick inte igenom", with no field marked, on a
 * form where everything looks right. The reader has no way to find the problem.
 */
test('validateChangePassword: a new password over the server maximum is named as too long', () => {
    const long = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);
    expect(validateChangePassword({ ...VALID, newPassword: long, confirmPassword: long }).newPassword)
        .toBe('account.error.newPasswordTooLong');
});

test('validateChangePassword: exactly the maximum length is accepted', () => {
    // The boundary the server actually enforces, so the client refuses nothing
    // the server would take.
    const max = 'a'.repeat(MAX_PASSWORD_LENGTH);
    expect(validateChangePassword({ currentPassword: 'gammalt123', newPassword: max, confirmPassword: max }))
        .toEqual({});
});

test('validateChangePassword: too long is distinguished from too short', () => {
    const long = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateChangePassword({ ...VALID, newPassword: long, confirmPassword: long }).newPassword)
        .not.toBe(validateChangePassword({ ...VALID, newPassword: short, confirmPassword: short }).newPassword);
});

test('validateChangePassword: reusing the current password is refused as such', () => {
    expect(validateChangePassword({
        currentPassword: 'samma-losenord',
        newPassword: 'samma-losenord',
        confirmPassword: 'samma-losenord',
    }).newPassword).toBe('account.error.newPasswordSameAsCurrent');
});

test('validateChangePassword: a mismatched confirmation is reported on the confirmation', () => {
    const errors = validateChangePassword({ ...VALID, confirmPassword: 'nytt-losenor' });
    expect(errors.confirmPassword).toBe('account.error.confirmMismatch');
    // The new password itself is fine — the complaint must not be moved onto it.
    expect(errors.newPassword).toBeUndefined();
});

/**
 * The chain, asserted as a chain: each rule replaces the previous one rather
 * than piling a second complaint onto the same field. An empty field is
 * missing, not short; a short one is short, not "the same as the current".
 */
test('validateChangePassword: the new-password rules are ordered most-specific-last', () => {
    expect(validateChangePassword({ currentPassword: '', newPassword: '', confirmPassword: '' }).newPassword)
        .toBe('account.error.newPasswordRequired');
    expect(validateChangePassword({ currentPassword: 'x', newPassword: 'x', confirmPassword: 'x' }).newPassword)
        .toBe('account.error.newPasswordTooShort');
});

test('validateChangePassword: reports every bad field at once rather than one at a time', () => {
    expect(validateChangePassword({
        currentPassword: '',
        newPassword: 'kort',
        confirmPassword: 'annat',
    })).toEqual({
        currentPassword: 'account.error.currentPasswordRequired',
        newPassword: 'account.error.newPasswordTooShort',
        confirmPassword: 'account.error.confirmMismatch',
    });
});

/**
 * An empty form is TWO problems, not three. The confirmation has nothing of its
 * own to be wrong about — it is right exactly when it repeats the field above
 * it, and '' repeats '' — so telling a reader "lösenorden stämmer inte överens"
 * while both boxes are empty would be a second complaint about one mistake.
 */
test('validateChangePassword: an empty form does not accuse the confirmation of mismatching', () => {
    expect(validateChangePassword({ currentPassword: '', newPassword: '', confirmPassword: '' })).toEqual({
        currentPassword: 'account.error.currentPasswordRequired',
        newPassword: 'account.error.newPasswordRequired',
    });
});

// --- Request-error mapping ---

/**
 * THE branch worth having. The server answers a wrong current password with a
 * 409; routed to the generic server message it would read "något gick fel hos
 * oss" — the app apologising for a typo the reader can fix, and withholding the
 * one fact that makes the form completable.
 */
test('changePasswordErrorKey: 409 names the wrong current password', () => {
    expect(changePasswordErrorKey(err('conflict'))).toBe('account.error.currentPasswordWrong');
});

test('changePasswordErrorKey: a wrong password is NOT reported as a server fault', () => {
    expect(changePasswordErrorKey(err('conflict'))).not.toBe(changePasswordErrorKey(err('server')));
});

test('changePasswordErrorKey: 401 is a lapsed session, not a bad password', () => {
    // This call carries a session and a wrong password comes back as 409, so a
    // 401 can only mean the session itself is gone.
    expect(changePasswordErrorKey(err('auth'))).toBe('account.error.auth');
    expect(changePasswordErrorKey(err('auth'))).not.toBe(changePasswordErrorKey(err('conflict')));
});

test('changePasswordErrorKey: covers the remaining codes', () => {
    expect(changePasswordErrorKey(err('validation'))).toBe('account.error.validation');
    expect(changePasswordErrorKey(err('rateLimit'))).toBe('account.error.rateLimit');
    expect(changePasswordErrorKey(err('network'))).toBe('account.error.network');
    expect(changePasswordErrorKey(err('timeout'))).toBe('account.error.network');
    expect(changePasswordErrorKey(err('server'))).toBe('account.error.server');
    expect(changePasswordErrorKey(err('unknown'))).toBe('account.error.server');
});

/** The whole point of the mapping: developer English must never reach a screen. */
test('error mapping never passes the raw server message through', () => {
    const codes: RequestError['code'][] =
        ['auth', 'conflict', 'validation', 'rateLimit', 'server', 'network', 'timeout', 'unknown'];
    setLocale('sv');
    for (const code of codes) {
        const key = changePasswordErrorKey(err(code));
        expect(key.startsWith('account.error.')).toBe(true);
        expect(message(key)).not.toContain('raw developer text');
        // Not just "not the raw text" — a real authored sentence stands there.
        expect(message(key).length).toBeGreaterThan(0);
        expect(message(key)).not.toBe(key);
    }
});

// --- Resolved copy ---

test('every key these rules can produce resolves in both catalogs', () => {
    const keys = [
        'account.error.currentPasswordRequired',
        'account.error.newPasswordRequired',
        'account.error.newPasswordTooShort',
        'account.error.newPasswordTooLong',
        'account.error.newPasswordSameAsCurrent',
        'account.error.confirmMismatch',
        'account.error.currentPasswordWrong',
        'account.error.validation',
        'account.error.rateLimit',
        'account.error.network',
        'account.error.server',
        'account.error.auth',
    ];
    // Bracket lookups, not toHaveProperty: these are FLAT dot-separated keys and
    // toHaveProperty would read 'account.error.x' as a nested path.
    for (const key of keys) {
        expect((sv as Record<string, string>)[key], `sv is missing ${key}`).toBeString();
        expect((en as Record<string, string>)[key], `en is missing ${key}`).toBeString();
    }
});

test('message(): resolves against the active locale and is empty for no error', () => {
    setLocale('sv');
    expect(message('account.error.currentPasswordWrong'))
        .toBe('Nuvarande lösenord stämmer inte. Kontrollera det och försök igen.');
    setLocale('en');
    expect(message('account.error.currentPasswordWrong'))
        .toBe('That current password doesn\'t match. Check it and try again.');
    setLocale('sv');
    expect(message(undefined)).toBe('');
});

/**
 * §4.8: an error says what is wrong AND how to fix it, without apologising.
 * Asserted as a property of the catalog rather than left to code review, in
 * BOTH catalogs — English is shipped copy too, and a rule enforced only against
 * sv lets the translation drift into the apologetic register the spec rules
 * out, invisibly, because nothing failed.
 */
const ERROR_KEYS = Object.keys(sv).filter((k) => k.startsWith('account.error.'));

for (const [locale, catalog] of [['sv', sv], ['en', en]] as const) {
    test(`${locale} account error copy is a full sentence and never apologises`, () => {
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

test('the rate-limit copy names the wait rather than apologising for the limit', () => {
    expect((sv as Record<string, string>)['account.error.rateLimit']).toContain('minut');
    expect((en as Record<string, string>)['account.error.rateLimit']).toContain('minute');
});

test('the length copy and the constants it describes cannot drift apart', () => {
    // The hint and the errors state the numbers outright. If either constant
    // moves, the copy has to move with it — otherwise the form refuses what it
    // invited, or names a limit that is not the one being enforced.
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    // 200 is the server's `maxLength` on both password fields. A client cap
    // below it would refuse passwords the server accepts; above it, the 400
    // this rule exists to pre-empt comes back anyway.
    expect(MAX_PASSWORD_LENGTH).toBe(200);
    for (const catalog of [sv, en] as const) {
        expect((catalog as Record<string, string>)['account.hint.newPassword'])
            .toContain(String(MIN_PASSWORD_LENGTH));
        expect((catalog as Record<string, string>)['account.error.newPasswordTooShort'])
            .toContain(String(MIN_PASSWORD_LENGTH));
        expect((catalog as Record<string, string>)['account.error.newPasswordTooLong'])
            .toContain(String(MAX_PASSWORD_LENGTH));
    }
});
