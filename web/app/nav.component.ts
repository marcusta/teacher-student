import { Component, Router, template } from '@basics/core/client/core';
import { plural, t } from '../i18n';
import { token } from '../theme';
import { s } from '../css';
import { InboxService } from '../inbox/inbox.service';
import { NAV_GROUPS, type NavGroup, type NavItem } from './nav.structure';

export type NavProps = {
    /** Called after a link is followed. The drawer uses it to close itself. */
    onNavigate?: () => void;
};

const tpl = template(`
    <nav bind="nav" class="nav"></nav>
`);

const labelledGroupTpl = template(`
    <div class="nav__group">
        <span bind="label" class="nav__group-label"></span>
        <ul bind="links" class="nav__links"></ul>
    </div>
`);

const groupTpl = template(`
    <div class="nav__group">
        <ul bind="links" class="nav__links"></ul>
    </div>
`);

const itemTpl = template(`
    <li><a bind="link"></a></li>
`);

const badgedItemTpl = template(`
    <li>
        <a bind="link">
            <span bind="label"></span>
            <span bind="badge" class="nav__badge"></span>
        </a>
    </li>
`);

export class NavComponent extends Component<NavProps> {
    static styles = `
        .nav {
            display: flex;
            flex-direction: column;
            gap: ${s('xl')};
            padding: ${s('xl')} ${s('md')};
            background: ${token('surface')};
            /* Navigation is Open Sans territory — the serif is forbidden here. */
            font-family: ${token('font-ui')};

            & .nav__group-label {
                display: block;
                padding: 0 ${s('md')} ${s('sm')};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .nav__links {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            & a {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                padding: ${s('sm')} ${s('md')};
                border-radius: ${token('radius-sm')};
                color: ${token('text')};
                text-decoration: none;
                font-size: 0.875rem;
                cursor: pointer;
                transition: background ${token('dur-fast')} ${token('ease-standard')},
                            color ${token('dur-fast')} ${token('ease-standard')};

                /* No accent on inactive links — spec 4.1 names that as a misuse. */
                &:hover { background: ${token('surface-2')}; }

                &:focus-visible {
                    outline: 2px solid ${token('accent')};
                    outline-offset: 2px;
                }

                /* Active = 2px brass rule + accent-tinted fill. The rule is an
                   inset shadow rather than a border so it costs no layout. */
                &.active {
                    background: ${token('accent-soft')};
                    color: ${token('accent-strong')};
                    font-weight: 600;
                    box-shadow: inset 2px 0 0 ${token('brass-line')};
                }
            }

            & .nav__badge {
                margin-left: auto;
                min-width: 1.25rem;
                padding: 0 ${s('xs')};
                border-radius: ${token('radius-pill')};
                background: ${token('accent')};
                color: ${token('on-accent')};
                font-size: 0.75rem;
                font-variant-numeric: tabular-nums;
                text-align: center;
            }
            & .nav__badge.hidden { display: none; }
        }
    `;

    private router = this.inject(Router);
    private inbox = this.inject(InboxService);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            nav: { 'aria-label': () => t('nav.label') },
        });

        const host = this.ref(frag, 'nav');
        for (const group of NAV_GROUPS) host.appendChild(this.renderGroup(group));

        return frag;
    }

    private renderGroup(group: NavGroup): HTMLElement {
        const { labelKey } = group;
        // The list carries the group name for assistive tech; the span carries it
        // visually. Neither uses an id, so two instances (sidebar + drawer) can
        // coexist without colliding.
        const el = labelKey
            ? this.wireEl(labelledGroupTpl, {
                label: () => t(labelKey),
                links: { 'aria-label': () => t(labelKey) },
            })
            : this.wireEl(groupTpl, {});

        const links = this.ref(el, 'links');
        for (const item of group.items) links.appendChild(this.renderItem(item));
        return el;
    }

    private renderItem(item: NavItem): HTMLElement {
        if (item.badge === 'inbox') {
            return this.wireEl(badgedItemTpl, {
                link: { ...this.navLink(item.path), href: item.path },
                label: () => t(item.key),
                badge: {
                    textContent: () => String(this.inbox.pendingCount.get()),
                    className: () => this.inbox.pendingCount.get() > 0 ? 'nav__badge' : 'nav__badge hidden',
                    'aria-label': () => plural('nav.inboxPending', this.inbox.pendingCount.get()),
                },
            });
        }

        return this.wireEl(itemTpl, {
            link: { ...this.navLink(item.path), href: item.path, textContent: () => t(item.key) },
        });
    }

    /** Router link bindings, plus the drawer's close-on-navigate hook. */
    private navLink(path: string) {
        const link = this.router.link(path);
        return {
            ...link,
            onclick: (e: Event) => {
                link.onclick(e);
                this.props.onNavigate?.();
            },
        };
    }
}
