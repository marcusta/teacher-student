import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { PlansService } from './plans.service';
import type { Plan } from '../api';

const tpl = template(`
    <div class="plans" bind="root">
        <h2>Träningsplaner</h2>

        <form bind="form" class="plans__form">
            <input bind="titleInput" type="text" placeholder="Planens titel" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning (valfritt)" maxlength="5000" rows="3"></textarea>
            <div class="plans__form-row">
                <button bind="submit" type="submit">Skapa plan</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="plans__empty">Inga planer än.</div>
        <ul bind="list" class="plans__list"></ul>
    </div>
`);

export class PlansComponent extends Component {
    static styles = `
        .plans {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .plans__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('xl')};
                padding: ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};

                & input, & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                    font-family: inherit;
                }
            }

            & .plans__form-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};

                & button { ${btn()} }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .plans__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .plans__empty.hidden { display: none; }

            & .plans__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .plans__item {
                display: block;
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                color: ${t('text')};
                text-decoration: none;
                transition: background 0.15s;
                &:hover { background: ${t('hover-bg')}; }
            }
            & .plans__item.archived { opacity: 0.65; }
            & .plans__item-title { font-weight: 500; }
            & .plans__item-meta {
                font-size: 0.8125rem;
                opacity: 0.7;
                margin-top: ${s('xs')};
            }
        }
    `;

    private svc = this.inject(PlansService);
    private router = this.inject(Router);
    private titleVal = new Signal('');
    private descVal = new Signal('');

    onMount(): void {
        void this.svc.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            titleInput: {
                value: () => this.titleVal.get(),
                oninput: (e: Event) => this.titleVal.set((e.target as HTMLInputElement).value),
            },
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const title = this.titleVal.get().trim();
                    if (!title) return;
                    const description = this.descVal.get().trim();
                    const ok = await this.svc.create({
                        title,
                        ...(description ? { description } : {}),
                    });
                    if (ok) {
                        this.titleVal.set('');
                        this.descVal.set('');
                    }
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'plans__empty' : 'plans__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items, (item) => this.renderItem(item), (item) => `${item.id}:${item.status}:${item.title}`);

        return frag;
    }

    private renderItem(item: Plan): HTMLElement {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = item.status === 'archived' ? 'plans__item archived' : 'plans__item';
        a.href = `/planer/${item.id}`;
        a.onclick = (e) => { e.preventDefault(); this.router.navigate(`/planer/${item.id}`); };
        const title = document.createElement('div');
        title.className = 'plans__item-title';
        title.textContent = item.title;
        a.appendChild(title);
        if (item.status === 'archived') {
            const meta = document.createElement('div');
            meta.className = 'plans__item-meta';
            meta.textContent = 'Arkiverad';
            a.appendChild(meta);
        }
        li.appendChild(a);
        return li;
    }
}
