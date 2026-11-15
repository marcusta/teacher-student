/**
 * What the top bar calls the page you are on.
 *
 * Kept in its own DOM-free module for the reason `route-guard.ts` states: the
 * mapping is the part worth asserting, and asserting it should not drag the
 * whole view graph (and `../theme`'s import-time `<style>` write) into the test
 * process.
 *
 * THIS RETURNS A KEY, NEVER A STRING — and the honest reason is separation of
 * concerns, NOT a reactivity bug.
 *
 * An earlier version of this comment claimed that resolving upstream would
 * freeze the title in whatever locale was active at the time. That is false in
 * this framework, and believing it cost a round of tests that only appeared to
 * check something. `effect()` here auto-tracks: calling `t()` anywhere inside an
 * effect subscribes that effect to the locale signal, so a shell effect that
 * resolved the string would re-run on `setLocale` and the title would update
 * correctly. The trap this file was written to avoid does not exist.
 *
 * What is actually true, and is reason enough:
 *
 *   - A key is locale-independent data. The signal between here and the top bar
 *     then carries a FACT ("this page is the plans page"), not a rendering of
 *     one, and the two ends can be reasoned about separately.
 *   - The shell would otherwise have to know about the locale to name a page.
 *     It has no other reason to import `t`, and the route→name mapping has no
 *     other reason to care what language anyone reads.
 *   - Resolution stays in one place: the top bar's `() => t(...)` binding,
 *     alongside every other string it renders. One rule for copy, not two.
 *   - It is what makes this module testable without a DOM or an i18n catalog —
 *     the mapping is assertable as data.
 *
 * The design is unchanged. Only the justification is, because a design defended
 * by a bug that is not real is a design nobody can evaluate.
 *
 * The keys are deliberately the SAME ones the sidebar renders. The bar and the
 * highlighted nav link are two indicators of one fact and must never word it
 * differently.
 *
 * They are also both OPTIONAL, which is worth stating because an earlier
 * version of this comment argued the opposite — that below 1024px, with the
 * sidebar gone, the bar was "the only page indicator" left. It never was. The
 * sidebar highlight says where you are in the NAV; the page's own <h1> says
 * what the page IS, and every routed destination renders one. So the title
 * this module names is a redundant, secondary cue in every viewport, and the
 * top bar drops it below 640px where it cannot render legibly at all (see
 * `top-bar.component.ts` for the measurements). This mapping stays complete
 * regardless: it is the answer to "what is this page called", and the bar
 * decides for itself when there is room to ask.
 */

/**
 * Route base → label key, longest-match-wins by whole segments so detail routes
 * inherit their section's name: `/planer/17/redigera` is still "Planer".
 *
 * `/program` and `/invitations` are here despite having left the navigation
 * (INFORMATION_ARCHITECTURE.md 1). Both routes still resolve, so both still
 * need naming — and `nav.programs` / `nav.invitations` would otherwise be
 * catalog entries nothing reads.
 */
const PAGE_TITLES: Readonly<Record<string, string>> = {
    '/home': 'nav.home',
    '/inbox': 'nav.inbox',
    '/lektioner': 'nav.lessons',
    '/traningspass': 'nav.trainingSessions',
    '/planer': 'nav.plans',
    '/mal': 'nav.goals',
    '/hastar': 'nav.stable',
    '/veckoschema': 'nav.weeklySchedule',
    '/hastlogg': 'nav.horseLog',
    '/students': 'nav.students',
    '/library': 'nav.library',
    '/program': 'nav.programs',
    '/invitations': 'nav.invitations',
};

/**
 * Every route base this module names, LONGEST FIRST.
 *
 * The order is the longest-match rule, not a cosmetic sort. `pageTitleKey`
 * returns the first base that matches, so with declaration order a future
 * `/program` + `/program/arkiv` pair would resolve by whichever was typed into
 * the object first — silently, and correctly today only by luck, since no such
 * pair exists yet. Sorting here makes the promise the doc comment above makes
 * true by construction instead of by the absence of a counterexample.
 *
 * Held against `APP_ROUTES` in the tests, in BOTH directions: a route the app
 * has and this table does not is an unnamed page, and a base in this table that
 * the app does not have is a name for nothing.
 */
export const TITLED_ROUTES: readonly string[] = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length);

/**
 * The i18n key naming `route`, or `null` when the route has no name to show.
 *
 * `null` rather than an empty key so the caller can tell "no title" from "a key
 * that resolves to nothing", and so `t()` is never handed '' (which would log a
 * missing-key warning on every public view).
 *
 * /login and /register return null on purpose: signed out the bar is in its
 * minimal state and those views carry their own centred wordmark, which design
 * system 02 makes the one display/brand moment they are allowed. A second name
 * for the same page in the bar above it is the duplication that rule exists to
 * prevent.
 */
export function pageTitleKey(route: string): string | null {
    const path = route === '' ? '/' : route;
    for (const base of TITLED_ROUTES) {
        if (path === base || path.startsWith(base + '/')) return PAGE_TITLES[base]!;
    }
    return null;
}
