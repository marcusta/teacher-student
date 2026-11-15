import { Component, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input, label, errorText } from '../css';
import { AccountService } from './account.service';
import {
    MIN_PASSWORD_LENGTH,
    changePasswordErrorKey,
    isValid,
    message,
    validateChangePassword,
    type ChangePasswordField,
    type FieldErrors,
} from './account-copy';

const tpl = template(`
    <section class="account" bind="root">
        <h1 class="account__title" bind="title"></h1>
        <p class="account__lede" bind="lede"></p>

        <section class="account__panel">
            <h2 class="account__heading" bind="accountHeading"></h2>
            <div class="account__row">
                <span class="account__row-label" bind="emailLabel"></span>
                <span class="account__row-value" bind="emailValue"></span>
            </div>
        </section>

        <form class="account__panel account__form" bind="form" novalidate>
            <h2 class="account__heading" bind="passwordHeading"></h2>
            <p class="account__panel-lede" bind="passwordLede"></p>

            <p class="account__alert" bind="alert" role="alert"></p>

            <div class="account__field" bind="currentPasswordField">
                <label class="account__label" for="acct-current" bind="currentPasswordLabel"></label>
                <input class="account__input" bind="currentPassword" id="acct-current" type="password"
                    autocomplete="current-password"
                    aria-describedby="acct-current-hint acct-current-error" />
                <p class="account__hint" bind="currentPasswordHint" id="acct-current-hint"></p>
                <p class="account__error" bind="currentPasswordError" id="acct-current-error"></p>
            </div>

            <div class="account__field" bind="newPasswordField">
                <label class="account__label" for="acct-new" bind="newPasswordLabel"></label>
                <input class="account__input" bind="newPassword" id="acct-new" type="password"
                    autocomplete="new-password"
                    aria-describedby="acct-new-hint acct-new-error" />
                <p class="account__hint" bind="newPasswordHint" id="acct-new-hint"></p>
                <p class="account__error" bind="newPasswordError" id="acct-new-error"></p>
            </div>

            <div class="account__field" bind="confirmPasswordField">
                <label class="account__label" for="acct-confirm" bind="confirmPasswordLabel"></label>
                <input class="account__input" bind="confirmPassword" id="acct-confirm" type="password"
                    autocomplete="new-password"
                    aria-describedby="acct-confirm-hint acct-confirm-error" />
                <p class="account__hint" bind="confirmPasswordHint" id="acct-confirm-hint"></p>
                <p class="account__error" bind="confirmPasswordError" id="acct-confirm-error"></p>
            </div>

            <button class="account__submit" type="submit" bind="submit"></button>
        </form>
    </section>
`);

/** Focus and reporting order — the order the fields are read in. */
const FIELD_ORDER: ChangePasswordField[] = ['currentPassword', 'newPassword', 'confirmPassword'];

/**
 * Kontoinställningar — the signed-in account view.
 *
 * Two blocks, and the difference between them is the point. "Konto" is a
 * read-only statement of who you are signed in as; the email is not editable
 * here because it is the identity every invitation and relation is keyed on,
 * and changing it is not a settings toggle. Below it, the one thing this page
 * does: change the password.
 *
 * Success stays on the page. There is nowhere better to send someone who has
 * just confirmed their own password — a navigation would read as "and now
 * you're done with your account", which is not what happened — so the form
 * empties itself and a toast says what changed (design system §4.12).
 */
export class AccountComponent extends Component {
    static styles = `
        .account {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            /* Saving freezes the form without clearing it, same as the auth
               views: the values are what the reader would have to retype. */
            &[inert] { opacity: 0.6; }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .account__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            & .account__lede {
                margin: 0;
                font-size: 14px;
                line-height: 22px;
                color: ${token('text-muted')};
            }

            /*
             * Both blocks are panels, and the form has to be: the §4.8 field
             * recipe fills with --bg — the page-paper colour — so a field
             * rendered straight onto the route would be the same colour as
             * everything behind it. The panel is what the recessed fill is
             * recessed INTO.
             */
            & .account__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .account__heading {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .account__panel-lede {
                margin: 0;
                font-size: 14px;
                line-height: 22px;
                color: ${token('text-muted')};
            }

            /* Read-only fact, not a disabled field: a greyed-out input would
               invite a click that does nothing. */
            & .account__row {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }
            & .account__row-label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text-muted')};
            }
            & .account__row-value {
                font-size: 15px;
                line-height: 24px;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }

            /*
             * Form-level failure — the wrong-current-password conflict included.
             * Body text stays --text rather than --danger: a full sentence in
             * the danger colour on the danger tint is the weakest contrast
             * pairing the palette can produce, and the border plus the tint
             * already carry the signal.
             */
            & .account__alert {
                display: none;
                margin: 0;
                padding: ${s('md')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-sm')};
                background: ${token('danger-soft')};
                font-size: 14px;
                line-height: 22px;
                color: ${token('text')};
            }
            & .account__alert.is-shown { display: block; }

            & .account__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .account__label { ${label()} }

            & .account__input {
                ${input()}
                box-sizing: border-box;
                width: 100%;
                /* 44px of hit target, and 16px so iOS Safari does not zoom. */
                min-height: 44px;
                padding: ${s('sm')} ${s('md')};
                font-size: 16px;
                line-height: 24px;
            }
            /* Invalid is never carried by colour alone — the field also names
               its problem below it, tied to it by aria-describedby. */
            & .account__input[aria-invalid='true'] {
                border-color: ${token('danger')};
            }

            & .account__hint {
                margin: 0;
                font-size: 13px;
                line-height: 20px;
                color: ${token('text-muted')};
            }

            & .account__error {
                ${errorText()}
                display: none;
            }
            & .account__error.is-shown { display: block; }
            /* Once a field states its problem, its hint is redundant noise. */
            & .account__field.is-invalid .account__hint { display: none; }

            /* §4.8: at most one primary button on the page. This is it — there
               is no Avbryt, because there is nothing to cancel out of. */
            & .account__submit {
                ${btn(token('radius-sm'), 'primary')}
                align-self: flex-start;
                min-height: 44px;
                padding: ${s('sm')} ${s('lg')};
                font-size: 15px;
                line-height: 24px;
            }

            @media (max-width: 639px) {
                & .account__title { font-size: 1.375rem; line-height: 30px; }
                & .account__panel { padding: ${s('lg')}; }
                & .account__submit { align-self: stretch; }
            }
        }
    `;

    private svc = this.inject(AccountService);
    private auth = this.inject(AuthService);
    private toasts = this.inject(ToastService);

    /**
     * `AccountService.error` is a DI singleton that outlives this view, so a
     * conflict from an earlier visit would greet the next one over an empty
     * form. Cleared in the constructor rather than in `onMount()` because the
     * bindings are evaluated during `render()`, which runs first — clearing
     * later would paint a stale `role="alert"` for a frame, and announce it.
     */
    constructor() {
        super();
        this.svc.error.set(null);
        // `loading` outlives the view for the same reason, and leaving it set is
        // worse than a stale alert: the root binds `inert` to it, so a submit
        // that was still in flight when the reader clicked a nav link (the
        // sidebar is outside the inert root, so that is one click) would come
        // back to a fresh page that is empty, dimmed, unclickable and reading
        // "Sparar …" until `apiFetch`'s 30-second timeout finally settles it.
        this.svc.loading.set(false);
    }

    private values: Record<ChangePasswordField, Signal<string>> = {
        currentPassword: new Signal(''),
        newPassword: new Signal(''),
        confirmPassword: new Signal(''),
    };
    private fieldErrors = new Signal<FieldErrors<ChangePasswordField>>({});
    /** Set only after a submit attempt, so the form does not scold while typing. */
    private submitted = false;
    private inputs: Partial<Record<ChangePasswordField, HTMLInputElement>> = {};

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            title: { textContent: () => t('account.title') },
            lede: { textContent: () => t('account.lede') },

            accountHeading: { textContent: () => t('account.section.account') },
            emailLabel: { textContent: () => t('account.field.email') },
            // `username` IS the email — the framework's transport field name,
            // not a second identifier (see `web/auth/auth-copy.ts`).
            emailValue: { textContent: () => this.auth.currentUser.get()?.username ?? '' },

            passwordHeading: { textContent: () => t('account.password.title') },
            passwordLede: { textContent: () => t('account.password.lede') },

            // Authored Swedish per code. The raw server message is never shown.
            alert: {
                className: () => this.svc.error.get() ? 'account__alert is-shown' : 'account__alert',
                textContent: () => {
                    const err = this.svc.error.get();
                    return err ? t(changePasswordErrorKey(err)) : '';
                },
            },

            form: { onsubmit: (e: Event) => void this.onSubmit(e) },

            currentPasswordLabel: { textContent: () => t('account.field.currentPassword') },
            currentPasswordHint: { textContent: () => t('account.hint.currentPassword') },
            currentPasswordField: { className: () => this.fieldClass('currentPassword') },
            currentPassword: this.fieldBinding('currentPassword'),
            currentPasswordError: {
                className: () => this.errorClass('currentPassword'),
                textContent: () => message(this.fieldErrors.get().currentPassword),
            },

            newPasswordLabel: { textContent: () => t('account.field.newPassword') },
            newPasswordHint: { textContent: () => t('account.hint.newPassword') },
            newPasswordField: { className: () => this.fieldClass('newPassword') },
            // `minLength`, not `minlength`: `wire()` sends a dash-free key to
            // `el[key] = val`, and the IDL name is the camelCase one. Spelled
            // lowercase it lands as an expando property that reflects to
            // nothing — an attribute that looks live in the source and is
            // absent from the DOM.
            newPassword: { minLength: MIN_PASSWORD_LENGTH, ...this.fieldBinding('newPassword') },
            newPasswordError: {
                className: () => this.errorClass('newPassword'),
                textContent: () => message(this.fieldErrors.get().newPassword),
            },

            confirmPasswordLabel: { textContent: () => t('account.field.confirmPassword') },
            confirmPasswordHint: { textContent: () => t('account.hint.confirmPassword') },
            confirmPasswordField: { className: () => this.fieldClass('confirmPassword') },
            // No `minlength` here: the confirmation's only rule is that it
            // matches, and a length complaint on it would be a second browser
            // opinion about a field that has none of its own.
            confirmPassword: this.fieldBinding('confirmPassword'),
            confirmPasswordError: {
                className: () => this.errorClass('confirmPassword'),
                textContent: () => message(this.fieldErrors.get().confirmPassword),
            },

            submit: {
                textContent: () => this.svc.loading.get()
                    ? t('account.password.submitting')
                    : t('account.password.submit'),
            },
        });

        for (const field of FIELD_ORDER) {
            this.inputs[field] = this.ref(frag, field) as HTMLInputElement;
        }
        return frag;
    }

    /**
     * The value binding is reactive rather than write-only because success
     * EMPTIES the form: clearing the signals is what has to clear the boxes.
     */
    private fieldBinding(field: ChangePasswordField) {
        return {
            value: () => this.values[field].get(),
            'aria-invalid': () => String(this.fieldErrors.get()[field] !== undefined),
            oninput: (e: Event) => {
                this.values[field].set((e.target as HTMLInputElement).value);
                this.revalidate();
            },
        };
    }

    private fieldClass(field: ChangePasswordField): string {
        return this.fieldErrors.get()[field] ? 'account__field is-invalid' : 'account__field';
    }

    private errorClass(field: ChangePasswordField): string {
        return this.fieldErrors.get()[field] ? 'account__error is-shown' : 'account__error';
    }

    private revalidate(): void {
        if (!this.submitted) return;
        this.fieldErrors.set(this.validate());
    }

    private validate(): FieldErrors<ChangePasswordField> {
        return validateChangePassword({
            currentPassword: this.values.currentPassword.get(),
            newPassword: this.values.newPassword.get(),
            confirmPassword: this.values.confirmPassword.get(),
        });
    }

    private async onSubmit(e: Event): Promise<void> {
        e.preventDefault();
        this.submitted = true;
        // The previous attempt's verdict is spent the moment a new one starts.
        // Without this a 409 stays on screen through a locally-rejected submit:
        // the reader fixes the current password, mistypes the confirmation, and
        // is still being told the current password is wrong — about a field
        // that is now right. `request()` clears it on every call that reaches
        // the network; this covers the ones that do not.
        this.svc.error.set(null);
        const errors = this.validate();
        this.fieldErrors.set(errors);
        if (!isValid(errors)) {
            this.inputs[FIELD_ORDER.find((f) => errors[f])!]?.focus();
            return;
        }

        const ok = await this.svc.changePassword({
            currentPassword: this.values.currentPassword.get(),
            newPassword: this.values.newPassword.get(),
        });
        if (!ok) return;

        // Nothing here is worth keeping: the old password is spent, and the new
        // one is already in the reader's password manager or their head.
        this.submitted = false;
        for (const field of FIELD_ORDER) this.values[field].set('');
        this.fieldErrors.set({});
        this.toasts.show({ message: t('account.password.saved'), variant: 'success' });
    }
}
