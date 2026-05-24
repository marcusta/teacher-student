import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { TopBarComponent } from './top-bar.component';
import { NavComponent } from './nav.component';
import { HomeComponent } from '../home/home.component';
import { LoginComponent } from '../auth/auth.component';
import { RegisterComponent } from '../auth/register.component';

const tpl = template(`
    <div class="app-layout">
        <div bind="topBar" class="app-layout__top"></div>
        <div bind="nav" class="app-layout__nav"></div>
        <div bind="content" class="app-layout__content"></div>
    </div>
`);

export class AppComponent extends Component {
    static styles = `
        .app-layout {
            display: grid;
            grid-template: auto 1fr / 200px 1fr;
            height: 100vh;
            background: ${t('bg')};

            & .app-layout__top {
                grid-column: 1 / -1;
            }

            & .app-layout__content {
                overflow-y: auto;
                padding: ${s('xl')} ${s('2xl')};
            }

            @media (max-width: 640px) {
                grid-template: auto auto 1fr / 1fr;

                & .app-layout__nav {
                    flex-direction: row;
                }
            }
        }
    `;

    private router = this.inject(Router);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});

        this.spawn(TopBarComponent, this.ref(frag, 'topBar'));
        this.spawn(NavComponent, this.ref(frag, 'nav'));
        this.$swap(this.ref(frag, 'content'), this.router.route, {
            '/home': HomeComponent,
            '/login': LoginComponent,
            '/register': RegisterComponent,
        }, HomeComponent);

        return frag;
    }
}
