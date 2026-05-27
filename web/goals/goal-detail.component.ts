import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s } from '../css';
import { GoalsService } from './goals.service';
import { PlansService } from '../plans/plans.service';
import type { GoalTeacherView, Plan } from '../api';

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

        <section bind="plansSection" class="goal-detail__plans">
            <h3>Tillhör planer</h3>
            <ul bind="plansList" class="goal-detail__plans-list"></ul>
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

            & .goal-detail__plans { margin-top: ${s('xl')}; }
            & .goal-detail__plans.hidden { display: none; }
            & .goal-detail__plans h3 { margin: 0 0 ${s('sm')}; font-size: 1rem; }
            & .goal-detail__plans-list {
                list-style: none; margin: 0; padding: 0;
                display: flex; flex-direction: column; gap: ${s('xs')};

                & li {
                    display: flex; align-items: center; gap: ${s('sm')};
                    padding: ${s('sm')} ${s('md')};
                    background: ${t('surface')};
                    border-radius: ${t('radius')};
                    font-size: 0.875rem;
                }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private svc = this.inject(GoalsService);
    private plansSvc = this.inject(PlansService);
    private goal = new Signal<GoalTeacherView | null>(null);
    private resolved = new Signal(false);
    private linkedPlanIds = new Signal<string[]>([]);

    private isOwner = new Computed(() => {
        const g = this.goal.get();
        const me = this.auth.currentUser.get();
        return !!g && !!me && g.studentId === me.id;
    });

    private pickerPlans = new Computed<Plan[]>(() => {
        const owned = this.plansSvc.items.get();
        const linked = new Set(this.linkedPlanIds.get());
        return owned.filter((p) => p.status === 'active' || linked.has(p.id));
    });

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
        this.linkedPlanIds.set(detail?.planIds ?? []);
        this.resolved.set(true);
        const me = this.auth.currentUser.get();
        if (detail && me && detail.studentId === me.id) {
            void this.plansSvc.load();
        }
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
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
            plansSection: {
                className: () => this.isOwner.get() ? 'goal-detail__plans' : 'goal-detail__plans hidden',
            },
        });

        const plansHost = this.ref(frag, 'plansList');
        this.$each(
            plansHost,
            this.pickerPlans,
            (p) => this.renderPlanRow(p),
            (p) => `${p.id}:${p.status}:${this.linkedPlanIds.get().includes(p.id)}`,
        );

        return frag;
    }

    private renderPlanRow(plan: Plan): HTMLElement {
        const li = document.createElement('li');
        const linkedIds = this.linkedPlanIds.get();
        const linked = linkedIds.includes(plan.id);

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = linked;
        cb.disabled = plan.status === 'archived';
        cb.addEventListener('change', async () => {
            const goalId = this.goal.get()?.id;
            if (!goalId) return;
            const ok = cb.checked
                ? await this.svc.attachPlan(goalId, plan.id)
                : await this.svc.detachPlan(goalId, plan.id);
            if (!ok) {
                cb.checked = !cb.checked;
                return;
            }
            const next = cb.checked
                ? [...this.linkedPlanIds.get(), plan.id]
                : this.linkedPlanIds.get().filter((id) => id !== plan.id);
            this.linkedPlanIds.set(next);
        });
        li.appendChild(cb);

        const label = document.createElement('span');
        const bits = [plan.title];
        if (plan.status === 'archived') bits.push('(arkiverad)');
        label.textContent = bits.join(' ');
        label.style.flex = '1';
        li.appendChild(label);

        return li;
    }
}
