import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';

const tpl = template(`
    <nav class="nav">
        <a bind="homeLink" href="/home">Hem</a>
        <a bind="invitationsLink" href="/invitations">Inbjudningar</a>
    </nav>
`);

export class NavComponent extends Component {
    static styles = `
        .nav {
            display: flex;
            flex-direction: column;
            gap: ${s('xs')};
            padding: ${s('lg')} ${s('md')};
            background: ${t('surface')};

            & a {
                padding: ${s('sm')} ${s('md')};
                border-radius: ${t('radius')};
                color: ${t('text')};
                text-decoration: none;
                font-size: 0.875rem;
                transition: background 0.15s, color 0.15s;

                &:hover { background: ${t('hover-bg')}; }
                &.active {
                    background: ${t('active-bg')};
                    color: ${t('active-text')};
                }
            }

            @media (max-width: 640px) {
                flex-direction: row;
                padding: ${s('sm')} ${s('md')};
            }
        }
    `;

    private router = this.inject(Router);

    render(): DocumentFragment {
        return this.wire(tpl, {
            homeLink: this.router.link('/home'),
            invitationsLink: this.router.link('/invitations'),
        });
    }
}
