import { Component, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { ToastService } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, card, input } from '../css';
import { StableService } from './stable.service';

const tpl = template(`
    <div class="horse-edit">
        <a bind="back" href="/hastar" class="horse-edit__back"></a>

        <p bind="loading" class="horse-edit__loading"></p>
        <div bind="missingHost"></div>

        <div bind="body" class="horse-edit__body">
            <header>
                <p bind="eyebrow" class="horse-edit__eyebrow"></p>
                <h1 bind="title" class="horse-edit__title"></h1>
            </header>

            <form bind="form" class="horse-edit__form">
                <div class="horse-edit__panel">
                    <label class="horse-edit__field">
                        <span bind="nameLabel" class="horse-edit__label"></span>
                        <input bind="nameInput" type="text" maxlength="200" class="horse-edit__input" required>
                        <span bind="nameError" class="horse-edit__field-error" role="alert"></span>
                    </label>

                    <p bind="error" class="horse-edit__error" role="alert"></p>

                    <div class="horse-edit__actions">
                        <button bind="save" type="submit" class="horse-edit__save"></button>
                    </div>
                </div>
            </form>

            <section class="horse-edit__danger">
                <h2 bind="dangerHeading" class="horse-edit__danger-title"></h2>
                <p bind="dangerBody" class="horse-edit__danger-body"></p>
                <button bind="archive" type="button" class="horse-edit__danger-action"></button>
            </section>
        </div>

        <div bind="confirmHost"></div>
    </div>
`);

/**
 * Häst — IA §3.15 detail.
 *
 * **Archive, with the history-preservation sentence §3.15 requires.**
 * `DELETE /horses/:id` archives rather than deletes — the HTTP verb deliberately
 * lies, and `horses.api.ts` says so at the handler ("Semantic delete = archive
 * (soft-delete). Lessons/notes that reference a horse should survive its
 * removal"). So the copy states both halves: the Horse leaves the stable and
 * every picker for new occasions, and stays attached to the ones already ridden.
 * A word like "Ta bort" here would promise a cascade the backend refuses to
 * perform, which is worse than saying nothing.
 *
 * There is no unarchive endpoint, so the action gets a consequence-stating
 * dialog (§4.12) rather than an "Ångra" toast that could not restore anything.
 */
export class HorseEditComponent extends Component {
    static styles = `
        .horse-edit {
            display: flex;
            flex-direction: column;
            gap: ${s('lg')};
            max-width: 34rem;
            font-family: ${token('font-ui')};

            & .horse-edit__back {
                font-size: 0.875rem;
                color: ${token('text-muted')};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${token('accent-strong')}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .horse-edit__loading {
                margin: 0;
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .horse-edit__loading.hidden { display: none; }

            & .horse-edit__body { display: flex; flex-direction: column; gap: ${s('xl')}; }
            & .horse-edit__body.hidden { display: none; }

            & .horse-edit__eyebrow {
                margin: 0 0 ${s('xs')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .horse-edit__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .horse-edit__danger-title {
                margin: 0 0 ${s('sm')};
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${token('danger')};
            }

            & .horse-edit__form { display: flex; flex-direction: column; gap: ${s('lg')}; }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .horse-edit__panel {
                ${card()}
                box-sizing: border-box;
                padding: ${s('xl')};
                display: flex;
                flex-direction: column;
                gap: ${s('lg')};
            }

            & .horse-edit__field { display: flex; flex-direction: column; gap: ${s('xs')}; }
            & .horse-edit__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }
            & .horse-edit__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('danger')};
            }
            & .horse-edit__field-error:empty { display: none; }

            & .horse-edit__input {
                ${input()}
                width: 100%;
                box-sizing: border-box;
            }

            & .horse-edit__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${token('danger')};
            }

            & .horse-edit__actions { display: flex; gap: ${s('sm')}; flex-wrap: wrap; }
            & .horse-edit__save { ${btn(token('radius-sm'), 'primary')} }

            /* §3.15: archive lives in a SEPARATED danger area, behind a rule —
               not as a second button in the save row, where a mis-aimed click
               costs a horse. */
            & .horse-edit__danger {
                padding-top: ${s('lg')};
                border-top: 1px solid ${token('border')};
            }
            & .horse-edit__danger-body {
                margin: 0 0 ${s('md')};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${token('text-muted')};
                max-width: 68ch;
            }
            & .horse-edit__danger-action { ${btn(token('radius-sm'), 'danger')} }

            @media (max-width: 639px) {
                & .horse-edit__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(StableService);
    private toasts = this.inject(ToastService);

    private nameVal = new Signal('');
    private touched = new Signal(false);
    private resolved = new Signal(false);
    private found = new Signal(false);
    private confirmArchive = new Signal(false);

    private get horseId(): string {
        return this.router.route.get().split('/')[2] ?? '';
    }

    onMount(): void {
        void this.svc.get(this.horseId).then((horse) => {
            if (horse) {
                this.nameVal.set(horse.name);
                this.found.set(true);
            }
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: this.router.link('/hastar').onclick,
                textContent: () => t('horse.back'),
            },
            loading: {
                textContent: () => t('horse.loading'),
                className: () => this.resolved.get()
                    ? 'horse-edit__loading hidden' : 'horse-edit__loading',
            },
            body: {
                className: () => this.resolved.get() && this.found.get()
                    ? 'horse-edit__body' : 'horse-edit__body hidden',
            },

            eyebrow: { textContent: () => t('horse.eyebrow') },
            title: { textContent: () => this.nameVal.get() },

            nameLabel: { textContent: () => t('horse.field.name') },
            nameInput: {
                value: () => this.nameVal.get(),
                'aria-invalid': () => String(this.touched.get() && this.nameVal.get().trim() === ''),
                oninput: (e: Event) => this.nameVal.set((e.target as HTMLInputElement).value),
            },
            nameError: {
                textContent: () => this.touched.get() && this.nameVal.get().trim() === ''
                    ? t('horse.error.name') : '',
            },
            error: { textContent: () => this.svc.error.get() ? t('horse.saveError') : '' },
            save: {
                textContent: () => t('horse.save'),
                disabled: () => this.svc.loading.get(),
            },
            form: { onsubmit: (e: Event) => void this.save(e) },

            dangerHeading: { textContent: () => t('horse.danger.heading') },
            dangerBody: { textContent: () => t('horse.danger.body') },
            archive: {
                textContent: () => t('horse.danger.action'),
                onclick: () => this.confirmArchive.set(true),
            },
        });

        this.buildMissing(this.ref(frag, 'missingHost'));

        const confirmHost = this.ref(frag, 'confirmHost');
        this.spawn(ConfirmComponent, confirmHost, {
            open: this.confirmArchive,
            title: t('horse.confirm.archive.title'),
            message: () => t('horse.confirm.archive.message'),
            confirmLabel: t('horse.danger.action'),
            cancelLabel: t('horse.confirm.dismiss'),
            danger: true,
            onconfirm: () => void this.archive(),
        });
        // `confirm.ts` keeps its panel mounted and merely transparent when
        // closed, which leaves both buttons in the tab order behind the page.
        // `inert` on the host is what actually takes them out of it.
        this.track(effect(() => {
            confirmHost.inert = !this.confirmArchive.get();
        }));

        return frag;
    }

    /**
     * A missing Horse and one in someone else's stable resolve identically — the
     * server answers 404 for both, and §3.15 asks for exactly that: the view must
     * not reveal that an object it may not read exists.
     */
    private buildMissing(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.resolved.get() && !this.found.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('horse.notFound.heading'),
                    body: () => t('horse.notFound.body'),
                    action: {
                        label: () => t('horse.notFound.action'),
                        onclick: () => this.router.navigate('/hastar'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private async save(e: Event): Promise<void> {
        e.preventDefault();
        const name = this.nameVal.get().trim();
        this.touched.set(true);
        if (!name) return;
        const updated = await this.svc.update(this.horseId, { name });
        if (!updated) return;
        this.toasts.show({ message: t('horse.saved'), variant: 'success' });
    }

    private async archive(): Promise<void> {
        const ok = await this.svc.archive(this.horseId);
        if (!ok) return;
        this.toasts.show({ message: t('horse.archived'), variant: 'success' });
        this.router.navigate('/hastar');
    }
}
