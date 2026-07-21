import { Component, Router, effect, template, type Readable } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { DrawerComponent } from '@basics/core/client/ui/drawer';
import { ToastContainer } from '@basics/core/client/ui/toast';
import { t } from '../i18n';
import { token } from '../theme';
import { s } from '../css';
import { AppService } from './app.service';
import { TopBarComponent } from './top-bar.component';
import { NavComponent } from './nav.component';
import { HomeComponent } from '../home/home.component';
import { LoginComponent } from '../auth/auth.component';
import { RegisterComponent } from '../auth/register.component';
import { InvitationsComponent } from '../invitations/invitations.component';
import { InboxComponent } from '../inbox/inbox.component';
import { InboxService } from '../inbox/inbox.service';
import { StudentsShellComponent } from '../students/students-shell.component';
import { StudentsService } from '../students/students.service';
import { LibraryShellComponent } from '../library/library-shell.component';
import { StableShellComponent } from '../stable/stable-shell.component';
import { LessonsShellComponent } from '../lessons/lessons-shell.component';
import { TrainingSessionsShellComponent } from '../training-sessions/training-sessions-shell.component';
import { TeachersService } from '../training-sessions/teachers.service';
import { ProgramsShellComponent } from '../programs/programs-shell.component';
import { PlansShellComponent } from '../plans/plans-shell.component';
import { GoalsShellComponent } from '../goals/goals-shell.component';
import { guardTarget, guardedView, withReturnTo, LOGIN_ROUTE } from './route-guard';
import { pageTitleKey } from './page-title';

/** UI_DECISIONS.md 6: below this the sidebar becomes a drawer. */
const LG = 1024;

/**
 * Every route the shell resolves. A module-level const rather than an object
 * literal inside `render()` so the set is READABLE — `page-title.dom.test.ts`
 * imports it and requires every protected destination here to have a name in
 * `page-title.ts`, which is what stops a route added later from shipping with
 * an empty top bar. Nothing else about the swap changes.
 */
export const ROUTE_COMPONENTS = {
    '/home': HomeComponent,
    '/login': LoginComponent,
    '/register': RegisterComponent,
    '/invitations': InvitationsComponent,
    '/inbox': InboxComponent,
    '/students': StudentsShellComponent,
    '/library': LibraryShellComponent,
    '/hastar': StableShellComponent,
    '/lektioner': LessonsShellComponent,
    '/traningspass': TrainingSessionsShellComponent,
    '/program': ProgramsShellComponent,
    '/planer': PlansShellComponent,
    '/mal': GoalsShellComponent,
};

const tpl = template(`
    <div bind="layout" class="app-layout">
        <div bind="topBar" class="app-layout__top"></div>
        <div bind="nav" class="app-layout__nav"></div>
        <div class="app-layout__content">
            <div bind="content" class="app-layout__inner"></div>
        </div>
    </div>
    <div bind="drawer" id="app-nav-drawer"></div>
    <div bind="toasts"></div>
`);

export class AppComponent extends Component {
    static styles = `
        .app-layout {
            display: grid;
            grid-template: auto 1fr / 1fr;
            height: 100vh;
            background: ${token('bg')};

            & .app-layout__top {
                grid-column: 1 / -1;
            }

            /* Below lg the sidebar is not rendered at all — its content lives in
               the drawer instead. A horizontal scroller of nine links is not
               navigable and would flatten the grouping. */
            & .app-layout__nav {
                display: none;
            }

            & .app-layout__content {
                overflow-y: auto;
                padding: ${s('xl')} ${s('lg')};
            }

            & .app-layout__inner {
                max-width: 1100px;
                margin: 0 auto;

                /* Long-form measure stays readable at every viewport. */
                & p { max-width: 68ch; }

                /* Design system 02: page titles (28/36) and section headings
                   (20/28) are the only place the serif is allowed to run.
                   ONLY EVER WEIGHT 500 — see UI_DECISIONS.md 3: a single static
                   Lora cut ships, so 600 resolves to it with synthetic bold,
                   which is precisely the faked bold the spec forbids. */
                & h1, & h2 {
                    font-family: ${token('font-display')};
                    font-weight: 500;
                }
                & h1 { font-size: 1.75rem; line-height: 36px; }
                & h2 { font-size: 1.25rem; line-height: 28px; }
            }

            @media (min-width: ${LG}px) {
                grid-template: auto 1fr / 240px 1fr;

                & .app-layout__nav {
                    display: block;
                    overflow-y: auto;
                    /* The nav paints its own surface, but it is only as tall as
                       its links — the column carries the surface to the floor. */
                    background: ${token('surface')};
                    border-right: 1px solid ${token('border')};
                }

                & .app-layout__content {
                    padding: ${s('xl')} ${s('2xl')};
                }
            }
        }

        /* The drawer only exists below lg. Closing it on the breakpoint change is
           handled in script, which is what also releases the scroll lock; this
           rule is the belt-and-braces so a drawer can never sit over a sidebar.
           It is NOT sufficient on its own: display:none hides the panel but
           leaves navOpen true, so the keydown trap stays armed and the overlay's
           body scroll-lock stays engaged. handleKeydown carries the matching
           guard. */
        @media (min-width: ${LG}px) {
            #app-nav-drawer { display: none; }
        }

        /* Signed out there is nothing to navigate to: /login and /register are
           the only reachable routes, so presenting nine links a visitor cannot
           follow is noise. The selectors deliberately out-specify the rules
           above (0,3,0 and 1,1,0) so cascade order cannot matter.

           The wordmark goes with them. Design system 02 allows exactly ONE
           display/versal brand moment per view, and /login and /register spend
           it on their own centred mark — the shell wordmark sitting above it is
           a second one, and two wordmarks in a view is the failure the rule
           exists to prevent. That leaves the top bar in its minimal state:
           theme toggle only. The toggle stays because it works signed out and
           a visitor arriving at night should be able to turn the lights down;
           sign-out is already absent, its button being :empty without a user. */
        .app-layout.app-layout--anon .app-layout__nav,
        .app-layout.app-layout--anon .top-bar__menu,
        .app-layout.app-layout--anon .top-bar__logo {
            display: none;
        }
        #app-nav-drawer.app-nav-drawer--anon {
            display: none;
        }

        /* Signed out there is exactly one composition on screen and the whole
           content area belongs to it, so /login and /register centre in the
           viewport instead of hanging from the top edge of a 1400px column.
           This lives at the shell because only the shell knows the content area
           is a grid item with a resolved height — the views inside it have no
           height to centre against.

           The "safe" keyword is load-bearing, not decoration: plain centring
           overflows equally in BOTH directions, so on a short viewport (a phone
           in landscape, or the register form at 375px) the top of the card
           would be pushed above the scroll origin and become unreachable.
           Safe alignment falls back to start exactly in that case. */
        /* THE root cause of the stranded login column. Above lg the shell is
           240px + 1fr, and the sidebar is the thing that occupies the 240px
           track. Signed out the sidebar is display:none — so it generates no
           box, does not take a cell, and the content area auto-places into
           column 1 and is laid out 240px wide on a 1280px screen. Every
           signed-out view was being squeezed into the width of a navigation
           rail that is not even rendered. With no sidebar there is no reason
           for a sidebar track, so the anon shell is a single column. */
        .app-layout.app-layout--anon {
            grid-template-columns: minmax(0, 1fr);
        }

        .app-layout.app-layout--anon .app-layout__content {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            align-content: safe center;
        }
        /* The inner wrapper centres itself with auto inline margins, which is
           correct while it is a BLOCK box but wrong the moment it becomes a grid
           item: auto margins in the inline axis absorb the free space and the
           item falls back to shrink-to-fit, which is what pins the panel into a
           narrow strip on the left and overflows the row. So under --anon the
           auto margins are dropped and the grid does the centring instead —
           width:100% fills the 1fr track, max-width:1100px still caps it, and
           justify-self centres what is left over. */
        .app-layout.app-layout--anon .app-layout__inner {
            margin-inline: 0;
            justify-self: center;
            width: 100%;
        }
    `;

    private router = this.inject(Router);
    private app = this.inject(AppService);
    private auth = this.inject(AuthService);
    private inbox = this.inject(InboxService);
    private students = this.inject(StudentsService);
    private teachers = this.inject(TeachersService);

    /** The drawer's own panel element, needed for focus containment. */
    private panel: HTMLElement | null = null;
    /** Live above lg. The drawer is only a drawer while this is false. */
    private wide = window.matchMedia(`(min-width: ${LG}px)`);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});

        this.spawn(TopBarComponent, this.ref(frag, 'topBar'));
        this.spawn(NavComponent, this.ref(frag, 'nav'));
        // One toast host for the whole app (design system §4.12). It lives at
        // the shell so a toast survives the route change that often follows the
        // action that raised it — an undo offered on a view you have already
        // left is not an undo.
        this.spawn(ToastContainer, this.ref(frag, 'toasts'));

        const layout = this.ref(frag, 'layout');
        const drawerHost = this.ref(frag, 'drawer');

        // Signed out, the shell presents no navigation — and an open drawer can
        // never survive a sign-out.
        this.track(effect(() => {
            const anon = !this.auth.currentUser.get();
            layout.classList.toggle('app-layout--anon', anon);
            drawerHost.classList.toggle('app-nav-drawer--anon', anon);
            if (anon) this.app.navOpen.set(false);
        }));

        this.spawn(DrawerComponent, drawerHost, {
            open: this.app.navOpen,
            side: 'left',
            width: '280px',
            content: (host, ctx) => {
                ctx.spawn(NavComponent, host, { onNavigate: () => this.app.navOpen.set(false) });
            },
        });
        this.panel = drawerHost.querySelector<HTMLElement>('.ui-drawer');
        this.panel?.setAttribute('role', 'dialog');
        this.panel?.setAttribute('aria-modal', 'true');
        this.track(effect(() => this.panel?.setAttribute('aria-label', t('nav.label'))));

        // IA 3.17: an existing session skips public entry, and a protected view
        // is not reachable without one. This has to be REACTIVE, not a check at
        // boot: the route moves under Back/Forward and under any programmatic
        // navigate, and the session can end mid-visit (sign-out, an expired
        // cookie, a 401 from any API call clearing `currentUser`). Both inputs
        // are signals, so both are dependencies.
        //
        // Two halves, deliberately separate, because they answer two different
        // questions and only one of them is allowed to be late.
        //
        // WHAT IS RENDERED is derived, not corrected. `view` is a plain
        // `Readable` rather than a `Computed` so that it recomputes at READ
        // time, inside whatever effect is reading it — here, the swap's own.
        // That is what removes the flash of the wrong view, and it removes it
        // structurally rather than by winning a race: the swap asks "what may I
        // show?" and gets the answer, so the disallowed component is never
        // constructed. No login form behind a 240px sidebar, and no protected
        // shell firing its loads and collecting 401s on the way to being
        // discarded. It also means the swap subscribes to `currentUser` as well
        // as to `route`, which is what re-renders the view on sign-out without
        // waiting for the navigation below to land.
        //
        // DO NOT "improve" this into a `Computed`. The reason is lifecycle, NOT
        // staleness — a Computed would in fact read correctly here, so the
        // tempting argument for changing it and the tempting argument against
        // are both wrong, and it is worth being precise about which is which.
        //
        // Why a Computed is NOT stale: it would be the only thing the swap
        // subscribes to (the swap would no longer touch `route` directly), and
        // `Computed`'s subscriber recomputes and then synchronously notifies its
        // own subscribers before returning (core.ts `Computed.run`). So the swap
        // can only ever be woken AFTER the recompute. There is no interleaving
        // that paints a stale value.
        //
        // Why a plain object anyway: a `Computed` subscribes on construction and
        // the framework gives it no disposer — its subscriber stays in
        // `route.subs` and `currentUser.subs` for the life of the page. This
        // `render()` runs more than once (HMR dispose/remount, and `startApp`'s
        // `/_obs` toggle destroys and rebuilds the root), so each rebuild would
        // strand another live subscriber recomputing against a destroyed shell.
        // A plain object holds no subscription at all, so there is nothing to
        // leak and nothing to remember to dispose.
        //
        // The price, so it is not rediscovered as a bug: no memoisation. On a
        // guard-corrected transition the swap renders the destination TWICE —
        // once when `currentUser` changes, once when the navigate below moves
        // `route` to a value that maps to the same view. Verified on sign-in and
        // sign-out. It is wasted DOM work, not a wrong view, and it costs no
        // extra requests (the services behind the views are DI singletons).
        const view: Readable<string> = {
            get: () => guardedView(this.router.route.get(), !!this.auth.currentUser.get()),
        };

        // WHERE THE URL POINTS is corrected, and it is allowed to be late —
        // nothing is painted from it. Replace-navigation, never push: these are
        // bounces, not destinations. Pushing would fill history with entries
        // that immediately bounce again, which is precisely how a Back button
        // stops working.
        //
        // Loop-safe by construction rather than by a re-entrancy guard: every
        // target `guardTarget` returns is itself a fixed point, so the re-run
        // this navigate triggers returns null and the cascade stops. Asserted
        // exhaustively in tests/route-guard.test.ts.
        //
        // The bounce to /login carries WHERE THE VISITOR WAS GOING with it, as
        // a validated `?returnTo=`. Without it the destination is simply lost:
        // a signed-out visitor opening /planer signs in and lands on /home,
        // having been silently redirected twice and delivered somewhere they
        // did not ask for. `withReturnTo` re-validates the route through
        // `safeReturnTo`, so a route the visitor typed but the app does not
        // have is dropped here rather than reflected into a link.
        //
        // Attaching it does not disturb the guard: `Router.navigate` splits the
        // query off and sets `route` to '/login', so `guardTarget` still sees a
        // fixed point on the next pass and the cascade still stops.
        this.track(effect(() => {
            const route = this.router.route.get();
            const target = guardTarget(route, !!this.auth.currentUser.get());
            if (!target) return;
            this.router.navigate(
                target === LOGIN_ROUTE ? withReturnTo(target, route) : target,
                true,
            );
        }));

        // The page name in the top bar. Derived from `guardedView`, NOT from
        // `router.route`, so the bar names the view that is actually mounted —
        // during a guard correction the route still says `/planer` for an
        // instant while the login form is what is on screen, and a title read
        // from the route would announce a page the visitor cannot see.
        //
        // Centralised here rather than left to each view to set for itself.
        // Per-view titling is the version that rots: a destination added later
        // silently inherits whatever the last page set, and the bug shows up as
        // a stale title rather than as a missing one, so nothing catches it.
        // One effect over one table cannot drift, and `page-title.dom.test.ts`
        // checks that table against `ROUTE_COMPONENTS` so a new route fails the
        // build instead of shipping unnamed.
        //
        // What is stored is the KEY, so this effect depends on the route and the
        // session and on nothing else. See `page-title.ts` for the reasoning —
        // and note what it is NOT: resolving `t()` in here would not freeze the
        // title, because effects auto-track and reading `t()` would subscribe
        // this effect to the locale signal too. It would work; it would just
        // mean the shell had opinions about language for no reason, and the
        // signal carried a rendering where a fact belongs.
        this.track(effect(() => {
            this.app.titleKey.set(pageTitleKey(view.get()));
        }));

        this.$swap(this.ref(frag, 'content'), view, ROUTE_COMPONENTS, HomeComponent);

        return frag;
    }

    onMount(): void {
        // Shell-level prefetches. They live here rather than in NavComponent
        // because that component is instantiated twice (sidebar + drawer) and
        // would otherwise fetch everything twice.
        void this.inbox.load();
        void this.students.load();
        void this.teachers.load();

        // The drawer panel stays in the DOM when closed, translated off-screen.
        // Without `inert` its nine links remain tabbable behind the page — and
        // above lg, where the drawer is never used at all.
        this.track(effect(() => {
            const open = this.app.navOpen.get();
            this.panel?.toggleAttribute('inert', !open);
            if (open) this.focusFirstLink();
        }));

        const onKeydown = (e: KeyboardEvent) => this.handleKeydown(e);
        document.addEventListener('keydown', onKeydown);
        this.track(() => document.removeEventListener('keydown', onKeydown));

        // A link click inside the drawer closes it via `onNavigate`, but that is
        // not the only way the route moves: Back/Forward, and any programmatic
        // `router.navigate`, would otherwise leave the drawer sitting over the
        // page it just navigated to, still scroll-locked. Closing on the route
        // itself covers every path, `onNavigate` included.
        let lastRoute = this.router.route.get();
        this.track(effect(() => {
            const route = this.router.route.get();
            if (route !== lastRoute) this.app.navOpen.set(false);
            lastRoute = route;
        }));

        // Crossing up into the persistent sidebar leaves an open drawer stranded.
        const onChange = () => { if (this.wide.matches) this.app.navOpen.set(false); };
        this.wide.addEventListener('change', onChange);
        this.track(() => this.wide.removeEventListener('change', onChange));
    }

    private focusFirstLink(): void {
        // The panel animates in; focus on the next frame so the browser does not
        // scroll a still-off-screen element into view.
        requestAnimationFrame(() => this.panel?.querySelector('a')?.focus());
    }

    /** Escape closes; Tab cycles inside the panel while it is open. */
    private handleKeydown(e: KeyboardEvent): void {
        if (!this.app.navOpen.get() || !this.panel) return;
        // Above lg the panel is display:none, so it holds no focusable links and
        // is not a dialog. Trapping against it there swallows Escape and pins
        // Shift+Tab on whatever has focus — for the whole document. The state is
        // meant to be impossible (the `change` listener closes the drawer on the
        // way up), but a trap that depends on an event having fired is not a
        // trap worth having.
        if (this.wide.matches) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.app.navOpen.set(false);
            return;
        }
        if (e.key !== 'Tab') return;

        const links = [...this.panel.querySelectorAll<HTMLElement>('a')];
        const first = links[0];
        const last = links[links.length - 1];
        if (!first || !last) return;

        const active = document.activeElement;
        if (e.shiftKey && (active === first || !this.panel.contains(active))) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    }
}
