import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { ProgramsService } from './programs.service';
import type { Exercise, ProgramExerciseRef } from '../api';

const tpl = template(`
    <div class="program-edit" bind="root">
        <a bind="back" href="/program" class="program-edit__back">← Tillbaka</a>
        <h2>Redigera program</h2>
        <div bind="missing" class="program-edit__missing">Programmet kunde inte hittas.</div>
        <form bind="form" class="program-edit__form">
            <input bind="titleInput" type="text" placeholder="Namn" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning" maxlength="4000" rows="5"></textarea>
            <div class="program-edit__row">
                <button bind="submit" type="submit">Spara</button>
                <button bind="del" type="button" class="program-edit__delete">Ta bort</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <section bind="exercisesSection" class="program-edit__exercises">
            <h3>Övningar</h3>
            <div bind="exercisesEmpty" class="program-edit__exercises-empty">Inga övningar i programmet än.</div>
            <ol bind="exercisesList" class="program-edit__exercises-list"></ol>

            <form bind="addForm" class="program-edit__add">
                <select bind="picker"></select>
                <button bind="addBtn" type="submit">Lägg till</button>
            </form>
        </section>
    </div>
`);

export class ProgramEditComponent extends Component {
    static styles = `
        .program-edit {
            max-width: 720px;

            & .program-edit__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .program-edit__form {
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

            & .program-edit__row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                & button { ${btn()} }
                & .program-edit__delete {
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

            & .program-edit__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .program-edit__missing { display: block; }
            &.missing .program-edit__form { display: none; }
            &.missing .program-edit__exercises { display: none; }

            & .program-edit__exercises {
                margin-top: ${s('xl')};

                & h3 { margin: 0 0 ${s('md')}; }

                & .program-edit__exercises-empty {
                    padding: ${s('md')};
                    color: ${t('text')};
                    opacity: 0.6;
                    font-size: 0.875rem;
                }
                & .program-edit__exercises-empty.hidden { display: none; }

                & .program-edit__exercises-list {
                    list-style: decimal inside;
                    margin: 0 0 ${s('lg')};
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};

                    & li {
                        padding: ${s('sm')} ${s('md')};
                        background: ${t('surface')};
                        border-radius: ${t('radius')};
                    }
                    & .program-edit__exercise-notes {
                        margin-top: ${s('xs')};
                        font-size: 0.875rem;
                        opacity: 0.75;
                        white-space: pre-wrap;
                    }
                }

                & .program-edit__add {
                    display: flex;
                    gap: ${s('sm')};
                    align-items: center;

                    & select {
                        ${input()}
                        flex: 1;
                    }
                    & button { ${btn()} }
                }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(ProgramsService);
    private titleVal = new Signal('');
    private descVal = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);
    private pickedExerciseId = new Signal<string>('');

    /** Exercises in the teacher's library that are NOT already attached. */
    private pickableExercises = new Computed<Exercise[]>(() => {
        const attached = new Set(this.svc.exercises.get().map((e) => e.id));
        return this.svc.availableExercises.get().filter((e) => !attached.has(e.id));
    });

    private get programId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    onMount(): void {
        const id = this.programId;
        void this.svc.get(id).then((p) => {
            if (p) {
                this.titleVal.set(p.title);
                this.descVal.set(p.description);
                this.found.set(true);
                void this.svc.loadExercises(id);
                void this.svc.loadAvailableExercises();
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
                    ? 'program-edit missing' : 'program-edit',
            },
            back: this.router.link('/program'),
            titleInput: {
                value: () => this.titleVal.get(),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const title = this.titleVal.get().trim();
                    if (!title) return;
                    const updated = await this.svc.update(this.programId, {
                        title,
                        description: this.descVal.get(),
                    });
                    if (updated) this.router.navigate('/program');
                },
            },
            del: {
                onclick: async () => {
                    if (!window.confirm('Ta bort programmet?')) return;
                    const ok = await this.svc.delete(this.programId);
                    if (ok) this.router.navigate('/program');
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            exercisesEmpty: {
                className: () => this.svc.exercises.get().length === 0
                    ? 'program-edit__exercises-empty'
                    : 'program-edit__exercises-empty hidden',
            },
            picker: {
                value: () => this.pickedExerciseId.get(),
                onchange: (e: Event) => this.pickedExerciseId.set((e.target as HTMLSelectElement).value),
            },
            addBtn: {
                disabled: () => this.pickedExerciseId.get() === '' || this.pickableExercises.get().length === 0,
            },
            addForm: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const exerciseId = this.pickedExerciseId.get();
                    if (!exerciseId) return;
                    const ok = await this.svc.addExerciseToProgram(this.programId, exerciseId);
                    if (ok) this.pickedExerciseId.set('');
                },
            },
        });

        // Attached exercises — sort_order in the key so re-orderings (027) re-render rows.
        const listHost = this.ref(frag, 'exercisesList');
        this.$each(
            listHost,
            this.svc.exercises,
            (item) => this.renderExercise(item),
            (item) => `${item.id}:${item.sortOrder}:${item.notes ?? ''}`,
        );

        // Picker options. Recompute when pickableExercises changes.
        const pickerEl = this.ref(frag, 'picker') as HTMLSelectElement;
        this.track(effect(() => {
            const items = this.pickableExercises.get();
            pickerEl.replaceChildren();
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = items.length === 0
                ? 'Inga fler övningar att lägga till'
                : 'Välj övning…';
            pickerEl.appendChild(placeholder);
            for (const ex of items) {
                const opt = document.createElement('option');
                opt.value = ex.id;
                opt.textContent = ex.name;
                pickerEl.appendChild(opt);
            }
            // Reset selection if the previously-picked one is no longer available.
            const current = this.pickedExerciseId.get();
            if (current && !items.some((e) => e.id === current)) {
                this.pickedExerciseId.set('');
            }
        }));

        return frag;
    }

    private renderExercise(item: ProgramExerciseRef): HTMLElement {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = item.name;
        li.appendChild(name);
        if (item.notes) {
            const notes = document.createElement('div');
            notes.className = 'program-edit__exercise-notes';
            notes.textContent = item.notes;
            li.appendChild(notes);
        }
        return li;
    }
}
