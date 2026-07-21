import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { plural, t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { PlansService } from './plans.service';
import {
    dateRangeLabel,
    descriptionExcerpt,
    groupPlans,
    planRowKey,
    planStatusPill,
    primaryTeacherLabel,
} from './plan-copy';
import type { Plan } from '../api';

const tpl = template(`
    <div class="plans">
        <header class="plans__head">
            <h1 bind="heading" class="plans__title"></h1>
            <button bind="create" type="button" class="plans__create"></button>
        </header>

        <p bind="loading" class="plans__loading"></p>

        <div bind="errorBox" class="plans__error" role="alert">
            <p bind="errorText" class="plans__error-text"></p>
            <button bind="retry" type="button" class="plans__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="activeSection" class="plans__group">
            <h2 bind="activeLabel" class="plans__group-label"></h2>
            <ul bind="activeList" class="plans__list"></ul>
        </section>

        <section bind="archivedSection" class="plans__group plans__group--archived">
            <button bind="archivedToggle" type="button" class="plans__disclosure" aria-expanded="false"></button>
            <ul bind="archivedList" class="plans__list"></ul>
        </section>
    </div>
`);

/**
 * Planer — IA §3.11. The Student's list of long-running training umbrellas.
 *
 * **Creation is not here.** The test client put the create form at the top of
 * this view. IA §1's shared interface grammar is explicit — "List views put
 * retrieval first. Creation opens in a dedicated panel, dialog, or route; it
 * must not dominate the list" — so it moved to `/planer/ny`, exactly as booking
 * moved to `/lektioner/ny` and logging to `/traningspass/ny`. A route rather
 * than a dialog because the form ends in a date range that can be wrong, and a
 * field-level error wants a page it can own.
 *
 * **No per-row counts.** §3.11 permits Goal / Lesson / Training Session counts
 * "only when available without per-row fan-out", and rules them
 * Composable/Backend gap otherwise. `GET /plans` returns plan rows and nothing
 * else, so counting would mean one `GET /plans/:id` per row — N+1 requests to
 * decorate a list nobody asked to have decorated. The counts wait for a summary
 * read model.
 *
 * **Archived is collapsed, not filtered away.** §3.11 asks for "an archived
 * filter/section". A disclosure keeps the archive one click deep and, unlike a
 * filter chip, states how much is behind it — while keeping this spring's plans
 * at the top of the page, where a rider is looking.
 */
export class PlansComponent extends Component {
    static styles = `
        .plans {
            & .plans__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .plans__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /*
             * Buttons are Open Sans territory; the serif is forbidden here.
             * This is the view's one primary — the only thing a reader who
             * arrived with nothing to read can do.
             */
            & .plans__create { ${btn(token('radius-sm'), 'primary')} }

            & .plans__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .plans__loading.hidden { display: none; }

            & .plans__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .plans__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                /* Retry is secondary: recovering from a failure is not the
                   thing this page is for. */
                & .plans__retry { ${btn()} }
            }
            & .plans__error.hidden { display: none; }

            & .plans__group { margin-bottom: ${s('xl')}; }
            & .plans__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .plans__group-label {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-ui')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            /* The archive disclosure carries the group label's own typography —
               it IS the group label, and pressing it is what the label offers. */
            & .plans__disclosure {
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

            & .plans__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .plans__list:empty { border-top: none; }
            & .plans__list.hidden { display: none; }
            & .plans__list > li { border-bottom: 1px solid ${token('border')}; }

            & .plan-row {
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
            /* Archived rows are dimmed, as §4.3 dims a cancelled row — the
               status pill still carries the meaning without colour. */
            & .plan-row--archived { opacity: 0.72; }

            & .plan-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .plan-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .plan-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }
            & .plan-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }

            & .plan-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('xs')};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .plan-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${s('sm')};
                }
                & .plan-row__chips { justify-content: flex-start; max-width: none; }
                & .plans__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private plans = this.inject(PlansService);

    /** Whether the archived section is expanded. Collapsed on every visit. */
    private showArchived = new Signal(false);

    private grouped = new Computed(() => groupPlans(this.plans.items.get()));
    private active = new Computed(() => this.grouped.get().active);
    private archived = new Computed(() => this.grouped.get().archived);

    private isEmpty = new Computed(() =>
        this.plans.items.get().length === 0
        && !this.plans.loading.get()
        && this.plans.error.get() === null,
    );

    onMount(): void {
        void this.plans.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('plans.heading') },
            create: {
                textContent: () => t('plans.create'),
                onclick: () => this.router.navigate('/planer/ny'),
            },
            loading: {
                textContent: () => t('plans.loading'),
                className: () => this.plans.loading.get()
                    && this.plans.items.get().length === 0
                    && this.plans.error.get() === null
                    ? 'plans__loading' : 'plans__loading hidden',
            },
            errorBox: {
                className: () => this.plans.error.get() ? 'plans__error' : 'plans__error hidden',
            },
            errorText: { textContent: () => t('plans.error') },
            retry: {
                textContent: () => t('plans.retry'),
                onclick: () => void this.plans.load(),
            },
            activeSection: {
                className: () => this.active.get().length === 0
                    ? 'plans__group hidden' : 'plans__group',
            },
            activeLabel: { textContent: () => t('plans.group.active') },
            archivedSection: {
                className: () => this.archived.get().length === 0
                    ? 'plans__group plans__group--archived hidden'
                    : 'plans__group plans__group--archived',
            },
            archivedToggle: {
                // The count lives in the label, so the disclosure says what is
                // behind it rather than asking the reader to open it to find out.
                textContent: () => this.showArchived.get()
                    ? t('plans.archived.hide')
                    : plural('plans.archived.show', this.archived.get().length),
                'aria-expanded': () => String(this.showArchived.get()),
                onclick: () => this.showArchived.set(!this.showArchived.peek()),
            },
            archivedList: {
                className: () => this.showArchived.get() ? 'plans__list' : 'plans__list hidden',
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'));
        this.$each(this.ref(frag, 'activeList'), this.active,
            (plan, _i, track) => this.renderRow(plan, track), planRowKey);
        this.$each(this.ref(frag, 'archivedList'), this.archived,
            (plan, _i, track) => this.renderRow(plan, track), planRowKey);

        return frag;
    }

    /**
     * The empty state — §4.14: exactly one action, at most two sentences, and a
     * body that explains what a Plan is *for*, which is what §3.11 asks of it:
     * "a Plan brings Goals, Lessons, and Training Sessions together."
     *
     * `EmptyStateComponent`'s single optional `action` prop makes the one-action
     * rule structural rather than a matter of discipline. There is one variant
     * only: a Plan needs no teacher, no horse and no goal, so an account with
     * nothing at all can still make one.
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
                    heading: () => t('plans.empty.heading'),
                    body: () => t('plans.empty.body'),
                    action: {
                        label: () => t('plans.empty.action'),
                        onclick: () => this.router.navigate('/planer/ny'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(plan: Plan, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/planer/${plan.id}`;
        const row = document.createElement('a');
        row.className = plan.status === 'archived' ? 'plan-row plan-row--archived' : 'plan-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const body = document.createElement('span');
        body.className = 'plan-row__body';

        const title = document.createElement('span');
        title.className = 'plan-row__title';
        title.textContent = plan.title;
        body.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'plan-row__meta';
        const range = dateRangeLabel(plan.startDate, plan.endDate);
        if (range) meta.appendChild(metaPart(range));
        // A label and a defaulting convenience, never a permission — see
        // `primaryTeacherLabel`. The detail view states the rule in words.
        const primary = primaryTeacherLabel(plan.primaryTeacherDisplayName);
        if (primary) meta.appendChild(metaPart(primary));
        if (meta.childElementCount > 0) body.appendChild(meta);

        const excerpt = descriptionExcerpt(plan.description);
        if (excerpt) {
            const text = document.createElement('span');
            text.className = 'plan-row__excerpt';
            text.textContent = excerpt;
            body.appendChild(text);
        }

        const chips = document.createElement('span');
        chips.className = 'plan-row__chips';

        // §4.4: the pill's SHAPE carries the status, so the row stays readable
        // with colour removed entirely.
        const descriptor = planStatusPill(plan.status);
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

function metaPart(text: string): HTMLElement {
    const el = document.createElement('span');
    el.textContent = text;
    return el;
}
