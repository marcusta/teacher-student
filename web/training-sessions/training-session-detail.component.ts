import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { NotesService } from '../lessons/notes.service';
import { api, type TrainingSession } from '../api';

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

        <section bind="notesSection" class="tsd__notes">
            <h3>Anteckningar</h3>
            <ul bind="noteList" class="tsd__note-list"></ul>
            <div bind="noteEmpty" class="tsd__note-empty">Inga anteckningar än.</div>
            <form bind="noteForm" class="tsd__note-form">
                <textarea bind="noteBody" placeholder="Skriv en anteckning…" rows="3"></textarea>
                <div class="tsd__note-row">
                    <label class="tsd__note-vis">
                        <input bind="noteShared" type="checkbox">
                        <span>Delad med lärare</span>
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

    private sessionId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private session(): TrainingSession | null {
        return this.ts.get();
    }

    onMount(): void {
        const id = this.sessionId();
        void api.trainingSessions.get({ id })
            .then((ts) => {
                this.ts.set(ts);
                this.found.set(true);
                this.resolved.set(true);
                void this.notes.load('training_session', id);
            })
            .catch(() => {
                this.found.set(false);
                this.resolved.set(true);
            });
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
        });

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
                    visTxt.textContent = 'Delad med lärare';
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
}
