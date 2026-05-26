import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { LessonsService } from './lessons.service';
import { StudentsService } from '../students/students.service';
import { ProgramsService } from '../programs/programs.service';
import { api, type Lesson, type LessonForUser, type Plan } from '../api';

const tpl = template(`
    <div class="lessons" bind="root">
        <h2>Lektioner</h2>

        <form bind="form" class="lessons__form">
            <div bind="studentSelectHost" class="lessons__student-host"></div>
            <input bind="whenInput" type="datetime-local" required>
            <div bind="programSelectHost" class="lessons__program-host"></div>
            <div bind="planSelectHost" class="lessons__plan-host"></div>
            <div class="lessons__form-row">
                <button bind="submit" type="submit">Boka lektion</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="lessons__empty">Inga lektioner än.</div>

        <section bind="upcomingSection" class="lessons__section">
            <h3>Kommande</h3>
            <ul bind="upcomingList" class="lessons__list"></ul>
        </section>
        <section bind="pastSection" class="lessons__section">
            <h3>Tidigare</h3>
            <ul bind="pastList" class="lessons__list"></ul>
        </section>
    </div>
`);

const DATETIME_FORMAT = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function fromLocalInput(value: string): string {
    // <input type="datetime-local"> returns "YYYY-MM-DDTHH:mm" with no zone;
    // interpret it as the user's local time and convert to ISO UTC.
    return new Date(value).toISOString();
}

export class LessonsComponent extends Component {
    static styles = `
        .lessons {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .lessons__form.hidden { display: none; }
            & .lessons__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('xl')};
                padding: ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};

                & input {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
                & .lessons__student-host .ui-select { display: block; }
                & .lessons__program-host .ui-select { display: block; }
                & .lessons__plan-host .ui-select { display: block; }
            }

            & .lessons__form-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                & button { ${btn()} }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .lessons__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .lessons__empty.hidden { display: none; }

            & .lessons__section {
                margin-top: ${s('lg')};
                & h3 { margin: 0 0 ${s('sm')}; font-size: 1rem; }
            }
            & .lessons__section.hidden { display: none; }

            & .lessons__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .lessons__item {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                font-size: 0.875rem;
                text-decoration: none;
                color: inherit;

                &:hover { background: ${t('hover-bg')}; }
            }
            & .lessons__item--cancelled {
                opacity: 0.5;
                & .lessons__item-when { text-decoration: line-through; }
            }
            & .lessons__item--completed {
                opacity: 0.75;
            }
            & .lessons__item-badge--muted {
                background: transparent;
                color: ${t('text')};
                opacity: 0.7;
                border: 1px solid currentColor;
            }
            & .lessons__item-when { font-weight: 500; }
            & .lessons__item-who { opacity: 0.7; font-size: 0.8125rem; }
            & .lessons__item-ex { opacity: 0.7; font-size: 0.8125rem; margin-top: ${s('xs')}; }
            & .lessons__item-program { opacity: 0.7; font-size: 0.8125rem; margin-top: ${s('xs')}; font-style: italic; }
            & .lessons__item-badge {
                align-self: center;
                font-size: 0.75rem;
                padding: 0 ${s('xs')};
                border-radius: 999px;
                background: ${t('active-bg')};
                color: ${t('active-text')};
            }
        }
    `;

    private lessons = this.inject(LessonsService);
    private students = this.inject(StudentsService);
    private programs = this.inject(ProgramsService);
    private studentVal = new Signal('');
    private programVal = new Signal('');
    private planVal = new Signal('');
    private plans = new Signal<Plan[]>([]);
    private whenVal = new Signal('');
    private nowIso = new Signal(new Date().toISOString());
    private upcoming = new Computed(() =>
        this.lessons.items.get().filter((l) => l.scheduledAt >= this.nowIso.get()),
    );
    private past = new Computed(() =>
        this.lessons.items.get()
            .filter((l) => l.scheduledAt < this.nowIso.get())
            .slice().reverse(), // most-recent past first
    );
    private studentOptions = new Computed<SelectOption[]>(() =>
        this.students.items.get().map((st) => ({ value: st.id, label: st.displayName })),
    );
    private programOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: '(inget program)' },
        ...this.programs.items.get().map((p) => ({ value: p.id, label: p.title })),
    ]);
    private planOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: '(ingen plan)' },
        ...this.plans.get().map((p) => ({ value: p.id, label: p.title })),
    ]);

    onMount(): void {
        void this.lessons.load();
        void this.students.load();
        void this.programs.load();
        // Default the picker to the first Student once roster loads so the
        // visually-selected option (browser fallback) matches the signal.
        this.track(effect(() => {
            const first = this.students.items.get()[0];
            if (first && !this.studentVal.get()) this.studentVal.set(first.id);
        }));
        this.track(effect(() => {
            const studentId = this.studentVal.get();
            if (!studentId) {
                this.plans.set([]);
                return;
            }
            void api.students.listPlans({ id: studentId }).then((list) => {
                if (this.studentVal.get() === studentId) this.plans.set(list);
            }).catch(() => {
                if (this.studentVal.get() === studentId) this.plans.set([]);
            });
        }));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.lessons.loading.get() },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            form: {
                className: () => this.students.items.get().length === 0
                    ? 'lessons__form hidden' : 'lessons__form',
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const studentId = this.studentVal.get();
                    const when = this.whenVal.get();
                    if (!studentId || !when) return;
                    const programId = this.programVal.get();
                    const planId = this.planVal.get();
                    const ok = await this.lessons.create({
                        studentId,
                        scheduledAt: fromLocalInput(when),
                        ...(programId ? { programId } : {}),
                        ...(planId ? { planId } : {}),
                    });
                    if (ok) {
                        this.whenVal.set('');
                        this.programVal.set('');
                        this.planVal.set('');
                    }
                },
            },
            error: { textContent: () => this.lessons.error.get()?.message ?? '' },
            empty: {
                className: () => this.lessons.items.get().length === 0
                    ? 'lessons__empty' : 'lessons__empty hidden',
            },
            upcomingSection: {
                className: () => this.upcoming.get().length === 0
                    ? 'lessons__section hidden' : 'lessons__section',
            },
            pastSection: {
                className: () => this.past.get().length === 0
                    ? 'lessons__section hidden' : 'lessons__section',
            },
        });

        this.spawn(SelectComponent, this.ref(frag, 'studentSelectHost'), {
            value: this.studentVal,
            options: this.studentOptions,
            placeholder: 'Välj elev',
        });
        this.spawn(SelectComponent, this.ref(frag, 'programSelectHost'), {
            value: this.programVal,
            options: this.programOptions,
        });
        this.spawn(SelectComponent, this.ref(frag, 'planSelectHost'), {
            value: this.planVal,
            options: this.planOptions,
        });

        const upcomingHost = this.ref(frag, 'upcomingList');
        this.$each(upcomingHost, this.upcoming, (l) => this.renderItem(l), (l) => l.id);
        const pastHost = this.ref(frag, 'pastList');
        this.$each(pastHost, this.past, (l) => this.renderItem(l), (l) => l.id);

        return frag;
    }

    private router = this.inject(Router);

    private renderItem(item: LessonForUser): HTMLElement {
        const li = document.createElement('li');
        // Both roles click through to the detail page (teacher edits,
        // student sees read-only summary + Notes — see lesson-edit shell).
        const row = document.createElement('a');
        const statusClass = item.status === 'cancelled'
            ? ' lessons__item--cancelled'
            : item.status === 'completed' ? ' lessons__item--completed' : '';
        row.className = 'lessons__item' + statusClass;
        const href = `/lektioner/${item.id}`;
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const left = document.createElement('div');
        const when = document.createElement('div');
        when.className = 'lessons__item-when';
        when.textContent = DATETIME_FORMAT.format(new Date(item.scheduledAt));
        const who = document.createElement('div');
        who.className = 'lessons__item-who';
        const rolePrefix = item.role === 'teacher' ? 'Elev: ' : 'Lärare: ';
        const horseSuffix = item.horseName ? ` · ${item.horseName}` : '';
        const planSuffix = item.planTitle ? ` · ${item.planTitle}` : '';
        who.textContent = rolePrefix + item.counterpartyDisplayName + horseSuffix + planSuffix;
        left.appendChild(when);
        left.appendChild(who);
        if (item.programs.length > 0) {
            const pr = document.createElement('div');
            pr.className = 'lessons__item-program';
            pr.textContent = 'Från program: ' + item.programs.map((p) => p.title).join(', ');
            left.appendChild(pr);
        }
        if (item.exercises.length > 0) {
            const ex = document.createElement('div');
            ex.className = 'lessons__item-ex';
            ex.textContent = 'Övningar: ' + item.exercises.map((e) => e.name).join(', ');
            left.appendChild(ex);
        }

        const badge = document.createElement('span');
        const mutedBadge = item.status === 'planned' ? '' : ' lessons__item-badge--muted';
        badge.className = 'lessons__item-badge' + mutedBadge;
        const prefix = item.status === 'completed' ? '✓ ' : '';
        badge.textContent = prefix + statusLabel(item.status);

        row.appendChild(left);
        row.appendChild(badge);
        li.appendChild(row);
        return li;
    }
}

function statusLabel(status: Lesson['status']): string {
    switch (status) {
        case 'planned': return 'Planerad';
        case 'completed': return 'Utförd';
        case 'cancelled': return 'Inställd';
    }
}
