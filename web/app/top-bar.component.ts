import { Component, Router, Theme, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s } from '../css';
import { AppService } from './app.service';

const tpl = template(`
    <header class="top-bar">
        <span class="top-bar__logo">Teacher-Student</span>
        <span bind="title"></span>
        <button bind="theme" class="top-bar__theme"></button>
        <button bind="logout" class="top-bar__logout"></button>
    </header>
`);

export class TopBarComponent extends Component {
    static styles = `
        .top-bar {
            display: flex;
            align-items: center;
            gap: ${s('lg')};
            padding: 0 ${s('xl')};
            height: 48px;
            background: ${t('topbar-bg')};
            color: ${t('primary-text')};

            & .top-bar__logo {
                font-weight: 700;
                font-size: 0.875rem;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: ${t('topbar-logo')};
            }

            & [bind="title"] {
                flex: 1;
            }

            & .top-bar__theme, & .top-bar__logout {
                padding: ${s('xs')} ${s('md')};
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: ${t('radius-pill')};
                background: rgba(255, 255, 255, 0.08);
                color: ${t('primary-text')};
                font-size: 0.8rem;
                cursor: pointer;
                transition: background 0.15s;

                &:hover { background: rgba(255, 255, 255, 0.15); }
            }

            & .top-bar__logout:empty { display: none; }
        }
    `;

    private app = this.inject(AppService);
    private auth = this.inject(AuthService);
    private theme = this.inject(Theme);
    private router = this.inject(Router);

    render(): DocumentFragment {
        return this.wire(tpl, {
            title: () => this.app.title.get(),
            theme: {
                onclick: () => this.theme.toggle(),
                textContent: () => this.theme.dark.get() ? '\u2600 Light' : '\u263E Dark',
            },
            logout: {
                onclick: async () => {
                    await this.auth.logout();
                    this.router.navigate('/login', true);
                },
                textContent: () => this.auth.currentUser.get() ? 'Sign out' : '',
            },
        });
    }
}
