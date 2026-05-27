import { Component, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { NotesService } from './notes.service';

/**
 * Self-contained note thread for one per-exercise row (either a
 * `lesson_exercise` or a `training_session_exercise`). Owns its own
 * NotesService instance (no DI — DI is per-singleton) so multiple
 * threads can coexist on the same page. Mirrors the lesson-level
 * thread UI from slice 017.
 */
export interface ExerciseNotesProps {
    parentKind: 'lesson_exercise' | 'training_session_exercise';
    parentId: string;
    /** Whether to render the student-facing wording on the "shared" label. */
    isStudent: boolean;
}

const tpl = template(`
    <div class="ex-notes">
        <ul bind="list" class="ex-notes__list"></ul>
        <div bind="empty" class="ex-notes__empty">Inga anteckningar än.</div>
        <form bind="form" class="ex-notes__form">
            <textarea bind="body" placeholder="Skriv en anteckning…" rows="2"></textarea>
            <div class="ex-notes__row">
                <label class="ex-notes__vis">
                    <input bind="shared" type="checkbox">
                    <span bind="sharedLabel"></span>
                </label>
                <button bind="submit" type="submit">Spara</button>
            </div>
            <div class="error" bind="error"></div>
        </form>
    </div>
`);

export class ExerciseNotesComponent extends Component<ExerciseNotesProps> {
    static styles = `
        .ex-notes {
            display: flex;
            flex-direction: column;
            gap: ${s('xs')};
            padding: ${s('sm')};
            background: ${t('surface')};
            border-radius: ${t('radius')};
            margin-top: ${s('xs')};

            & .ex-notes__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .ex-notes__item {
                padding: ${s('xs')} ${s('sm')};
                background: ${t('bg')};
                border-radius: ${t('radius')};
                font-size: 0.8125rem;
                display: flex;
                flex-direction: column;
                gap: 2px;

                & .ex-notes__meta {
                    display: flex;
                    gap: ${s('sm')};
                    font-size: 0.6875rem;
                    opacity: 0.7;
                    align-items: center;
                }
                & .ex-notes__badge {
                    padding: 0 ${s('xs')};
                    border-radius: ${t('radius')};
                    border: 1px solid currentColor;
                    font-size: 0.625rem;
                }
                & .ex-notes__body {
                    white-space: pre-wrap;
                }
                & .ex-notes__actions {
                    display: flex;
                    gap: ${s('sm')};
                    & button {
                        background: transparent;
                        border: none;
                        color: ${t('text')};
                        opacity: 0.7;
                        cursor: pointer;
                        font-size: 0.75rem;
                        padding: 0;
                        &:hover { opacity: 1; text-decoration: underline; }
                        &.ex-notes__delete { color: ${t('error')}; opacity: 0.9; }
                    }
                }
            }

            & .ex-notes__empty {
                opacity: 0.6;
                font-size: 0.8125rem;
            }
            & .ex-notes__empty.hidden { display: none; }

            & .ex-notes__form {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                    font-size: 0.8125rem;
                }
            }

            & .ex-notes__row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                & button { ${btn()} font-size: 0.8125rem; padding: ${s('xs')} ${s('sm')}; }
            }

            & .ex-notes__vis {
                display: flex;
                align-items: center;
                gap: ${s('xs')};
                font-size: 0.8125rem;
            }

            & .error {
                color: ${t('error')};
                font-size: 0.75rem;
                min-height: 0;
            }
        }
    `;

    private auth = this.inject(AuthService);
    private notes = new NotesService();
    private bodyVal = new Signal('');
    private sharedVal = new Signal(false);
    private editingId = new Signal<string | null>(null);
    private editingBody = new Signal('');
    private editingShared = new Signal(false);

    onMount(): void {
        void this.notes.load(this.props.parentKind, this.props.parentId);
    }

    private sharedLabelText(): string {
        return this.props.isStudent ? 'Delad med läraren' : 'Delad med eleven';
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            body: {
                value: () => this.bodyVal.get(),
                oninput: (e: Event) => this.bodyVal.set((e.target as HTMLTextAreaElement).value),
            },
            shared: {
                checked: () => this.sharedVal.get(),
                onchange: (e: Event) => this.sharedVal.set((e.target as HTMLInputElement).checked),
            },
            sharedLabel: { textContent: () => this.sharedLabelText() },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const body = this.bodyVal.get().trim();
                    if (!body) return;
                    const ok = await this.notes.create(
                        body,
                        this.sharedVal.get() ? 'shared' : 'private',
                    );
                    if (ok) {
                        this.bodyVal.set('');
                        this.sharedVal.set(false);
                    }
                },
            },
            empty: {
                className: () => this.notes.items.get().length === 0
                    ? 'ex-notes__empty' : 'ex-notes__empty hidden',
            },
            error: { textContent: () => this.notes.error.get()?.message ?? '' },
        });

        const host = this.ref(frag, 'list');
        this.track(effect(() => {
            const me = this.auth.currentUser.get()?.id;
            const editing = this.editingId.get();
            host.replaceChildren();
            for (const note of this.notes.items.get()) {
                const li = document.createElement('li');
                li.className = 'ex-notes__item';

                const meta = document.createElement('div');
                meta.className = 'ex-notes__meta';
                const who = document.createElement('span');
                who.textContent = note.authorDisplayName;
                const when = document.createElement('span');
                when.textContent = new Date(note.createdAt).toLocaleString('sv-SE');
                const badge = document.createElement('span');
                badge.className = 'ex-notes__badge';
                badge.textContent = note.visibility === 'shared' ? 'Delad' : 'Prep';
                meta.append(who, when, badge);
                li.appendChild(meta);

                if (editing === note.id) {
                    const ta = document.createElement('textarea');
                    ta.rows = 2;
                    ta.value = this.editingBody.get();
                    ta.oninput = (e) => this.editingBody.set((e.target as HTMLTextAreaElement).value);
                    li.appendChild(ta);

                    const visLabel = document.createElement('label');
                    visLabel.className = 'ex-notes__vis';
                    const visCb = document.createElement('input');
                    visCb.type = 'checkbox';
                    visCb.checked = this.editingShared.get();
                    visCb.onchange = (e) => this.editingShared.set((e.target as HTMLInputElement).checked);
                    const visTxt = document.createElement('span');
                    visTxt.textContent = this.sharedLabelText();
                    visLabel.append(visCb, visTxt);
                    li.appendChild(visLabel);

                    const actions = document.createElement('div');
                    actions.className = 'ex-notes__actions';
                    const save = document.createElement('button');
                    save.type = 'button';
                    save.textContent = 'Spara';
                    save.onclick = async () => {
                        const body = this.editingBody.get().trim();
                        if (!body) return;
                        const ok = await this.notes.update(note.id, {
                            body,
                            visibility: this.editingShared.get() ? 'shared' : 'private',
                        });
                        if (ok) this.editingId.set(null);
                    };
                    const cancel = document.createElement('button');
                    cancel.type = 'button';
                    cancel.textContent = 'Avbryt';
                    cancel.onclick = () => this.editingId.set(null);
                    actions.append(save, cancel);
                    li.appendChild(actions);
                } else {
                    const body = document.createElement('div');
                    body.className = 'ex-notes__body';
                    body.textContent = note.body;
                    li.appendChild(body);

                    if (note.authorId === me) {
                        const actions = document.createElement('div');
                        actions.className = 'ex-notes__actions';
                        const edit = document.createElement('button');
                        edit.type = 'button';
                        edit.textContent = 'Redigera';
                        edit.onclick = () => {
                            this.editingBody.set(note.body);
                            this.editingShared.set(note.visibility === 'shared');
                            this.editingId.set(note.id);
                        };
                        const del = document.createElement('button');
                        del.type = 'button';
                        del.className = 'ex-notes__delete';
                        del.textContent = 'Ta bort';
                        del.onclick = async () => {
                            if (!window.confirm('Ta bort anteckningen?')) return;
                            await this.notes.delete(note.id);
                        };
                        actions.append(edit, del);
                        li.appendChild(actions);
                    }
                }
                host.appendChild(li);
            }
        }));

        return frag;
    }
}
