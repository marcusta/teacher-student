import { Component, Computed, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { GoalsService } from './goals.service';
import { TeachersService } from '../training-sessions/teachers.service';
import type { Goal, Teacher } from '../api';

const STATUS_LABEL: Record<Goal['status'], string> = {
    active: 'Aktiv',
    achieved: 'Uppnått',
    abandoned: 'Arkiverad',
};

const tpl = template(`
    <div class="goals" bind="root">
        <h2>Mål</h2>

        <form bind="form" class="goals__form">
            <input bind="titleInput" type="text" placeholder="Målets titel" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning (valfritt)" maxlength="5000" rows="3"></textarea>
            <input bind="dateInput" type="date" class="goals__date">
            <div bind="shareForm" class="goals__share-form"></div>
            <div class="goals__form-row">
                <button bind="submit" type="submit"></button>
                <button bind="cancel" type="button" class="goals__cancel"></button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="goals__empty">Inga mål än.</div>
        <ul bind="list" class="goals__list"></ul>
    </div>
`);

export class GoalsComponent extends Component {
    static styles = `
        .goals {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .goals__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('xl')};
                padding: ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};

                & input, & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                    font-family: inherit;
                }
                & .goals__date { color-scheme: dark light; }
            }

            & .goals__form-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;

                & button { ${btn()} }
            }

            & .goals__cancel.hidden { display: none; }

            & .goals__share-form {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                font-size: 0.875rem;
            }
            & .goals__share-form.hidden { display: none; }
            & .goals__share-form label {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                cursor: pointer;
            }

            & .goals__item-wrap {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .goals__share-panel {
                padding: ${s('sm')} ${s('md')} ${s('md')};
                margin: 0 ${s('md')} ${s('sm')};
                background: ${t('bg')};
                border-radius: ${t('radius')};
                font-size: 0.875rem;
            }
            & .goals__share-panel.hidden { display: none; }
            & .goals__share-panel label {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                margin-top: ${s('xs')};
                cursor: pointer;
            }
            & .goals__share-panel-title {
                font-weight: 500;
                margin-bottom: ${s('xs')};
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .goals__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .goals__empty.hidden { display: none; }

            & .goals__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .goals__item {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
            }
            & .goals__item.abandoned { opacity: 0.65; }

            & .goals__item-body { flex: 1; min-width: 0; }
            & .goals__item-title { font-weight: 500; }
            & .goals__item-meta {
                font-size: 0.8125rem;
                opacity: 0.7;
                margin-top: ${s('xs')};
            }
            & .goals__badge {
                display: inline-block;
                margin-left: ${s('xs')};
                padding: 0 ${s('xs')};
                border-radius: ${t('radius-pill')};
                background: ${t('hover-bg')};
                font-size: 0.75rem;
                font-weight: 500;
            }

            & .goals__item-actions {
                display: flex;
                gap: ${s('xs')};
                flex-shrink: 0;

                & button {
                    ${btn()}
                    font-size: 0.8125rem;
                    padding: ${s('xs')} ${s('sm')};
                }
            }
        }
    `;

    private svc = this.inject(GoalsService);
    private teachers = this.inject(TeachersService);
    private editingId = new Signal<string | null>(null);
    private titleVal = new Signal('');
    private descVal = new Signal('');
    private dateVal = new Signal('');

    private submitLabel = new Computed(() =>
        this.editingId.get() ? 'Spara ändringar' : 'Skapa mål',
    );

    private editingGoal = new Computed(() => {
        const id = this.editingId.get();
        if (!id) return null;
        return this.svc.items.get().find((g) => g.id === id) ?? null;
    });

    onMount(): void {
        void this.svc.load();
        void this.teachers.load();
    }

    render(): DocumentFragment {
        void this.svc.items.get();
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            titleInput: {
                value: () => this.titleVal.get(),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            dateInput: {
                value: () => this.dateVal.get(),
                oninput: (e: Event) => this.dateVal.set((e.target as HTMLInputElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const title = this.titleVal.get().trim();
                    if (!title) return;
                    const description = this.descVal.get().trim();
                    const targetDate = this.dateVal.get().trim();
                    const payload = {
                        title,
                        ...(description ? { description } : {}),
                        ...(targetDate ? { targetDate } : {}),
                    };
                    const editing = this.editingId.get();
                    if (editing) {
                        const updated = await this.svc.update(editing, {
                            title,
                            description: description || null,
                            targetDate: targetDate || null,
                        });
                        if (updated) this.resetForm();
                    } else {
                        const ok = await this.svc.create(payload);
                        if (ok) this.resetForm();
                    }
                },
            },
            submit: { textContent: () => this.submitLabel.get() },
            cancel: {
                className: () => this.editingId.get() ? 'goals__cancel' : 'goals__cancel hidden',
                textContent: () => 'Avbryt',
                onclick: () => this.resetForm(),
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'goals__empty' : 'goals__empty hidden',
            },
            shareForm: {
                className: () => {
                    const show = this.editingId.get() !== null
                        && this.teachers.items.get().length > 0;
                    return show ? 'goals__share-form' : 'goals__share-form hidden';
                },
            },
        });

        this.renderShareCheckboxes(this.ref(frag, 'shareForm'), this.editingGoal.get());

        const listHost = this.ref(frag, 'list');
        this.$each(
            listHost,
            this.svc.items,
            (item) => this.renderItem(item),
            (item) => `${item.id}:${item.status}:${item.title}:${item.targetDate ?? ''}:${item.sharedTeacherIds.join(',')}`,
        );

        return frag;
    }

    private resetForm(): void {
        this.editingId.set(null);
        this.titleVal.set('');
        this.descVal.set('');
        this.dateVal.set('');
    }

    private startEdit(item: Goal): void {
        this.editingId.set(item.id);
        this.titleVal.set(item.title);
        this.descVal.set(item.description ?? '');
        this.dateVal.set(item.targetDate ?? '');
    }

    private async toggleShare(goalId: string, teacherId: string, shared: boolean): Promise<void> {
        if (shared) await this.svc.share(goalId, teacherId);
        else await this.svc.unshare(goalId, teacherId);
    }

    private renderShareCheckboxes(host: HTMLElement, goal: Goal | null): void {
        host.replaceChildren();
        if (!goal) return;
        const heading = document.createElement('div');
        heading.textContent = 'Delning med lärare';
        host.appendChild(heading);
        for (const teacher of this.teachers.items.get()) {
            host.appendChild(this.shareCheckbox(goal, teacher));
        }
    }

    private shareCheckbox(goal: Goal, teacher: Teacher): HTMLLabelElement {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = goal.sharedTeacherIds.includes(teacher.id);
        cb.addEventListener('change', () => {
            void this.toggleShare(goal.id, teacher.id, cb.checked);
        });
        const span = document.createElement('span');
        span.textContent = teacher.displayName;
        label.appendChild(cb);
        label.appendChild(span);
        return label;
    }

    private renderItem(item: Goal): HTMLElement {
        const li = document.createElement('li');
        li.className = 'goals__item-wrap';

        const row = document.createElement('div');
        row.className = item.status === 'abandoned' ? 'goals__item abandoned' : 'goals__item';

        const body = document.createElement('div');
        body.className = 'goals__item-body';

        const titleRow = document.createElement('div');
        titleRow.className = 'goals__item-title';
        titleRow.textContent = item.title;

        const badge = document.createElement('span');
        badge.className = 'goals__badge';
        badge.textContent = STATUS_LABEL[item.status];
        titleRow.appendChild(badge);
        body.appendChild(titleRow);

        const metaBits: string[] = [];
        if (item.targetDate) metaBits.push(`Måldatum: ${item.targetDate}`);
        if (item.description) metaBits.push(item.description);
        if (metaBits.length > 0) {
            const meta = document.createElement('div');
            meta.className = 'goals__item-meta';
            meta.textContent = metaBits.join(' · ');
            body.appendChild(meta);
        }

        const actions = document.createElement('div');
        actions.className = 'goals__item-actions';

        let panel: HTMLDivElement | null = null;
        if (this.teachers.items.get().length > 0) {
            panel = document.createElement('div');
            panel.className = 'goals__share-panel hidden';
            const panelTitle = document.createElement('div');
            panelTitle.className = 'goals__share-panel-title';
            panelTitle.textContent = 'Delning med lärare';
            panel.appendChild(panelTitle);
            for (const teacher of this.teachers.items.get()) {
                panel.appendChild(this.shareCheckbox(item, teacher));
            }
        }

        const shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.textContent = `Delning (${item.sharedTeacherIds.length})`;
        if (panel) {
            shareBtn.addEventListener('click', () => panel!.classList.toggle('hidden'));
        } else {
            shareBtn.disabled = true;
        }
        actions.appendChild(shareBtn);

        if (item.status !== 'abandoned') {
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.textContent = 'Redigera';
            editBtn.addEventListener('click', () => this.startEdit(item));
            actions.appendChild(editBtn);

            const abandonBtn = document.createElement('button');
            abandonBtn.type = 'button';
            abandonBtn.textContent = 'Arkivera';
            abandonBtn.addEventListener('click', async () => {
                if (!confirm('Arkivera detta mål?')) return;
                await this.svc.abandon(item.id);
                if (this.editingId.get() === item.id) this.resetForm();
            });
            actions.appendChild(abandonBtn);
        }

        row.appendChild(body);
        row.appendChild(actions);
        li.appendChild(row);
        if (panel) li.appendChild(panel);

        return li;
    }
}
