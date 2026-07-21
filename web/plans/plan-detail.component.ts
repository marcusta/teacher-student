import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { DetailHeaderComponent } from '../ui/detail-header.component';
import { PlansService } from './plans.service';
import { GoalsService } from '../goals/goals.service';
import { TeachersService } from '../training-sessions/teachers.service';
import {
    attachableGoals,
    dateBlock,
    dateRangeLabel,
    goalStatusPill,
    goalsEmptyKey,
    groupLinkedLessons,
    isValidRange,
    lessonMeta,
    linkedGoalIds,
    occasionWhen,
    planControls,
    planStatusPill,
    primaryTeacherLabel,
    sessionMeta,
    sortLinkedSessions,
    type PlanViewer,
} from './plan-copy';
import { targetDateLabel } from '../goals/goal-copy';
import type { LinkedGoalRef, LinkedLessonRef, LinkedTrainingSessionRef, PlanDetail } from '../api';

const tpl = template(`
    <div class="plan-detail" bind="root">
        <a bind="back" href="/planer" class="plan-detail__back"></a>
        <p bind="loading" class="plan-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="plan-detail__body">
            <div bind="headerHost"></div>

            <section bind="readSection" class="plan-detail__section">
                <h2 bind="descHeading" class="plan-detail__heading"></h2>
                <p bind="descRead" class="plan-detail__prose"></p>
                <p bind="descEmpty" class="plan-detail__muted"></p>
            </section>

            <section bind="editSection" class="plan-detail__section">
                <h2 bind="editHeading" class="plan-detail__heading"></h2>
                <form bind="editForm" class="plan-detail__form">
                    <div class="plan-detail__panel">
                        <label class="plan-detail__field">
                            <span bind="titleLabel" class="plan-detail__label"></span>
                            <input bind="titleInput" type="text" maxlength="200" class="plan-detail__input" required>
                            <span bind="titleError" class="plan-detail__field-error" role="alert"></span>
                        </label>
                        <label class="plan-detail__field">
                            <span bind="descLabel" class="plan-detail__label"></span>
                            <textarea bind="descInput" rows="4" maxlength="5000" class="plan-detail__textarea"></textarea>
                        </label>
                        <div class="plan-detail__pair">
                            <label class="plan-detail__field">
                                <span bind="startLabel" class="plan-detail__label"></span>
                                <input bind="startInput" type="date" class="plan-detail__input">
                            </label>
                            <label class="plan-detail__field">
                                <span bind="endLabel" class="plan-detail__label"></span>
                                <input bind="endInput" type="date" class="plan-detail__input">
                                <span bind="endError" class="plan-detail__field-error" role="alert"></span>
                            </label>
                        </div>
                        <label bind="teacherField" class="plan-detail__field">
                            <span bind="teacherLabel" class="plan-detail__label"></span>
                            <div bind="teacherHost" class="plan-detail__control"></div>
                            <span bind="teacherHint" class="plan-detail__hint"></span>
                        </label>
                        <div class="plan-detail__row">
                            <button bind="save" type="submit" class="plan-detail__save"></button>
                            <span bind="saveError" class="plan-detail__field-error" role="alert"></span>
                        </div>
                    </div>
                </form>
            </section>

            <section class="plan-detail__section">
                <h2 bind="goalsHeading" class="plan-detail__heading"></h2>
                <ul bind="goalsList" class="plan-detail__list"></ul>
                <p bind="goalsEmpty" class="plan-detail__muted"></p>
                <div bind="goalsAttach" class="plan-detail__row">
                    <div bind="goalHost" class="plan-detail__control plan-detail__control--grow"></div>
                    <button bind="attachGoal" type="button" class="plan-detail__secondary"></button>
                </div>
                <p bind="goalsNone" class="plan-detail__hint"></p>
            </section>

            <section class="plan-detail__section">
                <h2 bind="lessonsHeading" class="plan-detail__heading"></h2>
                <div bind="upcomingGroup" class="plan-detail__group">
                    <h3 bind="upcomingLabel" class="plan-detail__group-label"></h3>
                    <ul bind="upcomingList" class="plan-detail__list"></ul>
                </div>
                <div bind="pastGroup" class="plan-detail__group">
                    <h3 bind="pastLabel" class="plan-detail__group-label"></h3>
                    <ul bind="pastList" class="plan-detail__list"></ul>
                </div>
                <p bind="lessonsEmpty" class="plan-detail__muted"></p>
            </section>

            <section class="plan-detail__section">
                <h2 bind="sessionsHeading" class="plan-detail__heading"></h2>
                <ul bind="sessionsList" class="plan-detail__list"></ul>
                <p bind="sessionsEmpty" class="plan-detail__muted"></p>
            </section>

            <section bind="archivedSection" class="plan-detail__archived">
                <p bind="archivedNotice" class="plan-detail__archived-text"></p>
            </section>
        </div>

        <div bind="confirmArchiveHost" class="plan-detail__dialog"></div>
    </div>
`);

/**
 * Plan — IA §3.12. The hub where a Plan's Goals and every linked training
 * occasion become readable together, in the information order the IA fixes:
 * header, description, **Mål**, **Lektioner**, **Träningspass**, and finally the
 * archived-state explanation when there is one.
 *
 * Three things govern this view.
 *
 * **The connected Teacher reads and navigates — nothing else.** §3.12 gives
 * them exactly those two verbs, so the edit form, the Goal picker, the detach
 * links and Arkivera are *withheld*, never rendered disabled. `planControls`
 * holds that matrix and is asserted in `tests/plan-copy.test.ts`; the server
 * enforces the same line by filtering every write on `student_id`.
 *
 * **The Mål section is privacy-filtered, and the copy admits it.**
 * `PlanService.getDetail` joins `goal_share`, so a connected Teacher receives
 * only the Goals shared with them individually and the owner receives all. Two
 * consequences are visible here: an empty section says something different to
 * each reader (`goalsEmptyKey`), and there is **no count anywhere near it** —
 * "1 av 3" would leak exactly the two the filter hid. Every Goal this view
 * renders is one the reader may open, so §3.12's rule that "the UI must not
 * make a hidden Goal navigable" holds by construction rather than by a check.
 *
 * **Linked occasions are navigation, not inventory.** §3.12 says detaching them
 * needs a product decision first — whether a Plan owner may detach a
 * Teacher-authored Lesson from their own hub — so no detach control exists, and
 * `PlanControls` has no flag that could be switched on by accident.
 */
export class PlanDetailComponent extends Component {
    static styles = `
        .plan-detail {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            font-family: ${token('font-ui')};

            & .plan-detail__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .plan-detail__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .plan-detail__loading.hidden { display: none; }

            & .plan-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xl')};
            }
            & .plan-detail__body.hidden { display: none; }

            & .plan-detail__section {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
            }
            & .plan-detail__section.hidden { display: none; }

            /* A section heading is one of the places the serif is allowed —
               Lora, weight 500, and only 500 (UI_DECISIONS §3). */
            & .plan-detail__heading {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${token('text')};
            }

            & .plan-detail__group { display: flex; flex-direction: column; gap: ${s('sm')}; }
            & .plan-detail__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .plan-detail__group-label {
                margin: 0;
                font-family: ${token('font-ui')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .plan-detail__prose {
                margin: 0;
                max-width: 68ch;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${token('text')};
                white-space: pre-wrap;
            }
            & .plan-detail__prose.hidden { display: none; }

            & .plan-detail__muted {
                margin: 0;
                font-size: 0.875rem;
                color: ${token('text-muted')};
            }
            & .plan-detail__muted.hidden { display: none; }

            & .plan-detail__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .plan-detail__hint.hidden { display: none; }

            & .plan-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): a hairline separates rows. */
                border-top: 1px solid ${token('border')};
            }
            & .plan-detail__list:empty { border-top: none; }
            & .plan-detail__list > li { border-bottom: 1px solid ${token('border')}; }

            & .plan-detail__item {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: start;
                gap: ${s('lg')};
                padding: ${s('sm')} ${s('sm')};
                font-family: ${token('font-ui')};
            }
            & .plan-detail__item--flat { grid-template-columns: minmax(0, 1fr) auto; }

            & .plan-detail__link {
                display: contents;
                color: inherit;
                text-decoration: none;
            }
            & .plan-detail__item:hover { background: ${token('surface-2')}; }
            & .plan-detail__item:focus-within { outline: 2px solid ${token('accent')}; outline-offset: -2px; }

            & .plan-detail__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .plan-detail__day { font-size: 1.125rem; font-weight: 700; line-height: 1.2; color: ${token('text')}; }
            & .plan-detail__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${token('text-muted')};
            }
            & .plan-detail__time { margin-top: 2px; font-size: 0.8125rem; color: ${token('text-muted')}; }

            & .plan-detail__item-body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .plan-detail__item-title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .plan-detail__item-meta {
                font-size: 0.8125rem;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }
            & .plan-detail__item-trail {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            & .plan-detail__detach {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.8125rem;
                color: ${token('danger')};
                text-decoration: underline;
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .plan-detail__form {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                max-width: 34rem;
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .plan-detail__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .plan-detail__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .plan-detail__field.hidden { display: none; }
            & .plan-detail__pair { display: grid; grid-template-columns: 1fr 1fr; gap: ${s('md')}; }
            & .plan-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .plan-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .plan-detail__field-error:empty { display: none; }
            & .plan-detail__input, & .plan-detail__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .plan-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }
            & .plan-detail__control .ui-select { display: block; }
            & .plan-detail__control--grow { flex: 1; min-width: 12rem; }

            & .plan-detail__row {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            & .plan-detail__row.hidden { display: none; }

            /* §4.8: one primary per form. Spara is it. */
            & .plan-detail__save { ${btn(token('radius-sm'), 'primary')} }
            /* Koppling mål is a second action on the page, not a second
               primary — the secondary tier is carried by its edge alone. */
            & .plan-detail__secondary { ${btn()} }

            /* The archived explanation carries the brass rule — it is the
               brand's own voice explaining a state, not a warning. */
            & .plan-detail__archived {
                padding: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                background: ${token('surface-2')};
            }
            & .plan-detail__archived.hidden { display: none; }

            /* Hides the closed dialog from the DOM entirely for a reader who
               has no such action — see the binding for why. */
            & .plan-detail__dialog.hidden { display: none; }
            & .plan-detail__archived-text {
                margin: 0;
                max-width: 68ch;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text')};
            }

            @media (max-width: 639px) {
                & .plan-detail__pair { grid-template-columns: 1fr; }
                & .plan-detail__item {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${s('sm')};
                }
                & .plan-detail__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${s('xs')};
                    width: auto;
                }
                & .plan-detail__day { font-size: 1rem; }
                & .plan-detail__item-trail { justify-content: flex-start; }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private plans = this.inject(PlansService);
    private goals = this.inject(GoalsService);
    private teachers = this.inject(TeachersService);
    private toasts = this.inject(ToastService);

    private detail = new Signal<PlanDetail | null>(null);
    private resolved = new Signal(false);
    private confirmArchive = new Signal(false);

    /**
     * Frozen at mount. Re-reading the clock inside the grouping computation
     * would move a Lesson from Kommande to Tidigare mid-render, on a signal
     * nothing subscribed to.
     */
    private nowIso = new Signal(new Date().toISOString());

    // The edit form's fields, seeded from the loaded Plan.
    private titleVal = new Signal('');
    private descVal = new Signal('');
    private startVal = new Signal('');
    private endVal = new Signal('');
    private primaryVal = new Signal('');
    private titleTouched = new Signal(false);
    /** The Goal the picker currently offers to attach. */
    private goalVal = new Signal('');

    /**
     * Nothing in this view writes from an effect.
     *
     * The Träningspass slice lost a session's sharing on open because a signal
     * seeded from a later fetch was read as a user edit. Every write here is
     * behind an explicit press — Spara, Koppla mål, Ta bort koppling, Arkivera —
     * so there is no auto-committing control to guard in the first place, and
     * seeding `titleVal` and friends from the server can never commit anything.
     */
    private viewer = new Computed<PlanViewer>(() => {
        const plan = this.detail.get();
        const me = this.auth.currentUser.get();
        return plan && me && plan.studentId === me.id ? 'owner' : 'connectedTeacher';
    });

    private controls = new Computed(() =>
        planControls(this.viewer.get(), this.detail.get()?.status ?? 'active'));

    private rangeInvalid = new Computed(() =>
        !isValidRange(this.startVal.get() || null, this.endVal.get() || null));

    private teacherOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('plan.primaryTeacher.none') },
        ...this.teachers.items.get().map((teacher) => ({
            value: teacher.id,
            label: teacher.displayName,
        })),
    ]);

    /**
     * Goals still attachable to this Plan.
     *
     * Driven off the OWNER's own Goal list and each Goal's `planIds`, never off
     * `PlanDetail.goals` — that array answers "what may this reader see", which
     * is a different question. See `linkedGoalIds` for the full argument.
     */
    private attachable = new Computed(() => {
        const planId = this.planId();
        const mine = this.goals.items.get();
        return attachableGoals(mine, linkedGoalIds(mine, planId));
    });

    private goalOptions = new Computed<SelectOption[]>(() =>
        this.attachable.get().map((goal) => ({ value: goal.id, label: goal.title })));

    private grouped = new Computed(() =>
        groupLinkedLessons(this.detail.get()?.lessons ?? [], this.nowIso.get()));
    private upcoming = new Computed(() => this.grouped.get().upcoming);
    private past = new Computed(() => this.grouped.get().past);
    private sessions = new Computed(() => sortLinkedSessions(this.detail.get()?.trainingSessions ?? []));
    private linkedGoals = new Computed<LinkedGoalRef[]>(() => this.detail.get()?.goals ?? []);

    onMount(): void {
        void this.load();
    }

    private planId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private async load(): Promise<void> {
        const id = this.planId();
        if (!id) {
            this.resolved.set(true);
            return;
        }
        const result = await this.plans.loadDetail(id);
        this.detail.set(result);
        if (result) this.seedForm(result);
        this.resolved.set(true);

        const me = this.auth.currentUser.get();
        if (!result || !me || result.studentId !== me.id) return;
        // Owner-only reads. A connected Teacher has neither a Goal picker nor a
        // Primary Teacher field, so fetching either for them would be a request
        // made to populate a control that is never rendered.
        void this.goals.load();
        void this.teachers.load();
    }

    /** Fill the edit form from the server's copy. Never the other way round. */
    private seedForm(plan: PlanDetail): void {
        this.titleVal.set(plan.title);
        this.descVal.set(plan.description ?? '');
        this.startVal.set(plan.startDate ?? '');
        this.endVal.set(plan.endDate ?? '');
        this.primaryVal.set(plan.primaryTeacherId ?? '');
        this.titleTouched.set(false);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: this.router.link('/planer').onclick,
                textContent: () => t('plan.back'),
            },
            loading: {
                textContent: () => t('plan.loading'),
                className: () => this.resolved.get()
                    ? 'plan-detail__loading hidden' : 'plan-detail__loading',
            },
            body: {
                className: () => this.detail.get() ? 'plan-detail__body' : 'plan-detail__body hidden',
            },

            // Description — read-only prose for a Teacher; the owner edits it in
            // the form below, so the two are mutually exclusive.
            readSection: {
                className: () => this.controls.get().editDetails
                    ? 'plan-detail__section hidden' : 'plan-detail__section',
            },
            descHeading: { textContent: () => t('plan.section.description') },
            descRead: {
                textContent: () => this.detail.get()?.description ?? '',
                className: () => this.detail.get()?.description
                    ? 'plan-detail__prose' : 'plan-detail__prose hidden',
            },
            descEmpty: {
                textContent: () => t('plan.description.empty'),
                className: () => this.detail.get()?.description
                    ? 'plan-detail__muted hidden' : 'plan-detail__muted',
            },

            editSection: {
                className: () => this.controls.get().editDetails
                    ? 'plan-detail__section' : 'plan-detail__section hidden',
            },
            editHeading: { textContent: () => t('plan.section.details') },
            titleLabel: { textContent: () => t('plan.field.title') },
            titleInput: {
                value: () => this.titleVal.get(),
                'aria-invalid': () => String(
                    this.titleTouched.get() && this.titleVal.get().trim() === ''),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            titleError: {
                textContent: () => this.titleTouched.get() && this.titleVal.get().trim() === ''
                    ? t('plan.error.title') : '',
            },
            descLabel: { textContent: () => t('plan.field.description') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            startLabel: { textContent: () => t('plan.field.start') },
            startInput: {
                value: () => this.startVal.get(),
                oninput: (e: Event) => this.startVal.set((e.target as HTMLInputElement).value),
            },
            endLabel: { textContent: () => t('plan.field.end') },
            endInput: {
                value: () => this.endVal.get(),
                'aria-invalid': () => String(this.rangeInvalid.get()),
                oninput: (e: Event) => this.endVal.set((e.target as HTMLInputElement).value),
            },
            // IA §3.11: the invalid range is a FIELD-level error, under the
            // field that can fix it, naming the date it has to clear.
            endError: {
                textContent: () => this.rangeInvalid.get()
                    ? t('plan.error.range', { start: this.startVal.get() }) : '',
            },
            teacherField: {
                className: () => this.teachers.items.get().length === 0
                    ? 'plan-detail__field hidden' : 'plan-detail__field',
            },
            teacherLabel: { textContent: () => t('plan.field.primaryTeacher') },
            teacherHint: { textContent: () => t('plan.primaryTeacher.hint') },
            save: {
                textContent: () => t('plan.save'),
                disabled: () => this.plans.loading.get() || this.rangeInvalid.get(),
            },
            saveError: {
                textContent: () => this.plans.error.get() ? t('plan.saveError') : '',
            },
            editForm: { onsubmit: (e: Event) => void this.save(e) },

            goalsHeading: { textContent: () => t('plan.section.goals') },
            // Two different sentences for two different readers — an empty list
            // means "no goals" to the owner and "none shared with you" to a
            // Teacher. Never a count: that would leak what the filter hid.
            goalsEmpty: {
                textContent: () => t(goalsEmptyKey(this.viewer.get())),
                className: () => this.linkedGoals.get().length === 0
                    ? 'plan-detail__muted' : 'plan-detail__muted hidden',
            },
            goalsAttach: {
                className: () => this.controls.get().attachGoals && this.attachable.get().length > 0
                    ? 'plan-detail__row' : 'plan-detail__row hidden',
            },
            attachGoal: {
                textContent: () => t('plan.goals.attach'),
                disabled: () => this.goalVal.get() === '' || this.goals.loading.get(),
                onclick: () => void this.attachGoal(),
            },
            // Says why the picker is absent, rather than leaving a gap. Only
            // when the owner could otherwise have used it.
            goalsNone: {
                textContent: () => t('plan.goals.none'),
                className: () => this.controls.get().attachGoals && this.attachable.get().length === 0
                    ? 'plan-detail__hint' : 'plan-detail__hint hidden',
            },

            lessonsHeading: { textContent: () => t('plan.section.lessons') },
            upcomingGroup: {
                className: () => this.upcoming.get().length === 0
                    ? 'plan-detail__group hidden' : 'plan-detail__group',
            },
            upcomingLabel: { textContent: () => t('plan.group.upcoming') },
            pastGroup: {
                className: () => this.past.get().length === 0
                    ? 'plan-detail__group hidden' : 'plan-detail__group',
            },
            pastLabel: { textContent: () => t('plan.group.past') },
            lessonsEmpty: {
                textContent: () => t('plan.lessons.empty'),
                className: () => (this.detail.get()?.lessons.length ?? 0) === 0
                    ? 'plan-detail__muted' : 'plan-detail__muted hidden',
            },

            sessionsHeading: { textContent: () => t('plan.section.trainingSessions') },
            sessionsEmpty: {
                textContent: () => t('plan.trainingSessions.empty'),
                className: () => this.sessions.get().length === 0
                    ? 'plan-detail__muted' : 'plan-detail__muted hidden',
            },

            // IA §3.12 puts the archived explanation LAST, after the linked
            // content. The header's dashed pill already announces the state at
            // the top; this is the paragraph that says what the state costs, and
            // it belongs where the reader arrives after seeing what is inside.
            archivedSection: {
                className: () => this.detail.get()?.status === 'archived'
                    ? 'plan-detail__archived' : 'plan-detail__archived hidden',
            },
            archivedNotice: { textContent: () => t('plan.archived.notice') },

            // The dialog is spawned unconditionally — ownership is not known at
            // render time — so the HOST is what withholds it. Without this the
            // confirm's copy ("Arkivera planen?") sits in a connected Teacher's
            // DOM and is read out by assistive technology, which is the same
            // leak as a disabled button: advertising an action they do not have.
            confirmArchiveHost: {
                className: () => this.controls.get().archive
                    ? 'plan-detail__dialog' : 'plan-detail__dialog hidden',
            },
        });

        this.buildNotFound(this.ref(frag, 'notFoundHost'));
        this.buildHeader(this.ref(frag, 'headerHost'));

        this.spawn(SelectComponent, this.ref(frag, 'teacherHost'), {
            value: this.primaryVal,
            options: this.teacherOptions,
        });
        this.spawn(SelectComponent, this.ref(frag, 'goalHost'), {
            value: this.goalVal,
            options: this.goalOptions,
            placeholder: t('plan.goals.placeholder'),
        });
        // Drop a selection that stopped being offerable (it just got attached).
        this.track(effect(() => {
            const options = this.goalOptions.get();
            const current = this.goalVal.get();
            if (current && !options.some((o) => o.value === current)) this.goalVal.set('');
        }));

        this.buildGoals(this.ref(frag, 'goalsList'));
        this.$each(this.ref(frag, 'upcomingList'), this.upcoming,
            (lesson) => this.renderLesson(lesson), (lesson) => lesson.id);
        this.$each(this.ref(frag, 'pastList'), this.past,
            (lesson) => this.renderLesson(lesson), (lesson) => lesson.id);
        this.$each(this.ref(frag, 'sessionsList'), this.sessions,
            (session) => this.renderSession(session), (session) => session.id);

        // §4.12: a dialog before a change that cannot be taken back, stating the
        // consequence rather than asking "Är du säker?". Archive has no inverse
        // in the API — there is no unarchive endpoint — so an undo toast would
        // be a promise this view could not keep.
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmArchiveHost'), {
            open: this.confirmArchive,
            title: t('plan.confirm.archive.title'),
            message: () => t('plan.confirm.archive.message'),
            confirmLabel: t('plan.action.archive'),
            cancelLabel: t('plan.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.archive(),
        });

        return frag;
    }

    // ─── Header ─────────────────────────────────────────────────

    private buildHeader(host: HTMLElement): void {
        this.spawn(DetailHeaderComponent, host, {
            eyebrow: () => t('objectKind.plan'),
            title: () => this.detail.get()?.title ?? '',
            status: () => {
                const plan = this.detail.get();
                if (!plan) return null;
                const pill = planStatusPill(plan.status);
                return {
                    label: pill.label,
                    variant: pill.variant,
                    tone: pill.tone,
                    ...(pill.glyph === undefined ? {} : { glyph: pill.glyph }),
                };
            },
            // A Plan is the top of the walkable hierarchy — it has no parent to
            // chip up to, and §4.10 forbids a chip that is not a path upward.
            chips: () => [],
            meta: () => {
                const plan = this.detail.get();
                if (!plan) return '';
                return [
                    dateRangeLabel(plan.startDate, plan.endDate),
                    primaryTeacherLabel(plan.primaryTeacherDisplayName),
                ].filter(Boolean).join(' · ');
            },
            // Archiving is destructive-ish and lives in the ⋯ overflow at every
            // width; there is no primary action worth promoting above it. The
            // control is ABSENT for a connected Teacher, not disabled.
            overflowActions: () => this.controls.get().archive
                ? [{ label: t('plan.action.archive'), onclick: () => this.confirmArchive.set(true) }]
                : [],
        });
    }

    /**
     * Missing, archived-away and not-mine all render the same empty state with
     * the same single exit (§4.14). The server answers 404 for all three, which
     * is what keeps it leak-safe: a Teacher with no Relation cannot tell a
     * private Plan from a nonexistent one.
     */
    private buildNotFound(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.resolved.get() && !this.detail.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('plan.notFound.heading'),
                    body: () => t('plan.notFound.body'),
                    action: {
                        label: () => t('plan.notFound.action'),
                        onclick: () => this.router.navigate('/planer'),
                    },
                    headingLevel: 1,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    // ─── Mål ────────────────────────────────────────────────────

    /**
     * Every row here is navigable, and that is safe *because* the server
     * filtered the list. There is no client-side visibility check to forget:
     * what arrives is what this reader may open.
     */
    private buildGoals(host: HTMLElement): void {
        const pills: StatusPillComponent[] = [];
        this.track(() => {
            for (const pill of pills) pill.destroy();
            pills.length = 0;
        });

        this.track(effect(() => {
            const goals = this.linkedGoals.get();
            const controls = this.controls.get();
            for (const pill of pills) pill.destroy();
            pills.length = 0;
            host.replaceChildren();

            for (const goal of goals) {
                const li = document.createElement('li');
                const item = document.createElement('div');
                item.className = 'plan-detail__item plan-detail__item--flat';

                const href = `/mal/${goal.id}`;
                const link = document.createElement('a');
                link.className = 'plan-detail__link';
                link.href = href;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.router.navigate(href);
                });

                const body = document.createElement('span');
                body.className = 'plan-detail__item-body';
                const title = document.createElement('span');
                title.className = 'plan-detail__item-title';
                title.textContent = goal.title;
                body.appendChild(title);
                // §3.12 asks for the Goal's status AND its target date.
                const target = targetDateLabel(goal.targetDate);
                if (target) {
                    const meta = document.createElement('span');
                    meta.className = 'plan-detail__item-meta';
                    meta.textContent = target;
                    body.appendChild(meta);
                }
                link.appendChild(body);
                item.appendChild(link);

                const trail = document.createElement('span');
                trail.className = 'plan-detail__item-trail';
                const descriptor = goalStatusPill(goal.status);
                const pillHost = document.createElement('span');
                trail.appendChild(pillHost);
                // Built outside the tracking scope, as spawn() does — mounting
                // runs the child's render, whose reads would otherwise subscribe
                // THIS effect and rebuild the list on unrelated changes.
                const pill = untrack(() => {
                    const p = new StatusPillComponent({
                        label: descriptor.label,
                        variant: descriptor.variant,
                        tone: descriptor.tone,
                        ...(descriptor.glyph === undefined ? {} : { glyph: descriptor.glyph }),
                    });
                    p.mount(pillHost);
                    return p;
                });
                pills.push(pill);

                // Detach survives archiving: a Plan filed away must not trap the
                // Goals inside it (`detachFromPlan` checks Goal ownership only).
                if (controls.detachGoals) {
                    const detach = document.createElement('button');
                    detach.type = 'button';
                    detach.className = 'plan-detail__detach';
                    detach.textContent = t('plan.goals.detach');
                    detach.addEventListener('click', () => void this.detachGoal(goal));
                    trail.appendChild(detach);
                }

                item.appendChild(trail);
                li.appendChild(item);
                host.appendChild(li);
            }
        }));
    }

    // ─── Linked occasions ───────────────────────────────────────

    private renderLesson(lesson: LinkedLessonRef): HTMLElement {
        return this.occasionRow(
            `/lektioner/${lesson.id}`,
            lesson.scheduledAt,
            occasionWhen(lesson.scheduledAt),
            lessonMeta(lesson),
        );
    }

    private renderSession(session: LinkedTrainingSessionRef): HTMLElement {
        return this.occasionRow(
            `/traningspass/${session.id}`,
            session.performedAt,
            occasionWhen(session.performedAt),
            sessionMeta(session),
        );
    }

    /**
     * One row shape for both occasion kinds — they are siblings in the domain
     * ("Occasions are symmetric"), so they read the same way here. Navigation
     * only: §3.12 defers detaching to a product decision, so no row carries a
     * control.
     */
    private occasionRow(href: string, iso: string, title: string, meta: string | null): HTMLElement {
        const li = document.createElement('li');
        const item = document.createElement('div');
        item.className = 'plan-detail__item';

        const link = document.createElement('a');
        link.className = 'plan-detail__link';
        link.href = href;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const block = dateBlock(iso);
        const date = document.createElement('span');
        date.className = 'plan-detail__date';
        for (const [cls, text] of [['day', block.day], ['month', block.month], ['time', block.time]] as const) {
            const part = document.createElement('span');
            part.className = `plan-detail__${cls}`;
            part.textContent = text;
            date.appendChild(part);
        }
        link.appendChild(date);

        const body = document.createElement('span');
        body.className = 'plan-detail__item-body';
        const titleEl = document.createElement('span');
        titleEl.className = 'plan-detail__item-title';
        titleEl.textContent = title;
        body.appendChild(titleEl);
        if (meta) {
            const metaEl = document.createElement('span');
            metaEl.className = 'plan-detail__item-meta';
            metaEl.textContent = meta;
            body.appendChild(metaEl);
        }
        link.appendChild(body);

        const trail = document.createElement('span');
        trail.className = 'plan-detail__item-trail';
        link.appendChild(trail);

        item.appendChild(link);
        li.appendChild(item);
        return li;
    }

    // ─── Writes ─────────────────────────────────────────────────

    private async save(e: Event): Promise<void> {
        e.preventDefault();
        const title = this.titleVal.get().trim();
        this.titleTouched.set(true);
        if (!title) return;
        if (this.rangeInvalid.get()) return;

        const updated = await this.plans.update(this.planId(), {
            title,
            description: this.descVal.get().trim() || null,
            startDate: this.startVal.get() || null,
            endDate: this.endVal.get() || null,
            primaryTeacherId: this.primaryVal.get() || null,
        });
        if (!updated) return;
        this.toasts.show({ message: t('plan.saved'), variant: 'success' });
        await this.load();
    }

    /**
     * Attach and detach are each ONE call (`POST` / `DELETE
     * /goals/:id/plans/:planId`), so the toast reports an outcome that actually
     * happened — there is no follow-up write that could fail behind it.
     *
     * Neither gets a confirm or an undo: the pair is a true round trip, one
     * click apart in the same picker, and §4.12 rules out a dialog "för sådant
     * som kan ångras".
     */
    private async attachGoal(): Promise<void> {
        const goalId = this.goalVal.get();
        const goal = this.attachable.get().find((g) => g.id === goalId);
        if (!goal) return;
        const ok = await this.goals.attachPlan(goalId, this.planId());
        if (!ok) return;
        this.goalVal.set('');
        this.toasts.show({ message: t('plan.toast.goalAttached', { title: goal.title }) });
        await this.load();
    }

    private async detachGoal(goal: LinkedGoalRef): Promise<void> {
        const ok = await this.goals.detachPlan(goal.id, this.planId());
        if (!ok) return;
        this.toasts.show({ message: t('plan.toast.goalDetached', { title: goal.title }) });
        await this.load();
    }

    private async archive(): Promise<void> {
        const ok = await this.plans.archive(this.planId());
        if (!ok) return;
        this.toasts.show({ message: t('plan.toast.archived') });
        await this.load();
    }
}
