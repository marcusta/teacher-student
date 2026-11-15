/**
 * What Kontoinställningar actually puts on screen when the form is submitted.
 *
 * `account-copy.test.ts` proves which key each branch produces. It cannot see
 * whether the component RENDERS that key, whether the wrong-password conflict
 * reaches the alert instead of the server apology, whether a successful save
 * leaves the old password sitting in the box — or whether any of the copy was
 * resolved eagerly at construction, which is invisible until someone switches
 * language.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads, same as
 * `home-empty.dom.test.ts`. The component is imported AFTER the fetch stub is
 * installed, so nothing it pulls in can reach the network.
 */
import { test, expect, beforeEach, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ToastService } from '@basics/core/client/ui/toast';
import { setLocale } from '@basics/core/client/i18n';

const realFetch = globalThis.fetch;

/** What the stubbed `POST /api/account/password` answers with. */
let status = 200;
const calls: unknown[] = [];

beforeEach(() => {
    status = 200;
    calls.length = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), body: init?.body });
        if (status === 200) {
            return new Response('{"ok":true}', {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }
        // The server's own words, in developer English. Nothing here may ever
        // reach a screen — that is half of what this file asserts.
        return new Response('{"error":"Current password is incorrect"}', {
            status,
            headers: { 'content-type': 'application/json' },
        });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); });

const { AccountComponent } = await import('../web/account/account.component');
const { AccountService } = await import('../web/account/account.service');

const USER = { id: 'u1', username: 'anna@example.com' };

/**
 * What the view holds the moment `render()` returns — BEFORE `onMount()` runs.
 *
 * This is what makes the constructor-clear tests below discriminating. The
 * service is a DI singleton that outlives the view, so its `error` and
 * `loading` have to be reset before the bindings are first evaluated;
 * `mount()` is `render()` then `onMount()`, so a clear moved into `onMount()`
 * would leave a stale alert (and a stale `inert`) in the fragment that is about
 * to be inserted, and every after-the-fact DOM assertion would still pass.
 */
type Painted = { alert: string; submit: string; inert: boolean };
let painted: Painted | null = null;

const Probed = AccountComponent as unknown as { prototype: { render: () => DocumentFragment } };
const realRender = Probed.prototype.render;
Probed.prototype.render = function (this: unknown): DocumentFragment {
    const frag = realRender.call(this);
    const root = frag.querySelector('.account') as HTMLElement & { inert?: boolean };
    painted = {
        alert: (frag.querySelector('.account__alert') as HTMLElement).textContent ?? '',
        submit: (frag.querySelector('.account__submit') as HTMLElement).textContent ?? '',
        inert: root.inert === true,
    };
    return frag;
};

/** Mount into a FRESH container — a first visit. */
function mountAccount() {
    di.reset();
    di.get(Router);
    di.get(AuthService).currentUser.set(USER);
    const toasts = di.get(ToastService);
    return { ...remountAccount(), toasts, svc: di.get(AccountService) };
}

/** Mount again into the SAME container — a second visit to the page. */
function remountAccount() {
    painted = null;
    document.body.innerHTML = '<div id="app"></div>';
    const view = new AccountComponent();
    view.mount(document.getElementById('app') as HTMLElement);
    return { view };
}

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const current = () => field('acct-current');
const next = () => field('acct-new');
const confirm = () => field('acct-confirm');

function type(el: HTMLInputElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Submit the form the way the browser does, and let the async handler settle. */
async function submit(): Promise<void> {
    const form = document.querySelector('#app form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));
}

const errorTexts = (): string[] =>
    [...document.querySelectorAll('#app .account__error.is-shown')]
        .map((el) => (el.textContent ?? '').trim())
        .filter((s) => s.length > 0);

const alertText = (): string =>
    (document.querySelector('#app .account__alert') as HTMLElement).textContent?.trim() ?? '';

test('the fields are wired for assistive tech and for password managers', () => {
    setLocale('sv');
    const { view } = mountAccount();

    // A password manager reads `autocomplete` to know which box holds the old
    // secret and which two hold the new one. Get this wrong and it either
    // offers nothing or saves the wrong value.
    expect(current().getAttribute('autocomplete')).toBe('current-password');
    expect(next().getAttribute('autocomplete')).toBe('new-password');
    expect(confirm().getAttribute('autocomplete')).toBe('new-password');
    for (const el of [current(), next(), confirm()]) {
        expect(el.getAttribute('type'), 'a password field must not render in the clear').toBe('password');
    }

    // Every field points at its own hint AND its own error, and both targets
    // exist — an aria-describedby naming a missing id is announced as nothing.
    for (const [el, ids] of [
        [current(), ['acct-current-hint', 'acct-current-error']],
        [next(), ['acct-new-hint', 'acct-new-error']],
        [confirm(), ['acct-confirm-hint', 'acct-confirm-error']],
    ] as const) {
        expect(el.getAttribute('aria-describedby')).toBe(ids.join(' '));
        for (const id of ids) {
            expect(document.getElementById(id), `${id} is described but does not exist`).not.toBeNull();
        }
        // Every field is labelled, and the label points at the field itself.
        const label = document.querySelector(`#app label[for="${el.id}"]`) as HTMLElement;
        expect(label, `${el.id} has no label`).not.toBeNull();
        expect((label.textContent ?? '').trim().length).toBeGreaterThan(0);
    }

    // The one the server's minimum is stated to the browser through. Asserted
    // on the DOM rather than on the binding, because `minlength` spelled the
    // lowercase way lands as an expando that reflects to nothing.
    expect(next().getAttribute('minlength')).toBe('8');

    view.destroy();
});

test('aria-invalid is live state, not a one-way latch', async () => {
    setLocale('sv');
    const { view } = mountAccount();

    for (const el of [current(), next(), confirm()]) {
        expect(el.getAttribute('aria-invalid'), 'nothing is invalid before a submit').toBe('false');
    }

    type(current(), 'gammalt123');
    type(next(), 'kort');
    type(confirm(), 'kort');
    await submit();

    expect(next().getAttribute('aria-invalid')).toBe('true');
    expect(current().getAttribute('aria-invalid')).toBe('false');

    // And back again as it is fixed. A latch here would leave a screen reader
    // announcing a corrected field as invalid for the rest of the visit.
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    expect(next().getAttribute('aria-invalid')).toBe('false');
    expect(confirm().getAttribute('aria-invalid')).toBe('false');

    view.destroy();
});

test('the page names itself and states which account is signed in', () => {
    setLocale('sv');
    const { view } = mountAccount();

    expect((document.querySelector('#app h1') as HTMLElement).textContent).toBe('Kontoinställningar');
    // The email is a fact about the session, not a field: it is read from
    // AuthService rather than typed, and it is not editable here.
    expect((document.querySelector('#app .account__row-value') as HTMLElement).textContent)
        .toBe('anna@example.com');
    expect(document.querySelectorAll('#app input').length, 'only the password fields are editable').toBe(3);

    view.destroy();
});

test('submitting an empty form names every problem and focuses the first', async () => {
    setLocale('sv');
    const { view } = mountAccount();

    // Nothing scolds before a submit — the form does not correct someone who
    // has not yet claimed to be finished.
    expect(errorTexts()).toEqual([]);

    await submit();

    // Two problems, not three: the confirmation repeats an empty new password,
    // so it is not ALSO wrong. See account-copy.test.ts for why.
    expect(errorTexts()).toEqual([
        'Fyll i ditt nuvarande lösenord.',
        'Fyll i ett nytt lösenord.',
    ]);
    expect(document.activeElement, 'the first invalid field takes focus').toBe(current());
    // A refused submit never reaches the network.
    expect(calls.length).toBe(0);

    view.destroy();
});

test('every field can be wrong at once, and the first invalid one takes focus', async () => {
    setLocale('sv');
    const { view } = mountAccount();

    type(current(), 'gammalt123');
    type(next(), 'kort');
    type(confirm(), 'nagot-annat');
    await submit();

    expect(errorTexts()).toEqual([
        'Välj ett lösenord på minst 8 tecken.',
        'Lösenorden stämmer inte överens. Skriv samma lösenord i båda fälten.',
    ]);
    expect(document.activeElement).toBe(next());
    expect(calls.length).toBe(0);

    // Correcting while a submit is outstanding revalidates live, so the reader
    // sees the complaint disappear as they fix it.
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    expect(errorTexts()).toEqual([]);

    view.destroy();
});

test('a 409 says the current password is wrong, in Swedish, and never the server\'s words', async () => {
    setLocale('sv');
    status = 409;
    const { view } = mountAccount();

    type(current(), 'fel-losenord');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();

    expect(calls.length, 'a valid form must actually be submitted').toBe(1);
    expect(alertText()).toBe('Nuvarande lösenord stämmer inte. Kontrollera det och försök igen.');
    expect(alertText()).not.toContain('Current password is incorrect');
    expect((document.querySelector('#app .account__alert') as HTMLElement).getAttribute('role'))
        .toBe('alert');

    // A rejected attempt keeps what was typed: the new password is still the
    // one the reader chose, and only the top field needs another go.
    expect(next().value).toBe('nytt-losenord');
    expect(confirm().value).toBe('nytt-losenord');

    view.destroy();
});

test('a 500 does not borrow the wrong-password message', async () => {
    setLocale('sv');
    status = 500;
    const { view } = mountAccount();

    type(current(), 'gammalt123');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();

    expect(alertText()).toBe('Något gick fel hos oss. Vänta en stund och försök igen.');

    view.destroy();
});

test('a successful save empties the form, stays on the page, and says so once', async () => {
    setLocale('sv');
    const { view, toasts } = mountAccount();

    type(current(), 'gammalt123');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();

    expect(calls.length).toBe(1);
    expect(String((calls[0] as { url: string }).url)).toContain('/account/password');
    // Only what the endpoint takes — the confirmation is a client-side check.
    expect(JSON.parse(String((calls[0] as { body: string }).body)))
        .toEqual({ currentPassword: 'gammalt123', newPassword: 'nytt-losenord' });

    // Three spent secrets do not stay in the DOM.
    expect([current().value, next().value, confirm().value]).toEqual(['', '', '']);
    expect(errorTexts()).toEqual([]);
    expect(alertText()).toBe('');

    // The confirmation is the toast, and there is exactly one of it.
    expect(toasts.items.get().map((i) => [i.message, i.variant]))
        .toEqual([['Lösenordet är ändrat.', 'success']]);

    // Still here: the page is where you change a password again if you want to.
    expect(document.querySelector('#app h1')).not.toBeNull();

    view.destroy();
});

test('an emptied form does not immediately scold about the fields it just cleared', async () => {
    setLocale('sv');
    const { view } = mountAccount();

    type(current(), 'gammalt123');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();

    // The submitted gate is released with the values. Typing into a freshly
    // emptied form must not re-raise "fyll i ett nytt lösenord" on the first
    // keystroke, which is what would happen if the gate stayed armed.
    type(current(), 'g');
    expect(errorTexts()).toEqual([]);

    view.destroy();
});

test('a locally-rejected submit drops the previous attempt\'s verdict', async () => {
    setLocale('sv');
    status = 409;
    const { view } = mountAccount();

    type(current(), 'fel-losenord');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();
    expect(alertText()).toBe('Nuvarande lösenord stämmer inte. Kontrollera det och försök igen.');

    // The reader takes the advice and fixes the current password, but fumbles
    // the confirmation. This submit never reaches the network, so nothing else
    // would clear the alert — and leaving it up accuses a field that is now
    // right, while the real problem is stated further down the form.
    type(current(), 'gammalt123');
    type(confirm(), 'nagot-annat');
    await submit();

    expect(calls.length, 'the second submit is refused locally').toBe(1);
    expect(alertText()).toBe('');
    expect(errorTexts()).toEqual(['Lösenorden stämmer inte överens. Skriv samma lösenord i båda fälten.']);

    view.destroy();
});

/**
 * The service is a DI singleton and the view is not. Both tests below mount a
 * SECOND component into the same container, which is what a visitor does by
 * navigating away and coming back, and both assert what `render()` produced
 * rather than what the DOM settled on — see `Painted`.
 */
test('a stale alert from an earlier visit never paints', async () => {
    setLocale('sv');
    status = 409;
    const { view, svc } = mountAccount();

    type(current(), 'fel-losenord');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();
    expect(alertText()).not.toBe('');
    view.destroy();

    // The error outlives the view it was raised in.
    expect(svc.error.get(), 'the singleton must still be dirty, or this proves nothing').not.toBeNull();

    const second = remountAccount();
    expect(painted!.alert, 'a stale role="alert" must not be in the fragment at all').toBe('');
    expect(alertText()).toBe('');
    // Cleared at the source, not merely hidden by a class.
    expect(svc.error.get()).toBeNull();

    second.view.destroy();
});

test('a submit still in flight when the page is left does not freeze the next visit', async () => {
    setLocale('sv');
    const { view, svc } = mountAccount();

    // A save that has not come back yet. The real one has 30 seconds of
    // `apiFetch` timeout to sit in.
    let release: (() => void) | null = null;
    globalThis.fetch = (async () => {
        await new Promise<void>((r) => { release = r; });
        return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    type(current(), 'gammalt123');
    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();

    expect(svc.loading.get(), 'the save must still be in flight').toBe(true);
    expect((document.querySelector('#app .account__submit') as HTMLElement).textContent)
        .toBe('Sparar …');

    // The sidebar is outside the inert root, so leaving mid-save is one click.
    view.destroy();
    const second = remountAccount();

    // Without the constructor's reset this is a page that is empty, dimmed,
    // unclickable and reading "Sparar …" until the timeout fires.
    expect(painted!.inert, 'a fresh page must not mount inert').toBe(false);
    expect(painted!.submit).toBe('Spara nytt lösenord');
    expect(svc.loading.get()).toBe(false);
    expect([current().value, next().value, confirm().value]).toEqual(['', '', '']);

    // Let the abandoned request settle so no timer outlives the test.
    release!();
    await new Promise((r) => setTimeout(r, 20));

    second.view.destroy();
});

/**
 * The eager-resolution trap. Every string here is bound as a thunk, so flipping
 * the locale with the page already mounted must move ALL of it — labels, hints,
 * the button, the rendered field errors and the alert alike. A `t()` resolved
 * at construction (or inside a handler, into a plain string) passes every test
 * above and freezes here.
 */
test('a locale flip moves every string on the page, errors included', async () => {
    setLocale('sv');
    status = 409;
    const { view } = mountAccount();

    type(current(), 'fel-losenord');
    type(next(), 'kort');
    type(confirm(), 'kort');
    await submit();
    expect(errorTexts()).toEqual(['Välj ett lösenord på minst 8 tecken.']);

    type(next(), 'nytt-losenord');
    type(confirm(), 'nytt-losenord');
    await submit();
    expect(alertText()).toBe('Nuvarande lösenord stämmer inte. Kontrollera det och försök igen.');

    setLocale('en');
    expect((document.querySelector('#app h1') as HTMLElement).textContent).toBe('Account settings');
    expect((document.querySelector('#app .account__heading') as HTMLElement).textContent)
        .toBe('Account');
    expect((document.querySelector('#app label[for="acct-current"]') as HTMLElement).textContent)
        .toBe('Current password');
    expect((document.getElementById('acct-new-hint') as HTMLElement).textContent)
        .toBe('At least 8 characters.');
    expect((document.querySelector('#app .account__submit') as HTMLElement).textContent)
        .toBe('Save new password');
    expect(alertText()).toBe('That current password doesn\'t match. Check it and try again.');

    // And a field error raised while Swedish was active follows too.
    type(confirm(), 'annat');
    await submit();
    expect(errorTexts()).toEqual(['The passwords don\'t match. Type the same password in both fields.']);

    setLocale('sv');
    expect(errorTexts()).toEqual(['Lösenorden stämmer inte överens. Skriv samma lösenord i båda fälten.']);

    view.destroy();
});
