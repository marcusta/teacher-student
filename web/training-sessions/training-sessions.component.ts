import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { ShareChipComponent } from '../ui/share-chip.component';
import { TrainingSessionsService } from './training-sessions.service';
import { TeachersService } from './teachers.service';
import {
    dateBlock,
    durationLabel,
    exerciseSummary,
    ownerRecipients,
    planChipLabel,
    programBadges,
    programChipLabel,
    rowKey,
    sessionTitle,
    sortSessions,
    summaryExcerpt,
} from './training-session-copy';
import type { TrainingSession } from '../api';

const tpl = template(`
    <div class="sessions">
        <header class="sessions__head">
            <h1 bind="heading" class="sessions__title"></h1>
            <button bind="log" type="button" class="sessions__log"></button>
        </header>

        <p bind="loading" class="sessions__loading"></p>

        <div bind="errorBox" class="sessions__error" role="alert">
            <p bind="errorText" class="sessions__error-text"></p>
            <button bind="retry" type="button" class="sessions__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <ul bind="list" class="sessions__list"></ul>
    </div>
`);

/**
 * Träningspass — IA §3.9. The Student's own training journal, newest first.
 *
 * **Creation is not here.** The test client put an eight-field logging form at
 * the top of this view, so the first thing the journal said was "fill me in"
 * rather than "here is your riding". IA §1's shared interface grammar is
 * explicit — "List views put retrieval first. Creation opens in a dedicated
 * panel, dialog, or route; it must not dominate the list" — so logging moved to
 * `/traningspass/ny`, exactly as booking moved to `/lektioner/ny`. A route
 * rather than a dialog because the form is a seven-step sequence ending in a
 * sharing decision, which wants a page it can own and a Back button that means
 * something.
 *
 * **A Teacher does not reach shared sessions here.** §3.9 says so directly: this
 * is the owner list, and a Teacher walks in through Elevvy. So there is no role
 * branch on this view — every row is the reader's own.
 */
export class TrainingSessionsComponent extends Component {
    static styles = `
        .sessions {
            & .sessions__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .sessions__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .sessions__log { ${btn(token('radius-sm'), 'primary')} }
            & .sessions__log.hidden { display: none; }

            & .sessions__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .sessions__loading.hidden { display: none; }

            & .sessions__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .sessions__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                & .sessions__retry { ${btn()} }
            }
            & .sessions__error.hidden { display: none; }

            & .sessions__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .sessions__list:empty { border-top: none; }
            & .sessions__list > li { border-bottom: 1px solid ${token('border')}; }

            & .session-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: start;
                gap: ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-family: ${token('font-ui')};

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }

            & .session-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .session-row__day {
                font-size: 1.25rem;
                font-weight: 700;
                line-height: 1.2;
                color: ${token('text')};
            }
            & .session-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${token('text-muted')};
            }
            & .session-row__time {
                margin-top: 2px;
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            & .session-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .session-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .session-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            & .session-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('xs')};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }
            /* Row chips are labels, not links: a nested anchor inside the row's
               own anchor is invalid, and §4.3 wants the row to have exactly one
               target. The clickable parent chips live in the detail header. */
            & .session-row__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${s('sm')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-pill')};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${token('text-muted')};
                white-space: nowrap;
                max-width: 14rem;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* UI_DECISIONS §6: single column below 640px. The date block keeps
               its own row and turns horizontal so it stops being a tall stack
               beside nothing. */
            @media (max-width: 639px) {
                & .session-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${s('sm')};
                }
                & .session-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${s('xs')};
                    width: auto;
                }
                & .session-row__day { font-size: 1rem; }
                & .session-row__chips { justify-content: flex-start; max-width: none; }
                & .sessions__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private sessions = this.inject(TrainingSessionsService);
    private teachers = this.inject(TeachersService);

    /**
     * Whether the Teacher list has answered.
     *
     * A row cannot be painted from the session list alone: the sharing chip must
     * NAME its recipients (§4.5), and the session carries teacher ids only — the
     * names live on the Teacher list, behind a second, independent request.
     * Painting as soon as the sessions land therefore renders every shared row
     * as `Delad: okänd mottagare` for however long the other request takes. That
     * degraded label exists for a Relation that has genuinely gone missing, not
     * for the happy path, and §4.5 forbids reaching it here. So the list waits
     * for both answers rather than showing a sharing state it cannot yet state.
     *
     * A FAILED Teacher request also resolves this: at that point the chip has no
     * names and never will, and saying so is the honest outcome.
     */
    private teachersResolved = new Signal(false);

    private ordered = new Computed(() =>
        this.teachersResolved.get() ? sortSessions(this.sessions.items.get()) : []);
    private isEmpty = new Computed(() =>
        this.teachersResolved.get()
        && this.sessions.items.get().length === 0
        && !this.sessions.loading.get()
        && this.sessions.error.get() === null,
    );

    onMount(): void {
        void this.sessions.load();
        void this.teachers.load().finally(() => this.teachersResolved.set(true));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('trainingSessions.heading') },
            log: {
                textContent: () => t('trainingSessions.log'),
                onclick: () => this.router.navigate('/traningspass/ny'),
            },
            loading: {
                textContent: () => t('trainingSessions.loading'),
                // Covers the window where the sessions have landed but the
                // Teacher names have not, so holding the rows back reads as
                // "still loading" rather than as a blank list.
                className: () => (!this.teachersResolved.get() || this.sessions.loading.get())
                    && this.ordered.get().length === 0
                    && this.sessions.error.get() === null
                    ? 'sessions__loading' : 'sessions__loading hidden',
            },
            errorBox: {
                className: () => this.sessions.error.get() ? 'sessions__error' : 'sessions__error hidden',
            },
            errorText: { textContent: () => t('trainingSessions.error') },
            retry: {
                textContent: () => t('trainingSessions.retry'),
                onclick: () => void this.sessions.load(),
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'));
        this.$each(this.ref(frag, 'list'), this.ordered,
            (session, _i, track) => this.renderRow(session, track), rowKey);

        return frag;
    }

    /**
     * The empty state — IA §3.9 names the copy: **Logga ditt första pass**.
     *
     * One action, which `EmptyStateComponent`'s single optional `action` prop
     * makes structural rather than a matter of discipline (§4.14). There is only
     * one variant here, unlike Lektioner: a training session needs no Teacher,
     * no horse and no plan, so an account with nothing at all can still log one.
     * Offering "Bjud in lärare" instead would be advice the view does not need
     * to give.
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
                    heading: () => t('trainingSessions.empty.heading'),
                    body: () => t('trainingSessions.empty.body'),
                    action: {
                        label: () => t('trainingSessions.empty.action'),
                        onclick: () => this.router.navigate('/traningspass/ny'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(session: TrainingSession, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/traningspass/${session.id}`;
        const row = document.createElement('a');
        row.className = 'session-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const block = dateBlock(session.performedAt);
        const date = document.createElement('span');
        date.className = 'session-row__date';
        for (const [cls, text] of [['day', block.day], ['month', block.month], ['time', block.time]] as const) {
            const part = document.createElement('span');
            part.className = `session-row__${cls}`;
            part.textContent = text;
            date.appendChild(part);
        }

        const body = document.createElement('span');
        body.className = 'session-row__body';

        const title = document.createElement('span');
        title.className = 'session-row__title';
        title.textContent = sessionTitle(session);
        body.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'session-row__meta';
        const duration = durationLabel(session.durationMin);
        if (duration) meta.appendChild(metaPart(duration));
        if (session.horseName) meta.appendChild(metaPart(session.horseName));
        meta.appendChild(metaPart(exerciseSummary(session.exercises)));
        // The excerpt only earns a second line when the headline is NOT already
        // the summary — otherwise the row prints the same sentence twice.
        const excerpt = summaryExcerpt(session.summary);
        if (excerpt && excerpt !== title.textContent) meta.appendChild(metaPart(excerpt));
        body.appendChild(meta);

        const chips = document.createElement('span');
        chips.className = 'session-row__chips';

        // §4.5: sharing is named on every row. Never a bare "Delad", never a
        // count — `ownerRecipients` resolves each id against the Teacher list and
        // `ShareChipComponent` refuses to render an unlabelled shared state.
        const shareHost = document.createElement('span');
        chips.appendChild(shareHost);
        const shareChip = new ShareChipComponent({
            recipients: () => ownerRecipients(session.sharedWithTeacherIds, this.teachers.items.get()),
            shared: () => session.sharedWithTeacherIds.length > 0,
        });
        shareChip.mount(shareHost);
        track(() => shareChip.destroy());

        if (session.planTitle) chips.appendChild(chip(planChipLabel(session.planTitle)));
        for (const program of programBadges(session)) chips.appendChild(chip(programChipLabel(program)));

        row.append(date, body, chips);
        li.appendChild(row);
        return li;
    }
}

function metaPart(text: string): HTMLElement {
    const el = document.createElement('span');
    el.textContent = text;
    return el;
}

function chip(label: string): HTMLElement {
    const el = document.createElement('span');
    el.className = 'session-row__chip';
    el.textContent = label;
    el.title = label;
    return el;
}
