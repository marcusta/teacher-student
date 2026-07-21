import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { SelectComponent } from './select';
import type { SelectOption } from './select';
import { registerMessages, resetMessages, setLocale, t } from '../i18n';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

const options: SelectOption[] = [
    { value: 'a', label: 'Övergångar galopp–trav' },
    { value: 'b', label: 'Serpentiner 3 bågar' },
    { value: 'c', label: 'Cavaletti på volt' },
];

/** Catalogue grouped by owning teacher — group headers are `disabled` options. */
const grouped: SelectOption[] = [
    { value: 'g1', label: 'Alva Lindgren', disabled: true },
    { value: 'a', label: 'Övergångar galopp–trav' },
    { value: 'b', label: 'Serpentiner 3 bågar' },
    { value: 'g2', label: 'Egna övningar', disabled: true },
    { value: 'c', label: 'Tölt på rakt spår' },
];

const key = (el: HTMLElement, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

const opts = (host: HTMLElement) =>
    [...host.querySelectorAll('.ui-select__option')] as HTMLButtonElement[];

// ─── Single mode — existing behaviour must be untouched ──────────

test('SelectComponent: single mode renders trigger, listbox and options', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    expect(host.querySelector('.ui-select')).not.toBeNull();
    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');

    const list = host.querySelector('.ui-select__list') as HTMLElement;
    expect(list.getAttribute('role')).toBe('listbox');
    // Single mode is not multi-selectable and has no count footer.
    expect(list.getAttribute('aria-multiselectable')).toBeNull();
    expect(host.querySelector('.ui-select__count')).toBeNull();

    expect(opts(host).length).toBe(3);

    comp.destroy();
});

test('SelectComponent: single mode shows placeholder then the selected label', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options, placeholder: '(välj övning)' });
    comp.mount(host);

    const label = host.querySelector('.ui-select__trigger-label') as HTMLElement;
    expect(label.textContent).toBe('(välj övning)');
    expect((host.querySelector('.ui-select__trigger') as HTMLElement)
        .classList.contains('ui-select__trigger--placeholder')).toBe(true);

    value.set('b');
    expect(label.textContent).toBe('Serpentiner 3 bågar');
    expect((host.querySelector('.ui-select__trigger') as HTMLElement)
        .classList.contains('ui-select__trigger--placeholder')).toBe(false);

    comp.destroy();
});

test('SelectComponent: single mode click sets the value and closes', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    trigger.click();
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;
    expect(dropdown.classList.contains('open')).toBe(true);

    opts(host)[1].click();

    expect(value.get()).toBe('b');
    expect(dropdown.classList.contains('open')).toBe(false);

    comp.destroy();
});

test('SelectComponent: single mode marks one selection with a check', () => {
    const value = new Signal('a');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    const all = opts(host);
    expect(all[0].getAttribute('aria-selected')).toBe('true');
    expect((all[0].querySelector('.ui-select__check') as HTMLElement).textContent).toBe('✓');
    expect(all[1].getAttribute('aria-selected')).toBe('false');
    // Single mode has no checkboxes.
    expect(host.querySelectorAll('.ui-select__checkbox').length).toBe(0);

    value.set('c');
    expect(all[0].getAttribute('aria-selected')).toBe('false');
    expect(all[2].getAttribute('aria-selected')).toBe('true');

    comp.destroy();
});

test('SelectComponent: single mode signal-backed options rebuild', () => {
    const value = new Signal('');
    const sig = new Signal<SelectOption[]>(options.slice(0, 1));
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options: sig });
    comp.mount(host);

    expect(opts(host).length).toBe(1);
    sig.set(options);
    expect(opts(host).length).toBe(3);

    comp.destroy();
});

test('SelectComponent: single mode honours the disabled prop', () => {
    const value = new Signal('');
    const dis = new Signal(true);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options, disabled: dis });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    dis.set(false);
    expect(trigger.disabled).toBe(false);

    comp.destroy();
});

// ─── Group headers (spec §4.9 "grouped by owning teacher") ───────

test('SelectComponent: group headers stay inert and uppercase-styled', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options: grouped });
    comp.mount(host);

    const all = opts(host);
    expect(all.length).toBe(5);

    const header = all[0];
    expect(header.classList.contains('ui-select__option--header')).toBe(true);
    expect(header.disabled).toBe(true);
    expect(header.getAttribute('role')).toBe('presentation');
    expect(header.getAttribute('aria-disabled')).toBe('true');
    // No checkbox and no check mark on a header.
    expect(header.querySelector('.ui-select__checkbox')).toBeNull();
    expect(header.querySelector('.ui-select__check')).toBeNull();

    expect(SelectComponent.styles).toContain('text-transform: uppercase');

    comp.destroy();
});

test('SelectComponent: keyboard navigation steps over group headers', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options: grouped });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    key(trigger, 'ArrowDown'); // opens, highlights first selectable (index 1)
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[1].id);

    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;
    key(dropdown, 'ArrowDown'); // -> 2
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[2].id);

    key(dropdown, 'ArrowDown'); // index 3 is a header -> skips to 4
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[4].id);

    comp.destroy();
});

test('SelectComponent: Enter in the dropdown selects the highlighted option', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    key(trigger, 'ArrowDown');
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;
    key(dropdown, 'ArrowDown');
    key(dropdown, 'Enter');

    expect(value.get()).toBe('b');
    expect(dropdown.classList.contains('open')).toBe(false);

    comp.destroy();
});

test('SelectComponent: Escape closes without selecting', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    key(trigger, 'ArrowDown');
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;
    expect(dropdown.classList.contains('open')).toBe(true);

    key(dropdown, 'Escape');
    expect(dropdown.classList.contains('open')).toBe(false);
    expect(value.get()).toBe('');

    comp.destroy();
});

// ─── Multi mode ──────────────────────────────────────────────────

test('SelectComponent: multi mode renders checkboxes and a multiselectable listbox', () => {
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    const list = host.querySelector('.ui-select__list') as HTMLElement;
    expect(list.getAttribute('aria-multiselectable')).toBe('true');

    // Checkbox on every selectable row, and no single-mode check marks.
    expect(host.querySelectorAll('.ui-select__checkbox').length).toBe(3);
    expect(host.querySelectorAll('.ui-select__check').length).toBe(0);

    for (const o of opts(host)) {
        expect(o.classList.contains('ui-select__option--multi')).toBe(true);
    }

    comp.destroy();
});

test('SelectComponent: multi mode toggles values and stays open', () => {
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    trigger.click();
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;

    opts(host)[0].click();
    expect(values.get()).toEqual(['a']);
    // Selecting three things must not cost three trips through the trigger.
    expect(dropdown.classList.contains('open')).toBe(true);

    opts(host)[2].click();
    expect(values.get()).toEqual(['a', 'c']);
    expect(dropdown.classList.contains('open')).toBe(true);

    // Clicking a selected row removes it.
    opts(host)[0].click();
    expect(values.get()).toEqual(['c']);

    comp.destroy();
});

test('SelectComponent: multi mode marks selection with checkbox glyph and fill class', () => {
    const values = new Signal<string[]>(['b']);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    const all = opts(host);
    expect(all[1].classList.contains('ui-select__option--selected')).toBe(true);
    expect(all[1].getAttribute('aria-selected')).toBe('true');
    expect((all[1].querySelector('.ui-select__checkbox') as HTMLElement).textContent).toBe('✓');

    expect(all[0].classList.contains('ui-select__option--selected')).toBe(false);
    expect((all[0].querySelector('.ui-select__checkbox') as HTMLElement).textContent).toBe('');

    // The accent-tinted fill is what marks a selected row, not weight alone.
    expect(SelectComponent.styles)
        .toContain('.ui-select__option--multi.ui-select__option--selected {');
    expect(SelectComponent.styles).toContain('var(--accent-soft)');

    comp.destroy();
});

test('SelectComponent: multi mode renders a visible selected count', () => {
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({
        multiple: true,
        values,
        options,
        countLabel: (n) => `${n} valda`,
    });
    comp.mount(host);

    const count = host.querySelector('.ui-select__count') as HTMLElement;
    expect(count).not.toBeNull();
    expect(count.textContent).toBe('0 valda');
    // The count changes without focus moving, so it announces itself.
    expect(count.getAttribute('aria-live')).toBe('polite');

    values.set(['a', 'b']);
    expect(count.textContent).toBe('2 valda');
    // ...and the trigger echoes it, so the count is never hidden behind the panel.
    expect((host.querySelector('.ui-select__trigger-label') as HTMLElement).textContent)
        .toBe('2 valda');

    comp.destroy();
});

test('SelectComponent: multi mode count falls back to a bare numeral, never English', () => {
    const values = new Signal<string[]>(['a', 'b']);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    expect((host.querySelector('.ui-select__count') as HTMLElement).textContent).toBe('2');

    comp.destroy();
});

test('SelectComponent: multi mode shows the placeholder at zero selected', () => {
    const values = new Signal<string[]>(['a']);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({
        multiple: true,
        values,
        options,
        placeholder: 'Välj övningar',
        countLabel: (n) => `${n} valda`,
    });
    comp.mount(host);

    const label = host.querySelector('.ui-select__trigger-label') as HTMLElement;
    expect(label.textContent).toBe('1 valda');

    values.set([]);
    expect(label.textContent).toBe('Välj övningar');

    comp.destroy();
});

test('SelectComponent: multi mode keyboard toggles without closing', () => {
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options: grouped });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    key(trigger, 'ArrowDown'); // open, highlight first selectable (1)
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;

    key(dropdown, 'Enter');
    expect(values.get()).toEqual(['a']);
    expect(dropdown.classList.contains('open')).toBe(true);

    key(dropdown, 'ArrowDown'); // -> 2
    key(dropdown, ' ');
    expect(values.get()).toEqual(['a', 'b']);
    expect(dropdown.classList.contains('open')).toBe(true);

    // Toggling back off.
    key(dropdown, 'Enter');
    expect(values.get()).toEqual(['a']);

    comp.destroy();
});

test('SelectComponent: multi mode toggling does not yank the highlight back', () => {
    // Regression: the open-effect used to read the selection, so every toggle
    // re-seeded the highlight to the first selected row — making it impossible
    // to tick several rows in a row from the keyboard.
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    key(trigger, 'ArrowDown'); // open, highlight 0
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;

    key(dropdown, 'Enter'); // tick 'a'
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[0].id);

    key(dropdown, 'ArrowDown');
    key(dropdown, 'Enter'); // tick 'b' — highlight must stay on row 1
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[1].id);
    expect(values.get()).toEqual(['a', 'b']);

    comp.destroy();
});

test('SelectComponent: multi mode opening highlights the first selected row', () => {
    const values = new Signal<string[]>(['c']);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    trigger.click();
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[2].id);

    comp.destroy();
});

test('SelectComponent: multi mode never selects a group header', () => {
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options: grouped });
    comp.mount(host);

    const header = opts(host)[0];
    header.click(); // disabled button — no listener anyway
    expect(values.get()).toEqual([]);
    expect(header.getAttribute('aria-selected')).toBeNull();

    comp.destroy();
});

// ─── Token hygiene ───────────────────────────────────────────────

test('SelectComponent: styles use no legacy token names', () => {
    const css = SelectComponent.styles;
    for (const legacy of [
        'var(--radius)', 'var(--primary)', 'var(--hover-bg)',
        'var(--input-bg)', 'var(--shadow-elevated)', 'var(--btn-bg)',
    ]) {
        expect(css).not.toContain(legacy);
    }
    expect(css).toContain('var(--border-strong)');
    expect(css).toContain('var(--radius-sm)');
    expect(css).toContain('var(--shadow-2)');
});

// ─── Keyboard from the trigger — the real focus path ─────────────
// Opening the list never moves focus, and the dropdown is a sibling of the
// trigger, so keydowns fired while the trigger holds focus never reach the
// dropdown's listener. Tests that dispatch on the dropdown exercise a path a
// real keyboard user cannot reach; these dispatch on the trigger.

test('SelectComponent: single mode Enter on the trigger commits the highlighted option', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;

    key(trigger, 'ArrowDown');  // opens, highlight row 0
    key(trigger, 'ArrowDown');  // -> row 1
    key(trigger, 'Enter');

    expect(value.get()).toBe('b');
    expect(dropdown.classList.contains('open')).toBe(false);

    comp.destroy();
});

test('SelectComponent: multi mode ticks several rows from the trigger without closing', () => {
    const values = new Signal<string[]>([]);
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ multiple: true, values, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;

    key(trigger, 'ArrowDown');           // opens, highlight row 0
    key(trigger, 'Enter');               // tick 'a'
    expect(values.get()).toEqual(['a']);
    expect(dropdown.classList.contains('open')).toBe(true);

    key(trigger, 'ArrowDown');           // -> row 1, must not be yanked back
    expect(trigger.getAttribute('aria-activedescendant')).toBe(opts(host)[1].id);
    key(trigger, ' ');                   // tick 'b'
    expect(values.get()).toEqual(['a', 'b']);
    expect(dropdown.classList.contains('open')).toBe(true);

    comp.destroy();
});

test('SelectComponent: Space on a closed trigger opens rather than selecting', () => {
    const value = new Signal('');
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value, options });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    const dropdown = host.querySelector('.ui-select__dropdown') as HTMLElement;

    key(trigger, ' ');
    expect(dropdown.classList.contains('open')).toBe(true);
    expect(value.get()).toBe('');

    comp.destroy();
});

test('SelectComponent: option ids are unique across instances on one page', () => {
    // aria-activedescendant resolves by getElementById, so colliding ids would
    // point every screen reader at the first select in the document.
    const host = document.getElementById('host')!;
    const a = new SelectComponent({ value: new Signal(''), options });
    const b = new SelectComponent({ value: new Signal(''), options });
    a.mount(host);
    b.mount(host);

    const ids = [...host.querySelectorAll('.ui-select__option')].map((e) => e.id);
    expect(ids.length).toBe(6);
    expect(new Set(ids).size).toBe(6);

    a.destroy();
    b.destroy();
});

// ─── Reactive placeholder ────────────────────────────────────────
//
// `placeholder` was a plain `string`, so `t()` was evaluated at the call site
// and the trigger froze in whatever locale happened to be active at construction.
// These tests switch the locale on a MOUNTED select and read the trigger back.

const svMsg = { 'select.pickExercise': '(välj övning)', 'select.pickTeacher': '(välj lärare)' };
const enMsg = { 'select.pickExercise': '(pick an exercise)', 'select.pickTeacher': '(pick a teacher)' };

const withCatalogs = (): void => {
    resetMessages();
    registerMessages('sv', svMsg);
    registerMessages('en', enMsg);
    setLocale('sv');
};

const triggerText = (host: HTMLElement): string | null =>
    host.querySelector('.ui-select__label')?.textContent
        ?? host.querySelector('.ui-select__trigger')!.textContent;

test('SelectComponent: single mode placeholder follows the locale', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({
        value: new Signal(''),
        options,
        placeholder: () => t('select.pickExercise'),
    });
    comp.mount(host);

    expect(triggerText(host)).toContain('(välj övning)');
    setLocale('en');
    expect(triggerText(host)).toContain('(pick an exercise)');
    setLocale('sv');
    expect(triggerText(host)).toContain('(välj övning)');

    comp.destroy();
    resetMessages();
});

test('SelectComponent: multi mode placeholder follows the locale at zero selected', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({
        multiple: true,
        values: new Signal<string[]>([]),
        options,
        placeholder: () => t('select.pickTeacher'),
    });
    comp.mount(host);

    expect(triggerText(host)).toContain('(välj lärare)');
    setLocale('en');
    expect(triggerText(host)).toContain('(pick a teacher)');

    comp.destroy();
    resetMessages();
});

/*
 * The placeholder class is what greys the trigger. It has to key off the
 * RESOLVED text, not the presence of the prop: a thunk is always truthy, so a
 * presence check would style an empty placeholder as though it had copy.
 */
test('SelectComponent: the placeholder class keys off resolved text', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({
        value: new Signal(''),
        options,
        placeholder: () => '',
    });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    expect(trigger.classList.contains('ui-select__trigger--placeholder')).toBe(false);

    comp.destroy();
    resetMessages();
});

test('SelectComponent: a literal placeholder still works and stays put', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({
        value: new Signal(''),
        options,
        placeholder: '(välj övning)',
    });
    comp.mount(host);

    const trigger = host.querySelector('.ui-select__trigger') as HTMLElement;
    expect(triggerText(host)).toContain('(välj övning)');
    expect(trigger.classList.contains('ui-select__trigger--placeholder')).toBe(true);

    setLocale('en');
    expect(triggerText(host)).toContain('(välj övning)');

    comp.destroy();
    resetMessages();
});

/* Selecting a value replaces the placeholder; clearing brings back the CURRENT locale's. */
test('SelectComponent: placeholder returns in the active locale after clearing', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const value = new Signal('');
    const comp = new SelectComponent({
        value,
        options,
        placeholder: () => t('select.pickExercise'),
    });
    comp.mount(host);

    value.set(options[0]!.value);
    expect(triggerText(host)).not.toContain('(välj övning)');

    setLocale('en');
    value.set('');
    expect(triggerText(host)).toContain('(pick an exercise)');

    comp.destroy();
    resetMessages();
});

/*
 * §4.9: the chevron is an inline SVG at 1.5px stroke, not a text glyph. The
 * old U+25BE rendered at whatever weight and baseline the user's fallback font
 * happened to have; a stroked path matches the hairline weight of the field
 * borders in every environment.
 */
test('SelectComponent: the chevron is a stroked SVG, not a text glyph', () => {
    const host = document.getElementById('host')!;
    const comp = new SelectComponent({ value: new Signal(''), options });
    comp.mount(host);

    const chevron = host.querySelector('.ui-select__chevron')!;
    // No text content at all — a glyph would leave some behind.
    expect(chevron.textContent).toBe('');

    const svg = chevron.querySelector('svg')!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 12 8');

    const path = svg.querySelector('path')!;
    expect(path.getAttribute('d')).toBe('M1 1.5 6 6.5 11 1.5');
    expect(path.getAttribute('stroke-width')).toBe('1.5');
    // currentColor, so the chevron follows whatever --text-muted resolves to
    // in the active theme rather than pinning a literal.
    expect(path.getAttribute('stroke')).toBe('currentColor');

    comp.destroy();
});

/* A click on the chevron is a click on the trigger — it must not swallow the
   event, which is what pointer-events:none buys. */
test('SelectComponent: the chevron does not intercept pointer events', () => {
    expect(SelectComponent.styles).toContain('pointer-events: none');
});

/*
 * The trigger shares the field base from css.ts: recessed --bg fill, weighted
 * --border-strong bottom rule, and the 34px of right padding the chevron sits
 * in. It is a custom widget, so there is no UA chevron for appearance:none to
 * suppress — the padding and the SVG are what carry the affordance.
 */
test('SelectComponent: the trigger wears the same field base as input()', () => {
    const css = SelectComponent.styles;
    expect(css).toContain('background: var(--bg)');
    expect(css).toContain('border-bottom: 2px solid var(--border-strong)');
    expect(css).toContain('padding: 10px 34px 10px 12px');
    expect(css).toContain('box-shadow: 0 0 0 3px var(--accent-soft)');
});

/* Rotating the open chevron must keep the centring translate, or it jumps
   half its height down the moment the dropdown opens. */
test('SelectComponent: the open chevron keeps its centring translate', () => {
    expect(SelectComponent.styles).toContain('transform: translateY(-50%) rotate(180deg)');
});
