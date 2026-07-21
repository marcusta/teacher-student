import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn, input } from '../css';
import { LibraryService } from './library.service';
import {
    descriptionExcerpt,
    exerciseListState,
    exerciseRowKey,
    filterExercises,
    shouldOfferSearch,
} from './library-copy';
import type { Exercise } from '../api';

const tpl = template(`
    <section class="ex-list">
        <div class="ex-list__bar">
            <label bind="searchField" class="ex-list__search">
                <span bind="searchLabel" class="ex-list__search-label"></span>
                <input bind="searchInput" type="search" class="ex-list__search-input" autocomplete="off">
            </label>
            <button bind="create" type="button" class="ex-list__create"></button>
        </div>

        <p bind="loading" class="ex-list__loading"></p>

        <div bind="errorBox" class="ex-list__error" role="alert">
            <p bind="errorText" class="ex-list__error-text"></p>
            <button bind="retry" type="button" class="ex-list__retry"></button>
        </div>

        <div bind="emptyHost"></div>
        <div bind="noMatchesHost"></div>

        <ul bind="list" class="ex-list__list"></ul>
    </section>
`);

/**
 * Bibliotek · Övningar — IA §3.5 list.
 *
 * **Retrieval first.** The create form is gone from this view entirely; §1's
 * shared interface grammar says creation "must not dominate the list as it does
 * in the test client", so **Ny övning** is a single header action that opens
 * `/library/nytt`. That also means the list is never inert behind a pending
 * create, which is what the old `inert` binding on the whole view did.
 *
 * **Search appears with volume** (§3.5 step 2, "when volume requires it"). Below
 * `SEARCH_THRESHOLD` rows the entire library is on one screen and a search box
 * is a tab stop that teaches nothing.
 *
 * **Three list-less states, not one.** A failed fetch, an empty library and a
 * search that matched nothing are different facts and get different single
 * actions (§4.14). Collapsing them — which the old view did, rendering "Inga
 * övningar än." for all three — offers to create a first exercise to a teacher
 * who has forty and mistyped, and quietly reports a network failure as success.
 */
export class ExerciseListComponent extends Component {
    static styles = `
        .ex-list {
            & .ex-list__bar {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('lg')};
            }

            & .ex-list__search {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                flex: 1 1 18rem;
                max-width: 26rem;
            }
            & .ex-list__search.hidden { display: none; }
            & .ex-list__search-label {
                font-family: ${token('font-ui')};
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${token('text')};
            }
            /* The one field in the app that is NOT in a card: it belongs to the
               list's toolbar, on the page surface, where a panel around a single
               search box would announce itself louder than the rows it filters.
               So it keeps a raised fill instead of the recipe's recessed --bg,
               which on this background would leave nothing but the borders. */
            & .ex-list__search-input {
                ${input()}
                background: ${token('surface')};
                width: 100%;
                box-sizing: border-box;
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .ex-list__create {
                ${btn(token('radius-sm'), 'primary')}
                margin-left: auto;
            }

            & .ex-list__loading {
                margin: 0;
                font-family: ${token('font-ui')};
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .ex-list__loading.hidden { display: none; }

            & .ex-list__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .ex-list__error-text {
                    margin: 0;
                    font-family: ${token('font-ui')};
                    font-size: 0.875rem;
                    color: ${token('text')};
                }
                & .ex-list__retry { ${btn()} }
            }
            & .ex-list__error.hidden { display: none; }

            & .ex-list__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .ex-list__list:empty { border-top: none; }
            & .ex-list__list.hidden { display: none; }
            & .ex-list__list > li { border-bottom: 1px solid ${token('border')}; }

            & .ex-row {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-family: ${token('font-ui')};

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }
            & .ex-row__name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .ex-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }

            @media (max-width: 639px) {
                & .ex-list__bar { flex-direction: column; align-items: stretch; }
                & .ex-list__create { margin-left: 0; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LibraryService);
    private query = new Signal('');
    /** Distinguishes "no exercises" from "not asked yet" — see `exerciseListState`. */
    private resolved = new Signal(false);

    private failed = new Computed(() => this.svc.error.get() !== null);
    private visible = new Computed(() => filterExercises(this.svc.items.get(), this.query.get()));
    private state = new Computed(() => exerciseListState({
        loading: !this.resolved.get() || this.svc.loading.get(),
        failed: this.failed.get(),
        total: this.svc.items.get().length,
        visible: this.visible.get().length,
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
            searchField: {
                className: () => shouldOfferSearch(this.svc.items.get().length)
                    ? 'ex-list__search' : 'ex-list__search hidden',
            },
            searchLabel: { textContent: () => t('library.search.label') },
            searchInput: {
                value: () => this.query.get(),
                placeholder: () => t('library.search.placeholder'),
                oninput: (e: Event) => this.query.set((e.target as HTMLInputElement).value),
            },
            create: {
                textContent: () => t('library.create'),
                onclick: () => this.router.navigate('/library/nytt'),
            },
            loading: {
                textContent: () => t('library.loading'),
                className: () => this.state.get() === 'loading'
                    ? 'ex-list__loading' : 'ex-list__loading hidden',
            },
            errorBox: {
                className: () => this.state.get() === 'error'
                    ? 'ex-list__error' : 'ex-list__error hidden',
            },
            errorText: { textContent: () => t('library.error') },
            retry: {
                textContent: () => t('library.retry'),
                onclick: () => void this.load(),
            },
            list: {
                className: () => this.state.get() === 'rows'
                    ? 'ex-list__list' : 'ex-list__list hidden',
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'), 'empty', {
            heading: 'library.empty.heading',
            body: 'library.empty.body',
            action: 'library.empty.action',
            onclick: () => this.router.navigate('/library/nytt'),
        });
        this.buildEmpty(this.ref(frag, 'noMatchesHost'), 'noMatches', {
            heading: 'library.noMatches.heading',
            body: 'library.noMatches.body',
            action: 'library.noMatches.action',
            onclick: () => this.query.set(''),
        });

        this.$each(this.ref(frag, 'list'), this.visible,
            (exercise) => this.renderRow(exercise), exerciseRowKey);

        return frag;
    }

    /** §4.14: exactly one action, at most two sentences. */
    private buildEmpty(
        host: HTMLElement,
        when: 'empty' | 'noMatches',
        copy: { heading: string; body: string; action: string; onclick: () => void },
    ): void {
        let current: EmptyStateComponent | null = null;

        this.track(effect(() => {
            const show = this.state.get() === when;
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;

            // Built outside the tracking scope, as `spawn()` does: mounting runs
            // the child's render, and those reads (locale among them) would
            // otherwise subscribe THIS effect and rebuild on unrelated changes.
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t(copy.heading),
                    body: () => t(copy.body),
                    action: { label: () => t(copy.action), onclick: copy.onclick },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(exercise: Exercise): HTMLElement {
        const li = document.createElement('li');
        const href = `/library/${exercise.id}`;
        // The row IS the anchor, so there is no branch in which an Exercise
        // renders without its detail route.
        const row = document.createElement('a');
        row.className = 'ex-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const name = document.createElement('span');
        name.className = 'ex-row__name';
        name.textContent = exercise.name;
        row.appendChild(name);

        const excerpt = descriptionExcerpt(exercise.description);
        if (excerpt) {
            const text = document.createElement('span');
            text.className = 'ex-row__excerpt';
            text.textContent = excerpt;
            row.appendChild(text);
        }

        li.appendChild(row);
        return li;
    }
}
