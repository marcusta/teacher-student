import { Component, Router, Signal, template } from '@basics/core/client/core';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { StableService } from './stable.service';

const tpl = template(`
    <form class="horse-create" bind="form">
        <a bind="back" href="/hastar" class="horse-create__back"></a>
        <h1 bind="heading" class="horse-create__title"></h1>

        <div class="horse-create__panel">
            <label class="horse-create__field">
                <span bind="nameLabel" class="horse-create__label"></span>
                <input bind="nameInput" type="text" maxlength="200" class="horse-create__input" required>
                <span bind="nameHint" class="horse-create__hint"></span>
                <span bind="nameError" class="horse-create__field-error" role="alert"></span>
            </label>

            <p bind="error" class="horse-create__error" role="alert"></p>

            <div class="horse-create__actions">
                <button bind="submit" type="submit" class="horse-create__submit"></button>
                <button bind="cancel" type="button" class="horse-create__cancel"></button>
            </div>
        </div>
    </form>
`);

/**
 * Lägg till häst — IA §3.15, on its own route at `/hastar/nytt`.
 *
 * One field, and that is the whole domain: a Horse is a name owned by a Student.
 * It moved off the list for the reason §1 gives — creation must not dominate a
 * retrieval view — and because the list's empty state needs somewhere to send
 * its single action.
 */
export class HorseCreateComponent extends Component {
    static styles = `
        .horse-create {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .horse-create__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .horse-create__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .horse-create__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .horse-create__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .horse-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }
            & .horse-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .horse-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .horse-create__field-error:empty { display: none; }

            & .horse-create__input {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }

            & .horse-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .horse-create__actions { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            & .horse-create__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Avbryt walks away from the form; it must not read as a second
               offer beside the one action that saves the horse. */
            & .horse-create__cancel { ${btn(token('radius-sm'), 'ghost')} }

            @media (max-width: 639px) {
                & .horse-create__actions { flex-direction: column; align-items: stretch; }
                & .horse-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(StableService);
    private toasts = this.inject(ToastService);

    private nameVal = new Signal('');
    /** Set only after a submit attempt, so the form does not scold while typing. */
    private touched = new Signal(false);

    render(): DocumentFragment {
        return this.wire(tpl, {
            // `router.link` also binds an active-link `className`, which would
            // overwrite the class this element is styled by. Only the click
            // handler is wanted here.
            back: {
                onclick: this.router.link('/hastar').onclick,
                textContent: () => t('horse.back'),
            },
            heading: { textContent: () => t('horseCreate.heading') },
            nameLabel: { textContent: () => t('horseCreate.field.name') },
            nameHint: { textContent: () => t('horseCreate.field.name.hint') },
            nameInput: {
                value: () => this.nameVal.get(),
                'aria-invalid': () => String(this.touched.get() && this.nameVal.get().trim() === ''),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            nameError: {
                textContent: () => this.touched.get() && this.nameVal.get().trim() === ''
                    ? t('horse.error.name') : '',
            },
            error: { textContent: () => this.svc.error.get() ? t('horse.saveError') : '' },
            submit: {
                textContent: () => t('horseCreate.submit'),
                disabled: () => this.svc.loading.get(),
            },
            cancel: {
                textContent: () => t('horseCreate.cancel'),
                onclick: () => this.router.navigate('/hastar'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const name = this.nameVal.get().trim();
        this.touched.set(true);
        if (!name) return;

        const created = await this.svc.create({ name });
        if (!created) return;

        this.toasts.show({ message: t('horseCreate.created'), variant: 'success' });
        // Back to the stable, not to the horse: a Horse has one editable field,
        // so its detail page has nothing to offer immediately after creation.
        // The list is where the next horse gets added.
        this.router.navigate('/hastar');
    }
}
