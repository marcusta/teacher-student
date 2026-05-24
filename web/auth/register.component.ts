import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { RegisterService } from './register.service';

const tpl = template(`
    <div class="register" bind="root">
        <h2>Create account</h2>
        <div class="error" bind="error"></div>
        <form bind="form" class="register__form">
            <input bind="email" type="email" placeholder="Email" autocomplete="email" />
            <input bind="displayName" type="text" placeholder="Display name" autocomplete="name" />
            <input bind="password" type="password" placeholder="Password (min 8 chars)" autocomplete="new-password" />
            <button type="submit" bind="submit">Create account</button>
            <a bind="loginLink" href="/login" class="register__alt">Already have an account? Sign in</a>
        </form>
    </div>
`);

export class RegisterComponent extends Component {
    static styles = `
        .register {
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

            & .register__form {
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

                & .register__alt {
                    text-align: center;
                    font-size: 0.875rem;
                    color: ${t('accent')};
                    text-decoration: none;
                    margin-top: ${s('sm')};
                }
            }
        }
    `;

    private svc = this.inject(RegisterService);
    private router = this.inject(Router);
    private email = '';
    private password = '';
    private displayName = '';

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            error: {
                className: () => this.svc.error.get() ? 'error show' : 'error',
                textContent: () => {
                    const err = this.svc.error.get();
                    if (!err) return '';
                    if (err.code === 'conflict') return 'Email already registered';
                    return err.message;
                },
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const ok = await this.svc.register({
                        email: this.email,
                        password: this.password,
                        displayName: this.displayName,
                    });
                    if (ok) this.router.navigate('/home', true);
                },
            },
            email: { oninput: (e: Event) => { this.email = (e.target as HTMLInputElement).value; } },
            displayName: { oninput: (e: Event) => { this.displayName = (e.target as HTMLInputElement).value; } },
            password: { oninput: (e: Event) => { this.password = (e.target as HTMLInputElement).value; } },
            submit: {
                textContent: () => this.svc.loading.get() ? 'Creating...' : 'Create account',
            },
            loginLink: {
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate('/login', true);
                },
            },
        });
    }
}
