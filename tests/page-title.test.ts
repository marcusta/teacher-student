import { test, expect } from 'bun:test';
import { pageTitleKey, TITLED_ROUTES } from '../web/app/page-title';
import { APP_ROUTES, PUBLIC_ROUTES } from '../web/app/route-guard';
import { NAV_GROUPS } from '../web/app/nav.structure';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

/** Nav destination → the key the sidebar link renders. */
const NAV_KEY = new Map(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.path, i.key] as const)));

test('page-title: every nav destination is named with the SAME key its link renders', () => {
    // The bar and the sidebar highlight are two indicators of one fact and must
    // never word it differently — `page-title.ts` says so in prose, and this is
    // what holds it up. A nav link the bar cannot name is a page that looks
    // unnamed below 1024px, where the sidebar is not rendered and the bar is
    // the only indicator left; a nav link the bar names DIFFERENTLY is worse,
    // because the page then contradicts the navigation that reached it.
    //
    // This used to be enforced only incidentally, by the `/^nav\./` pattern in
    // the KEY test below. That was never the same claim: it would have accepted
    // '/library': 'nav.home' as readily as 'nav.library'. The identity is
    // asserted directly now, so the two ends are pinned to one key rather than
    // to one namespace.
    expect(NAV_KEY.size).toBeGreaterThan(0);
    for (const [path, key] of NAV_KEY) {
        expect(pageTitleKey(path), `${path} must be named ${key}, as its nav link is`).toBe(key);
    }
});

test('page-title: exactly three named routes are NOT nav destinations', () => {
    // The complement of the rule above, pinned as a closed list so a route
    // cannot quietly acquire a name of its own invention. All three are
    // reachable by URL and none is in the sidebar, so none has a nav label to
    // agree with:
    //
    //   /program, /invitations  left the navigation (IA 1) but still resolve.
    //   /konto                  is reached from the nav FOOTER, which is
    //                           deliberately not a NAV_GROUPS entry (see
    //                           nav.component.ts), so its name is the page's
    //                           own title.
    //
    // A fourth entry here means someone added a destination without deciding
    // whether it belongs in the navigation.
    expect(TITLED_ROUTES.filter((r) => !NAV_KEY.has(r)).sort())
        .toEqual(['/invitations', '/konto', '/program']);
    expect(pageTitleKey('/konto')).toBe('account.title');
});

test('page-title: routes that left the navigation are still named', () => {
    // Both still resolve (INFORMATION_ARCHITECTURE.md 1) and are still
    // reachable by URL, so both still need naming.
    expect(pageTitleKey('/invitations')).toBe('nav.invitations');
    expect(pageTitleKey('/program')).toBe('nav.programs');
});

test('page-title: REVERSE DRIFT — the table names no route the app does not have', () => {
    // The direction nothing was checking. `page-title.dom.test.ts` holds the
    // table against `ROUTE_COMPONENTS` forwards — every route the app resolves
    // must be named — but adding '/spoke': 'nav.home' to PAGE_TITLES left all
    // thirteen tests passing, because a name for a route that does not exist
    // breaks nothing until someone reads the table and believes it.
    //
    // `TITLED_ROUTES` is exported for exactly this and was used in one
    // direction only. Both directions now, so the table and the route list are
    // held equal rather than merely overlapping.
    for (const base of TITLED_ROUTES) {
        expect(APP_ROUTES as readonly string[], `${base} is named but is not a route`)
            .toContain(base);
    }
    expect([...TITLED_ROUTES].sort()).toEqual([...APP_ROUTES].sort());
});

test('page-title: LONGEST match wins, not the first one declared', () => {
    // The comment in page-title.ts promises longest-match. The loop returns the
    // FIRST match, so the promise held only because no route base is a prefix
    // of another today — one `/program` + `/program/arkiv` pair and the answer
    // would depend on which was typed into the object literal first.
    //
    // TITLED_ROUTES is sorted longest-first to make that true by construction.
    // Asserted on the ordering rather than on a hypothetical route pair,
    // because the pair does not exist yet and inventing one in the table would
    // trip the reverse-drift check above.
    const lengths = TITLED_ROUTES.map((r) => r.length);
    expect(lengths, 'TITLED_ROUTES must be ordered longest-first')
        .toEqual([...lengths].sort((a, b) => b - a));

    // And the property that ordering buys: where one base prefixes another on a
    // segment boundary, the longer one is the answer. '/mal' and '/malaria'
    // are not such a pair (no boundary), which is exactly why the ordering,
    // not the data, has to carry this.
    for (const base of TITLED_ROUTES) {
        const longer = TITLED_ROUTES.filter((o) => o !== base && o.startsWith(base + '/'));
        for (const o of longer) {
            expect(pageTitleKey(o), `${o} must not be answered by ${base}`)
                .not.toBe(pageTitleKey(base));
        }
    }
});

test('page-title: a detail route inherits its section name', () => {
    // Whole segments, matching the guard's and Router.link's notion of "inside
    // this section" — so the bar keeps saying "Planer" while you are in a plan.
    expect(pageTitleKey('/planer/17')).toBe('nav.plans');
    expect(pageTitleKey('/planer/17/redigera')).toBe('nav.plans');
    expect(pageTitleKey('/students/abc')).toBe('nav.students');
});

test('page-title: matching is on whole segments, not string prefixes', () => {
    // '/malaria' must not be named 'Mål'.
    expect(pageTitleKey('/malaria')).toBeNull();
    expect(pageTitleKey('/homework')).toBeNull();
    expect(pageTitleKey('/libraryish')).toBeNull();
});

test('page-title: public entry and unknown routes are deliberately unnamed', () => {
    // /login and /register carry their own centred wordmark — design system 02
    // allows one display/brand moment per view, and a name in the bar above it
    // would be a second.
    for (const route of PUBLIC_ROUTES) expect(pageTitleKey(route)).toBeNull();
    expect(pageTitleKey('/nonsense')).toBeNull();
    expect(pageTitleKey('/')).toBeNull();
    expect(pageTitleKey('')).toBeNull();
});

test('page-title: it returns a KEY, never resolved copy', () => {
    // The property the locale-switch behaviour rests on. If this ever starts
    // returning Swedish, the title freezes at whatever locale was active when
    // the shell's effect last ran.
    //
    // The pattern used to be /^nav\./, on the assumption that every named route
    // is also a nav destination. `/konto` broke that: Kontoinställningar is
    // reached from the nav FOOTER rather than from one of the four groups (see
    // `nav.component.ts` for why it is not a group entry), so there is no
    // `nav.*` label for the bar to agree with and its name is the page's own
    // title. The requirement being asserted is unchanged — a dotted catalog
    // key, not a rendering of one — so the pattern states that instead of
    // stating where the key happens to live.
    for (const route of TITLED_ROUTES) {
        const key = pageTitleKey(route)!;
        expect(key, `${route} must be named by a key, not by copy`).toMatch(/^[a-z][a-zA-Z]*\.[a-zA-Z.]+$/);
        expect((sv as Record<string, string>)[key], `sv is missing ${key}`).toBeString();
        // The discriminating half: a key is never its own rendering.
        expect(key, `${route} is named with resolved copy`)
            .not.toBe((sv as Record<string, string>)[key]);
    }
});

test('page-title: every key it can produce is translated in both catalogs', () => {
    for (const route of TITLED_ROUTES) {
        const key = pageTitleKey(route)!;
        expect((sv as Record<string, string>)[key], `sv is missing ${key}`).toBeString();
        expect((en as Record<string, string>)[key], `en is missing ${key}`).toBeString();
    }
});
