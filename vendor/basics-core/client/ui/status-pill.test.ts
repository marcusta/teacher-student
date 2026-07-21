import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { StatusPillComponent } from './status-pill';
import type { StatusPillProps, StatusPillTone, StatusPillVariant } from './status-pill';
import { registerMessages, resetMessages, setLocale, t } from '../i18n';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

const mount = (props: StatusPillProps) => {
    const host = document.getElementById('host')!;
    const comp = new StatusPillComponent(props);
    comp.mount(host);
    return { host, comp, el: host.querySelector('.ui-status-pill') as HTMLElement };
};

test('StatusPillComponent: renders label, defaults to outline/neutral', () => {
    const { comp, el } = mount({ label: 'Planerad' });

    expect(el.textContent).toBe('Planerad');
    expect(el.getAttribute('data-variant')).toBe('outline');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.classList.contains('ui-status-pill--outline')).toBe(true);
    expect(el.classList.contains('ui-status-pill--neutral')).toBe(true);

    comp.destroy();
});

test('StatusPillComponent: every variant x tone renders its own classes', () => {
    const variants: StatusPillVariant[] = ['outline', 'filled', 'dashed'];
    const tones: StatusPillTone[] = ['neutral', 'success', 'warning', 'danger', 'info'];

    for (const variant of variants) {
        for (const tone of tones) {
            document.body.innerHTML = '<div id="host"></div>';
            const { comp, el } = mount({ label: 'X', variant, tone });

            expect(el.classList.contains(`ui-status-pill--${variant}`)).toBe(true);
            expect(el.classList.contains(`ui-status-pill--${tone}`)).toBe(true);
            expect(el.getAttribute('data-variant')).toBe(variant);
            expect(el.getAttribute('data-tone')).toBe(tone);

            comp.destroy();
        }
    }
});

test('StatusPillComponent: shape grammar is carried by class, not colour', () => {
    // Same tone, different meaning — the variant must be what differs, so the
    // pill stays readable with colour removed.
    document.body.innerHTML = '<div id="host"></div>';
    const a = mount({ label: 'Planerad', variant: 'outline', tone: 'info' });
    const outlineClass = a.el.className;
    a.comp.destroy();

    document.body.innerHTML = '<div id="host"></div>';
    const b = mount({ label: 'Utförd', variant: 'filled', tone: 'info' });
    const filledClass = b.el.className;
    b.comp.destroy();

    expect(outlineClass).not.toBe(filledClass);
});

test('StatusPillComponent: leading glyph renders and is hidden from AT', () => {
    const { comp, el } = mount({
        label: 'Inställd',
        variant: 'dashed',
        tone: 'danger',
        glyph: '✕',
    });

    const glyph = el.querySelector('.ui-status-pill__glyph') as HTMLElement;
    expect(glyph).not.toBeNull();
    expect(glyph.textContent).toBe('✕');
    // The glyph only restates the label — it must not be read out twice.
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    // Glyph precedes the label.
    expect(el.textContent).toBe('✕Inställd');

    comp.destroy();
});

test('StatusPillComponent: no glyph element when none supplied', () => {
    const { comp, el } = mount({ label: 'Aktiv' });
    expect(el.querySelector('.ui-status-pill__glyph')).toBeNull();
    comp.destroy();
});

test('StatusPillComponent: reactive label and glyph track their signals', () => {
    const label = new Signal('Aktiv');
    const glyph = new Signal('');
    const { comp, el } = mount({
        label: () => label.get(),
        glyph: () => glyph.get(),
        variant: 'outline',
        tone: 'success',
    });

    const labelEl = el.querySelector('.ui-status-pill__label') as HTMLElement;
    expect(labelEl.textContent).toBe('Aktiv');

    label.set('Uppnådd');
    expect(labelEl.textContent).toBe('Uppnådd');

    glyph.set('✕');
    expect((el.querySelector('.ui-status-pill__glyph') as HTMLElement).textContent).toBe('✕');

    comp.destroy();
});

test('StatusPillComponent: styles never reference brass or accent tokens', () => {
    // Brass means "brand and action". An outcome never borrows it.
    const css = StatusPillComponent.styles;
    expect(css).not.toContain('--accent');
    expect(css).not.toContain('--brass-line');
    // Tone colours come from the semantic scale only.
    for (const tone of ['success', 'warning', 'danger', 'info']) {
        expect(css).toContain(`var(--${tone})`);
    }
});

test('StatusPillComponent: styles use no legacy token names', () => {
    const css = StatusPillComponent.styles;
    for (const legacy of ['var(--radius)', 'var(--primary)', 'var(--hover-bg)', 'var(--shadow-elevated)', 'var(--btn-bg)']) {
        expect(css).not.toContain(legacy);
    }
    expect(css).not.toContain('#fff');
});

test('StatusPillComponent: label is always present alongside a glyph', () => {
    // A pill is never glyph-only — the API has no way to express that.
    const { comp, el } = mount({ label: 'Avbruten', glyph: '✕', variant: 'dashed' });
    const labelEl = el.querySelector('.ui-status-pill__label') as HTMLElement;
    expect(labelEl.textContent).toBe('Avbruten');
    comp.destroy();
});

test('StatusPillComponent: destroy stops reactive updates', () => {
    const label = new Signal('A');
    const { comp, el } = mount({ label: () => label.get() });
    const labelEl = el.querySelector('.ui-status-pill__label') as HTMLElement;

    comp.destroy();
    label.set('B');
    expect(labelEl.textContent).toBe('A');
});

// ─── Reactive labels, and where the defect actually lives ────────
//
// StatusPill's `label` has ALWAYS accepted a thunk. A review found pill labels
// frozen on already-rendered rows anyway, and the cause is not this component:
// the call sites pass `descriptor.label`, a `string` produced by calling `t()`
// eagerly. The reactivity is spent before the pill is constructed.
//
// These two tests pin both halves down, so the diagnosis cannot drift back to
// "the pill is not reactive".

const svPill = { 'status.active': 'Aktiv', 'status.done': 'Uppnått' };
const enPill = { 'status.active': 'Active', 'status.done': 'Achieved' };

const withCatalogs = (): void => {
    resetMessages();
    registerMessages('sv', svPill);
    registerMessages('en', enPill);
    setLocale('sv');
};

test('StatusPillComponent: a thunk label follows the locale', () => {
    withCatalogs();
    const { host, comp } = mount({ label: () => t('status.active') });

    const label = host.querySelector('.ui-status-pill__label') as HTMLElement;
    expect(label.textContent).toBe('Aktiv');
    setLocale('en');
    expect(label.textContent).toBe('Active');

    comp.destroy();
    resetMessages();
});

/*
 * The defect, reproduced. `t()` called at the call site hands over a dead
 * string — nothing downstream can revive it. This is what every frozen pill in
 * the review was, and the fix is at the CALL SITE (`label: () => t('…')`), not
 * here. Kept as a test so the mechanism stays legible.
 */
test('StatusPillComponent: an eagerly-resolved label is frozen, by construction', () => {
    withCatalogs();
    const { host, comp } = mount({ label: t('status.done') });

    const label = host.querySelector('.ui-status-pill__label') as HTMLElement;
    expect(label.textContent).toBe('Uppnått');
    setLocale('en');
    expect(label.textContent).toBe('Uppnått');

    comp.destroy();
    resetMessages();
});
