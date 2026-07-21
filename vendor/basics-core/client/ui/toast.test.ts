import { test, expect, beforeEach, afterEach } from 'bun:test';
import { di } from '../core';
import { ToastService, ToastContainer } from './toast';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    di.reset();
});

afterEach(() => {
    di.reset();
});

/** Mount a container over a fresh service registered in the DI container. */
const setup = () => {
    const svc = new ToastService();
    di.set(ToastService, svc);
    const host = document.getElementById('host')!;
    const comp = new ToastContainer();
    comp.mount(host);
    return { svc, host, comp };
};

// ─── Service ────────────────────────────────────────────────────

test('ToastService: show adds an item with defaults', () => {
    const svc = new ToastService();
    svc.show({ message: 'Saved' });

    const [item] = svc.items.get();
    expect(item!.message).toBe('Saved');
    expect(item!.variant).toBe('info');
    expect(item!.duration).toBe(3000);
    expect(item!.action).toBeUndefined();

    svc.dismiss(item!.id);
});

test('ToastService: dismiss removes the item', () => {
    const svc = new ToastService();
    svc.show({ message: 'Saved' });
    const id = svc.items.get()[0]!.id;

    svc.dismiss(id);
    expect(svc.items.get().length).toBe(0);
});

// §4.12: an undo toast has to outlive a 3 s default, or it cannot be undone.
test('ToastService: an action raises the default duration to 8s', () => {
    const svc = new ToastService();
    svc.show({ message: 'Träningspasset togs bort.', action: { label: 'Ångra', onclick: () => {} } });

    const [item] = svc.items.get();
    expect(item!.duration).toBe(8000);
    expect(item!.action!.label).toBe('Ångra');

    svc.dismiss(item!.id);
});

test('ToastService: explicit duration beats both defaults', () => {
    const svc = new ToastService();
    svc.show({ message: 'x', duration: 500, action: { label: 'Ångra', onclick: () => {} } });
    expect(svc.items.get()[0]!.duration).toBe(500);
    svc.dismiss(svc.items.get()[0]!.id);
});

test('ToastService: duration 0 keeps the toast until dismissed by hand', async () => {
    const svc = new ToastService();
    svc.show({ message: 'sticky', duration: 0 });

    await new Promise(r => setTimeout(r, 30));
    expect(svc.items.get().length).toBe(1);

    svc.dismiss(svc.items.get()[0]!.id);
    expect(svc.items.get().length).toBe(0);
});

test('ToastService: auto-dismisses after the duration', async () => {
    const svc = new ToastService();
    svc.show({ message: 'brief', duration: 20 });
    expect(svc.items.get().length).toBe(1);

    await new Promise(r => setTimeout(r, 60));
    expect(svc.items.get().length).toBe(0);
});

// ─── Container ──────────────────────────────────────────────────

test('ToastContainer: renders the message', () => {
    const { svc, host, comp } = setup();
    svc.show({ message: 'Saved' });

    expect(host.querySelector('.ui-toast__message')!.textContent).toBe('Saved');

    comp.destroy();
});

test('ToastContainer: no action slot when no action is given', () => {
    const { svc, host, comp } = setup();
    svc.show({ message: 'Saved' });

    expect(host.querySelector('.ui-toast__action')).toBeNull();
    expect(host.querySelector('.ui-toast__countdown')).toBeNull();

    comp.destroy();
});

test('ToastContainer: renders the action and its countdown', () => {
    const { svc, host, comp } = setup();
    svc.show({ message: 'Träningspasset togs bort.', action: { label: 'Ångra', onclick: () => {} } });

    expect(host.querySelector('.ui-toast__action')!.textContent).toBe('Ångra');
    expect(host.querySelector('.ui-toast__countdown')!.textContent).toBe('8 s');

    comp.destroy();
});

test('ToastContainer: the action fires and dismisses the toast', () => {
    const { svc, host, comp } = setup();
    let undone = false;
    svc.show({ message: 'Togs bort.', action: { label: 'Ångra', onclick: () => { undone = true; } } });

    (host.querySelector('.ui-toast__action') as HTMLElement).click();
    expect(undone).toBe(true);
    expect(svc.items.get().length).toBe(0);

    comp.destroy();
});

test('ToastContainer: countdown ticks down', async () => {
    const { svc, host, comp } = setup();
    svc.show({
        message: 'Togs bort.',
        duration: 3000,
        action: { label: 'Ångra', onclick: () => {} },
    });

    expect(host.querySelector('.ui-toast__countdown')!.textContent).toBe('3 s');
    await new Promise(r => setTimeout(r, 1100));
    expect(host.querySelector('.ui-toast__countdown')!.textContent).toBe('2 s');

    svc.dismiss(svc.items.get()[0]!.id);
    comp.destroy();
});

/*
 * The countdown owns a setInterval. If the item scope does not dispose it, every
 * action-toast leaks a timer that ticks forever against a detached node — and
 * the leak is invisible, because the toast looks correct on the way out. Rapid
 * create/dismiss is where it shows up, so that is what this drives.
 */
test('ToastContainer: the countdown interval is disposed when the toast leaves', async () => {
    const { svc, host, comp } = setup();

    const live = new Set<ReturnType<typeof setInterval>>();
    const realSet = globalThis.setInterval;
    const realClear = globalThis.clearInterval;
    globalThis.setInterval = ((fn: any, ms?: number, ...a: any[]) => {
        const id = realSet(fn, ms, ...a);
        live.add(id);
        return id;
    }) as typeof globalThis.setInterval;
    globalThis.clearInterval = ((id: any) => { live.delete(id); return realClear(id); }) as typeof globalThis.clearInterval;

    try {
        for (let i = 0; i < 20; i++) {
            svc.show({
                message: `Togs bort ${i}.`,
                action: { label: 'Ångra', onclick: () => {} },
            });
            const id = svc.items.get()[0]!.id;
            expect(host.querySelector('.ui-toast__countdown')).not.toBeNull();
            svc.dismiss(id);
        }

        expect(svc.items.get().length).toBe(0);
        expect(host.querySelectorAll('.ui-toast').length).toBe(0);
        // Every interval the countdowns opened must have been cleared.
        expect(live.size).toBe(0);

        // Destroying the container must not strand one either.
        svc.show({ message: 'kvar', action: { label: 'Ångra', onclick: () => {} } });
        expect(live.size).toBe(1);
        comp.destroy();
        expect(live.size).toBe(0);
    } finally {
        for (const id of live) realClear(id);
        globalThis.setInterval = realSet;
        globalThis.clearInterval = realClear;
    }
});

test('ToastContainer: no countdown on a sticky toast', () => {
    const { svc, host, comp } = setup();
    svc.show({ message: 'x', duration: 0, action: { label: 'Ångra', onclick: () => {} } });

    expect(host.querySelector('.ui-toast__action')).not.toBeNull();
    expect(host.querySelector('.ui-toast__countdown')).toBeNull();

    comp.destroy();
});

test('ToastContainer: close button dismisses', () => {
    const { svc, host, comp } = setup();
    svc.show({ message: 'Saved' });

    (host.querySelector('.ui-toast__close') as HTMLElement).click();
    expect(svc.items.get().length).toBe(0);

    comp.destroy();
});

test('ToastContainer: variant lands on the element class', () => {
    const { svc, host, comp } = setup();
    svc.show({ message: 'Nope', variant: 'error' });

    expect(host.querySelector('.ui-toast')!.classList.contains('ui-toast--error')).toBe(true);

    comp.destroy();
});

// ─── The charcoal rule ──────────────────────────────────────────

/*
 * §4.12: "Toasten är alltid charcoal." The old code used var(--surface),
 * which renders white in light theme. The surface must be a literal so no
 * theme can invert it.
 */
test('ToastContainer: background is charcoal, not a theme-dependent token', () => {
    const toastRule = ToastContainer.styles.slice(
        ToastContainer.styles.indexOf('.ui-toast {'),
    );
    const body = toastRule.slice(0, toastRule.indexOf('}'));

    expect(body).toContain('background: #1C1F21');
    expect(body).not.toContain('var(--surface)');
});

/*
 * The fill is fixed, so separation from the page has to come from somewhere
 * else. In dark theme the charcoal toast sits on a #131A20 page at 1.10:1, and
 * the old fixed #3B372F hairline only reached 1.48:1 against it — the toast
 * read as a smudge. Border and elevation are therefore the two properties that
 * DO follow the theme: --border-strong is a mid-tone in both themes, so it
 * separates without ever inverting the surface.
 */
test('ToastContainer: separates from the page with a border and shadow', () => {
    const toastRule = ToastContainer.styles.slice(
        ToastContainer.styles.indexOf('.ui-toast {'),
    );
    const body = toastRule.slice(0, toastRule.indexOf('}'));

    expect(body).toContain('border: 1px solid var(--border-strong)');
    expect(body).toContain('box-shadow: var(--shadow-3)');
    // The old fixed hairline, which was the thing that vanished.
    expect(body).not.toContain('#3B372F');
});

test('ToastContainer: text on the toast is light in both themes', () => {
    expect(ToastContainer.styles).toContain('color: #F1ECE3');
    // --text would be charcoal-on-charcoal in light theme.
    const msgRule = ToastContainer.styles.slice(
        ToastContainer.styles.indexOf('.ui-toast__message'),
    );
    expect(msgRule.slice(0, msgRule.indexOf('}'))).not.toContain('var(--text)');
});

// The latent bug: info and success were byte-identical branches.
test('ToastContainer: the three variants are visually distinct', () => {
    const rule = (name: string) => {
        const start = ToastContainer.styles.indexOf(`.ui-toast--${name} {`);
        const slice = ToastContainer.styles.slice(start);
        return slice.slice(0, slice.indexOf('}'));
    };

    const info = rule('info');
    const success = rule('success');
    const error = rule('error');

    expect(info).not.toBe(success);
    expect(success).not.toBe(error);
    expect(info).not.toBe(error);
});
