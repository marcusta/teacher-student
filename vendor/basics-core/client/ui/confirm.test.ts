import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { ConfirmComponent } from './confirm';
import { registerMessages, resetMessages, setLocale, t } from '../i18n';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

test('ConfirmComponent: renders title and message', () => {
    const host = document.getElementById('host')!;
    const comp = new ConfirmComponent({
        open: new Signal(true),
        title: 'Markera lektionen som utförd?',
        message: 'Statusen är slutgiltig och går inte att ändra i efterhand.',
        onconfirm: () => {},
    });
    comp.mount(host);

    expect(host.querySelector('.ui-confirm__title')!.textContent)
        .toBe('Markera lektionen som utförd?');
    expect(host.querySelector('.ui-confirm__message')!.textContent)
        .toBe('Statusen är slutgiltig och går inte att ändra i efterhand.');

    comp.destroy();
});

test('ConfirmComponent: reactive message', () => {
    const host = document.getElementById('host')!;
    const name = new Signal('Caspian');
    const comp = new ConfirmComponent({
        open: new Signal(true),
        message: () => `${name.get()} tas bort permanent.`,
        onconfirm: () => {},
    });
    comp.mount(host);

    expect(host.querySelector('.ui-confirm__message')!.textContent).toBe('Caspian tas bort permanent.');
    name.set('Luna');
    expect(host.querySelector('.ui-confirm__message')!.textContent).toBe('Luna tas bort permanent.');

    comp.destroy();
});

test('ConfirmComponent: confirm fires and closes', () => {
    const host = document.getElementById('host')!;
    const open = new Signal(true);
    let confirmed = false;
    const comp = new ConfirmComponent({
        open,
        message: 'Detta går inte att ångra.',
        onconfirm: () => { confirmed = true; },
    });
    comp.mount(host);

    (host.querySelector('.ui-confirm__btn--confirm') as HTMLElement).click();
    expect(confirmed).toBe(true);
    expect(open.get()).toBe(false);

    comp.destroy();
});

test('ConfirmComponent: cancel fires and closes', () => {
    const host = document.getElementById('host')!;
    const open = new Signal(true);
    let cancelled = false;
    const comp = new ConfirmComponent({
        open,
        message: 'Detta går inte att ångra.',
        onconfirm: () => {},
        oncancel: () => { cancelled = true; },
    });
    comp.mount(host);

    (host.querySelector('.ui-confirm__btn--cancel') as HTMLElement).click();
    expect(cancelled).toBe(true);
    expect(open.get()).toBe(false);

    comp.destroy();
});

test('ConfirmComponent: danger swaps the confirm button', () => {
    const host = document.getElementById('host')!;
    const comp = new ConfirmComponent({
        open: new Signal(true),
        message: 'Träningspasset tas bort.',
        danger: true,
        confirmLabel: 'Ta bort',
        onconfirm: () => {},
    });
    comp.mount(host);

    expect(host.querySelector('.ui-confirm__btn--danger')!.textContent).toBe('Ta bort');
    expect(host.querySelector('.ui-confirm__btn--confirm')).toBeNull();

    comp.destroy();
});

test('ConfirmComponent: open class tracks the signal', () => {
    const host = document.getElementById('host')!;
    const open = new Signal(false);
    const comp = new ConfirmComponent({ open, message: 'x', onconfirm: () => {} });
    comp.mount(host);

    const dialog = host.querySelector('.ui-confirm') as HTMLElement;
    expect(dialog.classList.contains('open')).toBe(false);
    open.set(true);
    expect(dialog.classList.contains('open')).toBe(true);

    comp.destroy();
});

/*
 * The dark-theme defect: `color: #fff` was hardcoded on both the confirm and
 * the danger button. In dark theme --on-accent is #1C1F21, so white text on a
 * pale brass fill was the wrong way round.
 */
test('ConfirmComponent: no hardcoded white on the action buttons', () => {
    expect(ConfirmComponent.styles).not.toContain('#fff');
    expect(ConfirmComponent.styles).toContain('var(--on-accent)');
    expect(ConfirmComponent.styles).toContain('var(--on-danger)');
});

const references = (css: string, name: string): boolean =>
    new RegExp(`var\\(--${name}[,)]`).test(css);

test('ConfirmComponent: legacy token names are gone entirely', () => {
    for (const legacy of [
        'primary', 'primary-text', 'error', 'btn-bg', 'btn-hover',
        'shadow-elevated', 'radius', 'hover-bg',
    ]) {
        expect(references(ConfirmComponent.styles, legacy)).toBe(false);
    }
    expect(references(ConfirmComponent.styles, 'danger')).toBe(true);
    /*
     * --surface-2 is deliberately NOT referenced any more. It used to fill the
     * cancel button; cancel is now the ghost tier (§4.12), which has no fill
     * at all, so the dialog has exactly one button that looks like a button.
     */
    expect(references(ConfirmComponent.styles, 'surface-2')).toBe(false);
    expect(references(ConfirmComponent.styles, 'text-muted')).toBe(true);
});

/*
 * §4.12: the failure mode being fixed is "two identical OS-style dialog
 * buttons". Cancel must stay unfilled and unbordered so the eye lands on the
 * confirm button without comparing labels first, and the confirm button must
 * remain the only filled one.
 */
test('ConfirmComponent: cancel is the ghost tier, not a second bordered button', () => {
    const css = ConfirmComponent.styles;
    // The shared base carries a TRANSPARENT border, so cancel shows no edge
    // while every tier keeps the same box size.
    expect(css).toContain('border: 1px solid transparent;');
    expect(css).not.toContain('border: 1px solid var(--border-strong)');
    expect(css).toMatch(/--cancel \{\s*background: transparent;\s*color: var\(--text-muted\);/);
});

/* One focus signal, shared with every other control in the system. */
test('ConfirmComponent: focus is the soft brass ring, not an OS outline', () => {
    const css = ConfirmComponent.styles;
    expect(css).toContain('box-shadow: 0 0 0 3px var(--accent-soft)');
    expect(css).not.toContain('outline: 2px solid var(--accent)');
});

/*
 * --accent is referenced plainly. It briefly led with --primary instead, and
 * the reason is worth keeping: legacy themes used --accent for a DECORATIVE
 * highlight, so `var(--accent, var(--primary))` painted the confirm button
 * coral in apps/stable and dropped its label to 2.59:1. `var()` cannot tell
 * which meaning a defined token carries, so the collision is now resolved once
 * in the theme (a legacy app aliases `primary: var(--accent)`) rather than
 * guessed at by each recipe. Any chain reappearing here reintroduces the bug.
 */
test('ConfirmComponent: --accent is referenced plainly, with no fallback chain', () => {
    expect(references(ConfirmComponent.styles, 'accent')).toBe(true);
    expect(ConfirmComponent.styles).not.toContain('var(--accent,');
    expect(ConfirmComponent.styles).not.toContain('var(--primary');
});

/*
 * Hover regression guard. `--accent-strong` was referenced only as
 * `var(--accent-strong, var(--primary))`, and no legacy theme defined
 * --accent-strong — so hover fell through to --primary, i.e. the SAME colour as
 * the base fill, and the button had no hover state at all in any demo app. The
 * token is now defined by every theme the framework ships.
 */
test('ConfirmComponent: confirm hover is a different token from its base fill', () => {
    const rule = (sel: string) => {
        const start = ConfirmComponent.styles.indexOf(sel);
        const slice = ConfirmComponent.styles.slice(start);
        return slice.slice(0, slice.indexOf('}'));
    };
    expect(rule('.ui-confirm__btn--confirm {')).toContain('background: var(--accent)');
    expect(rule('.ui-confirm__btn--confirm:hover')).toContain('background: var(--accent-strong)');
});

// ─── Reactive copy ───────────────────────────────────────────────
//
// `title`, `confirmLabel` and `cancelLabel` were plain `string`, so the call
// site spent `t()`'s reactivity before the dialog existed. These tests switch
// the locale on a MOUNTED dialog and read the DOM back — a test that merely
// proves a thunk is ACCEPTED would pass against the broken version too.

const sv = {
    'confirm.abandon.title': 'Avbryt målet?',
    'confirm.abandon.confirm': 'Avbryt målet',
    'confirm.abandon.cancel': 'Behåll',
};
const en = {
    'confirm.abandon.title': 'Abandon the goal?',
    'confirm.abandon.confirm': 'Abandon goal',
    'confirm.abandon.cancel': 'Keep',
};

const withCatalogs = (): void => {
    resetMessages();
    registerMessages('sv', sv);
    registerMessages('en', en);
    setLocale('sv');
};

test('ConfirmComponent: title, confirm and cancel copy follow the locale', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new ConfirmComponent({
        open: new Signal(true),
        title: () => t('confirm.abandon.title'),
        message: 'Målet arkiveras.',
        confirmLabel: () => t('confirm.abandon.confirm'),
        cancelLabel: () => t('confirm.abandon.cancel'),
        onconfirm: () => {},
    });
    comp.mount(host);

    const read = () => ({
        title: host.querySelector('.ui-confirm__title')!.textContent,
        confirm: host.querySelector('.ui-confirm__btn--confirm')!.textContent,
        cancel: host.querySelector('.ui-confirm__btn--cancel')!.textContent,
    });

    expect(read()).toEqual({
        title: 'Avbryt målet?',
        confirm: 'Avbryt målet',
        cancel: 'Behåll',
    });

    setLocale('en');
    expect(read()).toEqual({
        title: 'Abandon the goal?',
        confirm: 'Abandon goal',
        cancel: 'Keep',
    });

    comp.destroy();
    resetMessages();
});

/*
 * `title` was documented static-only, and at least one app call site took that
 * seriously: it puts the per-object specifics in the reactive `message` and
 * keeps `title` a fixed question. Making `title` reactive must not disturb that
 * arrangement — the literal arm still renders, and still does not move.
 */
test('ConfirmComponent: a literal title still renders and stays static', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const horse = new Signal('Caspian');
    const comp = new ConfirmComponent({
        open: new Signal(true),
        title: 'Ta bort hästen?',
        message: () => `${horse.get()} tas bort permanent.`,
        onconfirm: () => {},
    });
    comp.mount(host);

    const title = host.querySelector('.ui-confirm__title') as HTMLElement;
    expect(title.textContent).toBe('Ta bort hästen?');
    expect(host.querySelector('.ui-confirm__message')!.textContent)
        .toBe('Caspian tas bort permanent.');

    // The specifics still live in `message`, and only `message` moves.
    horse.set('Luna');
    setLocale('en');
    expect(title.textContent).toBe('Ta bort hästen?');
    expect(host.querySelector('.ui-confirm__message')!.textContent)
        .toBe('Luna tas bort permanent.');

    comp.destroy();
    resetMessages();
});

test('ConfirmComponent: the default title and labels still apply', () => {
    const host = document.getElementById('host')!;
    const comp = new ConfirmComponent({
        open: new Signal(true),
        message: 'x',
        onconfirm: () => {},
    });
    comp.mount(host);

    expect(host.querySelector('.ui-confirm__title')!.textContent).toBe('Confirm');
    expect(host.querySelector('.ui-confirm__btn--confirm')!.textContent).toBe('Confirm');
    expect(host.querySelector('.ui-confirm__btn--cancel')!.textContent).toBe('Cancel');

    comp.destroy();
});

test('ConfirmComponent: a thunked danger label follows the locale', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new ConfirmComponent({
        open: new Signal(true),
        message: 'x',
        danger: true,
        confirmLabel: () => t('confirm.abandon.confirm'),
        onconfirm: () => {},
    });
    comp.mount(host);

    const btn = host.querySelector('.ui-confirm__btn--danger') as HTMLElement;
    expect(btn.textContent).toBe('Avbryt målet');
    setLocale('en');
    expect(btn.textContent).toBe('Abandon goal');

    comp.destroy();
    resetMessages();
});

test('ConfirmComponent: destroy stops the copy effects', () => {
    withCatalogs();
    const host = document.getElementById('host')!;
    const comp = new ConfirmComponent({
        open: new Signal(true),
        title: () => t('confirm.abandon.title'),
        message: 'x',
        onconfirm: () => {},
    });
    comp.mount(host);

    const title = host.querySelector('.ui-confirm__title') as HTMLElement;
    comp.destroy();
    setLocale('en');
    expect(title.textContent).toBe('Avbryt målet?');

    resetMessages();
});
