import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { TabsComponent } from '@basics/core/client/ui/tabs';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { PersonMarkerComponent } from '../ui/person-marker.component';
import { Async } from './async';
import {
    ACTIVITY_LIMIT,
    STUDENT_TABS,
    activePlans,
    activeHorses,
    activityKindLabel,
    activityLineState,
    activityRowKey,
    activityWhen,
    bookLessonHref,
    goalCountLabel,
    historyHref,
    isNotFound,
    latestSharedSession,
    lessonsWithStudent,
    nextLessonWith,
    planCountLabel,
    recentActivity,
    relationContext,
    resolveTab,
    sharedGoalCount,
    sharedGoals,
    sharedSessions,
    tabHref,
    tabLabel,
    type ActivityItem,
    type StudentTab,
} from './student-copy';
import {
    dateBlock,
    exerciseSummary,
    groupLessons,
    lessonTitle,
    lessonWhen,
    planChipLabel,
    programBadges,
    programChipLabel,
    statusPill,
} from '../lessons/lesson-copy';
import {
    durationLabel,
    sessionTitle,
    dateBlock as sessionDateBlock,
    sessionWhen,
} from '../training-sessions/training-session-copy';
import { dateRangeLabel, planStatusPill, primaryTeacherLabel } from '../plans/plan-copy';
import { goalStatusPill, targetDateLabel } from '../goals/goal-copy';
import {
    api,
    type Exercise,
    type GoalTeacherView,
    type Horse,
    type LessonForUser,
    type Plan,
    type Student,
    type TrainingSession,
} from '../api';

const tpl = template(`
    <div bind="root" class="elevvy">
        <a bind="back" href="/students" class="elevvy__back"></a>

        <p bind="loading" class="elevvy__loading"></p>

        <div bind="missingHost" class="elevvy__missing"></div>

        <div bind="errorBox" class="elevvy__error" role="alert">
            <p bind="errorText" class="elevvy__error-text"></p>
            <button bind="retry" type="button" class="elevvy__retry"></button>
        </div>

        <div bind="workspace" class="elevvy__workspace">
            <header class="elevvy__head">
                <p bind="eyebrow" class="elevvy__eyebrow"></p>
                <div class="elevvy__title-row">
                    <h1 bind="identity" class="elevvy__identity"></h1>
                    <button bind="book" type="button" class="elevvy__book"></button>
                </div>
                <p bind="relation" class="elevvy__meta"></p>
            </header>

            <div bind="tabsHost"></div>

            <div bind="panels" class="elevvy__panels"></div>
        </div>
    </div>
`);

const panelTpl = template(`
    <section bind="root" class="elevvy__panel" role="tabpanel">
        <p bind="lede" class="elevvy__lede"></p>
        <p bind="loading" class="elevvy__loading"></p>
        <div bind="errorBox" class="elevvy__error" role="alert">
            <p bind="errorText" class="elevvy__error-text"></p>
            <button bind="retry" type="button" class="elevvy__retry"></button>
        </div>
        <div bind="emptyHost" class="elevvy__empty hidden"></div>
        <div bind="content"></div>
    </section>
`);

/**
 * The read side of one `Async`, structurally. A panel only ever asks its source
 * three questions, and taking them as a shape rather than as `Async<T>` keeps
 * `PanelSpec` free of the item type — seven panels, seven different payloads.
 */
interface PanelSource {
    loading: { get(): boolean };
    error: { get(): unknown };
    resolved: { get(): boolean };
}

/** What a panel needs to describe its own three states. See `buildPanel`. */
interface PanelSpec {
    tab: StudentTab;
    /** i18n key prefix, e.g. `student.lessons`. */
    prefix: string;
    /** The load this panel owns, or null for a panel that composes others. */
    source: PanelSource | null;
    /** How many items the panel's data holds. Used for the empty state. */
    count?: () => number;
    /** Optional standing explanation, e.g. the Mål tab's privacy note. */
    lede?: () => string;
    /** The panel's single §4.14 action, where the reader has one at all. */
    action?: { label: () => string; onclick: () => void };
}

/**
 * Elevvy — IA §3.4. One Teacher's workspace for one Student.
 *
 * **Seven tabs, which is the design system's stated maximum** ("Undvik: fler än
 * sju flikar"). They are navigation, never actions — the single primary action,
 * Boka lektion, lives in the persistent header where §4.11 says it belongs.
 *
 * **Every tab owns its loading, empty and error state.** Each has its own
 * `Async` (see `./async.ts`), loaded on first activation and never refetched by
 * a tab switch. A failed Mål request leaves the Hästar tab working; there is no
 * page-level spinner and no page-level error below the header.
 *
 * **Privacy is the constraint that shapes this file.** Two rules, both from IA
 * §3.4, both enforced by where the data comes from rather than by what is
 * rendered:
 *
 * - The Mål tab and the Översikt count both read `GET /students/:id/goals`,
 *   which inner-joins `goal_share` on the calling Teacher. They read nothing
 *   else. A Goal whose title happens to be reachable through a Plan is not
 *   shown and is not counted — a count is a disclosure too, so there is no
 *   "3 av 7 mål" anywhere on this page.
 * - The Pass tab reads `GET /students/:id/training-sessions`, which inner-joins
 *   `training_session_share`. Unshared sessions do not exist here.
 *
 * **General Notes on a Student are not built.** The schema has a `student`
 * parent kind and `NoteService` rejects it; IA §3.4 says their privacy
 * semantics are unresolved. An unresolved privacy question is not a feature to
 * approximate.
 */
export class StudentDetailComponent extends Component {
    static styles = `
        .elevvy {
            font-family: ${token('font-ui')};

            & .elevvy__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .elevvy__loading {
                margin: 0 0 ${s('md')};
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .elevvy__loading.hidden { display: none; }

            & .elevvy__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .elevvy__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                & .elevvy__retry { ${btn()} }
            }
            & .elevvy__error.hidden { display: none; }

            & .elevvy__missing.hidden { display: none; }
            & .elevvy__workspace.hidden { display: none; }

            & .elevvy__head {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                padding-bottom: ${s('lg')};
            }

            & .elevvy__eyebrow {
                margin: 0;
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .elevvy__title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
            }

            & .elevvy__identity { margin: 0; min-width: 0; }

            /* The header identity IS the person marker (§4.11's own example
               shows exactly "Anna Ekström · Elev" above the tab row), so the
               name has to carry page-title typography rather than the 0.875rem
               it wears inside a note thread. Only the NAME is scaled: the role
               pill keeps its own metrics, which is what §4.6 protects — Lärare
               and Elev must stay identical in weight and size to each other,
               and they still are. Lora 500, never another weight
               (UI_DECISIONS §3). */
            & .elevvy__identity .person-marker__name {
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            & .elevvy__book {
                ${btn()}
                background: ${token('accent')};
                color: ${token('on-accent')};
                border: 1px solid ${token('accent')};
                &:hover { background: ${token('accent-strong')}; border-color: ${token('accent-strong')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .elevvy__meta {
                margin: 0;
                font-size: 0.875rem;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }

            /* UI_DECISIONS §6 — seven tabs do not fit a phone — is satisfied by
               TabsComponent itself: the framework component owns
               .ui-tabs__scroller, the single-line no-wrap row, and the
               overflow-aware edge mask, and re-measures on scroll, resize and
               ResizeObserver. This view carried its own copy of all of that
               before the framework had it; keeping a second implementation
               would mean two elements competing to be the scroll container and
               two rules painting the same mask. Nothing to restate here. */

            & .elevvy__panels { padding-top: ${s('xl')}; }
            & .elevvy__panel.hidden { display: none; }

            & .elevvy__lede {
                margin: 0 0 ${s('lg')};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .elevvy__lede.hidden { display: none; }

            & .elevvy__empty.hidden { display: none; }

            & .elevvy__group { margin-bottom: ${s('xl')}; }
            & .elevvy__group.hidden { display: none; }

            & .elevvy__group-label {
                margin: 0 0 ${s('md')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .elevvy__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): a hairline between rows. */
                border-top: 1px solid ${token('border')};
            }
            & .elevvy__list > li { border-bottom: 1px solid ${token('border')}; }

            & .occ-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: start;
                gap: ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }
            /* Cancelled is muted but readable — the dashed pill carries the
               meaning, the dimming only ranks the row (§4.3). */
            & .occ-row--cancelled {
                & .occ-row__title, & .occ-row__day, & .occ-row__time { color: ${token('text-muted')}; }
            }

            & .occ-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                font-variant-numeric: tabular-nums;
            }
            & .occ-row__day { font-size: 1.25rem; font-weight: 700; line-height: 1.2; color: ${token('text')}; }
            & .occ-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${token('text-muted')};
            }
            & .occ-row__time { margin-top: 2px; font-size: 0.8125rem; color: ${token('text-muted')}; }

            & .occ-row__body { display: flex; flex-direction: column; gap: ${s('xs')}; min-width: 0; }
            & .occ-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .occ-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            & .occ-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('xs')};
                justify-content: flex-end;
                max-width: 16rem;
            }
            & .occ-row__chip {
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
            & .occ-row__status { padding-top: 2px; }

            & .plain-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: center;
                gap: ${s('sm')} ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
            }
            & a.plain-row:hover { background: ${token('surface-2')}; }
            & a.plain-row:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            & .plain-row__body { display: flex; flex-direction: column; gap: ${s('xs')}; min-width: 0; }
            & .plain-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .plain-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            /* Översikt — §4.2 auto-fitting card grid, capped at the spec's four. */
            & .elevvy__cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${s('md')};
                margin-bottom: ${s('xl')};
            }
            & .elevvy__card {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                padding: ${s('lg')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                background: ${token('surface')};
                text-decoration: none;
                color: inherit;
            }
            & a.elevvy__card:hover { border-color: ${token('border-strong')}; }
            & a.elevvy__card:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            & .elevvy__card-label {
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }
            & .elevvy__card-value {
                font-size: 1rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .elevvy__card-meta { font-size: 0.8125rem; color: ${token('text-muted')}; }

            & .elevvy__subheading {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .activity-row {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                padding: ${s('sm')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-size: 0.875rem;
                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }
            & .activity-row__kind {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }
            & .activity-row__title { color: ${token('text')}; overflow-wrap: anywhere; }
            /* Timestamps are never the serif (§02). */
            & .activity-row__when { font-family: ${token('font-ui')}; color: ${token('text-muted')}; }

            & .elevvy__picker {
                display: flex;
                align-items: flex-end;
                gap: ${s('sm')};
                flex-wrap: wrap;
                max-width: 34rem;
            }
            & .elevvy__picker-field { display: flex; flex-direction: column; gap: ${s('xs')}; flex: 1; min-width: 12rem; }
            & .elevvy__picker-label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .elevvy__picker-field .ui-select { display: block; }
            & .elevvy__picker-open {
                ${btn()}
                background: ${token('accent')};
                color: ${token('on-accent')};
                border: 1px solid ${token('accent')};
                &:hover:not(:disabled) { background: ${token('accent-strong')}; border-color: ${token('accent-strong')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .elevvy__horses {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }
            & .elevvy__horse {
                padding: ${s('sm')} ${s('md')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                background: ${token('surface')};
                font-size: 0.875rem;
                color: ${token('text')};
            }

            @media (max-width: 639px) {
                & .elevvy__identity .person-marker__name { font-size: 1.375rem; line-height: 30px; }
                & .elevvy__title-row { align-items: flex-start; }
                & .occ-row {
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: ${s('sm')};
                }
                & .occ-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${s('xs')};
                    width: auto;
                }
                & .occ-row__day { font-size: 1rem; }
                & .occ-row__body { grid-column: 1 / -1; }
                & .occ-row__chips { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
                & .plain-row { grid-template-columns: minmax(0, 1fr); justify-items: start; }
                & .elevvy__picker { flex-direction: column; align-items: stretch; }
            }
        }
    `;

    private router = this.inject(Router);

    private studentId = this.router.route.get().split('/')[2] ?? '';
    private fromHref = `/students/${this.studentId}`;

    /** The relation itself. Its failure is the only page-level one (§3.4). */
    private student = new Async<Student>();

    // One per tab. Nothing here is shared, so nothing here can fail together.
    private lessons = new Async<LessonForUser[]>();
    private sessions = new Async<TrainingSession[]>();
    private plans = new Async<Plan[]>();
    private goals = new Async<GoalTeacherView[]>();
    private horses = new Async<Horse[]>();
    private exercises = new Async<Exercise[]>();

    /**
     * Frozen at mount — see `lessons.component.ts`. A clock read inside the
     * grouping would move an occasion between Kommande and Tidigare on a signal
     * nothing subscribed to.
     */
    private nowIso = new Signal(new Date().toISOString());

    /** `?flik=` is the tab's address, so a tab is linkable and survives reload. */
    private tabQuery = this.router.query('flik');
    private activeTab = new Signal<string>(resolveTab(this.router.query('flik').get()));
    private historyPick = new Signal('');

    /**
     * The spawned tab row. Held only so `scrollActiveIntoView` can ask it to
     * re-measure its own fade after moving its scroll position — the fade
     * itself is entirely the framework component's business.
     */
    private tabs: TabsComponent | null = null;
    private tabsHost: HTMLElement | null = null;

    /** Only "not your student" resolves as not-found. See `isNotFound`. */
    private missing = new Computed(() =>
        this.student.resolved.get()
        && this.student.error.get() !== null
        && isNotFound(this.student.status.get()),
    );
    private failed = new Computed(() =>
        this.student.error.get() !== null && !this.missing.get(),
    );
    private ready = new Computed(() => this.student.data.get() !== null);

    private myLessons = new Computed(() =>
        lessonsWithStudent(this.lessons.data.get() ?? [], this.studentId),
    );
    private groupedLessons = new Computed(() => groupLessons(this.myLessons.get(), this.nowIso.get()));
    private mySessions = new Computed(() => sharedSessions(this.sessions.data.get() ?? []));
    private myPlans = new Computed(() => activePlans(this.plans.data.get() ?? []));
    private myGoals = new Computed(() => sharedGoals(this.goals.data.get() ?? []));
    private myHorses = new Computed(() => activeHorses(this.horses.data.get() ?? []));

    private activity = new Computed<ActivityItem[]>(() => recentActivity(
        this.myLessons.get().map((l) => ({ id: l.id, scheduledAt: l.scheduledAt, title: lessonTitle(l) })),
        this.mySessions.get().map((s) => ({ id: s.id, performedAt: s.performedAt, title: sessionTitle(s) })),
        this.nowIso.get(),
        ACTIVITY_LIMIT,
    ));

    onMount(): void {
        void this.student.run(() => api.students.get({ id: this.studentId }));

        // URL → signal. `peek` so this effect subscribes only to the query.
        this.track(effect(() => {
            const tab = resolveTab(this.tabQuery.get());
            if (this.activeTab.peek() !== tab) this.activeTab.set(tab);
        }));

        // Signal → URL, and the tab's own load. `untrack` on the query read so
        // the two effects cannot chase each other round the loop.
        this.track(effect(() => {
            const tab = this.activeTab.get() as StudentTab;
            const current = untrack(() => resolveTab(this.tabQuery.get()));
            if (current !== tab) {
                // `replace`, not push: seven tabs would otherwise fill the
                // history stack and the Back button would stop meaning "the page
                // I came from".
                this.router.navigate(tabHref(this.studentId, tab), { replace: true });
            }
            this.loadTab(tab);
            this.scrollActiveIntoView();
        }));

        // The row becomes measurable only once the workspace stops being
        // `hidden` — a display:none scroller reports zero for every metric, so
        // whatever the tab row measured at mount was measured against nothing.
        // This is the one fade concern that is genuinely this view's, because
        // it is this view that owns the visibility.
        this.track(effect(() => {
            if (this.ready.get()) this.tabs?.syncOverflow();
        }));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: this.router.link('/students').onclick,
                textContent: () => t('student.back'),
            },
            loading: {
                textContent: () => t('student.loading'),
                className: () => this.student.loading.get()
                    ? 'elevvy__loading' : 'elevvy__loading hidden',
            },
            errorBox: {
                className: () => this.failed.get() ? 'elevvy__error' : 'elevvy__error hidden',
            },
            errorText: { textContent: () => t('student.error') },
            retry: {
                textContent: () => t('students.retry'),
                onclick: () => {
                    this.student.reset();
                    void this.student.run(() => api.students.get({ id: this.studentId }));
                },
            },
            workspace: {
                className: () => this.ready.get() ? 'elevvy__workspace' : 'elevvy__workspace hidden',
            },
            eyebrow: { textContent: () => t('student.eyebrow') },
            relation: {
                textContent: () => {
                    const student = this.student.data.get();
                    return student ? relationContext(student.email) : '';
                },
            },
            book: {
                textContent: () => t('student.book'),
                onclick: () => this.router.navigate(bookLessonHref(this.studentId)),
            },
        });

        // §4.6: the header names the person AND their contextual role in this
        // relation — which is the "relation context" IA §3.4 asks the header to
        // carry, together with the address on the line below.
        this.spawn(PersonMarkerComponent, this.ref(frag, 'identity'), {
            name: () => this.student.data.get()?.displayName ?? '',
            role: 'student',
        });

        this.buildMissing(this.ref(frag, 'missingHost'));

        // Labels are THUNKS, not strings. `TabsComponent` accepts
        // `Reactive<string>` and resolves a function arm inside an effect it
        // owns, so `() => tabLabel(tab)` hands it the locale read rather than
        // the result of one. Passing `tabLabel(tab)` instead would spend the
        // reactivity here, at construction, and freeze all seven labels in
        // whatever locale was active when this view mounted — the row is built
        // once and never rebuilt.
        this.tabsHost = this.ref(frag, 'tabsHost');
        this.tabs = this.spawn(TabsComponent, this.tabsHost, {
            active: this.activeTab,
            tabs: STUDENT_TABS.map((tab) => ({ key: tab, label: () => tabLabel(tab) })),
        });

        const panels = this.ref(frag, 'panels');
        panels.appendChild(this.buildOverview());
        panels.appendChild(this.buildLessons());
        panels.appendChild(this.buildSessions());
        panels.appendChild(this.buildPlans());
        panels.appendChild(this.buildGoals());
        panels.appendChild(this.buildHorses());
        panels.appendChild(this.buildHistory());

        return frag;
    }

    // ─── Relation-level states ──────────────────────────────────

    /**
     * A revoked or missing Relation resolves as not-found (IA §3.4), with the
     * same wording a deleted Student would get: the response deliberately does
     * not distinguish them, and neither does this.
     */
    private buildMissing(host: HTMLElement): void {
        const empty = new EmptyStateComponent({
            heading: () => t('student.notFound.heading'),
            body: () => t('student.notFound.body'),
            action: {
                label: () => t('student.notFound.action'),
                onclick: () => this.router.navigate('/students'),
            },
            headingLevel: 2,
        });
        empty.mount(host);
        this.track(() => empty.destroy());
        this.track(effect(() => {
            host.className = this.missing.get() ? 'elevvy__missing' : 'elevvy__missing hidden';
        }));
    }

    // ─── Tab plumbing ───────────────────────────────────────────

    private loadTab(tab: StudentTab): void {
        switch (tab) {
            case 'oversikt':
                // The overview is a composition of four tabs' data. IA §3.4
                // notes it "is best served by a student-workspace aggregate
                // endpoint"; there is none, so it composes what exists — and
                // each part still fails on its own.
                void this.lessons.runOnce(() => api.lessons.list());
                void this.sessions.runOnce(() => api.students.listTrainingSessions({ id: this.studentId }));
                void this.plans.runOnce(() => api.students.listPlans({ id: this.studentId }));
                void this.goals.runOnce(() => api.students.listGoals({ id: this.studentId }));
                return;
            case 'lektioner':
                void this.lessons.runOnce(() => api.lessons.list());
                return;
            case 'pass':
                void this.sessions.runOnce(() => api.students.listTrainingSessions({ id: this.studentId }));
                return;
            case 'planer':
                void this.plans.runOnce(() => api.students.listPlans({ id: this.studentId }));
                return;
            case 'mal':
                void this.goals.runOnce(() => api.students.listGoals({ id: this.studentId }));
                return;
            case 'hastar':
                void this.horses.runOnce(() => api.students.listHorses({ id: this.studentId }));
                return;
            case 'historik':
                void this.exercises.runOnce(() => api.exercises.list());
        }
    }

    private reloadTab(tab: StudentTab): void {
        for (const source of this.sourcesFor(tab)) source.reset();
        this.loadTab(tab);
    }

    private sourcesFor(tab: StudentTab): { reset(): void }[] {
        switch (tab) {
            case 'oversikt': return [this.lessons, this.sessions, this.plans, this.goals];
            case 'lektioner': return [this.lessons];
            case 'pass': return [this.sessions];
            case 'planer': return [this.plans];
            case 'mal': return [this.goals];
            case 'hastar': return [this.horses];
            case 'historik': return [this.exercises];
        }
    }

    /**
     * UI_DECISIONS §6: the active tab scrolls into view on mount.
     *
     * Still this view's job — which tab is active is this view's state, not the
     * tab row's. Only the FADE moved to the framework, and moving the scroll
     * position is exactly the event that changes it, so the row is asked to
     * re-measure rather than left to notice. Synchronously, not on a frame:
     * `requestAnimationFrame` does not fire in a hidden document, and a
     * re-measure that only lands in a foreground tab is one that cannot be
     * verified.
     */
    private scrollActiveIntoView(): void {
        const settle = (): void => {
            const active = this.tabsHost?.querySelector<HTMLElement>('.ui-tabs__tab.active');
            active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            this.tabs?.syncOverflow();
        };
        settle();
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(settle);
    }

    /**
     * One panel, with the loading / empty / error triple IA §3.4 requires each
     * tab to own. The empty state is built once with reactive copy — never
     * inside a tracked effect (LESSONS #1) — and toggled by class.
     */
    private buildPanel(spec: PanelSpec): { root: HTMLElement; content: HTMLElement } {
        const source = spec.source;
        const isEmpty = (): boolean => {
            if (!source || !spec.count) return false;
            return source.resolved.get() && source.error.get() === null && spec.count() === 0;
        };

        const root = this.wireEl(panelTpl, {
            root: {
                className: () => this.activeTab.get() === spec.tab
                    ? 'elevvy__panel' : 'elevvy__panel hidden',
                'aria-label': () => tabLabel(spec.tab),
            },
            lede: {
                textContent: () => spec.lede?.() ?? '',
                className: () => spec.lede ? 'elevvy__lede' : 'elevvy__lede hidden',
            },
            loading: {
                textContent: () => t(`${spec.prefix}.loading`),
                className: () => source?.loading.get() && !source.resolved.get()
                    ? 'elevvy__loading' : 'elevvy__loading hidden',
            },
            errorBox: {
                className: () => source?.error.get() ? 'elevvy__error' : 'elevvy__error hidden',
            },
            errorText: { textContent: () => t(`${spec.prefix}.error`) },
            retry: {
                textContent: () => t('students.retry'),
                onclick: () => this.reloadTab(spec.tab),
            },
        });

        const emptyHost = this.ref(root, 'emptyHost');
        if (spec.count) {
            const empty = new EmptyStateComponent({
                heading: () => t(`${spec.prefix}.empty.heading`),
                body: () => t(`${spec.prefix}.empty.body`),
                ...(spec.action ? { action: spec.action } : {}),
                headingLevel: 2,
            });
            empty.mount(emptyHost);
            this.track(() => empty.destroy());
            this.track(effect(() => {
                emptyHost.className = isEmpty() ? 'elevvy__empty' : 'elevvy__empty hidden';
            }));
        }

        return { root, content: this.ref(root, 'content') };
    }

    // ─── Översikt ───────────────────────────────────────────────

    /**
     * IA §3.4: next Lesson, latest shared Training Session, active Plan count,
     * shared Goal count, compact recent activity.
     *
     * The overview has no empty state of its own — every card states its own
     * absence, which is the honest answer to "what is going on with this
     * rider" when the answer is "nothing yet". Each card also reports its own
     * source's failure, so a broken goals request costs the reader one card
     * rather than the tab.
     */
    private buildOverview(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'oversikt',
            prefix: 'student.overview',
            source: null,
        });

        const cards = document.createElement('div');
        cards.className = 'elevvy__cards';

        cards.appendChild(this.card({
            label: () => t('student.overview.nextLesson'),
            value: () => {
                const data = this.lessons.data.get();
                if (this.lessons.error.get()) return t('student.overview.unavailable');
                if (!data) return '…';
                const next = nextLessonWith(data, this.studentId, this.nowIso.get());
                return next ? lessonWhen(next.scheduledAt) : t('student.overview.nextLesson.none');
            },
            meta: () => {
                const data = this.lessons.data.get();
                if (!data) return '';
                const next = nextLessonWith(data, this.studentId, this.nowIso.get());
                return next ? lessonTitle(next) : '';
            },
            href: () => {
                const data = this.lessons.data.get();
                if (!data) return null;
                const next = nextLessonWith(data, this.studentId, this.nowIso.get());
                return next ? `/lektioner/${next.id}` : null;
            },
        }));

        cards.appendChild(this.card({
            label: () => t('student.overview.latestSession'),
            value: () => {
                if (this.sessions.error.get()) return t('student.overview.unavailable');
                const data = this.sessions.data.get();
                if (!data) return '…';
                const latest = latestSharedSession(data);
                return latest ? sessionWhen(latest.performedAt) : t('student.overview.latestSession.none');
            },
            meta: () => {
                const data = this.sessions.data.get();
                const latest = data ? latestSharedSession(data) : null;
                return latest ? sessionTitle(latest) : '';
            },
            href: () => {
                const data = this.sessions.data.get();
                const latest = data ? latestSharedSession(data) : null;
                return latest ? `/traningspass/${latest.id}` : null;
            },
        }));

        cards.appendChild(this.card({
            label: () => t('student.overview.activePlans'),
            value: () => {
                if (this.plans.error.get()) return t('student.overview.unavailable');
                const data = this.plans.data.get();
                return data ? planCountLabel(activePlans(data).length) : '…';
            },
            meta: () => '',
            href: () => null,
        }));

        cards.appendChild(this.card({
            label: () => t('student.overview.sharedGoals'),
            value: () => {
                if (this.goals.error.get()) return t('student.overview.unavailable');
                const data = this.goals.data.get();
                // `sharedGoalCount` reads the share-scoped endpoint and nothing
                // else. There is deliberately no "x av y" here: the total would
                // disclose the existence of Goals this Student did not share.
                return data ? goalCountLabel(sharedGoalCount(data)) : '…';
            },
            meta: () => t('student.overview.sharedGoals.meta'),
            href: () => null,
        }));

        content.appendChild(cards);

        const heading = document.createElement('h2');
        heading.className = 'elevvy__subheading';
        this.track(effect(() => { heading.textContent = t('student.overview.activity'); }));
        content.appendChild(heading);

        // The activity block is a fifth card and follows the same rule as the
        // other four: it states its own source's condition rather than folding
        // every condition into "nothing here".
        //
        // `this.activity` is derived from `lessons.data ?? []` and
        // `sessions.data ?? []`, so it is the empty array in three very
        // different situations — not asked yet, asked and failed, and asked and
        // genuinely empty. Only the third may say "Inget har hänt än."; the
        // first two said it too until this gate landed, so a reader whose
        // lessons request had failed was told this rider had done nothing.
        // IA §3.4 gives every tab its own loading, empty AND error state, and
        // an empty state standing in for the other two is the one substitution
        // that misinforms rather than merely underinforms.
        const activitySources = [this.lessons, this.sessions];
        const activityFailed = new Computed(() =>
            activitySources.some((source) => source.error.get() !== null),
        );
        const activityAnswered = new Computed(() =>
            activitySources.every((source) => source.resolved.get()),
        );

        const emptyLine = document.createElement('p');
        emptyLine.className = 'elevvy__lede hidden';
        this.track(effect(() => {
            const state = activityLineState({
                sourcesFailed: activityFailed.get(),
                sourcesAnswered: activityAnswered.get(),
                count: this.activity.get().length,
            });
            // 'unavailable' borrows the cards' wording for the same condition,
            // so one failed request reads as one problem rather than two.
            if (state !== 'silent') {
                emptyLine.textContent = state === 'unavailable'
                    ? t('student.overview.unavailable')
                    : t('student.overview.activity.empty');
            }
            emptyLine.className = state === 'silent' ? 'elevvy__lede hidden' : 'elevvy__lede';
        }));
        content.appendChild(emptyLine);

        const list = document.createElement('ul');
        list.className = 'elevvy__list';
        content.appendChild(list);
        this.$each(list, this.activity, (item) => this.renderActivity(item), activityRowKey);

        return root;
    }

    private card(spec: {
        label: () => string;
        value: () => string;
        meta: () => string;
        href: () => string | null;
    }): HTMLElement {
        // An anchor when there is somewhere to go, a div otherwise — a card that
        // navigates nowhere must not look or focus like a link.
        const host = document.createElement('div');
        const build = (): HTMLElement => {
            const href = spec.href();
            const el = document.createElement(href ? 'a' : 'div');
            el.className = 'elevvy__card';
            if (href) {
                (el as HTMLAnchorElement).href = href;
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.router.navigate(href);
                });
            }
            const label = document.createElement('span');
            label.className = 'elevvy__card-label';
            label.textContent = spec.label();
            const value = document.createElement('span');
            value.className = 'elevvy__card-value';
            value.textContent = spec.value();
            el.append(label, value);
            const meta = spec.meta();
            if (meta) {
                const metaEl = document.createElement('span');
                metaEl.className = 'elevvy__card-meta';
                metaEl.textContent = meta;
                el.appendChild(metaEl);
            }
            return el;
        };
        this.track(effect(() => { host.replaceChildren(build()); }));
        return host;
    }

    private renderActivity(item: ActivityItem): HTMLElement {
        const li = document.createElement('li');
        const row = document.createElement('a');
        row.className = 'activity-row';
        row.href = item.href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(item.href);
        });

        const kind = document.createElement('span');
        kind.className = 'activity-row__kind';
        kind.textContent = activityKindLabel(item.kind);
        const title = document.createElement('span');
        title.className = 'activity-row__title';
        title.textContent = item.title;
        const when = document.createElement('span');
        when.className = 'activity-row__when';
        when.textContent = activityWhen(item.at);
        row.append(kind, title, when);
        li.appendChild(row);
        return li;
    }

    // ─── Lektioner ──────────────────────────────────────────────

    /**
     * Only Lessons involving this Student, in the §4.3 occasion grammar:
     * Kommande / Tidigare, date block with tabular numerals, status pill always
     * visible, cancelled rows muted.
     *
     * No person marker on these rows: §4.6 explicitly avoids a marker "när
     * kontexten redan är entydig", and every row on this page is about the
     * person named in the header.
     */
    private buildLessons(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'lektioner',
            prefix: 'student.lessons',
            source: this.lessons,
            count: () => this.myLessons.get().length,
            action: {
                label: () => t('student.book'),
                onclick: () => this.router.navigate(bookLessonHref(this.studentId)),
            },
        });

        for (const [key, labelKey] of [
            ['upcoming', 'lessons.group.upcoming'],
            ['past', 'lessons.group.past'],
        ] as const) {
            const items = new Computed(() => this.groupedLessons.get()[key]);
            const section = document.createElement('section');
            section.className = 'elevvy__group';
            const label = document.createElement('h3');
            label.className = 'elevvy__group-label';
            const list = document.createElement('ul');
            list.className = 'elevvy__list';
            section.append(label, list);
            this.track(effect(() => {
                label.textContent = t(labelKey);
                section.className = items.get().length === 0 ? 'elevvy__group hidden' : 'elevvy__group';
            }));
            this.$each(list, items, (lesson, _i, track) => this.renderLesson(lesson, track),
                (lesson) => `${lesson.id}:${lesson.status}:${lesson.scheduledAt}`);
            content.appendChild(section);
        }

        return root;
    }

    private renderLesson(lesson: LessonForUser, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/lektioner/${lesson.id}`;
        const row = document.createElement('a');
        row.className = lesson.status === 'cancelled' ? 'occ-row occ-row--cancelled' : 'occ-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        row.appendChild(this.dateColumn(dateBlock(lesson.scheduledAt)));

        const body = document.createElement('span');
        body.className = 'occ-row__body';
        const title = document.createElement('span');
        title.className = 'occ-row__title';
        title.textContent = lessonTitle(lesson);
        const meta = document.createElement('span');
        meta.className = 'occ-row__meta';
        if (lesson.horseName) meta.appendChild(textSpan(lesson.horseName));
        meta.appendChild(textSpan(exerciseSummary(lesson.exercises)));
        body.append(title, meta);

        const chips = document.createElement('span');
        chips.className = 'occ-row__chips';
        if (lesson.planTitle) chips.appendChild(chip(planChipLabel(lesson.planTitle)));
        for (const program of programBadges(lesson)) chips.appendChild(chip(programChipLabel(program)));

        const statusHost = document.createElement('span');
        statusHost.className = 'occ-row__status';
        track(mountPill(statusHost, statusPill(lesson.status)));

        row.append(body, chips, statusHost);
        li.appendChild(row);
        return li;
    }

    // ─── Pass ───────────────────────────────────────────────────

    /**
     * Only Training Sessions explicitly shared with this Teacher — enforced by
     * the endpoint, which inner-joins `training_session_share`.
     *
     * No sharing chip on these rows. §4.5's chip is a *trust control*, shown
     * where sharing is a choice being made or reviewed; that choice belongs to
     * the Student, on their own Träningspass view. Here every row is shared with
     * the reader by definition, so a chip would say the same thing on every row,
     * and naming the recipient would mean naming the reader to themselves. The
     * standing lede states the rule once instead — and, per LESSONS #7, there is
     * no path here that could paint a degraded "Delad: okänd mottagare".
     */
    private buildSessions(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'pass',
            prefix: 'student.sessions',
            source: this.sessions,
            count: () => this.mySessions.get().length,
            lede: () => t('student.sessions.lede'),
        });

        const list = document.createElement('ul');
        list.className = 'elevvy__list';
        content.appendChild(list);
        this.$each(list, this.mySessions, (session) => this.renderSession(session),
            (session) => `${session.id}:${session.updatedAt}`);

        return root;
    }

    private renderSession(session: TrainingSession): HTMLElement {
        const li = document.createElement('li');
        const href = `/traningspass/${session.id}`;
        const row = document.createElement('a');
        row.className = 'occ-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        row.appendChild(this.dateColumn(sessionDateBlock(session.performedAt)));

        const body = document.createElement('span');
        body.className = 'occ-row__body';
        const title = document.createElement('span');
        title.className = 'occ-row__title';
        title.textContent = sessionTitle(session);
        const meta = document.createElement('span');
        meta.className = 'occ-row__meta';
        const duration = durationLabel(session.durationMin);
        if (duration) meta.appendChild(textSpan(duration));
        if (session.horseName) meta.appendChild(textSpan(session.horseName));
        body.append(title, meta);

        const chips = document.createElement('span');
        chips.className = 'occ-row__chips';
        if (session.planTitle) chips.appendChild(chip(planChipLabel(session.planTitle)));

        row.append(body, chips, document.createElement('span'));
        li.appendChild(row);
        return li;
    }

    // ─── Planer ─────────────────────────────────────────────────

    /**
     * Active Plans, date range, Primary Teacher label, linking to the read-only
     * Plan detail. Archived plans are omitted: IA §3.4 asks for active ones, and
     * a coach's workspace is about what is running now.
     *
     * The Primary Teacher label is exactly that — a label. `plan-copy.ts` says
     * it grants nothing, and nothing here derives access from it.
     */
    private buildPlans(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'planer',
            prefix: 'student.plans',
            source: this.plans,
            count: () => this.myPlans.get().length,
        });

        const list = document.createElement('ul');
        list.className = 'elevvy__list';
        content.appendChild(list);
        this.$each(list, this.myPlans, (plan, _i, track) => this.renderPlan(plan, track),
            (plan) => `${plan.id}:${plan.updatedAt}`);

        return root;
    }

    private renderPlan(plan: Plan, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/planer/${plan.id}`;
        const row = document.createElement('a');
        row.className = 'plain-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const body = document.createElement('span');
        body.className = 'plain-row__body';
        const title = document.createElement('span');
        title.className = 'plain-row__title';
        title.textContent = plan.title;
        const meta = document.createElement('span');
        meta.className = 'plain-row__meta';
        const range = dateRangeLabel(plan.startDate, plan.endDate);
        if (range) meta.appendChild(textSpan(range));
        const teacher = primaryTeacherLabel(plan.primaryTeacherDisplayName);
        if (teacher) meta.appendChild(textSpan(teacher));
        body.append(title, meta);

        const statusHost = document.createElement('span');
        track(mountPill(statusHost, planStatusPill(plan.status)));

        row.append(body, statusHost);
        li.appendChild(row);
        return li;
    }

    // ─── Mål ────────────────────────────────────────────────────

    /**
     * Goals explicitly shared with this Teacher, with status and target date.
     *
     * The list comes from `GET /students/:id/goals` and from nowhere else — see
     * `sharedGoals` in `student-copy.ts`. A Goal reachable by title through a
     * Plan is not shown here, and there is no count of the ones that are not.
     *
     * Status changes are not offered on this row. A shared Teacher may move a
     * Goal between active and achieved (`goalTransitions(status,
     * 'sharedTeacher')`), but that is a judgement made while reading the Goal,
     * with its notes and its plan in front of you — so the row links to the Mål
     * detail view that already implements those transitions, their confirms and
     * their conflict handling, rather than growing a second, thinner copy here.
     */
    private buildGoals(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'mal',
            prefix: 'student.goals',
            source: this.goals,
            count: () => this.myGoals.get().length,
            lede: () => t('student.goals.lede'),
        });

        const list = document.createElement('ul');
        list.className = 'elevvy__list';
        content.appendChild(list);
        this.$each(list, this.myGoals, (goal, _i, track) => this.renderGoal(goal, track),
            (goal) => `${goal.id}:${goal.status}:${goal.updatedAt}`);

        return root;
    }

    private renderGoal(goal: GoalTeacherView, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/mal/${goal.id}`;
        const row = document.createElement('a');
        row.className = 'plain-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const body = document.createElement('span');
        body.className = 'plain-row__body';
        const title = document.createElement('span');
        title.className = 'plain-row__title';
        title.textContent = goal.title;
        const meta = document.createElement('span');
        meta.className = 'plain-row__meta';
        const target = targetDateLabel(goal.targetDate);
        if (target) meta.appendChild(textSpan(target));
        body.append(title, meta);

        const statusHost = document.createElement('span');
        track(mountPill(statusHost, goalStatusPill(goal.status)));

        row.append(body, statusHost);
        li.appendChild(row);
        return li;
    }

    // ─── Hästar ─────────────────────────────────────────────────

    /** Non-archived Horses, read-only. The stable belongs to the Student. */
    private buildHorses(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'hastar',
            prefix: 'student.horses',
            source: this.horses,
            count: () => this.myHorses.get().length,
        });

        const list = document.createElement('ul');
        list.className = 'elevvy__horses';
        content.appendChild(list);
        this.$each(list, this.myHorses, (horse) => {
            const li = document.createElement('li');
            li.className = 'elevvy__horse';
            li.textContent = horse.name;
            return li;
        }, (horse) => `${horse.id}:${horse.name}`);

        return root;
    }

    // ─── Historik ───────────────────────────────────────────────

    /**
     * Choose an Exercise, then open Övningshistorik for this Student (IA §3.4 /
     * §3.16). The picker is this tab; the history itself is its own route, and
     * `?from=` carries the way back to this exact tab.
     */
    private buildHistory(): HTMLElement {
        const { root, content } = this.buildPanel({
            tab: 'historik',
            prefix: 'student.history',
            source: this.exercises,
            count: () => (this.exercises.data.get() ?? []).length,
            action: {
                label: () => t('student.history.empty.action'),
                onclick: () => this.router.navigate('/library'),
            },
        });

        const wrap = document.createElement('div');
        wrap.className = 'elevvy__picker';

        const field = document.createElement('div');
        field.className = 'elevvy__picker-field';
        const label = document.createElement('span');
        label.className = 'elevvy__picker-label';
        const selectHost = document.createElement('div');
        field.append(label, selectHost);

        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'elevvy__picker-open';

        const hint = document.createElement('p');
        hint.className = 'elevvy__lede';

        this.track(effect(() => {
            label.textContent = t('student.history.field');
            open.textContent = t('student.history.open');
            open.disabled = this.historyPick.get() === '';
            const student = this.student.data.get();
            hint.textContent = t('student.history.hint', { name: student?.displayName ?? '' });
        }));

        open.addEventListener('click', () => {
            const exerciseId = this.historyPick.get();
            if (!exerciseId) return;
            this.router.navigate(historyHref(
                this.studentId,
                exerciseId,
                tabHref(this.studentId, 'historik'),
            ));
        });

        this.spawn(SelectComponent, selectHost, {
            value: this.historyPick,
            options: new Computed<SelectOption[]>(() =>
                (this.exercises.data.get() ?? []).map((e) => ({ value: e.id, label: e.name })),
            ),
            placeholder: t('student.history.placeholder'),
        });

        wrap.append(field, open);
        content.append(hint, wrap);

        // The picker is meaningless with nothing to pick; the empty state owns
        // that case and offers the one action that resolves it.
        this.track(effect(() => {
            const has = (this.exercises.data.get() ?? []).length > 0;
            wrap.style.display = has ? '' : 'none';
            hint.className = has ? 'elevvy__lede' : 'elevvy__lede hidden';
        }));

        return root;
    }

    // ─── Row primitives ─────────────────────────────────────────

    private dateColumn(block: { day: string; month: string; time: string }): HTMLElement {
        const date = document.createElement('span');
        date.className = 'occ-row__date';
        for (const [cls, text] of [['day', block.day], ['month', block.month], ['time', block.time]] as const) {
            const part = document.createElement('span');
            part.className = `occ-row__${cls}`;
            part.textContent = text;
            date.appendChild(part);
        }
        return date;
    }
}

function textSpan(text: string): HTMLElement {
    const el = document.createElement('span');
    el.textContent = text;
    return el;
}

function chip(label: string): HTMLElement {
    const el = document.createElement('span');
    el.className = 'occ-row__chip';
    el.textContent = label;
    el.title = label;
    return el;
}

function mountPill(
    host: HTMLElement,
    // `label` is a thunk on every descriptor these rows pass, and the pill
    // resolves it inside its own effect — which is what keeps a row's status
    // copy alive after a locale switch, given that `$each` builds rows
    // untracked. The literal arm stays for any caller that has nothing to
    // re-read.
    descriptor: { label: string | (() => string); variant: 'outline' | 'filled' | 'dashed'; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; glyph?: string },
): () => void {
    const pill = new StatusPillComponent({
        label: descriptor.label,
        variant: descriptor.variant,
        tone: descriptor.tone,
        ...(descriptor.glyph === undefined ? {} : { glyph: descriptor.glyph }),
    });
    pill.mount(host);
    return () => pill.destroy();
}
