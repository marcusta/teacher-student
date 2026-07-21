import { Component, Computed, Router, Signal, effect, template, untrack } from '@basics/core/client/core';
import { TabsComponent } from '@basics/core/client/ui/tabs';
import { t } from '../i18n';
import { token } from '../theme';
import { s } from '../css';
import { ExerciseListComponent } from './exercise-list.component';
import { ProgramListComponent } from '../programs/programs.component';
import {
    LIBRARY_TABS,
    libraryTabHref,
    libraryTabLabel,
    resolveLibraryTab,
    type LibraryTab,
} from './library-copy';

const tpl = template(`
    <div class="bibliotek">
        <header class="bibliotek__head">
            <h1 bind="heading" class="bibliotek__title"></h1>
        </header>
        <div bind="tabsHost" class="bibliotek__tabs"></div>
        <div bind="panelHost" class="bibliotek__panel"></div>
    </div>
`);

/**
 * Bibliotek — IA §3.5 and §3.6, which are ONE destination with two tabs
 * (**Övningar · Program**), not two entries in the navigation.
 *
 * The merge is navigation only, exactly as §3.6 permits: "Merging Programs under
 * Bibliotek is frontend navigation and does not require route migration."
 * Nothing about the Program endpoints, ids or deep routes changed. What changed
 * is where a teacher goes to find them — `nav.structure.ts` already dropped the
 * top-level `/program` entry on this basis, which until now left the Program
 * list reachable only by typing the URL.
 *
 * **Tab state is linkable.** `?flik=program` addresses the second tab, using the
 * URL vocabulary `student-detail.component.ts` established. The default tab
 * keeps the bare `/library`, so the canonical address carries no redundant
 * query, and the bare `/program` list address forwards here (see
 * `programs-shell.component.ts`).
 *
 * The two panels are swapped rather than both mounted: each owns a list request,
 * and mounting both would fetch the whole Program library every time someone
 * opened Övningar.
 */
export class LibraryComponent extends Component {
    static styles = `
        .bibliotek {
            & .bibliotek__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
                margin-bottom: ${s('lg')};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .bibliotek__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
            }

            /* Two tabs never overflow, but the row still scrolls rather than
               wraps below 640px (UI_DECISIONS §6) so it behaves like every
               other tab row in the app. */
            & .bibliotek__tabs {
                margin-bottom: ${s('xl')};
                overflow-x: auto;
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                & .ui-tabs { min-width: max-content; }
            }

            @media (max-width: 639px) {
                & .bibliotek__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private tabQuery = this.router.query('flik');
    private activeTab = new Signal<string>(resolveLibraryTab(this.tabQuery.peek()));
    private panelKey = new Computed<LibraryTab>(() => resolveLibraryTab(this.activeTab.get()));

    onMount(): void {
        // URL → signal. `peek` on the signal so this effect subscribes only to
        // the query and the two cannot chase each other round the loop.
        this.track(effect(() => {
            const tab = resolveLibraryTab(this.tabQuery.get());
            if (this.activeTab.peek() !== tab) this.activeTab.set(tab);
        }));

        // Signal → URL. `replace`, not push: flipping between two tabs must not
        // fill the history stack, or Back stops meaning "the page I came from".
        this.track(effect(() => {
            const tab = resolveLibraryTab(this.activeTab.get());
            const current = untrack(() => resolveLibraryTab(this.tabQuery.get()));
            if (current !== tab) this.router.navigate(libraryTabHref(tab), { replace: true });
        }));
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            heading: { textContent: () => t('library.heading') },
        });

        // Labels resolve once, at construction: `TabsComponent` takes plain
        // strings. The app ships one locale and has no runtime switcher, so this
        // is the same latent limitation `student-detail.component.ts` documents,
        // and the fix is a reactive `label` on the framework component rather
        // than a rebuild loop here.
        this.spawn(TabsComponent, this.ref(frag, 'tabsHost'), {
            active: this.activeTab,
            tabs: LIBRARY_TABS.map((tab) => ({ key: tab, label: libraryTabLabel(tab) })),
        });

        this.$swap(this.ref(frag, 'panelHost'), this.panelKey, {
            ovningar: ExerciseListComponent,
            program: ProgramListComponent,
        });

        return frag;
    }
}
