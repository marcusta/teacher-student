import { Component, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { InvitationsService } from './invitations.service';
import type { Invitation } from '../api';

const tpl = template(`
    <div class="invitations" bind="root">
        <h2>Mina inbjudningar</h2>

        <form bind="form" class="invitations__form">
            <input bind="email" type="email" placeholder="Email" autocomplete="email" />
            <button type="submit" bind="submit">Bjud in</button>
        </form>

        <div class="error" bind="error"></div>

        <ul bind="list" class="invitations__list"></ul>
    </div>
`);

export class InvitationsComponent extends Component {
    static styles = `
        .invitations {
            max-width: 640px;

            & h2 { margin: 0 0 ${s('lg')}; }

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
                color: ${t('error')};
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
                background: ${t('surface')};
                border-radius: ${t('radius')};
            }

            & .invitations__email { flex: 1; font-size: 0.875rem; }

            & .invitations__status {
                font-size: 0.75rem;
                padding: 2px ${s('sm')};
                border-radius: ${t('radius')};
                background: ${t('hover-bg')};
                color: ${t('text')};
                text-transform: uppercase;
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
            error: {
                className: () => this.svc.error.get() ? 'error show' : 'error',
                textContent: () => {
                    const err = this.svc.error.get();
                    if (!err) return '';
                    if (err.code === 'conflict') return 'En inbjudan till den emailen är redan aktiv';
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
                oninput: (e: Event) => {
                    this.email = (e.target as HTMLInputElement).value;
                },
            },
            submit: { textContent: () => this.svc.loading.get() ? '...' : 'Bjud in' },
        });

        this.emailInput = this.ref(frag, 'email') as HTMLInputElement;

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items, (item) => this.renderItem(item), (item) => item.id);

        return frag;
    }

    private renderItem(item: Invitation): HTMLElement {
        const li = document.createElement('li');
        li.className = 'invitations__item';

        const email = document.createElement('span');
        email.className = 'invitations__email';
        email.textContent = item.inviteeEmail;
        li.appendChild(email);

        const status = document.createElement('span');
        status.className = `invitations__status invitations__status--${item.status}`;
        status.textContent = item.status;
        li.appendChild(status);

        if (item.status === 'pending') {
            const btn = document.createElement('button');
            btn.className = 'invitations__revoke';
            btn.textContent = 'Återkalla';
            btn.onclick = () => { void this.svc.revoke(item.id); };
            li.appendChild(btn);
        }

        return li;
    }
}
