import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { t, formatIsoDate } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { Async } from '../students/async';
import {
    INBOX_HREF,
    LESSONS_HREF,
    awaitingCountLabel,
    awaitingHref,
    awaitingLabel,
    awaitingWhen,
    blockTitleKey,
    feedbackByline,
    feedbackContext,
    feedbackExcerpt,
    feedbackHref,
    goalHref,
    goalOverdueLabel,
    goalTargetLabel,
    homeBlockKey,
    homeState,
    invitationsMessage,
    moreExercisesLabel,
    nextLessonHref,
    nextLessonMeta,
    nextLessonWhen,
    planCountLabel,
    planHref,
    quickActions,
    startPaths,
    updatedLabel,
    visibleBlocks,
    type HomeBlock,
} from './home-copy';
import { dateRangeLabel, primaryTeacherLabel } from '../plans/plan-copy';
import { api } from '../api';
import type {
    DashboardAwaitingItem,
    DashboardFeedback,
    DashboardGoalRef,
    DashboardNextLesson,
    DashboardPlanRef,
    DashboardView,
} from '../api';

const tpl = template(`
    <div class="home">
        <header class="home__head">
            <h1 bind="heading" class="home__title"></h1>
            <div bind="actions" class="home__actions"></div>
        </header>

        <p bind="lede" class="home__lede"></p>

        <p bind="loading" class="home__loading"></p>

        <div bind="errorBox" class="home__error" role="alert">
            <p bind="errorText" class="home__error-text"></p>
            <button bind="retry" type="button" class="home__retry"></button>
        </div>

        <div bind="invitedHost" class="home__state"></div>
        <div bind="freshHost" class="home__state"></div>

        <div bind="inviteBanner" class="home__invite">
            <p bind="inviteText" class="home__invite-text"></p>
            <a bind="inviteLink" class="home__action home__action--ghost"></a>
        </div>

        <div bind="cards" class="home__cards"></div>

        <p bind="updated" class="home__updated"></p>
    </div>
`);

/**
 * **Hem** — IA §3.1. The launchpad that answers "what needs me today?" and
 * deep-links back into the training loop.
 *
 * **Everything this page decides, it decides in `home-copy.ts`** — which block
 * renders, in what order, which of the four page states applies, every href and
 * every phrase. That module is DOM-free and `tests/home-copy.test.ts` asserts it
 * directly; this file only mounts what it is told to. The split is the
 * `nav.structure.ts` / `student-copy.ts` precedent, and its reason is mechanical:
 * `../theme`'s `createTokens()` writes a `<style>` at import time, so anything
 * that imports it cannot load in a DOM-less test process.
 *
 * **A launchpad, and nothing more** (IA §3.1: "No data is edited inline on the
 * dashboard"; contract §2.4). There is no form, no toggle, no status transition
 * and no note composer anywhere below. Every id on this page is used for exactly
 * one thing — navigation — and every route is built by a `home-copy` href
 * helper, never spelled out here, so `route-guard.APP_ROUTES` stays this app's
 * single route enumeration.
 *
 * **Four states, and the fourth is the important one.** `homeState` checks
 * failure *before* resolution, so a failed request renders as "we do not know"
 * and never as "you have nothing". Substituting an empty state for an unanswered
 * one is the single substitution on this page that misinforms rather than merely
 * underinforms — so `invited` and `fresh` are unreachable while the fetch is in
 * flight or broken, and the scoped error box with its retry is what shows
 * instead.
 *
 * **`capabilities` gates exactly one thing here**: whether the Boka lektion
 * quick action renders (contract §2.1). It does not gate nav — `nav.structure.ts`
 * is untouched by this slice, per `UI_DECISIONS.md` §1 — it does not gate the
 * Riding block, because Plans and Goals are ownership-scoped and a zero-Relation
 * account owns both, and it does not gate either of the `fresh` state's two
 * starting paths.
 *
 * **No read-state** (contract §2.2). The feedback card says *senaste*, never
 * *ny*, and carries no badge, dot or unread affordance. The only count on the
 * page that looks like one is `pendingInvitations`, which is a real domain state.
 *
 * **The payload is owned by this component, not by a service, and that is a
 * security property rather than a style preference.** `di.get()` caches by
 * constructor on ONE process-global container, `logout()` does not reload the
 * page and app code never calls `di.reset()` — so a service-held
 * `Async<DashboardView>` outlives the account it was fetched for. The shell
 * swaps the view component on identity change (`app.component.ts`), which
 * destroys and rebuilds THIS component but would hand it back the same service
 * instance, still `started`, still holding the previous account's `data`. A
 * `runOnce` at that scope then no-ops and user B is served user A's
 * counterparty, horse, plan titles, feedback body and student names, with no
 * request ever made on their behalf. An `Async` owned by the component cannot
 * do that: destroying the component destroys the state.
 *
 * This is the `student-detail.component.ts` shape, and `async.ts`'s own
 * docstring already says why — "each holder is a plain object a component can
 * own as many of as it has sections. Deliberately not a service." Hem was the
 * only place in `web/` that broke it.
 *
 * The price, recorded so it is not rediscovered as a bug: a Back-navigation to
 * `/` refetches, because a rebuilt component gets a fresh `Async`. That is the
 * same bargain every other view in the app already makes (`GoalsService.load`
 * always calls the API; `student-detail` rebuilds all seven of its holders per
 * mount), it costs one request against a view-shaped endpoint, and for a page
 * whose whole subject is "what needs me today?" — and which prints how old its
 * own payload is — a stale answer is the worse outcome. Under the previous
 * arrangement nothing a reader created ever appeared on Hem again without a
 * hard reload.
 *
 * **Failure is page-scoped, because 047 is one endpoint.** IA §3.1 asks the
 * dashboard to "preserve available blocks and show a scoped retry, not a
 * page-level failure", and IA §4 requires partial failure for multi-source
 * overview pages. One endpoint cannot deliver that: if the dashboard query
 * throws, every block is gone together. That is a recorded trade (contract
 * §4.4), not an oversight — the alternatives were a service that swallows
 * exceptions into a per-block error vocabulary the rest of the API does not
 * have, or one endpoint per block, which reintroduces the client fan-out the
 * read model exists to remove. What is bought instead is *structure*: the
 * rendering below is block by block, each block owning its own empty copy, so
 * splitting this later is a change to how the payload is fetched rather than a
 * rewrite of the view.
 */
export class HomeComponent extends Component {
    static styles = `
        .home {
            font-family: ${token('font-ui')};

            & .home__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('md')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. Any other weight
               synthesises bold, and the serif is permitted on h1/h2 only. */
            & .home__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            & .home__actions {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }

            /* Button labels are Open Sans 600, never the serif, in every tier
               (UI_DECISIONS §9). These are anchors because they navigate. */
            & .home__action {
                ${btn(token('radius-sm'))}
                text-decoration: none;
                display: inline-flex;
                align-items: center;
            }
            & .home__action--primary { ${btn(token('radius-sm'), 'primary')} text-decoration: none; }
            & .home__action--ghost {
                ${btn(token('radius-sm'), 'ghost')}
                text-decoration: none;
                align-self: flex-start;
                padding-left: 0;
                padding-right: 0;
            }
            /* NO :focus-visible override here. btn() already sets
               'outline: none' plus its own focus ring, and a re-declaration at
               equal specificity and later source order beats that 'outline:
               none' — which gave home's actions a ring AND an outline, unlike
               every other btn() in the app. */

            & .home__lede {
                margin: 0 0 ${s('xl')};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .home__lede.hidden { display: none; }

            & .home__loading {
                margin: 0 0 ${s('lg')};
                font-size: 0.875rem;
                color: ${token('text-muted')};
            }
            & .home__loading.hidden { display: none; }

            & .home__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .home__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                & .home__retry { ${btn()} }
            }
            & .home__error.hidden { display: none; }

            & .home__state.hidden { display: none; }

            /* ── The pending-invitation lede (IA §3.17) ────────── */

            /* A banner above the grid, NOT a fifth card: §4.2 caps the grid at
               four and an invitation is a one-line fact with one destination,
               not a block of the dashboard. Deliberately quiet — the plain surface
               and a border, no danger/warning tone — because a waiting
               invitation is an opportunity, not a problem. */
            & .home__invite {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('sm')} ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                background: ${token('surface')};

                & .home__invite-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${token('text')};
                }
            }
            & .home__invite.hidden { display: none; }

            /* ── The fresh state's two equal paths ─────────────── */

            & .home__start-title {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .home__start {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${s('md')};
            }

            & .home__panel {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: ${s('sm')};
                padding: ${s('lg')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                background: ${token('surface')};
            }
            /* Panel titles are h3 and therefore Open Sans — the serif stops at
               h2 (UI_DECISIONS §3). */
            & .home__panel-title {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
                color: ${token('text')};
            }
            & .home__panel-body {
                margin: 0;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text-muted')};
            }

            /* ── The ready state's card grid — design system §4.2 ─ */

            & .home__cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${s('md')};
                align-items: start;
            }
            & .home__cards:empty { display: none; }

            & .home__card {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                padding: ${s('lg')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                background: ${token('surface')};
                /* card() carries this and every other card surface in the app
                   has it; without it home's grid renders flat beside them. */
                box-shadow: ${token('shadow-1')};
                text-decoration: none;
                color: inherit;
            }
            & a.home__card:hover { border-color: ${token('border-strong')}; }
            & a.home__card:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }

            & .home__card-label {
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }
            & .home__card-value {
                font-size: 1rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .home__card-meta {
                font-size: 0.8125rem;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }
            & .home__card-sublabel {
                margin-top: ${s('sm')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .home__rows {
                list-style: none;
                margin: ${s('xs')} 0 0;
                padding: 0;
                border-top: 1px solid ${token('border')};
            }
            & .home__rows > li { border-bottom: 1px solid ${token('border')}; }

            & .home__row {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: ${s('sm')} 0;
                text-decoration: none;
                color: inherit;
                &:hover .home__row-title { color: ${token('accent-strong')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }
            & .home__row-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .home__row-meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            /* Overdue is supporting metadata, not a status (IA §3.13), so it is
               a WORD beside the date — never a pill, and never colour alone
               (UI_DECISIONS §7): "Datum passerat" says it in text.
               This is goals.component.ts's .goal-row__overdue verbatim, and
               it must stay that way — the identical fact rendered two ways on
               two pages is the regression to avoid.
               NO BORDER. §7's shape grammar is outline = ongoing, filled =
               completed, DASHED = CANCELLED, so a dashed edge here would render
               an active goal in the vocabulary of an abandoned one. And
               'warning' rather than 'danger' for the same reason
               goals.component.ts chose it: a passed target date is a nudge,
               not a failure. */
            & .home__overdue { color: ${token('warning')}; font-weight: 600; }

            & .home__updated {
                margin: ${s('xl')} 0 0;
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }
            & .home__updated.hidden { display: none; }
        }
    `;

    private router = this.inject(Router);

    /**
     * The dashboard payload, owned outright — see the class docstring for why
     * this may never move back behind `di.get()`.
     *
     * `runOnce` rather than `run` so that the two effects below cannot race a
     * second request onto a page that already asked; the once-ness is scoped to
     * one mount, which is the scope at which it is safe.
     */
    private view = new Async<DashboardView>();

    /**
     * Frozen at mount, both of them — contract §4.3 and the same rule
     * `lessons.component.ts` and `goals.component.ts` follow. A clock read inside
     * a derivation would flip a goal's overdue marker or re-word a relative
     * timestamp mid-render, on a signal nothing subscribed to.
     *
     * Two values because two questions: `nowIso` is an instant, for
     * `formatRelative`; `todayIso` is the reader's local calendar DAY, which is
     * the only thing `goal-copy.isOverdue` will accept, and deliberately so —
     * the server's 30-day horizon is soft and computed in the server's zone,
     * while overdue is not soft.
     *
     * Neither is `view.generatedAt`. That is the server's assembly clock and is
     * used for exactly one sentence: how old this payload is.
     */
    private mountedAt = new Date();
    private nowIso = new Signal(this.mountedAt.toISOString());
    private todayIso = new Signal(formatIsoDate(this.mountedAt));

    private state = new Computed(() => homeState(this.view.data.get(), {
        resolved: this.view.resolved.get(),
        failed: this.view.error.get() !== null,
    }));

    /**
     * The ordered, capped block list — read straight out of `visibleBlocks` and
     * never re-derived from `view.*` in source order. `auto-fit` collapses to one
     * column on a phone *in array order*, so the priority order IA §3.1 specifies
     * only survives if it comes from here.
     */
    private blocks = new Computed<HomeBlock[]>(() => {
        const view = this.view.data.get();
        return view && this.state.get() === 'ready' ? visibleBlocks(view) : [];
    });

    onMount(): void {
        void this.load();
    }

    /** First load of this mount. */
    private load(): Promise<void> {
        return this.view.runOnce(() => api.dashboard.get());
    }

    /**
     * The page-level retry IA §4 requires on every view: `reset()` and re-run.
     * `reset` alone would leave the previous error on screen until the next
     * navigation, so the run is part of the same call.
     */
    private reload(): Promise<void> {
        this.view.reset();
        return this.view.run(() => api.dashboard.get());
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('home.title') },
            lede: {
                // The lede answers a different question in each state: in `ready`
                // it frames the cards, in `invited` it states the fact the page
                // exists to report. There is no greeting by name anywhere — the
                // session carries `{ id, username }` and `username` is the email
                // address, and greeting someone by their email is worse than not
                // greeting them (IA §3.1 item 1).
                textContent: () => {
                    const state = this.state.get();
                    if (state === 'ready') return t('home.lede');
                    if (state === 'invited') {
                        return invitationsMessage(this.view.data.get()?.pendingInvitations ?? 0);
                    }
                    return '';
                },
                className: () => {
                    const state = this.state.get();
                    return state === 'ready' || state === 'invited' ? 'home__lede' : 'home__lede hidden';
                },
            },
            loading: {
                textContent: () => t('home.loading'),
                // Gated on EMPTINESS, never on `resolved` — the precedent is
                // `lessons.component.ts`, and the reason is that `Async.reset()`
                // clears `started` and nothing else, so `resolved` latches true
                // at the first settle and never returns to false. Gating on it
                // meant that after one failure the loading line could never
                // render again: pressing Försök igen collapsed the page to a
                // bare <h1>Hem</h1> until the retry settled.
                className: () => this.view.loading.get() && this.view.data.get() === null
                    ? 'home__loading' : 'home__loading hidden',
            },
            errorBox: {
                className: () => this.view.error.get() ? 'home__error' : 'home__error hidden',
            },
            errorText: { textContent: () => t('home.error') },
            retry: {
                textContent: () => t('home.retry'),
                onclick: () => void this.reload(),
            },
            // IA §3.17 asks for the Inkorg badge AND a dashboard invitation card
            // when invitations are pending. The `invited` state covers only an
            // account with nothing else, so without this an established rider
            // invited by a second teacher saw nothing here at all. A banner
            // rather than a card: §4.2 caps the grid at four, and this is a
            // launchpad line — it deep-links to Inkorgen and accepts nothing
            // inline (IA §3.1: no data is edited on the dashboard).
            inviteBanner: {
                className: () => this.showInvite() ? 'home__invite' : 'home__invite hidden',
            },
            inviteText: {
                textContent: () => invitationsMessage(this.view.data.get()?.pendingInvitations ?? 0),
            },
            inviteLink: { textContent: () => t('home.invitations.cta') },
            updated: {
                textContent: () => {
                    const view = this.view.data.get();
                    // `view.generatedAt` — the SERVER's assembly clock, and the
                    // one sentence on this page that uses it. Passing the page's
                    // own `nowIso` for both arguments would make this read
                    // "Uppdaterad nu" forever, which is contract §4.3's whole
                    // reason for keeping the two clocks apart.
                    return view ? updatedLabel(view.generatedAt, this.nowIso.get()) : '';
                },
                className: () => this.state.get() === 'ready' ? 'home__updated' : 'home__updated hidden',
            },
        });

        this.wireHref(this.ref(frag, 'inviteLink') as HTMLAnchorElement, INBOX_HREF);

        this.buildActions(this.ref(frag, 'actions'));
        this.buildInvited(this.ref(frag, 'invitedHost'));
        this.buildFresh(this.ref(frag, 'freshHost'));

        // `homeBlockKey` covers every field its card paints — including each
        // row's own key — so a changed row changes the card's key and the card
        // is rebuilt whole. That is the same convention as `studentRowKey`: an
        // id-only key leaves a stale card on screen after the only thing that
        // changed is what the card says.
        this.$each(this.ref(frag, 'cards'), this.blocks,
            (block, _i, track) => this.renderBlock(block, track), homeBlockKey);

        return frag;
    }

    /**
     * Whether the pending-invitation banner is on screen.
     *
     * `ready` only. In `invited` the lede already carries the same sentence and
     * the empty state already carries the same action, so showing it there
     * would be the second exit §4.14 forbids; in `unknown` and `fresh` there is
     * either no answer or no invitation.
     */
    private showInvite(): boolean {
        return this.state.get() === 'ready'
            && (this.view.data.get()?.pendingInvitations ?? 0) > 0;
    }

    // ─── Quick actions (IA §3.1 item 6) ─────────────────────────

    /**
     * Rendered only in `ready`. The two empty states each own a single §4.14
     * action of their own, and a header action beside one would be a second exit
     * from a state whose whole job is to have one.
     *
     * One primary per view (UI_DECISIONS §9): the first action `quickActions`
     * returns takes it. That is `Logga pass`, which is unconditional because
     * `TrainingSessionService.create` requires no Relation — so the page's
     * primary action is one every account can actually complete.
     */
    private buildActions(host: HTMLElement): void {
        this.track(effect(() => {
            const view = this.view.data.get();
            if (!view || this.state.get() !== 'ready') {
                host.replaceChildren();
                return;
            }
            host.replaceChildren(...quickActions(view.capabilities).map((action, i) =>
                this.actionLink(action.href, t(action.labelKey),
                    i === 0 ? 'home__action home__action--primary' : 'home__action'),
            ));
        }));
    }

    // ─── `invited` (IA §3.20's post-registration landing) ───────

    private buildInvited(host: HTMLElement): void {
        const empty = new EmptyStateComponent({
            heading: () => t('home.welcome.title'),
            body: () => t('home.welcome.body'),
            // Exactly one action, and the prop's shape is what enforces it.
            action: {
                label: () => t('home.invitations.cta'),
                onclick: () => this.router.navigate(INBOX_HREF),
            },
            headingLevel: 2,
        });
        empty.mount(host);
        this.track(() => empty.destroy());
        this.track(effect(() => {
            host.className = this.state.get() === 'invited' ? 'home__state' : 'home__state hidden';
        }));
    }

    // ─── `fresh` (two equally weighted starting paths) ──────────

    /**
     * Neither path is capability-gated and neither outranks the other, so both
     * actions are the **secondary** tier — a primary on one panel would make the
     * two paths unequal, which is the one thing IA §3.1 asks of this state. The
     * third link, Skapa mål, is ghost-tier for the same reason: it must not
     * compete with the panel it sits under.
     *
     * Hand-rolled rather than two `EmptyStateComponent`s: the framework shell is
     * a single centred column with one action, which is right for "this list is
     * empty" and wrong for "here are two ways in".
     */
    private buildFresh(host: HTMLElement): void {
        const heading = document.createElement('h2');
        heading.className = 'home__start-title';

        const grid = document.createElement('div');
        grid.className = 'home__start';

        const paint: (() => void)[] = [];
        for (const path of startPaths()) {
            const panel = document.createElement('section');
            panel.className = 'home__panel';

            const title = document.createElement('h3');
            title.className = 'home__panel-title';
            const body = document.createElement('p');
            body.className = 'home__panel-body';
            const action = this.actionLink(path.href, '', 'home__action');
            panel.append(title, body, action);

            const secondary = path.secondary
                ? this.actionLink(path.secondary.href, '', 'home__action home__action--ghost')
                : null;
            if (secondary) panel.appendChild(secondary);

            const spec = path;
            paint.push(() => {
                title.textContent = t(spec.titleKey);
                body.textContent = t(spec.bodyKey);
                action.textContent = t(spec.actionKey);
                if (secondary && spec.secondary) secondary.textContent = t(spec.secondary.actionKey);
            });

            grid.appendChild(panel);
        }

        host.append(heading, grid);
        this.track(effect(() => {
            heading.textContent = t('home.start.title');
            for (const fn of paint) fn();
        }));
        this.track(effect(() => {
            host.className = this.state.get() === 'fresh' ? 'home__state' : 'home__state hidden';
        }));
    }

    // ─── `ready` — one card per block ───────────────────────────

    private renderBlock(block: HomeBlock, track: (d: () => void) => void): HTMLElement {
        switch (block.kind) {
            case 'nextLesson':
                return this.renderNextLesson(block.lesson, track);
            case 'latestFeedback':
                return this.renderFeedback(block.feedback, track);
            case 'awaitingFeedback':
                return this.renderAwaiting(block.items, track);
            case 'riding':
                return this.renderRiding(block.plans, block.goals, track);
        }
    }

    /**
     * IA §3.1 item 2 — date/time, counterparty, Horse, compact Exercise preview.
     *
     * Empty is an answer here, not an absence: someone asked what their next
     * lesson is, and "ingen bokad lektion" is the reply. The card keeps its §4.14
     * single exit either way.
     */
    private renderNextLesson(
        lesson: DashboardNextLesson | null,
        track: (d: () => void) => void,
    ): HTMLElement {
        if (!lesson) {
            return this.emptyCard(track, 'nextLesson', 'home.nextLesson.none',
                'home.nextLesson.empty.action', LESSONS_HREF);
        }

        const card = this.cardEl(nextLessonHref(lesson.id));
        const label = span('home__card-label');
        const value = span('home__card-value');
        const meta = span('home__card-meta');
        const exercises = span('home__card-meta');
        card.append(label, value, meta, exercises);

        track(effect(() => {
            label.textContent = t(blockTitleKey('nextLesson'));
            value.textContent = nextLessonWhen(lesson);
            meta.textContent = nextLessonMeta(lesson);
            // Recognition, not inventory: the preview names what is planned and
            // the count says how much more there is.
            const more = moreExercisesLabel(lesson);
            exercises.textContent = lesson.exerciseCount === 0
                ? t('home.nextLesson.noExercises')
                : [lesson.exercisePreview.join(' · '), more].filter(Boolean).join(' · ');
        }));
        return card;
    }

    /**
     * IA §3.1 item 3 — the latest **shared** note someone else wrote.
     *
     * No badge, no dot, no "ny": `latestFeedback` is the latest, not the unread,
     * and there is no read-state in the schema to make it otherwise (contract
     * §2.2). The card links by `targetKind`, which is why the payload carries a
     * target separate from the parent — the two junction kinds have no route.
     */
    private renderFeedback(
        feedback: DashboardFeedback | null,
        track: (d: () => void) => void,
    ): HTMLElement {
        if (!feedback) {
            return this.emptyCard(track, 'latestFeedback', 'home.feedback.none',
                'home.feedback.empty.action', LESSONS_HREF);
        }

        const card = this.cardEl(feedbackHref(feedback));
        const label = span('home__card-label');
        const value = span('home__card-value');
        const context = span('home__card-meta');
        const byline = span('home__card-meta');
        card.append(label, value, context, byline);

        track(effect(() => {
            label.textContent = t(blockTitleKey('latestFeedback'));
            value.textContent = feedbackExcerpt(feedback.body) ?? feedback.targetLabel;
            context.textContent = feedbackContext(feedback);
            byline.textContent = feedbackByline(feedback, this.nowIso.get());
        }));
        return card;
    }

    /**
     * IA §3.1 item 4 — what I owe someone, ahead of my own training on purpose.
     *
     * A prompt, never a work queue: the server returns a bounded list with no
     * total (contract §3.4), so the count is of what is shown and the card says
     * so by linking to the full list rather than claiming a backlog.
     *
     * The card is a `div`, not an `a` — it holds row anchors, and a nested anchor
     * is invalid. Only cards with a single destination are links themselves.
     */
    private renderAwaiting(
        items: DashboardAwaitingItem[],
        track: (d: () => void) => void,
    ): HTMLElement {
        const card = this.cardEl(null);
        const label = span('home__card-label');
        const value = span('home__card-value');
        card.append(label, value);

        const list = document.createElement('ul');
        list.className = 'home__rows';
        for (const item of items) {
            list.appendChild(this.row(awaitingHref(item), track,
                () => awaitingLabel(item), () => [awaitingWhen(item), item.horseName]));
        }
        if (items.length > 0) card.appendChild(list);

        const all = this.actionLink(LESSONS_HREF, '', 'home__action home__action--ghost');
        card.appendChild(all);

        track(effect(() => {
            label.textContent = t(blockTitleKey('awaitingFeedback'));
            // "Du har svarat på allt" states completion, not absence — the block
            // only renders at all when the reader teaches, so there is something
            // for it to be the empty state OF.
            value.textContent = items.length > 0
                ? awaitingCountLabel(items)
                : t('home.awaiting.none');
            all.textContent = t('home.awaiting.all');
        }));
        return card;
    }

    /**
     * IA §3.1 item 5 — my own Plans and Goals, sharing one card.
     *
     * **Never gated on `capabilities.rides`** (contract §2.1). Both lists are
     * ownership-scoped, so an account with zero Relations can own both, and
     * gating here would hide a person's own Goals from them. `visibleBlocks`
     * renders this block on content alone.
     */
    private renderRiding(
        plans: DashboardPlanRef[],
        goals: DashboardGoalRef[],
        track: (d: () => void) => void,
    ): HTMLElement {
        const card = this.cardEl(null);
        const label = span('home__card-label');
        const value = span('home__card-value');
        card.append(label, value);

        if (plans.length > 0) {
            const list = document.createElement('ul');
            list.className = 'home__rows';
            for (const plan of plans) {
                list.appendChild(this.row(planHref(plan.id), track,
                    () => plan.title,
                    () => [dateRangeLabel(plan.startDate, plan.endDate),
                        primaryTeacherLabel(plan.primaryTeacherDisplayName)]));
            }
            card.appendChild(list);
        }

        const goalsLabel = span('home__card-sublabel');
        const goalsEmpty = span('home__card-meta');
        card.append(goalsLabel);
        if (goals.length > 0) {
            const list = document.createElement('ul');
            list.className = 'home__rows';
            for (const goal of goals) {
                list.appendChild(this.row(goalHref(goal.id), track,
                    () => goal.title,
                    () => [goalTargetLabel(goal)],
                    // Overdue is derived on the CLIENT, from the reader's own
                    // calendar day — the server sends no flag and could not
                    // honestly send one from its own zone.
                    () => goalOverdueLabel(goal, this.todayIso.get())));
            }
            card.appendChild(list);
        } else {
            card.appendChild(goalsEmpty);
        }

        track(effect(() => {
            label.textContent = t(blockTitleKey('riding'));
            value.textContent = plans.length > 0 ? planCountLabel(plans) : t('home.plans.none');
            goalsLabel.textContent = t('home.goals.nearing');
            goalsEmpty.textContent = t('home.goals.none');
        }));
        return card;
    }

    // ─── Card primitives ────────────────────────────────────────

    /**
     * A card whose block has nothing to show. One line of copy and exactly one
     * ghost-tier exit — §4.14 wants an empty state you can leave, and
     * `COMPONENTS.md` records that every hand-rolled empty state in `web/`
     * predating this convention had none.
     */
    private emptyCard(
        track: (d: () => void) => void,
        kind: Parameters<typeof blockTitleKey>[0],
        valueKey: string,
        actionKey: string,
        href: string,
    ): HTMLElement {
        const card = this.cardEl(null);
        const label = span('home__card-label');
        const value = span('home__card-value');
        const action = this.actionLink(href, '', 'home__action home__action--ghost');
        card.append(label, value, action);
        track(effect(() => {
            label.textContent = t(blockTitleKey(kind));
            value.textContent = t(valueKey);
            action.textContent = t(actionKey);
        }));
        return card;
    }

    /** An `<a>` when the card navigates, a `<div>` when it does not. */
    private cardEl(href: string | null): HTMLElement {
        const el = document.createElement(href ? 'a' : 'div');
        el.className = 'home__card';
        if (href) this.wireHref(el as HTMLAnchorElement, href);
        return el;
    }

    private row(
        href: string,
        track: (d: () => void) => void,
        title: () => string,
        meta: () => (string | null)[],
        marker?: () => string | null,
    ): HTMLElement {
        const li = document.createElement('li');
        const row = document.createElement('a');
        row.className = 'home__row';
        this.wireHref(row, href);

        const titleEl = span('home__row-title');
        const metaEl = span('home__row-meta');
        row.append(titleEl, metaEl);
        li.appendChild(row);

        track(effect(() => {
            titleEl.textContent = title();
            metaEl.replaceChildren();
            for (const part of meta()) {
                if (part) metaEl.appendChild(textSpan(part));
            }
            const flag = marker?.();
            if (flag) {
                const el = span('home__overdue');
                el.textContent = flag;
                metaEl.appendChild(el);
            }
        }));
        return li;
    }

    private actionLink(href: string, text: string, className: string): HTMLAnchorElement {
        const el = document.createElement('a');
        el.className = className;
        el.textContent = text;
        this.wireHref(el, href);
        return el;
    }

    /**
     * A real `href` so the link is copyable, middle-clickable and readable by
     * assistive tech, plus a click handler so a plain click stays in the SPA.
     * The href itself always comes from a `home-copy` helper — never assembled
     * here — so `route-guard.APP_ROUTES` remains the app's one route list.
     */
    private wireHref(el: HTMLAnchorElement, href: string): void {
        el.href = href;
        el.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });
    }
}

function span(className: string): HTMLElement {
    const el = document.createElement('span');
    el.className = className;
    return el;
}

function textSpan(text: string): HTMLElement {
    const el = document.createElement('span');
    el.textContent = text;
    return el;
}
