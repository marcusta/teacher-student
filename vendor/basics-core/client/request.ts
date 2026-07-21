import type { Signal } from './core';
import { batch } from './core';
import { ApiError } from './api-error';
import { reportError } from './error-report';
import { getErrorTraceId } from './fetch';
import { notifySessionExpired } from './session';

export type ErrorCode = 'auth' | 'conflict' | 'validation' | 'rateLimit'
    | 'server' | 'network' | 'timeout' | 'unknown';

export interface RequestError {
    message: string;
    code: ErrorCode;
}

export interface RequestOptions {
    /**
     * Whether a 401 from this call should publish a session-expiry event via
     * `notifySessionExpired()`, which clears the client's auth state. Default `true`.
     *
     * Pass `false` for calls to the auth endpoints themselves: a 401 from
     * `POST /auth/login` means "wrong credentials", not "session expired", and
     * treating it as expiry would clear state and bounce the user mid sign-in.
     */
    sessionExpiry?: boolean;
}

/**
 * Wraps an API call with loading/error signal management.
 *
 * - Sets `loading` to true, clears `error` before the call.
 * - On success: sets `loading` to false, returns the result.
 * - On failure: sets `loading` to false, sets `error` with code + message, returns `undefined`.
 * - On a 401: additionally publishes session expiry (see `RequestOptions.sessionExpiry`).
 *   That is a side effect only — the caller still receives `code: 'auth'` and renders
 *   its own messaging.
 *
 * Network concerns (timeout, retry, dedup) are handled by `apiFetch` in the fetch layer.
 * This function is purely a UI signal wrapper.
 */
export async function request<T>(
    loading: Signal<boolean>,
    error: Signal<RequestError | null>,
    fn: () => Promise<T>,
    options: RequestOptions = {},
): Promise<T | undefined> {
    batch(() => {
        loading.set(true);
        error.set(null);
    });

    try {
        const result = await fn();
        loading.set(false);
        return result;
    } catch (err) {
        const requestError = toRequestError(err);
        batch(() => {
            loading.set(false);
            error.set(requestError);
        });
        reportError(requestError.code, requestError.message, getErrorTraceId(err));
        if (requestError.code === 'auth' && options.sessionExpiry !== false) notifySessionExpired();
        return undefined;
    }
}

function toRequestError(err: unknown): RequestError {
    if (err instanceof ApiError) {
        if (err.status === 401) return { code: 'auth', message: 'Unauthorized' };
        if (err.status === 409) return { code: 'conflict', message: 'Data has changed — please try again' };
        if (err.status === 400) return { code: 'validation', message: err.message };
        // Above the fallback, which would otherwise flatten a 429 into a
        // byte-for-byte copy of a 500. "Try again" is the right advice for one
        // and the wrong advice for the other.
        if (err.status === 429) return { code: 'rateLimit', message: 'Too many requests' };
        return { code: 'server', message: 'Server error' };
    }
    if (err instanceof Error) {
        if (err.message === 'Request timeout') return { code: 'timeout', message: 'Request timeout' };
        return { code: 'network', message: 'Network error' };
    }
    return { code: 'unknown', message: 'Unknown error' };
}
