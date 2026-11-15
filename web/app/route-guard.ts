/**
 * Route admission — INFORMATION_ARCHITECTURE.md 3.17.
 *
 * Two rules, one function: an existing session skips public entry, and a
 * protected view is not reachable without a session.
 *
 * Kept in its own module, free of DOM and of framework imports, for the same
 * reason `nav.structure.ts` is: the decision is the part worth asserting, and it
 * should be assertable without dragging in the app. Importing `app.component.ts`
 * pulls the entire view graph (every shell, every service, `../theme`'s
 * import-time `<style>` write) into the test process just to ask what `/planer`
 * resolves to for a signed-out visitor.
 *
 * Note this is about isolation and cost, NOT about the DOM being unavailable —
 * `bunfig.toml` preloads the framework's happy-dom adapter, so the component
 * modules do import successfully under `bun test`. Tests that genuinely need to
 * mount the shell can; this module exists so that the admission rules do not
 * have to.
 *
 * The rule this file exists to make checkable is IDEMPOTENCE. Every target
 * `guardTarget` can return must itself be a route the guard leaves alone —
 * otherwise a redirect re-triggers the guard and the app bounces forever. That
 * property is not obvious from reading the branches, so `route-guard.test.ts`
 * asserts it exhaustively rather than by example: it applies the guard twice to
 * every route it knows about in both auth states and requires the second pass to
 * be a no-op.
 */

/**
 * Routes reachable WITHOUT a session. Everything else is protected — the guard
 * is deny-by-default, so a route added to the app in future is protected the
 * moment it exists rather than the moment someone remembers to list it here.
 */
export const PUBLIC_ROUTES = ['/login', '/register'] as const;

/**
 * Every protected route base this app resolves — the allow-list `safeReturnTo`
 * validates against, and the reason it can be an allow-list at all.
 *
 * Kept here rather than derived from `app.component.ts`'s swap map because this
 * module is deliberately free of the view graph, and because a security
 * boundary should not be assembled out of whatever happens to be imported
 * somewhere else. `tests/route-guard.dom.test.ts` holds the two in agreement,
 * so a route added to the app without being listed here fails the build rather
 * than silently becoming un-returnable-to.
 */
export const APP_ROUTES = [
    '/home',
    '/inbox',
    '/lektioner',
    '/traningspass',
    '/planer',
    '/mal',
    '/hastar',
    '/veckoschema',
    '/hastlogg',
    '/students',
    '/library',
    '/program',
    '/invitations',
    '/konto',
] as const;

/** Where a signed-in visitor lands when they ask for public entry. */
export const HOME_ROUTE = '/home';

/** Where a signed-out visitor lands when they ask for anything protected. */
export const LOGIN_ROUTE = '/login';

/**
 * Prefix match on whole segments, matching `Router.link`'s notion of "inside
 * this section": `/students` covers `/students/abc` but never `/studentsomething`.
 */
function isUnder(route: string, base: string): boolean {
    return route === base || route.startsWith(base + '/');
}

export function isPublicRoute(route: string): boolean {
    return PUBLIC_ROUTES.some((p) => isUnder(normalize(route), p));
}

/**
 * `stripBase` can hand back an empty string when the app is mounted at a base
 * path and the visitor is sitting exactly on it. That is the origin, i.e. '/'.
 */
function normalize(route: string): string {
    return route === '' ? '/' : route;
}

/**
 * The route this state is allowed to be on, or `null` when the current one is
 * already allowed.
 *
 * `null` rather than "return the same route" is deliberate: the caller has to
 * navigate only when there is something to correct, and a guard that returned
 * the current route on every evaluation would make every route change look like
 * a redirect worth pushing onto history.
 *
 * '/' is treated as public entry rather than as a protected view. It renders the
 * home component via the swap fallback, so leaving it alone would put a signed-in
 * visitor on a home page whose URL is not `/home` — two URLs for one view.
 */
export function guardTarget(route: string, authed: boolean): string | null {
    const path = normalize(route);
    if (authed) {
        // Public entry and the bare origin both resolve to the real home URL.
        return path === '/' || isPublicRoute(path) ? HOME_ROUTE : null;
    }
    return isPublicRoute(path) ? null : LOGIN_ROUTE;
}

/**
 * The route that should actually be RENDERED for a state — the corrected one
 * where the guard has something to say, the current one otherwise.
 *
 * This is what makes the redirect invisible. The view is derived from the guard
 * directly instead of waiting for the guard's navigation to come back around
 * through the router, so the disallowed component is never constructed at all —
 * no login form behind a sidebar, no protected view firing its loads and
 * collecting 401s on the way to being thrown away.
 */
export function guardedView(route: string, authed: boolean): string {
    return guardTarget(route, authed) ?? normalize(route);
}

// ─── Deep-link preservation (`returnTo`) ─────────────────────────────

/**
 * Query parameter carrying the route a signed-out visitor was actually asking
 * for, so that signing in finishes the journey they started instead of dumping
 * them on `/home`.
 */
export const RETURN_TO_PARAM = 'returnTo';

/**
 * THE SECURITY BOUNDARY OF THIS FILE.
 *
 * `returnTo` is a redirect target read out of the URL, which makes it attacker
 * supplied by definition — a link is all it takes. An unvalidated one is an
 * open-redirect: the victim signs in to the real app, on the real domain,
 * having typed real credentials, and is then handed to whatever the link said.
 * That is a credible phishing primitive precisely BECAUSE everything up to the
 * final hop is genuine.
 *
 * So this is an ALLOW-LIST, not a deny-list of bad shapes. The value has to
 * name a route this app actually has; anything else is discarded and the
 * visitor lands on `/home`. A deny-list here would be a losing game — the
 * encodings a browser accepts in a location are not a set anyone enumerates
 * correctly, and every one that is missed is the whole vulnerability. Matching
 * against `APP_ROUTES` inverts that: a bypass would have to BE one of this
 * app's own routes, at which point it is not a bypass.
 *
 * Rejected, and why each one matters:
 *
 *   'https://evil.example'   absolute URL — no leading '/'.
 *   '//evil.example'         protocol-relative. Browsers read this as a host,
 *                            not a path. The classic single-character bypass
 *                            of a naive "must start with /" check, which is
 *                            why that check is not the one being relied on.
 *   '/\\evil.example'        backslash. Normalised to '/' by the URL parser in
 *                            every major engine, so this is '//evil.example'
 *                            wearing a hat.
 *   'javascript:...'         no leading '/'.
 *   '/planer?x=1', '/x#y'    query and fragment smuggling — a route is a path
 *                            here, so both are refused outright rather than
 *                            stripped. Stripping invites a second parse, and
 *                            two parsers that disagree is where these bugs
 *                            live.
 *   '%2F%2Fevil.example'     already decoded once by URLSearchParams. It is NOT
 *                            decoded again — double-decoding is how an
 *                            allow-list gets walked past — so it stays a
 *                            literal, matches no route, and is dropped.
 *   '/home/%2e%2e/%2e%2e/x'  '%2e' IS a dot to the URL parser. See the
 *                            fixed-point rule below — this is the bug class
 *                            that rule exists to close, not a spelling.
 *   '/login', '/register'    in-app, but returning to public entry after
 *                            signing in is a loop back to the form just left.
 *   '/nonsense'              in-app-shaped but not a route this app resolves.
 *
 * Accepted: a known route base, and anything beneath it on whole segments, so
 * that '/planer/17/redigera' survives the round trip intact.
 *
 * THE FIXED-POINT RULE, and why it is not a blacklist.
 *
 * Everything this function decides is decided about a STRING. What eventually
 * reaches the address bar is that string after `history.replaceState` has run
 * the WHATWG URL parser over it — validate-then-transform, and every gap
 * between the two is a bypass. The parser treats '.%2e', '%2e.', '%2e%2e' and
 * every case variation of them as a double-dot segment, so a check that looks
 * for literal '..' passes a value the browser then collapses:
 *
 *   safeReturnTo('/home/%2e%2e/%2e%2e/evil-app/admin')  →  accepted
 *   location.pathname after replaceState                →  '/evil-app/admin'
 *
 * which escapes the app's base path ('/teacher-student/' in production, see
 * `vite.config.ts`) onto sibling paths of the shared host, and leaves
 * `router.route` holding a string the address bar no longer agrees with.
 *
 * The fix is not to add '%2e' to a list of bad spellings. It is to require the
 * value to be a FIXED POINT of the parser: parse it and demand the result be
 * byte-identical to what went in. Anything the parser would rewrite — any
 * encoding of a dot segment, any character it would percent-escape, anything
 * it would truncate at a delimiter — fails, whether or not anyone thought of
 * it. Validation and transformation then cannot disagree, because the accepted
 * set is exactly the set the transformation leaves alone.
 */
/**
 * Whether the URL parser leaves `value` exactly as it found it.
 *
 * The base is an arbitrary opaque origin — nothing about it is used, it only
 * makes `value` resolvable as a relative reference so that `pathname` is the
 * parser's own opinion of the path. The comparison is against the whole input
 * because a value that parses to a *prefix* of itself has had a delimiter
 * eaten, which is the same failure wearing different clothes.
 *
 * Throwing counts as failing: an input the parser will not accept is not one
 * this app hands to `replaceState`.
 */
function isParserFixedPoint(value: string): boolean {
    try {
        return new URL(value, 'https://fixed-point.invalid').pathname === value;
    } catch {
        return false;
    }
}

export function safeReturnTo(value: string | null | undefined): string | null {
    if (typeof value !== 'string' || value === '') return null;
    // Path only. No query, no fragment, no backslash, no whitespace or control
    // characters — checked before anything tries to interpret the value.
    // `\s` is deliberately NOT used for the second class: it misses the C0
    // controls below \t, and a bare NUL or \u0001 sitting in a location is
    // exactly the sort of thing two parsers disagree about.
    if (/[?#\\]/.test(value) || /[\u0000-\u0020\u007f]/.test(value)) return null;
    // A single leading slash. '//host' and 'https://host' both fail here.
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    // Whole non-empty segments, as the doc comment above claims. '/planer/' and
    // '/planer//x' render the same view, so this rejects nothing a visitor
    // loses — but they are not paths this app produces, and an allow-list that
    // quietly admits shapes its own description excludes is one whose
    // description has stopped being evidence of anything.
    //
    // The literal '.' and '..' cases are already covered by the fixed-point
    // check below; they are named here because a reader looking for them
    // should find them where the segment rules are, not have to derive them.
    if (value.slice(1).split('/').some((s) => s === '' || s === '.' || s === '..')) return null;
    // THE FIXED POINT. See the block comment: the value must survive the URL
    // parser unchanged, so that what was validated is what `replaceState` puts
    // in the address bar. This is what closes '%2e' and every other spelling of
    // a dot segment, rather than a list naming them one at a time.
    if (!isParserFixedPoint(value)) return null;
    // Public entry is in-app but is not a destination — see above.
    if (isPublicRoute(value)) return null;
    // The allow-list itself. Everything above only narrows what reaches it.
    return APP_ROUTES.some((base) => isUnder(value, base)) ? value : null;
}

/**
 * `base` with a validated `returnTo` attached, or plain `base` when there is
 * nothing worth returning to.
 *
 * Validating on the way OUT as well as on the way in is not belt-and-braces for
 * its own sake: it keeps a junk route the visitor typed from being reflected
 * back into a link, and it means the parameter is only ever present when it is
 * already known to be honourable.
 */
export function withReturnTo(base: string, route: string): string {
    const target = safeReturnTo(route);
    return target === null
        ? base
        : `${base}?${RETURN_TO_PARAM}=${encodeURIComponent(target)}`;
}

/** The validated `returnTo` in a `?a=b` search string, or null. */
export function returnToFrom(search: string): string | null {
    return safeReturnTo(new URLSearchParams(search).get(RETURN_TO_PARAM));
}

/**
 * Where a successful sign-in or registration should land: the route the visitor
 * was reaching for, or home.
 */
export function postAuthRoute(search: string): string {
    return returnToFrom(search) ?? HOME_ROUTE;
}
