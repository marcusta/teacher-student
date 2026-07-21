import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { StableService } from './stable.service';
import { activeHorses, horseRowKey, stableState } from './stable-copy';
import type { Horse } from '../api';

const tpl = template(`
    <div class="stable">
        <header class="stable__head">
            <h1 bind="heading" class="stable__title"></h1>
            <button bind="create" type="button" class="stable__create"></button>
        </header>

        <p bind="loading" class="stable__loading"></p>

        <div bind="errorBox" class="stable__error" role="alert">
            <p bind="errorText" class="stable__error-text"></p>
            <button bind="retry" type="button" class="stable__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <ul bind="list" class="stable__list"></ul>
    </div>
`);

/**
 * Hästar — IA §3.15 list.
 *
 * Retrieval first: the create form that used to sit above the rows is gone, and
 * **Lägg till häst** opens `/hastar/nytt` (§1's shared interface grammar —
 * creation "must not dominate the list").
 *
 * A failed fetch is NOT an empty stable. "Du har inga hästar" and "vi kunde inte
 * ta reda på det" lead to different next moves, so they get different states —
 * see `stableState`.
 */
export class StableComponent extends Component {
    static styles = `
        .stable {
            & .stable__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('xl')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .stable__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .stable__create { ${btn(token('radius-sm'), 'primary')} }

            & .stable__loading {
                margin: 0;
                font-family: ${token('font-ui')};
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .stable__loading.hidden { display: none; }

            & .stable__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .stable__error-text {
                    margin: 0;
                    font-family: ${token('font-ui')};
                    font-size: 0.875rem;
                    color: ${token('text')};
                }
                & .stable__retry { ${btn()} }
            }
            & .stable__error.hidden { display: none; }

            & .stable__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .stable__list:empty { border-top: none; }
            & .stable__list.hidden { display: none; }
            & .stable__list > li { border-bottom: 1px solid ${token('border')}; }

            & .horse-row {
                display: block;
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: ${token('text')};
                font-family: ${token('font-ui')};
                font-size: 0.9375rem;
                font-weight: 600;
                overflow-wrap: anywhere;

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }

            @media (max-width: 639px) {
                & .stable__title { font-size: 1.375rem; line-height: 30px; }
                & .stable__head { flex-direction: column; align-items: stretch; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(StableService);
    /** Distinguishes "no horses" from "not asked yet". */
    private resolved = new Signal(false);

    private horses = new Computed(() => activeHorses(this.svc.items.get()));
    private state = new Computed(() => stableState({
        loading: !this.resolved.get() || this.svc.loading.get(),
        failed: this.svc.error.get() !== null,
        count: this.horses.get().length,
    }));

    onMount(): void {
        void this.load();
    }

    private async load(): Promise<void> {
        await this.svc.load();
        this.resolved.set(true);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('stable.heading') },
            create: {
                textContent: () => t('stable.create'),
                onclick: () => this.router.navigate('/hastar/nytt'),
            },
            loading: {
                textContent: () => t('stable.loading'),
                className: () => this.state.get() === 'loading'
                    ? 'stable__loading' : 'stable__loading hidden',
            },
            errorBox: {
                className: () => this.state.get() === 'error'
                    ? 'stable__error' : 'stable__error hidden',
            },
            errorText: { textContent: () => t('stable.error') },
            retry: {
                textContent: () => t('stable.retry'),
                onclick: () => void this.load(),
            },
            list: {
                className: () => this.state.get() === 'rows'
                    ? 'stable__list' : 'stable__list hidden',
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'));
        this.$each(this.ref(frag, 'list'), this.horses,
            (horse) => this.renderRow(horse), horseRowKey);

        return frag;
    }

    /** §4.14 and §3.15: "Empty state links to adding the first Horse" — one action. */
    private buildEmpty(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.state.get() === 'empty';
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            // Built outside the tracking scope, as `spawn()` does: mounting runs
            // the child's render, and those reads would otherwise subscribe THIS
            // effect and rebuild on unrelated changes.
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('stable.empty.heading'),
                    body: () => t('stable.empty.body'),
                    action: {
                        label: () => t('stable.empty.action'),
                        onclick: () => this.router.navigate('/hastar/nytt'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(horse: Horse): HTMLElement {
        const li = document.createElement('li');
        const href = `/hastar/${horse.id}`;
        // The row IS the anchor, so there is no branch in which a Horse renders
        // without its detail route.
        const row = document.createElement('a');
        row.className = 'horse-row';
        row.href = href;
        row.textContent = horse.name;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });
        li.appendChild(row);
        return li;
    }
}
