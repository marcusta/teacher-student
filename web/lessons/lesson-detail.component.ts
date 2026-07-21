import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { DetailHeaderComponent, type DetailHeaderChip } from '../ui/detail-header.component';
import { ThreadPool, mountThread, type NoteThreadProps } from '../ui/note-thread.component';
import type { ShareRecipient } from '../ui/share-chip.component';
import type { PersonRole } from '../ui/person-marker.component';
import { LessonsService } from './lessons.service';
import { ProgramsService } from '../programs/programs.service';
import {
    bookableHorses,
    bookablePlans,
    counterpartyRole,
    exerciseSource,
    historyHref,
    isConflict,
    lessonControls,
    lessonTitle,
    lessonWhen,
    lockNotice,
    orderedExercises,
    planChipLabel,
    programChipLabel,
    rowNote,
    statusPill,
    type LessonControls,
} from './lesson-copy';
import { api, type Exercise, type Horse, type LessonForUser, type Plan } from '../api';

const tpl = template(`
    <div class="lesson-detail" bind="root">
        <a bind="back" href="/lektioner" class="lesson-detail__back"></a>
        <p bind="loading" class="lesson-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="lesson-detail__body">
            <div bind="headerHost"></div>

            <div bind="conflict" class="lesson-detail__conflict" role="alert">
                <p bind="conflictText" class="lesson-detail__conflict-text"></p>
                <button bind="conflictRetry" type="button" class="lesson-detail__conflict-action"></button>
            </div>

            <p bind="lock" class="lesson-detail__lock"></p>

            <section bind="detailsSection" class="lesson-detail__section">
                <h2 bind="detailsHeading" class="lesson-detail__heading"></h2>
                <form bind="detailsForm" class="lesson-detail__form">
                    <div class="lesson-detail__pair">
                        <label class="lesson-detail__field">
                            <span bind="whenLabel" class="lesson-detail__label"></span>
                            <input bind="whenInput" type="datetime-local" class="lesson-detail__input" required>
                        </label>
                        <label class="lesson-detail__field">
                            <span bind="horseLabel" class="lesson-detail__label"></span>
                            <div bind="horseHost" class="lesson-detail__control"></div>
                        </label>
                    </div>
                    <label class="lesson-detail__field">
                        <span bind="planLabel" class="lesson-detail__label"></span>
                        <div bind="planHost" class="lesson-detail__control"></div>
                    </label>
                    <div class="lesson-detail__row">
                        <button bind="save" type="submit" class="lesson-detail__save"></button>
                    </div>
                </form>
            </section>

            <section bind="programsSection" class="lesson-detail__section">
                <h2 bind="programsHeading" class="lesson-detail__heading"></h2>
                <p bind="programsHint" class="lesson-detail__hint"></p>
                <ul bind="programList" class="lesson-detail__prog-list"></ul>
                <p bind="programsEmpty" class="lesson-detail__muted"></p>
                <div class="lesson-detail__row">
                    <div bind="programHost" class="lesson-detail__control lesson-detail__control--grow"></div>
                    <button bind="attachProgram" type="button" class="lesson-detail__secondary"></button>
                </div>
            </section>

            <section class="lesson-detail__section">
                <h2 bind="exercisesHeading" class="lesson-detail__heading"></h2>
                <ol bind="exerciseList" class="lesson-detail__ex-list"></ol>
                <p bind="exercisesEmpty" class="lesson-detail__muted"></p>
                <div bind="exerciseAdd" class="lesson-detail__row">
                    <div bind="exerciseHost" class="lesson-detail__control lesson-detail__control--grow"></div>
                    <button bind="addExercise" type="button" class="lesson-detail__secondary"></button>
                </div>
            </section>

            <section class="lesson-detail__section">
                <div bind="notesHost"></div>
            </section>
        </div>

        <div bind="confirmCompleteHost"></div>
        <div bind="confirmCancelHost"></div>
    </div>
`);

function toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
}

/**
 * Lektion — IA §3.8. The Teacher's cockpit and the Student's record of the same
 * taught occasion, in the information order the IA fixes: detail header,
 * summary, Övningar, per-Exercise Notes, Lesson Notes.
 *
 * Two things distinguish this from the edit form it replaces.
 *
 * **It resolves itself.** `LessonsService.loadOne(id)` hits the new
 * `GET /lessons/:id`, so a pasted `/lektioner/:id` works on a cold load instead
 * of waiting for — and depending on — the full list. The server answers 404 for
 * a Lesson that is missing *and* for one that belongs to someone else, and this
 * view renders those identically: distinguishing them in the UI would leak the
 * existence of other people's lessons that the API deliberately does not.
 *
 * **It respects the terminal-state contract.** Completed and Cancelled are
 * terminal, and the server now answers 409 for `addExercise`, `removeExercise`,
 * `attachProgram` and `detachProgram` once a Lesson reaches either. So those
 * controls are not rendered at all past a terminal transition — see
 * `lessonControls` for the full matrix and for what deliberately stays open
 * (reschedule, horse, plan, and all Notes). A 409 that arrives anyway means this
 * view is working from a stale copy, which is a recoverable conflict with a
 * refresh path (IA §4), not a failure.
 */
export class LessonDetailComponent extends Component {
    static styles = `
        .lesson-detail {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            font-family: ${token('font-ui')};

            & .lesson-detail__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .lesson-detail__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }

            & .lesson-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xl')};
            }
            & .lesson-detail__body.hidden { display: none; }
            & .lesson-detail__loading.hidden { display: none; }
            & .lesson-detail__back.hidden { display: none; }

            & .lesson-detail__conflict {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('md')};
                padding: ${s('md')};
                border: 1px solid ${token('warning')};
                border-radius: ${token('radius-md')};
                background: ${token('warning-soft')};

                & .lesson-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${token('text')};
                    max-width: 68ch;
                }
                & .lesson-detail__conflict-action { ${btn()} }
            }
            & .lesson-detail__conflict.hidden { display: none; }

            /* The lock notice takes the place of the withheld controls — it says
               what is closed AND what is still open, so a terminal lesson does
               not read as a dead end. */
            & .lesson-detail__lock {
                margin: 0;
                padding: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                background: ${token('surface-2')};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${token('text')};
                max-width: 68ch;
            }
            & .lesson-detail__lock.hidden { display: none; }

            & .lesson-detail__section { display: flex; flex-direction: column; gap: ${s('md')}; }
            & .lesson-detail__section.hidden { display: none; }

            /* Section headings are the second permitted serif use (20/28), and
               weight 500 like every other Lora run in this app. */
            & .lesson-detail__heading {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .lesson-detail__hint, & .lesson-detail__muted {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .lesson-detail__muted.hidden { display: none; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them.
             */
            & .lesson-detail__form {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                max-width: 34rem;
            }
            & .lesson-detail__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${s('md')};
            }
            & .lesson-detail__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .lesson-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .lesson-detail__input {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .lesson-detail__control .ui-select { display: block; }
            & .lesson-detail__control--grow { flex: 1; min-width: 0; }

            & .lesson-detail__row {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            & .lesson-detail__row.hidden { display: none; }
            /*
             * Selects in a row on the page, not inside the form panel, keep a
             * raised --surface fill — the recessed --bg fill is only legible
             * against a card.
             */
            & .lesson-detail__row .ui-select__trigger { background: ${token('surface')}; }

            /* §4.8: one primary per view. This is it. */
            & .lesson-detail__save { ${btn(token('radius-sm'), 'primary')} }
            & .lesson-detail__secondary { ${btn()} }

            & .lesson-detail__prog-list, & .lesson-detail__ex-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
            }
            & .lesson-detail__prog-list { gap: ${s('xs')}; }
            & .lesson-detail__ex-list {
                border-top: 1px solid ${token('border')};
                counter-reset: occurrence;
            }
            & .lesson-detail__ex-item {
                border-bottom: 1px solid ${token('border')};
                padding: ${s('md')} 0;
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .lesson-detail__prog-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')};
                background: ${token('surface')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-md')};
                font-size: 0.875rem;
            }

            & .lesson-detail__ex-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('md')};
                flex-wrap: wrap;
            }
            & .lesson-detail__ex-name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
            }
            /* Taught order is data, so the ordinal is generated rather than
               typed into the name. */
            & .lesson-detail__ex-name::before {
                counter-increment: occurrence;
                content: counter(occurrence) ". ";
                color: ${token('text-muted')};
                font-variant-numeric: tabular-nums;
            }
            & .lesson-detail__ex-source {
                font-size: 0.75rem;
                font-weight: 600;
                color: ${token('text-muted')};
                border: 1px solid ${token('border')};
                border-radius: ${token('radius-pill')};
                padding: 2px ${s('sm')};
            }
            /* The static Row note is instruction copied WITH the occurrence —
               never an authored Note, so it carries no author, no timestamp and
               no composer. The brass hairline is what tells the two apart. */
            & .lesson-detail__ex-note {
                margin: 0;
                padding-left: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text')};
                max-width: 68ch;
            }
            & .lesson-detail__ex-actions {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
            }
            & .lesson-detail__link {
                background: none;
                border: none;
                padding: 0;
                font-family: inherit;
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('accent-strong')};
                text-decoration: none;
                cursor: pointer;
                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }
            & .lesson-detail__link--danger { color: ${token('danger')}; }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .lesson-detail__pair { grid-template-columns: 1fr; }
                & .lesson-detail__row { align-items: stretch; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LessonsService);
    private programs = this.inject(ProgramsService);
    private toasts = this.inject(ToastService);

    private resolved = new Signal(false);
    private found = new Signal(true);
    private horses = new Signal<Horse[]>([]);
    private plans = new Signal<Plan[]>([]);
    private library = new Signal<Exercise[]>([]);
    private whenVal = new Signal('');
    private horseVal = new Signal('');
    private planVal = new Signal('');
    private programVal = new Signal('');
    private exerciseVal = new Signal('');
    private openNotes = new Signal<Set<string>>(new Set());
    private confirmComplete = new Signal(false);
    private confirmCancel = new Signal(false);

    private lessonId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private lesson(): LessonForUser | null {
        return this.svc.get(this.lessonId());
    }

    /**
     * The control matrix, recomputed from whatever the server last said. Every
     * `hidden` class below reads from here rather than testing the status
     * inline, so the rules live in one tested place.
     */
    private controls = new Computed<LessonControls>(() => {
        const lesson = this.lesson();
        return lesson
            ? lessonControls(lesson.status, lesson.role)
            : { transition: false, editDetails: false, editExercises: false, editPrograms: false, notes: false, lockNotice: false };
    });

    private conflicted = new Computed(() => isConflict(this.svc.error.get()));

    private horseOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('lesson.horse.none') },
        ...bookableHorses(this.horses.get()).map((h) => ({ value: h.id, label: h.name })),
    ]);
    private planOptions = new Computed<SelectOption[]>(() => [
        { value: '', label: t('lesson.plan.none') },
        ...bookablePlans(this.plans.get()).map((p) => ({ value: p.id, label: p.title })),
    ]);
    private programOptions = new Computed<SelectOption[]>(() => {
        const attached = new Set((this.lesson()?.programs ?? []).map((p) => p.id));
        return this.programs.items.get()
            .filter((p) => !attached.has(p.id))
            .map((p) => ({ value: p.id, label: p.title }));
    });
    private exerciseOptions = new Computed<SelectOption[]>(() => {
        const linked = new Set((this.lesson()?.exercises ?? []).map((e) => e.exerciseId));
        return this.library.get()
            .filter((e) => !linked.has(e.id))
            .map((e) => ({ value: e.id, label: e.name }));
    });

    onMount(): void {
        void this.resolve();
    }

    private async resolve(): Promise<void> {
        const lesson = await this.svc.loadOne(this.lessonId());
        if (!lesson) {
            // 404 covers missing AND not-yours, identically (IA §3.8).
            this.found.set(false);
            this.resolved.set(true);
            return;
        }
        this.whenVal.set(toLocalInput(lesson.scheduledAt));
        this.horseVal.set(lesson.horseId ?? '');
        this.planVal.set(lesson.planId ?? '');
        this.found.set(true);
        this.resolved.set(true);

        // Only the Teacher can act on this Lesson's structure, so only the
        // Teacher pays for the pickers' data.
        if (lesson.role !== 'teacher') return;
        const [horses, plans, library] = await Promise.all([
            api.students.listHorses({ id: lesson.studentId }),
            api.students.listPlans({ id: lesson.studentId }),
            api.exercises.list(),
            this.programs.load(),
        ]);
        this.horses.set(horses);
        this.plans.set(plans);
        this.library.set(library);
    }

    // ─── Note thread wiring ─────────────────────────────────────

    /** Who a shared Note here reaches: the other party, by name (§4.5). */
    private counterparty(): ShareRecipient[] {
        const lesson = this.lesson();
        if (!lesson) return [];
        const id = lesson.role === 'student' ? lesson.teacherId : lesson.studentId;
        return [{ id, name: lesson.counterpartyDisplayName }];
    }

    /** On a Lesson the Teacher is whoever taught it, not whoever is reading. */
    private roleOf = (authorId: string): PersonRole =>
        authorId === this.lesson()?.teacherId ? 'teacher' : 'student';

    private exerciseThread(occurrenceId: string, name: string): NoteThreadProps {
        return {
            parentKind: 'lesson_exercise',
            parentId: occurrenceId,
            context: () => [t('objectKind.exercise'), name].join(' · '),
            recipients: () => this.counterparty(),
            roleOf: (note) => this.roleOf(note.authorId),
            headingLevel: 4,
        };
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                ...this.router.link('/lektioner'),
                textContent: () => t('lesson.back'),
                className: () => this.resolved.get() && !this.found.get()
                    ? 'lesson-detail__back hidden' : 'lesson-detail__back',
            },
            loading: {
                textContent: () => t('lesson.loading'),
                className: () => this.resolved.get() ? 'lesson-detail__loading hidden' : 'lesson-detail__loading',
            },
            body: {
                className: () => this.resolved.get() && this.found.get()
                    ? 'lesson-detail__body' : 'lesson-detail__body hidden',
            },
            conflict: {
                className: () => this.conflicted.get() ? 'lesson-detail__conflict' : 'lesson-detail__conflict hidden',
            },
            conflictText: { textContent: () => t('lesson.conflict.message') },
            conflictRetry: {
                textContent: () => t('lesson.conflict.action'),
                onclick: () => void this.resolve(),
            },
            lock: {
                textContent: () => {
                    const lesson = this.lesson();
                    return lesson ? lockNotice(lesson.status) : '';
                },
                className: () => this.controls.get().lockNotice ? 'lesson-detail__lock' : 'lesson-detail__lock hidden',
            },

            detailsSection: {
                className: () => this.controls.get().editDetails
                    ? 'lesson-detail__section' : 'lesson-detail__section hidden',
            },
            detailsHeading: { textContent: () => t('lesson.section.details') },
            whenLabel: { textContent: () => t('lesson.field.when') },
            horseLabel: { textContent: () => t('lesson.field.horse') },
            planLabel: { textContent: () => t('lesson.field.plan') },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            save: { textContent: () => t('lesson.save') },
            detailsForm: { onsubmit: (e: Event) => void this.saveDetails(e) },

            programsSection: {
                className: () => this.controls.get().editPrograms
                    ? 'lesson-detail__section' : 'lesson-detail__section hidden',
            },
            programsHeading: { textContent: () => t('lesson.section.programs') },
            // Stated where it can be acted on: detaching a source does not
            // withdraw the Exercises it already copied in (IA §3.8).
            programsHint: { textContent: () => t('lesson.programs.detachHint') },
            programsEmpty: {
                textContent: () => t('lesson.programs.empty'),
                className: () => (this.lesson()?.programs.length ?? 0) === 0
                    ? 'lesson-detail__muted' : 'lesson-detail__muted hidden',
            },
            attachProgram: {
                textContent: () => t('lesson.programs.attach'),
                onclick: () => void this.attachProgram(),
            },

            exercisesHeading: { textContent: () => t('lesson.section.exercises') },
            exercisesEmpty: {
                textContent: () => t('lesson.exercises.empty'),
                className: () => (this.lesson()?.exercises.length ?? 0) === 0
                    ? 'lesson-detail__muted' : 'lesson-detail__muted hidden',
            },
            exerciseAdd: {
                className: () => this.controls.get().editExercises
                    ? 'lesson-detail__row' : 'lesson-detail__row hidden',
            },
            addExercise: {
                textContent: () => t('lesson.exercise.add'),
                onclick: () => void this.addExercise(),
            },
        });

        this.buildNotFound(this.ref(frag, 'notFoundHost'));
        this.buildHeader(this.ref(frag, 'headerHost'));
        this.buildPrograms(this.ref(frag, 'programList'));
        this.buildExercises(this.ref(frag, 'exerciseList'));

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
            placeholder: t('lesson.programs.placeholder'),
        });
        this.spawn(SelectComponent, this.ref(frag, 'exerciseHost'), {
            value: this.exerciseVal,
            options: this.exerciseOptions,
            placeholder: t('lesson.exercise.placeholder'),
        });
        // Drop a selection that stopped being offerable (it got attached).
        this.track(effect(() => {
            const options = this.programOptions.get();
            const current = this.programVal.get();
            if (current && !options.some((o) => o.value === current)) this.programVal.set('');
        }));
        this.track(effect(() => {
            const options = this.exerciseOptions.get();
            const current = this.exerciseVal.get();
            if (current && !options.some((o) => o.value === current)) this.exerciseVal.set('');
        }));

        // §4.12: a dialog before a TERMINAL change, stating the consequence.
        // Both messages name what becomes impossible and what stays possible —
        // "Är du säker?" is explicitly on the spec's Undvik list.
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmCompleteHost'), {
            open: this.confirmComplete,
            title: t('lesson.confirm.complete.title'),
            message: () => t('lesson.confirm.complete.message'),
            confirmLabel: t('lesson.action.complete'),
            cancelLabel: t('lesson.confirm.dismiss'),
            onconfirm: () => void this.transition('completed'),
        });
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmCancelHost'), {
            open: this.confirmCancel,
            title: t('lesson.confirm.cancel.title'),
            message: () => t('lesson.confirm.cancel.message'),
            confirmLabel: t('lesson.action.cancel'),
            cancelLabel: t('lesson.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.transition('cancelled'),
        });

        // Notes stay open at every status — this is the feedback loop, and it
        // is the reason a terminal Lesson is still worth opening.
        mountThread(this.ref(frag, 'notesHost'), () => {
            const lesson = this.lesson();
            if (!lesson) return null;
            return {
                parentKind: 'lesson',
                parentId: lesson.id,
                context: () => this.lessonContext(),
                recipients: () => this.counterparty(),
                roleOf: (note) => this.roleOf(note.authorId),
            };
        }, (d) => this.track(d));

        return frag;
    }

    /** 'Lektion · Onsdag 22 juli · 17:00 · Luna' — the §4.7 context row. */
    private lessonContext(): string {
        const lesson = this.lesson();
        if (!lesson) return t('objectKind.lesson');
        return [t('objectKind.lesson'), lessonWhen(lesson.scheduledAt), lesson.horseName]
            .filter(Boolean).join(' · ');
    }

    // ─── Header ─────────────────────────────────────────────────

    private buildHeader(host: HTMLElement): void {
        this.spawn(DetailHeaderComponent, host, {
            eyebrow: () => t('objectKind.lesson'),
            title: () => {
                const lesson = this.lesson();
                return lesson ? lessonTitle(lesson) : t('lesson.title.plain');
            },
            status: () => {
                const lesson = this.lesson();
                if (!lesson) return null;
                const pill = statusPill(lesson.status);
                return {
                    label: pill.label,
                    variant: pill.variant,
                    tone: pill.tone,
                    ...(pill.glyph === undefined ? {} : { glyph: pill.glyph }),
                };
            },
            // Parent chips ARE the walk upward: Plan, and each source Program.
            chips: () => this.headerChips(),
            // Audience: who this occasion is shared with, named (§4.5).
            recipients: () => this.counterparty(),
            shared: () => true,
            meta: () => {
                const lesson = this.lesson();
                if (!lesson) return '';
                return [
                    lessonWhen(lesson.scheduledAt),
                    lesson.counterpartyDisplayName,
                    lesson.horseName,
                ].filter(Boolean).join(' · ');
            },
            // At most one primary — the prop shape makes a second impossible.
            primaryAction: () => this.controls.get().transition
                ? { label: t('lesson.action.complete'), onclick: () => this.confirmComplete.set(true) }
                : null,
            secondaryActions: () => this.controls.get().transition
                ? [{ label: t('lesson.action.cancel'), onclick: () => this.confirmCancel.set(true) }]
                : [],
        });
    }

    private headerChips(): DetailHeaderChip[] {
        const lesson = this.lesson();
        if (!lesson) return [];
        const chips: DetailHeaderChip[] = [];
        if (lesson.planId && lesson.planTitle) {
            chips.push({ label: planChipLabel(lesson.planTitle), href: `/planer/${lesson.planId}` });
        }
        for (const program of lesson.programs) {
            chips.push({ label: programChipLabel(program), href: `/program/${program.id}` });
        }
        return chips;
    }

    /**
     * Missing and unauthorized render the same empty state, with the same one
     * exit. §4.14 requires exactly one action; here it is the only place worth
     * going from a link that does not resolve.
     */
    private buildNotFound(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.resolved.get() && !this.found.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            // Built outside the tracking scope, exactly as spawn() and
            // mountThread() do: mounting the child runs its render, and those
            // signal reads would otherwise subscribe THIS effect — tearing the
            // empty state down and rebuilding it on unrelated changes.
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('lesson.notFound.heading'),
                    body: () => t('lesson.notFound.body'),
                    action: {
                        label: () => t('lesson.notFound.action'),
                        onclick: () => this.router.navigate('/lektioner'),
                    },
                    headingLevel: 1,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    // ─── Programs ───────────────────────────────────────────────

    private buildPrograms(host: HTMLElement): void {
        this.track(effect(() => {
            const lesson = this.lesson();
            const controls = this.controls.get();
            host.replaceChildren();
            for (const program of lesson?.programs ?? []) {
                const li = document.createElement('li');
                li.className = 'lesson-detail__prog-item';
                const label = document.createElement('span');
                label.textContent = program.title;
                li.appendChild(label);
                // Withheld by construction, like the Exercise remove control:
                // the enclosing section is also display:none past a terminal
                // transition, but the button must not exist in the first place
                // rather than depend on an ancestor's class for its safety.
                if (controls.editPrograms) {
                    const detach = document.createElement('button');
                    detach.type = 'button';
                    detach.className = 'lesson-detail__link lesson-detail__link--danger';
                    detach.textContent = t('lesson.programs.detach');
                    detach.onclick = () => void this.detachProgram(program.id, program.title);
                    li.appendChild(detach);
                }
                host.appendChild(li);
            }
        }));
    }

    // ─── Exercise occurrences ───────────────────────────────────

    private buildExercises(host: HTMLElement): void {
        const threads = new ThreadPool((d) => this.track(d));
        this.track(effect(() => {
            const lesson = this.lesson();
            const open = this.openNotes.get();
            const controls = this.controls.get();
            // Every generation is rebuilt wholesale, so the previous one's
            // threads are destroyed first — see ThreadPool's docs for why
            // spawn() cannot own these.
            threads.reset();
            host.replaceChildren();
            if (!lesson) return;

            for (const occurrence of orderedExercises(lesson.exercises)) {
                const li = document.createElement('li');
                li.className = 'lesson-detail__ex-item';

                const head = document.createElement('div');
                head.className = 'lesson-detail__ex-head';
                const name = document.createElement('span');
                name.className = 'lesson-detail__ex-name';
                name.textContent = occurrence.name;
                head.appendChild(name);
                const source = exerciseSource(occurrence, lesson.programs);
                if (source) {
                    const chip = document.createElement('span');
                    chip.className = 'lesson-detail__ex-source';
                    chip.textContent = source;
                    head.appendChild(chip);
                }
                li.appendChild(head);

                const note = rowNote(occurrence);
                if (note) {
                    const p = document.createElement('p');
                    p.className = 'lesson-detail__ex-note';
                    p.textContent = note;
                    li.appendChild(p);
                }

                const actions = document.createElement('div');
                actions.className = 'lesson-detail__ex-actions';

                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'lesson-detail__link';
                toggle.textContent = open.has(occurrence.id)
                    ? t('lesson.exercise.notesHide')
                    : t('lesson.exercise.notesShow');
                toggle.onclick = () => this.toggleNotes(occurrence.id);
                actions.appendChild(toggle);

                const href = historyHref(lesson.studentId, occurrence.exerciseId, lesson.id);
                const history = document.createElement('a');
                history.className = 'lesson-detail__link';
                history.href = href;
                history.textContent = t('lesson.exercise.history');
                history.onclick = (e) => { e.preventDefault(); this.router.navigate(href); };
                actions.appendChild(history);

                // Withheld, not disabled: past a terminal transition the server
                // answers 409 for this call, and a control that can only fail is
                // worse than no control.
                if (controls.editExercises) {
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'lesson-detail__link lesson-detail__link--danger';
                    remove.textContent = t('lesson.exercise.remove');
                    remove.onclick = () => void this.removeExercise(occurrence.exerciseId, occurrence.name);
                    actions.appendChild(remove);
                }
                li.appendChild(actions);

                if (open.has(occurrence.id)) {
                    const threadHost = document.createElement('div');
                    li.appendChild(threadHost);
                    threads.mount(threadHost, this.exerciseThread(occurrence.id, occurrence.name));
                }

                host.appendChild(li);
            }
        }));
    }

    private toggleNotes(id: string): void {
        const next = new Set(this.openNotes.get());
        if (next.has(id)) next.delete(id);
        else next.add(id);
        this.openNotes.set(next);
    }

    // ─── Mutations ──────────────────────────────────────────────

    private async saveDetails(e: Event): Promise<void> {
        e.preventDefault();
        const lesson = this.lesson();
        if (!lesson) return;
        const patch: { horseId?: string | null; planId?: string | null; scheduledAt?: string } = {};
        const horseId = this.horseVal.get();
        const planId = this.planVal.get();
        const when = this.whenVal.get();
        if (horseId !== (lesson.horseId ?? '')) patch.horseId = horseId === '' ? null : horseId;
        if (planId !== (lesson.planId ?? '')) patch.planId = planId === '' ? null : planId;
        if (when) {
            const iso = fromLocalInput(when);
            if (iso !== lesson.scheduledAt) patch.scheduledAt = iso;
        }
        if (Object.keys(patch).length === 0) return;
        // Reschedule, horse and plan stay open after a terminal transition —
        // a lesson recorded on the wrong horse must remain correctable.
        const updated = await this.svc.update(lesson.id, patch);
        if (updated) this.toasts.show({ message: t('lesson.saved'), variant: 'success' });
    }

    private async transition(target: 'completed' | 'cancelled'): Promise<void> {
        const lesson = this.lesson();
        if (!lesson) return;
        const result = await this.svc.transition(lesson.id, target);
        if (!result) return;
        // No undo action on this toast: the transition is terminal, and §4.12
        // reserves Ångra for what can actually be taken back. The dialog is
        // where this decision was made reversible — before it was taken.
        this.toasts.show({
            message: target === 'completed' ? t('lesson.toast.completed') : t('lesson.toast.cancelled'),
            variant: 'success',
        });
    }

    private async addExercise(): Promise<void> {
        const lesson = this.lesson();
        const exerciseId = this.exerciseVal.get();
        if (!lesson || !exerciseId) return;
        const result = await this.svc.addExercise(lesson.id, exerciseId);
        if (result) this.exerciseVal.set('');
    }

    private async removeExercise(exerciseId: string, name: string): Promise<void> {
        const lesson = this.lesson();
        if (!lesson) return;
        const result = await this.svc.removeExercise(lesson.id, exerciseId);
        if (!result) return;
        // Recoverable, so it gets an undo toast rather than a dialog (§4.12).
        // ToastService gives an action-bearing toast 8s by default, which is
        // the countdown the spec shows.
        this.toasts.show({
            message: t('lesson.toast.exerciseRemoved', { name }),
            action: {
                label: t('lesson.toast.undo'),
                onclick: () => void this.svc.addExercise(lesson.id, exerciseId),
            },
        });
    }

    private async attachProgram(): Promise<void> {
        const lesson = this.lesson();
        const programId = this.programVal.get();
        if (!lesson || !programId) return;
        const result = await this.svc.attachProgram(lesson.id, programId);
        if (result) this.programVal.set('');
    }

    private async detachProgram(programId: string, title: string): Promise<void> {
        const lesson = this.lesson();
        if (!lesson) return;
        const result = await this.svc.detachProgram(lesson.id, programId);
        if (!result) return;
        // The toast is the second place the copy semantics are stated — the
        // first is the section hint, above the control. Detaching removes the
        // label, not the Exercises it copied in.
        this.toasts.show({
            message: t('lesson.toast.programDetached', { title }),
            action: {
                label: t('lesson.toast.undo'),
                onclick: () => void this.svc.attachProgram(lesson.id, programId),
            },
        });
    }
}
