import { Component, Signal, effect } from '../core';

/**
 * A value that may be given literally or as a thunk.
 *
 * The thunk arm is what makes a label survive a locale switch. `t()` is itself
 * reactive — it reads the locale signal — but a prop typed as a plain `string`
 * is evaluated ONCE, at the call site, before the component ever sees it, so
 * the reactivity is spent before anything can track it. Passing `() => t('…')`
 * hands the component the *read* rather than its result, and the component
 * performs that read inside an effect it owns.
 *
 * The literal arm stays for every call site that has nothing to re-read, which
 * is what keeps this additive: no existing caller has to change.
 */
export type Reactive<T> = T | (() => T);

const resolve = <T>(value: Reactive<T>): T =>
    typeof value === 'function' ? (value as () => T)() : value;

export type TabItem = {
    key: string;
    /**
     * Display text. Pass `() => t('…')` for a label that must follow the active
     * locale; a plain string is correct for anything genuinely static.
     */
    label: Reactive<string>;
    icon?: string;
};

export type TabsProps = {
    active: Signal<string>;
    /**
     * The design system caps a tab row at seven tabs (§4.11 "Undvik: fler än
     * sju flikar"). That is a content rule, not a rendering one, so it is not
     * enforced here — an eighth tab renders, it is just the wrong design.
     * Tabs are for navigation between views only; actions belong in the page
     * header.
     */
    tabs: TabItem[];
};

/**
 * Reference a design-system CSS custom property.
 *
 * Plain reference, no `var(--new, var(--legacy))` fallback arm. Every theme the
 * framework ships or documents — `core/client/default-theme.ts` and all of
 * `apps/*` — now defines the design-system names, so there is nothing left to
 * fall back to.
 *
 * DO NOT REINTRODUCE THE CHAINS. They were not merely redundant, they were
 * unsound for two of these names, and the failure was silent:
 *
 * `var()` cannot ask "is this token defined with the design-system meaning?" —
 * only "is it defined at all". So a chain is safe only for a name the legacy
 * vocabulary never used, and `--accent` and `--surface` both were:
 *
 *   --accent   legacy: a decorative highlight. apps/stable set it to coral
 *              #FF6B6B while its action colour --primary was forest #1A2F2B.
 *              `var(--accent, var(--primary))` therefore picked coral, turning
 *              the confirm button into #F9F7F2-on-#FF6B6B — 2.59:1, a WCAG
 *              failure, and plausible enough to survive a glance.
 *   --surface  legacy: the card/panel surface, deliberately distinct from
 *              --input-bg. `var(--surface, var(--input-bg))` gave fields the
 *              panel colour and erased their edge.
 *
 * The collision is now resolved once, in the theme: a legacy-vocabulary app
 * keeps its old names as aliases pointing AT the design-system tokens
 * (`primary: var(--accent)`), rather than each recipe guessing at read time.
 */
const t = (name: string) => `var(--${name})`;

export class TabsComponent extends Component<TabsProps> {
    static styles = `
        /*
         * The row scrolls horizontally in a single line — it never wraps and
         * never degrades into a select — with an edge fade that says which way
         * the overflow runs.
         *
         * The fade is a MASK, not a gradient overlay: an overlay has to know
         * the colour it is fading into, so it breaks on any surface that is not
         * the page background and needs a second definition per theme. A mask
         * reads only alpha, so it is correct on every background in both themes
         * with one rule.
         *
         * The scroller owns the underline, not the nav: the nav is sized to
         * max-content, so a border on it would stop at the last tab rather than
         * spanning the row.
         */
        .ui-tabs__scroller {
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
            border-bottom: 1px solid ${t('border')};
        }
        .ui-tabs__scroller::-webkit-scrollbar { display: none; }
        /*
         * Each edge fades only while there is something past it, so a fade
         * always MEANS "there is more this way" — a permanent one is mere
         * decoration, and a missing one hides a tab. Mid-scroll both paint.
         * The mask colour is irrelevant (only its alpha is read), which is why
         * #000 here is not a token in disguise.
         */
        .ui-tabs__scroller.fade-start.fade-end {
            mask-image: linear-gradient(to right, transparent 0, #000 2rem, #000 calc(100% - 2rem), transparent 100%);
        }
        .ui-tabs__scroller.fade-end:not(.fade-start) {
            mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 2rem), transparent 100%);
        }
        .ui-tabs__scroller.fade-start:not(.fade-end) {
            mask-image: linear-gradient(to right, transparent 0, #000 2rem, #000 100%);
        }
        .ui-tabs {
            display: flex;
            gap: 0;
            flex-wrap: nowrap;
            width: max-content;
            min-width: 100%;
        }
        .ui-tabs__tab {
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            font-family: ${t('font-ui')};
            font-size: 0.875rem;
            font-weight: 400;
            cursor: pointer;
            border: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            background: none;
            color: ${t('text-muted')};
            transition:
                background ${t('dur-base')} ${t('ease-standard')},
                border-color ${t('dur-base')} ${t('ease-standard')},
                color ${t('dur-base')} ${t('ease-standard')};
        }
        .ui-tabs__tab:hover {
            background: ${t('surface-2')};
        }
        .ui-tabs__tab:focus-visible {
            outline: 2px solid ${t('accent')};
            outline-offset: -2px;
        }
        .ui-tabs__tab.active {
            color: ${t('accent')};
            border-bottom-color: ${t('accent')};
            font-weight: 700;
        }
        /*
         * Weight 700 on the active tab would otherwise widen it and shift the
         * whole row on every switch. The label reserves its own bold width up
         * front via a hidden copy, so the row stays still.
         */
        .ui-tabs__label {
            display: inline-flex;
            flex-direction: column;
        }
        .ui-tabs__label::after {
            content: attr(data-label);
            font-weight: 700;
            height: 0;
            overflow: hidden;
            visibility: hidden;
            pointer-events: none;
        }
    `;

    private nav!: HTMLElement;
    private scroller!: HTMLElement;
    private buttons: HTMLButtonElement[] = [];

    render(): HTMLElement {
        this.scroller = document.createElement('div');
        this.scroller.className = 'ui-tabs__scroller';

        this.nav = document.createElement('nav');
        this.nav.className = 'ui-tabs';
        this.nav.setAttribute('role', 'tablist');

        for (const tab of this.props.tabs) {
            const btn = document.createElement('button');
            btn.className = 'ui-tabs__tab';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('data-key', tab.key);

            if (tab.icon) {
                const iconSpan = document.createElement('span');
                iconSpan.textContent = tab.icon;
                btn.appendChild(iconSpan);
            }

            const labelSpan = document.createElement('span');
            labelSpan.className = 'ui-tabs__label';
            // `data-label` feeds the hidden bold copy that reserves the active
            // width, so it has to move with the label, not just alongside it —
            // otherwise a locale switch changes the text and leaves the row
            // reserving the width of the previous language.
            const paintLabel = (): void => {
                const label = resolve(tab.label);
                labelSpan.setAttribute('data-label', label);
                labelSpan.textContent = label;
            };
            if (typeof tab.label === 'function') {
                this.track(effect(() => {
                    paintLabel();
                    // A label change can change the row's width, so the fade
                    // has to be re-measured — a translation is exactly the kind
                    // of change that tips a row into or out of overflow.
                    this.syncOverflow();
                }));
            } else {
                paintLabel();
            }
            btn.appendChild(labelSpan);

            btn.addEventListener('click', () => {
                this.props.active.set(tab.key);
            });

            this.buttons.push(btn);
            this.nav.appendChild(btn);
        }

        // Track active signal to toggle .active class and aria-selected
        this.track(effect(() => {
            const active = this.props.active.get();
            for (const btn of this.buttons) {
                const isActive = btn.getAttribute('data-key') === active;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', String(isActive));
            }
        }));

        this.scroller.appendChild(this.nav);
        this.wireOverflow();
        return this.scroller;
    }

    onMount(): void {
        // Measure synchronously as well as on the next frame. Layout is usually
        // not settled at mount, hence the frame; but `requestAnimationFrame`
        // does not fire at all while the document is hidden (background tab,
        // headless/automated viewport), and a fade that only ever appears in a
        // foreground tab is a fade that cannot be verified. The synchronous
        // call is the one that holds in that case.
        this.syncOverflow();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => this.syncOverflow());
        }
    }

    /** Re-measure the overflow fade. Safe to call at any time. */
    syncOverflow(): void {
        const el = this.scroller;
        if (!el) return;
        el.classList.toggle('fade-start', el.scrollLeft > 1);
        el.classList.toggle('fade-end', el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    /**
     * The fade is a function of scroll position AND available width, so both
     * have to be watched. `resize` alone misses a row that narrows because a
     * sibling grew or a drawer opened, which is why the ResizeObserver is here
     * too; it is feature-detected because the test DOM does not implement it.
     */
    private wireOverflow(): void {
        this.scroller.addEventListener('scroll', () => this.syncOverflow());

        if (typeof window !== 'undefined') {
            const onResize = (): void => this.syncOverflow();
            window.addEventListener('resize', onResize);
            this.track(() => window.removeEventListener('resize', onResize));
        }

        if (typeof ResizeObserver === 'function') {
            const observer = new ResizeObserver(() => this.syncOverflow());
            observer.observe(this.scroller);
            observer.observe(this.nav);
            this.track(() => observer.disconnect());
        }
    }
}
