import { Component, Router, Signal, template } from '@basics/core/client/core';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { ProgramsService } from './programs.service';

const tpl = template(`
    <form class="pr-create" bind="form">
        <a bind="back" href="/library?flik=program" class="pr-create__back"></a>
        <h1 bind="heading" class="pr-create__title"></h1>

        <div class="pr-create__panel">
            <label class="pr-create__field">
                <span bind="titleLabel" class="pr-create__label"></span>
                <input bind="titleInput" type="text" maxlength="200" class="pr-create__input" required>
                <span bind="titleHint" class="pr-create__hint"></span>
                <span bind="titleError" class="pr-create__field-error" role="alert"></span>
            </label>

            <label class="pr-create__field">
                <span bind="descLabel" class="pr-create__label"></span>
                <textarea bind="descInput" rows="4" maxlength="4000" class="pr-create__textarea"></textarea>
                <span bind="descHint" class="pr-create__hint"></span>
            </label>

            <p bind="snapshot" class="pr-create__note"></p>
            <p bind="error" class="pr-create__error" role="alert"></p>

            <div class="pr-create__actions">
                <button bind="submit" type="submit" class="pr-create__submit"></button>
                <button bind="cancel" type="button" class="pr-create__cancel"></button>
            </div>
        </div>
    </form>
`);

/**
 * Nytt program — IA §3.6 creation, on its own route at `/program/nytt`.
 *
 * Name and description only. The Exercise sequence is the builder's job and
 * cannot be assembled here: every `POST /programs/:id/exercises` is a separate
 * call against a Program that does not exist yet, so a combined form could only
 * ever report a partial success. Creation is one call and therefore one honest
 * outcome; the builder opens immediately afterwards.
 *
 * The snapshot sentence appears here as well as in the builder because this is
 * the first moment a teacher forms a mental model of what a Program *is*.
 */
export class ProgramCreateComponent extends Component {
    static styles = `
        .pr-create {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .pr-create__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .pr-create__title {
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
            & .pr-create__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .pr-create__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .pr-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }
            & .pr-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .pr-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .pr-create__field-error:empty { display: none; }

            & .pr-create__input, & .pr-create__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .pr-create__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }

            /* The snapshot rule sits on the brass hairline — the one place the
               brass is allowed to carry meaning without carrying text (§05). */
            & .pr-create__note {
                margin: 0;
                padding-left: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }

            & .pr-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .pr-create__actions { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            /* §4.8: one primary per form. This is it. */
            & .pr-create__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Avbryt is the ghost tier — not a second bordered button. */
            & .pr-create__cancel { ${btn(token('radius-sm'), 'ghost')} }

            @media (max-width: 639px) {
                & .pr-create__actions { flex-direction: column; align-items: stretch; }
                & .pr-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(ProgramsService);
    private toasts = this.inject(ToastService);

    private titleVal = new Signal('');
    private descVal = new Signal('');
    /** Set only after a submit attempt, so the form does not scold while typing. */
    private touched = new Signal(false);

    render(): DocumentFragment {
        return this.wire(tpl, {
            back: {
                onclick: this.router.link('/library?flik=program').onclick,
                textContent: () => t('program.back'),
            },
            heading: { textContent: () => t('programCreate.heading') },

            titleLabel: { textContent: () => t('programCreate.field.title') },
            titleHint: { textContent: () => t('programCreate.field.title.hint') },
            titleInput: {
                value: () => this.titleVal.get(),
                'aria-invalid': () => String(
                    this.touched.get() && this.titleVal.get().trim() === ''),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            titleError: {
                textContent: () => this.touched.get() && this.titleVal.get().trim() === ''
                    ? t('program.error.title') : '',
            },

            descLabel: { textContent: () => t('programCreate.field.description') },
            descHint: { textContent: () => t('programCreate.field.description.hint') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },

            snapshot: { textContent: () => t('program.snapshot') },
            error: { textContent: () => this.svc.error.get() ? t('program.saveError') : '' },
            submit: {
                textContent: () => t('programCreate.submit'),
                disabled: () => this.svc.loading.get(),
            },
            cancel: {
                textContent: () => t('programCreate.cancel'),
                onclick: () => this.router.navigate('/library?flik=program'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const title = this.titleVal.get().trim();
        this.touched.set(true);
        if (!title) return;

        const created = await this.svc.create({ title, description: this.descVal.get().trim() });
        if (!created) return;

        this.toasts.show({ message: t('programCreate.created'), variant: 'success' });
        // A Program with no Exercises does nothing, so the builder is not an
        // optional next step — it is the rest of this task.
        this.router.navigate(`/program/${created.id}`);
    }
}
