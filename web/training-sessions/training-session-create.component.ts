import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { plural, t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { TrainingSessionsService } from './training-sessions.service';
import { TeachersService } from './teachers.service';
import { StableService } from '../stable/stable.service';
import { PlansService } from '../plans/plans.service';
import {
    groupByTeacher,
    loggableHorses,
    loggablePlans,
    unsharedProgramOwners,
} from './training-session-copy';
import { api, type Program } from '../api';

const tpl = template(`
    <form class="log-session" bind="form">
        <a bind="back" href="/traningspass" class="log-session__back"></a>
        <h1 bind="heading" class="log-session__title"></h1>

        <div class="log-session__panel">
            <div class="log-session__pair">
                <label class="log-session__field">
                    <span bind="whenLabel" class="log-session__label"></span>
                    <input bind="whenInput" type="datetime-local" class="log-session__input" required>
                </label>
                <label class="log-session__field">
                    <span bind="durationLabel" class="log-session__label"></span>
                    <input bind="durationInput" type="number" min="0" step="1" class="log-session__input">
                    <span bind="durationHint" class="log-session__hint"></span>
                </label>
            </div>

            <label bind="horseField" class="log-session__field">
                <span bind="horseLabel" class="log-session__label"></span>
                <div bind="horseHost" class="log-session__control"></div>
                <span bind="horseHint" class="log-session__hint"></span>
            </label>

            <label class="log-session__field">
                <span bind="summaryLabel" class="log-session__label"></span>
                <textarea bind="summaryInput" rows="4" class="log-session__textarea"></textarea>
                <span bind="summaryHint" class="log-session__hint"></span>
            </label>

            <label bind="planField" class="log-session__field">
                <span bind="planLabel" class="log-session__label"></span>
                <div bind="planHost" class="log-session__control"></div>
                <span bind="planHint" class="log-session__hint"></span>
            </label>

            <label bind="programField" class="log-session__field">
                <span bind="programLabel" class="log-session__label"></span>
                <div bind="programHost" class="log-session__control"></div>
                <span bind="programHint" class="log-session__hint"></span>
            </label>

            <fieldset bind="shareField" class="log-session__share">
                <legend bind="shareLegend" class="log-session__label"></legend>
                <p bind="shareHint" class="log-session__hint"></p>

                <label bind="shareSingle" class="log-session__check">
                    <input bind="shareSingleInput" type="checkbox">
                    <span bind="shareSingleLabel"></span>
                </label>

                <div bind="shareMulti" class="log-session__control"></div>

                <div bind="offer" class="log-session__offer">
                    <p bind="offerText" class="log-session__offer-text"></p>
                    <button bind="offerAction" type="button" class="log-session__offer-button"></button>
                </div>
            </fieldset>

            <p bind="error" class="log-session__error" role="alert"></p>

            <div class="log-session__actions">
                <button bind="submit" type="submit" class="log-session__submit"></button>
                <button bind="cancel" type="button" class="log-session__cancel"></button>
            </div>
        </div>
    </form>
`);

/** `<input type="datetime-local">` gives local wall time with no zone. */
function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
}

/**
 * Logga pass — IA §3.9 "Creation", on its own route at `/traningspass/ny`.
 *
 * The field order is the specification's, and it is a *narrative* order rather
 * than a dependency order: when, how long, on which horse, how it went, under
 * which plan, from which program, and finally who may read it. Unlike Boka
 * lektion, nothing here depends on an earlier answer — every field belongs to
 * the person filling it in — so no picker is gated on another.
 *
 * **Sharing is last, and Private is the default.** §3.9 fixes both. Sharing last
 * because the trust decision should be made with the summary already written and
 * visible, not before there is anything to share; Private by default because a
 * training journal is the Student's own, and disclosure has to be an act rather
 * than an omission. The control's *shape* follows the number of Teachers: none
 * renders nothing at all, one is a single named checkbox, several is the §4.9
 * multi-select with its visible count. A checkbox list for one Teacher would be
 * a list with one row, and a select for none would be an empty control asking an
 * unanswerable question.
 *
 * **Missing optional data hides its field** (§3.9 States) — no horses, no active
 * plans, no visible catalog, no teachers each remove a field rather than
 * rendering an empty picker. What remains always suffices for a basic log: only
 * the performed time is required.
 */
export class TrainingSessionCreateComponent extends Component {
    static styles = `
        .log-session {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .log-session__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .log-session__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            & .log-session__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }
            & .log-session__field.hidden { display: none; }

            & .log-session__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${s('md')};
            }

            & .log-session__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .log-session__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .log-session__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }

            & .log-session__input, & .log-session__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .log-session__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .log-session__control .ui-select { display: block; }

            /* The trust surface gets a visible boundary — it is a decision, not
               just another field. */
            & .log-session__share {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin: 0;
                padding: ${s('md')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
            }
            & .log-session__share.hidden { display: none; }

            & .log-session__check {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                font-size: 0.875rem;
                color: ${token('text')};
                cursor: pointer;
            }
            & .log-session__check.hidden { display: none; }
            & .log-session__check input { accent-color: ${token('accent')}; }

            /* The offer to share with a Program's owner. An offer, never a
               silent decision — see unsharedProgramOwners in the copy module. */
            & .log-session__offer {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                background: ${token('surface-2')};

                & .log-session__offer-text {
                    margin: 0;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    color: ${token('text')};
                    max-width: 68ch;
                }
                & .log-session__offer-button {
                    ${btn()}
                    font-size: 0.8125rem;
                }
            }
            & .log-session__offer.hidden { display: none; }

            & .log-session__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .log-session__actions {
                display: flex;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .log-session__submit { ${btn(token('radius-sm'), 'primary')} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .log-session__cancel { ${btn(token('radius-sm'), 'ghost')} }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .log-session__pair { grid-template-columns: 1fr; }
                & .log-session__actions { flex-direction: column; align-items: stretch; }
                & .log-session__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private sessions = this.inject(TrainingSessionsService);
    private teachers = this.inject(TeachersService);
    private stable = this.inject(StableService);
    private plans = this.inject(PlansService);
    private toasts = this.inject(ToastService);

    private whenVal = new Signal('');
    private durationVal = new Signal('');
    private summaryVal = new Signal('');
    private horseVal = new Signal('');
    private planVal = new Signal('');
    private programVal = new Signal('');
    /** Teacher ids this session will be shared with. Empty = Private (§3.9). */
    private shareVals = new Signal<string[]>([]);
    private programCatalog = new Signal<Program[]>([]);
    private validation = new Signal('');

    private horses = new Computed(() => loggableHorses(this.stable.items.get()));
    private activePlans = new Computed(() => loggablePlans(this.plans.items.get()));

    private horseOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('trainingSession.horse.none') },
        ...this.horses.get().map((h) => ({ value: h.id, label: h.name })),
    ]);
    private planOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('trainingSession.plan.none') },
        ...this.activePlans.get().map((p) => ({ value: p.id, label: p.title })),
    ]);
    /**
     * §4.9: the catalog is grouped by owning Teacher, because provenance is part
     * of the content. Nothing is excluded here — a fresh session has nothing
     * attached yet.
     */
    private programOptions = new Computed<SelectOption[]>(() =>
        groupByTeacher(
            this.programCatalog.get(),
            this.teachers.items.get(),
            (program) => program.title,
        ),
    );
    private teacherOptions = new Computed<SelectOption[]>(() =>
        this.teachers.items.get().map((teacher) => ({ value: teacher.id, label: teacher.displayName })),
    );

    private teacherCount = new Computed(() => this.teachers.items.get().length);

    /**
     * The Teacher who owns the chosen Program and cannot yet see the session.
     * At most one, because creation takes at most one Program.
     */
    private pendingOwner = new Computed(() => {
        const programId = this.programVal.get();
        if (!programId) return null;
        const program = this.programCatalog.get().find((p) => p.id === programId);
        if (!program) return null;
        return unsharedProgramOwners(
            [{ id: program.id, title: program.title }],
            this.programCatalog.get(),
            this.shareVals.get(),
            this.teachers.items.get(),
        )[0] ?? null;
    });

    onMount(): void {
        void this.teachers.load();
        void this.stable.load();
        void this.plans.load();
        void api.programs.listForStudent()
            .then((list) => this.programCatalog.set(list))
            .catch(() => this.programCatalog.set([]));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            // `router.link` also binds an active-link `className`, which would
            // overwrite the class this element is styled by. Only the click
            // handler is wanted here.
            back: {
                onclick: this.router.link('/traningspass').onclick,
                textContent: () => t('trainingSession.back'),
            },
            heading: { textContent: () => t('trainingSessionCreate.heading') },

            whenLabel: { textContent: () => t('trainingSessionCreate.field.when') },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            durationLabel: { textContent: () => t('trainingSessionCreate.field.duration') },
            durationHint: { textContent: () => t('trainingSessionCreate.field.duration.hint') },
            durationInput: {
                value: () => this.durationVal.get(),
                oninput: (e: Event) => this.durationVal.set((e.target as HTMLInputElement).value),
            },

            // §3.9 States: a field with nothing to offer is hidden, not shown
            // empty — an empty picker asks a question the account cannot answer.
            horseField: {
                className: () => this.horses.get().length === 0
                    ? 'log-session__field hidden' : 'log-session__field',
            },
            horseLabel: { textContent: () => t('trainingSessionCreate.field.horse') },
            horseHint: { textContent: () => t('trainingSessionCreate.field.horse.hint') },

            summaryLabel: { textContent: () => t('trainingSessionCreate.field.summary') },
            summaryHint: { textContent: () => t('trainingSessionCreate.field.summary.hint') },
            summaryInput: {
                value: () => this.summaryVal.get(),
                oninput: (e: Event) => this.summaryVal.set((e.target as HTMLTextAreaElement).value),
            },

            planField: {
                className: () => this.activePlans.get().length === 0
                    ? 'log-session__field hidden' : 'log-session__field',
            },
            planLabel: { textContent: () => t('trainingSessionCreate.field.plan') },
            planHint: { textContent: () => t('trainingSessionCreate.field.plan.hint') },

            programField: {
                className: () => this.programCatalog.get().length === 0
                    ? 'log-session__field hidden' : 'log-session__field',
            },
            programLabel: { textContent: () => t('trainingSessionCreate.field.program') },
            programHint: { textContent: () => t('trainingSessionCreate.field.program.hint') },

            // No Teachers, no control: §3.9 says so, and a sharing box with
            // nobody in it would only teach that sharing is unavailable.
            shareField: {
                className: () => this.teacherCount.get() === 0
                    ? 'log-session__share hidden' : 'log-session__share',
            },
            shareLegend: { textContent: () => t('trainingSession.sharing.legend') },
            shareHint: { textContent: () => t('trainingSession.sharing.hint') },
            shareSingle: {
                className: () => this.teacherCount.get() === 1
                    ? 'log-session__check' : 'log-session__check hidden',
            },
            shareSingleLabel: {
                textContent: () => {
                    const only = this.teachers.items.get()[0];
                    return only ? t('trainingSession.sharing.withTeacher', { name: only.displayName }) : '';
                },
            },
            shareSingleInput: {
                checked: () => this.shareVals.get().length > 0,
                onchange: (e: Event) => {
                    const only = this.teachers.items.get()[0];
                    if (!only) return;
                    this.shareVals.set((e.target as HTMLInputElement).checked ? [only.id] : []);
                },
            },
            shareMulti: {
                className: () => this.teacherCount.get() > 1
                    ? 'log-session__control' : 'log-session__control hidden',
            },

            offer: {
                className: () => this.pendingOwner.get()
                    ? 'log-session__offer' : 'log-session__offer hidden',
            },
            offerText: {
                textContent: () => {
                    const owner = this.pendingOwner.get();
                    return owner ? t('trainingSession.programOffer', { name: owner.displayName }) : '';
                },
            },
            offerAction: {
                textContent: () => {
                    const owner = this.pendingOwner.get();
                    return owner ? t('trainingSession.programOffer.action', { name: owner.displayName }) : '';
                },
                onclick: () => {
                    const owner = this.pendingOwner.get();
                    if (!owner) return;
                    this.shareVals.set([...new Set([...this.shareVals.get(), owner.id])]);
                },
            },

            error: {
                textContent: () => this.validation.get()
                    || (this.sessions.error.get() ? t('trainingSessions.saveError') : ''),
            },
            submit: {
                textContent: () => t('trainingSessionCreate.submit'),
                disabled: () => this.sessions.loading.get(),
            },
            cancel: {
                textContent: () => t('trainingSessionCreate.cancel'),
                onclick: () => this.router.navigate('/traningspass'),
            },
            form: { onsubmit: (e: Event) => void this.submit(e) },
        });

        this.spawn(SelectComponent, this.ref(frag, 'horseHost'), {
            value: this.horseVal,
            options: this.horseOptions,
        });
        this.spawn(SelectComponent, this.ref(frag, 'planHost'), {
            value: this.planVal,
            options: this.planOptions,
        });
        this.spawn(SelectComponent, this.ref(frag, 'programHost'), {
            value: this.programVal,
            options: this.programOptions,
            placeholder: t('trainingSession.programs.placeholder'),
        });
        // Several Teachers: named multi-selection with a visible count (§4.9
        // forbids a hidden one).
        this.spawn(SelectComponent, this.ref(frag, 'shareMulti'), {
            multiple: true,
            values: this.shareVals,
            options: this.teacherOptions,
            placeholder: t('trainingSession.sharing.placeholder'),
            countLabel: (n: number) => plural('trainingSession.sharing.count', n),
        });

        // Dropping from several Teachers to one (a Relation ended mid-form)
        // would otherwise strand ids the single checkbox cannot represent.
        this.track(effect(() => {
            const valid = new Set(this.teachers.items.get().map((teacher) => teacher.id));
            const current = this.shareVals.get();
            const kept = current.filter((id) => valid.has(id));
            if (kept.length !== current.length) this.shareVals.set(kept);
        }));

        return frag;
    }

    private async submit(e: Event): Promise<void> {
        e.preventDefault();
        const when = this.whenVal.get();
        // Field validation names the field and what to do about it (IA §4).
        if (!when) return this.validation.set(t('trainingSessionCreate.error.when'));

        const durationRaw = this.durationVal.get().trim();
        let durationMin: number | null = null;
        if (durationRaw !== '') {
            const parsed = Number(durationRaw);
            if (!Number.isInteger(parsed) || parsed < 0) {
                return this.validation.set(t('trainingSessionCreate.error.duration'));
            }
            durationMin = parsed;
        }
        this.validation.set('');

        const summary = this.summaryVal.get().trim();
        const horseId = this.horseVal.get();
        const planId = this.planVal.get();
        const programId = this.programVal.get();

        // One call, and therefore one honest outcome. `POST /training-sessions`
        // takes the horse, the plan, the Program snapshot and the share set
        // together and writes them in a transaction, so unlike Boka lektion
        // there is no follow-up that can fail behind a success message. If this
        // resolves, everything the form collected is stored.
        const created = await this.sessions.create({
            performedAt: fromLocalInput(when),
            durationMin,
            summary: summary === '' ? null : summary,
            ...(horseId ? { horseId } : {}),
            ...(planId ? { planId } : {}),
            ...(programId ? { programId } : {}),
            shareWithTeacherIds: this.shareVals.get(),
        });
        if (!created) return;

        this.toasts.show({ message: t('trainingSessionCreate.created'), variant: 'success' });
        // Land on the thing that was just made: the next thing a rider does with
        // a logged pass is read it back, or write the note they did not have
        // room for in the summary.
        this.router.navigate(`/traningspass/${created.id}`);
    }
}
