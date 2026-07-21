import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { formatIsoDate, plural, t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { ShareChipComponent } from '../ui/share-chip.component';
import { GoalsService } from './goals.service';
import { PlansService } from '../plans/plans.service';
import { TeachersService } from '../training-sessions/teachers.service';
import {
    descriptionExcerpt,
    goalRowKey,
    goalStatusPill,
    groupGoals,
    isOverdue,
    ownerRecipients,
    planMembership,
    targetDateLabel,
} from './goal-copy';
import type { Goal } from '../api';

const tpl = template(`
    <div class="goals">
        <header class="goals__head">
            <h1 bind="heading" class="goals__title"></h1>
            <button bind="create" type="button" class="goals__create"></button>
        </header>

        <p bind="loading" class="goals__loading"></p>

        <div bind="errorBox" class="goals__error" role="alert">
            <p bind="errorText" class="goals__error-text"></p>
            <button bind="retry" type="button" class="goals__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="activeSection" class="goals__group">
            <h2 bind="activeLabel" class="goals__group-label"></h2>
            <ul bind="activeList" class="goals__list"></ul>
        </section>

        <section bind="achievedSection" class="goals__group">
            <h2 bind="achievedLabel" class="goals__group-label"></h2>
            <ul bind="achievedList" class="goals__list"></ul>
        </section>

        <section bind="abandonedSection" class="goals__group">
            <button bind="abandonedToggle" type="button" class="goals__disclosure" aria-expanded="false"></button>
            <ul bind="abandonedList" class="goals__list"></ul>
        </section>
    </div>
`);

/**
 * Mål — IA §3.13. The Goals this account owns, grouped **Aktiva → Uppnådda →
 * Avbrutna**.
 *
 * **Never gated on having a teacher.** §3.13 and UI_DECISIONS §1 both say so:
 * a Goal belongs to an account outright, and sharing changes only who *else*
 * can read it. So an account with no Relations sees the full view, the create
 * action, and rows whose sharing chip simply reads `Privat`.
 *
 * **Every row links to `/mal/:id`.** §3.13 calls this out as a defect in the
 * previous list — "the current list does not consistently expose that path" —
 * and the fix is structural: the row IS an anchor, so there is no branch in
 * which a Goal renders without its detail route.
 *
 * **Overdue is metadata, not a status.** §3.13 is explicit. A past target date
 * adds a supporting line next to the *Aktiv* pill; it never becomes a fourth
 * pill, never re-sorts the list, and disappears the moment the Goal is achieved
 * or abandoned — see `isOverdue`.
 *
 * **Rows wait for names.** The sharing chip must NAME its recipients (§4.5) and
 * the plan-membership summary must name its Plans, but a Goal carries only ids;
 * the names live behind two independent requests. Painting as soon as the Goals
 * land would render every shared row as `Delad: okänd mottagare` for however
 * long those take. That degraded label exists for a Relation that has genuinely
 * gone, not for the happy path, so the list holds until both answers are in —
 * including when they FAIL, which is the point at which "no names" becomes the
 * honest outcome rather than a temporary one.
 */
export class GoalsComponent extends Component {
    static styles = `
        .goals {
            & .goals__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .goals__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .goals__create { ${btn(token('radius-sm'), 'primary')} }

            & .goals__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .goals__loading.hidden { display: none; }

            & .goals__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .goals__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                & .goals__retry { ${btn()} }
            }
            & .goals__error.hidden { display: none; }

            & .goals__group { margin-bottom: ${s('xl')}; }
            & .goals__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .goals__group-label {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-ui')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            /* Avbrutna is collapsed (§3.13 "preferably behind a filter or
               collapsed section"), so its label is the disclosure itself. */
            & .goals__disclosure {
                display: inline-flex;
                align-items: center;
                gap: ${s('sm')};
                margin: 0 0 ${s('md')};
                padding: ${s('xs')} 0;
                background: transparent;
                border: none;
                cursor: pointer;
                font-family: ${token('font-ui')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
                &:hover { color: ${token('accent-strong')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .goals__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .goals__list:empty { border-top: none; }
            & .goals__list.hidden { display: none; }
            & .goals__list > li { border-bottom: 1px solid ${token('border')}; }

            & .goal-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-family: ${token('font-ui')};

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }
            /* Abandoned rows are dimmed, as §4.3 dims a cancelled row. */
            & .goal-row--abandoned { opacity: 0.72; }

            & .goal-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .goal-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .goal-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }
            /* Overdue is supporting metadata (§3.13), so it borrows the warning
               tone for emphasis but never the pill's shape grammar — it is not
               a status and must not read as one. */
            & .goal-row__overdue { color: ${token('warning')}; font-weight: 600; }
            & .goal-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }

            & .goal-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('xs')};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .goal-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${s('sm')};
                }
                & .goal-row__chips { justify-content: flex-start; max-width: none; }
                & .goals__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private goals = this.inject(GoalsService);
    private plans = this.inject(PlansService);
    private teachers = this.inject(TeachersService);

    /** See the class docs: rows are held until both name sources answer. */
    private namesResolved = new Signal(false);
    private showAbandoned = new Signal(false);

    /**
     * Frozen at mount. Re-reading the clock inside the overdue derivation would
     * flip a row's overdue line mid-render, on a signal nothing subscribed to.
     */
    private today = new Signal(formatIsoDate(new Date()));

    private grouped = new Computed(() =>
        groupGoals(this.namesResolved.get() ? this.goals.items.get() : []));
    private active = new Computed(() => this.grouped.get().active);
    private achieved = new Computed(() => this.grouped.get().achieved);
    private abandoned = new Computed(() => this.grouped.get().abandoned);

    private isEmpty = new Computed(() =>
        this.namesResolved.get()
        && this.goals.items.get().length === 0
        && !this.goals.loading.get()
        && this.goals.error.get() === null,
    );

    onMount(): void {
        void this.goals.load();
        // Both name sources gate the rows, and a FAILED request resolves the
        // gate too — at that point the chip has no names and never will, and
        // saying so is the honest outcome rather than an indefinite spinner.
        void Promise.allSettled([this.plans.load(), this.teachers.load()])
            .then(() => this.namesResolved.set(true));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('goals.heading') },
            create: {
                textContent: () => t('goals.create'),
                onclick: () => this.router.navigate('/mal/nytt'),
            },
            loading: {
                textContent: () => t('goals.loading'),
                // Covers the window where the Goals have landed but the plan and
                // teacher names have not, so holding the rows back reads as
                // "still loading" rather than as a blank list.
                className: () => (!this.namesResolved.get() || this.goals.loading.get())
                    && this.goals.items.get().length === 0
                    && this.goals.error.get() === null
                    ? 'goals__loading' : 'goals__loading hidden',
            },
            errorBox: {
                className: () => this.goals.error.get() ? 'goals__error' : 'goals__error hidden',
            },
            errorText: { textContent: () => t('goals.error') },
            retry: {
                textContent: () => t('goals.retry'),
                onclick: () => void this.goals.load(),
            },

            activeSection: {
                className: () => this.active.get().length === 0
                    ? 'goals__group hidden' : 'goals__group',
            },
            activeLabel: { textContent: () => t('goals.group.active') },
            achievedSection: {
                className: () => this.achieved.get().length === 0
                    ? 'goals__group hidden' : 'goals__group',
            },
            achievedLabel: { textContent: () => t('goals.group.achieved') },
            abandonedSection: {
                className: () => this.abandoned.get().length === 0
                    ? 'goals__group hidden' : 'goals__group',
            },
            abandonedToggle: {
                textContent: () => this.showAbandoned.get()
                    ? t('goals.abandoned.hide')
                    : plural('goals.abandoned.show', this.abandoned.get().length),
                'aria-expanded': () => String(this.showAbandoned.get()),
                onclick: () => this.showAbandoned.set(!this.showAbandoned.peek()),
            },
            abandonedList: {
                className: () => this.showAbandoned.get() ? 'goals__list' : 'goals__list hidden',
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'));
        this.$each(this.ref(frag, 'activeList'), this.active,
            (goal, _i, track) => this.renderRow(goal, track), goalRowKey);
        this.$each(this.ref(frag, 'achievedList'), this.achieved,
            (goal, _i, track) => this.renderRow(goal, track), goalRowKey);
        this.$each(this.ref(frag, 'abandonedList'), this.abandoned,
            (goal, _i, track) => this.renderRow(goal, track), goalRowKey);

        return frag;
    }

    /**
     * The empty state — §4.14: exactly one action, at most two sentences.
     *
     * One variant only, and deliberately: a Goal needs no Teacher, no Plan and
     * no horse, so "Bjud in lärare" would be advice this view has no business
     * giving. §3.13 says the same from the other side — "No Teachers: sharing is
     * simply absent; Goal ownership is unaffected."
     */
    private buildEmpty(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;

        this.track(effect(() => {
            const show = this.isEmpty.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;

            // Built outside the tracking scope, as spawn() does: mounting runs
            // the child's render, and those reads (locale among them) would
            // otherwise subscribe THIS effect and rebuild the empty state on
            // unrelated changes.
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('goals.empty.heading'),
                    body: () => t('goals.empty.body'),
                    action: {
                        label: () => t('goals.empty.action'),
                        onclick: () => this.router.navigate('/mal/nytt'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(goal: Goal, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        // §3.13: every row exposes `/mal/:id`. The row IS the anchor, so there
        // is no branch in which a Goal renders without its detail route.
        const href = `/mal/${goal.id}`;
        const row = document.createElement('a');
        row.className = goal.status === 'abandoned' ? 'goal-row goal-row--abandoned' : 'goal-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const body = document.createElement('span');
        body.className = 'goal-row__body';

        const title = document.createElement('span');
        title.className = 'goal-row__title';
        title.textContent = goal.title;
        body.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'goal-row__meta';
        const target = targetDateLabel(goal.targetDate);
        if (target) meta.appendChild(metaPart(target));
        if (isOverdue(goal, this.today.get())) {
            meta.appendChild(metaPart(t('goal.overdue'), 'goal-row__overdue'));
        }
        const membership = planMembership(goal.planIds, this.plans.items.get());
        if (membership) meta.appendChild(metaPart(membership));
        if (meta.childElementCount > 0) body.appendChild(meta);

        const excerpt = descriptionExcerpt(goal.description);
        if (excerpt) {
            const text = document.createElement('span');
            text.className = 'goal-row__excerpt';
            text.textContent = excerpt;
            body.appendChild(text);
        }

        const chips = document.createElement('span');
        chips.className = 'goal-row__chips';

        // §4.5: sharing is named on every row. Never a bare "Delad", never a
        // count — `ownerRecipients` resolves each id against the Teacher list and
        // `ShareChipComponent` refuses to render an unlabelled shared state.
        const shareHost = document.createElement('span');
        chips.appendChild(shareHost);
        const shareChip = new ShareChipComponent({
            recipients: () => ownerRecipients(goal.sharedTeacherIds, this.teachers.items.get()),
            shared: () => goal.sharedTeacherIds.length > 0,
        });
        shareChip.mount(shareHost);
        track(() => shareChip.destroy());

        // §4.4: the pill's SHAPE carries the status, so the row stays readable
        // with colour removed entirely.
        const descriptor = goalStatusPill(goal.status);
        const pillHost = document.createElement('span');
        chips.appendChild(pillHost);
        const pill = new StatusPillComponent({
            label: descriptor.label,
            variant: descriptor.variant,
            tone: descriptor.tone,
            ...(descriptor.glyph === undefined ? {} : { glyph: descriptor.glyph }),
        });
        pill.mount(pillHost);
        track(() => pill.destroy());

        row.append(body, chips);
        li.appendChild(row);
        return li;
    }
}

function metaPart(text: string, className?: string): HTMLElement {
    const el = document.createElement('span');
    if (className) el.className = className;
    el.textContent = text;
    return el;
}
