import { Component, effect } from '../core';

/**
 * Shape grammar. Status must stay legible with colour removed entirely, so the
 * variant — not the tone — is what carries the meaning:
 *
 *   outline — ongoing or future  (hairline ring, no fill)
 *   filled  — completed          (solid plate, no ring)
 *   dashed  — cancelled          (broken ring, no fill)
 *
 * The three silhouettes are distinguishable in greyscale and to anyone who
 * cannot perceive the tone at all.
 */
export type StatusPillVariant = 'outline' | 'filled' | 'dashed';

/**
 * Tone comes only from the semantic scale. Brass (`--accent`) means "brand and
 * action" and is deliberately absent here — an outcome never borrows it. There
 * is no arbitrary colour prop for the same reason: per-view hues are what make
 * a status system unreadable across screens.
 */
export type StatusPillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type StatusPillProps = {
    /** Status text. Always present — the pill is never glyph-only. */
    label: string | (() => string);
    /** Shape, and therefore meaning. Defaults to `outline`. */
    variant?: StatusPillVariant;
    /** Semantic tone. Defaults to `neutral`. */
    tone?: StatusPillTone;
    /** Optional leading glyph, e.g. `✕` on a cancelled pill. Decorative. */
    glyph?: string | (() => string);
};

const t = (name: string) => `var(--${name})`;

/**
 * Per-tone custom properties. Every tone resolves to a text/plate colour drawn
 * from the semantic scale; `neutral` borrows the muted text colour because the
 * scale has no neutral entry of its own.
 *
 * Filled pills put `--surface` on the tone. That token is the theme's paper
 * colour — white in light, near-charcoal in dark — so it inverts correctly
 * without hardcoding `#fff`, which is what breaks the dark theme elsewhere.
 */
const toneVars = (tone: StatusPillTone, color: string) => `
    .ui-status-pill--${tone} { --ui-pill-tone: ${color}; }
`;

export class StatusPillComponent extends Component<StatusPillProps> {
    static styles = `
        .ui-status-pill {
            display: inline-flex;
            align-items: center;
            gap: ${t('space-1')};
            padding: 2px ${t('space-2')};
            border-radius: ${t('radius-pill')};
            font-family: ${t('font-ui')};
            font-size: 0.75rem;
            font-weight: 600;
            line-height: 1.4;
            white-space: nowrap;
            border: 1px solid transparent;
        }
        ${toneVars('neutral', t('text-muted'))}
        ${toneVars('success', t('success'))}
        ${toneVars('warning', t('warning'))}
        ${toneVars('danger', t('danger'))}
        ${toneVars('info', t('info'))}

        /* Ongoing / future — hairline ring, transparent plate. */
        .ui-status-pill--outline {
            border-color: var(--ui-pill-tone);
            color: var(--ui-pill-tone);
            background: transparent;
        }
        /* Completed — solid plate, no ring. */
        .ui-status-pill--filled {
            border-color: transparent;
            background: var(--ui-pill-tone);
            color: ${t('surface')};
        }
        /* Cancelled — broken ring, transparent plate. */
        .ui-status-pill--dashed {
            border-style: dashed;
            border-color: var(--ui-pill-tone);
            color: var(--ui-pill-tone);
            background: transparent;
        }
        .ui-status-pill__glyph {
            flex-shrink: 0;
            font-size: 0.7rem;
            line-height: 1;
        }
    `;

    render(): HTMLElement {
        const variant = this.props.variant ?? 'outline';
        const tone = this.props.tone ?? 'neutral';

        const el = document.createElement('span');
        el.className = `ui-status-pill ui-status-pill--${variant} ui-status-pill--${tone}`;
        el.setAttribute('data-variant', variant);
        el.setAttribute('data-tone', tone);

        const resolve = (v: string | (() => string)): string =>
            typeof v === 'function' ? v() : v;

        if (this.props.glyph !== undefined) {
            const glyphEl = document.createElement('span');
            glyphEl.className = 'ui-status-pill__glyph';
            // The glyph only ever restates the label, so it is hidden from
            // assistive tech rather than read out twice.
            glyphEl.setAttribute('aria-hidden', 'true');
            if (typeof this.props.glyph === 'function') {
                this.track(effect(() => {
                    glyphEl.textContent = resolve(this.props.glyph!);
                }));
            } else {
                glyphEl.textContent = this.props.glyph;
            }
            el.appendChild(glyphEl);
        }

        const labelEl = document.createElement('span');
        labelEl.className = 'ui-status-pill__label';
        if (typeof this.props.label === 'function') {
            this.track(effect(() => {
                labelEl.textContent = resolve(this.props.label);
            }));
        } else {
            labelEl.textContent = this.props.label;
        }
        el.appendChild(labelEl);

        return el;
    }
}
