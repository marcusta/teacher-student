import { Component, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn } from '../css';
import { InboxService } from './inbox.service';
import type { Invitation } from '../api';

const tpl = template(`
    <div class="inbox" bind="root">
        <h2>Inkorg</h2>
        <div class="error" bind="error"></div>
        <div bind="empty" class="inbox__empty">Inga väntande inbjudningar.</div>
        <ul bind="list" class="inbox__list"></ul>
    </div>
`);

export class InboxComponent extends Component {
    static styles = `
        .inbox {
            max-width: 640px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .error {
                display: none;
                padding: ${s('sm')} ${s('md')};
                margin-bottom: ${s('md')};
                color: ${t('error')};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .inbox__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .inbox__empty.hidden { display: none; }

            & .inbox__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .inbox__item {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
            }

            & .inbox__from { flex: 1; font-size: 0.875rem; }

            & .inbox__accept,
            & .inbox__decline {
                font-size: 0.75rem;
                padding: ${s('xs')} ${s('sm')};
                ${btn()}
            }
        }
    `;

    private svc = this.inject(InboxService);

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
                    if (err.code === 'conflict') return 'Inbjudan är inte längre giltig';
                    return err.message;
                },
            },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'inbox__empty' : 'inbox__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items, (item) => this.renderItem(item), (item) => item.id);

        return frag;
    }

    private renderItem(item: Invitation): HTMLElement {
        const li = document.createElement('li');
        li.className = 'inbox__item';

        const from = document.createElement('span');
        from.className = 'inbox__from';
        from.textContent = `Inbjudan från lärare (${item.teacherId.slice(0, 8)}…)`;
        li.appendChild(from);

        const accept = document.createElement('button');
        accept.className = 'inbox__accept';
        accept.textContent = 'Acceptera';
        accept.onclick = () => { void this.svc.accept(item.id); };
        li.appendChild(accept);

        const decline = document.createElement('button');
        decline.className = 'inbox__decline';
        decline.textContent = 'Avböj';
        decline.onclick = () => { void this.svc.decline(item.id); };
        li.appendChild(decline);

        return li;
    }
}
