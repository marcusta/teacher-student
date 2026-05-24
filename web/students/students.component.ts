import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { StudentsService } from './students.service';
import type { Student } from '../api';

const tpl = template(`
    <div class="students" bind="root">
        <h2>Mina elever</h2>
        <div class="error" bind="error"></div>
        <div bind="empty" class="students__empty">Du har inga elever ännu.</div>
        <ul bind="list" class="students__list"></ul>
    </div>
`);

export class StudentsComponent extends Component {
    static styles = `
        .students {
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

            & .students__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .students__empty.hidden { display: none; }

            & .students__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .students__item {
                display: block;
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                color: ${t('text')};
                text-decoration: none;
                transition: background 0.15s;

                &:hover { background: ${t('hover-bg')}; }
            }

            & .students__name { font-weight: 500; }
            & .students__email { display: block; font-size: 0.75rem; opacity: 0.7; }
        }
    `;

    private svc = this.inject(StudentsService);
    private router = this.inject(Router);

    onMount(): void {
        void this.svc.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            error: {
                className: () => this.svc.error.get() ? 'error show' : 'error',
                textContent: () => this.svc.error.get()?.message ?? '',
            },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'students__empty' : 'students__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items, (item) => this.renderItem(item), (item) => item.id);

        return frag;
    }

    private renderItem(item: Student): HTMLElement {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'students__item';
        a.href = `/students/${item.id}`;
        const name = document.createElement('span');
        name.className = 'students__name';
        name.textContent = item.displayName;
        const email = document.createElement('span');
        email.className = 'students__email';
        email.textContent = item.email;
        a.appendChild(name);
        a.appendChild(email);
        a.onclick = (e) => { e.preventDefault(); this.router.navigate(`/students/${item.id}`); };
        li.appendChild(a);
        return li;
    }
}
