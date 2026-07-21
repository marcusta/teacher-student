/**
 * The `/program` → `/library?flik=program` forward, asserted at the level that
 * actually matters: COMPONENT CONSTRUCTION.
 *
 * `programs-shell.component.ts` claims a `$swap` branch is required instead of a
 * redirect effect, because `$swap` picks a branch before a redirect could run —
 * so routing `/program` at the builder would mount `ProgramDetailComponent` with
 * an EMPTY id, fire `GET /programs/` and flash a not-found state on the way out.
 *
 * That claim has a second half nobody states: the forward navigates to
 * `/library`, which invalidates the shell's OWN key computed at the same moment
 * it invalidates the app-level one. `ProgramsShellComponent.key` falls through
 * to `'detail'` for any route that is not `/program` or `/program/nytt` — so if
 * the shell's swap were to re-run before the app-level swap destroyed it, the
 * builder would be constructed with `route.split('/')[2] === undefined` after
 * all. Counting `render()` calls is what settles it.
 */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { EMPTY_DASHBOARD_JSON, isDashboardUrl } from './dashboard-stub';

const realFetch = globalThis.fetch;
const requested: string[] = [];
beforeAll(() => {
    globalThis.fetch = (async (input: unknown) => {
        const url = String((input as { url?: string })?.url ?? input);
        requested.push(url);
        // The dashboard is view-shaped, not a collection — see `dashboard-stub.ts`.
        const body = isDashboardUrl(url) ? EMPTY_DASHBOARD_JSON : '[]';
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; });

const { ProgramDetailComponent } = await import('../web/programs/program-detail.component');
const { ProgramCreateComponent } = await import('../web/programs/program-create.component');
const { LibraryComponent } = await import('../web/library/library.component');
const { ExerciseDetailComponent } = await import('../web/library/exercise-detail.component');
const { AppComponent } = await import('../web/app/app.component');

const rendered: string[] = [];
function record(name: string, Ctor: { prototype: { render: () => unknown } }): void {
    const original = Ctor.prototype.render;
    Ctor.prototype.render = function (this: unknown, ...args: unknown[]) {
        rendered.push(name);
        return (original as (...a: unknown[]) => unknown).apply(this, args);
    };
}
record('ProgramDetail', ProgramDetailComponent as never);
record('ProgramCreate', ProgramCreateComponent as never);
record('Library', LibraryComponent as never);
record('ExerciseDetail', ExerciseDetailComponent as never);

const USER = { id: 'u1', username: 'anna' };

function mountAt(route: string, search = '') {
    di.reset();
    const router = di.get(Router);
    const auth = di.get(AuthService);
    router.route.set(route);
    router.search.set(search);
    auth.currentUser.set(USER);
    rendered.length = 0;
    requested.length = 0;

    document.body.innerHTML = '<div id="app"></div>';
    const app = new AppComponent();
    app.mount(document.getElementById('app') as HTMLElement);
    return { app, router };
}

test('the bare /program address forwards to the Bibliotek Program tab', () => {
    const { app, router } = mountAt('/program');
    expect(router.route.get()).toBe('/library');
    expect(router.search.get()).toBe('?flik=program');
    app.destroy();
});

test('the forward never constructs the builder — not even for one synchronous tick', () => {
    const { app } = mountAt('/program');
    // Not "the builder was torn down quickly" — it was never built. A single
    // construction would have fired GET /programs/ with an empty id.
    expect(rendered).not.toContain('ProgramDetail');
    expect(rendered).toContain('Library');
    app.destroy();
});

test('the forward issues no request for a Program with an empty id', () => {
    const { app } = mountAt('/program');
    // `GET /api/programs` (the list, for the Program tab) is expected and
    // correct. `GET /api/programs/` — the trailing slash of an interpolated
    // empty id — is the fingerprint of a builder that should never have been
    // built, and is what this asserts is absent.
    const stray = requested.filter((u) => /\/api\/programs\/(\?|$)/.test(u));
    expect(stray).toEqual([]);
    expect(requested.some((u) => /\/api\/programs(\?|$)/.test(u))).toBe(true);
    app.destroy();
});

test('bookmarks survive: /program/nytt and /program/:id resolve unchanged', () => {
    const create = mountAt('/program/nytt');
    expect(create.router.route.get()).toBe('/program/nytt');
    expect(rendered).toContain('ProgramCreate');
    expect(rendered).not.toContain('ProgramDetail');
    create.app.destroy();

    const detail = mountAt('/program/p1');
    // Untouched by the forward — the route still resolves to the builder.
    expect(detail.router.route.get()).toBe('/program/p1');
    expect(rendered).toContain('ProgramDetail');
    detail.app.destroy();
});

test('the forward is a fixed point — /library?flik=program does not bounce again', () => {
    const { app, router } = mountAt('/library', '?flik=program');
    expect(router.route.get()).toBe('/library');
    expect(router.search.get()).toBe('?flik=program');
    expect(rendered).toContain('Library');
    expect(rendered).not.toContain('ProgramDetail');
    app.destroy();
});

/**
 * `LibraryShellComponent` carried the same `else → detail` fall-through, and it
 * was hardened the same way — but honestly: this is a GUARD, not a reproduced
 * defect. Reverting that fall-through leaves this test passing.
 *
 * The difference is re-entrancy. On the Program side the navigate happens inside
 * `ProgramListRedirectComponent.onMount`, i.e. *during* the app-level `$swap`
 * effect's own run, so the shell's key is recomputed before the parent's
 * disposal lands. A plain navigation away from `/library` has no such re-entrant
 * write: the parent destroys the shell first and the key never runs again. The
 * hazard is therefore one re-entrant navigate away — which is exactly what the
 * Program side just demonstrated — so the branch is matched positively here too.
 */
test('leaving Bibliotek never constructs the Exercise detail on the way out', () => {
    const { app, router } = mountAt('/library');
    expect(rendered).toContain('Library');
    rendered.length = 0;
    requested.length = 0;

    router.route.set('/home');

    expect(rendered).not.toContain('ExerciseDetail');
    const stray = requested.filter((u) => /\/api\/exercises\/(\?|$)/.test(u));
    expect(stray).toEqual([]);
    app.destroy();
});
