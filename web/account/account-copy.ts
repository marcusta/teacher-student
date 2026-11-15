import type { RequestError } from '@basics/core/client/request';
import { t } from '../i18n';

/**
 * Validation and error copy for Kontoinställningar.
 *
 * Kept apart from the component for the reason `web/auth/auth-copy.ts` states:
 * the view module imports `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so it cannot load in a DOM-less test process. Everything here
 * is pure — which field is wrong, and what a failed request should SAY — and
 * that is the part worth asserting, so it lives where `bun test` can reach it.
 *
 * The same two rules from design system §4.8 are encoded here rather than left
 * to review:
 *
 *   1. An error explains what is wrong AND how to fix it. No branch returns a
 *      bare "Fel lösenord", and none apologises.
 *   2. No raw server text ever reaches the screen. `RequestError.message` is
 *      English written for a developer ('Unauthorized', 'Server error'); every
 *      code is mapped to authored Swedish instead. The `message` field is
 *      deliberately never read.
 */

/** Server-enforced minimum, same as registration. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Server-enforced maximum (`maxLength: 200` on both password fields).
 *
 * Checked here because the server's refusal is a 400, which maps to the generic
 * `account.error.validation` — "något i formuläret gick inte igenom" with NO
 * field marked, on a form where every field looks correct. The people who hit
 * it are exactly the ones doing the right thing: a password manager generating
 * a long passphrase. So the limit is named on the field that has it, before the
 * request is made.
 */
export const MAX_PASSWORD_LENGTH = 200;

/** Field name → message key. A field with no entry is valid. */
export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export type ChangePasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Every field is reported at once rather than one at a time, so a reader fixes
 * the form in one pass instead of discovering the next problem on every submit.
 *
 * The new password's rules are a chain on purpose: an empty field is missing,
 * not short, and a short one is short rather than "the same as the current
 * one". Only the last, most specific complaint that can be true is shown.
 *
 * Note what the current password is NOT checked for: length. The rule may have
 * changed since the account was made, and the field's only job here is to prove
 * the person at the keyboard is the account holder — a check the server makes,
 * and the one place a wrong value is allowed to be a wrong value rather than a
 * malformed one.
 */
export function validateChangePassword(values: ChangePasswordInput): FieldErrors<ChangePasswordField> {
    const errors: FieldErrors<ChangePasswordField> = {};

    if (values.currentPassword === '') errors.currentPassword = 'account.error.currentPasswordRequired';

    if (values.newPassword === '') errors.newPassword = 'account.error.newPasswordRequired';
    else if (values.newPassword.length < MIN_PASSWORD_LENGTH) errors.newPassword = 'account.error.newPasswordTooShort';
    else if (values.newPassword.length > MAX_PASSWORD_LENGTH) errors.newPassword = 'account.error.newPasswordTooLong';
    else if (values.newPassword === values.currentPassword) errors.newPassword = 'account.error.newPasswordSameAsCurrent';

    // Only ever a comparison. A confirmation field has nothing of its own to be
    // wrong about — it is right exactly when it repeats what is above it, and
    // saying "fyll i" here while the field it copies is also empty would be a
    // second complaint about one mistake.
    if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'account.error.confirmMismatch';

    return errors;
}

/** True when nothing is wrong. */
export function isValid(errors: FieldErrors<string>): boolean {
    return Object.keys(errors).length === 0;
}

/**
 * Change-password failure copy.
 *
 * 409 is THE branch worth having. The server answers a wrong current password
 * with a conflict, and routed to the generic server message it would read
 * "något gick fel hos oss" — the app apologising for a typo the reader can fix,
 * and hiding the one fact that makes the form completable. There is no
 * enumeration argument against naming it either: this view is behind a session,
 * so the reader already is the account holder and learns nothing about anyone
 * else.
 *
 * 401 is honest here in a way it is not on the sign-in form: this call carries a
 * session, so a 401 means that session is gone, and `request()`'s default
 * expiry handling is deliberately left alone to clear the client's auth state.
 * The copy says so rather than blaming the password.
 */
export function changePasswordErrorKey(error: RequestError): string {
    switch (error.code) {
        case 'conflict':
            return 'account.error.currentPasswordWrong';
        case 'validation':
            return 'account.error.validation';
        case 'rateLimit':
            return 'account.error.rateLimit';
        case 'auth':
            return 'account.error.auth';
        case 'network':
        case 'timeout':
            return 'account.error.network';
        default:
            return 'account.error.server';
    }
}

/** Resolve a key from any function above into display text. */
export function message(key?: string): string {
    return key === undefined ? '' : t(key);
}
