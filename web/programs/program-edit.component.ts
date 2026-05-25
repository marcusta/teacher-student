import { Component, Router, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { ProgramsService } from './programs.service';

const tpl = template(`
    <div class="program-edit" bind="root">
        <a bind="back" href="/program" class="program-edit__back">← Tillbaka</a>
        <h2>Redigera program</h2>
        <div bind="missing" class="program-edit__missing">Programmet kunde inte hittas.</div>
        <form bind="form" class="program-edit__form">
            <input bind="titleInput" type="text" placeholder="Namn" maxlength="200" required>
            <textarea bind="descInput" placeholder="Beskrivning" maxlength="4000" rows="5"></textarea>
            <div class="program-edit__row">
                <button bind="submit" type="submit">Spara</button>
                <div class="error" bind="error"></div>
            </div>
        </form>
    </div>
`);

export class ProgramEditComponent extends Component {
    static styles = `
        .program-edit {
            max-width: 720px;

            & .program-edit__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .program-edit__form {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};

                & input, & textarea {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
                & textarea { font-family: inherit; resize: vertical; }
            }

            & .program-edit__row {
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

            & .program-edit__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .program-edit__missing { display: block; }
            &.missing .program-edit__form { display: none; }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(ProgramsService);
    private titleVal = new Signal('');
    private descVal = new Signal('');
    private resolved = new Signal(false);
    private found = new Signal(true);

    onMount(): void {
        const id = this.router.route.get().split('/')[2] ?? '';
        void this.svc.get(id).then((p) => {
            if (p) {
                this.titleVal.set(p.title);
                this.descVal.set(p.description);
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
                    ? 'program-edit missing' : 'program-edit',
            },
            back: this.router.link('/program'),
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
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const updated = await this.svc.update(id, {
                        title,
                        description: this.descVal.get(),
                    });
                    if (updated) this.router.navigate('/program');
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
        });
    }
}
