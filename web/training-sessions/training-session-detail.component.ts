import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { NotesService } from '../lessons/notes.service';
import { api, type AttachedProgramRef, type Exercise, type Program, type TrainingSession, type TrainingSessionExerciseRef } from '../api';

const tpl = template(`
    <div class="tsd" bind="root">
        <a bind="back" href="/traningspass" class="tsd__back">← Tillbaka</a>
        <h2>Träningspass</h2>
        <div bind="missing" class="tsd__missing">Träningspasset kunde inte hittas.</div>

        <section bind="summary" class="tsd__summary">
            <dl>
                <dt>Tidpunkt</dt><dd bind="sumWhen"></dd>
                <dt>Längd</dt><dd bind="sumDuration"></dd>
                <dt>Häst</dt><dd bind="sumHorse"></dd>
                <dt>Delning</dt><dd bind="sumShare"></dd>
            </dl>
            <div bind="sumSummary" class="tsd__summary-text"></div>
        </section>

        <section bind="programsSection" class="tsd__programs">
            <h3>Program</h3>
            <ul bind="programList" class="tsd__prog-list"></ul>
            <div bind="programEmpty" class="tsd__prog-empty">Inga program kopplade än.</div>
            <div bind="programAdd" class="tsd__prog-add">
                <div bind="programSelectHost" class="tsd__select-host"></div>
                <button bind="attachProgram" type="button">Koppla program</button>
            </div>
        </section>

        <section bind="exercisesSection" class="tsd__exercises">
            <h3>Övningar</h3>
            <ul bind="exerciseList" class="tsd__ex-list"></ul>
            <div bind="exerciseEmpty" class="tsd__ex-empty">Inga övningar kopplade än.</div>
            <div bind="exerciseAdd" class="tsd__ex-add">
                <div bind="exerciseSelectHost" class="tsd__select-host"></div>
                <button bind="addExercise" type="button">Lägg till</button>
            </div>
        </section>

        <section bind="notesSection" class="tsd__notes">
            <h3>Anteckningar</h3>
            <ul bind="noteList" class="tsd__note-list"></ul>
            <div bind="noteEmpty" class="tsd__note-empty">Inga anteckningar än.</div>
            <form bind="noteForm" class="tsd__note-form">
                <textarea bind="noteBody" placeholder="Skriv en anteckning…" rows="3"></textarea>
                <div class="tsd__note-row">
                    <label class="tsd__note-vis">
                        <input bind="noteShared" type="checkbox">
                        <span bind="noteSharedLabel">Delad med lärare</span>
                    </label>
                    <button bind="noteSubmit" type="submit">Spara anteckning</button>
                </div>
                <div class="error" bind="noteError"></div>
            </form>
        </section>
    </div>
`);

const DATETIME_FORMAT = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export class TrainingSessionDetailComponent extends Component {
    static styles = `
        .tsd {
            max-width: 720px;

            & .tsd__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .tsd__missing { display: none; padding: ${s('md')}; color: ${t('error')}; }
            &.missing .tsd__missing { display: block; }
            &.missing .tsd__summary, &.missing .tsd__notes { display: none; }
            &.missing .tsd__exercises { display: none; }
            &.missing .tsd__programs { display: none; }

            & .tsd__summary {
                margin-bottom: ${s('xl')};
                & dl {
                    display: grid;
                    grid-template-columns: max-content 1fr;
                    gap: ${s('xs')} ${s('md')};
                    margin: 0 0 ${s('sm')};
                    font-size: 0.875rem;
                }
                & dt { font-weight: 500; opacity: 0.7; }
                & dd { margin: 0; }
                & .tsd__summary-text {
                    white-space: pre-wrap;
                    background: ${t('surface')};
                    border-radius: ${t('radius')};
                    padding: ${s('sm')} ${s('md')};
                    font-size: 0.875rem;
                }
                & .tsd__summary-text.hidden { display: none; }
            }

            & .tsd__programs {
                margin-bottom: ${s('xl')};
                & h3 { margin: 0 0 ${s('sm')}; font-size: 0.9375rem; }

                & .tsd__prog-list {
                    list-style: none;
                    margin: 0 0 ${s('sm')};
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                }
                & .tsd__prog-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${s('sm')};
                    background: ${t('surface')};
                    border-radius: ${t('radius')};
                    padding: ${s('sm')} ${s('md')};
                    font-size: 0.875rem;
                    & button { ${btn()} padding: ${s('xs')} ${s('sm')}; font-size: 0.8125rem; }
                }
                & .tsd__prog-empty {
                    padding: ${s('md')};
                    opacity: 0.6;
                    font-size: 0.875rem;
                }
                & .tsd__prog-empty.hidden { display: none; }
                & .tsd__prog-add {
                    display: flex;
                    align-items: center;
                    gap: ${s('sm')};
                    flex-wrap: wrap;
                    & button { ${btn()} }
                }
                & .tsd__prog-add.hidden { display: none; }
                & .tsd__select-host .ui-select { display: block; min-width: 12rem; }
            }

            & .tsd__exercises {
                margin-bottom: ${s('xl')};
                & h3 { margin: 0 0 ${s('sm')}; font-size: 0.9375rem; }

                & .tsd__ex-list {
                    list-style: none;
                    margin: 0 0 ${s('sm')};
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                }
                & .tsd__ex-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${s('sm')};
                    background: ${t('surface')};
                    border-radius: ${t('radius')};
                    padding: ${s('sm')} ${s('md')};
                    font-size: 0.875rem;
                }
                & .tsd__ex-actions {
                    display: flex;
                    gap: ${s('xs')};
                    & button { ${btn()} padding: ${s('xs')} ${s('sm')}; font-size: 0.8125rem; }
                }
                & .tsd__ex-empty {
                    padding: ${s('md')};
                    opacity: 0.6;
                    font-size: 0.875rem;
                }
                & .tsd__ex-empty.hidden { display: none; }
                & .tsd__ex-add {
                    display: flex;
                    align-items: center;
                    gap: ${s('sm')};
                    flex-wrap: wrap;
                    & button { ${btn()} }
                }
                & .tsd__ex-add.hidden { display: none; }
                & .tsd__select-host .ui-select { display: block; min-width: 12rem; }
            }

            & .tsd__notes {
                & h3 { margin: 0 0 ${s('sm')}; font-size: 0.9375rem; }

                & .tsd__note-list {
                    list-style: none;
                    margin: 0 0 ${s('md')};
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                }
                & .tsd__note-item {
                    background: ${t('surface')};
                    border-radius: ${t('radius')};
                    padding: ${s('sm')} ${s('md')};
                    font-size: 0.875rem;
                }
                & .tsd__note-meta {
                    display: flex;
                    gap: ${s('sm')};
                    font-size: 0.75rem;
                    opacity: 0.7;
                    margin-bottom: ${s('xs')};
                }
                & .tsd__note-body { white-space: pre-wrap; }
                & .tsd__note-badge {
                    display: inline-block;
                    font-size: 0.75rem;
                    padding: 0 ${s('xs')};
                    border-radius: 999px;
                    background: ${t('active-bg')};
                    color: ${t('active-text')};
                }
                & .tsd__note-actions {
                    display: flex;
                    gap: ${s('xs')};
                    margin-top: ${s('xs')};
                    & button { ${btn()} padding: ${s('xs')} ${s('sm')}; font-size: 0.8125rem; }
                }

                & .tsd__note-empty { padding: ${s('md')}; opacity: 0.6; font-size: 0.875rem; }
                & .tsd__note-empty.hidden { display: none; }

                & .tsd__note-form {
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    & textarea {
                        ${input()}
                        width: 100%;
                        box-sizing: border-box;
                    }
                }
                & .tsd__note-row {
                    display: flex;
                    align-items: center;
                    gap: ${s('md')};
                    & button { ${btn()} }
                }
                & .tsd__note-vis {
                    display: flex;
                    align-items: center;
                    gap: ${s('xs')};
                    font-size: 0.8125rem;
                    cursor: pointer;
                }

                & .error {
                    color: ${t('error')};
                    font-size: 0.875rem;
                    min-height: 1em;
                }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private notes = this.inject(NotesService);
    private ts = new Signal<TrainingSession | null>(null);
    private resolved = new Signal(false);
    private found = new Signal(true);
    private noteBodyVal = new Signal('');
    private noteSharedVal = new Signal(false);
    private editingNoteId = new Signal<string | null>(null);
    private editingBodyVal = new Signal('');
    private editingSharedVal = new Signal(false);
    private exerciseVal = new Signal('');
    private programVal = new Signal('');
    private catalog = new Signal<Exercise[]>([]);
    private programCatalog = new Signal<Program[]>([]);
    private exerciseOptions = new Computed<SelectOption[]>(() => {
        const linked = new Set((this.ts.get()?.exercises ?? []).map((e) => e.exerciseId));
        return this.catalog.get()
            .filter((e) => !linked.has(e.id))
            .map((e) => ({ value: e.id, label: e.name }));
    });
    private programOptions = new Computed<SelectOption[]>(() => {
        const attached = new Set((this.ts.get()?.programs ?? []).map((p) => p.id));
        return this.programCatalog.get()
            .filter((p) => !attached.has(p.id))
            .map((p) => ({ value: p.id, label: p.title }));
    });

    private sessionId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private session(): TrainingSession | null {
        return this.ts.get();
    }

    private isOwner(): boolean {
        const ts = this.ts.get();
        const me = this.auth.currentUser.get()?.id;
        return !!(ts && me && ts.studentId === me);
    }

    private async reloadSession(): Promise<void> {
        const id = this.sessionId();
        const ts = await api.trainingSessions.get({ id });
        this.ts.set(ts);
    }

    onMount(): void {
        const id = this.sessionId();
        void api.trainingSessions.get({ id })
            .then(async (ts) => {
                this.ts.set(ts);
                this.found.set(true);
                this.resolved.set(true);
                void this.notes.load('training_session', id);
                const me = this.auth.currentUser.get()?.id;
                if (me && ts.studentId === me) {
                    const [exercises, programs] = await Promise.all([
                        api.exercises.listForStudent(),
                        api.programs.listForStudent(),
                    ]);
                    this.catalog.set(exercises);
                    this.programCatalog.set(programs);
                }
            })
            .catch(() => {
                this.found.set(false);
                this.resolved.set(true);
            });
    }

    private sharedLabel(): string {
        const ts = this.ts.get();
        const me = this.auth.currentUser.get()?.id;
        if (ts && me && ts.studentId !== me) return 'Delad med elev';
        return 'Delad med lärare';
    }

    private shareSummary(): string {
        const ts = this.session();
        if (!ts) return '';
        if (ts.sharedWithTeacherIds.length === 0) return 'Privat';
        return `Delad (${ts.sharedWithTeacherIds.length} lärare)`;
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.found.get() ? 'tsd missing' : 'tsd',
            },
            back: this.router.link('/traningspass'),
            sumWhen: { textContent: () => {
                const ts = this.session();
                return ts ? DATETIME_FORMAT.format(new Date(ts.performedAt)) : '';
            } },
            sumDuration: { textContent: () => {
                const ts = this.session();
                return ts?.durationMin != null ? `${ts.durationMin} min` : '(ej angiven)';
            } },
            sumHorse: { textContent: () => this.session()?.horseName ?? '(ingen)' },
            sumShare: { textContent: () => this.shareSummary() },
            sumSummary: {
                className: () => this.session()?.summary
                    ? 'tsd__summary-text' : 'tsd__summary-text hidden',
                textContent: () => this.session()?.summary ?? '',
            },
            exerciseEmpty: {
                className: () => (this.session()?.exercises.length ?? 0) === 0
                    ? 'tsd__ex-empty' : 'tsd__ex-empty hidden',
            },
            exerciseAdd: {
                className: () => this.isOwner() ? 'tsd__ex-add' : 'tsd__ex-add hidden',
            },
            programEmpty: {
                className: () => (this.session()?.programs.length ?? 0) === 0
                    ? 'tsd__prog-empty' : 'tsd__prog-empty hidden',
            },
            programAdd: {
                className: () => this.isOwner() ? 'tsd__prog-add' : 'tsd__prog-add hidden',
            },
            attachProgram: {
                onclick: async () => {
                    const programId = this.programVal.get();
                    if (!programId) return;
                    const id = this.sessionId();
                    const result = await api.trainingSessions.attachProgram({ id, programId });
                    if (result) {
                        this.programVal.set('');
                        this.ts.set(result);
                    }
                },
            },
            addExercise: {
                onclick: async () => {
                    const exerciseId = this.exerciseVal.get();
                    if (!exerciseId) return;
                    const id = this.sessionId();
                    const result = await api.trainingSessions.addExercise({ id, exerciseId });
                    if (result) {
                        this.exerciseVal.set('');
                        await this.reloadSession();
                    }
                },
            },
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
                    ? 'tsd__note-empty' : 'tsd__note-empty hidden',
            },
            noteError: { textContent: () => this.notes.error.get()?.message ?? '' },
            noteSharedLabel: { textContent: () => this.sharedLabel() },
        });

        this.spawn(SelectComponent, this.ref(frag, 'programSelectHost'), {
            value: this.programVal,
            options: this.programOptions,
            placeholder: '(välj program)',
        });
        this.track(effect(() => {
            const opts = this.programOptions.get();
            const current = this.programVal.get();
            if (current && !opts.some((o) => o.value === current)) {
                this.programVal.set('');
            }
        }));

        this.spawn(SelectComponent, this.ref(frag, 'exerciseSelectHost'), {
            value: this.exerciseVal,
            options: this.exerciseOptions,
            placeholder: '(välj övning)',
        });
        this.track(effect(() => {
            const opts = this.exerciseOptions.get();
            const current = this.exerciseVal.get();
            if (current && !opts.some((o) => o.value === current)) {
                this.exerciseVal.set('');
            }
        }));

        const exHost = this.ref(frag, 'exerciseList');
        this.$each(
            exHost,
            new Computed(() => this.ts.get()?.exercises ?? []),
            (ex) => this.renderExercise(ex),
            (ex) => `${ex.id}:${ex.sortOrder}:${ex.sourceProgramId ?? ''}`,
        );

        const progHost = this.ref(frag, 'programList');
        this.$each(
            progHost,
            new Computed(() => this.ts.get()?.programs ?? []),
            (p) => this.renderProgram(p),
            (p) => p.id,
        );

        const noteHost = this.ref(frag, 'noteList');
        this.track(effect(() => {
            const me = this.auth.currentUser.get()?.id;
            const editing = this.editingNoteId.get();
            const items = this.notes.items.get();
            noteHost.replaceChildren();
            for (const note of items) {
                const li = document.createElement('li');
                li.className = 'tsd__note-item';

                const meta = document.createElement('div');
                meta.className = 'tsd__note-meta';
                const who = document.createElement('span');
                who.textContent = note.authorDisplayName;
                const when = document.createElement('span');
                when.textContent = new Date(note.createdAt).toLocaleString('sv-SE');
                const badge = document.createElement('span');
                badge.className = 'tsd__note-badge';
                badge.textContent = note.visibility === 'shared' ? 'Delad' : 'Privat';
                meta.append(who, when, badge);
                li.appendChild(meta);

                if (editing === note.id) {
                    const ta = document.createElement('textarea');
                    ta.rows = 3;
                    ta.value = this.editingBodyVal.get();
                    ta.oninput = (e) => this.editingBodyVal.set((e.target as HTMLTextAreaElement).value);
                    li.appendChild(ta);

                    const visLabel = document.createElement('label');
                    visLabel.className = 'tsd__note-vis';
                    const visCb = document.createElement('input');
                    visCb.type = 'checkbox';
                    visCb.checked = this.editingSharedVal.get();
                    visCb.onchange = (e) => this.editingSharedVal.set((e.target as HTMLInputElement).checked);
                    const visTxt = document.createElement('span');
                    visTxt.textContent = this.sharedLabel();
                    visLabel.append(visCb, visTxt);
                    li.appendChild(visLabel);

                    const actions = document.createElement('div');
                    actions.className = 'tsd__note-actions';
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
                    body.className = 'tsd__note-body';
                    body.textContent = note.body;
                    li.appendChild(body);

                    if (note.authorId === me) {
                        const actions = document.createElement('div');
                        actions.className = 'tsd__note-actions';
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
                        del.textContent = 'Ta bort';
                        del.onclick = async () => {
                            if (!confirm('Ta bort anteckningen?')) return;
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

    private renderExercise(ex: TrainingSessionExerciseRef): HTMLElement {
        const li = document.createElement('li');
        li.className = 'tsd__ex-item';
        const label = document.createElement('span');
        label.textContent = ex.name;
        li.appendChild(label);
        if (this.isOwner()) {
            const actions = document.createElement('div');
            actions.className = 'tsd__ex-actions';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Ta bort';
            remove.onclick = async () => {
                const id = this.sessionId();
                await api.trainingSessions.removeExercise({ id, exerciseId: ex.exerciseId });
                await this.reloadSession();
            };
            actions.appendChild(remove);
            li.appendChild(actions);
        }
        return li;
    }

    private renderProgram(p: AttachedProgramRef): HTMLElement {
        const li = document.createElement('li');
        li.className = 'tsd__prog-item';
        const label = document.createElement('span');
        label.textContent = p.title;
        li.appendChild(label);
        if (this.isOwner()) {
            const detach = document.createElement('button');
            detach.type = 'button';
            detach.textContent = 'Koppla loss';
            detach.onclick = async () => {
                const id = this.sessionId();
                const result = await api.trainingSessions.detachProgram({ id, programId: p.id });
                if (result) this.ts.set(result);
            };
            li.appendChild(detach);
        }
        return li;
    }
}
