import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { MenuComponent, type MenuItem } from '@basics/core/client/ui/menu';
import { StatusPillComponent, type StatusPillTone, type StatusPillVariant } from '@basics/core/client/ui/status-pill';
import { t } from '../i18n';
import { token } from '../theme';
import { s, btn } from '../css';
import { ShareChipComponent } from './share-chip.component';
import { NARROW_QUERY, overflowItems, type ShareRecipient } from './copy';

// See ./copy for why the collapse rule lives outside the component module.
export { NARROW_QUERY, overflowItems } from './copy';

/**
 * Detail page header — design system §4.10.
 *
 * Object-type eyebrow, title, status, parent chips, metadata line, and an
 * action cluster. Two rules from the spec's `Undvik` list are load-bearing and
 * are enforced by the shape of the props rather than by review:
 *
 * - **"mer än en primärhandling"** — `primaryAction` is a single optional
 *   object. A second primary is unrepresentable.
 * - **"chips som inte är klickbara vägar uppåt i hierarkin"** — every chip
 *   requires an `href` and renders as a router link. There is no decorative
 *   chip variant, because the chips ARE the Mål → Plan → Lektion/Träningspass →
 *   Övning navigation (IA §1: "Every detail view must expose its parents as
 *   links").
 *
 * Responsive behaviour follows UI_DECISIONS §6: below 640px the secondary
 * actions fold into the ⋯ overflow while the primary stays visible, and chips
 * wrap rather than scroll — a path upward that has scrolled out of view is a
 * path you cannot take.
 */
export interface DetailHeaderChip {
    /** Fully composed label, e.g. `Plan: Hoppsäsong vår 2026`. */
    label: string;
    /** Where the chip navigates. Required — chips are never decorative. */
    href: string;
}

export interface DetailHeaderStatus {
    /**
     * Status text, literal or as a thunk. The thunk arm is what the
     * `statusPill` / `goalStatusPill` / `planStatusPill` descriptors pass: it
     * carries the locale READ rather than its result, so the pill re-resolves
     * it inside its own effect. The header's status effect therefore never
     * subscribes to the locale itself, which is the point — it rebuilds the
     * pill when the STATUS changes, not when the language does.
     */
    label: string | (() => string);
    /** Shape, and therefore meaning: outline / filled / dashed (§4.4). */
    variant?: StatusPillVariant;
    tone?: StatusPillTone;
    glyph?: string;
}

export interface DetailHeaderAction {
    label: string;
    onclick: () => void;
    disabled?: boolean | (() => boolean);
}

export interface DetailHeaderProps {
    /** Object type, e.g. `Lektion`. Letterspaced uppercase, never the serif. */
    eyebrow: string | (() => string);
    /** The object's name. Lora 500 — see UI_DECISIONS §3. */
    title: string | (() => string);
    /** Current status, or null while unknown. */
    status?: DetailHeaderStatus | null | (() => DetailHeaderStatus | null);
    /** Navigational edges up the hierarchy. */
    chips?: DetailHeaderChip[] | (() => DetailHeaderChip[]);
    /** Sharing state, rendered as a ShareChip alongside the parent chips. */
    recipients?: ShareRecipient[] | (() => ShareRecipient[]);
    /** Whether the object is shared. Defaults to `recipients.length > 0`. */
    shared?: boolean | (() => boolean);
    /** At most one. */
    primaryAction?: DetailHeaderAction | null | (() => DetailHeaderAction | null);
    /** Shown inline at ≥640px, folded into ⋯ below it. */
    secondaryActions?: DetailHeaderAction[] | (() => DetailHeaderAction[]);
    /** Always in the ⋯ overflow, at every width. */
    overflowActions?: DetailHeaderAction[] | (() => DetailHeaderAction[]);
    /** Metadata line, e.g. `Onsdag 22 juli · 17:00–18:00 · Caspian`. */
    meta?: string | (() => string);
    /** Heading level of the title. Defaults to 1 — this is the page title. */
    headingLevel?: 1 | 2 | 3;
}

const resolve = <T>(value: T | (() => T)): T =>
    typeof value === 'function' ? (value as () => T)() : value;

const isDisabled = (action: DetailHeaderAction): boolean =>
    action.disabled === undefined ? false : resolve(action.disabled);

const tpl = template(`
    <header class="detail-header">
        <div class="detail-header__top">
            <div class="detail-header__identity">
                <p bind="eyebrow" class="detail-header__eyebrow"></p>
                <div bind="titleRow" class="detail-header__title-row"></div>
                <ul bind="chips" class="detail-header__chips"></ul>
            </div>
            <div class="detail-header__actions">
                <div bind="secondary" class="detail-header__secondary"></div>
                <button bind="primary" type="button" class="detail-header__primary"></button>
                <div bind="menuAnchor" class="detail-header__menu-anchor">
                    <button bind="menuButton" type="button" class="detail-header__overflow" aria-haspopup="menu">⋯</button>
                    <div bind="menuHost"></div>
                </div>
            </div>
        </div>
        <p bind="meta" class="detail-header__meta"></p>
    </header>
`);

export class DetailHeaderComponent extends Component<DetailHeaderProps> {
    static styles = `
        .detail-header {
            display: flex;
            flex-direction: column;
            gap: ${s('md')};
            padding-bottom: ${s('lg')};
            border-bottom: 1px solid ${token('border')};
            font-family: ${token('font-ui')};

            & .detail-header__top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${s('lg')};
                flex-wrap: wrap;
            }

            & .detail-header__identity {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                min-width: 0;
            }

            & .detail-header__eyebrow {
                margin: 0;
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${token('text-muted')};
            }

            & .detail-header__title-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${s('md')};
            }

            /* Lora, weight 500, and ONLY 500. The app ships a single static 500
               cut; 400 silently resolves to it and 600 gets synthetic bold —
               precisely the faked weight the spec forbids (UI_DECISIONS §3). */
            & .detail-header__title {
                margin: 0;
                font-family: ${token('font-display')};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${token('text')};
                overflow-wrap: anywhere;
            }

            /* Chips wrap; they never scroll. Every path upward stays reachable
               at every width (UI_DECISIONS §6). */
            & .detail-header__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};
                list-style: none;
                margin: 0;
                padding: 0;
            }
            & .detail-header__chips:empty { display: none; }

            & .detail-header__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${s('sm')};
                border: 1px solid ${token('border-strong')};
                border-radius: ${token('radius-pill')};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${token('text-muted')};
                text-decoration: none;
                transition: color ${token('dur-fast')} ${token('ease-standard')},
                            border-color ${token('dur-fast')} ${token('ease-standard')};

                &:hover {
                    color: ${token('accent-strong')};
                    border-color: ${token('accent')};
                    text-decoration: underline;
                }
                &:focus-visible { outline: 2px solid ${token('accent')}; outline-offset: 2px; }
            }

            & .detail-header__actions {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
            }

            & .detail-header__secondary {
                display: flex;
                gap: ${s('sm')};

                & button { ${btn()} }
            }

            /* §4.8: the one primary on a detail view. */
            & .detail-header__primary { ${btn(token('radius-sm'), 'primary')} }
            & .detail-header__primary.hidden { display: none; }

            & .detail-header__menu-anchor { position: relative; }
            & .detail-header__menu-anchor.hidden { display: none; }

            /* The framework menu is absolutely positioned from the anchor's LEFT
               edge and keeps its 180px box when closed (it hides with opacity,
               not display). The anchor sits at the right edge of the action
               cluster, so left-anchoring pushes the menu past the content edge
               and gives every page with an overflow action a horizontal
               scrollbar — including while the menu is shut. Anchoring it to the
               right edge is also simply where an overflow menu belongs: it opens
               inward, over the page, instead of off it. */
            & .detail-header__menu-anchor .ui-menu { left: auto; right: 0; }

            & .detail-header__overflow {
                ${btn()}
                line-height: 1;
            }

            & .detail-header__meta {
                margin: 0;
                font-size: 0.875rem;
                color: ${token('text-muted')};
            }
            & .detail-header__meta:empty { display: none; }

            /* Below 640px the secondary cluster folds into ⋯; the single
               primary action stays visible at every width. */
            @media (max-width: 639px) {
                & .detail-header__secondary { display: none; }
                & .detail-header__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;

    private router = this.inject(Router);
    private menuOpen = new Signal(false);
    private menuItems = new Signal<MenuItem[]>([]);
    private narrow = new Signal(false);

    onMount(): void {
        const mq = window.matchMedia(NARROW_QUERY);
        this.narrow.set(mq.matches);
        const onChange = () => this.narrow.set(mq.matches);
        mq.addEventListener('change', onChange);
        this.track(() => mq.removeEventListener('change', onChange));
    }

    private secondaryActions(): DetailHeaderAction[] {
        return resolve(this.props.secondaryActions ?? []);
    }

    private overflowActions(): DetailHeaderAction[] {
        return resolve(this.props.overflowActions ?? []);
    }

    private menuActions(): DetailHeaderAction[] {
        return overflowItems(this.secondaryActions(), this.overflowActions(), this.narrow.get());
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            eyebrow: { textContent: () => resolve(this.props.eyebrow) },
            meta: { textContent: () => resolve(this.props.meta ?? '') },
            menuButton: {
                'aria-label': () => t('detail.moreActions'),
                'aria-expanded': () => String(this.menuOpen.get()),
                onclick: (e: Event) => {
                    e.stopPropagation();
                    this.menuOpen.set(!this.menuOpen.peek());
                },
            },
        });

        this.buildTitleRow(this.ref(frag, 'titleRow'));
        this.buildChips(this.ref(frag, 'chips'));
        this.buildPrimary(this.ref(frag, 'primary') as HTMLButtonElement);
        this.buildSecondary(this.ref(frag, 'secondary'));

        // The overflow list is derived (it grows below 640px), so it is fed to
        // the framework menu through a signal rather than rebuilt on open.
        this.spawn(MenuComponent, this.ref(frag, 'menuHost'), {
            open: this.menuOpen,
            items: this.menuItems,
            zIndex: 50,
        });
        this.wireMenu(this.ref(frag, 'menuAnchor'));

        return frag;
    }

    private buildTitleRow(host: HTMLElement): void {
        const level = this.props.headingLevel ?? 1;
        const heading = document.createElement(`h${level}`);
        heading.className = 'detail-header__title';
        this.track(effect(() => {
            heading.textContent = resolve(this.props.title);
        }));
        host.appendChild(heading);

        const statusHost = document.createElement('span');
        host.appendChild(statusHost);
        let current: StatusPillComponent | null = null;
        this.track(effect(() => {
            const status = resolve(this.props.status ?? null);
            current?.destroy();
            current = null;
            statusHost.replaceChildren();
            if (!status) return;
            const pill = new StatusPillComponent({
                label: status.label,
                variant: status.variant ?? 'outline',
                tone: status.tone ?? 'neutral',
                ...(status.glyph === undefined ? {} : { glyph: status.glyph }),
            });
            pill.mount(statusHost);
            current = pill;
        }));
        this.track(() => current?.destroy());
    }

    private buildChips(host: HTMLElement): void {
        let share: ShareChipComponent | null = null;
        this.track(effect(() => {
            const chips = resolve(this.props.chips ?? []);
            share?.destroy();
            share = null;
            host.replaceChildren();

            for (const chip of chips) {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.className = 'detail-header__chip';
                link.textContent = chip.label;
                const bindings = this.router.link(chip.href);
                link.href = chip.href;
                link.addEventListener('click', bindings.onclick);
                li.appendChild(link);
                host.appendChild(li);
            }

            if (this.props.recipients === undefined) return;
            const chip = new ShareChipComponent({
                recipients: this.props.recipients,
                ...(this.props.shared === undefined ? {} : { shared: this.props.shared }),
                as: 'li',
            });
            chip.mount(host);
            share = chip;
        }));
        this.track(() => share?.destroy());
    }

    private buildPrimary(button: HTMLButtonElement): void {
        this.track(effect(() => {
            const action = resolve(this.props.primaryAction ?? null);
            button.className = action ? 'detail-header__primary' : 'detail-header__primary hidden';
            button.textContent = action?.label ?? '';
            button.disabled = action ? isDisabled(action) : true;
        }));
        button.addEventListener('click', () => {
            const action = resolve(this.props.primaryAction ?? null);
            if (action && !isDisabled(action)) action.onclick();
        });
    }

    private buildSecondary(host: HTMLElement): void {
        this.track(effect(() => {
            host.replaceChildren();
            for (const action of this.secondaryActions()) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = action.label;
                button.disabled = isDisabled(action);
                button.addEventListener('click', action.onclick);
                host.appendChild(button);
            }
        }));
    }

    private wireMenu(anchor: HTMLElement): void {
        this.track(effect(() => {
            const actions = this.menuActions().filter((a) => !isDisabled(a));
            anchor.className = actions.length === 0
                ? 'detail-header__menu-anchor hidden'
                : 'detail-header__menu-anchor';
            if (actions.length === 0 && this.menuOpen.peek()) this.menuOpen.set(false);
            this.menuItems.set(actions.map((action): MenuItem => ({
                type: 'item',
                label: action.label,
                onclick: action.onclick,
            })));
        }));
    }
}
