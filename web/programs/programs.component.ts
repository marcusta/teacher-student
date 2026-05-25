import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { ProgramsService } from './programs.service';
import type { Program } from '../api';

const tpl = template(`
    <div class="programs" bind="root">
        <h2>Program</h2>
        <p class="programs__hint">
            Återanvändbara övningssekvenser (ridprogram) i ditt bibliotek.
            Plocka in dem i lektioner eller träningspass.
        </p>

        <form bind="form" class="programs__form">
            <input bind="titleInput" type="text" placeholder="Programmets namn" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning" maxlength="4000" rows="3"></textarea>
            <div class="programs__form-row">
                <button bind="submit" type="submit">Spara program</button>
                <div class="error" bind="error"></div>
            </div>
        </form>

        <div bind="empty" class="programs__empty">Inga program än.</div>
        <ul bind="list" class="programs__list"></ul>
    </div>
`);

export class ProgramsComponent extends Component {
    static styles = `
        .programs {
            max-width: 720px;

            & h2 { margin: 0 0 ${s('sm')}; }
            & .programs__hint {
                margin: 0 0 ${s('lg')};
                font-size: 0.875rem;
                opacity: 0.75;
            }

            & .programs__form {
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

            & .programs__form-row {
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

            & .programs__empty {
                padding: ${s('lg')};
                color: ${t('text')};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .programs__empty.hidden { display: none; }

            & .programs__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
            }

            & .programs__item {
                display: block;
                padding: ${s('sm')} ${s('md')};
                background: ${t('surface')};
                border-radius: ${t('radius')};
                color: ${t('text')};
                text-decoration: none;
                transition: background 0.15s;
                &:hover { background: ${t('hover-bg')}; }
            }
            & .programs__item-title { font-weight: 500; }
            & .programs__item-desc {
                margin-top: ${s('xs')};
                font-size: 0.875rem;
                opacity: 0.8;
                white-space: pre-wrap;
            }
        }
    `;

    private svc = this.inject(ProgramsService);
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
                    const ok = await this.svc.create({
                        title,
                        description: this.descVal.get(),
                    });
                    if (ok) { this.titleVal.set(''); this.descVal.set(''); }
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
            empty: {
                className: () => this.svc.items.get().length === 0 ? 'programs__empty' : 'programs__empty hidden',
            },
        });

        const listHost = this.ref(frag, 'list');
        // Edit (024) mutates title/description in place; key includes both
        // so the framework re-renders the row when content changes.
        this.$each(
            listHost,
            this.svc.items,
            (item) => this.renderItem(item),
            (item) => `${item.id}:${item.title}:${item.description}`,
        );

        return frag;
    }

    private renderItem(item: Program): HTMLElement {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'programs__item';
        a.href = `/program/${item.id}`;
        a.onclick = (e) => { e.preventDefault(); this.router.navigate(`/program/${item.id}`); };

        const title = document.createElement('div');
        title.className = 'programs__item-title';
        title.textContent = item.title;
        a.appendChild(title);

        if (item.description) {
            const desc = document.createElement('div');
            desc.className = 'programs__item-desc';
            desc.textContent = item.description;
            a.appendChild(desc);
        }

        li.appendChild(a);
        return li;
    }
}
