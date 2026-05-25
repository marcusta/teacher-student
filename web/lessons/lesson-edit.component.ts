import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { api, type Exercise, type Horse } from '../api';
import { LessonsService } from './lessons.service';
import { NotesService } from './notes.service';

const tpl = template(`
    <div class="lesson-edit" bind="root">
        <a bind="back" href="/lektioner" class="lesson-edit__back">← Tillbaka</a>
        <h2 bind="heading">Redigera lektion</h2>
        <div bind="missing" class="lesson-edit__missing">Lektionen kunde inte hittas.</div>

        <section bind="studentSummary" class="lesson-edit__summary">
            <dl>
                <dt>Lärare</dt><dd bind="sumTeacher"></dd>
                <dt>Tidpunkt</dt><dd bind="sumWhen"></dd>
                <dt>Häst</dt><dd bind="sumHorse"></dd>
                <dt>Status</dt><dd bind="sumStatus"></dd>
            </dl>
            <div bind="sumExLabel" class="lesson-edit__summary-ex-label">Övningar</div>
            <ul bind="sumExList" class="lesson-edit__summary-ex-list"></ul>
        </section>

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

        <section bind="notesSection" class="lesson-edit__notes">
            <h3>Anteckningar</h3>
            <ul bind="noteList" class="lesson-edit__note-list"></ul>
            <div bind="noteEmpty" class="lesson-edit__note-empty">Inga anteckningar än.</div>
            <form bind="noteForm" class="lesson-edit__note-form">
                <textarea bind="noteBody" placeholder="Skriv en anteckning…" rows="3"></textarea>
                <div class="lesson-edit__note-row">
                    <label class="lesson-edit__note-vis">
                        <input bind="noteShared" type="checkbox">
                        <span>Delad med eleven</span>
                    </label>
                    <button bind="noteSubmit" type="submit">Spara anteckning</button>
                </div>
                <div class="error" bind="noteError"></div>
            </form>
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
            &.missing .lesson-edit__summary { display: none; }
            &.missing .lesson-edit__notes { display: none; }

            & .lesson-edit__summary { display: none; }
            &.student .lesson-edit__summary { display: block; }
            &.student .lesson-edit__form { display: none; }
            &.student .lesson-edit__exercises { display: none; }

            & .lesson-edit__summary {
                margin-bottom: ${s('lg')};
                & dl {
                    display: grid;
                    grid-template-columns: max-content 1fr;
                    gap: ${s('xs')} ${s('md')};
                    margin: 0 0 ${s('sm')};
                }
                & dt {
                    opacity: 0.7;
                    font-size: 0.8125rem;
                }
                & dd {
                    margin: 0;
                    font-size: 0.875rem;
                }
                & .lesson-edit__summary-ex-label {
                    opacity: 0.7;
                    font-size: 0.8125rem;
                    margin-bottom: ${s('xs')};
                }
                & .lesson-edit__summary-ex-list {
                    list-style: disc inside;
                    margin: 0;
                    padding: 0;
                    font-size: 0.875rem;
                }
                & .lesson-edit__summary-ex-list.hidden { display: none; }
                & .lesson-edit__summary-ex-label.hidden { display: none; }
            }

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

            & .lesson-edit__notes {
                margin-top: ${s('xl')};
                & h3 { margin: 0 0 ${s('sm')}; font-size: 1rem; }
            }
            &.missing .lesson-edit__notes { display: none; }

            & .lesson-edit__note-list {
                list-style: none;
                margin: 0 0 ${s('sm')};
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .lesson-edit__note-item {
                padding: ${s('sm')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                font-size: 0.875rem;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};

                & .lesson-edit__note-meta {
                    display: flex;
                    gap: ${s('sm')};
                    font-size: 0.75rem;
                    opacity: 0.7;
                    align-items: center;
                }

                & .lesson-edit__note-badge {
                    padding: 0 ${s('xs')};
                    border-radius: ${t('radius')};
                    border: 1px solid currentColor;
                    font-size: 0.6875rem;
                }

                & .lesson-edit__note-body {
                    white-space: pre-wrap;
                }

                & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                }

                & .lesson-edit__note-actions {
                    display: flex;
                    gap: ${s('sm')};
                    & button {
                        background: transparent;
                        border: none;
                        color: ${t('text')};
                        opacity: 0.7;
                        cursor: pointer;
                        font-size: 0.8125rem;
                        padding: 0;
                        &:hover { opacity: 1; text-decoration: underline; }
                        &.lesson-edit__note-delete { color: ${t('error')}; opacity: 0.9; }
                    }
                }
            }

            & .lesson-edit__note-empty {
                padding: ${s('sm')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .lesson-edit__note-empty.hidden { display: none; }

            & .lesson-edit__note-form {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                }
            }

            & .lesson-edit__note-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                & button { ${btn()} }
            }

            & .lesson-edit__note-vis {
                display: flex;
                align-items: center;
                gap: ${s('xs')};
                font-size: 0.875rem;
            }
        }
    `;

    private auth = this.inject(AuthService);

    private router = this.inject(Router);
    private svc = this.inject(LessonsService);
    private notes = this.inject(NotesService);
    private horseVal = new Signal('');
    private whenVal = new Signal('');
    private horses = new Signal<Horse[]>([]);
    private library = new Signal<Exercise[]>([]);
    private exerciseVal = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);
    private role = new Signal<'teacher' | 'student' | null>(null);
    private noteBodyVal = new Signal('');
    private noteSharedVal = new Signal(false);
    private editingNoteId = new Signal<string | null>(null);
    private editingBodyVal = new Signal('');
    private editingSharedVal = new Signal(false);

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
            this.role.set(lesson.role);
            void this.notes.load('lesson', id);
            if (lesson.role !== 'teacher') {
                // Student gets a read-only summary + Notes section (018).
                this.found.set(true);
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

    private lessonId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private currentExercises() {
        return this.svc.get(this.lessonId())?.exercises ?? [];
    }

    private unattachedLibrary(): Exercise[] {
        const linked = new Set(this.currentExercises().map((e) => e.id));
        return this.library.get().filter((e) => !linked.has(e.id));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => {
                    if (this.resolved.get() && !this.found.get()) return 'lesson-edit missing';
                    if (this.role.get() === 'student') return 'lesson-edit student';
                    return 'lesson-edit';
                },
            },
            heading: {
                textContent: () => this.role.get() === 'student' ? 'Lektion' : 'Redigera lektion',
            },
            back: this.router.link('/lektioner'),
            sumTeacher: { textContent: () => this.svc.get(this.lessonId())?.counterpartyDisplayName ?? '' },
            sumWhen: { textContent: () => {
                const l = this.svc.get(this.lessonId());
                return l ? new Date(l.scheduledAt).toLocaleString('sv-SE') : '';
            } },
            sumHorse: { textContent: () => this.svc.get(this.lessonId())?.horseName ?? '(ingen)' },
            sumStatus: { textContent: () => {
                const st = this.svc.get(this.lessonId())?.status;
                if (st === 'completed') return 'Utförd';
                if (st === 'cancelled') return 'Inställd';
                return 'Planerad';
            } },
            sumExLabel: {
                className: () => this.currentExercises().length === 0
                    ? 'lesson-edit__summary-ex-label hidden'
                    : 'lesson-edit__summary-ex-label',
            },
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
            noteBody: {
                value: () => this.noteBodyVal.get(),
                oninput: (e: Event) => this.noteBodyVal.set((e.target as HTMLTextAreaElement).value),
            },
            noteShared: {
                checked: () => this.noteSharedVal.get(),
                onchange: (e: Event) => this.noteSharedVal.set((e.target as HTMLInputElement).checked),
            },
            noteForm: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const body = this.noteBodyVal.get().trim();
                    if (!body) return;
                    const ok = await this.notes.create(
                        body,
                        this.noteSharedVal.get() ? 'shared' : 'private',
                    );
                    if (ok) {
                        this.noteBodyVal.set('');
                        this.noteSharedVal.set(false);
                    }
                },
            },
            noteEmpty: {
                className: () => this.notes.items.get().length === 0
                    ? 'lesson-edit__note-empty' : 'lesson-edit__note-empty hidden',
            },
            noteError: { textContent: () => this.notes.error.get()?.message ?? '' },
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

        // Read-only exercises summary (student view).
        const sumExHost = this.ref(frag, 'sumExList');
        this.track(effect(() => {
            const items = this.currentExercises();
            sumExHost.replaceChildren();
            sumExHost.className = items.length === 0
                ? 'lesson-edit__summary-ex-list hidden'
                : 'lesson-edit__summary-ex-list';
            for (const ex of items) {
                const li = document.createElement('li');
                li.textContent = ex.name;
                sumExHost.appendChild(li);
            }
        }));

        // Render notes list reactively.
        const noteHost = this.ref(frag, 'noteList');
        this.track(effect(() => {
            const me = this.auth.currentUser.get()?.id;
            const editing = this.editingNoteId.get();
            const items = this.notes.items.get();
            noteHost.replaceChildren();
            for (const note of items) {
                const li = document.createElement('li');
                li.className = 'lesson-edit__note-item';

                const meta = document.createElement('div');
                meta.className = 'lesson-edit__note-meta';
                const who = document.createElement('span');
                who.textContent = note.authorDisplayName;
                const when = document.createElement('span');
                when.textContent = new Date(note.createdAt).toLocaleString('sv-SE');
                const badge = document.createElement('span');
                badge.className = 'lesson-edit__note-badge';
                badge.textContent = note.visibility === 'shared' ? 'Delad' : 'Prep';
                meta.append(who, when, badge);
                li.appendChild(meta);

                if (editing === note.id) {
                    const ta = document.createElement('textarea');
                    ta.rows = 3;
                    ta.value = this.editingBodyVal.get();
                    ta.oninput = (e) => this.editingBodyVal.set((e.target as HTMLTextAreaElement).value);
                    li.appendChild(ta);

                    const visLabel = document.createElement('label');
                    visLabel.className = 'lesson-edit__note-vis';
                    const visCb = document.createElement('input');
                    visCb.type = 'checkbox';
                    visCb.checked = this.editingSharedVal.get();
                    visCb.onchange = (e) => this.editingSharedVal.set((e.target as HTMLInputElement).checked);
                    const visTxt = document.createElement('span');
                    visTxt.textContent = 'Delad med eleven';
                    visLabel.append(visCb, visTxt);
                    li.appendChild(visLabel);

                    const actions = document.createElement('div');
                    actions.className = 'lesson-edit__note-actions';
                    const save = document.createElement('button');
                    save.type = 'button';
                    save.textContent = 'Spara';
                    save.onclick = async () => {
                        const body = this.editingBodyVal.get().trim();
                        if (!body) return;
                        const ok = await this.notes.update(note.id, {
                            body,
                            visibility: this.editingSharedVal.get() ? 'shared' : 'private',
                        });
                        if (ok) this.editingNoteId.set(null);
                    };
                    const cancel = document.createElement('button');
                    cancel.type = 'button';
                    cancel.textContent = 'Avbryt';
                    cancel.onclick = () => this.editingNoteId.set(null);
                    actions.append(save, cancel);
                    li.appendChild(actions);
                } else {
                    const body = document.createElement('div');
                    body.className = 'lesson-edit__note-body';
                    body.textContent = note.body;
                    li.appendChild(body);

                    if (note.authorId === me) {
                        const actions = document.createElement('div');
                        actions.className = 'lesson-edit__note-actions';
                        const edit = document.createElement('button');
                        edit.type = 'button';
                        edit.textContent = 'Redigera';
                        edit.onclick = () => {
                            this.editingBodyVal.set(note.body);
                            this.editingSharedVal.set(note.visibility === 'shared');
                            this.editingNoteId.set(note.id);
                        };
                        const del = document.createElement('button');
                        del.type = 'button';
                        del.className = 'lesson-edit__note-delete';
                        del.textContent = 'Ta bort';
                        del.onclick = async () => {
                            if (!window.confirm('Ta bort anteckningen?')) return;
                            await this.notes.delete(note.id);
                        };
                        actions.append(edit, del);
                        li.appendChild(actions);
                    }
                }

                noteHost.appendChild(li);
            }
        }));

        return frag;
    }
}
