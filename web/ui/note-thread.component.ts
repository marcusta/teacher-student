import { Component, Signal, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../i18n';
import {
    namedRecipients,
    noteTimestamp,
    shareLabel,
    threadTitle,
    visibilityHint,
    type PersonRole,
    type ShareRecipient,
} from './copy';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { NotesService } from '../lessons/notes.service';
import { PersonMarkerComponent } from './person-marker.component';
import { ShareChipComponent } from './share-chip.component';

import type { Note } from '../api';

// See ./copy for why the copy rules live outside the component module.
export { noteTimestamp, threadTitle, visibilityHint } from './copy';

/**
 * Note & feedback thread — design system §4.7.
 *
 * One chronological column. The spec's `Undvik` list rules out the three things
 * a chat UI would reach for first: speech bubbles, alternating left/right
 * layout, and truncating long notes. So entries are stacked blocks at full
 * measure, and the body has no clamp of any kind.
 *
 * What the spec *does* mandate, and this component owns:
 *
 * - a **context row** at the top saying what the thread hangs on
 *   ("Träningspass · 14 juli · Luna"), so a thread is never free-floating;
 * - the **teacher's hairline brass rule** on their entries — the one place the
 *   brass appears inside a thread, marking instruction apart from reflection;
 * - **visibility at the point of writing** (§4.5, IA §1): the composer footer
 *   carries the Privat/Delad choice and names who "Delad" would reach, rather
 *   than hiding the decision in a menu or revealing it after the fact.
 *
 * This replaces three near-duplicate hand-rolled threads (goal notes, exercise
 * notes, and the inline block in training-session detail). Notes attach to five
 * parent kinds, so the parent is a prop, not a subclass.
 */
export type NoteParentKind =
    | 'lesson'
    | 'lesson_exercise'
    | 'training_session'
    | 'training_session_exercise'
    | 'goal';

export interface NoteThreadProps {
    /** Which kind of object the thread hangs on. */
    parentKind: NoteParentKind;
    /** Id of that object. */
    parentId: string;
    /**
     * The context row — already-composed domain copy, e.g.
     * `Träningspass · 14 juli · Luna`. Composed by the caller because only the
     * caller knows which facts identify its parent.
     */
    context: string | (() => string);
    /**
     * Who a note written *here, now* would reach when shared. Drives the
     * composer's named Delad option. Empty disables sharing rather than
     * offering an unlabelled one.
     */
    recipients: ShareRecipient[] | (() => ShareRecipient[]);
    /**
     * The author's role in this relation. Decides the person marker's tone and
     * which entries carry the brass rule. Roles are contextual (IA §1), so this
     * is a per-note question the caller answers, not a field on the account.
     */
    roleOf: (note: Note) => PersonRole;
    /**
     * Who an existing shared note reaches. Defaults to `recipients`.
     *
     * The chip on an entry states which CHANNEL the note is in — private to its
     * author, or the shared channel this thread runs on — so it names the same
     * counterparties for every shared entry regardless of who wrote it. Filtering
     * the author out would leave a teacher's own note with an empty audience and
     * an unnamed "Delad", which §4.5 forbids.
     */
    audienceOf?: (note: Note) => ShareRecipient[];
    /**
     * Show the Lärare/Elev tag on entries. Pass `false` where the context is
     * already unambiguous — §4.6 names a student's own training log as the
     * example. The names still render; only the role tag is suppressed.
     */
    showRoles?: boolean | (() => boolean);
    /** Heading level of the thread title, for outline correctness. Default 3. */
    headingLevel?: 2 | 3 | 4;
}

const resolve = <T>(value: T | (() => T)): T =>
    typeof value === 'function' ? (value as () => T)() : value;

const tpl = template(`
    <section class="note-thread">
        <header class="note-thread__head">
            <div bind="titleHost"></div>
            <p bind="context" class="note-thread__context"></p>
        </header>
        <ol bind="list" class="note-thread__list"></ol>
        <p bind="empty" class="note-thread__empty"></p>
        <form bind="form" class="note-thread__composer">
            <textarea bind="body" rows="3"></textarea>
            <div class="note-thread__footer">
                <div bind="visibility" class="note-thread__visibility"></div>
                <button bind="submit" type="submit" class="note-thread__submit"></button>
            </div>
            <p bind="hint" class="note-thread__hint"></p>
            <p bind="error" class="note-thread__error"></p>
        </form>
        <div bind="confirmHost"></div>
    </section>
`);

export class NoteThreadComponent extends Component<NoteThreadProps> {
    static styles = `
        .note-thread {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            font-family: ${token('font-ui')};
            /* §4.7 is a single column at reading measure — never two. */
            max-width: 68ch;

            & .note-thread__head {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                padding-bottom: ${s('sm')};
                border-bottom: 1px solid ${token('border')};
            }

            & .note-thread__title {
                margin: 0;
                /* A section heading is one of the places the serif is allowed —
                   and Lora ships as a single 500 cut (UI_DECISIONS §3), so 500
                   is the only weight that renders honestly. */
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${token('text')};
            }

            /* The context row: what the thread is attached to. */
            & .note-thread__context {
                margin: 0;
                font-size: 0.8125rem;
                color: ${token('text-muted')};
            }

            & .note-thread__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .note-thread__entry {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                padding-left: ${s('md')};
                /* Non-teacher entries keep the identical indent so the column
                   stays flush — only the rule's colour changes. */
                border-left: 1px solid transparent;
            }

            /* The teacher's hairline brass rule (§4.7). Hairline: 1px, no fill,
               no bubble — the entry is otherwise identical to the student's. */
            & .note-thread__entry--teacher {
                border-left-color: ${token('brass-line')};
            }

            & .note-thread__meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('sm')};
            }

            & .note-thread__time {
                font-size: 0.75rem;
                color: ${token('text-muted')};
                font-variant-numeric: tabular-nums;
            }

            & .note-thread__body {
                margin: 0;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${token('text')};
                /* No clamp, no ellipsis: §4.7 forbids cutting long notes. */
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }

            & .note-thread__entry-actions {
                display: flex;
                gap: ${s('md')};

                & button {
                    background: none;
                    border: none;
                    padding: 0;
                    font-family: inherit;
                    font-size: 0.75rem;
                    color: ${token('text-muted')};
                    cursor: pointer;
                    &:hover { color: ${token('text')}; text-decoration: underline; }
                    &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
                    &.note-thread__destructive { color: ${token('danger')}; }
                }
            }

            & .note-thread__empty {
                margin: 0;
                font-size: 0.875rem;
                color: ${token('text-muted')};
            }
            & .note-thread__empty.hidden { display: none; }

            /*
             * The composer is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a note thread is embedded straight
             * into a detail page drawn on that same colour — so without the
             * panel the textarea would vanish into its background. The panel
             * is what the recessed fill is recessed INTO, and it also marks
             * the composer off from the notes above it.
             */
            & .note-thread__composer {
                ${card()}
                box-sizing: border-box;
                padding: ${s('lg')};
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};

                & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                    font-family: ${token('font-ui')};
                    font-size: 0.9375rem;
                }
            }

            & .note-thread__footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: ${s('md')};

                & .note-thread__submit { ${btn()} }
            }

            /* Visibility at the point of writing — a two-state segmented
               control, not a checkbox: both options are always visible and
               always labelled, so the shared state can never be nameless. */
            & .note-thread__visibility {
                display: inline-flex;
                border: 1px solid ${token('border-strong')};
                border-radius: ${token('radius-pill')};
                overflow: hidden;

                & button {
                    background: none;
                    border: none;
                    padding: ${s('xs')} ${s('md')};
                    font-family: ${token('font-ui')};
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: ${token('text-muted')};
                    cursor: pointer;
                    transition: background ${token('dur-fast')} ${token('ease-standard')},
                                color ${token('dur-fast')} ${token('ease-standard')};

                    &:hover:not(:disabled) { background: ${token('surface-2')}; }
                    &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
                    &:disabled { opacity: 0.5; cursor: not-allowed; }

                    &[aria-pressed="true"] {
                        background: ${token('accent-soft')};
                        color: ${token('accent-strong')};
                    }
                }
            }

            & .note-thread__hint {
                margin: 0;
                font-size: 0.75rem;
                color: ${token('text-muted')};
            }

            & .note-thread__error {
                margin: 0;
                font-size: 0.75rem;
                color: ${token('danger')};
                min-height: 1em;
            }
            & .note-thread__error:empty { min-height: 0; }
        }
    `;

    private auth = this.inject(AuthService);
    /** Per-mount, not injected: several threads coexist on one page. */
    private notes = new NotesService();
    private draft = new Signal('');
    private draftShared = new Signal(false);
    private editingId = new Signal<string | null>(null);
    private editingBody = new Signal('');
    private editingShared = new Signal(false);
    private pendingDelete = new Signal<string | null>(null);
    private confirmOpen = new Signal(false);

    onMount(): void {
        void this.notes.load(this.props.parentKind, this.props.parentId);
    }

    /**
     * Only recipients this thread can NAME. A blank display name cannot be
     * stated, and §4.5 forbids offering a shared state whose audience isn't —
     * so an unnameable recipient disables sharing instead of producing a
     * confident, empty "Delad: ".
     */
    private recipients(): ShareRecipient[] {
        return namedRecipients(resolve(this.props.recipients));
    }

    private canShare(): boolean {
        return this.recipients().length > 0;
    }

    private audienceOf(note: Note): ShareRecipient[] {
        return this.props.audienceOf ? this.props.audienceOf(note) : this.recipients();
    }

    private showRoles(): boolean {
        return this.props.showRoles === undefined ? true : resolve(this.props.showRoles);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            context: { textContent: () => resolve(this.props.context) },
            body: {
                value: () => this.draft.get(),
                placeholder: () => t('notes.placeholder'),
                'aria-label': () => t('notes.placeholder'),
                oninput: (e: Event) => this.draft.set((e.target as HTMLTextAreaElement).value),
            },
            submit: { textContent: () => t('notes.submit') },
            hint: { textContent: () => visibilityHint(this.recipients(), this.draftShared.get()) },
            empty: {
                textContent: () => t('notes.empty'),
                className: () => this.notes.items.get().length === 0
                    ? 'note-thread__empty' : 'note-thread__empty hidden',
            },
            error: { textContent: () => this.notes.error.get()?.message ?? '' },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const body = this.draft.get().trim();
                    if (!body) return;
                    const shared = this.draftShared.get() && this.canShare();
                    const ok = await this.notes.create(body, shared ? 'shared' : 'private');
                    if (ok) {
                        this.draft.set('');
                        this.draftShared.set(false);
                    }
                },
            },
        });

        const level = this.props.headingLevel ?? 3;
        const titleHost = this.ref(frag, 'titleHost');
        const titleEl = document.createElement(`h${level}`);
        titleEl.className = 'note-thread__title';
        this.track(effect(() => {
            titleEl.textContent = threadTitle(this.notes.items.get().length);
        }));
        titleHost.replaceWith(titleEl);

        this.buildVisibility(this.ref(frag, 'visibility'), this.draftShared);

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.confirmOpen,
            title: t('notes.deleteTitle'),
            message: () => t('notes.deleteConsequence'),
            confirmLabel: t('notes.delete'),
            cancelLabel: t('notes.cancel'),
            danger: true,
            onconfirm: async () => {
                const id = this.pendingDelete.get();
                this.pendingDelete.set(null);
                if (id) await this.notes.delete(id);
            },
            oncancel: () => this.pendingDelete.set(null),
        });

        // Keyed on the facts that change an entry's DOM — body/visibility edits
        // bump `updatedAt`, and entering edit mode re-keys just that one entry.
        // Everything else is a no-op re-render, so child components and their
        // effects are built once and disposed with their row.
        this.$each(
            this.ref(frag, 'list'),
            () => this.notes.items.get(),
            (note, _index, track) => this.renderEntry(note, track),
            (note) => [
                note.id,
                note.updatedAt,
                this.editingId.get() === note.id,
                this.auth.currentUser.get()?.id ?? '',
                this.showRoles(),
            ].join('|'),
        );

        return frag;
    }

    /**
     * The Privat/Delad control. Two buttons rather than a checkbox: a checkbox
     * has only one label, which is exactly how an unlabelled "shared" state
     * gets created. Here both states are always spelled out.
     */
    private buildVisibility(
        host: HTMLElement,
        shared: Signal<boolean>,
        track: (d: () => void) => void = (d) => this.track(d),
    ): void {
        host.setAttribute('role', 'group');
        host.setAttribute('aria-label', t('notes.visibility'));

        const makeOption = (value: boolean) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.addEventListener('click', () => shared.set(value));
            host.appendChild(button);

            track(effect(() => {
                const recipients = this.recipients();
                const on = shared.get() === value;
                button.setAttribute('aria-pressed', String(on));
                if (value) {
                    // The shared option NAMES its audience — or says plainly
                    // that there is nobody to share with and disables itself.
                    // It never renders a bare "Delad".
                    button.disabled = recipients.length === 0;
                    button.textContent = recipients.length === 0
                        ? t('notes.shareUnavailable')
                        : shareLabel(recipients, true);
                } else {
                    button.textContent = t('share.private');
                }
            }));
        };

        makeOption(false);
        makeOption(true);

        // A recipient list that empties out must not leave a shared draft armed.
        track(effect(() => {
            if (!this.canShare() && shared.get()) shared.set(false);
        }));
    }

    private renderEntry(note: Note, track: (d: () => void) => void): HTMLElement {
        const me = this.auth.currentUser.get()?.id;
        const isEditing = this.editingId.get() === note.id;
        const role = this.props.roleOf(note);
        const li = document.createElement('li');
        li.className = `note-thread__entry note-thread__entry--${role}`;

        const meta = document.createElement('div');
        meta.className = 'note-thread__meta';
        li.appendChild(meta);

        const markerHost = document.createElement('span');
        meta.appendChild(markerHost);
        mountInto(markerHost, new PersonMarkerComponent({
            name: note.authorDisplayName,
            role,
            showRole: this.showRoles(),
        }), track);

        const time = document.createElement('time');
        time.className = 'note-thread__time';
        time.dateTime = note.createdAt;
        time.textContent = noteTimestamp(note.createdAt);
        meta.appendChild(time);

        const chipHost = document.createElement('span');
        meta.appendChild(chipHost);
        mountInto(chipHost, new ShareChipComponent({
            recipients: () => this.audienceOf(note),
            shared: note.visibility === 'shared',
        }), track);

        if (isEditing) {
            const textarea = document.createElement('textarea');
            textarea.rows = 3;
            textarea.value = this.editingBody.peek();
            textarea.setAttribute('aria-label', t('notes.placeholder'));
            textarea.addEventListener('input', () =>
                this.editingBody.set(textarea.value));
            li.appendChild(textarea);

            const footer = document.createElement('div');
            footer.className = 'note-thread__footer';
            const visibility = document.createElement('div');
            visibility.className = 'note-thread__visibility';
            this.buildVisibility(visibility, this.editingShared, track);
            footer.appendChild(visibility);
            li.appendChild(footer);

            const actions = document.createElement('div');
            actions.className = 'note-thread__entry-actions';
            actions.append(
                this.entryButton(t('notes.save'), async () => {
                    const body = this.editingBody.get().trim();
                    if (!body) return;
                    const ok = await this.notes.update(note.id, {
                        body,
                        visibility: this.editingShared.get() && this.canShare() ? 'shared' : 'private',
                    });
                    if (ok) this.editingId.set(null);
                }),
                this.entryButton(t('notes.cancel'), () => this.editingId.set(null)),
            );
            li.appendChild(actions);
        } else {
            const body = document.createElement('p');
            body.className = 'note-thread__body';
            body.textContent = note.body;
            li.appendChild(body);

            // Author-only. Reading a thread never offers to edit someone else's
            // words, and the server enforces the same rule.
            if (me && note.authorId === me) {
                const actions = document.createElement('div');
                actions.className = 'note-thread__entry-actions';
                actions.append(
                    this.entryButton(t('notes.edit'), () => {
                        this.editingBody.set(note.body);
                        this.editingShared.set(note.visibility === 'shared');
                        this.editingId.set(note.id);
                    }),
                    this.entryButton(t('notes.delete'), () => {
                        this.pendingDelete.set(note.id);
                        this.confirmOpen.set(true);
                    }, true),
                );
                li.appendChild(actions);
            }
        }

        return li;
    }

    private entryButton(label: string, onclick: () => void, destructive = false): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        if (destructive) button.className = 'note-thread__destructive';
        button.addEventListener('click', onclick);
        return button;
    }
}

/**
 * Mount a thread whose parent object is not known until some signal resolves.
 *
 * Every call site has the same shape — "wait for the lesson/goal/session to
 * load, then hang a thread off it" — and the obvious spelling of that,
 * `this.spawn(NoteThreadComponent, host, …)` inside an `effect`, is wrong twice
 * over:
 *
 * 1. `spawn()` ties the child to the PARENT component's lifetime, not to the
 *    effect. An effect that re-runs calls `replaceChildren()` and spawns a
 *    second thread while the first stays in `children` with its effects live
 *    and its `NotesService` still subscribed. Re-running is not rare: these
 *    effects read the object being edited, so every reload orphaned one.
 * 2. Rebuilding on every read also discards the composer's draft. A note half
 *    typed when the parent reloads is a note the writer loses silently.
 *
 * So the thread is rebuilt only when its identity — `parentKind:parentId` —
 * actually changes, and the previous instance is destroyed first. The reactive
 * props are thunks, so context, recipients and roles stay live without a
 * rebuild.
 */
export function mountThread(
    host: HTMLElement,
    props: () => NoteThreadProps | null,
    track: (dispose: () => void) => void,
): void {
    let current: NoteThreadComponent | null = null;
    let key: string | null = null;

    track(effect(() => {
        // Read the props INSIDE the tracked scope so the effect re-runs when
        // the parent resolves; build the component outside it, as spawn() does.
        const next = props();
        const nextKey = next ? `${next.parentKind}:${next.parentId}` : null;
        if (nextKey === key) return;
        key = nextKey;
        untrack(() => {
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!next) return;
            const thread = new NoteThreadComponent(next);
            thread.mount(host);
            current = thread;
        });
    }));

    track(() => {
        current?.destroy();
        current = null;
        key = null;
        host.replaceChildren();
    });
}

/**
 * A group of threads that a list effect rebuilds wholesale.
 *
 * The per-exercise threads hang off lists that re-render with
 * `replaceChildren()`, so their components must be destroyed before the next
 * pass builds the replacements. `spawn()` cannot do this — it holds every
 * thread it ever made until the whole page unmounts — so the pool owns them and
 * `reset()` is called at the top of each pass.
 */
export class ThreadPool {
    private open: NoteThreadComponent[] = [];

    constructor(track: (dispose: () => void) => void) {
        track(() => this.reset());
    }

    /** Destroy the current generation. Call before rebuilding the list. */
    reset(): void {
        for (const thread of this.open) thread.destroy();
        this.open.length = 0;
    }

    /** Build one thread, outside the caller's tracking scope, as spawn() does. */
    mount(host: HTMLElement, props: NoteThreadProps): void {
        untrack(() => {
            const thread = new NoteThreadComponent(props);
            thread.mount(host);
            this.open.push(thread);
        });
    }
}

/**
 * Mount a child into a row and tie its lifetime to that row's `$each` scope, so
 * a re-keyed entry disposes its markers and chips instead of leaking effects.
 */
function mountInto(host: HTMLElement, child: PersonMarkerComponent | ShareChipComponent, track: (d: () => void) => void): void {
    child.mount(host);
    track(() => child.destroy());
}
