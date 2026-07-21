import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { EmptyStateComponent } from '@basics/core/client/ui/empty-state';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { ProgramsService } from './programs.service';
import { descriptionExcerpt, exerciseCountLabel } from '../library/library-copy';
import type { Program } from '../api';

const tpl = template(`
    <section class="pr-list">
        <div class="pr-list__bar">
            <button bind="create" type="button" class="pr-list__create"></button>
        </div>

        <p bind="loading" class="pr-list__loading"></p>

        <div bind="errorBox" class="pr-list__error" role="alert">
            <p bind="errorText" class="pr-list__error-text"></p>
            <button bind="retry" type="button" class="pr-list__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <ul bind="list" class="pr-list__list"></ul>
    </section>
`);

/**
 * Bibliotek · Program — IA §3.6 list, the second tab of the Bibliotek
 * destination rather than a top-level navigation entry.
 *
 * Same three changes as the Övningar tab: creation moved to its own route
 * (`/program/nytt`) so retrieval comes first, the empty state carries exactly
 * one action (§4.14), and a failed fetch renders as a failure rather than as an
 * empty library.
 *
 * The row's Exercise count is fetched per Program because `GET /programs` does
 * not carry one. The "historical attachment count" §3.6 also mentions is a
 * **Backend gap** and is therefore not rendered at all, rather than as zero.
 */
export class ProgramListComponent extends Component {
    static styles = `
        .pr-list {
            & .pr-list__bar {
                display: flex;
                justify-content: flex-end;
                margin-bottom: ${s('lg')};
            }

            /*
             * Buttons are Open Sans territory; the serif is forbidden here.
             * This tab has exactly one thing to offer besides reading, so it
             * carries the primary tier.
             */
            & .pr-list__create { ${btn(token('radius-sm'), 'primary')} }

            & .pr-list__loading {
                margin: 0;
                font-family: ${token('font-ui')};
                color: ${token('text-muted')};
                font-size: 0.875rem;
            }
            & .pr-list__loading.hidden { display: none; }

            & .pr-list__error {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                flex-wrap: wrap;
                padding: ${s('md')};
                margin-bottom: ${s('lg')};
                border: 1px solid ${token('danger')};
                border-radius: ${token('radius-md')};
                background: ${token('danger-soft')};

                & .pr-list__error-text {
                    margin: 0;
                    font-family: ${token('font-ui')};
                    font-size: 0.875rem;
                    color: ${token('text')};
                }
                /* Retry is secondary: recovering from a failure is not the
                   thing this tab is for. */
                & .pr-list__retry { ${btn()} }
            }
            & .pr-list__error.hidden { display: none; }

            & .pr-list__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${token('border')};
            }
            & .pr-list__list:empty { border-top: none; }
            & .pr-list__list.hidden { display: none; }
            & .pr-list__list > li { border-bottom: 1px solid ${token('border')}; }

            & .pr-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${s('lg')};
                padding: ${s('md')} ${s('sm')};
                text-decoration: none;
                color: inherit;
                font-family: ${token('font-ui')};

                &:hover { background: ${token('surface-2')}; }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: -2px; }
            }
            & .pr-row__body {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }
            & .pr-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }
            & .pr-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${token('text-muted')};
                overflow-wrap: anywhere;
            }
            & .pr-row__count {
                font-size: 0.8125rem;
                color: ${token('text-muted')};
                white-space: nowrap;
            }

            @media (max-width: 639px) {
                & .pr-list__bar { justify-content: stretch; & button { width: 100%; } }
                & .pr-row { grid-template-columns: minmax(0, 1fr); gap: ${s('xs')}; }
            }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(ProgramsService);
    /** Distinguishes "no programs" from "not asked yet". */
    private resolved = new Signal(false);

    private failed = new Computed(() => this.svc.error.get() !== null);
    private isLoading = new Computed(() =>
        !this.failed.get() && (!this.resolved.get() || this.svc.loading.get()));
    private isEmpty = new Computed(() =>
        !this.failed.get() && this.resolved.get()
        && !this.svc.loading.get() && this.svc.items.get().length === 0);
    private hasRows = new Computed(() =>
        !this.failed.get() && this.resolved.get() && this.svc.items.get().length > 0);

    /** Exercise count per Program id. Absent = not known, which is not zero. */
    private counts = new Signal<Record<string, number>>({});

    onMount(): void {
        void this.load();
    }

    private async load(): Promise<void> {
        await this.svc.load();
        this.resolved.set(true);
        await this.loadCounts();
    }

    private async loadCounts(): Promise<void> {
        const programs = this.svc.items.peek();
        const results = await Promise.allSettled(
            programs.map(async (p) => [p.id, (await this.svc.exercisesOf(p.id)).length] as const),
        );
        const next: Record<string, number> = {};
        for (const result of results) {
            // A count that failed is simply absent, so its row renders without
            // one. Reporting an unknown count as 0 would say the Program is
            // empty, which is a different and possibly false claim.
            if (result.status === 'fulfilled') next[result.value[0]] = result.value[1];
        }
        this.counts.set(next);
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            create: {
                textContent: () => t('programs.create'),
                onclick: () => this.router.navigate('/program/nytt'),
            },
            loading: {
                textContent: () => t('programs.loading'),
                className: () => this.isLoading.get()
                    ? 'pr-list__loading' : 'pr-list__loading hidden',
            },
            errorBox: {
                className: () => this.failed.get() ? 'pr-list__error' : 'pr-list__error hidden',
            },
            errorText: { textContent: () => t('programs.error') },
            retry: {
                textContent: () => t('programs.retry'),
                onclick: () => void this.load(),
            },
            list: {
                className: () => this.hasRows.get() ? 'pr-list__list' : 'pr-list__list hidden',
            },
        });

        this.buildEmpty(this.ref(frag, 'emptyHost'));
        this.$each(
            this.ref(frag, 'list'),
            this.svc.items,
            (program, _i, track) => this.renderRow(program, track),
            (program) => `${program.id}:${program.title}:${program.description}`,
        );

        return frag;
    }

    /** §4.14: exactly one action, at most two sentences. */
    private buildEmpty(host: HTMLElement): void {
        let current: EmptyStateComponent | null = null;
        this.track(effect(() => {
            const show = this.isEmpty.get();
            current?.destroy();
            current = null;
            host.replaceChildren();
            if (!show) return;
            // Built outside the tracking scope, as `spawn()` does.
            current = untrack(() => {
                const empty = new EmptyStateComponent({
                    heading: () => t('programs.empty.heading'),
                    body: () => t('programs.empty.body'),
                    action: {
                        label: () => t('programs.empty.action'),
                        onclick: () => this.router.navigate('/program/nytt'),
                    },
                    headingLevel: 2,
                });
                empty.mount(host);
                return empty;
            });
        }));
        this.track(() => current?.destroy());
    }

    private renderRow(program: Program, track: (d: () => void) => void): HTMLElement {
        const li = document.createElement('li');
        const href = `/program/${program.id}`;
        const row = document.createElement('a');
        row.className = 'pr-row';
        row.href = href;
        row.addEventListener('click', (e) => {
            e.preventDefault();
            this.router.navigate(href);
        });

        const body = document.createElement('span');
        body.className = 'pr-row__body';

        const title = document.createElement('span');
        title.className = 'pr-row__title';
        title.textContent = program.title;
        body.appendChild(title);

        const excerpt = descriptionExcerpt(program.description);
        if (excerpt) {
            const text = document.createElement('span');
            text.className = 'pr-row__excerpt';
            text.textContent = excerpt;
            body.appendChild(text);
        }

        const count = document.createElement('span');
        count.className = 'pr-row__count';
        track(effect(() => {
            const value = this.counts.get()[program.id];
            count.textContent = value === undefined ? '' : exerciseCountLabel(value);
        }));

        row.append(body, count);
        li.appendChild(row);
        return li;
    }
}
