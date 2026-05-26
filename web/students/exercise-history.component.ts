import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { StudentsService } from './students.service';
import { LibraryService } from '../library/library.service';
import type { ExerciseHistoryEntry } from '../api';

const tpl = template(`
    <div class="ex-history" bind="root">
        <a bind="back" href="#" class="ex-history__back">← Tillbaka</a>
        <h2 bind="heading">Övningshistorik</h2>
        <div bind="subtitle" class="ex-history__subtitle"></div>
        <div bind="missing" class="ex-history__missing">Historiken kunde inte laddas.</div>
        <div bind="empty" class="ex-history__empty">Inga lektioner med den här övningen än.</div>
        <ol bind="timeline" class="ex-history__timeline"></ol>
    </div>
`);

function parseRoute(route: string): { studentId: string; exerciseId: string } | null {
    const parts = route.split('/');
    if (parts.length === 6
        && parts[1] === 'students'
        && parts[3] === 'exercises'
        && parts[5] === 'history') {
        return { studentId: parts[2]!, exerciseId: parts[4]! };
    }
    return null;
}

export class ExerciseHistoryComponent extends Component {
    static styles = `
        .ex-history {
            max-width: 720px;

            & .ex-history__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('xs')}; }

            & .ex-history__subtitle {
                color: ${t('text')};
                opacity: 0.7;
                font-size: 0.875rem;
                margin-bottom: ${s('lg')};
            }

            & .ex-history__missing,
            & .ex-history__empty {
                display: none;
                padding: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                font-size: 0.875rem;
            }
            &.missing .ex-history__missing { display: block; }
            &.empty .ex-history__empty { display: block; }
            &.missing .ex-history__timeline,
            &.empty .ex-history__timeline { display: none; }

            & .ex-history__timeline {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
            }

            & .ex-history__entry {
                padding: ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .ex-history__date {
                font-weight: 600;
                font-size: 0.9375rem;
            }

            & .ex-history__source {
                font-size: 0.8125rem;
                opacity: 0.75;
            }

            & .ex-history__row-notes {
                font-size: 0.875rem;
                white-space: pre-wrap;
                padding: ${s('sm')};
                background: ${t('bg')};
                border-radius: ${t('radius')};
            }

            & .ex-history__notes {
                & summary {
                    cursor: pointer;
                    font-size: 0.8125rem;
                    opacity: 0.85;
                }
            }

            & .ex-history__note-list {
                list-style: none;
                margin: ${s('sm')} 0 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .ex-history__note-item {
                padding: ${s('xs')} ${s('sm')};
                background: ${t('bg')};
                border-radius: ${t('radius')};
                font-size: 0.8125rem;
            }

            & .ex-history__note-meta {
                display: flex;
                gap: ${s('sm')};
                font-size: 0.6875rem;
                opacity: 0.7;
                margin-bottom: 2px;
            }

            & .ex-history__note-body {
                white-space: pre-wrap;
            }
        }
    `;

    private router = this.inject(Router);
    private students = this.inject(StudentsService);
    private library = this.inject(LibraryService);
    private entries = new Signal<ExerciseHistoryEntry[]>([]);
    private exerciseName = new Signal('');
    private studentName = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);

    onMount(): void {
        const ids = parseRoute(this.router.route.get());
        if (!ids) {
            this.found.set(false);
            this.resolved.set(true);
            return;
        }
        void Promise.all([
            this.students.get(ids.studentId),
            this.library.get(ids.exerciseId),
            this.students.exerciseHistory(ids.studentId, ids.exerciseId),
        ]).then(([student, exercise, history]) => {
            if (!student || !exercise || history === null) {
                this.found.set(false);
            } else {
                this.studentName.set(student.displayName);
                this.exerciseName.set(exercise.name);
                this.entries.set(history);
            }
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        const ids = parseRoute(this.router.route.get());
        const frag = this.wire(tpl, {
            root: {
                className: () => {
                    if (!this.resolved.get()) return 'ex-history';
                    if (!this.found.get()) return 'ex-history missing';
                    if (this.entries.get().length === 0) return 'ex-history empty';
                    return 'ex-history';
                },
            },
            back: {
                href: '#',
                onclick: (e: Event) => {
                    e.preventDefault();
                    const from = this.router.query('from').get();
                    if (from) this.router.navigate(from);
                    else if (ids) this.router.navigate(`/library/${ids.exerciseId}`);
                    else this.router.navigate('/students');
                },
            },
            heading: {
                textContent: () => {
                    const name = this.exerciseName.get();
                    return name ? `Övningshistorik — ${name}` : 'Övningshistorik';
                },
            },
            subtitle: {
                textContent: () => {
                    const s = this.studentName.get();
                    return s ? `Elev: ${s}` : '';
                },
            },
        });

        const host = this.ref(frag, 'timeline');
        this.$each(
            host,
            this.entries,
            (entry) => this.renderEntry(entry),
            (entry) => `${entry.lessonExerciseId}:${entry.scheduledAt}:${entry.notes.map((n) => n.id).join(',')}`,
        );

        return frag;
    }

    private renderEntry(entry: ExerciseHistoryEntry): HTMLElement {
        const li = document.createElement('li');
        li.className = 'ex-history__entry';

        const date = document.createElement('div');
        date.className = 'ex-history__date';
        date.textContent = new Date(entry.scheduledAt).toLocaleString('sv-SE');
        li.appendChild(date);

        const source = document.createElement('div');
        source.className = 'ex-history__source';
        source.textContent = entry.sourceProgramTitle ?? 'Fristående';
        li.appendChild(source);

        if (entry.rowNotes) {
            const rowNotes = document.createElement('div');
            rowNotes.className = 'ex-history__row-notes';
            rowNotes.textContent = entry.rowNotes;
            li.appendChild(rowNotes);
        }

        const details = document.createElement('details');
        details.className = 'ex-history__notes';
        const summary = document.createElement('summary');
        summary.textContent = entry.notes.length === 0
            ? 'Anteckningar (inga)'
            : `Anteckningar (${entry.notes.length})`;
        details.appendChild(summary);

        if (entry.notes.length > 0) {
            const list = document.createElement('ul');
            list.className = 'ex-history__note-list';
            for (const note of entry.notes) {
                const item = document.createElement('li');
                item.className = 'ex-history__note-item';
                const meta = document.createElement('div');
                meta.className = 'ex-history__note-meta';
                const who = document.createElement('span');
                who.textContent = note.authorDisplayName;
                const when = document.createElement('span');
                when.textContent = new Date(note.createdAt).toLocaleString('sv-SE');
                const badge = document.createElement('span');
                badge.textContent = note.visibility === 'shared' ? 'delad' : 'privat';
                meta.append(who, when, badge);
                const body = document.createElement('div');
                body.className = 'ex-history__note-body';
                body.textContent = note.body;
                item.append(meta, body);
                list.appendChild(item);
            }
            details.appendChild(list);
        }
        li.appendChild(details);

        return li;
    }
}
