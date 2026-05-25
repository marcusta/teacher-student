import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { InboxService } from '../inbox/inbox.service';

const tpl = template(`
    <nav class="nav">
        <a bind="homeLink" href="/home">Hem</a>
        <a bind="invitationsLink" href="/invitations">Inbjudningar</a>
        <a bind="studentsLink" href="/students">Mina elever</a>
        <a bind="libraryLink" href="/library">Bibliotek</a>
        <a bind="programsLink" href="/program">Program</a>
        <a bind="stableLink" href="/hastar">Hästar</a>
        <a bind="lessonsLink" href="/lektioner">Lektioner</a>
        <a bind="trainingSessionsLink" href="/traningspass">Träningspass</a>
        <a bind="inboxLink" href="/inbox">
            Inkorg
            <span bind="inboxBadge" class="nav__badge"></span>
        </a>
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

            & .nav__badge {
                display: inline-block;
                margin-left: ${s('xs')};
                min-width: 1.25rem;
                padding: 0 ${s('xs')};
                border-radius: 999px;
                background: ${t('active-bg')};
                color: ${t('active-text')};
                font-size: 0.75rem;
                text-align: center;
            }
            & .nav__badge.hidden { display: none; }

            @media (max-width: 640px) {
                flex-direction: row;
                padding: ${s('sm')} ${s('md')};
            }
        }
    `;

    private router = this.inject(Router);
    private inbox = this.inject(InboxService);

    onMount(): void {
        void this.inbox.load();
    }

    render(): DocumentFragment {
        return this.wire(tpl, {
            homeLink: this.router.link('/home'),
            invitationsLink: this.router.link('/invitations'),
            studentsLink: this.router.link('/students'),
            libraryLink: this.router.link('/library'),
            programsLink: this.router.link('/program'),
            stableLink: this.router.link('/hastar'),
            lessonsLink: this.router.link('/lektioner'),
            trainingSessionsLink: this.router.link('/traningspass'),
            inboxLink: this.router.link('/inbox'),
            inboxBadge: {
                textContent: () => String(this.inbox.pendingCount.get()),
                className: () => this.inbox.pendingCount.get() > 0 ? 'nav__badge' : 'nav__badge hidden',
            },
        });
    }
}
