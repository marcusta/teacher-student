import { Component, template } from '@basics/core/client/core';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { InboxService } from './inbox.service';
import type { InboxInvitation } from '../api';

const tpl = template(`
    <div class="inbox" bind="root">
        <h1 bind="heading"></h1>
        <div class="error" bind="error"></div>
        <div bind="empty" class="inbox__empty"></div>
        <ul bind="list" class="inbox__list"></ul>
    </div>
`);

// A row's copy is locale-dependent, and `$each` keys rows by `item.id` — so a
// locale switch never rebuilds them. Wiring the row through `wireEl` with the
// row's own track scope is what makes the text follow `setLocale`; building it
// imperatively would freeze it at whatever language it first rendered in.
const itemTpl = template(`
    <li class="inbox__item">
        <span bind="from" class="inbox__from"></span>
        <button bind="accept" type="button" class="inbox__accept"></button>
        <button bind="decline" type="button" class="inbox__decline"></button>
    </li>
`);

export class InboxComponent extends Component {
    static styles = `
        .inbox {
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

            & .error {
                display: none;
                padding: ${s('sm')} ${s('md')};
                margin-bottom: ${s('md')};
                color: ${token('danger')};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .inbox__empty {
                padding: ${s('lg')};
                color: ${token('text')};
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
                background: ${token('surface')};
                border-radius: ${token('radius-md')};
            }

            & .inbox__from { flex: 1; font-size: 0.875rem; }

            & .inbox__accept,
            & .inbox__decline {
                ${btn()}
                font-size: 0.75rem;
                padding: ${s('xs')} ${s('sm')};
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
            heading: { textContent: () => t('inbox.heading') },
            error: {
                className: () => this.svc.error.get() ? 'error show' : 'error',
                textContent: () => {
                    const err = this.svc.error.get();
                    if (!err) return '';
                    // Only the codes this view knows get a translated sentence;
                    // `err.message` is the server's own text and stays as sent.
                    if (err.code === 'conflict') return t('inbox.error.conflict');
                    return err.message;
                },
            },
            empty: {
                textContent: () => t('inbox.empty'),
                className: () => this.svc.items.get().length === 0 ? 'inbox__empty' : 'inbox__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items,
            (item, _i, track) => this.renderItem(item, track), (item) => item.id);

        return frag;
    }

    private renderItem(item: InboxInvitation, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(itemTpl, {
            from: {
                textContent: () => t('inbox.from', {
                    name: item.teacherDisplayName,
                    email: item.teacherEmail,
                }),
            },
            accept: {
                textContent: () => t('inbox.accept'),
                onclick: () => { void this.svc.accept(item.id); },
            },
            decline: {
                textContent: () => t('inbox.decline'),
                onclick: () => { void this.svc.decline(item.id); },
            },
        }, track);
    }
}
