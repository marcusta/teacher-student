import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { PlansService } from './plans.service';
import { TeachersService } from '../training-sessions/teachers.service';
import { dateRangeLabel, isValidRange } from './plan-copy';

const tpl = template(`
    <form class="new-plan" bind="form">
        <a bind="back" href="/planer" class="new-plan__back"></a>
        <h1 bind="heading" class="new-plan__title"></h1>

        <div class="new-plan__panel">
            <label class="new-plan__field">
                <span bind="titleLabel" class="new-plan__label"></span>
                <input bind="titleInput" type="text" maxlength="200" class="new-plan__input" required>
                <span bind="titleError" class="new-plan__field-error" role="alert"></span>
            </label>

            <label class="new-plan__field">
                <span bind="descLabel" class="new-plan__label"></span>
                <textarea bind="descInput" rows="4" maxlength="5000" class="new-plan__textarea"></textarea>
                <span bind="descHint" class="new-plan__hint"></span>
            </label>

            <div class="new-plan__pair">
                <label class="new-plan__field">
                    <span bind="startLabel" class="new-plan__label"></span>
                    <input bind="startInput" type="date" class="new-plan__input">
                </label>
                <label class="new-plan__field">
                    <span bind="endLabel" class="new-plan__label"></span>
                    <input bind="endInput" type="date" class="new-plan__input">
                    <span bind="endError" class="new-plan__field-error" role="alert"></span>
                </label>
            </div>

            <p bind="rangePreview" class="new-plan__hint"></p>

            <label bind="teacherField" class="new-plan__field">
                <span bind="teacherLabel" class="new-plan__label"></span>
                <div bind="teacherHost" class="new-plan__control"></div>
                <span bind="teacherHint" class="new-plan__hint"></span>
            </label>

            <p bind="error" class="new-plan__error" role="alert"></p>

            <div class="new-plan__actions">
                <button bind="submit" type="submit" class="new-plan__submit"></button>
                <button bind="cancel" type="button" class="new-plan__cancel"></button>
            </div>
        </div>
    </form>
`);

/**
 * Ny plan — IA §3.11 "Creation", on its own route at `/planer/ny`.
 *
 * The field order is the specification's: title, description, start/end dates,
 * optional Primary Teacher. It is a narrative order — what is this for, what
 * does it mean, when does it run, and who is coaching it — and nothing depends
 * on an earlier answer, so no field is gated on another.
 *
 * **Only the title is required.** A Plan with no dates is a perfectly good
 * open-ended umbrella, and forcing an end date on it would make the rider
 * invent one. The server agrees: `CreatePlanInput` marks everything but `title`
 * optional.
 *
 * **The date range is validated at the field.** §3.11 says so directly:
 * "Invalid date range is field-level." So an end before the start puts its
 * message under the end-date input, names the start it must clear, and blocks
 * the submit — rather than surfacing as a form-level banner that leaves the
 * reader hunting for which of the two fields is wrong. The server imposes no
 * ordering constraint at all, so this rule exists only here, which is exactly
 * why it lives in the tested `plan-copy` module rather than inline.
 *
 * **Primary Teacher is a label, not a lock.** §3.11 calls it "a label and
 * defaulting convenience, not elevated permission", and the hint under the
 * field says so in words: every connected Teacher can read the Plan regardless.
 * The field disappears entirely when the account has no Teachers — an empty
 * picker asks a question the account cannot answer.
 */
export class PlanCreateComponent extends Component {
    static styles = `
        .new-plan {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .new-plan__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .new-plan__title {
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
            & .new-plan__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .new-plan__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }
            & .new-plan__field.hidden { display: none; }

            & .new-plan__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${s('md')};
            }

            & .new-plan__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }

            & .new-plan__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .new-plan__hint:empty { display: none; }

            /* Field-level error: sits under its own input, names the fix. */
            & .new-plan__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .new-plan__field-error:empty { display: none; }

            & .new-plan__input, & .new-plan__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .new-plan__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .new-plan__control .ui-select { display: block; }

            & .new-plan__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .new-plan__actions {
                display: flex;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .new-plan__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Avbryt is the ghost tier — not a second bordered button. */
            & .new-plan__cancel { ${btn(token('radius-sm'), 'ghost')} }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .new-plan__pair { grid-template-columns: 1fr; }
                & .new-plan__actions { flex-direction: column; align-items: stretch; }
                & .new-plan__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private plans = this.inject(PlansService);
    private teachers = this.inject(TeachersService);
    private toasts = this.inject(ToastService);

    private titleVal = new Signal('');
    private descVal = new Signal('');
    private startVal = new Signal('');
    private endVal = new Signal('');
    private primaryVal = new Signal('');
    /** Set only after a submit attempt, so the form does not scold while typing. */
    private titleTouched = new Signal(false);

    private teacherOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('plan.primaryTeacher.none') },
        ...this.teachers.items.get().map((teacher) => ({
            value: teacher.id,
            label: teacher.displayName,
        })),
    ]);

    /**
     * The range fault, live. Unlike the title's, this one is shown as soon as
     * the pair goes bad rather than waiting for a submit: the reader has just
     * picked two dates and can see both, so naming the conflict immediately is
     * help, not nagging.
     */
    private rangeInvalid = new Computed(() =>
        !isValidRange(this.startVal.get() || null, this.endVal.get() || null));

    onMount(): void {
        void this.teachers.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            // `router.link` also binds an active-link `className`, which would
            // overwrite the class this element is styled by. Only the click
            // handler is wanted here.
            back: {
                onclick: this.router.link('/planer').onclick,
                textContent: () => t('plan.back'),
            },
            heading: { textContent: () => t('planCreate.heading') },

            titleLabel: { textContent: () => t('planCreate.field.title') },
            titleInput: {
                value: () => this.titleVal.get(),
                'aria-invalid': () => String(
                    this.titleTouched.get() && this.titleVal.get().trim() === ''),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            titleError: {
                textContent: () => this.titleTouched.get() && this.titleVal.get().trim() === ''
                    ? t('plan.error.title') : '',
            },

            descLabel: { textContent: () => t('planCreate.field.description') },
            descHint: { textContent: () => t('planCreate.field.description.hint') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },

            startLabel: { textContent: () => t('planCreate.field.start') },
            startInput: {
                value: () => this.startVal.get(),
                oninput: (e: Event) => this.startVal.set((e.target as HTMLInputElement).value),
            },
            endLabel: { textContent: () => t('planCreate.field.end') },
            endInput: {
                value: () => this.endVal.get(),
                'aria-invalid': () => String(this.rangeInvalid.get()),
                oninput: (e: Event) => this.endVal.set((e.target as HTMLInputElement).value),
            },
            endError: {
                // Names the date the new end has to clear, so the fix is stated
                // rather than left as an exercise (IA §4).
                textContent: () => this.rangeInvalid.get()
                    ? t('plan.error.range', { start: this.startVal.get() })
                    : '',
            },
            // Reads the range back in the app's own words, so the reader sees
            // what the two inputs actually mean before committing to them.
            rangePreview: {
                textContent: () => this.rangeInvalid.get()
                    ? ''
                    : dateRangeLabel(this.startVal.get() || null, this.endVal.get() || null) ?? '',
            },

            teacherField: {
                className: () => this.teachers.items.get().length === 0
                    ? 'new-plan__field hidden' : 'new-plan__field',
            },
            teacherLabel: { textContent: () => t('planCreate.field.primaryTeacher') },
            teacherHint: { textContent: () => t('plan.primaryTeacher.hint') },

            error: {
                textContent: () => this.plans.error.get() ? t('plan.saveError') : '',
            },
            submit: {
                textContent: () => t('planCreate.submit'),
                disabled: () => this.plans.loading.get() || this.rangeInvalid.get(),
            },
            cancel: {
                textContent: () => t('planCreate.cancel'),
                onclick: () => this.router.navigate('/planer'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });

        this.spawn(SelectComponent, this.ref(frag, 'teacherHost'), {
            value: this.primaryVal,
            options: this.teacherOptions,
        });

        return frag;
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const title = this.titleVal.get().trim();
        this.titleTouched.set(true);
        if (!title) return;
        if (this.rangeInvalid.get()) return;

        const description = this.descVal.get().trim();
        const startDate = this.startVal.get();
        const endDate = this.endVal.get();
        const primaryTeacherId = this.primaryVal.get();

        // One call, and therefore one honest outcome. `POST /plans` takes every
        // field this form collects, so there is no follow-up write that can fail
        // behind a success message: if this resolves, the Plan is complete.
        const created = await this.plans.create({
            title,
            ...(description ? { description } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
            ...(primaryTeacherId ? { primaryTeacherId } : {}),
        });
        if (!created) return;

        this.toasts.show({ message: t('planCreate.created'), variant: 'success' });
        // Land on the thing that was just made: the next move after creating a
        // Plan is to hang a Goal off it, and that lives on the detail view.
        this.router.navigate(`/planer/${created.id}`);
    }
}
