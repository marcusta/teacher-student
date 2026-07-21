import { Component, Router, Theme, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../i18n';
import { token } from '../theme';
import { s } from '../css';
import { AppService } from './app.service';

const tpl = template(`
    <header class="top-bar">
        <button bind="menu" class="top-bar__menu" type="button" aria-controls="app-nav-drawer">
            <span class="top-bar__menu-glyph" aria-hidden="true">≡</span>
        </button>
        <span bind="logo" class="top-bar__logo"></span>
        <span bind="title" class="top-bar__title"></span>
        <button bind="theme" class="top-bar__theme" type="button">
            <span bind="themeGlyph" class="top-bar__theme-glyph" aria-hidden="true"></span>
            <span bind="themeLabel"></span>
        </button>
        <button bind="logout" class="top-bar__logout" type="button"></button>
    </header>
`);

export class TopBarComponent extends Component {
    static styles = `
        .top-bar {
            display: flex;
            /* The bar is 48px and one line at every viewport at the default text
               size — measured, not assumed. It is allowed to wrap and grow ONLY
               under text zoom: at 320px with the root font-size at 20px the two
               pills alone are wider than the viewport, and a nowrap row there
               widened the grid track and put a horizontal scrollbar on every
               page in the app. Reflowing to a second line is the degradation
               WCAG 1.4.4/1.4.10 asks for; scrolling the whole document
               sideways is the one it forbids. */
            flex-wrap: wrap;
            align-items: center;
            gap: ${s('sm')} ${s('lg')};
            /* min-height, not height: a fixed height cannot contain a second row
               and would overlap the page instead. */
            padding: ${s('xs')} ${s('xl')};
            min-height: 48px;
            background: ${token('surface')};
            border-bottom: 1px solid ${token('border')};
            color: ${token('text')};

            & .top-bar__logo {
                font-weight: 700;
                font-size: 0.875rem;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                white-space: nowrap;
                color: ${token('text-muted')};
            }

            /* Measured, not estimated: "LINDGREN EQUESTRIAN" is 178px set at
               0.875rem/uppercase/.05em, and a phone bar has 253px of its 327px
               of content width already spoken for by the menu trigger (32),
               the theme pill (97), the sign-out pill (76) and the gaps. The
               wordmark overflows by 120px at 375px and by 165px at 320px — it
               does not fit at ANY type size that is still legible, and a
               shorter mark does not close a gap that large either. It returns
               at the 640px breakpoint, where it fits with room to spare.
               Dropping it is the only option the arithmetic leaves; the tab
               title and the /login and /register wordmarks carry the name. */
            @media (max-width: 639px) {
                & .top-bar__logo { display: none; }
            }

            /* The page name. Takes the slack in the row, which is what it was
               already doing as an empty spacer — the difference is that it now
               says something.

               min-width:0 and the ellipsis are load-bearing, not polish. A flex
               item's default min-width is auto, i.e. it refuses to shrink below
               its text, and the bar's own measurements (see the wordmark note
               above) leave no spare room at 320px. Without these a long name
               would push the row wider than the viewport and put a horizontal
               scrollbar on every page — the exact WCAG 1.4.10 failure the
               flex-wrap rule above exists to avoid. Allowed to shrink to
               nothing, it can only ever give space back.

               They are still needed at >=640px, where the title DOES render:
               "Träningspass" against a narrow 640px bar is the case that would
               otherwise widen the row. */
            & .top-bar__title {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-family: ${token('font-ui')};
                font-size: 0.875rem;
                font-weight: 600;
                color: ${token('text')};
            }

            /* Below 640px the title is not shortened, it is DELETED — and the
               reason is arithmetic, not taste.

               "Allowed to shrink to nothing" is exactly what happens here.
               Measured across 18 viewport x root-font-size x locale
               combinations, the title is clipped in 17 of them; the single
               exception (414px / 16px / sv) fits by 0.3px. At 320px/16px the
               track resolves to 17.7px — one glyph and an ellipsis. At
               375px/20px it is 6.3px, which is not even that. A name rendered
               as "T…" is not a shorter name, it is noise occupying the row.

               This does NOT leave the page unnamed, and the older justification
               that said it would ("below 1024px the sidebar is gone, so the bar
               is the only page indicator") was simply wrong on the facts. The
               sidebar highlight indicates position in the NAV; the page's own
               <h1> names the PAGE, and on a phone that <h1> is the first thing
               under the bar. Every routed destination renders one: most render
               it directly, and the four detail views render it through
               DetailHeaderComponent, whose headingLevel defaults to 1.
               (/inbox and /invitations were the two exceptions and titled
               themselves <h2>; both were promoted to <h1> alongside this
               change, precisely because this rule depends on the claim.
               page-title.dom.test.ts now pins it for every route.)

               So the bar's title is redundant everywhere and illegible here. It
               is kept at >=640px, where it fits with room to spare and earns
               its place as a second, persistent orientation cue that survives
               scrolling the <h1> off screen. */
            @media (max-width: 639px) {
                & .top-bar__title { display: none; }
                /* The title was also the row's spacer — it is the flex:1 item
                   that pushes the two pills to the trailing edge. Removing it
                   would collapse them leftwards against the menu trigger, so
                   the spacing moves to the first pill rather than disappearing
                   with the element that happened to be providing it. */
                & .top-bar__theme { margin-left: auto; }
            }

            & .top-bar__menu {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                margin-left: -${s('sm')};
                padding: 0;
                border: 1px solid ${token('border-strong')};
                border-radius: ${token('radius-sm')};
                background: ${token('surface-2')};
                color: ${token('text')};
                /* A <button> does not inherit the document face — the UA sheet
                   sets its own (Arial). Design system 02: Open Sans does all the
                   work in controls, and the serif is forbidden here outright, so
                   the face is named rather than left to the UA. */
                font-family: ${token('font-ui')};
                cursor: pointer;
                transition: background ${token('dur-fast')} ${token('ease-standard')};

                &:hover { background: ${token('accent-soft')}; }
                &:focus-visible {
                    outline: 2px solid ${token('accent')};
                    outline-offset: 2px;
                }
            }

            & .top-bar__menu-glyph {
                font-size: 1.125rem;
                line-height: 1;
            }

            & .top-bar__theme, & .top-bar__logout {
                display: inline-flex;
                align-items: center;
                gap: ${s('xs')};
                padding: ${s('xs')} ${s('md')};
                /* Both labels are two words in Swedish ("Ljust läge", "Logga
                   ut"). Allowed to break they wrap INSIDE the pill, which reads
                   as two pills. The bar itself wraps instead — see the
                   flex-wrap note above — so this cannot trap the overflow. */
                white-space: nowrap;
                border: 1px solid ${token('border-strong')};
                border-radius: ${token('radius-pill')};
                background: ${token('surface-2')};
                color: ${token('text')};
                font-family: ${token('font-ui')};
                font-size: 0.8rem;
                cursor: pointer;
                transition: background ${token('dur-fast')} ${token('ease-standard')};

                &:hover { background: ${token('accent-soft')}; }
                &:focus-visible {
                    outline: 2px solid ${token('accent')};
                    outline-offset: 2px;
                }
            }

            /* :empty is the signed-out test for the sign-out button, so the
               button must stay a single text node — the glyph/label split below
               is the theme toggle's alone. */
            & .top-bar__logout:empty { display: none; }

            /* The trigger exists only where the sidebar has collapsed. */
            @media (min-width: 1024px) {
                & .top-bar__menu { display: none; }
            }
        }
    `;

    private app = this.inject(AppService);
    private auth = this.inject(AuthService);
    private theme = this.inject(Theme);
    private router = this.inject(Router);

    private menu!: HTMLElement;

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            menu: {
                onclick: () => this.app.navOpen.update(open => !open),
                // The glyph is decorative, so the name has to come from the label.
                'aria-label': () => t('nav.openMenu'),
                'aria-expanded': () => String(this.app.navOpen.get()),
            },
            // The wordmark is the repeating shell mark, not the display/versal
            // brand moment \u2014 design system 02 allows one of those per view and
            // /login and /register spend it on their own mark. So this stays in
            // --font-ui, and the anon shell hides it outright.
            logo: () => t('app.brand'),
            // Resolved HERE, inside the binding, rather than upstream where the
            // signal is written. `t()` reads the active-locale signal, so this
            // binding is a subscriber of it and the title re-renders on a
            // locale switch like every other string in the app.
            //
            // Resolving upstream would ALSO re-render — the shell's effect
            // auto-tracks and would pick up the locale signal the moment it
            // called `t()`. This is not a correctness fix, it is where copy
            // belongs: the top bar is what renders strings, so the top bar is
            // what turns keys into them. See `page-title.ts`.
            title: () => {
                const key = this.app.titleKey.get();
                return key === null ? '' : t(key);
            },
            theme: {
                onclick: () => this.theme.toggle(),
            },
            // The glyph is decorative and lives in its own aria-hidden span. Put
            // it in the button's own text and it lands in the accessible name:
            // U+263E is announced as its Unicode name ("last quarter moon"),
            // so the control introduces itself as a moon before it says what it
            // does. Same reason the menu trigger hides its own glyph.
            themeGlyph: () => this.theme.dark.get() ? '\u2600' : '\u263E',
            // The label names the mode the click moves TO, so it reads as
            // the action rather than the state it is already in.
            themeLabel: () => this.theme.dark.get()
                ? t('topBar.theme.toLight')
                : t('topBar.theme.toDark'),
            logout: {
                onclick: async () => {
                    await this.auth.logout();
                    this.router.navigate('/login', true);
                },
                textContent: () => this.auth.currentUser.get() ? t('topBar.signOut') : '',
            },
        });

        this.menu = this.ref(frag, 'menu');
        return frag;
    }

    onMount(): void {
        // Closing the drawer must hand focus back to what opened it. The trigger
        // owns that because it is the element focus has to land on.
        let wasOpen = false;
        this.track(effect(() => {
            const open = this.app.navOpen.get();
            if (wasOpen && !open) this.menu.focus();
            wasOpen = open;
        }));
    }
}
