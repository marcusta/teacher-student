import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { LibraryService } from './library.service';
import { StudentsService } from '../students/students.service';

const tpl = template(`
    <div class="exercise-edit" bind="root">
        <a bind="back" href="/library" class="exercise-edit__back">← Tillbaka</a>
        <h2>Redigera övning</h2>
        <div bind="missing" class="exercise-edit__missing">Övningen kunde inte hittas.</div>
        <section bind="historySection" class="exercise-edit__history">
            <h3>Övningshistorik</h3>
            <p class="exercise-edit__history-hint">Välj elev för att se lektionshistorik.</p>
            <div bind="studentSelectHost" class="exercise-edit__select-host"></div>
            <button bind="historyBtn" type="button">Visa historik</button>
        </section>
        <form bind="form" class="exercise-edit__form">
            <input bind="nameInput" type="text" placeholder="Namn" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning" maxlength="4000" rows="5"></textarea>
            <div class="exercise-edit__row">
                <button bind="submit" type="submit">Spara</button>
                <button bind="del" type="button" class="exercise-edit__delete">Ta bort</button>
                <div class="error" bind="error"></div>
            </div>
        </form>
    </div>
`);

export class ExerciseEditComponent extends Component {
    static styles = `
        .exercise-edit {
            max-width: 720px;

            & .exercise-edit__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .exercise-edit__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};

                & input, & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
                & textarea { font-family: inherit; resize: vertical; }
            }

            & .exercise-edit__row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                & button { ${btn()} }
                & .exercise-edit__delete {
                    background: transparent;
                    color: ${t('error')};
                    border: 1px solid ${t('error')};
                }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .exercise-edit__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .exercise-edit__missing { display: block; }
            &.missing .exercise-edit__form,
            &.missing .exercise-edit__history { display: none; }

            & .exercise-edit__history {
                margin-bottom: ${s('xl')};
                padding-bottom: ${s('lg')};
                border-bottom: 1px solid ${t('border')};

                & h3 { margin: 0 0 ${s('sm')}; font-size: 1rem; }
                & .exercise-edit__history-hint {
                    margin: 0 0 ${s('md')};
                    font-size: 0.875rem;
                    opacity: 0.7;
                }
                & .exercise-edit__select-host { margin-bottom: ${s('sm')}; }
                & button { ${btn()} }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LibraryService);
    private students = this.inject(StudentsService);
    private studentVal = new Signal('');
    private nameVal = new Signal('');
    private descVal = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);

    private studentOptions = new Computed<SelectOption[]>(() =>
        this.students.items.get().map((s) => ({ value: s.id, label: s.displayName })),
    );

    onMount(): void {
        void this.students.load();
        const id = this.router.route.get().split('/')[2] ?? '';
        void this.svc.get(id).then((ex) => {
            if (ex) {
                this.nameVal.set(ex.name);
                this.descVal.set(ex.description);
                this.found.set(true);
            } else {
                this.found.set(false);
            }
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.found.get()
                    ? 'exercise-edit missing' : 'exercise-edit',
            },
            back: this.router.link('/library'),
            nameInput: {
                value: () => this.nameVal.get(),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.nameVal.get().trim();
                    if (!name) return;
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const updated = await this.svc.update(id, {
                        name,
                        description: this.descVal.get(),
                    });
                    if (updated) this.router.navigate('/library');
                },
            },
            del: {
                onclick: async () => {
                    if (!window.confirm('Ta bort övningen?')) return;
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const ok = await this.svc.delete(id);
                    if (ok) this.router.navigate('/library');
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            historyBtn: {
                disabled: () => this.studentVal.get() === '',
                onclick: () => {
                    const studentId = this.studentVal.get();
                    const exerciseId = this.router.route.get().split('/')[2] ?? '';
                    if (!studentId || !exerciseId) return;
                    const from = encodeURIComponent(`/library/${exerciseId}`);
                    this.router.navigate(
                        `/students/${studentId}/exercises/${exerciseId}/history?from=${from}`,
                    );
                },
            },
        });

        this.spawn(SelectComponent, this.ref(frag, 'studentSelectHost'), {
            value: this.studentVal,
            options: this.studentOptions,
            placeholder: '(välj elev)',
        });

        return frag;
    }
}
