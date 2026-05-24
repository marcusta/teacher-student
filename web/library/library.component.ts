import { Component, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { LibraryService } from './library.service';
import type { Exercise } from '../api';

const tpl = template(`
    <div class="library" bind="root">
        <h2>Bibliotek</h2>

        <form bind="form" class="library__form">
            <input bind="nameInput" type="text" placeholder="Övningens namn" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning" maxlength="4000" rows="3"></textarea>
            <div class="library__form-row">
                <button bind="submit" type="submit">Spara övning</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="library__empty">Inga övningar än.</div>
        <ul bind="list" class="library__list"></ul>
    </div>
`);

export class LibraryComponent extends Component {
    static styles = `
        .library {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('lg')}; }

            & .library__form {
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
                }
                & textarea { font-family: inherit; resize: vertical; }
            }

            & .library__form-row {
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

            & .library__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .library__empty.hidden { display: none; }

            & .library__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .library__item {
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
            }
            & .library__item-name { font-weight: 500; }
            & .library__item-desc {
                margin-top: ${s('xs')};
                font-size: 0.875rem;
                opacity: 0.8;
                white-space: pre-wrap;
            }
        }
    `;

    private svc = this.inject(LibraryService);
    private nameVal = new Signal('');
    private descVal = new Signal('');

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
            descInput: {
                value: () => this.descVal.get(),
                oninput: (e: Event) => this.descVal.set((e.target as HTMLTextAreaElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.nameVal.get().trim();
                    if (!name) return;
                    const ok = await this.svc.create({
                        name,
                        description: this.descVal.get(),
                    });
                    if (ok) { this.nameVal.set(''); this.descVal.set(''); }
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'library__empty' : 'library__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        this.$each(listHost, this.svc.items, (item) => this.renderItem(item), (item) => item.id);

        return frag;
    }

    private renderItem(item: Exercise): HTMLElement {
        const li = document.createElement('li');
        li.className = 'library__item';

        const name = document.createElement('div');
        name.className = 'library__item-name';
        name.textContent = item.name;
        li.appendChild(name);

        if (item.description) {
            const desc = document.createElement('div');
            desc.className = 'library__item-desc';
            desc.textContent = item.description;
            li.appendChild(desc);
        }

        return li;
    }
}
