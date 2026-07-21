import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { LessonsService } from './lessons.service';
import { StudentsService } from '../students/students.service';
import { PersonMarkerComponent } from '../ui/person-marker.component';
import {
    counterpartyRole,
    dateBlock,
    exerciseSummary,
    groupLessons,
    lessonTitle,
    planChipLabel,
    programBadges,
    programChipLabel,
    rowKey,
    statusPill,
} from './lesson-copy';
import type { LessonForUser } from '../api';

const tpl = template(`
    <div class="lessons">
        <header class="lessons__head">
            <h1 bind="heading" class="lessons__title"></h1>
            <button bind="book" type="button" class="lessons__book"></button>
        </header>

        <p bind="loading" class="lessons__loading"></p>

        <div bind="errorBox" class="lessons__error" role="alert">
            <p bind="errorText" class="lessons__error-text"></p>
            <button bind="retry" type="button" class="lessons__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="upcomingSection" class="lessons__group">
            <h2 bind="upcomingLabel" class="lessons__group-label"></h2>
            <ul bind="upcomingList" class="lessons__list"></ul>
        </section>
        <section bind="pastSection" class="lessons__group">
            <h2 bind="pastLabel" class="lessons__group-label"></h2>
            <ul bind="pastList" class="lessons__list"></ul>
        </section>
    </div>
`);

/**
 * Lektioner — IA §3.7. One shared timeline of every Lesson the user teaches or
 * attends, grouped Kommande / Tidigare.
 *
 * **Creation is not here.** The test client put a five-field booking form at the
 * top of this view, so the first thing the list said was "fill me in" rather
 * than "here is your teaching". IA §1's shared interface grammar is explicit —
 * "List views put retrieval first. Creation opens in a dedicated panel, dialog,
 * or route; it must not dominate the list" — so booking moved to `/lektioner/ny`
 * and is reached from the single primary action in this header. A route rather
 * than a dialog because the form is a five-step sequence whose later steps
 * depend on the Student chosen in the first: that wants a page it can own, a URL
 * it can be linked to, and a Back button that means something.
 */
export class LessonsComponent extends Component {
    static styles = `
        .lessons {
            & .lessons__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .lessons__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .lessons__book { ${btn(token('radius-sm'), 'primary')} }
            & .lessons__book.hidden { display: none; }

            & .lessons__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .lessons__loading.hidden { display: none; }

            & .lessons__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .lessons__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                & .lessons__retry { ${btn()} }
            }
            & .lessons__error.hidden { display: none; }

            & .lessons__group { margin-bottom: ${s('xl')}; }
            & .lessons__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .lessons__group-label {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-ui')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .lessons__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .lessons__list > li { border-bottom: 1px solid ${token('border')}; }

            & .lesson-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: start;
                gap: ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-family: ${token('font-ui')};

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }

            /* Cancelled is muted but READABLE (IA §3.7) — text-muted rather than
               an opacity wash, so the row keeps its contrast against the page
               instead of fading toward it. The dashed status pill and its ✕ are
               what carry the meaning; the dimming only ranks the row. */
            & .lesson-row--cancelled {
                & .lesson-row__title, & .lesson-row__day, & .lesson-row__time { color: ${token('text-muted')}; }
            }

            & .lesson-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .lesson-row__day {
                font-size: 1.25rem;
                font-weight: 700;
                line-height: 1.2;
                color: ${token('text')};
            }
            & .lesson-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${token('text-muted')};
            }
            & .lesson-row__time {
                margin-top: 2px;
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            & .lesson-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .lesson-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .lesson-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            & .lesson-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('xs')};
                justify-content: flex-end;
                max-width: 16rem;
            }
            /* Row chips are labels, not links: a nested anchor inside the row's
               own anchor is invalid, and §4.3 wants the row to have exactly one
               target. The clickable parent chips live in the detail header. */
            & .lesson-row__chip {
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

            & .lesson-row__status { padding-top: 2px; }

            /* UI_DECISIONS §6: single column below 640px. The date block keeps
               its own row and turns horizontal so it stops being a tall stack
               beside nothing. */
            @media (max-width: 639px) {
                & .lesson-row {
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: ${s('sm')};
                }
                & .lesson-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${s('xs')};
                    width: auto;
                }
                & .lesson-row__day { font-size: 1rem; }
                & .lesson-row__body { grid-column: 1 / -1; }
                & .lesson-row__chips { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
            }
        }
    `;

    private router = this.inject(Router);
    private lessons = this.inject(LessonsService);
    private students = this.inject(StudentsService);

    /**
     * Frozen at mount. Re-reading the clock inside the grouping computation
     * would move a lesson from Kommande to Tidigare mid-render, on a signal
     * nothing subscribed to.
     */
    private nowIso = new Signal(new Date().toISOString());

    private grouped = new Computed(() => groupLessons(this.lessons.items.get(), this.nowIso.get()));
    private upcoming = new Computed(() => this.grouped.get().upcoming);
    private past = new Computed(() => this.grouped.get().past);
    /** Creation needs at least one Student Relation (IA §3.7). */
    private canBook = new Computed(() => this.students.items.get().length > 0);
    private isEmpty = new Computed(() =>
        this.lessons.items.get().length === 0
        && !this.lessons.loading.get()
        && this.lessons.error.get() === null,
    );

    onMount(): void {
        void this.lessons.load();
        void this.students.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('lessons.heading') },
            upcomingLabel: { textContent: () => t('lessons.group.upcoming') },
            pastLabel: { textContent: () => t('lessons.group.past') },
            book: {
                textContent: () => t('lessons.book'),
                className: () => this.canBook.get() ? 'lessons__book' : 'lessons__book hidden',
                onclick: () => this.router.navigate('/lektioner/ny'),
            },
            loading: {
                textContent: () => t('lessons.loading'),
                className: () => this.lessons.loading.get() && this.lessons.items.get().length === 0
                    ? 'lessons__loading' : 'lessons__loading hidden',
            },
            errorBox: {
                className: () => this.lessons.error.get() ? 'lessons__error' : 'lessons__error hidden',
            },
            errorText: { textContent: () => t('lessons.error') },
            retry: {
                textContent: () => t('lessons.retry'),
                onclick: () => void this.lessons.load(),
            },
            upcomingSection: {
                className: () => this.upcoming.get().length === 0 ? 'lessons__group hidden' : 'lessons__group',
            },
            pastSection: {
                className: () => this.past.get().length === 0 ? 'lessons__group hidden' : 'lessons__group',
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'));
        this.$each(this.ref(frag, 'upcomingList'), this.upcoming,
            (l, _i, track) => this.renderRow(l, track), rowKey);
        this.$each(this.ref(frag, 'pastList'), this.past,
            (l, _i, track) => this.renderRow(l, track), rowKey);

        return frag;
    }

    /**
     * The empty state — the app's first with an action.
     *
     * Every hand-rolled empty state in this app renders a grey sentence and
     * nothing else, which design system §4.14 rejects: an empty state that
     * cannot be left teaches nothing. `EmptyStateComponent`'s `action` prop is a
     * single optional object, so a second exit is unrepresentable, and IA §3.7
     * names which one it must be for each case.
     *
     * The two IA cases collapse into two variants, split on whether the account
     * has a Student Relation:
     *
     * - **has Students** — a teacher who has not booked yet. The exit is Boka
     *   lektion, the same route the header's primary action opens.
     * - **no Students** — covers both "no Lessons as rider" and "no Students as
     *   Teacher", which are genuinely indistinguishable from the client: an
     *   account with no lessons and no students looks identical whether the
     *   person is waiting to be taught or waiting to teach. The body addresses
     *   both, and creation is omitted exactly as IA §3.7 requires — the single
     *   action is Bjud in elev.
     *
     * That action goes to `/students`, NOT to `/invitations`.
     *
     * IA §1 folds outgoing invitations into Mina elever, and §3.3 makes
     * `/students` the view whose header primary action and whose own empty
     * state are both Bjud in elev — the same action this CTA is labelled with.
     * `/invitations` still resolves, but sending someone there lands them on a
     * page the IA has already dissolved, and one that shows invitations without
     * the roster they are invitations to.
     *
     * Worth being explicit that this CTA is on the RIDER side, since the
     * obvious reading of "send them to the teacher's roster" is wrong for a
     * rider and right only by accident here. IA §3.7's rule for a rider with no
     * lessons is to EXPLAIN where booked lessons will appear, which the body
     * copy does; there is no action a rider can take to make their teacher book
     * one. So the CTA is not serving the rider case at all — it serves the
     * would-be teacher who is indistinguishable from a rider at this point (see
     * above), and whose next step is exactly what `/students` opens with.
     */
    private buildEmpty(host: HTMLElement): void {
        const wrap = document.createElement('div');
        host.appendChild(wrap);
        let current: EmptyStateComponent | null = null;

        this.track(effect(() => {
            const show = this.isEmpty.get();
            const teacher = this.canBook.get();
            current?.destroy();
            current = null;
            wrap.replaceChildren();
            if (!show) return;

            // Built outside the tracking scope, as spawn() does: mounting runs
            // the child's render, and those reads would otherwise subscribe THIS
            // effect and rebuild the empty state on unrelated changes.
            current = untrack(() => {
                const empty = new EmptyStateComponent(teacher
                    ? {
                        heading: () => t('lessons.empty.teacher.heading'),
                        body: () => t('lessons.empty.teacher.body'),
                        action: {
                            label: () => t('lessons.book'),
                            onclick: () => this.router.navigate('/lektioner/ny'),
                        },
                        headingLevel: 2,
                    }
                    : {
                        heading: () => t('lessons.empty.rider.heading'),
                        body: () => t('lessons.empty.rider.body'),
                        action: {
                            label: () => t('lessons.empty.rider.action'),
                            onclick: () => this.router.navigate('/students'),
                        },
                        headingLevel: 2,
                    });
                empty.mount(wrap);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(lesson: LessonForUser, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/lektioner/${lesson.id}`;
        const row = document.createElement('a');
        row.className = lesson.status === 'cancelled' ? 'lesson-row lesson-row--cancelled' : 'lesson-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const block = dateBlock(lesson.scheduledAt);
        const date = document.createElement('span');
        date.className = 'lesson-row__date';
        for (const [cls, text] of [['day', block.day], ['month', block.month], ['time', block.time]] as const) {
            const part = document.createElement('span');
            part.className = `lesson-row__${cls}`;
            part.textContent = text;
            date.appendChild(part);
        }

        const body = document.createElement('span');
        body.className = 'lesson-row__body';

        const title = document.createElement('span');
        title.className = 'lesson-row__title';
        title.textContent = lessonTitle(lesson);
        body.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'lesson-row__meta';
        // The counterparty carries a person marker (§4.6): who you meet, and in
        // which contextual role — the inverse of the reader's own on this Lesson.
        const markerHost = document.createElement('span');
        meta.appendChild(markerHost);
        const marker = new PersonMarkerComponent({
            name: lesson.counterpartyDisplayName,
            role: counterpartyRole(lesson.role),
        });
        marker.mount(markerHost);
        track(() => marker.destroy());

        if (lesson.horseName) meta.appendChild(metaPart(lesson.horseName));
        meta.appendChild(metaPart(exerciseSummary(lesson.exercises)));
        body.appendChild(meta);

        const chips = document.createElement('span');
        chips.className = 'lesson-row__chips';
        if (lesson.planTitle) chips.appendChild(chip(planChipLabel(lesson.planTitle)));
        for (const program of programBadges(lesson)) chips.appendChild(chip(programChipLabel(program)));

        const statusHost = document.createElement('span');
        statusHost.className = 'lesson-row__status';
        const descriptor = statusPill(lesson.status);
        const pill = new StatusPillComponent({
            label: descriptor.label,
            variant: descriptor.variant,
            tone: descriptor.tone,
            ...(descriptor.glyph === undefined ? {} : { glyph: descriptor.glyph }),
        });
        pill.mount(statusHost);
        track(() => pill.destroy());

        row.append(date, body, chips, statusHost);
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
    el.className = 'lesson-row__chip';
    el.textContent = label;
    el.title = label;
    return el;
}
