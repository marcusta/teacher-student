import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { TableComponent, type TableColumn } from '@basics/core/client/ui/table';
import { t } from '../i18n';
import { token } from '../theme';
import { s } from '../css';
import { noteTimestamp } from '../ui/copy';
import { ShareChipComponent } from '../ui/share-chip.component';
import { StudentsService } from './students.service';
import { LibraryService } from '../library/library.service';
import {
    backTarget,
    historyRows,
    historyState,
    isUnreachable,
    noteVisibilityLabel,
    parseHistoryRoute,
    type HistoryRow,
} from './exercise-history-copy';
import type { ExerciseHistoryEntry, Note } from '../api';

const tpl = template(`
    <div class="ex-history">
        <a bind="back" href="#" class="ex-history__back"></a>

        <header class="ex-history__head">
            <p bind="eyebrow" class="ex-history__eyebrow"></p>
            <h1 bind="title" class="ex-history__title"></h1>
            <p bind="subtitle" class="ex-history__subtitle"></p>
            <p bind="scope" class="ex-history__scope"></p>
        </header>

        <p bind="loading" class="ex-history__loading"></p>
        <div bind="stateHost"></div>
        <div bind="tableHost" class="ex-history__table"></div>
    </div>
`);

/**
 * Övningshistorik — IA §3.16, rendered as the table design system §4.15
 * specifies. This is a view rewrite, not a restyle: the previous version was a
 * stack of collapsible `<details>` blocks, which hid the one thing the view
 * exists for — reading a rider's notes on one exercise ACROSS occasions. A
 * comparison you have to click open four times is not a comparison.
 *
 * **Four columns, and the Tillfälle column carries the source Program.** §4.15's
 * example fills that column with the occasion TYPE, but every row here is a
 * Lesson: §3.16 is explicit that "Training Session occurrences are not part of
 * the current history contract and must not be implied". A column reading
 * "Lektion" on every row would carry no information and would quietly suggest
 * other types exist. So it carries what §3.16 actually asks for — the source
 * Program, or Fristående.
 *
 * **Below 640px the table stacks** into the §4.3 list-row grammar rather than
 * scrolling sideways (UI_DECISIONS §6). `TableComponent` owns that behaviour and
 * re-asserts the table roles under `display: block`, so the screen-reader model
 * survives the breakpoint.
 *
 * **Notes: shared, plus the current user's own private ones — never the other
 * party's.** That is enforced at the source: `NoteService.listFor` selects
 * `visibility = 'shared' OR author_id = <actor>`, so the other side's private
 * notes never reach this client. The scope line says so, because a reader who
 * does not know the rule cannot tell an empty thread from a filtered one.
 *
 * **Read-only.** §3.16 requires it — writing happens on the Lesson occurrence,
 * which every row links to.
 */
export class ExerciseHistoryComponent extends Component {
    static styles = `
        .ex-history {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            font-family: ${token('font-ui')};

            & .ex-history__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .ex-history__head.hidden { display: none; }

            & .ex-history__eyebrow {
                margin: 0 0 ${s('xs')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .ex-history__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }

            & .ex-history__subtitle {
                margin: ${s('xs')} 0 0;
                font-size: 0.9375rem;
                color: ${token('text')};
            }
            & .ex-history__scope {
                margin: ${s('sm')} 0 0;
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }

            & .ex-history__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .ex-history__loading.hidden { display: none; }

            & .ex-history__table.hidden { display: none; }

            /* The date cell is a link to the Lesson (§3.16). It stays in the
               UI font and keeps the column's tabular figures — the table sets
               those on the cell, so the anchor inherits them. */
            & .ex-history__date-link {
                color: ${token('accent')};
                text-decoration: none;
                font-variant-numeric: tabular-nums;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .ex-history__note-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }
            & .ex-history__note {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            & .ex-history__note-meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.75rem;
                color: ${token('text-muted')};
            }
            & .ex-history__note-author { font-weight: 600; color: ${token('text')}; }
            & .ex-history__note-body {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                color: ${token('text')};
            }
            /* The teacher's hairline brass rule (§4.7), carried over so an
               instruction still reads apart from a reflection in this view. */
            & .ex-history__note--teacher {
                padding-left: ${s('sm')};
                border-left: 2px solid ${token('brass-line')};
            }

            @media (max-width: 639px) {
                & .ex-history__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private auth = this.inject(AuthService);
    private students = this.inject(StudentsService);
    private library = this.inject(LibraryService);

    private entries = new Signal<ExerciseHistoryEntry[]>([]);
    private exerciseName = new Signal('');
    private studentName = new Signal('');
    private studentId = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(false);
    /** Captured at resolution: the services' error signals are cleared by the next request. */
    private unreachable = new Signal(false);

    private ids = parseHistoryRoute(this.router.route.peek());

    private rows = new Computed<HistoryRow[]>(() => historyRows(this.entries.get()));
    private state = new Computed(() => historyState({
        resolved: this.resolved.get(),
        found: this.found.get(),
        unreachable: this.unreachable.get(),
        count: this.entries.get().length,
    }));

    onMount(): void {
        void this.load();
    }

    private async load(): Promise<void> {
        const ids = this.ids;
        if (!ids) {
            this.found.set(false);
            this.resolved.set(true);
            return;
        }
        this.studentId.set(ids.studentId);
        this.resolved.set(false);
        this.unreachable.set(false);

        const [student, exercise, history] = await Promise.all([
            this.students.get(ids.studentId),
            this.library.get(ids.exerciseId),
            this.students.exerciseHistory(ids.studentId, ids.exerciseId),
        ]);

        // Any of the three failing resolves as not-found: the server answers
        // 404 for a missing Relation, Student or Exercise alike, and §3.16
        // asks for one indistinguishable state rather than a hint that the
        // object exists but is not ours. A request that never REACHED the
        // server is the one case that must not be folded in — see
        // `historyState`. Read here, before a later request clears the signal.
        if (!student || !exercise || history === null) {
            this.unreachable.set(
                isUnreachable(this.students.error.peek()?.code)
                || isUnreachable(this.library.error.peek()?.code),
            );
            this.found.set(false);
        } else {
            this.studentName.set(student.displayName);
            this.exerciseName.set(exercise.name);
            this.entries.set(history);
            this.found.set(true);
        }
        this.resolved.set(true);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                href: '#',
                textContent: () => t('exerciseHistory.back'),
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate(backTarget(this.router.query('from').get(), this.ids));
                },
            },
            eyebrow: { textContent: () => t('exerciseHistory.eyebrow') },
            // §3.16 context header: Exercise name as the title, Student name
            // beneath it. Both, always — a history without either named is a
            // table of dates about nothing.
            title: { textContent: () => this.exerciseName.get() },
            subtitle: {
                textContent: () => {
                    const name = this.studentName.get();
                    return name ? t('exerciseHistory.subtitle', { student: name }) : '';
                },
            },
            scope: {
                textContent: () => this.state.get() === 'rows' ? t('exerciseHistory.scope') : '',
            },
            loading: {
                textContent: () => t('exerciseHistory.loading'),
                className: () => this.state.get() === 'loading'
                    ? 'ex-history__loading' : 'ex-history__loading hidden',
            },
            tableHost: {
                className: () => this.state.get() === 'rows'
                    ? 'ex-history__table' : 'ex-history__table hidden',
            },
        });

        this.buildStates(this.ref(frag, 'stateHost'));
        this.buildTable(this.ref(frag, 'tableHost'));

        return frag;
    }

    /** §4.14: one action each, and never the same copy for two different facts. */
    private buildStates(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const state = this.state.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (state !== 'empty' && state !== 'notFound' && state !== 'unreachable') return;

            // §4.14: one action each — and a failed read gets RETRY, never a
            // link away, because nothing about the request was the user's doing.
            const copy = state === 'empty'
                ? {
                    heading: 'exerciseHistory.empty.heading',
                    body: 'exerciseHistory.empty.body',
                    action: 'exerciseHistory.empty.action',
                    onclick: () => this.router.navigate(
                        backTarget(untrack(() => this.router.query('from').get()), this.ids)),
                }
                : state === 'unreachable'
                ? {
                    heading: 'exerciseHistory.unreachable.heading',
                    body: 'exerciseHistory.unreachable.body',
                    action: 'exerciseHistory.unreachable.action',
                    onclick: () => void this.load(),
                }
                : {
                    heading: 'exerciseHistory.notFound.heading',
                    body: 'exerciseHistory.notFound.body',
                    action: 'exerciseHistory.notFound.action',
                    onclick: () => this.router.navigate('/students'),
                };

            // Built outside the tracking scope, as `spawn()` does.
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t(copy.heading),
                    body: () => t(copy.body),
                    action: { label: () => t(copy.action), onclick: copy.onclick },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private buildTable(host: HTMLElement): void {
        const columns: TableColumn<HistoryRow>[] = [
            {
                key: 'date',
                header: t('exerciseHistory.col.date'),
                // `date` is what gives the column tabular numerals (§4.15).
                type: 'date',
                // This column is the row's title when stacked, so it does not
                // repeat its own header beside itself.
                stackedLabel: false,
                cell: (row) => this.dateCell(row),
            },
            {
                key: 'occasion',
                header: t('exerciseHistory.col.occasion'),
                cell: (row) => this.occasionCell(row),
            },
            {
                key: 'rowNote',
                header: t('exerciseHistory.col.rowNote'),
                // `null` is what makes the table render the em dash §4.15 asks
                // for — the placeholder is the table's, not a string we forge.
                cell: (row) => row.rowNote,
            },
            {
                key: 'notes',
                header: t('exerciseHistory.col.notes'),
                cell: (row) => this.notesCell(row),
            },
        ];

        this.spawn(TableComponent<HistoryRow>, host, {
            columns,
            rows: this.rows,
            caption: t('exerciseHistory.caption'),
            captionHidden: true,
            rowKey: (row: HistoryRow) => row.key,
            // Default, but stated: UI_DECISIONS §6 requires the stacked
            // rendering below 640px rather than a horizontal scroller.
            stacked: true,
        });
    }

    private dateCell(row: HistoryRow): HTMLElement {
        const link = document.createElement('a');
        link.className = 'ex-history__date-link';
        link.href = row.lessonHref;
        link.textContent = row.dateLabel;
        link.setAttribute('aria-label', t('exerciseHistory.openLesson', { date: row.dateLabel }));
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(row.lessonHref);
        });
        return link;
    }

    private occasionCell(row: HistoryRow): HTMLElement {
        // §4.15 wants a neutral chip here, and §4.4's shape grammar keeps it
        // legible with colour removed: outline, neutral tone, no glyph.
        const host = document.createElement('span');
        const pill = new StatusPillComponent({
            label: row.sourceLabel,
            variant: 'outline',
            tone: 'neutral',
        });
        pill.mount(host);
        this.track(() => pill.destroy());
        return host;
    }

    private notesCell(row: HistoryRow): TableCellOrNull {
        if (row.notes.length === 0) return null;
        const list = document.createElement('ul');
        list.className = 'ex-history__note-list';
        for (const note of row.notes) list.appendChild(this.noteItem(note));
        return list;
    }

    private noteItem(note: Note): HTMLElement {
        const item = document.createElement('li');
        // The Student of this history is the counterparty for everyone except
        // themselves; the brass rule marks the OTHER side's notes as
        // instruction, which is what §4.7 uses it for.
        const authoredByStudent = note.authorId === this.studentId.peek();
        item.className = authoredByStudent
            ? 'ex-history__note'
            : 'ex-history__note ex-history__note--teacher';

        const meta = document.createElement('span');
        meta.className = 'ex-history__note-meta';

        const author = document.createElement('span');
        author.className = 'ex-history__note-author';
        author.textContent = note.authorDisplayName;
        meta.appendChild(author);

        const when = document.createElement('span');
        when.textContent = noteTimestamp(note.createdAt);
        meta.appendChild(when);

        // §4.5 forbids a bare "Delad": the chip NAMES its audience. The shared
        // channel on a lesson-exercise thread runs between this Student and the
        // Teacher reading it, so the Student is the recipient to name — and when
        // the reader IS the Student, `ShareChipComponent` degrades to the
        // explicit "Delad: okänd mottagare" rather than to an unlabelled state.
        const chipHost = document.createElement('span');
        const viewerIsStudent = this.auth.currentUser.peek()?.id === this.studentId.peek();
        const recipients = note.visibility === 'shared' && !viewerIsStudent
            ? [{ id: this.studentId.peek(), name: this.studentName.peek() }]
            : [];
        const chip = new ShareChipComponent({
            recipients,
            shared: note.visibility === 'shared',
        });
        chip.mount(chipHost);
        this.track(() => chip.destroy());
        chipHost.title = noteVisibilityLabel(note);
        meta.appendChild(chipHost);

        const body = document.createElement('span');
        body.className = 'ex-history__note-body';
        body.textContent = note.body;

        item.append(meta, body);
        return item;
    }
}

/** `TableColumn.cell` accepts `null` for "no value"; naming it keeps the intent. */
type TableCellOrNull = HTMLElement | null;
