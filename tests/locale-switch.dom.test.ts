/**
 * Row copy has to survive a locale switch — at RUNTIME, in the DOM.
 *
 * This is deliberately not a test that a thunk is accepted. `StatusPillProps`
 * has taken `string | (() => string)` for a while, so a test asserting that a
 * function is a valid `label` would have passed against the very bug this file
 * exists to catch: the app was resolving `t()` at the call site and handing the
 * pill a dead string.
 *
 * The bug is specific to rows. `$each` builds them inside `untrack` on purpose
 * (a renderer that read a signal would subscribe the LIST effect and remount
 * every row on unrelated changes — `core.test.ts` pins that), so a `t()` called
 * in a renderer body is read exactly once, with nothing tracking it, and the
 * row keeps whatever locale was active when it was built. Nothing re-renders it
 * afterwards, because from the list's point of view nothing changed.
 *
 * So the only honest check is: mount the real view against real rows, flip the
 * locale, and read the DOM back.
 *
 * Mounted under the happy-dom adapter `bunfig.toml` preloads, same as
 * `lessons-empty.dom.test.ts`.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { setLocale } from '@basics/core/client/i18n';

const LESSONS = [
    {
        id: 'l1',
        teacherId: 't1',
        studentId: 's1',
        role: 'teacher',
        counterpartyDisplayName: 'Anna Berg',
        scheduledAt: '2026-08-01T10:00:00.000Z',
        status: 'completed',
        horseId: null,
        horseName: null,
        planId: null,
        planTitle: null,
        programs: [],
        exercises: [],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
    },
    {
        id: 'l2',
        teacherId: 't1',
        studentId: 's1',
        role: 'teacher',
        counterpartyDisplayName: 'Anna Berg',
        scheduledAt: '2026-08-02T10:00:00.000Z',
        status: 'cancelled',
        horseId: null,
        horseName: null,
        planId: null,
        planTitle: null,
        programs: [],
        exercises: [],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
    },
];

const INBOX = [
    {
        id: 'i1',
        teacherId: 't1',
        teacherDisplayName: 'Alva Lindgren',
        teacherEmail: 'alva@exempel.se',
        inviteeEmail: 'elev@exempel.se',
        status: 'pending',
        createdAt: '2026-07-01T10:00:00.000Z',
        expiresAt: '2026-08-01T10:00:00.000Z',
        acceptedAt: null,
    },
];

const INVITATIONS = [
    {
        id: 'v1',
        teacherId: 't1',
        inviteeEmail: 'elev@exempel.se',
        status: 'pending',
        createdAt: '2026-07-01T10:00:00.000Z',
        expiresAt: '2026-08-01T10:00:00.000Z',
        acceptedAt: null,
    },
];

const realFetch = globalThis.fetch;
beforeAll(() => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(typeof input === 'string' ? input : (input as Request).url ?? input);
        // `/invitations/inbox` must be tested before `/invitations`, or the
        // inbox view is served the teacher-side list and renders nothing.
        const body = url.includes('/lessons') ? JSON.stringify(LESSONS)
            : url.includes('/invitations/inbox') ? JSON.stringify(INBOX)
            : url.includes('/invitations') ? JSON.stringify(INVITATIONS)
            : '[]';
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; setLocale('sv'); });

const { LessonsComponent } = await import('../web/lessons/lessons.component');
const { InboxComponent } = await import('../web/inbox/inbox.component');
const { InvitationsComponent } = await import('../web/invitations/invitations.component');

async function mountLessons() {
    di.reset();
    di.get(Router);
    document.body.innerHTML = '<div id="app"></div>';
    const view = new LessonsComponent();
    view.mount(document.getElementById('app') as HTMLElement);
    await new Promise((r) => setTimeout(r, 20));
    return view;
}

const pillTexts = (): string[] =>
    Array.from(document.querySelectorAll('#app .ui-status-pill'))
        .map((el) => (el.textContent ?? '').replace('✕', '').trim())
        .filter((s) => s.length > 0);

test('locale switch: status pills inside $each rows re-render', async () => {
    setLocale('sv');
    const view = await mountLessons();

    // Guard the guard: if the rows never rendered, every assertion below would
    // pass vacuously against an empty list.
    expect(pillTexts().length, 'no rows rendered — the rest of this test would be vacuous')
        .toBeGreaterThan(0);
    expect(pillTexts()).toContain('Utförd');
    expect(pillTexts()).toContain('Inställd');

    // The switch. No re-mount, no re-fetch, no navigation — exactly what a user
    // flipping the language does.
    setLocale('en');
    expect(pillTexts()).toContain('Completed');
    expect(pillTexts()).toContain('Cancelled');
    expect(pillTexts()).not.toContain('Utförd');

    // And back, so this is reactivity rather than a one-way latch.
    setLocale('sv');
    expect(pillTexts()).toContain('Utförd');

    view.destroy();
});

/**
 * /inbox and /invitations were the last two views rendering hardcoded Swedish
 * literals: their headings, buttons and row copy were written straight into the
 * template and the `$each` renderers, so `setLocale('en')` moved every other
 * page and left these two in Swedish.
 *
 * Both halves are asserted for each view, because they fail for different
 * reasons. The heading is a plain template literal — a missing `t()`. The row
 * copy is the `$each` trap this file's header describes, and a renderer that
 * called `t()` in its body would pass the heading assertion while staying
 * frozen at whatever locale the row was built in.
 */
async function mountView<T extends { mount(host: HTMLElement): void }>(
    make: () => T,
): Promise<T> {
    di.reset();
    di.get(Router);
    document.body.innerHTML = '<div id="app"></div>';
    const view = make();
    view.mount(document.getElementById('app') as HTMLElement);
    await new Promise((r) => setTimeout(r, 20));
    return view;
}

const heading = (): string => (document.querySelector('#app h1')?.textContent ?? '').trim();
const rowText = (sel: string): string =>
    (document.querySelector(`#app ${sel}`)?.textContent ?? '').trim();

test('locale switch: the inbox follows the locale, heading and rows alike', async () => {
    setLocale('sv');
    const view = await mountView(() => new InboxComponent());

    expect(heading()).toBe('Inkorg');
    // Guard the guard: without a row the row assertions are vacuous.
    expect(document.querySelectorAll('#app .inbox__item').length,
        'no rows rendered — the row assertions below would be vacuous').toBe(1);
    expect(rowText('.inbox__from')).toBe('Inbjudan från Alva Lindgren (alva@exempel.se)');
    expect(rowText('.inbox__accept')).toBe('Acceptera');

    setLocale('en');
    expect(heading()).toBe('Inbox');
    expect(rowText('.inbox__from')).toBe('Invitation from Alva Lindgren (alva@exempel.se)');
    expect(rowText('.inbox__accept')).toBe('Accept');
    expect(rowText('.inbox__decline')).toBe('Decline');

    setLocale('sv');
    expect(heading()).toBe('Inkorg');
    expect(rowText('.inbox__decline')).toBe('Avböj');

    view.destroy();
});

test('locale switch: my invitations follows the locale, heading and rows alike', async () => {
    setLocale('sv');
    const view = await mountView(() => new InvitationsComponent());

    expect(heading()).toBe('Mina inbjudningar');
    expect(document.querySelectorAll('#app .invitations__item').length,
        'no rows rendered — the row assertions below would be vacuous').toBe(1);
    // The status used to render the raw enum ('pending') in every language.
    expect(rowText('.invitations__status')).toBe('Väntar på svar');
    expect(rowText('.invitations__revoke')).toBe('Återkalla');

    // The placeholder is an attribute, not text — the one piece of copy here
    // that a textContent-only sweep would miss.
    const emailField = document.querySelector('#app input[type="email"]') as HTMLInputElement;
    expect(emailField.placeholder).toBe('Email');

    setLocale('en');
    expect(heading()).toBe('My invitations');
    expect(rowText('.invitations__status')).toBe('Awaiting reply');
    expect(rowText('.invitations__revoke')).toBe('Revoke');

    setLocale('sv');
    expect(heading()).toBe('Mina inbjudningar');
    expect(rowText('.invitations__status')).toBe('Väntar på svar');

    view.destroy();
});
