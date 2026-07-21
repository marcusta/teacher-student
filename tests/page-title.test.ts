import { test, expect } from 'bun:test';
import { pageTitleKey, TITLED_ROUTES } from '../web/app/page-title';
import { APP_ROUTES, PUBLIC_ROUTES } from '../web/app/route-guard';
import { NAV_GROUPS } from '../web/app/nav.structure';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

test('page-title: every nav destination has a name', () => {
    // The bar and the sidebar highlight are two indicators of one fact. A nav
    // link the bar cannot name is a page that looks unnamed below 1024px, where
    // the sidebar is not rendered and the bar is the only indicator left.
    for (const path of NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path))) {
        expect(pageTitleKey(path), `${path} has no title`).not.toBeNull();
    }
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
    for (const route of TITLED_ROUTES) {
        const key = pageTitleKey(route)!;
        expect(key).toMatch(/^nav\./);
        expect((sv as Record<string, string>)[key], `sv is missing ${key}`).toBeString();
    }
});

test('page-title: every key it can produce is translated in both catalogs', () => {
    for (const route of TITLED_ROUTES) {
        const key = pageTitleKey(route)!;
        expect((sv as Record<string, string>)[key], `sv is missing ${key}`).toBeString();
        expect((en as Record<string, string>)[key], `en is missing ${key}`).toBeString();
    }
});
