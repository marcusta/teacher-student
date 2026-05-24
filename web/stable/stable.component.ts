import { Component, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { StableService } from './stable.service';
import type { Horse } from '../api';

const tpl = template(`
    <div class="stable" bind="root">
        <h2>Hästar</h2>

        <form bind="form" class="stable__form">
            <input bind="nameInput" type="text" placeholder="Hästens namn" maxlength="200" required>
            <div class="stable__form-row">
                <button bind="submit" type="submit">Lägg till häst</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="stable__empty">Inga hästar än.</div>
        <ul bind="list" class="stable__list"></ul>
    </div>
`);

export class StableComponent extends Component {
    static styles = `
        .stable {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .stable__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('xl')};
                padding: ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};

                & input {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
            }

            & .stable__form-row {
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

            & .stable__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .stable__empty.hidden { display: none; }

            & .stable__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .stable__item {
                display: block;
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                color: ${t('text')};
                text-decoration: none;
            }
            & .stable__item-name { font-weight: 500; }
        }
    `;

    private svc = this.inject(StableService);
    private nameVal = new Signal('');

    onMount(): void {
        void this.svc.load();
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            nameInput: {
                value: () => this.nameVal.get(),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.nameVal.get().trim();
                    if (!name) return;
                    const ok = await this.svc.create({ name });
                    if (ok) this.nameVal.set('');
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'stable__empty' : 'stable__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items, (item) => this.renderItem(item), (item) => item.id);

        return frag;
    }

    private renderItem(item: Horse): HTMLElement {
        const li = document.createElement('li');
        const row = document.createElement('div');
        row.className = 'stable__item';
        const name = document.createElement('div');
        name.className = 'stable__item-name';
        name.textContent = item.name;
        row.appendChild(name);
        li.appendChild(row);
        return li;
    }
}
