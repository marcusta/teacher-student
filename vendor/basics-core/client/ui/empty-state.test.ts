import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { EmptyStateComponent } from './empty-state';
import type { EmptyStateProps } from './empty-state';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

const mount = (props: EmptyStateProps) => {
    const host = document.getElementById('host')!;
    const comp = new EmptyStateComponent(props);
    comp.mount(host);
    return { host, comp, el: host.querySelector('.ui-empty-state') as HTMLElement };
};

test('EmptyStateComponent: renders heading, body and ornament by default', () => {
    const { comp, el } = mount({
        heading: 'Inga träningspass ännu',
        body: 'När du loggar ditt första pass samlas allt här.',
    });

    const heading = el.querySelector('.ui-empty-state__heading') as HTMLElement;
    expect(heading.tagName).toBe('H3'); // default level
    expect(heading.textContent).toBe('Inga träningspass ännu');

    const body = el.querySelector('.ui-empty-state__body') as HTMLElement;
    expect(body.textContent).toBe('När du loggar ditt första pass samlas allt här.');

    const ornament = el.querySelector('.ui-empty-state__ornament') as HTMLElement;
    expect(ornament).not.toBeNull();
    expect(ornament.getAttribute('aria-hidden')).toBe('true');

    comp.destroy();
});

test('EmptyStateComponent: ornament can be turned off', () => {
    const { comp, el } = mount({ heading: 'Tomt', ornament: false });
    expect(el.querySelector('.ui-empty-state__ornament')).toBeNull();
    comp.destroy();
});

test('EmptyStateComponent: heading level is configurable', () => {
    const { comp, el } = mount({ heading: 'Tomt', headingLevel: 2 });
    expect((el.querySelector('.ui-empty-state__heading') as HTMLElement).tagName).toBe('H2');
    comp.destroy();
});

test('EmptyStateComponent: body is optional', () => {
    const { comp, el } = mount({ heading: 'Tomt' });
    expect(el.querySelector('.ui-empty-state__body')).toBeNull();
    comp.destroy();
});

test('EmptyStateComponent: renders exactly one action and fires its handler', () => {
    let clicks = 0;
    const { comp, el } = mount({
        heading: 'Inga träningspass ännu',
        action: { label: 'Logga ett pass', onclick: () => { clicks++; } },
    });

    const buttons = el.querySelectorAll('.ui-empty-state__action');
    expect(buttons.length).toBe(1);

    const btn = buttons[0] as HTMLButtonElement;
    expect(btn.textContent).toBe('Logga ett pass');
    expect(btn.getAttribute('type')).toBe('button');

    btn.click();
    expect(clicks).toBe(1);

    comp.destroy();
});

test('EmptyStateComponent: action is optional but never plural', () => {
    const { comp, el } = mount({ heading: 'Tomt' });
    expect(el.querySelectorAll('.ui-empty-state__action').length).toBe(0);
    comp.destroy();
});

test('EmptyStateComponent: action accepts an explicit aria-label', () => {
    const { comp, el } = mount({
        heading: 'Tomt',
        action: { label: 'Logga', ariaLabel: 'Logga ett träningspass', onclick: () => {} },
    });
    const btn = el.querySelector('.ui-empty-state__action') as HTMLElement;
    expect(btn.getAttribute('aria-label')).toBe('Logga ett träningspass');
    comp.destroy();
});

test('EmptyStateComponent: heading, body and action label are reactive', () => {
    const heading = new Signal('A');
    const body = new Signal('B');
    const label = new Signal('C');
    const { comp, el } = mount({
        heading: () => heading.get(),
        body: () => body.get(),
        action: { label: () => label.get(), onclick: () => {} },
    });

    heading.set('A2');
    body.set('B2');
    label.set('C2');

    expect((el.querySelector('.ui-empty-state__heading') as HTMLElement).textContent).toBe('A2');
    expect((el.querySelector('.ui-empty-state__body') as HTMLElement).textContent).toBe('B2');
    expect((el.querySelector('.ui-empty-state__action') as HTMLElement).textContent).toBe('C2');

    comp.destroy();
});

test('EmptyStateComponent: brass ornament is the only decoration', () => {
    const { comp, el } = mount({
        heading: 'Tomt',
        body: 'Kort text.',
        action: { label: 'Gör något', onclick: () => {} },
    });

    // No images, no svg, no icon elements — the spec forbids illustrations.
    expect(el.querySelectorAll('img, svg, picture').length).toBe(0);
    // Heading, body, action, ornament — and nothing else.
    expect(el.children.length).toBe(4);

    comp.destroy();
});

test('EmptyStateComponent: styles use design-system tokens only', () => {
    const css = EmptyStateComponent.styles;
    expect(css).toContain('var(--brass-line)');
    expect(css).toContain('var(--font-display)');
    expect(css).toContain('var(--on-accent)');
    for (const legacy of ['var(--radius)', 'var(--primary)', 'var(--hover-bg)', 'var(--btn-bg)', 'var(--shadow-elevated)']) {
        expect(css).not.toContain(legacy);
    }
    expect(css).not.toContain('#fff');
});

test('EmptyStateComponent: destroy stops reactive updates', () => {
    const heading = new Signal('A');
    const { comp, el } = mount({ heading: () => heading.get() });
    const h = el.querySelector('.ui-empty-state__heading') as HTMLElement;

    comp.destroy();
    heading.set('B');
    expect(h.textContent).toBe('A');
});
