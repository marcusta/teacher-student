import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { GoalsService } from './goals.service';
import { calendarDate, targetDateLabel } from './goal-copy';

const tpl = template(`
    <form class="new-goal" bind="form">
        <a bind="back" href="/mal" class="new-goal__back"></a>
        <h1 bind="heading" class="new-goal__title"></h1>

        <div class="new-goal__panel">
            <label class="new-goal__field">
                <span bind="titleLabel" class="new-goal__label"></span>
                <input bind="titleInput" type="text" maxlength="200" class="new-goal__input" required>
                <span bind="titleHint" class="new-goal__hint"></span>
                <span bind="titleError" class="new-goal__field-error" role="alert"></span>
            </label>

            <label class="new-goal__field">
                <span bind="descLabel" class="new-goal__label"></span>
                <textarea bind="descInput" rows="4" maxlength="5000" class="new-goal__textarea"></textarea>
                <span bind="descHint" class="new-goal__hint"></span>
            </label>

            <label class="new-goal__field">
                <span bind="targetLabel" class="new-goal__label"></span>
                <input bind="targetInput" type="date" class="new-goal__input">
                <span bind="targetHint" class="new-goal__hint"></span>
                <span bind="targetError" class="new-goal__field-error" role="alert"></span>
            </label>

            <p bind="error" class="new-goal__error" role="alert"></p>

            <div class="new-goal__actions">
                <button bind="submit" type="submit" class="new-goal__submit"></button>
                <button bind="cancel" type="button" class="new-goal__cancel"></button>
            </div>
        </div>
    </form>
`);

/**
 * Nytt mål — IA §3.13 "Create Goal", on its own route at `/mal/nytt`.
 *
 * Three fields, in the order the domain reads them: what you are training
 * towards, what that means concretely, and when you mean to get there. Only the
 * title is required — `CreateGoalInput` marks the rest optional, and a goal
 * without a date is still a goal.
 *
 * **Nothing about Plans or sharing lives here.** §3.13's creation step is the
 * Goal itself; attaching Plans and choosing which Teachers may read it are
 * §3.14 detail actions. Putting them in the create form would ask for two trust
 * decisions before the thing they apply to exists, and each is a separate
 * server call — so a combined form could only report a partial success.
 * Creation is one call, and therefore one honest outcome.
 *
 * **The target date is validated at the field.** The server rejects a
 * non-calendar date outright (`assertCalendarDate`), so 2026-02-30 is caught
 * here first — `<input type="date">` will not normally produce one, but a
 * keyboard-entered value in some browsers can.
 */
export class GoalCreateComponent extends Component {
    static styles = `
        .new-goal {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .new-goal__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .new-goal__title {
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
            & .new-goal__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .new-goal__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .new-goal__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }

            & .new-goal__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .new-goal__hint:empty { display: none; }

            /* Field-level error: sits under its own input, names the fix. */
            & .new-goal__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .new-goal__field-error:empty { display: none; }

            & .new-goal__input, & .new-goal__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .new-goal__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .new-goal__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .new-goal__actions {
                display: flex;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .new-goal__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .new-goal__cancel { ${btn(token('radius-sm'), 'ghost')} }

            @media (max-width: 639px) {
                & .new-goal__actions { flex-direction: column; align-items: stretch; }
                & .new-goal__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private goals = this.inject(GoalsService);
    private toasts = this.inject(ToastService);

    private titleVal = new Signal('');
    private descVal = new Signal('');
    private targetVal = new Signal('');
    /** Set only after a submit attempt, so the form does not scold while typing. */
    private titleTouched = new Signal(false);

    private targetInvalid = new Computed(() => {
        const value = this.targetVal.get();
        return value !== '' && calendarDate(value) === null;
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            // `router.link` also binds an active-link `className`, which would
            // overwrite the class this element is styled by. Only the click
            // handler is wanted here.
            back: {
                onclick: this.router.link('/mal').onclick,
                textContent: () => t('goal.back'),
            },
            heading: { textContent: () => t('goalCreate.heading') },

            titleLabel: { textContent: () => t('goalCreate.field.title') },
            titleHint: { textContent: () => t('goalCreate.field.title.hint') },
            titleInput: {
                value: () => this.titleVal.get(),
                'aria-invalid': () => String(
                    this.titleTouched.get() && this.titleVal.get().trim() === ''),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            titleError: {
                textContent: () => this.titleTouched.get() && this.titleVal.get().trim() === ''
                    ? t('goal.error.title') : '',
            },

            descLabel: { textContent: () => t('goalCreate.field.description') },
            descHint: { textContent: () => t('goalCreate.field.description.hint') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },

            targetLabel: { textContent: () => t('goalCreate.field.target') },
            // Reads the date back in the app's own words once it is valid, so
            // the reader sees what the input actually means.
            targetHint: {
                textContent: () => targetDateLabel(this.targetVal.get() || null)
                    ?? t('goalCreate.field.target.hint'),
            },
            targetInput: {
                value: () => this.targetVal.get(),
                'aria-invalid': () => String(this.targetInvalid.get()),
                oninput: (e: Event) => this.targetVal.set((e.target as HTMLInputElement).value),
            },
            targetError: {
                textContent: () => this.targetInvalid.get() ? t('goal.error.target') : '',
            },

            error: {
                textContent: () => this.goals.error.get() ? t('goal.saveError') : '',
            },
            submit: {
                textContent: () => t('goalCreate.submit'),
                disabled: () => this.goals.loading.get() || this.targetInvalid.get(),
            },
            cancel: {
                textContent: () => t('goalCreate.cancel'),
                onclick: () => this.router.navigate('/mal'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });

        return frag;
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const title = this.titleVal.get().trim();
        this.titleTouched.set(true);
        if (!title) return;
        if (this.targetInvalid.get()) return;

        const description = this.descVal.get().trim();
        const targetDate = this.targetVal.get();

        // One call, one outcome: `POST /goals` takes everything this form
        // collects, so there is no follow-up write that could fail behind a
        // success message.
        const created = await this.goals.create({
            title,
            ...(description ? { description } : {}),
            ...(targetDate ? { targetDate } : {}),
        });
        if (!created) return;

        this.toasts.show({ message: t('goalCreate.created'), variant: 'success' });
        // Land on the thing that was just made: the next moves after writing a
        // Goal — attaching it to a Plan, sharing it with a coach — all live on
        // the detail view.
        this.router.navigate(`/mal/${created.id}`);
    }
}
