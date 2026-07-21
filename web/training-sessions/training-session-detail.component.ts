import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { plural, t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { DetailHeaderComponent, type DetailHeaderChip } from '../ui/detail-header.component';
import { ThreadPool, mountThread, type NoteThreadProps } from '../ui/note-thread.component';
import type { ShareRecipient } from '../ui/share-chip.component';
import type { PersonRole } from '../ui/person-marker.component';
import { TrainingSessionsService } from './training-sessions.service';
import { TeachersService } from './teachers.service';
import { StableService } from '../stable/stable.service';
import { PlansService } from '../plans/plans.service';
import {
    durationLabel,
    exerciseSource,
    groupByTeacher,
    isConflict,
    loggableHorses,
    loggablePlans,
    orderedExercises,
    ownerRecipients,
    planChipLabel,
    programChipLabel,
    rowNote,
    sessionTitle,
    sessionWhen,
    sharedTeacherRecipients,
    shouldCommitSharing,
    trainingSessionControls,
    unsharedProgramOwners,
    type TrainingSessionControls,
} from './training-session-copy';
import { api, type Exercise, type Program, type TrainingSession } from '../api';

const tpl = template(`
    <div class="session-detail" bind="root">
        <a bind="back" href="/traningspass" class="session-detail__back"></a>
        <p bind="loading" class="session-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="session-detail__body">
            <div bind="headerHost"></div>

            <div bind="conflict" class="session-detail__conflict" role="alert">
                <p bind="conflictText" class="session-detail__conflict-text"></p>
                <button bind="conflictRetry" type="button" class="session-detail__conflict-action"></button>
            </div>

            <section bind="detailsSection" class="session-detail__section">
                <h2 bind="detailsHeading" class="session-detail__heading"></h2>
                <form bind="detailsForm" class="session-detail__form">
                    <div class="session-detail__pair">
                        <label class="session-detail__field">
                            <span bind="whenLabel" class="session-detail__label"></span>
                            <input bind="whenInput" type="datetime-local" class="session-detail__input" required>
                        </label>
                        <label class="session-detail__field">
                            <span bind="durationLabel" class="session-detail__label"></span>
                            <input bind="durationInput" type="number" min="0" step="1" class="session-detail__input">
                        </label>
                    </div>
                    <div class="session-detail__pair">
                        <label bind="horseField" class="session-detail__field">
                            <span bind="horseLabel" class="session-detail__label"></span>
                            <div bind="horseHost" class="session-detail__control"></div>
                        </label>
                        <label bind="planField" class="session-detail__field">
                            <span bind="planLabel" class="session-detail__label"></span>
                            <div bind="planHost" class="session-detail__control"></div>
                        </label>
                    </div>
                    <label class="session-detail__field">
                        <span bind="summaryLabel" class="session-detail__label"></span>
                        <textarea bind="summaryInput" rows="5" class="session-detail__textarea"></textarea>
                    </label>
                    <p bind="detailsError" class="session-detail__field-error" role="alert"></p>
                    <div class="session-detail__row">
                        <button bind="save" type="submit" class="session-detail__save"></button>
                    </div>
                </form>
            </section>

            <section bind="readSummarySection" class="session-detail__section">
                <h2 bind="readSummaryHeading" class="session-detail__heading"></h2>
                <p bind="readSummary" class="session-detail__summary"></p>
                <p bind="readSummaryEmpty" class="session-detail__muted"></p>
            </section>

            <section bind="sharingSection" class="session-detail__section">
                <h2 bind="sharingHeading" class="session-detail__heading"></h2>
                <p bind="sharingHint" class="session-detail__hint"></p>
                <p bind="sharingNone" class="session-detail__muted"></p>
                <label bind="shareSingle" class="session-detail__check">
                    <input bind="shareSingleInput" type="checkbox">
                    <span bind="shareSingleLabel"></span>
                </label>
                <div bind="shareMulti" class="session-detail__control"></div>
                <div bind="offer" class="session-detail__offer">
                    <p bind="offerText" class="session-detail__offer-text"></p>
                    <button bind="offerAction" type="button" class="session-detail__offer-button"></button>
                </div>
            </section>

            <section bind="programsSection" class="session-detail__section">
                <h2 bind="programsHeading" class="session-detail__heading"></h2>
                <p bind="programsHint" class="session-detail__hint"></p>
                <ul bind="programList" class="session-detail__prog-list"></ul>
                <p bind="programsEmpty" class="session-detail__muted"></p>
                <div bind="programAdd" class="session-detail__row">
                    <div bind="programHost" class="session-detail__control session-detail__control--grow"></div>
                    <button bind="attachProgram" type="button" class="session-detail__secondary"></button>
                </div>
            </section>

            <section class="session-detail__section">
                <h2 bind="exercisesHeading" class="session-detail__heading"></h2>
                <ol bind="exerciseList" class="session-detail__ex-list"></ol>
                <p bind="exercisesEmpty" class="session-detail__muted"></p>
                <div bind="exerciseAdd" class="session-detail__row">
                    <div bind="exerciseHost" class="session-detail__control session-detail__control--grow"></div>
                    <button bind="addExercise" type="button" class="session-detail__secondary"></button>
                </div>
            </section>

            <section class="session-detail__section">
                <div bind="notesHost"></div>
            </section>
        </div>

        <div bind="confirmDeleteHost"></div>
        <div bind="confirmRemoveHost"></div>
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
 * Träningspass — IA §3.10. The Lektion detail with authorship reversed: the
 * **Student owns the structure**, and explicitly shared **Teachers read and
 * respond**.
 *
 * The information order is the specification's: header, summary, Program
 * sources, ordered Exercise occurrences with their static Row notes, a Note
 * thread per occurrence, then the session-level thread. Both roles walk the same
 * page in the same order — what differs is which controls exist on it.
 *
 * **Controls are withheld, never disabled.** A shared Teacher gets no editing of
 * metadata, sharing, Programs or Exercises, because the server refuses those
 * calls outright (`assertTrainingSessionOwner` answers NotFoundError, not 403 —
 * it will not even confirm the session is editable by someone). A greyed-out
 * button would advertise a capability the API declines to have, so
 * `trainingSessionControls` decides what is built at all, and the rules live in
 * a tested module rather than in these class names.
 *
 * **No Exercise history link.** IA §3.10 is explicit that Training Session
 * occurrences are not part of the history backend today, so the occurrence rows
 * deliberately carry no history affordance — unlike Lektion detail, which does.
 * Implying a walk that dead-ends is worse than not offering it.
 */
export class TrainingSessionDetailComponent extends Component {
    static styles = `
        .session-detail {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            font-family: ${token('font-ui')};

            & .session-detail__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }
            & .session-detail__back.hidden { display: none; }

            & .session-detail__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .session-detail__loading.hidden { display: none; }

            & .session-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xl')};
            }
            & .session-detail__body.hidden { display: none; }

            & .session-detail__conflict {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('md')};
                padding: ${s('md')};
                border: 1px solid ${token('warning')};
                border-radius: ${token('radius-md')};
                background: ${token('warning-soft')};

                & .session-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${token('text')};
                    max-width: 68ch;
                }
                & .session-detail__conflict-action {
                    ${btn()}
                }
            }
            & .session-detail__conflict.hidden { display: none; }

            & .session-detail__section { display: flex; flex-direction: column; gap: ${s('md')}; }
            & .session-detail__section.hidden { display: none; }

            /* Section headings are the second permitted serif use (20/28), and
               weight 500 like every other Lora run in this app. */
            & .session-detail__heading {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .session-detail__hint, & .session-detail__muted {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .session-detail__muted.hidden { display: none; }
            & .session-detail__hint.hidden { display: none; }

            /* The Student's own words, read at a reading measure and never
               clamped — this is the text the whole occasion is about. */
            & .session-detail__summary {
                margin: 0;
                white-space: pre-wrap;
                font-size: 0.9375rem;
                line-height: 1.7;
                color: ${token('text')};
                max-width: 68ch;
            }
            & .session-detail__summary.hidden { display: none; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them.
             */
            & .session-detail__form {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                max-width: 34rem;
            }
            & .session-detail__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${s('md')};
            }
            & .session-detail__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .session-detail__field.hidden { display: none; }
            & .session-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .session-detail__input, & .session-detail__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .session-detail__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }
            & .session-detail__field-error {
                margin: 0;
                min-height: 1em;
                font-size: 0.8125rem;
                color: ${token('danger')};
            }
            & .session-detail__control .ui-select { display: block; }
            & .session-detail__control--grow { flex: 1; min-width: 0; }
            & .session-detail__control.hidden { display: none; }
            /* The sharing picker is a form control, so it keeps the form's
               measure instead of stretching to the full content width. */
            & .session-detail__section > .session-detail__control { max-width: 34rem; }

            & .session-detail__check {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                font-size: 0.875rem;
                color: ${token('text')};
                cursor: pointer;
            }
            & .session-detail__check.hidden { display: none; }
            & .session-detail__check input { accent-color: ${token('accent')}; }

            /* The offer to share with an attached Program's owner. */
            & .session-detail__offer {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                background: ${token('surface-2')};

                & .session-detail__offer-text {
                    margin: 0;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    color: ${token('text')};
                    max-width: 68ch;
                }
                & .session-detail__offer-button {
                    ${btn()}
                    font-size: 0.8125rem;
                }
            }
            & .session-detail__offer.hidden { display: none; }

            & .session-detail__row {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-wrap: wrap;
            }
            & .session-detail__row.hidden { display: none; }
            /*
             * Selects in a row on the page, not inside the form panel, keep a
             * raised --surface fill — the recessed --bg fill is only legible
             * against a card.
             */
            & .session-detail__row .ui-select__trigger { background: ${token('surface')}; }

            & .session-detail__save {
                ${btn()}
                background: ${token('accent')};
                color: ${token('on-accent')};
                border: 1px solid ${token('accent')};
            }
            & .session-detail__secondary {
                    ${btn()}
                }
            & .session-detail__save:focus-visible,
            & .session-detail__secondary:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }

            & .session-detail__prog-list, & .session-detail__ex-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
            }
            & .session-detail__prog-list { gap: ${s('xs')}; }
            & .session-detail__ex-list {
                border-top: 1px solid ${token('border')};
                counter-reset: occurrence;
            }
            & .session-detail__ex-list:empty { border-top: none; }
            & .session-detail__ex-item {
                border-bottom: 1px solid ${token('border')};
                padding: ${s('md')} 0;
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .session-detail__prog-item {
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

            & .session-detail__ex-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('md')};
                flex-wrap: wrap;
            }
            & .session-detail__ex-name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
            }
            /* Performed order is data, so the ordinal is generated rather than
               typed into the name. */
            & .session-detail__ex-name::before {
                counter-increment: occurrence;
                content: counter(occurrence) ". ";
                color: ${token('text-muted')};
                font-variant-numeric: tabular-nums;
            }
            & .session-detail__ex-source {
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
            & .session-detail__ex-note {
                margin: 0;
                padding-left: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${token('text')};
                max-width: 68ch;
            }
            & .session-detail__ex-actions {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
            }
            & .session-detail__link {
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
            & .session-detail__link--danger { color: ${token('danger')}; }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .session-detail__pair { grid-template-columns: 1fr; }
                & .session-detail__row { align-items: stretch; }
            }
        }
    `;

    private router = this.inject(Router);
    private auth = this.inject(AuthService);
    private svc = this.inject(TrainingSessionsService);
    private teachers = this.inject(TeachersService);
    private stable = this.inject(StableService);
    private plans = this.inject(PlansService);
    private toasts = this.inject(ToastService);

    private resolved = new Signal(false);
    private found = new Signal(true);
    private catalog = new Signal<Exercise[]>([]);
    private programCatalog = new Signal<Program[]>([]);
    private whenVal = new Signal('');
    private durationVal = new Signal('');
    private summaryVal = new Signal('');
    private horseVal = new Signal('');
    private planVal = new Signal('');
    private programVal = new Signal('');
    private exerciseVal = new Signal('');
    private shareVals = new Signal<string[]>([]);
    private detailsError = new Signal('');
    private openNotes = new Signal<Set<string>>(new Set());
    private confirmDelete = new Signal(false);
    private confirmRemove = new Signal(false);
    /** The occurrence a remove was requested for, held while the dialog is up. */
    private pendingRemoval = new Signal<{ exerciseId: string; name: string } | null>(null);
    /** The owning Student's display name, for a Teacher reading their log. */
    private studentName = new Signal('');
    /**
     * Whether the audience names have been resolved.
     *
     * The names arrive on a SECOND request than `sharedWithTeacherIds`; mounting
     * a thread before they land renders every shared note as `Delad: okänd
     * mottagare` and tells the author they have nobody to share with. Worse, the
     * chip would briefly assert `Privat` about something that is in fact shared.
     * The trust surface waits for the answer rather than guessing.
     */
    private recipientsResolved = new Signal(false);
    /**
     * Whether `shareVals` has been filled from the loaded session.
     *
     * Until it has, its `[]` is not an audience the user chose — it is the
     * signal's initial value, and the commit effect must not read it as an edit.
     * See `shouldCommitSharing` for why the Teacher-count guard does not cover
     * this on the normal navigation path.
     */
    private shareSeeded = new Signal(false);

    private sessionId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    private session(): TrainingSession | null {
        return this.svc.get(this.sessionId());
    }

    /**
     * Ownership is a per-session fact, not an account type (IA §1): the same
     * person owns this log and reads someone else's as a Teacher.
     */
    private viewer = new Computed<'owner' | 'sharedTeacher'>(() => {
        const session = this.session();
        const me = this.auth.currentUser.get()?.id;
        return session && me && session.studentId === me ? 'owner' : 'sharedTeacher';
    });

    /**
     * The control matrix. Every `hidden` class below reads from here rather than
     * testing ownership inline, so the rules live in one tested place.
     */
    private controls = new Computed<TrainingSessionControls>(() =>
        trainingSessionControls(this.viewer.get()));

    private conflicted = new Computed(() => isConflict(this.svc.error.get()));

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
     * §4.9: grouped by owning Teacher, and already-attached Programs excluded —
     * an option that would do nothing is not an option.
     */
    private programOptions = new Computed<SelectOption[]>(() =>
        groupByTeacher(
            this.programCatalog.get(),
            this.teachers.items.get(),
            (program) => program.title,
            new Set((this.session()?.programs ?? []).map((p) => p.id)),
        ));
    private exerciseOptions = new Computed<SelectOption[]>(() =>
        groupByTeacher(
            this.catalog.get(),
            this.teachers.items.get(),
            (exercise) => exercise.name,
            new Set((this.session()?.exercises ?? []).map((e) => e.exerciseId)),
        ));
    private teacherOptions = new Computed<SelectOption[]>(() =>
        this.teachers.items.get().map((teacher) => ({ value: teacher.id, label: teacher.displayName })),
    );
    private teacherCount = new Computed(() => this.teachers.items.get().length);

    /** Owners of attached Programs who cannot see this session (IA §3.10). */
    private pendingOwners = new Computed(() => unsharedProgramOwners(
        this.session()?.programs ?? [],
        this.programCatalog.get(),
        this.shareVals.get(),
        this.teachers.items.get(),
    ));

    onMount(): void {
        void this.resolve();
    }

    private async resolve(): Promise<void> {
        // Re-resolving (the conflict retry) re-seeds from the server, so the
        // effect goes inert again for the same reason it starts inert.
        this.shareSeeded.set(false);
        const session = await this.svc.loadOne(this.sessionId());
        if (!session) {
            // 404 covers missing, not-yours and not-shared-with-you, identically.
            this.found.set(false);
            this.resolved.set(true);
            return;
        }
        this.whenVal.set(toLocalInput(session.performedAt));
        this.durationVal.set(session.durationMin === null ? '' : String(session.durationMin));
        this.summaryVal.set(session.summary ?? '');
        this.horseVal.set(session.horseId ?? '');
        this.planVal.set(session.planId ?? '');
        this.shareVals.set([...session.sharedWithTeacherIds]);
        this.shareSeeded.set(true);
        this.found.set(true);
        this.resolved.set(true);

        const me = this.auth.currentUser.get()?.id;
        if (me && session.studentId === me) {
            // Only the owner can act on this session's structure, so only the
            // owner pays for the pickers' data.
            const [exercises, programs] = await Promise.all([
                api.exercises.listForStudent().catch(() => [] as Exercise[]),
                api.programs.listForStudent().catch(() => [] as Program[]),
                this.teachers.load(),
                this.stable.load(),
                this.plans.load(),
            ]);
            this.catalog.set(exercises);
            this.programCatalog.set(programs);
        } else {
            // A shared Teacher writes to the Student whose log this is, so that
            // one name is what the composer's Delad option must state.
            const student = await api.students.get({ id: session.studentId }).catch(() => null);
            this.studentName.set(student?.displayName ?? '');
        }
        this.recipientsResolved.set(true);
    }

    // ─── Sharing and note recipients ────────────────────────────

    /**
     * Who can see this session, named (§4.5). The two roles answer this from
     * different knowledge, so they resolve it differently — see
     * `sharedTeacherRecipients` for why a Teacher names only themselves.
     */
    private audience(): ShareRecipient[] {
        const session = this.session();
        if (!session) return [];
        if (this.viewer.get() === 'owner') {
            return ownerRecipients(session.sharedWithTeacherIds, this.teachers.items.get());
        }
        return sharedTeacherRecipients(
            session.sharedWithTeacherIds,
            this.auth.currentUser.get()?.id ?? '',
            t('trainingSession.share.you'),
        );
    }

    /**
     * Who a note written here reaches. Not the same question as `audience()`: the
     * owner writes *to* their Teachers, and a Teacher writes *to* the Student
     * whose log this is — who is the owner, and never in the share set.
     */
    private noteRecipients(): ShareRecipient[] {
        const session = this.session();
        if (!session) return [];
        if (this.viewer.get() === 'owner') {
            return ownerRecipients(session.sharedWithTeacherIds, this.teachers.items.get());
        }
        return [{ id: session.studentId, name: this.studentName.get() }];
    }

    /** On a Training Session the owner is the Student; anyone else is a Teacher. */
    private roleOf = (authorId: string): PersonRole =>
        authorId === this.session()?.studentId ? 'student' : 'teacher';

    private exerciseThread(occurrenceId: string, name: string): NoteThreadProps {
        return {
            parentKind: 'training_session_exercise',
            parentId: occurrenceId,
            context: () => [t('objectKind.exercise'), name].join(' · '),
            recipients: () => this.noteRecipients(),
            roleOf: (note) => this.roleOf(note.authorId),
            headingLevel: 4,
        };
    }

    /** 'Träningspass · Tisdag 14 juli · 19:32 · Luna' — the §4.7 context row. */
    private sessionContext(): string {
        const session = this.session();
        if (!session) return t('objectKind.trainingSession');
        return [t('objectKind.trainingSession'), sessionWhen(session.performedAt), session.horseName]
            .filter(Boolean).join(' · ');
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                ...this.router.link('/traningspass'),
                textContent: () => t('trainingSession.back'),
                className: () => this.resolved.get() && !this.found.get()
                    ? 'session-detail__back hidden' : 'session-detail__back',
            },
            loading: {
                textContent: () => t('trainingSession.loading'),
                className: () => this.resolved.get()
                    ? 'session-detail__loading hidden' : 'session-detail__loading',
            },
            body: {
                className: () => this.resolved.get() && this.found.get()
                    ? 'session-detail__body' : 'session-detail__body hidden',
            },
            conflict: {
                className: () => this.conflicted.get()
                    ? 'session-detail__conflict' : 'session-detail__conflict hidden',
            },
            conflictText: { textContent: () => t('trainingSession.conflict.message') },
            conflictRetry: {
                textContent: () => t('trainingSession.conflict.action'),
                onclick: () => void this.resolve(),
            },

            // ─ Uppgifter (owner) ─
            detailsSection: {
                className: () => this.controls.get().editDetails
                    ? 'session-detail__section' : 'session-detail__section hidden',
            },
            detailsHeading: { textContent: () => t('trainingSession.section.details') },
            whenLabel: { textContent: () => t('trainingSession.field.when') },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            durationLabel: { textContent: () => t('trainingSession.field.duration') },
            durationInput: {
                value: () => this.durationVal.get(),
                oninput: (e: Event) => this.durationVal.set((e.target as HTMLInputElement).value),
            },
            horseField: {
                className: () => this.horses.get().length === 0
                    ? 'session-detail__field hidden' : 'session-detail__field',
            },
            horseLabel: { textContent: () => t('trainingSession.field.horse') },
            planField: {
                className: () => this.activePlans.get().length === 0
                    ? 'session-detail__field hidden' : 'session-detail__field',
            },
            planLabel: { textContent: () => t('trainingSession.field.plan') },
            summaryLabel: { textContent: () => t('trainingSession.field.summary') },
            summaryInput: {
                value: () => this.summaryVal.get(),
                oninput: (e: Event) => this.summaryVal.set((e.target as HTMLTextAreaElement).value),
            },
            detailsError: { textContent: () => this.detailsError.get() },
            save: { textContent: () => t('trainingSession.save') },
            detailsForm: { onsubmit: (e: Event) => void this.saveDetails(e) },

            // ─ Sammanfattning (shared Teacher reads it; the owner edits it above) ─
            readSummarySection: {
                className: () => this.controls.get().editDetails
                    ? 'session-detail__section hidden' : 'session-detail__section',
            },
            readSummaryHeading: { textContent: () => t('trainingSession.section.summary') },
            readSummary: {
                textContent: () => this.session()?.summary ?? '',
                className: () => this.session()?.summary
                    ? 'session-detail__summary' : 'session-detail__summary hidden',
            },
            readSummaryEmpty: {
                textContent: () => t('trainingSession.summary.empty'),
                className: () => this.session()?.summary
                    ? 'session-detail__muted hidden' : 'session-detail__muted',
            },

            // ─ Delning (owner) ─
            sharingSection: {
                className: () => this.controls.get().editSharing
                    ? 'session-detail__section' : 'session-detail__section hidden',
            },
            sharingHeading: { textContent: () => t('trainingSession.section.sharing') },
            sharingHint: {
                textContent: () => t('trainingSession.sharing.hint'),
                className: () => this.teacherCount.get() === 0
                    ? 'session-detail__hint hidden' : 'session-detail__hint',
            },
            sharingNone: {
                textContent: () => t('trainingSession.sharing.none'),
                className: () => this.teacherCount.get() === 0
                    ? 'session-detail__muted' : 'session-detail__muted hidden',
            },
            shareSingle: {
                className: () => this.teacherCount.get() === 1
                    ? 'session-detail__check' : 'session-detail__check hidden',
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
                    void this.saveSharing((e.target as HTMLInputElement).checked ? [only.id] : []);
                },
            },
            shareMulti: {
                className: () => this.teacherCount.get() > 1
                    ? 'session-detail__control' : 'session-detail__control hidden',
            },
            offer: {
                className: () => this.pendingOwners.get().length > 0
                    ? 'session-detail__offer' : 'session-detail__offer hidden',
            },
            offerText: {
                textContent: () => {
                    const owner = this.pendingOwners.get()[0];
                    return owner ? t('trainingSession.programOffer', { name: owner.displayName }) : '';
                },
            },
            offerAction: {
                textContent: () => {
                    const owner = this.pendingOwners.get()[0];
                    return owner ? t('trainingSession.programOffer.action', { name: owner.displayName }) : '';
                },
                onclick: () => {
                    const owner = this.pendingOwners.get()[0];
                    if (!owner) return;
                    void this.saveSharing([...new Set([...this.shareVals.get(), owner.id])]);
                },
            },

            // ─ Program ─
            programsSection: {
                className: () => 'session-detail__section',
            },
            programsHeading: { textContent: () => t('trainingSession.section.programs') },
            programsHint: {
                textContent: () => t('trainingSession.programs.detachHint'),
                className: () => this.controls.get().editPrograms
                    ? 'session-detail__hint' : 'session-detail__hint hidden',
            },
            programsEmpty: {
                textContent: () => t('trainingSession.programs.empty'),
                className: () => (this.session()?.programs.length ?? 0) === 0
                    ? 'session-detail__muted' : 'session-detail__muted hidden',
            },
            programAdd: {
                className: () => this.controls.get().editPrograms
                    ? 'session-detail__row' : 'session-detail__row hidden',
            },
            attachProgram: {
                textContent: () => t('trainingSession.programs.attach'),
                onclick: () => void this.attachProgram(),
            },

            // ─ Övningar ─
            exercisesHeading: { textContent: () => t('trainingSession.section.exercises') },
            exercisesEmpty: {
                textContent: () => t('trainingSession.exercises.empty'),
                className: () => (this.session()?.exercises.length ?? 0) === 0
                    ? 'session-detail__muted' : 'session-detail__muted hidden',
            },
            exerciseAdd: {
                className: () => this.controls.get().editExercises
                    ? 'session-detail__row' : 'session-detail__row hidden',
            },
            addExercise: {
                textContent: () => t('trainingSession.exercise.add'),
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
            placeholder: t('trainingSession.programs.placeholder'),
        });
        this.spawn(SelectComponent, this.ref(frag, 'exerciseHost'), {
            value: this.exerciseVal,
            options: this.exerciseOptions,
            placeholder: t('trainingSession.exercise.placeholder'),
        });
        this.spawn(SelectComponent, this.ref(frag, 'shareMulti'), {
            multiple: true,
            values: this.shareVals,
            options: this.teacherOptions,
            placeholder: t('trainingSession.sharing.placeholder'),
            countLabel: (n: number) => plural('trainingSession.sharing.count', n),
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

        /*
         * The multi-select writes `shareVals` directly, so the save is driven off
         * the signal rather than off a change handler this component does not own.
         *
         * The comparison is against what the SERVER currently says, not against
         * the signal's previous value. Tracking the previous value looks
         * equivalent and is not: `resolve()` fills `shareVals` from the loaded
         * session asynchronously, *after* this effect's first run, so a
         * previous-value check reads that as a user edit and PATCHes the session
         * back to what it already said — a write and a "Delningen är uppdaterad"
         * toast on every page load. Comparing to the session makes the effect
         * idempotent and self-settling: a successful write updates the session,
         * the effect re-runs, the sets match, and it stops.
         *
         * Comparing to the session is necessary but NOT sufficient, which is why
         * the seed flag exists too — `shouldCommitSharing` documents the window
         * it closes. Every signal is read before the predicate so the effect's
         * dependency set does not depend on which guard fires.
         */
        this.track(effect(() => {
            const session = this.session();
            const next = this.shareVals.get();
            const seeded = this.shareSeeded.get();
            const teacherCount = this.teacherCount.get();
            if (!session) return;
            if (!shouldCommitSharing({
                seeded,
                teacherCount,
                next,
                stored: session.sharedWithTeacherIds,
            })) return;
            untrack(() => void this.commitSharing(next));
        }));

        // §4.12: a dialog BEFORE an irreversible action, stating the consequence.
        // "Är du säker?" without a consequence is on the spec's Undvik list.
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmDeleteHost'), {
            open: this.confirmDelete,
            title: t('trainingSession.confirm.delete.title'),
            message: () => t('trainingSession.confirm.delete.message'),
            confirmLabel: t('trainingSession.action.delete'),
            cancelLabel: t('trainingSession.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.remove(),
        });

        /*
         * Removing an occurrence gets a dialog, NOT an undo toast.
         *
         * `removeExercise` deletes the junction row; re-adding through
         * `addExercise` inserts a fresh one at the END with `notes: null` and
         * `source_program_id: null`. So an "Ångra" here would silently drop the
         * static Row note and the Program provenance, and move the occurrence out
         * of its performed order — an undo that does not undo. §4.12 reserves
         * Ångra for what can actually be taken back, so the reversibility is
         * offered BEFORE the action instead, with the loss named.
         *
         * The occurrence's name goes in `message`, not in `title`: `title` is a
         * plain string evaluated once when this dialog is built, so a `{name}`
         * placeholder there would render literally. `message` is a thunk and
         * re-reads `pendingRemoval` each time the dialog opens.
         */
        this.spawn(ConfirmComponent, this.ref(frag, 'confirmRemoveHost'), {
            open: this.confirmRemove,
            title: t('trainingSession.confirm.removeExercise.title'),
            message: () => {
                const pending = this.pendingRemoval.get();
                return pending
                    ? t('trainingSession.confirm.removeExercise.message', { name: pending.name })
                    : '';
            },
            confirmLabel: t('trainingSession.exercise.remove'),
            cancelLabel: t('trainingSession.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.removeExercise(),
            oncancel: () => this.pendingRemoval.set(null),
        });

        // Notes are the one thing both roles do — this is the feedback loop the
        // whole sharing mechanism exists to run.
        mountThread(this.ref(frag, 'notesHost'), () => {
            const session = this.session();
            if (!session || !this.recipientsResolved.get()) return null;
            return {
                parentKind: 'training_session',
                parentId: session.id,
                context: () => this.sessionContext(),
                recipients: () => this.noteRecipients(),
                roleOf: (note) => this.roleOf(note.authorId),
            };
        }, (d) => this.track(d));

        return frag;
    }

    // ─── Header ─────────────────────────────────────────────────

    private buildHeader(host: HTMLElement): void {
        this.spawn(DetailHeaderComponent, host, {
            eyebrow: () => t('objectKind.trainingSession'),
            title: () => {
                const session = this.session();
                return session ? sessionTitle(session) : t('trainingSession.title.plain');
            },
            // Parent chips ARE the walk upward: the Plan, and each source Program.
            chips: () => this.headerChips(),
            // The audience, named (§4.5). Held back until the names resolve so
            // the trust surface never briefly asserts the wrong thing.
            recipients: () => this.recipientsResolved.get() ? this.audience() : [],
            shared: () => this.recipientsResolved.get()
                && (this.session()?.sharedWithTeacherIds.length ?? 0) > 0,
            // IA §3.10 header order: performed date/time, duration, horse.
            // The plan and the audience are chips, one line up.
            meta: () => {
                const session = this.session();
                if (!session) return '';
                return [
                    sessionWhen(session.performedAt),
                    durationLabel(session.durationMin),
                    session.horseName,
                ].filter(Boolean).join(' · ');
            },
            // Delete is destructive and rare — it belongs in the ⋯ overflow at
            // every width, not beside the things a person came here to do. A
            // shared Teacher has no entry here at all.
            overflowActions: () => this.controls.get().remove
                ? [{ label: t('trainingSession.action.delete'), onclick: () => this.confirmDelete.set(true) }]
                : [],
        });
    }

    private headerChips(): DetailHeaderChip[] {
        const session = this.session();
        if (!session) return [];
        const chips: DetailHeaderChip[] = [];
        if (session.planId && session.planTitle) {
            chips.push({ label: planChipLabel(session.planTitle), href: `/planer/${session.planId}` });
        }
        for (const program of session.programs) {
            chips.push({ label: programChipLabel(program), href: `/program/${program.id}` });
        }
        return chips;
    }

    /**
     * Missing, not-yours and not-shared-with-you render identically, with one
     * exit. Distinguishing them would leak the existence of other people's
     * sessions that the API deliberately does not.
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
                    heading: () => t('trainingSession.notFound.heading'),
                    body: () => t('trainingSession.notFound.body'),
                    action: {
                        label: () => t('trainingSession.notFound.action'),
                        onclick: () => this.router.navigate('/traningspass'),
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
            const session = this.session();
            const controls = this.controls.get();
            host.replaceChildren();
            for (const program of session?.programs ?? []) {
                const li = document.createElement('li');
                li.className = 'session-detail__prog-item';
                const label = document.createElement('span');
                label.textContent = program.title;
                li.appendChild(label);
                // Withheld by construction: the enclosing row is also hidden for
                // a shared Teacher, but the button must not exist in the first
                // place rather than depend on an ancestor's class for its safety.
                if (controls.editPrograms) {
                    const detach = document.createElement('button');
                    detach.type = 'button';
                    detach.className = 'session-detail__link session-detail__link--danger';
                    detach.textContent = t('trainingSession.programs.detach');
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
            const session = this.session();
            const open = this.openNotes.get();
            const controls = this.controls.get();
            // Every generation is rebuilt wholesale, so the previous one's
            // threads are destroyed first — see ThreadPool's docs for why
            // spawn() cannot own these.
            threads.reset();
            host.replaceChildren();
            if (!session) return;

            for (const occurrence of orderedExercises(session.exercises)) {
                const li = document.createElement('li');
                li.className = 'session-detail__ex-item';

                const head = document.createElement('div');
                head.className = 'session-detail__ex-head';
                const name = document.createElement('span');
                name.className = 'session-detail__ex-name';
                name.textContent = occurrence.name;
                head.appendChild(name);
                const source = exerciseSource(occurrence, session.programs);
                if (source) {
                    const chip = document.createElement('span');
                    chip.className = 'session-detail__ex-source';
                    chip.textContent = source;
                    head.appendChild(chip);
                }
                li.appendChild(head);

                // The static Row note — copied from the source Program, and
                // renderable at last: the column was written but never projected.
                const note = rowNote(occurrence);
                if (note) {
                    const p = document.createElement('p');
                    p.className = 'session-detail__ex-note';
                    p.textContent = note;
                    li.appendChild(p);
                }

                const actions = document.createElement('div');
                actions.className = 'session-detail__ex-actions';

                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'session-detail__link';
                toggle.textContent = open.has(occurrence.id)
                    ? t('trainingSession.exercise.notesHide')
                    : t('trainingSession.exercise.notesShow');
                toggle.onclick = () => this.toggleNotes(occurrence.id);
                actions.appendChild(toggle);

                // No Exercise-history link here — IA §3.10 says Training Session
                // occurrences are not in the history backend, so offering the
                // walk would promise a page that cannot answer.

                if (controls.editExercises) {
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'session-detail__link session-detail__link--danger';
                    remove.textContent = t('trainingSession.exercise.remove');
                    remove.onclick = () => {
                        this.pendingRemoval.set({
                            exerciseId: occurrence.exerciseId,
                            name: occurrence.name,
                        });
                        this.confirmRemove.set(true);
                    };
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
        const session = this.session();
        if (!session) return;

        const durationRaw = this.durationVal.get().trim();
        let durationMin: number | null = null;
        if (durationRaw !== '') {
            const parsed = Number(durationRaw);
            if (!Number.isInteger(parsed) || parsed < 0) {
                this.detailsError.set(t('trainingSessionCreate.error.duration'));
                return;
            }
            durationMin = parsed;
        }
        this.detailsError.set('');

        const patch: {
            performedAt?: string;
            durationMin?: number | null;
            summary?: string | null;
            horseId?: string | null;
            planId?: string | null;
        } = {};
        const when = this.whenVal.get();
        if (when) {
            const iso = fromLocalInput(when);
            if (iso !== session.performedAt) patch.performedAt = iso;
        }
        if (durationMin !== session.durationMin) patch.durationMin = durationMin;
        const summary = this.summaryVal.get().trim();
        const nextSummary = summary === '' ? null : summary;
        if (nextSummary !== session.summary) patch.summary = nextSummary;
        const horseId = this.horseVal.get();
        if (horseId !== (session.horseId ?? '')) patch.horseId = horseId === '' ? null : horseId;
        const planId = this.planVal.get();
        if (planId !== (session.planId ?? '')) patch.planId = planId === '' ? null : planId;
        if (Object.keys(patch).length === 0) return;

        const updated = await this.svc.update(session.id, patch);
        if (updated) this.toasts.show({ message: t('trainingSession.saved'), variant: 'success' });
    }

    /**
     * Share-set writes from the single checkbox and from the offer button.
     *
     * Effects run synchronously on `set()`, so above one Teacher the commit
     * effect above fires from this very assignment and owns the write. Calling
     * `commitSharing` here as well would issue the same PATCH twice and toast
     * twice — visible on the program-owner offer, which is reachable at any
     * Teacher count. At one Teacher or none that effect declines, so the write
     * has to happen here.
     */
    private async saveSharing(next: string[]): Promise<void> {
        // Read the Teacher list directly rather than through the `teacherCount`
        // Computed: reading a Computed from a method the class also initialises
        // fields from makes the property-type inference circular, and tsgo
        // resolves the cycle by widening unrelated injected fields to `unknown`.
        const effectWillCommit = this.teachers.items.get().length > 1;
        this.shareVals.set(next);
        if (!effectWillCommit) await this.commitSharing(next);
    }

    private async commitSharing(next: string[]): Promise<void> {
        const session = this.session();
        if (!session) return;
        const updated = await this.svc.update(session.id, { shareWithTeacherIds: next });
        if (updated) {
            this.toasts.show({ message: t('trainingSession.sharing.saved'), variant: 'success' });
        } else {
            // The write failed, so the control must not keep showing the state it
            // failed to reach — the sharing chip is a promise about who can read
            // this, and a stale one is worse than none.
            this.shareVals.set([...session.sharedWithTeacherIds]);
        }
    }

    private async addExercise(): Promise<void> {
        const session = this.session();
        const exerciseId = this.exerciseVal.get();
        if (!session || !exerciseId) return;
        const result = await this.svc.addExercise(session.id, exerciseId);
        if (result) this.exerciseVal.set('');
    }

    private async removeExercise(): Promise<void> {
        const session = this.session();
        const pending = this.pendingRemoval.get();
        this.pendingRemoval.set(null);
        if (!session || !pending) return;
        // No undo toast — see the dialog's comment above for why one would lie.
        await this.svc.removeExercise(session.id, pending.exerciseId);
    }

    private async attachProgram(): Promise<void> {
        const session = this.session();
        const programId = this.programVal.get();
        if (!session || !programId) return;
        const result = await this.svc.attachProgram(session.id, programId);
        if (result) this.programVal.set('');
        // Sharing with the Program's owner is not forced here (IA §3.10). The
        // standing offer in the Delning section picks the gap up on the next
        // render and names the Teacher — a decision the Student makes, not one
        // attaching a Program makes for them.
    }

    private async detachProgram(programId: string, title: string): Promise<void> {
        const session = this.session();
        if (!session) return;
        const result = await this.svc.detachProgram(session.id, programId);
        if (!result) return;
        // This undo genuinely restores: `detachProgram` removes only the junction
        // row, and re-attaching re-adds it while skipping the Exercises already
        // present — so their `notes` and `source_program_id` survive untouched
        // and the source labels resolve again. That is why this action gets a
        // toast where removing an Exercise gets a dialog.
        this.toasts.show({
            message: t('trainingSession.toast.programDetached', { title }),
            action: {
                label: t('trainingSession.toast.undo'),
                onclick: () => void this.svc.attachProgram(session.id, programId),
            },
        });
    }

    private async remove(): Promise<void> {
        const session = this.session();
        if (!session) return;
        const ok = await this.svc.remove(session.id);
        if (!ok) return;
        // No undo: the delete is a hard delete with no restore endpoint, which is
        // exactly why the consequence was stated in a dialog beforehand.
        this.toasts.show({ message: t('trainingSession.toast.deleted'), variant: 'success' });
        this.router.navigate('/traningspass');
    }
}
