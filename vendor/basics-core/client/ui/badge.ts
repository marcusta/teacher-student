import { Component, effect } from '../core';

/** See tabs.ts for why this is a plain reference and not a fallback chain. */
const t = (name: string) => `var(--${name})`;

/**
 * Badge is the COUNT primitive — an inbox counter, an unread tally, a number
 * on a tab. It is a quantity, so it carries tabular numerals.
 *
 * It is NOT the status pill. Status uses `StatusPill`, which encodes state in
 * a shape grammar (outline = ongoing, filled = completed, dashed = cancelled)
 * so it stays legible without colour — see design system §4.4, which also
 * forbids per-view hues. Badge's free-form `bg` is fine for a count chip and
 * wrong for a status; if you are reaching for `bg` to mean a state, you want
 * StatusPill.
 */
export type BadgeProps = {
    text: string | (() => string);
    bg?: string | (() => string);
    color?: string;
};

/** CSS recipe for an inline count badge. */
export const badge = () => `
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-family: ${t('font-ui')};
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    border-radius: ${t('radius-pill')};
    line-height: 1.4;
`;

export class BadgeComponent extends Component<BadgeProps> {
    static styles = `
        .ui-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            font-family: ${t('font-ui')};
            font-size: 0.75rem;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            border-radius: ${t('radius-pill')};
            line-height: 1.4;
            color: ${t('on-accent')};
        }
    `;

    render(): HTMLElement {
        const el = document.createElement('span');
        el.className = 'ui-badge';
        // The default lives in the stylesheet above, so it stays themeable;
        // only an explicit override needs an inline style.
        if (this.props.color !== undefined) el.style.color = this.props.color;

        const resolve = (v: string | (() => string) | undefined): string =>
            typeof v === 'function' ? v() : v ?? '';

        // Reactive text
        if (typeof this.props.text === 'function') {
            this.track(effect(() => { el.textContent = resolve(this.props.text); }));
        } else {
            el.textContent = this.props.text;
        }

        // Reactive background
        if (this.props.bg !== undefined) {
            if (typeof this.props.bg === 'function') {
                this.track(effect(() => { el.style.background = resolve(this.props.bg); }));
            } else {
                el.style.background = this.props.bg;
            }
        }

        return el;
    }
}
