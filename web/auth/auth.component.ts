import { Component, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input } from '../css';

const tpl = template(`
    <div class="login" bind="root">
        <h2>Sign in</h2>
        <div class="error" bind="error"></div>
        <form bind="form" class="login__form">
            <input bind="username" type="text" placeholder="Username" autocomplete="username" />
            <input bind="password" type="password" placeholder="Password" autocomplete="current-password" />
            <button type="submit" bind="submit">Sign in</button>
            <a bind="registerLink" href="/register" class="login__alt">No account? Create one</a>
        </form>
    </div>
`);

export class LoginComponent extends Component {
    static styles = `
        .login {
            max-width: 320px;
            margin: ${s('2xl')} auto;

            &[inert] { opacity: 0.6; }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .error {
                display: none;
                padding: ${s('sm')} ${s('md')};
                margin-bottom: ${s('md')};
                color: ${t('error')};
                font-size: 0.875rem;
            }
            & .error.show {
                display: block;
            }

            & .login__form {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};

                & input {
                    padding: ${s('sm')} ${s('md')};
                    font-size: 0.875rem;
                    ${input()}
                }

                & button {
                    padding: ${s('sm')} ${s('lg')};
                    font-size: 0.875rem;
                    ${btn()}
                }

                & .login__alt {
                    text-align: center;
                    font-size: 0.875rem;
                    color: ${t('accent')};
                    text-decoration: none;
                    margin-top: ${s('sm')};
                }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private username = '';
    private password = '';

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: { inert: () => this.auth.loading.get() },
            error: {
                className: () => this.auth.error.get() ? 'error show' : 'error',
                textContent: () => this.auth.error.get()?.message ?? '',
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const ok = await this.auth.login(this.username, this.password);
                    if (ok) this.router.navigate('/home', true);
                },
            },
            username: {
                oninput: (e: Event) => {
                    this.username = (e.target as HTMLInputElement).value;
                },
            },
            password: {
                oninput: (e: Event) => {
                    this.password = (e.target as HTMLInputElement).value;
                },
            },
            submit: {
                textContent: () => this.auth.loading.get() ? 'Signing in...' : 'Sign in',
            },
            registerLink: {
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate('/register', true);
                },
            },
        });
    }
}
