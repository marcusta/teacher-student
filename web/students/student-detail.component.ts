import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { StudentsService } from './students.service';
import type { Student, Horse, TrainingSession, Plan } from '../api';

const tpl = template(`
    <div class="student-detail" bind="root">
        <a bind="back" href="/students" class="student-detail__back">← Tillbaka</a>
        <h2 bind="name"></h2>
        <div bind="email" class="student-detail__email"></div>
        <div bind="missing" class="student-detail__missing">Eleven kunde inte hittas.</div>
        <section class="student-detail__section">
            <h3>Hästar</h3>
            <div bind="horsesEmpty" class="student-detail__empty">Inga hästar.</div>
            <ul bind="horsesList" class="student-detail__horses"></ul>
        </section>
        <section class="student-detail__section">
            <h3>Träningsplaner</h3>
            <div bind="plansEmpty" class="student-detail__empty">Inga träningsplaner.</div>
            <ul bind="plansList" class="student-detail__horses"></ul>
        </section>
        <section class="student-detail__section">
            <h3>Träningspass</h3>
            <div bind="tsEmpty" class="student-detail__empty">Inga delade träningspass.</div>
            <ul bind="tsList" class="student-detail__horses"></ul>
        </section>
    </div>
`);

export class StudentDetailComponent extends Component {
    static styles = `
        .student-detail {
            max-width: 640px;

            & .student-detail__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('xs')}; }

            & .student-detail__email {
                color: ${t('text')};
                opacity: 0.7;
                font-size: 0.875rem;
                margin-bottom: ${s('xl')};
            }

            & .student-detail__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .student-detail__missing { display: block; }
            &.missing h2,
            &.missing .student-detail__email,
            &.missing .student-detail__section { display: none; }

            & .student-detail__section {
                margin-top: ${s('lg')};

                & h3 {
                    margin: 0 0 ${s('sm')};
                    font-size: 1rem;
                }
            }

            & .student-detail__empty {
                padding: ${s('md')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .student-detail__empty.hidden { display: none; }

            & .student-detail__horses {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};

                & li {
                    padding: ${s('sm')} ${s('md')};
                    background: ${t('surface')};
                    border-radius: ${t('radius')};
                    font-size: 0.875rem;
                }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(StudentsService);
    private student = new Signal<Student | null>(null);
    private resolved = new Signal(false);
    private horses = new Signal<Horse[]>([]);
    private trainingSessions = new Signal<TrainingSession[]>([]);
    private plans = new Signal<Plan[]>([]);

    onMount(): void {
        const id = this.router.route.get().split('/')[2] ?? '';
        void this.svc.get(id).then((s) => {
            this.student.set(s);
            this.resolved.set(true);
            if (s) {
                void this.svc.listHorses(id).then((list) => {
                    if (list) this.horses.set(list);
                });
                void this.svc.listTrainingSessions(id).then((list) => {
                    if (list) this.trainingSessions.set(list);
                });
                void this.svc.listPlans(id).then((list) => {
                    if (list) this.plans.set(list);
                });
            }
        });
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.student.get()
                    ? 'student-detail missing' : 'student-detail',
            },
            back: this.router.link('/students'),
            name: { textContent: () => this.student.get()?.displayName ?? '' },
            email: { textContent: () => this.student.get()?.email ?? '' },
            horsesEmpty: {
                className: () => this.horses.get().length === 0
                    ? 'student-detail__empty' : 'student-detail__empty hidden',
            },
            tsEmpty: {
                className: () => this.trainingSessions.get().length === 0
                    ? 'student-detail__empty' : 'student-detail__empty hidden',
            },
            plansEmpty: {
                className: () => this.plans.get().length === 0
                    ? 'student-detail__empty' : 'student-detail__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'horsesList');
        this.$each(listHost, this.horses, (h) => {
            const li = document.createElement('li');
            li.textContent = h.name;
            return li;
        }, (h) => h.id);

        const plansHost = this.ref(frag, 'plansList');
        const dateFmt = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' });
        this.$each(plansHost, this.plans, (p) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            const path = `/planer/${p.id}`;
            link.href = path;
            link.onclick = (e) => { e.preventDefault(); this.router.navigate(path); };
            const bits = [p.title];
            if (p.startDate || p.endDate) {
                const s = p.startDate ? dateFmt.format(new Date(p.startDate)) : '?';
                const e = p.endDate ? dateFmt.format(new Date(p.endDate)) : '?';
                bits.push(`${s} – ${e}`);
            }
            if (p.primaryTeacherDisplayName) bits.push(p.primaryTeacherDisplayName);
            link.textContent = bits.join(' · ');
            link.style.color = 'inherit';
            link.style.textDecoration = 'none';
            li.appendChild(link);
            return li;
        }, (p) => `${p.id}:${p.title}:${p.startDate ?? ''}:${p.endDate ?? ''}:${p.primaryTeacherDisplayName ?? ''}`);

        const tsHost = this.ref(frag, 'tsList');
        const fmt = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' });
        this.$each(tsHost, this.trainingSessions, (ts) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            const path = `/traningspass/${ts.id}`;
            link.href = path;
            link.onclick = (e) => { e.preventDefault(); this.router.navigate(path); };
            const bits = [fmt.format(new Date(ts.performedAt))];
            if (ts.durationMin != null) bits.push(`${ts.durationMin} min`);
            if (ts.horseName) bits.push(ts.horseName);
            link.textContent = bits.join(' · ');
            link.style.color = 'inherit';
            link.style.textDecoration = 'none';
            li.appendChild(link);
            return li;
        }, (ts) => ts.id);

        return frag;
    }
}
