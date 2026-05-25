import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { api, type Exercise, type Horse } from '../api';
import { LessonsService } from './lessons.service';

const tpl = template(`
    <div class="lesson-edit" bind="root">
        <a bind="back" href="/lektioner" class="lesson-edit__back">← Tillbaka</a>
        <h2>Redigera lektion</h2>
        <div bind="missing" class="lesson-edit__missing">Lektionen kunde inte hittas.</div>
        <form bind="form" class="lesson-edit__form">
            <label>
                <span>Häst</span>
                <select bind="horseSelect"></select>
            </label>
            <label>
                <span>Tidpunkt</span>
                <input bind="whenInput" type="datetime-local" required>
            </label>
            <div class="lesson-edit__row">
                <button bind="submit" type="submit">Spara</button>
                <button bind="complete" type="button" class="lesson-edit__complete">Markera utförd</button>
                <button bind="cancel" type="button" class="lesson-edit__cancel">Ställ in</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <section bind="exercisesSection" class="lesson-edit__exercises">
            <h3>Övningar</h3>
            <ul bind="exerciseList" class="lesson-edit__ex-list"></ul>
            <div bind="exerciseEmpty" class="lesson-edit__ex-empty">Inga övningar kopplade än.</div>
            <div class="lesson-edit__ex-add">
                <select bind="exerciseSelect"></select>
                <button bind="addExercise" type="button">Lägg till</button>
            </div>
        </section>
    </div>
`);

function toLocalInput(iso: string): string {
    // Convert ISO UTC to "YYYY-MM-DDTHH:mm" in the user's local zone for
    // <input type="datetime-local">.
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
}

export class LessonEditComponent extends Component {
    static styles = `
        .lesson-edit {
            max-width: 720px;

            & .lesson-edit__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .lesson-edit__form {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};

                & label {
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    font-size: 0.875rem;
                }

                & select, & input {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
            }

            & .lesson-edit__row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                & button { ${btn()} }
                & .lesson-edit__cancel {
                    background: transparent;
                    color: ${t('error')};
                    border: 1px solid ${t('error')};
                }
                & .hidden { display: none; }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .lesson-edit__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .lesson-edit__missing { display: block; }
            &.missing .lesson-edit__form { display: none; }
            &.missing .lesson-edit__exercises { display: none; }

            & .lesson-edit__exercises {
                margin-top: ${s('xl')};
                & h3 { margin: 0 0 ${s('sm')}; font-size: 1rem; }
            }

            & .lesson-edit__ex-list {
                list-style: none;
                margin: 0 0 ${s('sm')};
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .lesson-edit__ex-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('sm')};
                padding: ${s('xs')} ${s('sm')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                font-size: 0.875rem;

                & button {
                    background: transparent;
                    border: none;
                    color: ${t('error')};
                    cursor: pointer;
                    font-size: 0.8125rem;
                    &:hover { text-decoration: underline; }
                }
            }

            & .lesson-edit__ex-empty {
                padding: ${s('sm')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .lesson-edit__ex-empty.hidden { display: none; }

            & .lesson-edit__ex-add {
                display: flex;
                gap: ${s('sm')};
                & select {
                    ${input()}
                    flex: 1;
                }
                & button { ${btn()} }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LessonsService);
    private horseVal = new Signal('');
    private whenVal = new Signal('');
    private horses = new Signal<Horse[]>([]);
    private library = new Signal<Exercise[]>([]);
    private exerciseVal = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);

    private terminal(): boolean {
        const id = this.router.route.get().split('/')[2] ?? '';
        const lesson = this.svc.get(id);
        return lesson?.status === 'completed' || lesson?.status === 'cancelled';
    }

    onMount(): void {
        const id = this.router.route.get().split('/')[2] ?? '';
        // Ensure list is loaded so .get() can resolve.
        const ready = this.svc.items.get().length > 0
            ? Promise.resolve()
            : this.svc.load();
        void ready.then(async () => {
            const lesson = this.svc.get(id);
            if (!lesson) {
                this.found.set(false);
                this.resolved.set(true);
                return;
            }
            if (lesson.role !== 'teacher') {
                // Students get the read-only timeline; deny edit access.
                this.found.set(false);
                this.resolved.set(true);
                return;
            }
            this.horseVal.set(lesson.horseId ?? '');
            this.whenVal.set(toLocalInput(lesson.scheduledAt));
            const [horses, library] = await Promise.all([
                api.students.listHorses({ id: lesson.studentId }),
                api.exercises.list(),
            ]);
            this.horses.set(horses);
            this.library.set(library);
            this.found.set(true);
            this.resolved.set(true);
        });
    }

    private currentExercises() {
        const id = this.router.route.get().split('/')[2] ?? '';
        return this.svc.get(id)?.exercises ?? [];
    }

    private unattachedLibrary(): Exercise[] {
        const linked = new Set(this.currentExercises().map((e) => e.id));
        return this.library.get().filter((e) => !linked.has(e.id));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.found.get()
                    ? 'lesson-edit missing' : 'lesson-edit',
            },
            back: this.router.link('/lektioner'),
            horseSelect: {
                value: () => this.horseVal.get(),
                onchange: (e: Event) => this.horseVal.set((e.target as HTMLSelectElement).value),
            },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const lesson = this.svc.get(id);
                    if (!lesson) return;
                    const horseId = this.horseVal.get();
                    const when = this.whenVal.get();
                    const patch: { horseId?: string | null; scheduledAt?: string } = {};
                    if (horseId !== (lesson.horseId ?? '')) {
                        patch.horseId = horseId === '' ? null : horseId;
                    }
                    if (when) {
                        const iso = fromLocalInput(when);
                        if (iso !== lesson.scheduledAt) patch.scheduledAt = iso;
                    }
                    if (Object.keys(patch).length === 0) {
                        this.router.navigate('/lektioner');
                        return;
                    }
                    const updated = await this.svc.update(id, patch);
                    if (updated) this.router.navigate('/lektioner');
                },
            },
            complete: {
                className: () => this.terminal() ? 'lesson-edit__complete hidden' : 'lesson-edit__complete',
                onclick: async () => {
                    const id = this.router.route.get().split('/')[2] ?? '';
                    await this.svc.transition(id, 'completed');
                },
            },
            cancel: {
                className: () => this.terminal() ? 'lesson-edit__cancel hidden' : 'lesson-edit__cancel',
                onclick: async () => {
                    if (!window.confirm('Ställ in lektionen?')) return;
                    const id = this.router.route.get().split('/')[2] ?? '';
                    await this.svc.transition(id, 'cancelled');
                },
            },
            exerciseSelect: {
                value: () => this.exerciseVal.get(),
                onchange: (e: Event) => this.exerciseVal.set((e.target as HTMLSelectElement).value),
            },
            addExercise: {
                onclick: async () => {
                    const exerciseId = this.exerciseVal.get();
                    if (!exerciseId) return;
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const result = await this.svc.addExercise(id, exerciseId);
                    if (result) this.exerciseVal.set('');
                },
            },
            exerciseEmpty: {
                className: () => this.currentExercises().length === 0
                    ? 'lesson-edit__ex-empty' : 'lesson-edit__ex-empty hidden',
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
        });

        // Render the attached-exercises list reactively.
        const exHost = this.ref(frag, 'exerciseList');
        this.track(effect(() => {
            exHost.replaceChildren();
            for (const ex of this.currentExercises()) {
                const li = document.createElement('li');
                li.className = 'lesson-edit__ex-item';
                const label = document.createElement('span');
                label.textContent = ex.name;
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.textContent = 'Ta bort';
                remove.onclick = async () => {
                    const id = this.router.route.get().split('/')[2] ?? '';
                    await this.svc.removeExercise(id, ex.id);
                };
                li.appendChild(label);
                li.appendChild(remove);
                exHost.appendChild(li);
            }
        }));

        // Library dropdown: keep in sync with what's not yet attached. Drop
        // the current selection if it became attached.
        const exSelect = this.ref(frag, 'exerciseSelect') as HTMLSelectElement;
        this.track(effect(() => {
            const available = this.unattachedLibrary();
            exSelect.replaceChildren();
            const none = document.createElement('option');
            none.value = '';
            none.textContent = available.length === 0
                ? '(inga övningar i biblioteket)'
                : '(välj övning)';
            exSelect.appendChild(none);
            for (const ex of available) {
                const opt = document.createElement('option');
                opt.value = ex.id;
                opt.textContent = ex.name;
                exSelect.appendChild(opt);
            }
            if (!available.some((e) => e.id === this.exerciseVal.get())) {
                this.exerciseVal.set('');
            }
            exSelect.value = this.exerciseVal.get();
        }));

        // Populate horse <select> from the loaded list with a clear option.
        const select = this.ref(frag, 'horseSelect') as HTMLSelectElement;
        const renderOptions = () => {
            select.replaceChildren();
            const none = document.createElement('option');
            none.value = '';
            none.textContent = '(ingen häst)';
            select.appendChild(none);
            for (const h of this.horses.get()) {
                const opt = document.createElement('option');
                opt.value = h.id;
                opt.textContent = h.name;
                select.appendChild(opt);
            }
            select.value = this.horseVal.get();
        };
        // The framework's $each is keyed against a Signal; for a one-shot
        // resolve we just re-render whenever horses change.
        this.track(effect(() => {
            this.horses.get();
            this.horseVal.get();
            renderOptions();
        }));

        return frag;
    }
}
