import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s } from '../css';
import { GoalsService } from './goals.service';
import type { GoalTeacherView } from '../api';

const STATUS_LABEL: Record<GoalTeacherView['status'], string> = {
    active: 'Aktiv',
    achieved: 'Uppnått',
    abandoned: 'Arkiverad',
};

const tpl = template(`
    <div class="goal-detail" bind="root">
        <a bind="back" href="/mal" class="goal-detail__back">← Tillbaka</a>
        <div bind="missing" class="goal-detail__missing">Målet kunde inte hittas.</div>

        <section bind="readSection" class="goal-detail__read">
            <h2 bind="titleRead"></h2>
            <p bind="descRead" class="goal-detail__desc"></p>
            <dl class="goal-detail__meta">
                <dt>Status</dt><dd bind="statusRead"></dd>
                <dt>Måldatum</dt><dd bind="targetRead"></dd>
            </dl>
        </section>
    </div>
`);

export class GoalDetailComponent extends Component {
    static styles = `
        .goal-detail {
            max-width: 720px;

            & .goal-detail__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & .goal-detail__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .goal-detail__missing { display: block; }
            &.missing .goal-detail__read { display: none; }

            & .goal-detail__desc {
                margin: 0 0 ${s('lg')};
                opacity: 0.85;
                white-space: pre-wrap;
            }
            & .goal-detail__desc.hidden { display: none; }

            & .goal-detail__meta {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: ${s('xs')} ${s('md')};
                margin: 0;
                font-size: 0.875rem;

                & dt { opacity: 0.7; }
                & dd { margin: 0; }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private svc = this.inject(GoalsService);
    private goal = new Signal<GoalTeacherView | null>(null);
    private resolved = new Signal(false);

    private backHref = new Computed(() => {
        const g = this.goal.get();
        const me = this.auth.currentUser.get();
        if (g && me && g.studentId !== me.id) return `/students/${g.studentId}`;
        return '/mal';
    });

    onMount(): void {
        void this.load();
    }

    private goalId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private async load(): Promise<void> {
        const detail = await this.svc.loadDetail(this.goalId());
        this.goal.set(detail);
        this.resolved.set(true);
    }

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.goal.get()
                    ? 'goal-detail missing' : 'goal-detail',
            },
            back: {
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate(this.backHref.get());
                },
                href: () => this.backHref.get(),
            },
            titleRead: { textContent: () => this.goal.get()?.title ?? '' },
            descRead: {
                className: () => this.goal.get()?.description
                    ? 'goal-detail__desc' : 'goal-detail__desc hidden',
                textContent: () => this.goal.get()?.description ?? '',
            },
            statusRead: {
                textContent: () => {
                    const st = this.goal.get()?.status;
                    return st ? STATUS_LABEL[st] : '';
                },
            },
            targetRead: {
                textContent: () => this.goal.get()?.targetDate ?? '(inget)',
            },
        });
    }
}
