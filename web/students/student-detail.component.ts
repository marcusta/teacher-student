import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { StudentsService } from './students.service';
import type { Student } from '../api';

const tpl = template(`
    <div class="student-detail" bind="root">
        <a bind="back" href="/students" class="student-detail__back">← Tillbaka</a>
        <h2 bind="name"></h2>
        <div bind="email" class="student-detail__email"></div>
        <div bind="missing" class="student-detail__missing">Eleven kunde inte hittas.</div>
        <div class="student-detail__stub">Mer kommer snart.</div>
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
            &.missing .student-detail__stub { display: none; }

            & .student-detail__stub {
                padding: ${s('lg')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                font-size: 0.875rem;
                opacity: 0.7;
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(StudentsService);
    private student = new Signal<Student | null>(null);
    private resolved = new Signal(false);

    onMount(): void {
        const id = this.router.route.get().split('/')[2] ?? '';
        void this.svc.get(id).then((s) => {
            this.student.set(s);
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.student.get()
                    ? 'student-detail missing' : 'student-detail',
            },
            back: this.router.link('/students'),
            name: { textContent: () => this.student.get()?.displayName ?? '' },
            email: { textContent: () => this.student.get()?.email ?? '' },
        });
    }
}
