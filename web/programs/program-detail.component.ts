import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { ProgramsService } from './programs.service';
import { builderRowKey, builderRows, isDuplicate, moveExercise, pickableExercises, type BuilderRow } from './program-copy';

const tpl = template(`
    <div class="pr-detail">
        <a bind="back" href="/library?flik=program" class="pr-detail__back"></a>

        <p bind="loading" class="pr-detail__loading"></p>
        <div bind="missingHost"></div>

        <div bind="body" class="pr-detail__body">
            <header class="pr-detail__head">
                <p bind="eyebrow" class="pr-detail__eyebrow"></p>
                <h1 bind="title" class="pr-detail__title"></h1>
            </header>

            <form bind="form" class="pr-detail__form">
                <div class="pr-detail__panel">
                    <label class="pr-detail__field">
                        <span bind="titleLabel" class="pr-detail__label"></span>
                        <input bind="titleInput" type="text" maxlength="200" class="pr-detail__input" required>
                        <span bind="titleError" class="pr-detail__field-error" role="alert"></span>
                    </label>

                    <label class="pr-detail__field">
                        <span bind="descLabel" class="pr-detail__label"></span>
                        <textarea bind="descInput" rows="4" maxlength="4000" class="pr-detail__textarea"></textarea>
                    </label>

                    <p bind="error" class="pr-detail__error" role="alert"></p>

                    <div class="pr-detail__actions">
                        <button bind="save" type="submit" class="pr-detail__save"></button>
                    </div>
                </div>
            </form>

            <section class="pr-detail__builder">
                <h2 bind="builderHeading" class="pr-detail__section-title"></h2>
                <p bind="snapshot" class="pr-detail__note"></p>

                <p bind="builderEmpty" class="pr-detail__section-body"></p>
                <ol bind="rows" class="pr-detail__rows"></ol>

                <form bind="addForm" class="pr-detail__add">
                    <label class="pr-detail__field">
                        <span bind="addLabel" class="pr-detail__label"></span>
                        <div class="pr-detail__add-row">
                            <div bind="pickerHost" class="pr-detail__control"></div>
                            <button bind="addBtn" type="submit" class="pr-detail__secondary"></button>
                        </div>
                    </label>
                    <p bind="addNote" class="pr-detail__section-body"></p>
                    <p bind="addError" class="pr-detail__field-error" role="alert"></p>
                </form>
            </section>

            <section class="pr-detail__danger">
                <h2 bind="dangerHeading" class="pr-detail__danger-title"></h2>
                <p bind="dangerBody" class="pr-detail__section-body"></p>
                <button bind="archive" type="button" class="pr-detail__danger-action"></button>
            </section>
        </div>

        <div bind="confirmArchiveHost"></div>
        <div bind="confirmRemoveHost"></div>
    </div>
`);

/**
 * Bibliotek · Program — IA §3.6 detail / builder.
 *
 * **Snapshot semantics are stated where they can be acted on.** §3.6 asks for it
 * in as many words, and it is the single most confusable thing in this domain:
 * attaching a Program to a Lesson or a Training Session *copies* its Exercises,
 * so editing the sequence here rewrites nothing that has already been taught.
 * The sentence sits directly above the sequence — not in a tooltip, not on a
 * help page — because that is where someone forms the wrong belief.
 *
 * **Archived Exercises are shown, marked, and removable.** They are NOT hidden,
 * and that is a decision rather than an oversight. `listExercises` returns them
 * (it joins `exercises` unfiltered) while `GET /exercises` does not, so a row
 * whose Exercise has been archived is inert: `LessonService.attachProgram` skips
 * archived Exercises when it copies, so the row silently contributes nothing.
 * Hiding it would leave a teacher unable to see or clean up something that is
 * quietly shrinking their Program. It is marked `Arkiverad` and keeps its remove
 * control; only the reorder controls are withheld, because moving a row that is
 * skipped anyway changes nothing.
 *
 * **The row note is editable in place** (§3.6 detail step 3), via
 * `PATCH /programs/:id/exercises/:exerciseId`. It was write-once until that
 * endpoint existed — set at add time and never again — which is why this view
 * used to render it as read-only text, and why removing a noted row used to be
 * unrecoverable. Saving is explicit: nothing is written on blur or keystroke,
 * and an emptied field clears the note rather than being rejected.
 *
 * **Removing an archived row is the one irreversible edit here**, because
 * `addExercise` refuses an archived Exercise — it cannot be put back. That gets
 * a consequence-stating dialog (§4.12). Removing a *noted* row gets the same
 * dialog with a different sentence: its text is lost, but it can now be typed
 * again, so the copy states a cost rather than a permanence. Removing a live,
 * note-free row gets no dialog at all — re-adding it is one click away.
 *
 * **The danger area says archive, because that is what happens.**
 * `DELETE /programs/:id` calls `ProgramService.archive`: past Lessons and
 * Training Sessions keep their copied Exercises AND their "från program X"
 * provenance. The old copy ("Ta bort programmet?") described a cascade this
 * backend no longer performs.
 */
export class ProgramDetailComponent extends Component {
    static styles = `
        .pr-detail {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 44rem;
            font-family: ${token('font-ui')};

            & .pr-detail__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .pr-detail__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .pr-detail__loading.hidden { display: none; }

            & .pr-detail__body { display: flex; flex-direction: column; gap: ${s('xl')}; }
            & .pr-detail__body.hidden { display: none; }

            & .pr-detail__eyebrow {
                margin: 0 0 ${s('xs')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .pr-detail__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .pr-detail__section-title, & .pr-detail__danger-title {
                margin: 0 0 ${s('sm')};
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .pr-detail__section-body {
                margin: 0 0 ${s('md')};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .pr-detail__section-body.hidden { display: none; }

            /* The snapshot rule sits on the brass hairline — the one place the
               brass carries meaning without carrying text (§05). */
            & .pr-detail__note {
                margin: 0 0 ${s('lg')};
                padding-left: ${s('md')};
                border-left: 2px solid ${token('brass-line')};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }

            & .pr-detail__form, & .pr-detail__add {
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .pr-detail__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .pr-detail__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .pr-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .pr-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .pr-detail__field-error:empty { display: none; }

            & .pr-detail__input, & .pr-detail__textarea {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .pr-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }

            & .pr-detail__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .pr-detail__actions { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            /* §4.8: one primary per form. Spara is it. */
            & .pr-detail__save { ${btn(token('radius-sm'), 'primary')} }
            /* Lägg till sits beside the picker — a second action on the page,
               never a second primary. */
            & .pr-detail__secondary {
                ${btn()}
                white-space: nowrap;
            }

            & .pr-detail__add-row {
                display: flex;
                gap: ${s('sm')};
                align-items: center;
                flex-wrap: wrap;
                & > div { flex: 1 1 16rem; }
                & .ui-select { display: block; }
            }
            & .pr-detail__add.hidden { display: none; }

            /* Ordered sequence. The number is data, not a marker, so the list
               style is off and the position is a rendered cell — it has to line
               up with tabular figures like every other number in the app. */
            & .pr-detail__rows {
                list-style: none;
                margin: 0 0 ${s('lg')};
                padding: 0;
                border-top: 1px solid ${token('border')};
            }
            & .pr-detail__rows:empty { border-top: none; margin-bottom: 0; }
            & .pr-detail__rows > li { border-bottom: 1px solid ${token('border')}; }

            & .pr-ex {
                display: grid;
                grid-template-columns: 2.25rem minmax(0, 1fr) auto;
                gap: ${s('sm')} ${s('md')};
                align-items: start;
                padding: ${s('md')} ${s('sm')};
            }
            & .pr-ex__order {
                font-variant-numeric: tabular-nums;
                font-size: 0.875rem;
                font-weight: 600;
                color: ${token('text-muted')};
                padding-top: 2px;
            }
            & .pr-ex__body { display: flex; flex-direction: column; gap: ${s('xs')}; min-width: 0; }
            & .pr-ex__name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .pr-ex__notes {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                &.hidden { display: none; }
                &:empty { display: none; }
            }
            & .pr-ex__note-edit {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                margin-top: ${s('xs')};
                &.hidden { display: none; }
            }
            & .pr-ex__note-label {
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }
            & .pr-ex__note-input {
                ${input()}
                /*
                 * This editor opens in place inside a sequence row drawn on
                 * the page, not inside a form panel, so it keeps a raised
                 * --surface fill. The recessed --bg fill the recipe supplies
                 * is only legible against a card, and wrapping every row in
                 * its own panel would restructure the list to solve a fill.
                 */
                background: ${token('surface')};
                /* input() sets no width, so a textarea falls back to the
                   browser default cols=20. Every other field in this file
                   states both explicitly; so does this one. NOTE: no backticks
                   in here — this comment lives inside a template literal. */
                width: 100%;
                box-sizing: border-box;
                font-size: 0.8125rem;
                resize: vertical;
            }
            & .pr-ex__note-actions {
                display: flex;
                gap: ${s('xs')};
            }
            & .pr-ex__note-error {
                font-size: 0.8125rem;
                color: ${token('danger')};
                &:empty { display: none; }
            }
            & .pr-ex__archived-hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('warning')};
                max-width: 60ch;
            }
            /* An archived row is inert, and reads that way — the same dimming
               §4.3 gives a cancelled row. The remove control keeps full contrast
               so the one thing still worth doing here stays legible. */
            & .pr-ex--archived .pr-ex__name,
            & .pr-ex--archived .pr-ex__notes { opacity: 0.72; }

            & .pr-ex__controls {
                display: flex;
                gap: ${s('xs')};
                align-items: center;
                /* Row controls are secondary, and deliberately smaller than a
                   page-level button: a sequence of ten rows should not read as
                   ten stacked calls to action. */
                & button {
                    ${btn()}
                    padding: 4px 10px;
                    font-size: 0.8125rem;
                }
                /* Removing a row is destructive, so it takes the danger tier —
                   an outline that fills only under the pointer. The compact
                   metrics are restated because this selector outranks the
                   element rule above. */
                & .pr-ex__remove {
                    ${btn(token('radius-sm'), 'danger')}
                    padding: 4px 10px;
                    font-size: 0.8125rem;
                }
            }

            /* §3.6: the destructive action lives in a SEPARATED area. */
            & .pr-detail__danger {
                padding-top: ${s('lg')};
                border-top: 1px solid ${token('border')};
            }
            & .pr-detail__danger-title { color: ${token('danger')}; }
            & .pr-detail__danger-action { ${btn(token('radius-sm'), 'danger')} }

            @media (max-width: 639px) {
                & .pr-detail__title { font-size: 1.375rem; line-height: 30px; }
                & .pr-ex {
                    grid-template-columns: 2.25rem minmax(0, 1fr);
                }
                & .pr-ex__controls { grid-column: 2; }
                & .pr-detail__add-row { flex-direction: column; align-items: stretch; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(ProgramsService);
    private toasts = this.inject(ToastService);

    private titleVal = new Signal('');
    private descVal = new Signal('');
    private touched = new Signal(false);
    private resolved = new Signal(false);
    private found = new Signal(false);
    private pickedId = new Signal('');
    private addError = new Signal('');
    private confirmArchive = new Signal(false);
    private confirmRemove = new Signal(false);
    private pendingRemoval = new Signal<BuilderRow | null>(null);

    /**
     * The Exercise id whose note is open for editing, or '' for none.
     *
     * One at a time, and held HERE rather than in the row's DOM: `$each` rebuilds
     * a row whenever its key changes — and `builderRowKey` includes the note, so
     * saving one rebuilds it — which would discard any state the element owned.
     */
    private editingNote = new Signal('');
    /** The open editor's uncommitted text. Saved explicitly; never on blur. */
    private noteDraft = new Signal('');
    private noteError = new Signal('');

    /**
     * Whether `GET /exercises` has answered — successfully, with a list.
     *
     * This no longer has anything to do with the archived flag; rows carry
     * `archivedAt` themselves. It survives for the picker's explanatory
     * sentence, which must not say "you have no exercises" about a library that
     * has simply not replied yet.
     */
    private libraryLoaded = new Signal(false);

    /**
     * The library was asked and did not answer. Distinct from `!libraryLoaded`,
     * which is also true while the request is still in flight — an empty picker
     * with no sentence beside it is indistinguishable from an empty library.
     */
    private libraryFailed = new Signal(false);

    private rows = new Computed<BuilderRow[]>(() => builderRows(this.svc.exercises.get()));
    private pickable = new Computed(() =>
        pickableExercises(this.svc.availableExercises.get(), this.svc.exercises.get()));
    private pickerOptions = new Computed<SelectOption[]>(() =>
        this.pickable.get().map((e) => ({ value: e.id, label: e.name })));

    private get programId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    onMount(): void {
        void this.svc.get(this.programId).then((program) => {
            if (program) {
                this.titleVal.set(program.title);
                this.descVal.set(program.description);
                this.found.set(true);
                void this.svc.loadExercises(this.programId);
                // `libraryLoaded` follows the ANSWER, not the settling of the
                // promise: `loadAvailableExercises` resolves either way, and the
                // picker's sentence must not report a failure as an empty
                // library.
                void this.svc.loadAvailableExercises().then((ok) => {
                    this.libraryLoaded.set(ok);
                    this.libraryFailed.set(!ok);
                });
            }
            this.resolved.set(true);
        });

        // Drop a selection that stopped being offerable — it just got attached,
        // or the library changed underneath.
        this.track(effect(() => {
            const options = this.pickerOptions.get();
            const current = this.pickedId.get();
            if (current && !options.some((o) => o.value === current)) this.pickedId.set('');
        }));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: this.router.link('/library?flik=program').onclick,
                textContent: () => t('program.back'),
            },
            loading: {
                textContent: () => t('program.loading'),
                className: () => this.resolved.get()
                    ? 'pr-detail__loading hidden' : 'pr-detail__loading',
            },
            body: {
                className: () => this.resolved.get() && this.found.get()
                    ? 'pr-detail__body' : 'pr-detail__body hidden',
            },

            eyebrow: { textContent: () => t('program.eyebrow') },
            title: { textContent: () => this.titleVal.get() },

            titleLabel: { textContent: () => t('program.field.title') },
            titleInput: {
                value: () => this.titleVal.get(),
                'aria-invalid': () => String(
                    this.touched.get() && this.titleVal.get().trim() === ''),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            titleError: {
                textContent: () => this.touched.get() && this.titleVal.get().trim() === ''
                    ? t('program.error.title') : '',
            },
            descLabel: { textContent: () => t('program.field.description') },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            error: { textContent: () => this.svc.error.get() ? t('program.saveError') : '' },
            save: {
                textContent: () => t('program.save'),
                disabled: () => this.svc.loading.get(),
            },
            form: { onsubmit: (e: Event) => void this.save(e) },

            builderHeading: { textContent: () => t('program.exercises.heading') },
            snapshot: { textContent: () => t('program.snapshot') },
            builderEmpty: {
                textContent: () => t('program.exercises.empty'),
                className: () => this.rows.get().length === 0
                    ? 'pr-detail__section-body' : 'pr-detail__section-body hidden',
            },

            addLabel: { textContent: () => t('program.add.label') },
            addBtn: {
                textContent: () => t('program.add.submit'),
                disabled: () => this.pickedId.get() === '',
            },
            // Says WHY there is nothing to pick, rather than leaving an empty
            // dropdown to be interpreted.
            addNote: {
                textContent: () => {
                    // Failure first: an unanswered library is not an empty one,
                    // and must never be reported as "you have no exercises".
                    if (this.libraryFailed.get()) return t('program.add.error');
                    if (!this.libraryLoaded.get()) return '';
                    if (this.svc.availableExercises.get().length === 0) return t('program.add.none');
                    if (this.pickable.get().length === 0) return t('program.add.exhausted');
                    return '';
                },
                className: () => 'pr-detail__section-body',
            },
            addError: { textContent: () => this.addError.get() },
            addForm: { onsubmit: (e: Event) => void this.add(e) },

            dangerHeading: { textContent: () => t('program.danger.heading') },
            dangerBody: { textContent: () => t('program.danger.body') },
            archive: {
                textContent: () => t('program.danger.action'),
                onclick: () => this.confirmArchive.set(true),
            },
        });

        this.spawn(SelectComponent, this.ref(frag, 'pickerHost'), {
            value: this.pickedId,
            options: this.pickerOptions,
            placeholder: t('program.add.placeholder'),
        });

        this.buildMissing(this.ref(frag, 'missingHost'));

        this.$each(this.ref(frag, 'rows'), this.rows,
            (row, _i, track) => this.renderRow(row, track), builderRowKey);

        this.buildConfirm(this.ref(frag, 'confirmArchiveHost'), {
            open: this.confirmArchive,
            title: t('program.confirm.archive.title'),
            message: () => t('program.confirm.archive.message', { title: this.titleVal.get() }),
            confirmLabel: t('program.danger.action'),
            onconfirm: () => void this.archive(),
        });

        // Two lossy removals share one dialog, because the sentence is what
        // differs, not the mechanism:
        //
        // - an ARCHIVED row cannot be put back at all (`addExercise` refuses an
        //   archived Exercise). Genuinely irreversible, and said so.
        // - a row carrying an instructional NOTE loses that note, because
        //   `removeExercise` deletes the junction row the note lives on.
        //
        // The second case USED to be irreversible too, and the copy said so:
        // `notes` could only be set at add time, so a removed note could never
        // be written again. `PATCH /programs/:id/exercises/:exerciseId` changed
        // that, and the sentence changed with it — the note is recoverable now,
        // by re-adding and retyping, at the cost of the row's position. Still
        // worth a dialog (losing typed text unasked is not a small thing), no
        // longer worth a claim of permanence.
        //
        // Neither gets an "Ångra" toast: it would be a promise this view cannot
        // keep. A live, note-free row still removes without a dialog — that one
        // really is one click from being restored.
        this.buildConfirm(this.ref(frag, 'confirmRemoveHost'), {
            open: this.confirmRemove,
            title: t('program.confirm.remove.title'),
            message: () => {
                const row = this.pendingRemoval.get();
                const name = row?.name ?? '';
                // Four branches, not two. The dialog only opens when a row is
                // archived or noted, and the archived+noted case is the one
                // that loses the most — it must not inherit the copy for a
                // plain archived row, which never mentions the note.
                if (!row) return t('program.confirm.remove.message', { name });
                if (row.archived) {
                    return row.notes
                        ? t('program.confirm.removeArchivedNoted.message', { name })
                        : t('program.confirm.remove.message', { name });
                }
                return t('program.confirm.removeNoted.message', { name });
            },
            confirmLabel: t('program.row.remove'),
            onconfirm: () => {
                const row = this.pendingRemoval.peek();
                if (row) void this.remove(row);
            },
        });

        return frag;
    }

    /**
     * `confirm.ts` keeps its panel mounted and merely transparent when closed,
     * which leaves both buttons in the tab order behind the page. `inert` on the
     * host is what actually takes them out of it.
     */
    private buildConfirm(host: HTMLElement, opts: {
        open: Signal<boolean>;
        title: string;
        message: () => string;
        confirmLabel: string;
        onconfirm: () => void;
    }): void {
        this.spawn(ConfirmComponent, host, {
            open: opts.open,
            title: opts.title,
            message: opts.message,
            confirmLabel: opts.confirmLabel,
            cancelLabel: t('program.confirm.dismiss'),
            danger: true,
            onconfirm: opts.onconfirm,
        });
        this.track(effect(() => {
            host.inert = !opts.open.get();
        }));
    }

    /**
     * A missing Program and one belonging to another teacher's library resolve
     * identically — the server answers 404 for both, and §1 requires that the
     * view not reveal that an object it may not read exists.
     */
    private buildMissing(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.resolved.get() && !this.found.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('program.notFound.heading'),
                    body: () => t('program.notFound.body'),
                    action: {
                        label: () => t('program.notFound.action'),
                        onclick: () => this.router.navigate('/library?flik=program'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(row: BuilderRow, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const wrap = document.createElement('div');
        wrap.className = row.archived ? 'pr-ex pr-ex--archived' : 'pr-ex';

        const order = document.createElement('span');
        order.className = 'pr-ex__order';
        order.textContent = String(row.position);
        wrap.appendChild(order);

        const body = document.createElement('div');
        body.className = 'pr-ex__body';

        const name = document.createElement('span');
        name.className = 'pr-ex__name';
        name.textContent = row.name;
        body.appendChild(name);

        if (row.archived) {
            // §4.4: the pill's SHAPE carries the state, so the row stays
            // readable with colour removed entirely. Dashed = withdrawn.
            const pillHost = document.createElement('span');
            body.appendChild(pillHost);
            const pill = new StatusPillComponent({
                label: t('program.row.archived'),
                variant: 'dashed',
                tone: 'warning',
            });
            pill.mount(pillHost);
            track(() => pill.destroy());

            const hint = document.createElement('span');
            hint.className = 'pr-ex__archived-hint';
            hint.textContent = t('program.row.archived.hint');
            body.appendChild(hint);
        }

        // The note reads as text and edits in place. Both halves are built once
        // and toggled, so opening the editor does not rebuild the row.
        const notes = document.createElement('span');
        notes.className = 'pr-ex__notes';
        notes.textContent = row.notes ?? '';
        body.appendChild(notes);

        const editor = document.createElement('form');
        editor.className = 'pr-ex__note-edit hidden';

        const noteLabel = document.createElement('label');
        noteLabel.className = 'pr-ex__note-label';
        noteLabel.textContent = t('program.row.note.label');
        const noteInput = document.createElement('textarea');
        noteInput.className = 'pr-ex__note-input';
        noteInput.rows = 2;
        noteInput.maxLength = 2000;
        noteInput.addEventListener('input', () => this.noteDraft.set(noteInput.value));
        // Label and field are SIBLINGS, matching `.pr-detail__field` above.
        // Nesting the textarea inside the label makes them inline children of a
        // single flex item, so the label text and the field collide on one line.
        noteLabel.htmlFor = noteInput.id || (noteInput.id = 'pr-ex-note-input');
        editor.appendChild(noteLabel);
        editor.appendChild(noteInput);

        const noteError = document.createElement('p');
        noteError.className = 'pr-ex__note-error';
        noteError.setAttribute('role', 'alert');
        editor.appendChild(noteError);

        const noteActions = document.createElement('div');
        noteActions.className = 'pr-ex__note-actions';
        const saveNote = document.createElement('button');
        saveNote.type = 'submit';
        saveNote.textContent = t('program.row.note.save');
        const cancelNote = document.createElement('button');
        cancelNote.type = 'button';
        cancelNote.textContent = t('program.row.note.cancel');
        cancelNote.addEventListener('click', () => this.closeNote());
        noteActions.append(saveNote, cancelNote);
        editor.appendChild(noteActions);

        // Explicit save (§3.6 asks for an editable note, not a live-binding one):
        // nothing is written on blur or on keystroke.
        editor.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            void this.saveNote(row);
        });
        body.appendChild(editor);

        track(effect(() => {
            const open = this.editingNote.get() === row.id;
            editor.className = open ? 'pr-ex__note-edit' : 'pr-ex__note-edit hidden';
            // `inert` keeps the closed editor's controls out of the tab order —
            // `display: none` already does, but the class is the only thing
            // standing between them and the page if that style ever changes.
            editor.inert = !open;
            notes.className = !open && row.notes ? 'pr-ex__notes' : 'pr-ex__notes hidden';
            noteError.textContent = open ? this.noteError.get() : '';
            if (open && noteInput.value !== this.noteDraft.get()) {
                noteInput.value = this.noteDraft.get();
            }
        }));

        wrap.appendChild(body);

        const controls = document.createElement('div');
        controls.className = 'pr-ex__controls';

        // Reorder is explicit and keyboard accessible (§3.6): two real buttons,
        // each labelled with the Exercise it moves, so the control is
        // comprehensible out of visual context. Withheld at the ends and on an
        // archived row rather than disabled — the server would take the write,
        // but it would change nothing anyone can act on.
        if (!row.archived) {
            if (!row.isFirst) {
                controls.appendChild(this.orderButton('↑', t('program.row.up', { name: row.name }),
                    () => void this.move(row.id, -1)));
            }
            if (!row.isLast) {
                controls.appendChild(this.orderButton('↓', t('program.row.down', { name: row.name }),
                    () => void this.move(row.id, +1)));
            }
        }

        // §3.6 step 3: the row note is editable, not write-once. Offered on an
        // archived row too — its text is the only thing still worth correcting
        // there, and unlike reordering it is not a no-op.
        const noteBtn = document.createElement('button');
        noteBtn.type = 'button';
        noteBtn.className = 'pr-ex__note-btn';
        noteBtn.textContent = row.notes ? t('program.row.note.edit') : t('program.row.note.add');
        noteBtn.setAttribute('aria-label', row.notes
            ? t('program.row.note.editNamed', { name: row.name })
            : t('program.row.note.addNamed', { name: row.name }));
        noteBtn.addEventListener('click', () => this.openNote(row));
        controls.appendChild(noteBtn);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'pr-ex__remove';
        remove.textContent = t('program.row.remove');
        remove.setAttribute('aria-label', t('program.row.removeNamed', { name: row.name }));
        // Consequence-stating dialog for the two lossy cases; straight through
        // for a live note-free row, which really is one click from restored.
        remove.addEventListener('click', () => {
            if (row.archived || row.notes) {
                this.pendingRemoval.set(row);
                this.confirmRemove.set(true);
                return;
            }
            void this.remove(row);
        });
        controls.appendChild(remove);

        wrap.appendChild(controls);
        li.appendChild(wrap);
        return li;
    }

    private orderButton(glyph: string, label: string, onclick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = glyph;
        button.setAttribute('aria-label', label);
        button.title = label;
        button.addEventListener('click', onclick);
        return button;
    }

    private async save(e: Event): Promise<void> {
        e.preventDefault();
        const title = this.titleVal.get().trim();
        this.touched.set(true);
        if (!title) return;
        const updated = await this.svc.update(this.programId, {
            title,
            description: this.descVal.get().trim(),
        });
        if (!updated) return;
        this.toasts.show({ message: t('program.saved'), variant: 'success' });
    }

    private async add(e: Event): Promise<void> {
        e.preventDefault();
        const exerciseId = this.pickedId.get();
        if (!exerciseId) return;

        // §3.6: "Reject duplicate Exercises with a row-level explanation." The
        // picker already withholds attached Exercises, so this only fires on a
        // stale list — but the server rejects the write outright, and an
        // unexplained failure at the field is worse than the same fact stated.
        if (isDuplicate(this.svc.exercises.peek(), exerciseId)) {
            const name = this.svc.availableExercises.peek()
                .find((ex) => ex.id === exerciseId)?.name ?? '';
            this.addError.set(t('program.add.duplicate', { name }));
            return;
        }

        this.addError.set('');
        const ok = await this.svc.addExerciseToProgram(this.programId, exerciseId);
        if (!ok) {
            this.addError.set(t('program.add.failed'));
            return;
        }
        this.pickedId.set('');
    }

    private openNote(row: BuilderRow): void {
        this.noteError.set('');
        this.noteDraft.set(row.notes ?? '');
        this.editingNote.set(row.id);
    }

    private closeNote(): void {
        this.editingNote.set('');
        this.noteDraft.set('');
        this.noteError.set('');
    }

    /**
     * Commit the open note. An emptied field CLEARS the note rather than being
     * rejected — "no note" is a legitimate destination, and the server stores
     * null for blank so it has exactly one representation.
     */
    private async saveNote(row: BuilderRow): Promise<void> {
        const draft = this.noteDraft.peek().trim();
        // Nothing to write, and a no-op request would still reload the list and
        // flicker the row — the same reason `move` refuses an unavailable move.
        if (draft === (row.notes ?? '')) {
            this.closeNote();
            return;
        }
        this.noteError.set('');
        // Closed BEFORE the write, not after. `updateExerciseNotes` reloads the
        // sequence on success, and the note is part of `builderRowKey` — so the
        // row is rebuilt, and an editor still flagged open would be re-created
        // mid-flight only to be torn down a moment later.
        this.editingNote.set('');
        const ok = await this.svc.updateExerciseNotes(
            this.programId, row.id, draft === '' ? null : draft,
        );
        if (!ok) {
            // Reopened with the text still in it: a failed save must not also
            // lose what the user typed. Nothing reloaded, so this row's element
            // is still the one on screen.
            this.noteDraft.set(draft);
            this.editingNote.set(row.id);
            this.noteError.set(t('program.row.note.failed'));
            return;
        }
        this.closeNote();
        this.toasts.show({ message: t('program.row.note.saved'), variant: 'success' });
    }

    private async move(exerciseId: string, delta: -1 | 1): Promise<void> {
        const order = moveExercise(this.svc.exercises.peek(), exerciseId, delta);
        // `null` means the move is unavailable. Issuing the write anyway would
        // reload the list and flicker the row for no change.
        if (!order) return;
        const ok = await this.svc.reorderExercises(this.programId, order);
        if (!ok) this.toasts.show({ message: t('program.reorderError'), variant: 'error' });
    }

    private async remove(row: BuilderRow): Promise<void> {
        this.pendingRemoval.set(null);
        await this.svc.removeExercise(this.programId, row.id);
    }

    private async archive(): Promise<void> {
        const ok = await this.svc.archive(this.programId);
        if (!ok) return;
        this.toasts.show({ message: t('program.archived'), variant: 'success' });
        this.router.navigate('/library?flik=program');
    }
}
