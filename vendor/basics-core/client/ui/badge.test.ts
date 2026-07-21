import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { BadgeComponent, badge } from './badge';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

test('BadgeComponent: renders text', () => {
    const host = document.getElementById('host')!;
    const comp = new BadgeComponent({ text: '3' });
    comp.mount(host);

    expect(host.querySelector('.ui-badge')!.textContent).toBe('3');

    comp.destroy();
});

test('BadgeComponent: reactive text via function', () => {
    const host = document.getElementById('host')!;
    const count = new Signal(1);
    const comp = new BadgeComponent({ text: () => String(count.get()) });
    comp.mount(host);

    const el = host.querySelector('.ui-badge') as HTMLElement;
    expect(el.textContent).toBe('1');
    count.set(7);
    expect(el.textContent).toBe('7');

    comp.destroy();
});

test('BadgeComponent: reactive background via function', () => {
    const host = document.getElementById('host')!;
    const bg = new Signal('#845C24');
    const comp = new BadgeComponent({ text: '3', bg: () => bg.get() });
    comp.mount(host);

    const el = host.querySelector('.ui-badge') as HTMLElement;
    expect(el.style.background).toBe('#845C24');
    bg.set('#A3292F');
    expect(el.style.background).toBe('#A3292F');

    comp.destroy();
});

/*
 * The dark-theme defect: `color` defaulted to a hardcoded '#fff', which is
 * unreadable on the pale brass accent dark theme uses.
 */
test('BadgeComponent: default colour comes from a token, not hardcoded white', () => {
    const host = document.getElementById('host')!;
    const comp = new BadgeComponent({ text: '3' });
    comp.mount(host);

    // The default is a themeable token in the stylesheet, not an inline style.
    const el = host.querySelector('.ui-badge') as HTMLElement;
    expect(el.style.color).toBe('');
    expect(BadgeComponent.styles).toContain('color: var(--on-accent)');
    expect(BadgeComponent.styles).not.toContain('#fff');

    comp.destroy();
});

test('BadgeComponent: explicit colour still wins', () => {
    const host = document.getElementById('host')!;
    const comp = new BadgeComponent({ text: '3', color: '#1C1F21' });
    comp.mount(host);

    expect((host.querySelector('.ui-badge') as HTMLElement).style.color).toBe('#1C1F21');

    comp.destroy();
});

// Badge is the count primitive; counts carry lining figures (§02).
test('BadgeComponent: counts use tabular numerals', () => {
    expect(BadgeComponent.styles).toContain('font-variant-numeric: tabular-nums');
});

test('badge recipe: pill radius and tabular numerals', () => {
    const css = badge();
    expect(css).toContain('var(--radius-pill)');
    expect(css).toContain('font-variant-numeric: tabular-nums');
    expect(css).toContain('display: inline-flex');
});
