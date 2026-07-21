import { Component, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../i18n';
import { HOME_ROUTE, returnToFrom, withReturnTo } from '../app/route-guard';
import { authStyles } from './auth-styles';
import {
    isValid,
    loginErrorKey,
    message,
    validateLogin,
    type FieldErrors,
    type LoginField,
} from './auth-copy';

const tpl = template(`
    <section class="auth" bind="root">
        <header class="auth__brand">
            <p class="auth__wordmark" bind="wordmark"></p>
            <hr class="auth__rule" />
        </header>

        <div class="auth__card">
            <h1 class="auth__title" bind="title"></h1>
            <p class="auth__lede" bind="lede"></p>

            <p class="auth__alert" bind="alert" role="alert"></p>

            <form bind="form" class="auth__form" novalidate>
                <div class="auth__field" bind="emailField">
                    <label class="auth__label" for="auth-email" bind="emailLabel"></label>
                    <input class="auth__input" bind="email" id="auth-email" type="email"
                        autocomplete="email" autocapitalize="none" spellcheck="false"
                        aria-describedby="auth-email-error" />
                    <p class="auth__error" bind="emailError" id="auth-email-error"></p>
                </div>

                <div class="auth__field" bind="passwordField">
                    <label class="auth__label" for="auth-password" bind="passwordLabel"></label>
                    <input class="auth__input" bind="password" id="auth-password" type="password"
                        autocomplete="current-password"
                        aria-describedby="auth-password-error" />
                    <p class="auth__error" bind="passwordError" id="auth-password-error"></p>
                </div>

                <button class="auth__submit" type="submit" bind="submit"></button>
            </form>
        </div>

        <p class="auth__alt">
            <span bind="altPrompt"></span>
            <a class="auth__alt-link" bind="registerLink" href="/register"></a>
        </p>
    </section>
`);

/**
 * Login — IA §3.17.
 *
 * The identity field is EMAIL. The framework's `AuthService.login` still names
 * its transport parameter `username`, and the test client surfaced that name to
 * the person typing into it; the server keys accounts on email, so the label
 * now says what the field actually holds.
 *
 * There is no Teacher/Student choice here and there must never be one — IA §1
 * has no account mode to pick.
 */
export class LoginComponent extends Component {
    static styles = authStyles;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    /**
     * `AuthService.error` is a singleton signal that outlives this view, and
     * `request()` only clears it when the NEXT call starts. Without this, a
     * failed sign-in followed by a trip to Register and back re-announced
     * "E-postadressen eller lösenordet stämmer inte" over an empty form the
     * visitor had not submitted yet — and `role="alert"` reads it aloud. A
     * failure belongs to the attempt that caused it, so the view opens clean.
     *
     * Cleared here rather than in `onMount()` because `onMount` runs after
     * `render()`, which would paint the stale alert for a frame first.
     */
    constructor() {
        super();
        this.auth.error.set(null);
    }

    /**
     * The route this visitor was actually reaching for, validated — or null.
     *
     * Read ONCE, at construction, and that is deliberate rather than the usual
     * mistake. The moment `login()` succeeds the shell's guard effect fires and
     * replaces the URL with `/home`, taking the query string with it; read at
     * submit time there would be nothing left to read. It is also inert data,
     * not copy, so nothing about it goes stale — unlike a resolved `t()` string,
     * which is the freeze this codebase keeps rediscovering.
     */
    private returnTo = returnToFrom(this.router.search.peek());

    private email = '';
    private password = '';
    /** Empty until the first submit; drives every invalid-state binding. */
    private fieldErrors = new Signal<FieldErrors<LoginField>>({});
    private submitted = false;
    private inputs: Partial<Record<LoginField, HTMLInputElement>> = {};

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.auth.loading.get() },
            wordmark: { textContent: () => t('app.brand') },
            title: { textContent: () => t('auth.login.title') },
            lede: { textContent: () => t('auth.login.lede') },

            // Server-side failure. Never the raw `error.message` — that string
            // is developer English ('Unauthorized'); §4.8 and IA §3.17 both
            // require authored, actionable Swedish.
            alert: {
                className: () => this.auth.error.get() ? 'auth__alert is-shown' : 'auth__alert',
                textContent: () => {
                    const err = this.auth.error.get();
                    return err ? t(loginErrorKey(err)) : '';
                },
            },

            form: { onsubmit: (e: Event) => void this.onSubmit(e) },

            emailLabel: { textContent: () => t('auth.field.email') },
            emailField: { className: () => this.fieldClass('email') },
            email: {
                'aria-invalid': () => String(this.fieldErrors.get().email !== undefined),
                oninput: (e: Event) => {
                    this.email = (e.target as HTMLInputElement).value;
                    this.revalidate();
                },
            },
            emailError: {
                className: () => this.errorClass('email'),
                textContent: () => message(this.fieldErrors.get().email),
            },

            passwordLabel: { textContent: () => t('auth.field.password') },
            passwordField: { className: () => this.fieldClass('password') },
            password: {
                'aria-invalid': () => String(this.fieldErrors.get().password !== undefined),
                oninput: (e: Event) => {
                    this.password = (e.target as HTMLInputElement).value;
                    this.revalidate();
                },
            },
            passwordError: {
                className: () => this.errorClass('password'),
                textContent: () => message(this.fieldErrors.get().password),
            },

            submit: {
                textContent: () => this.auth.loading.get()
                    ? t('auth.login.submitting')
                    : t('auth.login.submit'),
            },

            altPrompt: { textContent: () => `${t('auth.login.altPrompt')} ` },
            registerLink: {
                textContent: () => t('auth.login.altLink'),
                onclick: (e: Event) => {
                    e.preventDefault();
                    // Carry the destination across the switch. Someone who deep
                    // linked, found they had no account, and registered instead
                    // is still trying to get to the same place.
                    this.router.navigate(withReturnTo('/register', this.returnTo ?? ''), true);
                },
            },
        });

        this.inputs = {
            email: this.ref(frag, 'email') as HTMLInputElement,
            password: this.ref(frag, 'password') as HTMLInputElement,
        };
        return frag;
    }

    private fieldClass(field: LoginField): string {
        return this.fieldErrors.get()[field] ? 'auth__field is-invalid' : 'auth__field';
    }

    private errorClass(field: LoginField): string {
        return this.fieldErrors.get()[field] ? 'auth__error is-shown' : 'auth__error';
    }

    /**
     * Validate on input only once the person has actually submitted. Marking a
     * half-typed address invalid on the third keystroke is noise, but leaving a
     * flagged field flagged while it is being fixed is worse.
     */
    private revalidate(): void {
        if (!this.submitted) return;
        this.fieldErrors.set(validateLogin({ email: this.email, password: this.password }));
    }

    private async onSubmit(e: Event): Promise<void> {
        e.preventDefault();
        this.submitted = true;
        const errors = validateLogin({ email: this.email, password: this.password });
        this.fieldErrors.set(errors);
        if (!isValid(errors)) {
            // A rejected submit must land the caret on the thing to fix.
            const first: LoginField | undefined = errors.email ? 'email' : 'password';
            this.inputs[first]?.focus();
            return;
        }
        const ok = await this.auth.login(this.email.trim(), this.password);
        // Finish the journey the visitor started, or land on home. This runs
        // AFTER the guard's own correction to /home — `login()` sets
        // `currentUser` synchronously, so the guard effect has already fired and
        // navigated by the time this line is reached — which is why it is a
        // second navigate rather than a race with the first. Replace, not push,
        // for the same reason the guard replaces: /login is not a place Back
        // should return a signed-in visitor to.
        if (ok) this.router.navigate(this.returnTo ?? HOME_ROUTE, true);
    }
}
