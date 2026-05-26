import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { TrainingSessionsService } from './training-sessions.service';
import { TeachersService } from './teachers.service';
import { StableService } from '../stable/stable.service';
import { api, type Program, type Teacher, type TrainingSession } from '../api';

const tpl = template(`
    <div class="ts" bind="root">
        <h2>Träningspass</h2>

        <form bind="form" class="ts__form">
            <h3 bind="formTitle">Logga pass</h3>
            <label>
                <span>Tidpunkt</span>
                <input bind="whenInput" type="datetime-local" required>
            </label>
            <label>
                <span>Längd (min, valfri)</span>
                <input bind="durationInput" type="number" min="0">
            </label>
            <label>
                <span>Sammanfattning (valfri)</span>
                <textarea bind="summaryInput" rows="3"></textarea>
            </label>
            <label bind="horseLabel" class="ts__horse-label">
                <span>Häst (valfri)</span>
                <div bind="horseSelectHost" class="ts__select-host"></div>
            </label>
            <label bind="programLabel" class="ts__program-label">
                <span>Program (valfritt)</span>
                <div bind="programSelectHost" class="ts__select-host"></div>
            </label>

            <fieldset bind="shareBox" class="ts__share">
                <legend bind="shareLegend">Dela med lärare</legend>
                <div bind="shareSingle" class="ts__share-single"></div>
                <div bind="shareMulti" class="ts__share-multi"></div>
            </fieldset>

            <div class="ts__form-row">
                <button bind="submit" type="submit">Spara</button>
                <button bind="cancelEdit" type="button" class="ts__cancel">Avbryt redigering</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="ts__empty">Inga träningspass än.</div>
        <ul bind="list" class="ts__list"></ul>
    </div>
`);

const DATETIME_FORMAT = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
}

function toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export class TrainingSessionsComponent extends Component {
    static styles = `
        .ts {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .ts__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('xl')};
                padding: ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                border: none;

                & h3 { margin: 0 0 ${s('xs')}; font-size: 0.9375rem; }

                & label {
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    font-size: 0.8125rem;
                }
                & input[type=datetime-local], & input[type=number], & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }

                & .ts__select-host .ui-select { display: block; }

                & .ts__horse-label.hidden { display: none; }
                & .ts__program-label.hidden { display: none; }
            }

            & .ts__share {
                margin: 0;
                padding: ${s('sm')};
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                font-size: 0.8125rem;

                &.hidden { display: none; }

                & legend { padding: 0 ${s('xs')}; font-weight: 500; }

                & .ts__share-single { display: flex; align-items: center; gap: ${s('xs')}; }
                & .ts__share-single.hidden { display: none; }

                & .ts__share-multi {
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                }
                & .ts__share-multi.hidden { display: none; }

                & label.ts__share-row {
                    flex-direction: row;
                    align-items: center;
                    gap: ${s('xs')};
                    cursor: pointer;
                }
            }

            & .ts__form-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                & button { ${btn()} }
                & .ts__cancel.hidden { display: none; }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .ts__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .ts__empty.hidden { display: none; }

            & .ts__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .ts__item {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                font-size: 0.875rem;
            }
            & .ts__item-when {
                font-weight: 500;
                color: inherit;
                text-decoration: none;
                &:hover { text-decoration: underline; }
            }
            & .ts__item-meta { opacity: 0.7; font-size: 0.8125rem; }
            & .ts__item-summary {
                margin-top: ${s('xs')};
                white-space: pre-wrap;
            }
            & .ts__item-actions {
                display: flex;
                align-items: center;
                gap: ${s('xs')};
                & button {
                    ${btn()}
                    padding: ${s('xs')} ${s('sm')};
                    font-size: 0.8125rem;
                }
            }
            & .ts__item-badge {
                display: inline-block;
                font-size: 0.75rem;
                padding: 0 ${s('xs')};
                border-radius: 999px;
                background: ${t('active-bg')};
                color: ${t('active-text')};
            }
            & .ts__item-badge--muted {
                background: transparent;
                color: ${t('text')};
                opacity: 0.7;
                border: 1px solid currentColor;
            }
        }
    `;

    private sessions = this.inject(TrainingSessionsService);
    private teachers = this.inject(TeachersService);
    private stable = this.inject(StableService);
    private router = this.inject(Router);
    private whenVal = new Signal('');
    private durationVal = new Signal('');
    private summaryVal = new Signal('');
    private horseIdVal = new Signal<string>('');
    private programIdVal = new Signal<string>('');
    private programCatalog = new Signal<Program[]>([]);
    private editingId = new Signal<string | null>(null);
    /** Teacher ids checked in the share UI. Empty = keep private. */
    private shareIds = new Signal<Set<string>>(new Set());
    private formTitle = new Computed(() =>
        this.editingId.get() ? 'Redigera pass' : 'Logga pass',
    );
    private horseOptions = new Computed<SelectOption[]>(() =>
        this.stable.items.get().map((h) => ({ value: h.id, label: h.name })),
    );
    private programOptions = new Computed<SelectOption[]>(() =>
        this.programCatalog.get().map((p) => ({ value: p.id, label: p.title })),
    );

    onMount(): void {
        void this.sessions.load();
        void this.teachers.load();
        void this.stable.load();
        void api.programs.listForStudent()
            .then((list) => this.programCatalog.set(list))
            .catch(() => this.programCatalog.set([]));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.sessions.loading.get() },
            formTitle: { textContent: () => this.formTitle.get() },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            durationInput: {
                value: () => this.durationVal.get(),
                oninput: (e: Event) => this.durationVal.set((e.target as HTMLInputElement).value),
            },
            summaryInput: {
                value: () => this.summaryVal.get(),
                oninput: (e: Event) => this.summaryVal.set((e.target as HTMLTextAreaElement).value),
            },
            horseLabel: {
                className: () =>
                    this.stable.items.get().length === 0
                        ? 'ts__horse-label hidden' : 'ts__horse-label',
            },
            programLabel: {
                className: () =>
                    this.editingId.get() !== null || this.programCatalog.get().length === 0
                        ? 'ts__program-label hidden' : 'ts__program-label',
            },
            shareBox: {
                className: () =>
                    this.teachers.items.get().length === 0 ? 'ts__share hidden' : 'ts__share',
            },
            shareSingle: {
                className: () =>
                    this.teachers.items.get().length === 1
                        ? 'ts__share-single' : 'ts__share-single hidden',
            },
            shareMulti: {
                className: () =>
                    this.teachers.items.get().length > 1
                        ? 'ts__share-multi' : 'ts__share-multi hidden',
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const when = this.whenVal.get();
                    if (!when) return;
                    const durationRaw = this.durationVal.get().trim();
                    const durationMin = durationRaw === '' ? null : Number(durationRaw);
                    const summary = this.summaryVal.get().trim() || null;
                    const horseId = this.horseIdVal.get() || null;
                    const programId = this.programIdVal.get() || undefined;
                    const shareWithTeacherIds = Array.from(this.shareIds.get());

                    const editing = this.editingId.get();
                    let ok: boolean;
                    if (editing) {
                        const updated = await this.sessions.update(editing, {
                            performedAt: fromLocalInput(when),
                            durationMin,
                            summary,
                            horseId,
                            shareWithTeacherIds,
                        });
                        ok = updated !== null;
                    } else {
                        ok = await this.sessions.create({
                            performedAt: fromLocalInput(when),
                            durationMin,
                            summary,
                            horseId,
                            shareWithTeacherIds,
                            programId,
                        });
                    }
                    if (ok) this.resetForm();
                },
            },
            cancelEdit: {
                className: () =>
                    this.editingId.get() ? 'ts__cancel' : 'ts__cancel hidden',
                onclick: () => this.resetForm(),
            },
            error: { textContent: () => this.sessions.error.get()?.message ?? '' },
            empty: {
                className: () => this.sessions.items.get().length === 0
                    ? 'ts__empty' : 'ts__empty hidden',
            },
        });

        // Single teacher: one labelled checkbox.
        const single = this.ref(frag, 'shareSingle');
        this.$each(single, this.teachers.items, (teacher) => {
            if (this.teachers.items.get().length !== 1) return document.createElement('span');
            return this.renderShareRow(teacher);
        }, (teacher) => teacher.id);

        const multi = this.ref(frag, 'shareMulti');
        this.$each(multi, this.teachers.items, (teacher) => {
            if (this.teachers.items.get().length <= 1) return document.createElement('span');
            return this.renderShareRow(teacher);
        }, (teacher) => teacher.id);

        this.spawn(SelectComponent, this.ref(frag, 'horseSelectHost'), {
            value: this.horseIdVal,
            options: this.horseOptions,
            placeholder: 'Ingen häst',
        });
        this.spawn(SelectComponent, this.ref(frag, 'programSelectHost'), {
            value: this.programIdVal,
            options: this.programOptions,
            placeholder: 'Inget program',
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.sessions.items, (item) => this.renderItem(item), (item) => `${item.id}:${item.updatedAt}`);

        return frag;
    }

    private renderShareRow(teacher: Teacher): HTMLElement {
        const label = document.createElement('label');
        label.className = 'ts__share-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        this.track(effect(() => {
            cb.checked = this.shareIds.get().has(teacher.id);
        }));
        cb.addEventListener('change', () => {
            const next = new Set(this.shareIds.get());
            if (cb.checked) next.add(teacher.id); else next.delete(teacher.id);
            this.shareIds.set(next);
        });
        const span = document.createElement('span');
        span.textContent = teacher.displayName;
        label.appendChild(cb);
        label.appendChild(span);
        return label;
    }

    private resetForm(): void {
        this.editingId.set(null);
        this.whenVal.set('');
        this.durationVal.set('');
        this.summaryVal.set('');
        this.horseIdVal.set('');
        this.programIdVal.set('');
        this.shareIds.set(new Set());
    }

    private startEdit(item: TrainingSession): void {
        this.editingId.set(item.id);
        this.whenVal.set(toLocalInput(item.performedAt));
        this.durationVal.set(item.durationMin === null ? '' : String(item.durationMin));
        this.summaryVal.set(item.summary ?? '');
        this.horseIdVal.set(item.horseId ?? '');
        this.shareIds.set(new Set(item.sharedWithTeacherIds));
    }

    private renderItem(item: TrainingSession): HTMLElement {
        const li = document.createElement('li');
        li.className = 'ts__item';

        const left = document.createElement('div');
        const whenLink = document.createElement('a');
        whenLink.className = 'ts__item-when';
        const path = `/traningspass/${item.id}`;
        whenLink.href = path;
        whenLink.onclick = (e) => { e.preventDefault(); this.router.navigate(path); };
        whenLink.textContent = DATETIME_FORMAT.format(new Date(item.performedAt));
        left.appendChild(whenLink);

        const meta = document.createElement('div');
        meta.className = 'ts__item-meta';
        const bits: string[] = [];
        if (item.durationMin !== null) bits.push(`${item.durationMin} min`);
        if (item.horseName) bits.push(item.horseName);
        bits.push(this.shareLabel(item));
        meta.textContent = bits.join(' · ');
        left.appendChild(meta);

        if (item.summary) {
            const sum = document.createElement('div');
            sum.className = 'ts__item-summary';
            sum.textContent = item.summary;
            left.appendChild(sum);
        }

        const actions = document.createElement('div');
        actions.className = 'ts__item-actions';
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Redigera';
        editBtn.addEventListener('click', () => this.startEdit(item));
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = 'Ta bort';
        delBtn.addEventListener('click', async () => {
            if (!confirm('Ta bort detta träningspass?')) return;
            await this.sessions.remove(item.id);
            if (this.editingId.get() === item.id) this.resetForm();
        });
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(actions);
        return li;
    }

    private shareLabel(item: TrainingSession): string {
        const ids = item.sharedWithTeacherIds;
        if (ids.length === 0) return 'Privat';
        const teachers = this.teachers.items.get();
        const names = ids
            .map((id) => teachers.find((teach) => teach.id === id)?.displayName ?? '?')
            .join(', ');
        return `Delad: ${names}`;
    }
}
