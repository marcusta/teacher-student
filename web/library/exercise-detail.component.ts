import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { LibraryService } from './library.service';
import { StudentsService } from '../students/students.service';
import { exerciseHistoryHref } from './library-copy';

const tpl = template(`
    <div class="ex-detail">
        <a bind="back" href="/library" class="ex-detail__back"></a>

        <p bind="loading" class="ex-detail__loading"></p>
        <div bind="missingHost"></div>

        <div bind="body" class="ex-detail__body">
            <header class="ex-detail__head">
                <p bind="eyebrow" class="ex-detail__eyebrow"></p>
                <h1 bind="title" class="ex-detail__title"></h1>
            </header>

            <form bind="form" class="ex-detail__form">
                <div class="ex-detail__panel">
                    <label class="ex-detail__field">
                        <span bind="nameLabel" class="ex-detail__label"></span>
                        <input bind="nameInput" type="text" maxlength="200" class="ex-detail__input" required>
                        <span bind="nameError" class="ex-detail__field-error" role="alert"></span>
                    </label>

                    <label class="ex-detail__field">
                        <span bind="descLabel" class="ex-detail__label"></span>
                        <textarea bind="descInput" rows="5" maxlength="4000" class="ex-detail__textarea"></textarea>
                    </label>

                    <p bind="error" class="ex-detail__error" role="alert"></p>

                    <div class="ex-detail__actions">
                        <button bind="save" type="submit" class="ex-detail__save"></button>
                    </div>
                </div>
            </form>

            <section class="ex-detail__history">
                <h2 bind="historyHeading" class="ex-detail__section-title"></h2>
                <p bind="historyBody" class="ex-detail__section-body"></p>
                <div bind="historyPicker" class="ex-detail__history-picker">
                    <div bind="studentHost" class="ex-detail__control"></div>
                    <button bind="historyOpen" type="button" class="ex-detail__secondary"></button>
                </div>
                <p bind="historyNone" class="ex-detail__section-body"></p>
            </section>

            <section class="ex-detail__danger">
                <h2 bind="dangerHeading" class="ex-detail__danger-title"></h2>
                <p bind="dangerBody" class="ex-detail__section-body"></p>
                <button bind="archive" type="button" class="ex-detail__danger-action"></button>
            </section>
        </div>

        <div bind="confirmHost"></div>
    </div>
`);

/**
 * Bibliotek · Övning — IA §3.5 detail.
 *
 * **The danger area says what actually happens, which is not deletion.**
 * `DELETE /exercises/:id` archives: the handler calls `svc.archive`, and the
 * service's own comment gives the reason — `lesson_exercise` and
 * `training_session_exercise` rows are the record of what was actually ridden,
 * and the Notes hanging off them have no FK to cascade through. So the copy here
 * says the Exercise leaves the library and every picker, and that occasions
 * which already used it keep it, with their notes. The old wording ("Ta bort
 * övningen?") described a hard delete this backend has stopped performing.
 *
 * **Övningshistorik is withheld, not disabled, when there is no Student**
 * (§3.5 detail step 4). A picker with nothing in it and a greyed button is a
 * dead end that explains nothing; a sentence saying history arrives with the
 * first student is the same information without the broken control.
 *
 * "Används i program" (§3.5 step 3) is deliberately absent: the IA marks it a
 * **Backend gap** ("when supported"), and there is no endpoint that answers it.
 * A count this view cannot compute is not rendered as zero.
 */
export class ExerciseDetailComponent extends Component {
    static styles = `
        .ex-detail {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 40rem;
            font-family: ${token('font-ui')};

            & .ex-detail__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .ex-detail__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .ex-detail__loading.hidden { display: none; }

            & .ex-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xl')};
            }
            & .ex-detail__body.hidden { display: none; }

            & .ex-detail__eyebrow {
                margin: 0 0 ${s('xs')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .ex-detail__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }

            /* Section headings are the serif too, one step down (§02). */
            & .ex-detail__section-title, & .ex-detail__danger-title {
                margin: 0 0 ${s('sm')};
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .ex-detail__section-body {
                margin: 0 0 ${s('md')};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .ex-detail__section-body.hidden { display: none; }

            & .ex-detail__form {
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .ex-detail__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .ex-detail__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }
            & .ex-detail__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }
            & .ex-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .ex-detail__field-error:empty { display: none; }

            & .ex-detail__input, & .ex-detail__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .ex-detail__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .ex-detail__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .ex-detail__actions { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            & .ex-detail__save { ${btn(token('radius-sm'), 'primary')} }
            /* Öppna historik is a navigation offer in its own section, not the
               form's action — secondary keeps the single primary unambiguous. */
            & .ex-detail__secondary { ${btn()} }

            & .ex-detail__history-picker {
                display: flex;
                gap: ${s('sm')};
                align-items: center;
                flex-wrap: wrap;
                & > div { flex: 1 1 14rem; }
                & .ui-select { display: block; }
            }
            & .ex-detail__history-picker.hidden { display: none; }

            /* §3.5: the destructive action lives in a SEPARATED area — its own
               surface behind a rule, not another button in the form's row. */
            & .ex-detail__danger {
                padding-top: ${s('lg')};
                border-top: 1px solid ${token('border')};
            }
            & .ex-detail__danger-title { color: ${token('danger')}; }
            & .ex-detail__danger-action { ${btn(token('radius-sm'), 'danger')} }

            @media (max-width: 639px) {
                & .ex-detail__title { font-size: 1.375rem; line-height: 30px; }
                & .ex-detail__history-picker { flex-direction: column; align-items: stretch; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LibraryService);
    private students = this.inject(StudentsService);
    private toasts = this.inject(ToastService);

    private nameVal = new Signal('');
    private descVal = new Signal('');
    private touched = new Signal(false);
    private resolved = new Signal(false);
    private found = new Signal(false);
    private studentVal = new Signal('');
    private confirmArchive = new Signal(false);

    /**
     * The roster behind the Övningshistorik picker (§3.5 detail step 4).
     *
     * Four states, because "you have no students yet" is a claim about the
     * world and only ONE of the three non-ready cases supports it. Reading it
     * off `items.length === 0` alone asserts it while the roster is still in
     * flight and, worse, asserts it when the request failed — a teacher with a
     * full roster and a dropped connection would be told they have no students,
     * with nothing to retry. `resolved` and `error` are what separate them.
     */
    private rosterState = new Computed<'loading' | 'error' | 'none' | 'ready'>(() => {
        if (this.students.error.get() !== null) return 'error';
        if (!this.students.resolved.get()) return 'loading';
        return this.students.items.get().length > 0 ? 'ready' : 'none';
    });

    private hasStudents = new Computed(() => this.rosterState.get() === 'ready');
    private studentOptions = new Computed<SelectOption[]>(() =>
        this.students.items.get().map((st) => ({ value: st.id, label: st.displayName })),
    );

    private get exerciseId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    onMount(): void {
        void this.students.load();
        void this.svc.get(this.exerciseId).then((exercise) => {
            if (exercise) {
                this.nameVal.set(exercise.name);
                this.descVal.set(exercise.description);
                this.found.set(true);
            }
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: this.router.link('/library').onclick,
                textContent: () => t('exercise.back'),
            },
            loading: {
                textContent: () => t('exercise.loading'),
                className: () => this.resolved.get()
                    ? 'ex-detail__loading hidden' : 'ex-detail__loading',
            },
            body: {
                className: () => this.resolved.get() && this.found.get()
                    ? 'ex-detail__body' : 'ex-detail__body hidden',
            },

            eyebrow: { textContent: () => t('exercise.eyebrow') },
            title: { textContent: () => this.nameVal.get() },

            nameLabel: { textContent: () => t('exercise.field.name') },
            nameInput: {
                value: () => this.nameVal.get(),
                'aria-invalid': () => String(this.touched.get() && this.nameVal.get().trim() === ''),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            nameError: {
                textContent: () => this.touched.get() && this.nameVal.get().trim() === ''
                    ? t('exercise.error.name') : '',
            },
            descLabel: { textContent: () => t('exercise.field.description') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            error: { textContent: () => this.svc.error.get() ? t('exercise.saveError') : '' },
            save: {
                textContent: () => t('exercise.save'),
                disabled: () => this.svc.loading.get(),
            },
            form: { onsubmit: (e: Event) => void this.save(e) },

            historyHeading: { textContent: () => t('exercise.history.heading') },
            historyBody: {
                textContent: () => t('exercise.history.body'),
                className: () => this.hasStudents.get()
                    ? 'ex-detail__section-body' : 'ex-detail__section-body hidden',
            },
            // Withheld, not disabled: an empty picker beside a dead button is a
            // control that can only fail.
            historyPicker: {
                className: () => this.hasStudents.get()
                    ? 'ex-detail__history-picker' : 'ex-detail__history-picker hidden',
                inert: () => !this.hasStudents.get(),
            },
            // One paragraph, four different facts — never the roster's failure
            // or its pending state reported as "you have no students".
            historyNone: {
                textContent: () => {
                    switch (this.rosterState.get()) {
                        case 'error': return t('exercise.history.rosterError');
                        case 'loading': return t('exercise.history.rosterLoading');
                        case 'none': return t('exercise.history.noStudents');
                        default: return '';
                    }
                },
                className: () => this.hasStudents.get()
                    ? 'ex-detail__section-body hidden' : 'ex-detail__section-body',
            },
            historyOpen: {
                textContent: () => t('exercise.history.open'),
                disabled: () => this.studentVal.get() === '',
                onclick: () => {
                    const studentId = this.studentVal.get();
                    if (!studentId) return;
                    this.router.navigate(exerciseHistoryHref(studentId, this.exerciseId));
                },
            },

            dangerHeading: { textContent: () => t('exercise.danger.heading') },
            dangerBody: { textContent: () => t('exercise.danger.body') },
            archive: {
                textContent: () => t('exercise.danger.action'),
                onclick: () => this.confirmArchive.set(true),
            },
        });

        this.spawn(SelectComponent, this.ref(frag, 'studentHost'), {
            value: this.studentVal,
            options: this.studentOptions,
            placeholder: t('exercise.history.placeholder'),
        });

        this.buildMissing(this.ref(frag, 'missingHost'));

        // §4.12: a dialog before a change that cannot be taken back, stating the
        // consequence rather than asking "Är du säker?". There is no unarchive
        // endpoint, so an "Ångra" toast would be a promise this view could not
        // keep — see lesson 5 of the previous slices.
        const confirmHost = this.ref(frag, 'confirmHost');
        this.spawn(ConfirmComponent, confirmHost, {
            open: this.confirmArchive,
            title: t('exercise.confirm.archive.title'),
            message: () => t('exercise.confirm.archive.message'),
            confirmLabel: t('exercise.danger.action'),
            cancelLabel: t('exercise.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.archive(),
        });
        // `confirm.ts` keeps its panel mounted and merely transparent when
        // closed, which leaves both buttons in the tab order behind the page.
        // `inert` on the host is what actually takes them out of it.
        this.track(effect(() => {
            confirmHost.inert = !this.confirmArchive.get();
        }));

        return frag;
    }

    /**
     * A missing Exercise and one belonging to another teacher's library resolve
     * identically — the server answers 404 for both, and §3.5 wants exactly that:
     * the view must not reveal that an object it may not read exists.
     */
    private buildMissing(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.resolved.get() && !this.found.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('exercise.notFound.heading'),
                    body: () => t('exercise.notFound.body'),
                    action: {
                        label: () => t('exercise.notFound.action'),
                        onclick: () => this.router.navigate('/library'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private async save(e: Event): Promise<void> {
        e.preventDefault();
        const name = this.nameVal.get().trim();
        this.touched.set(true);
        if (!name) return;
        const updated = await this.svc.update(this.exerciseId, {
            name,
            description: this.descVal.get().trim(),
        });
        if (!updated) return;
        this.toasts.show({ message: t('exercise.saved'), variant: 'success' });
    }

    private async archive(): Promise<void> {
        const ok = await this.svc.archive(this.exerciseId);
        if (!ok) return;
        this.toasts.show({ message: t('exercise.archived'), variant: 'success' });
        this.router.navigate('/library');
    }
}
