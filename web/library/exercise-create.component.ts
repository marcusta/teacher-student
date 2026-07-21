import { Component, Router, Signal, template } from '@basics/core/client/core';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { LibraryService } from './library.service';

const tpl = template(`
    <form class="ex-create" bind="form">
        <a bind="back" href="/library" class="ex-create__back"></a>
        <h1 bind="heading" class="ex-create__title"></h1>

        <div class="ex-create__panel">
            <label class="ex-create__field">
                <span bind="nameLabel" class="ex-create__label"></span>
                <input bind="nameInput" type="text" maxlength="200" class="ex-create__input" required>
                <span bind="nameHint" class="ex-create__hint"></span>
                <span bind="nameError" class="ex-create__field-error" role="alert"></span>
            </label>

            <label class="ex-create__field">
                <span bind="descLabel" class="ex-create__label"></span>
                <textarea bind="descInput" rows="5" maxlength="4000" class="ex-create__textarea"></textarea>
                <span bind="descHint" class="ex-create__hint"></span>
            </label>

            <p bind="error" class="ex-create__error" role="alert"></p>

            <div class="ex-create__actions">
                <button bind="submit" type="submit" class="ex-create__submit"></button>
                <button bind="cancel" type="button" class="ex-create__cancel"></button>
            </div>
        </div>
    </form>
`);

/**
 * Ny övning — IA §3.5 creation, on its own route at `/library/nytt`.
 *
 * Creation moved off the list for the reason §1 gives: a form sitting above the
 * rows makes the destination about writing when it is about finding. One call,
 * one outcome — `POST /exercises` takes both fields, so there is no follow-up
 * write that could fail behind a success message.
 */
export class ExerciseCreateComponent extends Component {
    static styles = `
        .ex-create {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .ex-create__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .ex-create__title {
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
            & .ex-create__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .ex-create__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .ex-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }

            & .ex-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }

            & .ex-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .ex-create__field-error:empty { display: none; }

            & .ex-create__input, & .ex-create__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .ex-create__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .ex-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .ex-create__actions {
                display: flex;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            & .ex-create__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Avbryt leaves without writing anything; it must not read as a
               second offer beside the one action that creates the exercise. */
            & .ex-create__cancel { ${btn(token('radius-sm'), 'ghost')} }

            @media (max-width: 639px) {
                & .ex-create__actions { flex-direction: column; align-items: stretch; }
                & .ex-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LibraryService);
    private toasts = this.inject(ToastService);

    private nameVal = new Signal('');
    private descVal = new Signal('');
    /** Set only after a submit attempt, so the form does not scold while typing. */
    private touched = new Signal(false);

    render(): DocumentFragment {
        return this.wire(tpl, {
            // `router.link` also binds an active-link `className`, which would
            // overwrite the class this element is styled by. Only the click
            // handler is wanted here.
            back: {
                onclick: this.router.link('/library').onclick,
                textContent: () => t('exercise.back'),
            },
            heading: { textContent: () => t('exerciseCreate.heading') },

            nameLabel: { textContent: () => t('exerciseCreate.field.name') },
            nameHint: { textContent: () => t('exerciseCreate.field.name.hint') },
            nameInput: {
                value: () => this.nameVal.get(),
                'aria-invalid': () => String(this.touched.get() && this.nameVal.get().trim() === ''),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            nameError: {
                textContent: () => this.touched.get() && this.nameVal.get().trim() === ''
                    ? t('exercise.error.name') : '',
            },

            descLabel: { textContent: () => t('exerciseCreate.field.description') },
            descHint: { textContent: () => t('exerciseCreate.field.description.hint') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },

            error: { textContent: () => this.svc.error.get() ? t('exercise.saveError') : '' },
            submit: {
                textContent: () => t('exerciseCreate.submit'),
                disabled: () => this.svc.loading.get(),
            },
            cancel: {
                textContent: () => t('exerciseCreate.cancel'),
                onclick: () => this.router.navigate('/library'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const name = this.nameVal.get().trim();
        this.touched.set(true);
        if (!name) return;

        const created = await this.svc.create({ name, description: this.descVal.get().trim() });
        if (!created) return;

        this.toasts.show({ message: t('exerciseCreate.created'), variant: 'success' });
        // Land on the thing that was just made: the next move after writing an
        // Exercise — opening its history, correcting the wording — is there.
        this.router.navigate(`/library/${created.id}`);
    }
}
