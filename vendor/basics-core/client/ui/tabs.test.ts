import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { TabsComponent } from './tabs';
import type { TabItem } from './tabs';
import { registerMessages, resetMessages, setLocale, t } from '../i18n';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'notes', label: 'Notes' },
];

test('TabsComponent: renders a tab per item', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    expect(host.querySelectorAll('.ui-tabs__tab').length).toBe(2);

    comp.destroy();
});

test('TabsComponent: active tab is marked and aria-selected', () => {
    const host = document.getElementById('host')!;
    const active = new Signal('notes');
    const comp = new TabsComponent({ active, tabs });
    comp.mount(host);

    const [first, second] = [...host.querySelectorAll('.ui-tabs__tab')] as HTMLElement[];
    expect(second!.classList.contains('active')).toBe(true);
    expect(second!.getAttribute('aria-selected')).toBe('true');
    expect(first!.classList.contains('active')).toBe(false);
    expect(first!.getAttribute('aria-selected')).toBe('false');

    comp.destroy();
});

test('TabsComponent: clicking a tab updates the active signal', () => {
    const host = document.getElementById('host')!;
    const active = new Signal('overview');
    const comp = new TabsComponent({ active, tabs });
    comp.mount(host);

    const second = host.querySelectorAll('.ui-tabs__tab')[1] as HTMLElement;
    second.click();
    expect(active.get()).toBe('notes');

    comp.destroy();
});

test('TabsComponent: active state moves when the signal changes', () => {
    const host = document.getElementById('host')!;
    const active = new Signal('overview');
    const comp = new TabsComponent({ active, tabs });
    comp.mount(host);

    active.set('notes');
    const [first, second] = [...host.querySelectorAll('.ui-tabs__tab')] as HTMLElement[];
    expect(first!.classList.contains('active')).toBe(false);
    expect(second!.classList.contains('active')).toBe(true);

    comp.destroy();
});

// Design system §4.11: the active tab carries weight 700, not just the accent
// line. This was the defect — accent colour and border, no weight change.
test('TabsComponent: active tab is weight 700', () => {
    expect(TabsComponent.styles).toContain('.ui-tabs__tab.active');
    const activeRule = TabsComponent.styles
        .slice(TabsComponent.styles.indexOf('.ui-tabs__tab.active'));
    expect(activeRule.slice(0, activeRule.indexOf('}'))).toContain('font-weight: 700');
});

test('TabsComponent: label reserves its bold width so the row does not shift', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const label = host.querySelector('.ui-tabs__label') as HTMLElement;
    expect(label.getAttribute('data-label')).toBe('Overview');
    expect(TabsComponent.styles).toContain('content: attr(data-label)');

    comp.destroy();
});

test('TabsComponent: icon renders before the label', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({
        active: new Signal('overview'),
        tabs: [{ key: 'overview', label: 'Overview', icon: '★' }],
    });
    comp.mount(host);

    const btn = host.querySelector('.ui-tabs__tab') as HTMLElement;
    expect(btn.children.length).toBe(2);
    expect(btn.children[0]!.textContent).toBe('★');
    expect(btn.children[1]!.classList.contains('ui-tabs__label')).toBe(true);

    comp.destroy();
});

// The `pill` variant was retired — the design system has no counterpart for it.
test('TabsComponent: no pill variant remains', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const nav = host.querySelector('.ui-tabs') as HTMLElement;
    expect(nav.className).toBe('ui-tabs');
    expect(TabsComponent.styles).not.toContain('ui-tabs--pill');

    comp.destroy();
});

/**
 * Legacy tokens are retired in this file — not demoted to a fallback arm,
 * gone. Every theme the framework ships defines the design-system names, so a
 * `var(--new, var(--legacy))` chain has nothing left to fall back to.
 */
const references = (css: string, name: string): boolean =>
    new RegExp(`var\\(--${name}[,)]`).test(css);

test('TabsComponent: legacy token names are gone entirely', () => {
    for (const legacy of ['hover-bg', 'radius', 'primary', 'primary-text', 'btn-bg']) {
        expect(references(TabsComponent.styles, legacy)).toBe(false);
    }
    expect(references(TabsComponent.styles, 'surface-2')).toBe(true);
});

/*
 * --accent is referenced PLAINLY, and the history is why that is worth a test.
 *
 * `var()` can only ask whether a token is defined, never whether it carries the
 * design-system meaning. Legacy themes already used --accent for a decorative
 * highlight — apps/stable set it to coral while its action colour --primary was
 * forest — so `var(--accent, var(--primary))` picked coral and dropped the
 * active tab to 2.59:1. The corrective was to lead with --primary instead, and
 * that is now obsolete: the collision is resolved once in the theme, where a
 * legacy app aliases `primary: var(--accent)`.
 *
 * So: no chain in either direction. A reappearing `var(--accent, ...)` or
 * `var(--primary, ...)` here means the collision has been reintroduced.
 */
test('TabsComponent: --accent is referenced plainly, with no fallback chain', () => {
    expect(references(TabsComponent.styles, 'accent')).toBe(true);
    expect(TabsComponent.styles).toContain('var(--accent)');
    expect(TabsComponent.styles).not.toContain('var(--accent,');
    expect(TabsComponent.styles).not.toContain('var(--primary');
});

// ─── Reactive labels ─────────────────────────────────────────────
//
// `t()` is already reactive — it reads the locale signal. The defect these
// tests pin down is a prop typed as a plain `string`: the call site evaluates
// `t()` once, before the component exists, and hands over a dead result. So
// these tests do the only thing that counts as evidence — switch the locale on
// a MOUNTED component and read the DOM back.

const sv = { 'tab.overview': 'Översikt', 'tab.notes': 'Anteckningar' };
const en = { 'tab.overview': 'Overview', 'tab.notes': 'Notes' };

const withCatalogs = (): void => {
    resetMessages();
    registerMessages('sv', sv);
    registerMessages('en', en);
    setLocale('sv');
};

test('TabsComponent: thunk labels re-render on a locale switch', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({
        active: new Signal('overview'),
        tabs: [
            { key: 'overview', label: () => t('tab.overview') },
            { key: 'notes', label: () => t('tab.notes') },
        ],
    });
    comp.mount(host);

    const labels = () => [...host.querySelectorAll('.ui-tabs__label')]
        .map(el => el.textContent);

    expect(labels()).toEqual(['Översikt', 'Anteckningar']);

    setLocale('en');
    expect(labels()).toEqual(['Overview', 'Notes']);

    setLocale('sv');
    expect(labels()).toEqual(['Översikt', 'Anteckningar']);

    comp.destroy();
    resetMessages();
});

/*
 * The hidden bold copy that reserves the active tab's width is driven by
 * `data-label`. If only textContent followed the locale, the row would keep
 * reserving the PREVIOUS language's width — a silently wrong layout rather
 * than a visibly wrong string, which is worse.
 */
test('TabsComponent: the bold-width reservation follows the locale too', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({
        active: new Signal('overview'),
        tabs: [{ key: 'overview', label: () => t('tab.overview') }],
    });
    comp.mount(host);

    const label = host.querySelector('.ui-tabs__label') as HTMLElement;
    expect(label.getAttribute('data-label')).toBe('Översikt');

    setLocale('en');
    expect(label.getAttribute('data-label')).toBe('Overview');
    expect(label.textContent).toBe('Overview');

    comp.destroy();
    resetMessages();
});

/* Additive, not a migration: a plain string still works and still costs no effect. */
test('TabsComponent: plain string labels keep working and stay put', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const label = host.querySelector('.ui-tabs__label') as HTMLElement;
    expect(label.textContent).toBe('Overview');
    expect(label.getAttribute('data-label')).toBe('Overview');

    setLocale('en');
    expect(label.textContent).toBe('Overview');

    comp.destroy();
    resetMessages();
});

test('TabsComponent: a mix of literal and thunk labels in one row', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({
        active: new Signal('a'),
        tabs: [
            { key: 'a', label: 'Static' },
            { key: 'b', label: () => t('tab.notes') },
        ],
    });
    comp.mount(host);

    const labels = () => [...host.querySelectorAll('.ui-tabs__label')]
        .map(el => el.textContent);
    expect(labels()).toEqual(['Static', 'Anteckningar']);

    setLocale('en');
    expect(labels()).toEqual(['Static', 'Notes']);

    comp.destroy();
    resetMessages();
});

test('TabsComponent: destroy stops the label effect', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({
        active: new Signal('overview'),
        tabs: [{ key: 'overview', label: () => t('tab.overview') }],
    });
    comp.mount(host);

    const label = host.querySelector('.ui-tabs__label') as HTMLElement;
    comp.destroy();
    setLocale('en');
    expect(label.textContent).toBe('Översikt');

    resetMessages();
});

// ─── Edge fade ───────────────────────────────────────────────────
//
// UI_DECISIONS §6: the row scrolls in one line with an edge fade indicating
// overflow. This lived per-view in one consuming app, which meant every NEW
// consumer silently lost the affordance. It is part of the shared treatment now.
//
// The test DOM does no layout, so scrollWidth/clientWidth/scrollLeft are stubbed
// — that is the point of the test, which is the CLASS LOGIC and the wiring, not
// the browser's measurement of it.

const measure = (el: HTMLElement, m: { scrollLeft: number; clientWidth: number; scrollWidth: number }): void => {
    for (const [key, value] of Object.entries(m)) {
        Object.defineProperty(el, key, { value, writable: true, configurable: true });
    }
};

const scrollerOf = (host: HTMLElement): HTMLElement =>
    host.querySelector('.ui-tabs__scroller') as HTMLElement;

test('TabsComponent: the tab row is its own scroller', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    expect(scroller).not.toBeNull();
    // The nav lives INSIDE the scroller — the scroller is what overflows.
    expect(scroller.querySelector('.ui-tabs')).not.toBeNull();
    expect(TabsComponent.styles).toContain('overflow-x: auto');

    comp.destroy();
});

test('TabsComponent: no fade while the row fits', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 0, clientWidth: 400, scrollWidth: 400 });
    comp.syncOverflow();

    expect(scroller.classList.contains('fade-start')).toBe(false);
    expect(scroller.classList.contains('fade-end')).toBe(false);

    comp.destroy();
});

test('TabsComponent: overflow to the right fades only the end', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    comp.syncOverflow();

    expect(scroller.classList.contains('fade-start')).toBe(false);
    expect(scroller.classList.contains('fade-end')).toBe(true);

    comp.destroy();
});

test('TabsComponent: mid-scroll fades both edges', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
    comp.syncOverflow();

    expect(scroller.classList.contains('fade-start')).toBe(true);
    expect(scroller.classList.contains('fade-end')).toBe(true);

    comp.destroy();
});

test('TabsComponent: scrolled to the end fades only the start', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
    comp.syncOverflow();

    expect(scroller.classList.contains('fade-start')).toBe(true);
    expect(scroller.classList.contains('fade-end')).toBe(false);

    comp.destroy();
});

test('TabsComponent: a scroll event updates the fade', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    scroller.dispatchEvent(new Event('scroll'));
    expect(scroller.classList.contains('fade-start')).toBe(false);

    // The user scrolls; only the measurement changes, the event does the rest.
    measure(scroller, { scrollLeft: 400, clientWidth: 300, scrollWidth: 900 });
    scroller.dispatchEvent(new Event('scroll'));
    expect(scroller.classList.contains('fade-start')).toBe(true);
    expect(scroller.classList.contains('fade-end')).toBe(true);

    comp.destroy();
});

test('TabsComponent: a window resize updates the fade', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
    window.dispatchEvent(new Event('resize'));
    expect(scroller.classList.contains('fade-end')).toBe(false);

    // The viewport narrows and the row now overflows.
    measure(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    window.dispatchEvent(new Event('resize'));
    expect(scroller.classList.contains('fade-end')).toBe(true);

    comp.destroy();
});

test('TabsComponent: destroy detaches the resize listener', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
    window.dispatchEvent(new Event('resize'));
    comp.destroy();

    measure(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    window.dispatchEvent(new Event('resize'));
    expect(scroller.classList.contains('fade-end')).toBe(false);
});

/*
 * The fade is measured synchronously at mount as well as on the next frame.
 * `requestAnimationFrame` does not fire while the document is hidden, so a
 * fade that depended on it alone would be absent in exactly the environments
 * used to verify it — and absent in a real background tab.
 */
test('TabsComponent: mount measures without waiting for a frame', () => {
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({ active: new Signal('overview'), tabs });

    const original = globalThis.requestAnimationFrame;
    (globalThis as any).requestAnimationFrame = undefined;
    try {
        comp.mount(host);
        const scroller = scrollerOf(host);
        measure(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
        comp.syncOverflow();
        expect(scroller.classList.contains('fade-end')).toBe(true);
    } finally {
        (globalThis as any).requestAnimationFrame = original;
    }

    comp.destroy();
});

/* A locale switch can change the row's width, so it must re-measure. */
test('TabsComponent: a locale switch re-measures the fade', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new TabsComponent({
        active: new Signal('overview'),
        tabs: [{ key: 'overview', label: () => t('tab.overview') }],
    });
    comp.mount(host);

    const scroller = scrollerOf(host);
    measure(scroller, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
    comp.syncOverflow();
    expect(scroller.classList.contains('fade-end')).toBe(false);

    // The translated label is wider and tips the row into overflow.
    measure(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    setLocale('en');
    expect(scroller.classList.contains('fade-end')).toBe(true);

    comp.destroy();
    resetMessages();
});
