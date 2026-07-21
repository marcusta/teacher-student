import type { RequestError } from '@basics/core/client/request';
import { t } from '../i18n';

/**
 * Validation and error copy for the public entry views (IA §3.17).
 *
 * Kept apart from the components for the reason `web/ui/copy.ts` states: the
 * component modules import `../theme`, whose `createTokens()` writes a `<style>`
 * at import time, so they cannot load in a DOM-less test process. Everything
 * here is pure — which field is wrong, and what a failed request should SAY —
 * and that is exactly the part worth asserting, so it lives where `bun test`
 * can reach it.
 *
 * Two rules from design system §4.8 are encoded here rather than left to review:
 *
 *   1. An error explains what is wrong AND how to fix it. There is no branch
 *      that returns a bare "Ogiltig e-post", and none that apologises.
 *   2. No raw server text ever reaches the screen. `RequestError.message` is
 *      English, written for a developer ('Unauthorized', 'Server error'); every
 *      code is mapped to authored Swedish instead. IA §3.17 requires exactly
 *      this. The `message` field is deliberately never read.
 */

/**
 * The identity contract is EMAIL, end to end — the server keys users on email
 * and `UserService.verify` looks up by it. The transport field is still called
 * `username` inside the framework's AuthService, which is what produced the
 * test client's misleading "Username" label that IA §3.17 calls out. This
 * pattern matches the server's `RegisterInput` schema so the client rejects
 * what the server would reject, with better copy.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Server-enforced minimum (`RegisterInput.password.minLength`). */
export const MIN_PASSWORD_LENGTH = 8;

/** Field name → message key. A field with no entry is valid. */
export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export type LoginField = 'email' | 'password';
export type RegisterField = 'email' | 'displayName' | 'password';

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    email: string;
    displayName: string;
    password: string;
}

function emailProblem(email: string): string | undefined {
    if (email.trim() === '') return 'auth.error.emailRequired';
    if (!EMAIL.test(email.trim())) return 'auth.error.emailInvalid';
    return undefined;
}

/**
 * Login checks presence and shape only — never length. A password rule that
 * changed after an account was made would otherwise lock its owner out of the
 * form before the server ever got a chance to accept them.
 */
export function validateLogin(values: LoginInput): FieldErrors<LoginField> {
    const errors: FieldErrors<LoginField> = {};
    const email = emailProblem(values.email);
    if (email) errors.email = email;
    if (values.password === '') errors.password = 'auth.error.passwordRequired';
    return errors;
}

export function validateRegister(values: RegisterInput): FieldErrors<RegisterField> {
    const errors: FieldErrors<RegisterField> = {};
    const email = emailProblem(values.email);
    if (email) errors.email = email;
    if (values.displayName.trim() === '') errors.displayName = 'auth.error.displayNameRequired';
    if (values.password === '') errors.password = 'auth.error.passwordRequired';
    else if (values.password.length < MIN_PASSWORD_LENGTH) errors.password = 'auth.error.passwordTooShort';
    return errors;
}

/** True when nothing is wrong. */
export function isValid(errors: FieldErrors<string>): boolean {
    return Object.keys(errors).length === 0;
}

/**
 * Sign-in failure copy.
 *
 * 401 and 400 collapse into one message on purpose. Distinguishing "no such
 * account" from "wrong password" would confirm to anyone who asks whether a
 * given address has an account here — an account-enumeration oracle on the one
 * view that is public by definition. One honest sentence covers both.
 *
 * `rateLimit` does NOT collapse into the server message, and that is the point
 * of it existing. `core/server/auth.ts` returns 429 after `LOGIN_MAX` attempts
 * in `LOGIN_WINDOW`; routed to `auth.error.server` it read "något gick fel hos
 * oss" — the app apologising for a limit the reader tripped themselves, and
 * advising a retry that is precisely what will not work. The honest answer names
 * the wait.
 *
 * It is deliberately NOT folded in with the credentials message either: the
 * enumeration argument does not apply, since a 429 is a fact about this browser's
 * recent attempts and reveals nothing about whether the account exists.
 */
export function loginErrorKey(error: RequestError): string {
    switch (error.code) {
        case 'auth':
        case 'validation':
            return 'auth.error.credentials';
        case 'rateLimit':
            return 'auth.error.rateLimit';
        case 'network':
        case 'timeout':
            return 'auth.error.network';
        default:
            return 'auth.error.server';
    }
}

/** Registration failure copy. 409 is the duplicate-email conflict of IA §3.17. */
export function registerErrorKey(error: RequestError): string {
    switch (error.code) {
        case 'conflict':
            return 'auth.error.emailTaken';
        case 'validation':
            return 'auth.error.validation';
        case 'network':
        case 'timeout':
            return 'auth.error.network';
        default:
            return 'auth.error.server';
    }
}

/** Resolve a key from any function above into display text. */
export function message(key: string | undefined): string {
    return key === undefined ? '' : t(key);
}
