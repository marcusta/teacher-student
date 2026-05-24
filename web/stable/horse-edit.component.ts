import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { StableService } from './stable.service';

const tpl = template(`
    <div class="horse-edit" bind="root">
        <a bind="back" href="/hastar" class="horse-edit__back">← Tillbaka</a>
        <h2>Redigera häst</h2>
        <div bind="missing" class="horse-edit__missing">Hästen kunde inte hittas.</div>
        <form bind="form" class="horse-edit__form">
            <input bind="nameInput" type="text" placeholder="Namn" maxlength="200" required>
            <div class="horse-edit__row">
                <button bind="submit" type="submit">Spara</button>
                <button bind="archive" type="button" class="horse-edit__archive">Arkivera</button>
                <div class="error" bind="error"></div>
            </div>
        </form>
    </div>
`);

export class HorseEditComponent extends Component {
    static styles = `
        .horse-edit {
            max-width: 720px;

            & .horse-edit__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .horse-edit__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};

                & input {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
            }

            & .horse-edit__row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                & button { ${btn()} }
                & .horse-edit__archive {
                    background: transparent;
                    color: ${t('error')};
                    border: 1px solid ${t('error')};
                }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .horse-edit__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .horse-edit__missing { display: block; }
            &.missing .horse-edit__form { display: none; }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(StableService);
    private nameVal = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);

    onMount(): void {
        const id = this.router.route.get().split('/')[2] ?? '';
        void this.svc.get(id).then((horse) => {
            if (horse) {
                this.nameVal.set(horse.name);
                this.found.set(true);
            } else {
                this.found.set(false);
            }
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.found.get()
                    ? 'horse-edit missing' : 'horse-edit',
            },
            back: this.router.link('/hastar'),
            nameInput: {
                value: () => this.nameVal.get(),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const name = this.nameVal.get().trim();
                    if (!name) return;
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const updated = await this.svc.update(id, { name });
                    if (updated) this.router.navigate('/hastar');
                },
            },
            archive: {
                onclick: async () => {
                    if (!window.confirm('Arkivera hästen?')) return;
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const ok = await this.svc.archive(id);
                    if (ok) this.router.navigate('/hastar');
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
        });
    }
}
