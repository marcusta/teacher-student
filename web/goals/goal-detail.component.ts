import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { formatIsoDate, t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { DetailHeaderComponent, type DetailHeaderChip } from '../ui/detail-header.component';
import { mountThread } from '../ui/note-thread.component';
import type { ShareRecipient } from '../ui/share-chip.component';
import type { PersonRole } from '../ui/person-marker.component';
import { GoalsService } from './goals.service';
import { PlansService } from '../plans/plans.service';
import { StableService } from '../stable/stable.service';
import { TeachersService } from '../training-sessions/teachers.service';
import {
    achievedLabel,
    attachablePlans,
    calendarDate,
    horseChoices,
    goalControls,
    goalStatusPill,
    goalTransitions,
    isConflict,
    isOverdue,
    shouldCommitPlanLink,
    shouldCommitShare,
    targetDateLabel,
    type GoalViewer,
} from './goal-copy';
import { api, type GoalTeacherView, type SharedTeacherRef } from '../api';

const tpl = template(`
    <div class="goal-detail" bind="root">
        <a bind="back" href="/mal" class="goal-detail__back"></a>
        <p bind="loading" class="goal-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="goal-detail__body">
            <div bind="headerHost"></div>

            <div bind="conflict" class="goal-detail__conflict" role="alert">
                <p bind="conflictText" class="goal-detail__conflict-text"></p>
                <button bind="conflictRetry" type="button" class="goal-detail__secondary"></button>
            </div>

            <p bind="abandonedNotice" class="goal-detail__notice"></p>

            <section bind="readSection" class="goal-detail__section">
                <h2 bind="descHeading" class="goal-detail__heading"></h2>
                <p bind="descRead" class="goal-detail__prose"></p>
                <p bind="descEmpty" class="goal-detail__muted"></p>
            </section>

            <section bind="editSection" class="goal-detail__section">
                <h2 bind="editHeading" class="goal-detail__heading"></h2>
                <form bind="editForm" class="goal-detail__form">
                    <label class="goal-detail__field">
                        <span bind="titleLabel" class="goal-detail__label"></span>
                        <input bind="titleInput" type="text" maxlength="200" class="goal-detail__input" required>
                        <span bind="titleError" class="goal-detail__field-error" role="alert"></span>
                    </label>
                    <label class="goal-detail__field">
                        <span bind="descLabel" class="goal-detail__label"></span>
                        <textarea bind="descInput" rows="4" maxlength="5000" class="goal-detail__textarea"></textarea>
                    </label>
                    <label class="goal-detail__field">
                        <span bind="targetLabel" class="goal-detail__label"></span>
                        <input bind="targetInput" type="date" class="goal-detail__input">
                        <span bind="targetError" class="goal-detail__field-error" role="alert"></span>
                    </label>
                    <label bind="horseField" class="goal-detail__field">
                        <span bind="horseLabel" class="goal-detail__label"></span>
                        <div bind="horseHost" class="goal-detail__control"></div>
                    </label>
                    <div class="goal-detail__row">
                        <button bind="save" type="submit" class="goal-detail__save"></button>
                        <span bind="saveError" class="goal-detail__field-error" role="alert"></span>
                    </div>
                </form>
            </section>

            <section bind="plansSection" class="goal-detail__section">
                <h2 bind="plansHeading" class="goal-detail__heading"></h2>
                <ul bind="plansList" class="goal-detail__list"></ul>
                <p bind="plansEmpty" class="goal-detail__muted"></p>
                <div bind="planAttach" class="goal-detail__row">
                    <div bind="planHost" class="goal-detail__control goal-detail__control--grow"></div>
                    <button bind="attachPlan" type="button" class="goal-detail__secondary"></button>
                </div>
                <p bind="plansNone" class="goal-detail__hint"></p>
            </section>

            <section bind="sharingSection" class="goal-detail__section">
                <h2 bind="sharingHeading" class="goal-detail__heading"></h2>
                <p bind="sharingHint" class="goal-detail__hint"></p>
                <p bind="sharingLoading" class="goal-detail__muted"></p>
                <ul bind="sharingList" class="goal-detail__checks"></ul>
                <p bind="sharingNone" class="goal-detail__muted"></p>
            </section>

            <section class="goal-detail__section">
                <div bind="notesHost"></div>
            </section>
        </div>

        <div bind="confirmAbandonHost" class="goal-detail__dialog"></div>
    </div>
`);

/**
 * Mål — IA §3.14. The full state and conversation for one Goal, in the
 * information order the IA fixes: header (title, status, target date, achieved
 * timestamp), description, **Tillhör planer**, **Delat med**, then the Note
 * thread.
 *
 * **The two roles differ in what EXISTS, not in what is enabled.** §3.14 gives
 * a shared Teacher four things — read the Goal, mark it Achieved, Reopen it,
 * write notes — and nothing else. Metadata editing, sharing management, plan
 * membership and Abandon are absent from their DOM, because the server refuses
 * all four (`assertGoalOwner` → NotFoundError) and a disabled control would
 * advertise a capability the API does not have.
 *
 * **A shared Teacher never learns who else is watching.** That is a privacy
 * rule rather than a permission, and it is enforced by the shape of the data:
 * `GET /goals/:id` answers a Teacher with `GoalTeacherView`, which has no
 * `sharedTeacherIds` field at all, and `GET /goals/:id/shares` is owner-only.
 * So the Delat med section is not read-only for a Teacher — it does not render,
 * and there is no request this view could make that would fill it.
 *
 * **Abandoned cannot go straight to Achieved.** `goalTransitions` withholds the
 * Achieve control on an abandoned Goal and offers Reopen instead; the notice
 * above says why in words, so the missing button is explained rather than
 * merely missing. `GoalService.markAchieved` answers 409 on that path, and a
 * 409 reaching this view therefore means the view is stale — which is what the
 * conflict banner offers to fix.
 *
 * **Nothing writes from an effect.** Every mutation here is behind an explicit
 * press, and the two toggles that could look like auto-committing controls —
 * sharing and plan membership — go through `shouldCommitShare` /
 * `shouldCommitPlanLink`, which refuse to write until the server's own value
 * has been seeded. That is the guard the Träningspass slice was missing when
 * merely opening a session PATCHed its sharing away.
 */
export class GoalDetailComponent extends Component {
    static styles = `
        .goal-detail {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            font-family: ${token('font-ui')};

            & .goal-detail__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .goal-detail__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .goal-detail__loading.hidden { display: none; }

            & .goal-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xl')};
            }
            & .goal-detail__body.hidden { display: none; }

            & .goal-detail__conflict {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                border: 1px solid ${token('warning')};
                border-radius: ${token('radius-md')};
                background: ${token('warning-soft')};

                & .goal-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    color: ${token('text')};
                    max-width: 68ch;
                }
            }
            & .goal-detail__conflict.hidden { display: none; }

            /* The state explanation carries the brass rule — the brand's own
               voice explaining a rule, not a warning. */
            & .goal-detail__notice {
                margin: 0;
                padding: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                background: ${token('surface-2')};
                max-width: 68ch;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text')};
            }
            & .goal-detail__notice.hidden { display: none; }

            & .goal-detail__section {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
            }
            & .goal-detail__section.hidden { display: none; }

            /* A section heading is one of the places the serif is allowed —
               Lora, weight 500, and only 500 (UI_DECISIONS §3). */
            & .goal-detail__heading {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${token('text')};
            }

            & .goal-detail__prose {
                margin: 0;
                max-width: 68ch;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${token('text')};
                white-space: pre-wrap;
            }
            & .goal-detail__prose.hidden { display: none; }

            & .goal-detail__muted {
                margin: 0;
                font-size: 0.875rem;
                color: ${token('text-muted')};
            }
            & .goal-detail__muted.hidden { display: none; }

            & .goal-detail__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .goal-detail__hint.hidden { display: none; }

            & .goal-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                border-top: 1px solid ${token('border')};
            }
            & .goal-detail__list:empty { border-top: none; }
            & .goal-detail__list.hidden { display: none; }
            & .goal-detail__list > li { border-bottom: 1px solid ${token('border')}; }

            & .goal-detail__item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('sm')};
                flex-wrap: wrap;
                &:hover { background: ${token('surface-2')}; }
                &:focus-within { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }
            & .goal-detail__item-link {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                text-decoration: none;
                overflow-wrap: anywhere;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
            }

            & .goal-detail__detach {
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

            /* The trust surface gets a visible boundary — it is a decision, not
               just another list (§4.5). */
            & .goal-detail__checks {
                list-style: none;
                margin: 0;
                padding: ${s('md')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }
            & .goal-detail__checks.hidden { display: none; }
            & .goal-detail__check {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                font-size: 0.875rem;
                color: ${token('text')};
                cursor: pointer;
            }
            & .goal-detail__check input { accent-color: ${token('accent')}; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them. The panel is what the
             * recessed fill is recessed INTO.
             */
            & .goal-detail__form {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                max-width: 34rem;
            }
            & .goal-detail__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .goal-detail__field.hidden { display: none; }
            & .goal-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .goal-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .goal-detail__field-error:empty { display: none; }
            & .goal-detail__input, & .goal-detail__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .goal-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }
            & .goal-detail__control .ui-select { display: block; }
            & .goal-detail__control--grow { flex: 1; min-width: 12rem; }

            & .goal-detail__row {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            & .goal-detail__row.hidden { display: none; }
            /*
             * This select sits in a section drawn on the page, not inside the
             * form panel, so it keeps a raised --surface fill. The recessed
             * --bg fill is only legible against a card.
             */
            & .goal-detail__row .ui-select__trigger { background: ${token('surface')}; }

            /* §4.8: one primary per view. This is it. */
            & .goal-detail__save { ${btn(token('radius-sm'), 'primary')} }
            & .goal-detail__secondary { ${btn()} }

            /* Hides the closed dialog from the DOM entirely for a reader who
               has no such action — see the binding for why. */
            & .goal-detail__dialog.hidden { display: none; }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private goals = this.inject(GoalsService);
    private plans = this.inject(PlansService);
    private stable = this.inject(StableService);
    private teachers = this.inject(TeachersService);
    private toasts = this.inject(ToastService);

    private goal = new Signal<GoalTeacherView | null>(null);
    private resolved = new Signal(false);
    private confirmAbandon = new Signal(false);

    /** The server's own answer for who this Goal is shared with. Owner only. */
    private shares = new Signal<SharedTeacherRef[]>([]);
    /**
     * Whether `shares` reflects a completed lookup.
     *
     * Load-bearing twice over. It gates the sharing checkboxes' writes
     * (`shouldCommitShare`), so an un-seeded empty list can never be read as
     * "the user just unshared everyone" — the exact failure the Träningspass
     * slice shipped. And it gates the Note thread, because the composer names
     * its audience: mounting before the answer lands would tell the author they
     * have nobody to share with, briefly, on every load.
     */
    private sharesSeeded = new Signal(false);

    /** Who a shared note reaches. Owner: the Teachers. Teacher: the Student. */
    private noteRecipients = new Signal<ShareRecipient[]>([]);
    private recipientsResolved = new Signal(false);

    /** Plan titles a shared Teacher may see, resolved one by one. */
    private teacherPlanTitles = new Signal<Map<string, string>>(new Map());
    private planTitlesResolved = new Signal(false);

    private titleVal = new Signal('');
    private descVal = new Signal('');
    private targetVal = new Signal('');
    private titleTouched = new Signal(false);
    private planVal = new Signal('');
    private horseVal = new Signal('');

    private today = new Signal(formatIsoDate(new Date()));

    private viewer = new Computed<GoalViewer>(() => {
        const goal = this.goal.get();
        const me = this.auth.currentUser.get();
        return goal && me && goal.studentId === me.id ? 'owner' : 'sharedTeacher';
    });

    private controls = new Computed(() => goalControls(this.viewer.get()));
    private transitions = new Computed(() =>
        goalTransitions(this.goal.get()?.status ?? 'active', this.viewer.get()));

    private targetInvalid = new Computed(() => {
        const value = this.targetVal.get();
        return value !== '' && calendarDate(value) === null;
    });

    /**
     * The Plans this Goal belongs to, **named**.
     *
     * IA §3.14's delivery note is explicit that "Plan labels returned to shared
     * Teachers are user-meaningful; identifiers alone are not acceptable IA".
     * The Goal carries `planIds` and nothing more, so the two roles resolve
     * titles from different places: the owner already holds their whole Plan
     * list, while a Teacher reads each Plan individually (they are connected to
     * the owner, so `GET /plans/:id` answers them). A Plan whose title does not
     * resolve is **omitted** rather than rendered as a UUID — an unreadable link
     * is worse than a missing one.
     */
    private planLinks = new Computed<{ id: string; title: string }[]>(() => {
        const goal = this.goal.get();
        if (!goal) return [];
        if (this.viewer.get() === 'owner') {
            const all = this.plans.items.get();
            return goal.planIds
                .map((id) => all.find((plan) => plan.id === id))
                .filter((plan): plan is NonNullable<typeof plan> => plan !== undefined)
                .map((plan) => ({ id: plan.id, title: plan.title }));
        }
        const titles = this.teacherPlanTitles.get();
        return goal.planIds
            .map((id) => {
                const title = titles.get(id);
                return title ? { id, title } : null;
            })
            .filter((link): link is { id: string; title: string } => link !== null);
    });

    /**
     * Whether this Goal belongs to no Plan at all.
     *
     * Answered from `goal.planIds` — the authoritative set, carried by the Goal
     * itself — and never from `planLinks`, which is the *resolvable* subset.
     * The two differ whenever a title lookup has not landed or has failed: for
     * the owner when `GET /plans` errored, for a shared Teacher when a
     * `GET /plans/:id` did. Keying the empty state off `planLinks` would turn
     * either of those into the confident false claim "Målet hör inte till
     * någon plan" about a Goal that in fact sits in four of them.
     *
     * So the section shows the names it has, says "no plans" only when there
     * genuinely are none, and otherwise says nothing — the honest third state.
     */
    private belongsToNoPlan = new Computed(() => {
        const goal = this.goal.get();
        return goal !== null && goal.planIds.length === 0;
    });

    /**
     * Whether the owner's Plan list has actually come back from the server.
     *
     * This is the `seeded` input to `shouldCommitPlanLink`, so it must mean
     * "the server answered", not "it looks answered". The previous derivation
     * (`items.length > 0 || !loading`) reads as seeded during the window before
     * `plans.load()` flips `loading`, and permanently after a failed load —
     * exactly the shape of the Träningspass bug the guard exists to prevent.
     * `sharesSeeded` is an explicit flag for the same reason; this now matches.
     */
    private ownerPlansResolved = new Signal(false);

    private planLinksResolved = new Computed(() =>
        this.viewer.get() === 'owner'
            ? this.ownerPlansResolved.get()
            : this.planTitlesResolved.get());

    private attachable = new Computed(() =>
        attachablePlans(this.plans.items.get(), this.goal.get()?.planIds ?? []));

    private planOptions = new Computed<SelectOption[]>(() =>
        this.attachable.get().map((plan) => ({ value: plan.id, label: plan.title })));

    /**
     * The stable, plus this Goal's own horse even when it has since been
     * archived — see `horseChoices`. Owner-only: `stable.load()` is never
     * called for a shared Teacher, so this is empty for them and the field
     * they never get is hidden anyway.
     */
    private horseOptions = new Computed<SelectOption[]>(() => {
        const goal = this.goal.get();
        const choices = horseChoices(this.stable.items.get(), {
            horseId: goal?.horseId ?? null,
            horseName: goal?.horseName ?? null,
        });
        return [
            { value: '', label: t('goal.horse.none') },
            ...choices.map((h) => ({ value: h.id, label: h.name })),
        ];
    });

    onMount(): void {
        void this.load();
    }

    private goalId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private async load(): Promise<void> {
        const id = this.goalId();
        if (!id) {
            this.resolved.set(true);
            return;
        }
        const detail = await this.goals.loadDetail(id);
        this.goal.set(detail);
        if (detail) this.seedForm(detail);
        this.resolved.set(true);

        const me = this.auth.currentUser.get();
        if (!detail || !me) return;

        if (detail.studentId === me.id) {
            // Resolves the gate whether the load succeeds or fails: after a
            // failure the list is known to be unavailable, which is a settled
            // answer too. `planLinks` stays empty either way, and
            // `belongsToNoPlan` is what decides whether that means "none".
            void this.plans.load().finally(() => this.ownerPlansResolved.set(true));
            void this.teachers.load();
            void this.stable.load();
            await this.loadShares(detail.id);
        } else {
            await Promise.all([
                this.loadStudent(detail.studentId),
                this.loadTeacherPlanTitles(detail.planIds),
            ]);
        }
    }

    private seedForm(goal: GoalTeacherView): void {
        this.titleVal.set(goal.title);
        this.descVal.set(goal.description ?? '');
        this.targetVal.set(goal.targetDate ?? '');
        this.horseVal.set(goal.horseId ?? '');
        this.titleTouched.set(false);
    }

    /** Owner-only: `GET /goals/:id/shares` asserts ownership. */
    private async loadShares(goalId: string): Promise<void> {
        const result = await api.goals.listShares({ id: goalId }).catch(() => null);
        this.shares.set(result ?? []);
        this.noteRecipients.set((result ?? []).map((share) => ({
            id: share.teacherId,
            name: share.displayName,
        })));
        // A FAILED lookup resolves both gates too: at that point the audience is
        // unknown and will stay unknown, and holding the thread forever would be
        // worse than saying so.
        this.sharesSeeded.set(true);
        this.recipientsResolved.set(true);
    }

    /** A shared Teacher's counterparty is the Student who owns the Goal. */
    private async loadStudent(studentId: string): Promise<void> {
        const student = await api.students.get({ id: studentId }).catch(() => null);
        this.noteRecipients.set(student ? [{ id: student.id, name: student.displayName }] : []);
        this.recipientsResolved.set(true);
    }

    private async loadTeacherPlanTitles(planIds: string[]): Promise<void> {
        const results = await Promise.allSettled(
            planIds.map((id) => api.plans.get({ id })),
        );
        const titles = new Map<string, string>();
        for (const result of results) {
            if (result.status === 'fulfilled') titles.set(result.value.id, result.value.title);
        }
        this.teacherPlanTitles.set(titles);
        this.planTitlesResolved.set(true);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate(this.backHref());
                },
                href: () => this.backHref(),
                textContent: () => t('goal.back'),
            },
            loading: {
                textContent: () => t('goal.loading'),
                className: () => this.resolved.get()
                    ? 'goal-detail__loading hidden' : 'goal-detail__loading',
            },
            body: {
                className: () => this.goal.get() ? 'goal-detail__body' : 'goal-detail__body hidden',
            },

            // Detected by code, never by matching a message string (IA §4).
            conflict: {
                className: () => isConflict(this.goals.error.get())
                    ? 'goal-detail__conflict' : 'goal-detail__conflict hidden',
            },
            conflictText: { textContent: () => t('goal.conflict.message') },
            conflictRetry: {
                textContent: () => t('goal.conflict.action'),
                onclick: () => void this.load(),
            },

            // The missing Achieve control, explained. §3.14's rule is a product
            // rule, so it is stated rather than left as an absence to infer.
            abandonedNotice: {
                textContent: () => t('goal.abandoned.notice'),
                className: () => this.goal.get()?.status === 'abandoned'
                    ? 'goal-detail__notice' : 'goal-detail__notice hidden',
            },

            readSection: {
                className: () => this.controls.get().editDetails
                    ? 'goal-detail__section hidden' : 'goal-detail__section',
            },
            descHeading: { textContent: () => t('goal.section.description') },
            descRead: {
                textContent: () => this.goal.get()?.description ?? '',
                className: () => this.goal.get()?.description
                    ? 'goal-detail__prose' : 'goal-detail__prose hidden',
            },
            descEmpty: {
                textContent: () => t('goal.description.empty'),
                className: () => this.goal.get()?.description
                    ? 'goal-detail__muted hidden' : 'goal-detail__muted',
            },

            editSection: {
                className: () => this.controls.get().editDetails
                    ? 'goal-detail__section' : 'goal-detail__section hidden',
            },
            editHeading: { textContent: () => t('goal.section.details') },
            titleLabel: { textContent: () => t('goal.field.title') },
            titleInput: {
                value: () => this.titleVal.get(),
                'aria-invalid': () => String(
                    this.titleTouched.get() && this.titleVal.get().trim() === ''),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            titleError: {
                textContent: () => this.titleTouched.get() && this.titleVal.get().trim() === ''
                    ? t('goal.error.title') : '',
            },
            descLabel: { textContent: () => t('goal.field.description') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            targetLabel: { textContent: () => t('goal.field.target') },
            targetInput: {
                value: () => this.targetVal.get(),
                'aria-invalid': () => String(this.targetInvalid.get()),
                oninput: (e: Event) => this.targetVal.set((e.target as HTMLInputElement).value),
            },
            targetError: {
                textContent: () => this.targetInvalid.get() ? t('goal.error.target') : '',
            },
            // Only "Ingen häst" to offer means an empty stable, and an empty
            // stable is not a question worth asking (§3.9 States).
            horseField: {
                className: () => this.horseOptions.get().length <= 1
                    ? 'goal-detail__field hidden' : 'goal-detail__field',
            },
            horseLabel: { textContent: () => t('goal.field.horse') },
            save: {
                textContent: () => t('goal.save'),
                disabled: () => this.goals.loading.get() || this.targetInvalid.get(),
            },
            saveError: {
                textContent: () => this.goals.error.get() && !isConflict(this.goals.error.get())
                    ? t('goal.saveError') : '',
            },
            editForm: { onsubmit: (e: Event) => void this.save(e) },

            // §3.14 item 3. Rendered for BOTH roles — a shared Teacher may see
            // which Plans the Goal belongs to, by name, to the degree the Goal
            // contract allows (see `planLinks`).
            plansSection: { className: () => 'goal-detail__section' },
            plansHeading: { textContent: () => t('goal.section.plans') },
            plansEmpty: {
                textContent: () => t('goal.plans.empty'),
                className: () => this.belongsToNoPlan.get()
                    ? 'goal-detail__muted' : 'goal-detail__muted hidden',
            },
            planAttach: {
                className: () => this.controls.get().managePlans && this.attachable.get().length > 0
                    ? 'goal-detail__row' : 'goal-detail__row hidden',
            },
            attachPlan: {
                textContent: () => t('goal.plans.attach'),
                disabled: () => this.planVal.get() === '' || this.goals.loading.get(),
                onclick: () => void this.attachPlan(),
            },
            plansNone: {
                textContent: () => t('goal.plans.none'),
                className: () => this.controls.get().managePlans && this.attachable.get().length === 0
                    ? 'goal-detail__hint' : 'goal-detail__hint hidden',
            },

            // §3.14 item 4 — owner only. A shared Teacher does not see
            // co-watchers, and this section is where that rule is visible.
            sharingSection: {
                className: () => this.controls.get().seeCoWatchers
                    ? 'goal-detail__section' : 'goal-detail__section hidden',
            },
            sharingHeading: { textContent: () => t('goal.section.sharing') },
            sharingHint: {
                textContent: () => t('goal.sharing.hint'),
                className: () => this.teachers.items.get().length === 0
                    ? 'goal-detail__hint hidden' : 'goal-detail__hint',
            },
            sharingLoading: {
                textContent: () => t('goal.sharing.loading'),
                className: () => this.sharesSeeded.get()
                    ? 'goal-detail__muted hidden' : 'goal-detail__muted',
            },
            sharingList: {
                // Held until the server's answer lands: a list of unchecked
                // boxes would state the wrong audience for a shared Goal.
                className: () => this.sharesSeeded.get() && this.teachers.items.get().length > 0
                    ? 'goal-detail__checks' : 'goal-detail__checks hidden',
            },
            // Sharing is simply absent with no Teachers; ownership is unaffected
            // (§3.13 States, UI_DECISIONS §1).
            sharingNone: {
                textContent: () => t('goal.sharing.none'),
                className: () => this.sharesSeeded.get() && this.teachers.items.get().length === 0
                    ? 'goal-detail__muted' : 'goal-detail__muted hidden',
            },

            // The dialog is spawned unconditionally — the role is not known at
            // render time — so the HOST is what withholds it. Without this the
            // confirm's copy ("Avbryta målet?") sits in a shared Teacher's DOM
            // and is read out by assistive technology, which is the same leak as
            // a disabled button: advertising an action they do not have.
            confirmAbandonHost: {
                className: () => this.transitions.get().abandon
                    ? 'goal-detail__dialog' : 'goal-detail__dialog hidden',
            },
        });

        this.buildNotFound(this.ref(frag, 'notFoundHost'));
        this.buildHeader(this.ref(frag, 'headerHost'));
        this.buildPlanLinks(this.ref(frag, 'plansList'));
        this.buildSharing(this.ref(frag, 'sharingList'));

        this.spawn(SelectComponent, this.ref(frag, 'horseHost'), {
            value: this.horseVal,
            options: this.horseOptions,
        });
        this.spawn(SelectComponent, this.ref(frag, 'planHost'), {
            value: this.planVal,
            options: this.planOptions,
            placeholder: t('goal.plans.placeholder'),
        });
        // Drop a selection that stopped being offerable (it just got attached).
        this.track(effect(() => {
            const options = this.planOptions.get();
            const current = this.planVal.get();
            if (current && !options.some((o) => o.value === current)) this.planVal.set('');
        }));

        // §4.12: a dialog before a change whose inverse is not faithful. Reopen
        // does bring an abandoned Goal back to *active* — but an ACHIEVED Goal
        // that is abandoned cannot be restored to achieved, so the round trip is
        // lossy and an "Ångra" toast would be a promise this view cannot keep.
        // The message states that consequence instead of asking "Är du säker?".
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmAbandonHost'), {
            open: this.confirmAbandon,
            title: t('goal.confirm.abandon.title'),
            message: () => t('goal.confirm.abandon.message'),
            confirmLabel: t('goal.action.abandon'),
            cancelLabel: t('goal.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.abandon(),
        });

        // Notes are the one thing both roles do — withholding them from a shared
        // Teacher would leave sharing a Goal with no observable effect.
        mountThread(this.ref(frag, 'notesHost'), () => {
            const goal = this.goal.get();
            if (!goal || !this.recipientsResolved.get()) return null;
            const studentId = goal.studentId;
            return {
                parentKind: 'goal',
                parentId: goal.id,
                context: () => this.goalContext(),
                recipients: () => this.noteRecipients.get(),
                // Roles are contextual (IA §1): on a Goal the owner is the
                // Student and everyone else in the thread is a shared Teacher.
                roleOf: (note): PersonRole => note.authorId === studentId ? 'student' : 'teacher',
            };
        }, (d) => this.track(d));

        return frag;
    }

    /**
     * Where "back" goes. A Teacher reached this Goal through the owning
     * Student's workspace, not through their own Mål list — sending them to
     * `/mal` would land them on a list this Goal is not in.
     */
    private backHref(): string {
        const goal = this.goal.get();
        return goal && this.viewer.get() === 'sharedTeacher'
            ? `/students/${goal.studentId}`
            : '/mal';
    }

    /** 'Mål · Fungerande galoppombyten' — the §4.7 context row. */
    private goalContext(): string {
        return [t('objectKind.goal'), this.goal.get()?.title ?? ''].filter(Boolean).join(' · ');
    }

    // ─── Header ─────────────────────────────────────────────────

    private buildHeader(host: HTMLElement): void {
        this.spawn(DetailHeaderComponent, host, {
            eyebrow: () => t('objectKind.goal'),
            title: () => this.goal.get()?.title ?? '',
            status: () => {
                const goal = this.goal.get();
                if (!goal) return null;
                const pill = goalStatusPill(goal.status);
                return {
                    label: pill.label,
                    variant: pill.variant,
                    tone: pill.tone,
                    ...(pill.glyph === undefined ? {} : { glyph: pill.glyph }),
                };
            },
            // The walk upward: a Goal's parents are the Plans it belongs to.
            chips: () => this.planLinks.get().map((plan): DetailHeaderChip => ({
                label: t('goal.chip.plan', { title: plan.title }),
                href: `/planer/${plan.id}`,
            })),
            // §3.14 item 1: target date and achieved timestamp. Overdue rides
            // along as supporting metadata — never as a status.
            meta: () => {
                const goal = this.goal.get();
                if (!goal) return '';
                return [
                    goal.horseName ? t('goal.meta.horse', { name: goal.horseName }) : null,
                    targetDateLabel(goal.targetDate),
                    isOverdue(goal, this.today.get()) ? t('goal.overdue') : null,
                    achievedLabel(goal.achievedAt),
                ].filter(Boolean).join(' · ');
            },
            // Achieving is the one thing worth promoting, and it is offered to
            // BOTH roles (§3.14). It needs no confirm: Reopen restores the prior
            // state exactly, so the round trip is faithful.
            primaryAction: () => this.transitions.get().achieve
                ? { label: t('goal.action.achieve'), onclick: () => void this.achieve() }
                : null,
            secondaryActions: () => this.transitions.get().reopen
                ? [{ label: t('goal.action.reopen'), onclick: () => void this.reopen() }]
                : [],
            // Owner only, and behind the consequence-stating dialog.
            overflowActions: () => this.transitions.get().abandon
                ? [{ label: t('goal.action.abandon'), onclick: () => this.confirmAbandon.set(true) }]
                : [],
        });
    }

    /**
     * Missing, unshared and not-mine render the same empty state with the same
     * single exit (§4.14). §3.14: "Shared access disappearing resolves as not
     * found on refresh" — the server answers 404 for all of them, which is what
     * keeps it leak-safe.
     */
    private buildNotFound(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.resolved.get() && !this.goal.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('goal.notFound.heading'),
                    body: () => t('goal.notFound.body'),
                    action: {
                        label: () => t('goal.notFound.action'),
                        onclick: () => this.router.navigate('/mal'),
                    },
                    headingLevel: 1,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    // ─── Tillhör planer ─────────────────────────────────────────

    private buildPlanLinks(host: HTMLElement): void {
        this.track(effect(() => {
            const links = this.planLinks.get();
            const controls = this.controls.get();
            host.replaceChildren();

            for (const plan of links) {
                const li = document.createElement('li');
                const item = document.createElement('div');
                item.className = 'goal-detail__item';

                const href = `/planer/${plan.id}`;
                const link = document.createElement('a');
                link.className = 'goal-detail__item-link';
                link.href = href;
                link.textContent = plan.title;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.router.navigate(href);
                });
                item.appendChild(link);

                if (controls.managePlans) {
                    const detach = document.createElement('button');
                    detach.type = 'button';
                    detach.className = 'goal-detail__detach';
                    detach.textContent = t('goal.plans.detach');
                    detach.addEventListener('click', () => void this.detachPlan(plan));
                    item.appendChild(detach);
                }

                li.appendChild(item);
                host.appendChild(li);
            }
        }));
    }

    // ─── Delat med ──────────────────────────────────────────────

    /**
     * One named checkbox per connected Teacher — §4.5's rule that a shared state
     * is never anonymous, applied to the control that creates it.
     *
     * Each toggle is ONE call (`POST /goals/:id/shares` or `DELETE
     * …/shares/:teacherId`), so there is no multi-step write whose partial
     * failure would have to be reported: the box either moves or it does not.
     * On failure the checkbox is put back where the server still has it, rather
     * than left showing a state that was never saved.
     */
    private buildSharing(host: HTMLElement): void {
        this.track(effect(() => {
            const teachers = this.teachers.items.get();
            const shared = this.shares.get().map((share) => share.teacherId);
            const seeded = this.sharesSeeded.get();
            host.replaceChildren();

            for (const teacher of teachers) {
                const li = document.createElement('li');
                const label = document.createElement('label');
                label.className = 'goal-detail__check';

                const box = document.createElement('input');
                box.type = 'checkbox';
                box.checked = shared.includes(teacher.id);
                box.addEventListener('change', () => {
                    void this.toggleShare(teacher.id, box);
                });
                label.appendChild(box);

                const name = document.createElement('span');
                name.textContent = teacher.displayName;
                label.appendChild(name);

                li.appendChild(label);
                host.appendChild(li);
            }
            // Belt and braces with the section's own `hidden` class: an
            // un-seeded list cannot be interacted with at all.
            for (const box of host.querySelectorAll('input')) box.disabled = !seeded;
        }));
    }

    private async toggleShare(teacherId: string, box: HTMLInputElement): Promise<void> {
        const goalId = this.goal.get()?.id;
        const stored = this.shares.get().map((share) => share.teacherId);
        const next = box.checked;
        // The guard that makes seeding safe. Its predicate is pure and asserted
        // in tests/goal-copy.test.ts, so it cannot drift with this component.
        if (!goalId || !shouldCommitShare({
            seeded: this.sharesSeeded.get(),
            teacherId,
            next,
            stored,
        })) {
            box.checked = stored.includes(teacherId);
            return;
        }

        const ok = next
            ? await this.goals.share(goalId, teacherId)
            : await this.goals.unshare(goalId, teacherId);
        if (!ok) {
            // Put it back where the server still has it.
            box.checked = stored.includes(teacherId);
            this.toasts.show({ message: t('goal.sharing.error'), variant: 'error' });
            return;
        }
        await this.loadShares(goalId);
        this.toasts.show({ message: t('goal.sharing.saved') });
    }

    // ─── Writes ─────────────────────────────────────────────────

    private async save(e: Event): Promise<void> {
        e.preventDefault();
        const title = this.titleVal.get().trim();
        this.titleTouched.set(true);
        if (!title) return;
        if (this.targetInvalid.get()) return;

        const updated = await this.goals.update(this.goalId(), {
            title,
            description: this.descVal.get().trim() || null,
            targetDate: this.targetVal.get() || null,
            horseId: this.horseVal.get() || null,
        });
        if (!updated) return;
        this.toasts.show({ message: t('goal.saved'), variant: 'success' });
        await this.load();
    }

    private async attachPlan(): Promise<void> {
        const goalId = this.goal.get()?.id;
        const planId = this.planVal.get();
        const plan = this.attachable.get().find((p) => p.id === planId);
        if (!goalId || !plan) return;
        if (!shouldCommitPlanLink({
            seeded: this.planLinksResolved.get(),
            planId,
            next: true,
            stored: this.goal.get()?.planIds ?? [],
        })) return;

        const ok = await this.goals.attachPlan(goalId, planId);
        if (!ok) return;
        this.planVal.set('');
        this.toasts.show({ message: t('goal.toast.planAttached', { title: plan.title }) });
        await this.load();
    }

    private async detachPlan(plan: { id: string; title: string }): Promise<void> {
        const goalId = this.goal.get()?.id;
        if (!goalId) return;
        if (!shouldCommitPlanLink({
            seeded: this.planLinksResolved.get(),
            planId: plan.id,
            next: false,
            stored: this.goal.get()?.planIds ?? [],
        })) return;

        const ok = await this.goals.detachPlan(goalId, plan.id);
        if (!ok) return;
        this.toasts.show({ message: t('goal.toast.planDetached', { title: plan.title }) });
        await this.load();
    }

    private async achieve(): Promise<void> {
        const ok = await this.goals.achieve(this.goalId());
        if (!ok) return;
        this.toasts.show({ message: t('goal.toast.achieved'), variant: 'success' });
        await this.load();
    }

    private async reopen(): Promise<void> {
        const ok = await this.goals.reopen(this.goalId());
        if (!ok) return;
        this.toasts.show({ message: t('goal.toast.reopened') });
        await this.load();
    }

    private async abandon(): Promise<void> {
        const ok = await this.goals.abandon(this.goalId());
        if (!ok) return;
        this.toasts.show({ message: t('goal.toast.abandoned') });
        await this.load();
    }
}
