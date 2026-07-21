import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { PersonMarkerComponent } from '../ui/person-marker.component';
import { StudentsService } from './students.service';
import { InvitationsService } from '../invitations/invitations.service';
import { Async } from './async';
import {
    canRevoke,
    duplicateInviteMessage,
    invitationRowKey,
    invitationSentLabel,
    invitationStatusPill,
    inviteEmailError,
    isConflict,
    nextLessonSummary,
    nextLessonWith,
    rosterState,
    sortInvitations,
    sortStudents,
    studentRowKey,
} from './student-copy';
import { api, type Invitation, type LessonForUser, type Student } from '../api';

const tpl = template(`
    <div class="students">
        <header class="students__head">
            <h1 bind="heading" class="students__title"></h1>
            <button bind="invite" type="button" class="students__invite"></button>
        </header>

        <form bind="form" class="students__form">
            <label class="students__field">
                <span bind="emailLabel" class="students__label"></span>
                <input bind="emailInput" type="email" autocomplete="email" class="students__input">
                <span bind="emailHint" class="students__hint"></span>
            </label>
            <p bind="formError" class="students__form-error" role="alert"></p>
            <div class="students__form-actions">
                <button bind="send" type="submit" class="students__send"></button>
                <button bind="cancel" type="button" class="students__cancel"></button>
            </div>
        </form>

        <p bind="loading" class="students__loading"></p>

        <div bind="errorBox" class="students__error" role="alert">
            <p bind="errorText" class="students__error-text"></p>
            <button bind="retry" type="button" class="students__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="rosterSection" class="students__section">
            <ul bind="list" class="students__list"></ul>
        </section>

        <section bind="invitedSection" class="students__section">
            <h2 bind="invitedHeading" class="students__section-title"></h2>
            <p bind="invitedLede" class="students__lede"></p>
            <p bind="invitedLoading" class="students__loading"></p>
            <div bind="invitedErrorBox" class="students__error" role="alert">
                <p bind="invitedErrorText" class="students__error-text"></p>
                <button bind="invitedRetry" type="button" class="students__retry"></button>
            </div>
            <p bind="invitedEmpty" class="students__muted"></p>
            <ul bind="invitedList" class="students__list"></ul>
        </section>

        <div bind="confirmHost"></div>
    </div>
`);

/**
 * Mina elever — IA §3.3. The teacher's roster, and the outgoing invitations
 * that will become one.
 *
 * **`/invitations` is absorbed here.** The IA folds outgoing invitations into
 * this page ("outgoing invitations move into `Mina elever` rather than
 * remaining top-level navigation") because they are not a destination — they
 * are the unfinished half of the roster, and a teacher who has invited someone
 * and is waiting should see that where they look for students. The old route
 * still resolves; only its reason to exist has moved.
 *
 * **The two lists load independently, and that is a requirement rather than an
 * implementation detail.** They come from two services with their own
 * `loading`/`error` signals, they render in their own sections, and neither
 * branch of `rosterState()` may claim "you have nothing" until *both* have
 * answered. A failed invitations request therefore leaves a loaded roster
 * standing, and vice versa — IA §3.3: "one failing must not erase the other".
 *
 * **The next-Lesson summary is opportunistic.** IA §3.3 permits it "when
 * cheaply available", which rules out a request per row. `GET /lessons` is one
 * list call the reader is entitled to in full, so every row reads its summary
 * out of that single response — and if it fails, the rows simply lose the
 * summary rather than the page losing its roster. It is a third independent
 * load for exactly that reason.
 */
export class StudentsComponent extends Component {
    static styles = `
        .students {
            & .students__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .students__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .students__invite { ${btn(token('radius-sm'), 'primary')} }

            /*
             * Already a panel before this change — hand-rolled from the same
             * three properties card() sets. Now it uses the recipe, so it
             * picks up the shared elevation and cannot drift from the panels
             * on the create routes. The panel is also what makes the fields
             * legible: the §4.8 field recipe fills with --bg, so a form drawn
             * straight onto the page would give them the page's own colour.
             */
            & .students__form {
                ${card()}
                box-sizing: border-box;
                display: none;
                flex-direction: column;
                gap: ${s('md')};
                max-width: 34rem;
                padding: ${s('lg')};
                margin-bottom: ${s('xl')};
                font-family: ${token('font-ui')};
            }
            & .students__form.open { display: flex; }

            & .students__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .students__label { font-size: 0.8125rem; font-weight: 600; color: ${token('text')}; }
            & .students__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .students__input {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }
            & .students__form-error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }
            & .students__form-actions { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            /* §4.8: one primary per form. This is it. */
            & .students__send { ${btn(token('radius-sm'), 'primary')} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .students__cancel { ${btn(token('radius-sm'), 'ghost')} }

            & .students__loading {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-ui')};
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .students__loading.hidden { display: none; }

            & .students__muted {
                margin: 0;
                padding: ${s('md')} 0;
                font-family: ${token('font-ui')};
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .students__muted.hidden { display: none; }

            & .students__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};
                font-family: ${token('font-ui')};

                & .students__error-text { margin: 0; font-size: 0.875rem; color: ${token('text')}; }
                & .students__retry { ${btn()} }
            }
            & .students__error.hidden { display: none; }

            & .students__empty.hidden { display: none; }

            & .students__section { margin-bottom: ${s('xl')}; }
            & .students__section.hidden { display: none; }

            /* Section headings are the serif's other permitted home (§02). */
            & .students__section-title {
                margin: 0 0 ${s('sm')};
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('text')};
            }

            & .students__lede {
                margin: 0 0 ${s('md')};
                font-family: ${token('font-ui')};
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .students__lede.hidden { display: none; }

            & .students__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .students__list > li { border-bottom: 1px solid ${token('border')}; }

            & .student-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                align-items: center;
                gap: ${s('xs')} ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-family: ${token('font-ui')};

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }

            & .student-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            /* One meta line, not three — §4.3 allows at most two rows of text. */
            & .student-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${s('xs')} ${s('sm')};
                font-size: 0.8125rem;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }

            & .invite-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto auto;
                align-items: center;
                gap: ${s('sm')} ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                font-family: ${token('font-ui')};
            }
            & .invite-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .invite-row__email {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .invite-row__sent { font-size: 0.8125rem; color: ${token('text-muted')}; }
            /* Revoking an invitation is destructive — the outline tier says so
               without shouting a red fill at a list of pending invites. */
            & .invite-row__revoke {
                ${btn(token('radius-sm'), 'danger')}
                font-size: 0.8125rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .students__title { font-size: 1.375rem; line-height: 30px; }
                & .students__form-actions { flex-direction: column; align-items: stretch; }
                & .invite-row {
                    grid-template-columns: minmax(0, 1fr);
                    justify-items: start;
                }
            }
        }
    `;

    private router = this.inject(Router);
    private students = this.inject(StudentsService);
    private invitations = this.inject(InvitationsService);
    private toasts = this.inject(ToastService);

    /**
     * The third independent load. Not `LessonsService`: that singleton backs the
     * Lektioner view, and sharing its `loading`/`error` would make a failure
     * here visible there and vice versa.
     */
    private lessons = new Async<LessonForUser[]>();

    /**
     * Frozen at mount, for the reason `lessons.component.ts` gives: re-reading
     * the clock inside the derivation would move a lesson out of "next" on a
     * signal nothing subscribed to.
     */
    private nowIso = new Signal(new Date().toISOString());

    private emailEl: HTMLInputElement | null = null;
    private formOpen = new Signal(false);
    private emailVal = new Signal('');
    private validation = new Signal('');
    /** The invitation the confirm dialog is currently about, or null. */
    private revoking = new Signal<Invitation | null>(null);
    private confirmOpen = new Signal(false);

    private sorted = new Computed(() => sortStudents(this.students.items.get()));
    private invited = new Computed(() => sortInvitations(this.invitations.items.get()));

    private state = new Computed(() => rosterState({
        students: this.students.items.get().length,
        invitations: this.invitations.items.get().length,
        // An errored list has NOT answered. Treating a failure as "resolved to
        // zero" is precisely how a failed invitations request would turn a page
        // with a live roster into a branded "you have nobody yet".
        studentsResolved: this.students.resolved.get() && this.students.error.get() === null,
        invitationsResolved: this.invitations.resolved.get() && this.invitations.error.get() === null,
    }));

    onMount(): void {
        void this.students.load();
        void this.invitations.load();
        void this.lessons.run(() => api.lessons.list());
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('students.heading') },
            invite: {
                textContent: () => t('students.invite'),
                onclick: () => this.openForm(),
                'aria-expanded': () => String(this.formOpen.get()),
            },
            form: {
                className: () => this.formOpen.get() ? 'students__form open' : 'students__form',
                onsubmit: (e: Event) => void this.submitInvite(e),
            },
            emailLabel: { textContent: () => t('invite.field.email') },
            emailHint: { textContent: () => t('invite.field.email.hint') },
            emailInput: {
                value: () => this.emailVal.get(),
                oninput: (e: Event) => this.emailVal.set((e.target as HTMLInputElement).value),
            },
            formError: { textContent: () => this.formErrorText() },
            send: {
                textContent: () => t('invite.submit'),
                disabled: () => this.invitations.loading.get(),
            },
            cancel: {
                textContent: () => t('invite.cancel'),
                onclick: () => this.closeForm(),
            },
            loading: {
                textContent: () => t('students.loading'),
                className: () => this.students.loading.get() && this.students.items.get().length === 0
                    ? 'students__loading' : 'students__loading hidden',
            },
            errorBox: {
                className: () => this.students.error.get() ? 'students__error' : 'students__error hidden',
            },
            errorText: { textContent: () => t('students.error') },
            retry: {
                textContent: () => t('students.retry'),
                onclick: () => void this.students.load(),
            },
            rosterSection: {
                className: () => this.sorted.get().length === 0
                    ? 'students__section hidden' : 'students__section',
            },
            invitedHeading: { textContent: () => t('invitations.heading') },
            invitedLede: {
                // Shown only in the §3.3 "invitations but no accepted Relations"
                // state, where the page's job is to explain the next step rather
                // than to look empty.
                textContent: () => t('students.invitedOnly.body'),
                className: () => this.state.get() === 'invitedOnly'
                    ? 'students__lede' : 'students__lede hidden',
            },
            invitedLoading: {
                textContent: () => t('invitations.loading'),
                className: () => this.invitations.loading.get() && this.invitations.items.get().length === 0
                    ? 'students__loading' : 'students__loading hidden',
            },
            invitedErrorBox: {
                // While the form is open its own inline error owns the failure —
                // two red boxes for one failed POST reads as two problems.
                className: () => this.invitations.error.get() && !this.formOpen.get()
                    ? 'students__error' : 'students__error hidden',
            },
            invitedErrorText: { textContent: () => t('invitations.error') },
            invitedRetry: {
                textContent: () => t('students.retry'),
                onclick: () => void this.invitations.load(),
            },
            invitedEmpty: {
                textContent: () => t('invitations.empty'),
                className: () => this.invitations.resolved.get()
                    && this.invitations.error.get() === null
                    && this.invited.get().length === 0
                    ? 'students__muted' : 'students__muted hidden',
            },
            invitedSection: {
                // Hidden only in the fully-empty state, where the branded empty
                // state is the whole page and §4.14 allows it exactly one
                // action. An Inbjudna heading over "Inga inbjudningar väntar"
                // underneath it would be a second, contradictory answer.
                className: () => this.state.get() === 'empty'
                    ? 'students__section hidden' : 'students__section',
            },
        });

        this.emailEl = this.ref(frag, 'emailInput') as HTMLInputElement;

        this.buildEmpty(this.ref(frag, 'emptyHost'));

        this.$each(
            this.ref(frag, 'list'),
            this.sorted,
            (student, _i, track) => this.renderStudent(student, track),
            (student) => studentRowKey(student, this.nextLessonIso(student.id)),
        );

        this.$each(
            this.ref(frag, 'invitedList'),
            this.invited,
            (invitation, _i, track) => this.renderInvitation(invitation, track),
            invitationRowKey,
        );

        // One dialog for the whole list. Its copy is reactive and reads the
        // pending target, so no row-specific sentence sits in the DOM while it
        // is closed; the Återkalla button that opens it exists only on pending
        // rows (LESSONS #3, #5 — revoking cannot be undone, so it gets a
        // consequence-stating confirm rather than an undo toast).
        //
        // `confirm.ts` keeps its panel mounted and merely transparent when
        // closed, so its two buttons stay tabbable and stay in the
        // accessibility tree behind the page. LESSONS #3 says to gate the host
        // rather than the control, so the host is made inert while shut. This
        // is the app's guard over a framework component, not a fix to it.
        const confirmHost = this.ref(frag, 'confirmHost');
        this.track(effect(() => {
            confirmHost.toggleAttribute('inert', !this.confirmOpen.get());
        }));
        this.spawn(ConfirmComponent, confirmHost, {
            open: this.confirmOpen,
            title: t('invitations.confirm.title'),
            message: () => {
                const target = this.revoking.get();
                return target ? t('invitations.confirm.message', { email: target.inviteeEmail }) : '';
            },
            confirmLabel: t('invitations.revoke'),
            cancelLabel: t('invitations.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.revokeConfirmed(),
            oncancel: () => this.revoking.set(null),
        });

        return frag;
    }

    /**
     * The branded empty state — §4.14, exactly one action.
     *
     * Only the fully-empty case gets it. "Invitations but no accepted Relations"
     * is not an empty page: it has a list, and IA §3.3 asks for that list to be
     * preserved and the next step explained, which is what `students__lede`
     * does. An empty state above a populated list would tell the reader they
     * have nothing while showing them something.
     *
     * Built once, outside any tracking scope, with reactive copy — there is one
     * variant, so nothing here is rebuilt when the state changes (LESSONS #1:
     * never construct a component inside a tracked effect).
     */
    private buildEmpty(host: HTMLElement): void {
        const wrap = document.createElement('div');
        wrap.className = 'students__empty hidden';
        host.appendChild(wrap);

        const empty = new EmptyStateComponent({
            heading: () => t('students.empty.heading'),
            body: () => t('students.empty.body'),
            action: {
                label: () => t('students.invite'),
                onclick: () => this.openForm(),
            },
            headingLevel: 2,
        });
        empty.mount(wrap);
        this.track(() => empty.destroy());

        this.track(effect(() => {
            wrap.className = this.state.get() === 'empty'
                ? 'students__empty' : 'students__empty hidden';
        }));
    }

    private openForm(): void {
        this.formOpen.set(true);
        this.validation.set('');
        this.invitations.error.set(null);
        // Focus after the panel is displayed; focusing a `display: none` field
        // is a no-op and would leave the caret wherever it was.
        requestAnimationFrame(() => this.emailEl?.focus());
    }

    private closeForm(): void {
        this.formOpen.set(false);
        this.validation.set('');
        this.emailVal.set('');
        this.invitations.error.set(null);
    }

    /**
     * Inline error copy for the invite form.
     *
     * Field validation wins over the server's, because it is about what the
     * reader just typed. The conflict branch is keyed on `error.code`, never on
     * the message text — see `isConflict` in `student-copy.ts`.
     */
    private formErrorText(): string {
        const local = this.validation.get();
        if (local) return local;
        const err = this.invitations.error.get();
        if (!err || !this.formOpen.get()) return '';
        if (isConflict(err)) return duplicateInviteMessage(this.emailVal.get());
        return t('invite.error.failed');
    }

    private async submitInvite(e: Event): Promise<void> {
        e.preventDefault();
        const email = this.emailVal.get().trim();
        const problem = inviteEmailError(email);
        if (problem) return this.validation.set(problem);
        this.validation.set('');

        const ok = await this.invitations.create(email);
        if (!ok) return;

        this.toasts.show({ message: t('invite.sent', { email }), variant: 'success' });
        this.closeForm();
    }

    private async revokeConfirmed(): Promise<void> {
        const target = this.revoking.get();
        this.revoking.set(null);
        if (!target) return;
        await this.invitations.revoke(target.id);
        if (this.invitations.error.get()) {
            this.toasts.show({ message: t('invitations.revokeError'), variant: 'error' });
            return;
        }
        // No undo: `revoke` is one-way in the service and in the server, and
        // LESSONS #5 forbids offering an Ångra that cannot faithfully restore.
        // The consequence was stated before the fact instead.
        this.toasts.show({ message: t('invitations.toast.revoked', { email: target.inviteeEmail }) });
    }

    private nextLessonIso(studentId: string): string | null {
        const lessons = this.lessons.data.get();
        if (!lessons) return null;
        return nextLessonWith(lessons, studentId, this.nowIso.get())?.scheduledAt ?? null;
    }

    private renderStudent(student: Student, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/students/${student.id}`;
        const row = document.createElement('a');
        row.className = 'student-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const body = document.createElement('span');
        body.className = 'student-row__body';

        // §4.6: the name carries its contextual role. On a teacher's roster the
        // role is the point — these people are Elever *to this reader*, and the
        // same person may be a Lärare elsewhere in the app (IA §1).
        const markerHost = document.createElement('span');
        body.appendChild(markerHost);
        const marker = new PersonMarkerComponent({ name: student.displayName, role: 'student' });
        marker.mount(markerHost);
        track(() => marker.destroy());

        const meta = document.createElement('span');
        meta.className = 'student-row__meta';
        const email = document.createElement('span');
        email.textContent = student.email;
        meta.appendChild(email);

        // Omitted rather than negated when there is none, and absent entirely
        // while the lessons call is unresolved or failed.
        const lessons = this.lessons.data.get();
        const summary = nextLessonSummary(
            lessons ? nextLessonWith(lessons, student.id, this.nowIso.get()) : null,
        );
        if (summary) {
            const next = document.createElement('span');
            next.textContent = summary;
            meta.appendChild(next);
        }
        body.appendChild(meta);

        row.appendChild(body);
        li.appendChild(row);
        return li;
    }

    private renderInvitation(invitation: Invitation, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const row = document.createElement('div');
        row.className = 'invite-row';

        const body = document.createElement('div');
        body.className = 'invite-row__body';
        const email = document.createElement('span');
        email.className = 'invite-row__email';
        email.textContent = invitation.inviteeEmail;
        const sent = document.createElement('span');
        sent.className = 'invite-row__sent';
        // Sent time only. There is no expiry copy on this row — see
        // `invitationStatusPill` for why the `expired` status must not be
        // promised as behaviour.
        sent.textContent = invitationSentLabel(invitation.createdAt);
        body.append(email, sent);
        row.appendChild(body);

        const statusHost = document.createElement('div');
        const descriptor = invitationStatusPill(invitation.status);
        const pill = new StatusPillComponent({
            label: descriptor.label,
            variant: descriptor.variant,
            tone: descriptor.tone,
            ...(descriptor.glyph === undefined ? {} : { glyph: descriptor.glyph }),
        });
        pill.mount(statusHost);
        track(() => pill.destroy());
        row.appendChild(statusHost);

        // Withheld, not disabled, on terminal rows (LESSONS #4): the server
        // refuses `revoke` for all four terminal statuses.
        if (canRevoke(invitation.status)) {
            const revoke = document.createElement('button');
            revoke.type = 'button';
            revoke.className = 'invite-row__revoke';
            revoke.textContent = t('invitations.revoke');
            revoke.addEventListener('click', () => {
                this.revoking.set(invitation);
                this.confirmOpen.set(true);
            });
            row.appendChild(revoke);
        }

        li.appendChild(row);
        return li;
    }
}
