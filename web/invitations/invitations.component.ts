import { Component, template } from '@basics/core/client/core';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, input } from '../css';
import { InvitationsService } from './invitations.service';
import type { Invitation } from '../api';

const tpl = template(`
    <div class="invitations" bind="root">
        <h1 bind="heading"></h1>

        <form bind="form" class="invitations__form">
            <input bind="email" type="email" autocomplete="email" />
            <button type="submit" bind="submit"></button>
        </form>

        <div class="error" bind="error"></div>

        <ul bind="list" class="invitations__list"></ul>
    </div>
`);

// Wired rather than built imperatively for the reason `inbox.component.ts`
// states: `$each` keys rows by id, so only a per-row binding follows the locale.
const itemTpl = template(`
    <li class="invitations__item">
        <span bind="email" class="invitations__email"></span>
        <span bind="status"></span>
    </li>
`);

const revokeTpl = template(`
    <button bind="revoke" type="button" class="invitations__revoke"></button>
`);

export class InvitationsComponent extends Component {
    static styles = `
        .invitations {
            max-width: 640px;

            /* h1, not h2: this is the only heading on a top-level destination,
               so the document would otherwise start at level 2 — and below
               640px, where the top bar drops its page title, this heading is
               the ONLY thing naming the page. 1.5rem keeps the rendering
               identical to the h2 it replaced (the UA default for h2 is
               1.5em of the root); only the semantics changed. */
            & h1 {
                margin: 0 0 ${s('lg')};
                font-size: 1.5rem;
            }

            & .invitations__form {
                display: flex;
                gap: ${s('sm')};
                margin-bottom: ${s('lg')};

                & input {
                    flex: 1;
                    padding: ${s('sm')} ${s('md')};
                    font-size: 0.875rem;
                    ${input()}
                }

                & button {
                    padding: ${s('sm')} ${s('lg')};
                    font-size: 0.875rem;
                    ${btn()}
                }
            }

            & .error {
                display: none;
                padding: ${s('sm')} ${s('md')};
                margin-bottom: ${s('md')};
                color: ${token('danger')};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .invitations__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .invitations__item {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: ${s('sm')} ${s('md')};
                background: ${token('surface')};
                border-radius: ${token('radius-md')};
            }

            & .invitations__email { flex: 1; font-size: 0.875rem; }

            & .invitations__status {
                font-size: 0.75rem;
                padding: 2px ${s('sm')};
                border-radius: ${token('radius-md')};
                background: ${token('surface-2')};
                color: ${token('text')};
                /* No text-transform: the status used to be the raw enum
                   ('pending'), which uppercasing made presentable. It is now
                   authored copy — "Väntar på svar" — and shouting a whole
                   phrase is not what §4.4 asks a status chip to do. */
            }

            & .invitations__revoke {
                font-size: 0.75rem;
                padding: ${s('xs')} ${s('sm')};
                ${btn()}
            }
        }
    `;

    private svc = this.inject(InvitationsService);
    private email = '';
    private emailInput: HTMLInputElement | null = null;

    onMount(): void {
        void this.svc.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            heading: { textContent: () => t('invitations.page.heading') },
            error: {
                className: () => this.svc.error.get() ? 'error show' : 'error',
                textContent: () => {
                    const err = this.svc.error.get();
                    if (!err) return '';
                    // Only the codes this view knows get a translated sentence;
                    // `err.message` is the server's own text and stays as sent.
                    if (err.code === 'conflict') return t('invitations.page.error.conflict');
                    return err.message;
                },
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const ok = await this.svc.create(this.email);
                    if (ok && this.emailInput) {
                        this.email = '';
                        this.emailInput.value = '';
                    }
                },
            },
            email: {
                placeholder: () => t('invitations.page.email'),
                oninput: (e: Event) => {
                    this.email = (e.target as HTMLInputElement).value;
                },
            },
            submit: {
                textContent: () => this.svc.loading.get()
                    ? t('invitations.page.submitting')
                    : t('invitations.page.submit'),
            },
        });

        this.emailInput = this.ref(frag, 'email') as HTMLInputElement;

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items,
            (item, _i, track) => this.renderItem(item, track), (item) => item.id);

        return frag;
    }

    private renderItem(item: Invitation, track: (d: () => void) => void): HTMLElement {
        const li = this.wireEl(itemTpl, {
            email: { textContent: () => item.inviteeEmail },
            status: {
                // The same five keys the Elever view's status pill reads — one
                // spelling of "Väntar på svar" for both places it appears.
                textContent: () => t(`invitations.status.${item.status}`),
                className: () => `invitations__status invitations__status--${item.status}`,
            },
        }, track);

        if (item.status === 'pending') {
            li.appendChild(this.wireEl(revokeTpl, {
                revoke: {
                    textContent: () => t('invitations.revoke'),
                    onclick: () => { void this.svc.revoke(item.id); },
                },
            }, track));
        }

        return li;
    }
}
