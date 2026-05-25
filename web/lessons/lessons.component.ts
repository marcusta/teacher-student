import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { LessonsService } from './lessons.service';
import { StudentsService } from '../students/students.service';
import type { Lesson, LessonForUser, Student } from '../api';

const tpl = template(`
    <div class="lessons" bind="root">
        <h2>Lektioner</h2>

        <form bind="form" class="lessons__form">
            <select bind="studentSelect" required></select>
            <input bind="whenInput" type="datetime-local" required>
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

                & select, & input {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
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
    private studentVal = new Signal('');
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

    onMount(): void {
        void this.lessons.load();
        void this.students.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.lessons.loading.get() },
            studentSelect: {
                value: () => this.studentVal.get(),
                onchange: (e: Event) => this.studentVal.set((e.target as HTMLSelectElement).value),
            },
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
                    const ok = await this.lessons.create({
                        studentId,
                        scheduledAt: fromLocalInput(when),
                    });
                    if (ok) this.whenVal.set('');
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

        // Populate the student <select> from the roster signal.
        const select = this.ref(frag, 'studentSelect') as HTMLSelectElement;
        this.$each(select, this.students.items, (st: Student) => {
            const opt = document.createElement('option');
            opt.value = st.id;
            opt.textContent = st.displayName;
            return opt;
        }, (st) => st.id);

        const upcomingHost = this.ref(frag, 'upcomingList');
        this.$each(upcomingHost, this.upcoming, (l) => this.renderItem(l), (l) => l.id);
        const pastHost = this.ref(frag, 'pastList');
        this.$each(pastHost, this.past, (l) => this.renderItem(l), (l) => l.id);

        return frag;
    }

    private router = this.inject(Router);

    private renderItem(item: LessonForUser): HTMLElement {
        const li = document.createElement('li');
        // Teachers click through to the edit page; students see read-only.
        const row: HTMLElement = item.role === 'teacher'
            ? document.createElement('a')
            : document.createElement('div');
        const statusClass = item.status === 'cancelled'
            ? ' lessons__item--cancelled'
            : item.status === 'completed' ? ' lessons__item--completed' : '';
        row.className = 'lessons__item' + statusClass;
        if (row instanceof HTMLAnchorElement) {
            const href = `/lektioner/${item.id}`;
            row.href = href;
            row.addEventListener('click', (e) => {
                e.preventDefault();
                this.router.navigate(href);
            });
        }

        const left = document.createElement('div');
        const when = document.createElement('div');
        when.className = 'lessons__item-when';
        when.textContent = DATETIME_FORMAT.format(new Date(item.scheduledAt));
        const who = document.createElement('div');
        who.className = 'lessons__item-who';
        const rolePrefix = item.role === 'teacher' ? 'Elev: ' : 'Lärare: ';
        const horseSuffix = item.horseName ? ` · ${item.horseName}` : '';
        who.textContent = rolePrefix + item.counterpartyDisplayName + horseSuffix;
        left.appendChild(when);
        left.appendChild(who);

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
