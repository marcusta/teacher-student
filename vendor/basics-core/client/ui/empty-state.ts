import { Component, effect } from '../core';

export type EmptyStateAction = {
    label: string | (() => string);
    onclick: () => void;
    /** Rendered on the button as `aria-label` when the visible label is terse. */
    ariaLabel?: string;
};

export type EmptyStateProps = {
    /** One short line. Set in the display serif — this is a heading moment. */
    heading: string | (() => string);
    /**
     * At most two sentences, in the app's own voice. Copy is domain and
     * translated, so it is always supplied by the caller; this component is the
     * shell only.
     */
    body?: string | (() => string);
    /**
     * Exactly one action, or none. The shape of this prop is the enforcement:
     * there is no way to express a second action, because an empty state with
     * two exits teaches nothing.
     */
    action?: EmptyStateAction;
    /** Brass hairline ornament. The only decoration permitted. Defaults to on. */
    ornament?: boolean;
    /**
     * Heading element level, for document outline correctness. Defaults to 3,
     * on the assumption the empty state sits inside an already-titled section.
     */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

const t = (name: string) => `var(--${name})`;

export class EmptyStateComponent extends Component<EmptyStateProps> {
    static styles = `
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${t('space-3')};
            padding: ${t('space-7')} ${t('space-5')};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${t('space-8')};
            height: 1px;
            background: ${t('brass-line')};
            margin-bottom: ${t('space-2')};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${t('font-display')};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${t('text')};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${t('font-ui')};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${t('text-muted')};
        }
        .ui-empty-state__action {
            margin-top: ${t('space-2')};
            padding: ${t('space-2')} ${t('space-4')};
            border: 1px solid ${t('accent')};
            border-radius: ${t('radius-sm')};
            background: ${t('accent')};
            color: ${t('on-accent')};
            font-family: ${t('font-ui')};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${t('dur-fast')} ${t('ease-standard')},
                        border-color ${t('dur-fast')} ${t('ease-standard')};
        }
        .ui-empty-state__action:hover {
            background: ${t('accent-strong')};
            border-color: ${t('accent-strong')};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${t('accent')};
            outline-offset: 2px;
        }
    `;

    render(): HTMLElement {
        const root = document.createElement('div');
        root.className = 'ui-empty-state';

        const resolve = (v: string | (() => string)): string =>
            typeof v === 'function' ? v() : v;

        const bind = (el: HTMLElement, v: string | (() => string)): void => {
            if (typeof v === 'function') {
                this.track(effect(() => { el.textContent = resolve(v); }));
            } else {
                el.textContent = v;
            }
        };

        if (this.props.ornament !== false) {
            const ornament = document.createElement('div');
            ornament.className = 'ui-empty-state__ornament';
            ornament.setAttribute('aria-hidden', 'true');
            root.appendChild(ornament);
        }

        const heading = document.createElement(`h${this.props.headingLevel ?? 3}`);
        heading.className = 'ui-empty-state__heading';
        bind(heading, this.props.heading);
        root.appendChild(heading);

        if (this.props.body !== undefined) {
            const body = document.createElement('p');
            body.className = 'ui-empty-state__body';
            bind(body, this.props.body);
            root.appendChild(body);
        }

        const action = this.props.action;
        if (action) {
            const btn = document.createElement('button');
            btn.className = 'ui-empty-state__action';
            btn.setAttribute('type', 'button');
            if (action.ariaLabel) btn.setAttribute('aria-label', action.ariaLabel);
            bind(btn, action.label);
            btn.addEventListener('click', () => action.onclick());
            root.appendChild(btn);
        }

        return root;
    }
}
