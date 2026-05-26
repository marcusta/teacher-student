import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { PlansService } from './plans.service';
import { TeachersService } from '../training-sessions/teachers.service';
import type { LinkedLessonRef, LinkedTrainingSessionRef, PlanDetail, Teacher } from '../api';

const DATETIME_FORMAT = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const tpl = template(`
    <div class="plan-detail" bind="root">
        <a bind="back" href="/planer" class="plan-detail__back">← Tillbaka</a>
        <div bind="missing" class="plan-detail__missing">Planen kunde inte hittas.</div>

        <section bind="readSection" class="plan-detail__read">
            <h2 bind="titleRead"></h2>
            <p bind="descRead" class="plan-detail__desc"></p>
            <dl class="plan-detail__meta">
                <dt>Status</dt><dd bind="statusRead"></dd>
                <dt>Start</dt><dd bind="startRead"></dd>
                <dt>Slut</dt><dd bind="endRead"></dd>
                <dt>Huvudtränare</dt><dd bind="primaryRead"></dd>
            </dl>
        </section>

        <form bind="editForm" class="plan-detail__form">
            <h2>Redigera plan</h2>
            <label>
                <span>Titel</span>
                <input bind="titleInput" type="text" maxlength="200" required>
            </label>
            <label>
                <span>Beskrivning</span>
                <textarea bind="descInput" maxlength="5000" rows="3"></textarea>
            </label>
            <label>
                <span>Startdatum</span>
                <input bind="startInput" type="date">
            </label>
            <label>
                <span>Slutdatum</span>
                <input bind="endInput" type="date">
            </label>
            <label>
                <span>Huvudtränare</span>
                <div bind="teacherSelectHost" class="plan-detail__select-host"></div>
            </label>
            <div class="plan-detail__form-row">
                <button bind="submit" type="submit">Spara</button>
                <button bind="archive" type="button" class="plan-detail__archive">Arkivera</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <section class="plan-detail__section">
            <h3>Lektioner</h3>
            <div bind="lessonsEmpty" class="plan-detail__empty">Inga kopplade lektioner.</div>
            <ul bind="lessonsList" class="plan-detail__list"></ul>
        </section>

        <section class="plan-detail__section">
            <h3>Träningspass</h3>
            <div bind="tsEmpty" class="plan-detail__empty">Inga kopplade träningspass.</div>
            <ul bind="tsList" class="plan-detail__list"></ul>
        </section>
    </div>
`);

export class PlanDetailComponent extends Component {
    static styles = `
        .plan-detail {
            max-width: 720px;

            & .plan-detail__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & .plan-detail__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .plan-detail__missing { display: block; }
            &.missing .plan-detail__read,
            &.missing .plan-detail__form,
            &.missing .plan-detail__section { display: none; }

            & .plan-detail__read.hidden { display: none; }
            & .plan-detail__form.hidden { display: none; }

            & h2 { margin: 0 0 ${s('md')}; }
            & h3 { margin: 0 0 ${s('sm')}; font-size: 1rem; }

            & .plan-detail__desc {
                margin: 0 0 ${s('lg')};
                opacity: 0.85;
                white-space: pre-wrap;
            }
            & .plan-detail__desc.hidden { display: none; }

            & .plan-detail__meta {
                display: grid;
                grid-template-columns: max-content 1fr;
                gap: ${s('xs')} ${s('md')};
                margin: 0 0 ${s('xl')};
                font-size: 0.875rem;
                & dt { opacity: 0.7; }
                & dd { margin: 0; }
            }

            & .plan-detail__form {
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
                & .plan-detail__select-host .ui-select { display: block; }
            }

            & .plan-detail__form-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                & button { ${btn()} }
            }

            & .plan-detail__archive {
                background: transparent;
                border: 1px solid ${t('error')};
                color: ${t('error')};
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
            }

            & .plan-detail__section { margin-top: ${s('xl')}; }

            & .plan-detail__empty {
                padding: ${s('md')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .plan-detail__empty.hidden { display: none; }

            & .plan-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .plan-detail__item {
                display: block;
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                color: ${t('text')};
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { background: ${t('hover-bg')}; }
            }
            & .plan-detail__item-title { font-weight: 500; }
            & .plan-detail__item-meta { opacity: 0.7; font-size: 0.8125rem; margin-top: ${s('xs')}; }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private svc = this.inject(PlansService);
    private teachers = this.inject(TeachersService);

    private detail = new Signal<PlanDetail | null>(null);
    private resolved = new Signal(false);
    private titleVal = new Signal('');
    private descVal = new Signal('');
    private startVal = new Signal('');
    private endVal = new Signal('');
    private primaryVal = new Signal('');

    private isOwner = new Computed(() => {
        const d = this.detail.get();
        const user = this.auth.currentUser.get();
        return !!d && !!user && d.studentId === user.id;
    });

    private primaryLabel = new Computed(() => {
        const d = this.detail.get();
        if (!d?.primaryTeacherId) return '(ingen)';
        const t = this.teachers.items.get().find((x: Teacher) => x.id === d.primaryTeacherId);
        return t?.displayName ?? d.primaryTeacherId;
    });

    private teacherOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: '(ingen huvudtränare)' },
        ...this.teachers.items.get().map((t: Teacher) => ({ value: t.id, label: t.displayName })),
    ]);

    onMount(): void {
        void this.load();
    }

    private planId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private async load(): Promise<void> {
        const id = this.planId();
        if (!id) {
            this.resolved.set(true);
            return;
        }
        void this.teachers.load();
        const result = await this.svc.loadDetail(id);
        this.detail.set(result);
        if (result) {
            this.titleVal.set(result.title);
            this.descVal.set(result.description ?? '');
            this.startVal.set(result.startDate ?? '');
            this.endVal.set(result.endDate ?? '');
            this.primaryVal.set(result.primaryTeacherId ?? '');
        }
        this.resolved.set(true);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => {
                    if (this.resolved.get() && !this.detail.get()) return 'plan-detail missing';
                    return 'plan-detail';
                },
                inert: () => this.svc.loading.get(),
            },
            back: this.router.link('/planer'),
            titleRead: { textContent: () => this.detail.get()?.title ?? '' },
            descRead: {
                className: () => this.detail.get()?.description
                    ? 'plan-detail__desc' : 'plan-detail__desc hidden',
                textContent: () => this.detail.get()?.description ?? '',
            },
            statusRead: {
                textContent: () => this.detail.get()?.status === 'archived' ? 'Arkiverad' : 'Aktiv',
            },
            startRead: { textContent: () => this.detail.get()?.startDate ?? '(ej angiven)' },
            endRead: { textContent: () => this.detail.get()?.endDate ?? '(ej angiven)' },
            primaryRead: { textContent: () => this.primaryLabel.get() },
            readSection: {
                className: () => this.isOwner.get() ? 'plan-detail__read hidden' : 'plan-detail__read',
            },
            editForm: {
                className: () => this.isOwner.get() ? 'plan-detail__form' : 'plan-detail__form hidden',
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const id = this.planId();
                    const title = this.titleVal.get().trim();
                    if (!title) return;
                    const updated = await this.svc.update(id, {
                        title,
                        description: this.descVal.get().trim() || null,
                        startDate: this.startVal.get() || null,
                        endDate: this.endVal.get() || null,
                        primaryTeacherId: this.primaryVal.get() || null,
                    });
                    if (updated) await this.load();
                },
            },
            titleInput: {
                value: () => this.titleVal.get(),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            startInput: {
                value: () => this.startVal.get(),
                oninput: (e: Event) => this.startVal.set((e.target as HTMLInputElement).value),
            },
            endInput: {
                value: () => this.endVal.get(),
                oninput: (e: Event) => this.endVal.set((e.target as HTMLInputElement).value),
            },
            submit: { type: 'submit' },
            archive: {
                className: () => this.detail.get()?.status === 'archived'
                    ? 'plan-detail__archive hidden' : 'plan-detail__archive',
                onclick: async () => {
                    if (!window.confirm('Arkivera planen? Befintliga kopplingar behålls.')) return;
                    const ok = await this.svc.archive(this.planId());
                    if (ok) await this.load();
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            lessonsEmpty: {
                className: () => (this.detail.get()?.lessons.length ?? 0) === 0
                    ? 'plan-detail__empty' : 'plan-detail__empty hidden',
            },
            tsEmpty: {
                className: () => (this.detail.get()?.trainingSessions.length ?? 0) === 0
                    ? 'plan-detail__empty' : 'plan-detail__empty hidden',
            },
        });

        this.spawn(SelectComponent, this.ref(frag, 'teacherSelectHost'), {
            value: this.primaryVal,
            options: this.teacherOptions,
        });

        const lessonsHost = this.ref(frag, 'lessonsList');
        this.$each(lessonsHost, () => this.detail.get()?.lessons ?? [], (l) => this.renderLesson(l), (l) => l.id);

        const tsHost = this.ref(frag, 'tsList');
        this.$each(tsHost, () => this.detail.get()?.trainingSessions ?? [], (ts) => this.renderTs(ts), (ts) => ts.id);

        return frag;
    }

    private renderLesson(item: LinkedLessonRef): HTMLElement {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'plan-detail__item';
        const path = `/lektioner/${item.id}`;
        a.href = path;
        a.onclick = (e) => { e.preventDefault(); this.router.navigate(path); };
        const title = document.createElement('div');
        title.className = 'plan-detail__item-title';
        title.textContent = DATETIME_FORMAT.format(new Date(item.scheduledAt));
        a.appendChild(title);
        const meta = document.createElement('div');
        meta.className = 'plan-detail__item-meta';
        const bits = [item.teacherDisplayName, item.status];
        if (item.horseName) bits.push(item.horseName);
        meta.textContent = bits.join(' · ');
        a.appendChild(meta);
        li.appendChild(a);
        return li;
    }

    private renderTs(item: LinkedTrainingSessionRef): HTMLElement {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'plan-detail__item';
        const path = `/traningspass/${item.id}`;
        a.href = path;
        a.onclick = (e) => { e.preventDefault(); this.router.navigate(path); };
        const title = document.createElement('div');
        title.className = 'plan-detail__item-title';
        title.textContent = DATETIME_FORMAT.format(new Date(item.performedAt));
        a.appendChild(title);
        const meta = document.createElement('div');
        meta.className = 'plan-detail__item-meta';
        const bits: string[] = [];
        if (item.durationMin != null) bits.push(`${item.durationMin} min`);
        if (item.horseName) bits.push(item.horseName);
        if (item.summary) bits.push(item.summary);
        meta.textContent = bits.join(' · ') || '(ingen detalj)';
        a.appendChild(meta);
        li.appendChild(a);
        return li;
    }
}
