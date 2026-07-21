import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../i18n';
import { HOME_ROUTE, returnToFrom, withReturnTo } from '../app/route-guard';
import { authStyles } from './auth-styles';
import { RegisterService } from './register.service';
import {
    MIN_PASSWORD_LENGTH,
    isValid,
    message,
    registerErrorKey,
    validateRegister,
    type FieldErrors,
    type RegisterField,
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
                    <label class="auth__label" for="reg-email" bind="emailLabel"></label>
                    <input class="auth__input" bind="email" id="reg-email" type="email"
                        autocomplete="email" autocapitalize="none" spellcheck="false"
                        aria-describedby="reg-email-hint reg-email-error" />
                    <p class="auth__hint" bind="emailHint" id="reg-email-hint"></p>
                    <p class="auth__error" bind="emailError" id="reg-email-error"></p>
                </div>

                <div class="auth__field" bind="displayNameField">
                    <label class="auth__label" for="reg-name" bind="displayNameLabel"></label>
                    <input class="auth__input" bind="displayName" id="reg-name" type="text"
                        autocomplete="name" maxlength="100"
                        aria-describedby="reg-name-hint reg-name-error" />
                    <p class="auth__hint" bind="displayNameHint" id="reg-name-hint"></p>
                    <p class="auth__error" bind="displayNameError" id="reg-name-error"></p>
                </div>

                <div class="auth__field" bind="passwordField">
                    <label class="auth__label" for="reg-password" bind="passwordLabel"></label>
                    <input class="auth__input" bind="password" id="reg-password" type="password"
                        autocomplete="new-password"
                        aria-describedby="reg-password-hint reg-password-error" />
                    <p class="auth__hint" bind="passwordHint" id="reg-password-hint"></p>
                    <p class="auth__error" bind="passwordError" id="reg-password-error"></p>
                </div>

                <button class="auth__submit" type="submit" bind="submit"></button>
            </form>
        </div>

        <p class="auth__alt">
            <span bind="altPrompt"></span>
            <a class="auth__alt-link" bind="loginLink" href="/login"></a>
        </p>
    </section>
`);

/**
 * Register — IA §3.17.
 *
 * Email, display name, password, and nothing else. In particular there is no
 * Teacher/Student question: IA §1 has no account mode, and asking would invent
 * a product concept that does not exist. Capability follows from Relations, and
 * the email keyed here is what an invitation matches against.
 */
export class RegisterComponent extends Component {
    static styles = authStyles;

    private svc = this.inject(RegisterService);
    private router = this.inject(Router);

    /**
     * Same reason as `LoginComponent`: `RegisterService.error` is a singleton
     * that outlives the view, so a duplicate-email conflict from an earlier
     * visit would greet the next one over an empty form. See that constructor
     * for why this is not in `onMount()`.
     */
    constructor() {
        super();
        this.svc.error.set(null);
    }

    /**
     * The destination carried across from /login, validated. See
     * `LoginComponent.returnTo` for why this is read once at construction.
     *
     * Registering is a way INTO the app like any other, so a deep link that
     * sent someone here has the same claim on being honoured. Losing it on the
     * hop between the two forms would make the round trip through /register the
     * one path where the mechanism quietly does not work.
     */
    private returnTo = returnToFrom(this.router.search.peek());

    private email = '';
    private displayName = '';
    private password = '';
    private fieldErrors = new Signal<FieldErrors<RegisterField>>({});
    private submitted = false;
    private inputs: Partial<Record<RegisterField, HTMLInputElement>> = {};

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            wordmark: { textContent: () => t('app.brand') },
            title: { textContent: () => t('auth.register.title') },
            lede: { textContent: () => t('auth.register.lede') },

            // Authored Swedish per code — the duplicate-email conflict of
            // IA §3.17 included. The raw server message is never shown.
            alert: {
                className: () => this.svc.error.get() ? 'auth__alert is-shown' : 'auth__alert',
                textContent: () => {
                    const err = this.svc.error.get();
                    return err ? t(registerErrorKey(err)) : '';
                },
            },

            form: { onsubmit: (e: Event) => void this.onSubmit(e) },

            emailLabel: { textContent: () => t('auth.field.email') },
            emailHint: { textContent: () => t('auth.hint.email') },
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

            displayNameLabel: { textContent: () => t('auth.field.displayName') },
            displayNameHint: { textContent: () => t('auth.hint.displayName') },
            displayNameField: { className: () => this.fieldClass('displayName') },
            displayName: {
                'aria-invalid': () => String(this.fieldErrors.get().displayName !== undefined),
                oninput: (e: Event) => {
                    this.displayName = (e.target as HTMLInputElement).value;
                    this.revalidate();
                },
            },
            displayNameError: {
                className: () => this.errorClass('displayName'),
                textContent: () => message(this.fieldErrors.get().displayName),
            },

            passwordLabel: { textContent: () => t('auth.field.password') },
            passwordHint: { textContent: () => t('auth.hint.password') },
            passwordField: { className: () => this.fieldClass('password') },
            password: {
                minlength: MIN_PASSWORD_LENGTH,
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
                textContent: () => this.svc.loading.get()
                    ? t('auth.register.submitting')
                    : t('auth.register.submit'),
            },

            altPrompt: { textContent: () => `${t('auth.register.altPrompt')} ` },
            loginLink: {
                textContent: () => t('auth.register.altLink'),
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate(withReturnTo('/login', this.returnTo ?? ''), true);
                },
            },
        });

        this.inputs = {
            email: this.ref(frag, 'email') as HTMLInputElement,
            displayName: this.ref(frag, 'displayName') as HTMLInputElement,
            password: this.ref(frag, 'password') as HTMLInputElement,
        };
        return frag;
    }

    private fieldClass(field: RegisterField): string {
        return this.fieldErrors.get()[field] ? 'auth__field is-invalid' : 'auth__field';
    }

    private errorClass(field: RegisterField): string {
        return this.fieldErrors.get()[field] ? 'auth__error is-shown' : 'auth__error';
    }

    private revalidate(): void {
        if (!this.submitted) return;
        this.fieldErrors.set(this.validate());
    }

    private validate(): FieldErrors<RegisterField> {
        return validateRegister({
            email: this.email,
            displayName: this.displayName,
            password: this.password,
        });
    }

    private async onSubmit(e: Event): Promise<void> {
        e.preventDefault();
        this.submitted = true;
        const errors = this.validate();
        this.fieldErrors.set(errors);
        if (!isValid(errors)) {
            const order: RegisterField[] = ['email', 'displayName', 'password'];
            this.inputs[order.find((f) => errors[f])!]?.focus();
            return;
        }
        const ok = await this.svc.register({
            email: this.email.trim(),
            password: this.password,
            displayName: this.displayName.trim(),
        });
        if (ok) this.router.navigate(this.returnTo ?? HOME_ROUTE, true);
    }
}
