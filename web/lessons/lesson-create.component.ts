import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { plural, t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { LessonsService } from './lessons.service';
import { StudentsService } from '../students/students.service';
import { ProgramsService } from '../programs/programs.service';
import { bookableHorses, bookablePlans } from './lesson-copy';
import { api, type Horse, type Plan } from '../api';

const tpl = template(`
    <form class="lesson-create" bind="form">
        <a bind="back" href="/lektioner" class="lesson-create__back"></a>
        <h1 bind="heading" class="lesson-create__title"></h1>

        <div class="lesson-create__panel">
            <label class="lesson-create__field">
                <span bind="studentLabel" class="lesson-create__label"></span>
                <div bind="studentHost" class="lesson-create__control"></div>
            </label>

            <label class="lesson-create__field">
                <span bind="whenLabel" class="lesson-create__label"></span>
                <input bind="whenInput" type="datetime-local" class="lesson-create__input" required>
            </label>

            <label class="lesson-create__field">
                <span bind="horseLabel" class="lesson-create__label"></span>
                <div bind="horseHost" class="lesson-create__control"></div>
                <span bind="horseHint" class="lesson-create__hint"></span>
            </label>

            <label class="lesson-create__field">
                <span bind="planLabel" class="lesson-create__label"></span>
                <div bind="planHost" class="lesson-create__control"></div>
                <span bind="planHint" class="lesson-create__hint"></span>
            </label>

            <label class="lesson-create__field">
                <span bind="programLabel" class="lesson-create__label"></span>
                <div bind="programHost" class="lesson-create__control"></div>
                <span bind="programHint" class="lesson-create__hint"></span>
            </label>

            <p bind="error" class="lesson-create__error" role="alert"></p>

            <div class="lesson-create__actions">
                <button bind="submit" type="submit" class="lesson-create__submit"></button>
                <button bind="cancel" type="button" class="lesson-create__cancel"></button>
            </div>
        </div>
    </form>
`);

/** `<input type="datetime-local">` gives local wall time with no zone. */
function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
}

/**
 * Boka lektion — IA §3.7 "Creation", on its own route at `/lektioner/ny`.
 *
 * The field order is the specification's, and it is a dependency order rather
 * than a preference: Horse comes from the chosen Student's stable and Plan from
 * that Student's plans, so neither can be offered before step 1 is answered.
 * Both pickers therefore stay empty and disabled until a Student is chosen, and
 * both reset when the Student changes — a horse belonging to the previous
 * student is not a valid answer to the new question.
 *
 * Programs is the one multi-value field (`SelectComponent`'s `multiple` mode),
 * and its hint is load-bearing rather than decorative: attaching a Program
 * **copies** its Exercises into this Lesson. The Lesson does not follow the
 * Program afterwards, and IA §3.7 asks for that to be stated at the point of
 * choosing, not discovered later when an edited Program fails to change a
 * lesson taught last month.
 *
 * There is no title or description field: `INFORMATION_ARCHITECTURE.md` makes
 * step 6 conditional on the contract retaining one, and the `lessons` table has
 * neither column. Offering a title that cannot be stored would be worse than
 * omitting it.
 */
export class LessonCreateComponent extends Component {
    static styles = `
        .lesson-create {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .lesson-create__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .lesson-create__title {
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
            & .lesson-create__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .lesson-create__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .lesson-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }

            & .lesson-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }

            & .lesson-create__input {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }

            & .lesson-create__control .ui-select { display: block; }

            & .lesson-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .lesson-create__actions {
                display: flex;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .lesson-create__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .lesson-create__cancel { ${btn(token('radius-sm'), 'ghost')} }

            /* UI_DECISIONS §6: single column below 640px. The form is already
               one column, so only the action row needs to stack. */
            @media (max-width: 639px) {
                & .lesson-create__actions { flex-direction: column; align-items: stretch; }
                & .lesson-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private lessons = this.inject(LessonsService);
    private students = this.inject(StudentsService);
    private programs = this.inject(ProgramsService);
    private toasts = this.inject(ToastService);

    private studentVal = new Signal('');
    private whenVal = new Signal('');
    private horseVal = new Signal('');
    private planVal = new Signal('');
    private programVals = new Signal<string[]>([]);
    private horses = new Signal<Horse[]>([]);
    private plans = new Signal<Plan[]>([]);
    private validation = new Signal('');
    /** Steps 3 and 4 are unanswerable until step 1 is (IA §3.7 field order). */
    private needsStudent = new Computed(() => this.studentVal.get() === '');

    private studentOptions = new Computed<SelectOption[]>(() =>
        this.students.items.get().map((st) => ({ value: st.id, label: st.displayName })),
    );
    private horseOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('lesson.horse.none') },
        ...bookableHorses(this.horses.get()).map((h) => ({ value: h.id, label: h.name })),
    ]);
    private planOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('lesson.plan.none') },
        ...bookablePlans(this.plans.get()).map((p) => ({ value: p.id, label: p.title })),
    ]);
    private programOptions = new Computed<SelectOption[]>(() =>
        this.programs.items.get().map((p) => ({ value: p.id, label: p.title })),
    );

    onMount(): void {
        // `?elev=<id>` preselects the Student. `student-detail.component.ts`
        // emits it from **Boka lektion**, which until now landed here with an
        // empty picker — the teacher had to re-pick the student they had just
        // been looking at.
        //
        // Setting the signal is most of the fix: the Horse and Plan pickers
        // already hang off `studentVal` through the effect below, so they
        // populate exactly as they would after a manual choice.
        const preselected = this.router.query('elev').peek();
        if (preselected) this.studentVal.set(preselected);

        // The rest of the fix is degrading an id that is not ours. An unchecked
        // one would sit invisibly in the signal — `SelectComponent` would show
        // the placeholder because nothing matches, so the form would LOOK empty
        // while submitting a foreign studentId for the server to reject. Once
        // the roster is in, a value not on it is dropped and the form is simply
        // back to its initial "no student chosen" state.
        void this.students.load().then(() => {
            const chosen = this.studentVal.peek();
            if (chosen && !this.students.items.peek().some((st) => st.id === chosen)) {
                this.studentVal.set('');
            }
        });
        void this.programs.load();

        // Steps 3 and 4 depend on step 1. Changing the Student invalidates both
        // answers, so they are cleared here rather than left pointing at the
        // previous student's stable.
        this.track(effect(() => {
            const studentId = this.studentVal.get();
            this.horseVal.set('');
            this.planVal.set('');
            if (!studentId) {
                this.horses.set([]);
                this.plans.set([]);
                return;
            }
            void Promise.all([
                api.students.listHorses({ id: studentId }),
                api.students.listPlans({ id: studentId }),
            ]).then(([horses, plans]) => {
                // A slower response for a student the user has moved on from
                // must not overwrite the current one.
                if (this.studentVal.get() !== studentId) return;
                this.horses.set(horses);
                this.plans.set(plans);
            }).catch(() => {
                if (this.studentVal.get() !== studentId) return;
                this.horses.set([]);
                this.plans.set([]);
            });
        }));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            // `router.link` also binds an active-link `className`, which would
            // overwrite the class this element is styled by. Only the click
            // handler is wanted here.
            back: {
                onclick: this.router.link('/lektioner').onclick,
                textContent: () => t('lesson.back'),
            },
            heading: { textContent: () => t('lessonCreate.heading') },
            studentLabel: { textContent: () => t('lessonCreate.field.student') },
            whenLabel: { textContent: () => t('lessonCreate.field.when') },
            horseLabel: { textContent: () => t('lessonCreate.field.horse') },
            horseHint: { textContent: () => t('lessonCreate.field.horse.hint') },
            planLabel: { textContent: () => t('lessonCreate.field.plan') },
            planHint: { textContent: () => t('lessonCreate.field.plan.hint') },
            programLabel: { textContent: () => t('lessonCreate.field.programs') },
            programHint: { textContent: () => t('lessonCreate.field.programs.hint') },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            error: {
                textContent: () => this.validation.get() || (this.lessons.error.get() ? t('lessons.error') : ''),
            },
            submit: {
                textContent: () => t('lessonCreate.submit'),
                disabled: () => this.lessons.loading.get(),
            },
            cancel: {
                textContent: () => t('lessonCreate.cancel'),
                onclick: () => this.router.navigate('/lektioner'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });

        this.spawn(SelectComponent, this.ref(frag, 'studentHost'), {
            value: this.studentVal,
            options: this.studentOptions,
            placeholder: t('lessonCreate.field.student.placeholder'),
        });
        this.spawn(SelectComponent, this.ref(frag, 'horseHost'), {
            value: this.horseVal,
            options: this.horseOptions,
            disabled: this.needsStudent,
        });
        this.spawn(SelectComponent, this.ref(frag, 'planHost'), {
            value: this.planVal,
            options: this.planOptions,
            disabled: this.needsStudent,
        });
        this.spawn(SelectComponent, this.ref(frag, 'programHost'), {
            multiple: true,
            values: this.programVals,
            options: this.programOptions,
            placeholder: t('lessonCreate.field.programs.placeholder'),
            countLabel: (n: number) => plural('lessonCreate.programsCount', n),
        });

        return frag;
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const studentId = this.studentVal.get();
        const when = this.whenVal.get();
        // Field validation states which field, and what to do about it (IA §4).
        if (!studentId) return this.validation.set(t('lessonCreate.error.student'));
        if (!when) return this.validation.set(t('lessonCreate.error.when'));
        this.validation.set('');

        const horseId = this.horseVal.get();
        const planId = this.planVal.get();
        const created = await this.lessons.create({
            studentId,
            scheduledAt: fromLocalInput(when),
            ...(planId ? { planId } : {}),
            ...(horseId ? { horseId } : {}),
            programIds: this.programVals.get(),
        });
        if (!created) return;

        // The Lesson exists either way. When a follow-up attach/PATCH failed it
        // is booked but missing a Program or the Horse, and saying so is what
        // makes it recoverable — both are fixable from the detail view we are
        // about to land on.
        this.toasts.show(created.incomplete
            ? { message: t('lessonCreate.createdPartial'), variant: 'error', duration: 8000 }
            : { message: t('lessonCreate.created'), variant: 'success' });
        // Land on the thing that was just made, not back on the list: the next
        // thing a teacher does with a booked lesson is fill it in.
        this.router.navigate(`/lektioner/${created.lesson.id}`);
    }
}
