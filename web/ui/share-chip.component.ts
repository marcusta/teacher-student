import { Component, effect } from '@basics/core/client/core';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { shareDescription, shareLabel, type ShareRecipient } from './copy';
import { token } from '../theme';

// The copy rules live in ./copy so they can be asserted without a DOM; they are
// re-exported here so a consumer only needs one import to use the chip.
export type { ShareRecipient } from './copy';
export { dedupeRecipients, shareDescription, shareLabel } from './copy';

/**
 * Sharing chip — design system §4.5, "the trust surface".
 *
 * Two states and no third: **Privat** is a neutral outline; **Delad** is
 * accent-tinted and ALWAYS names its recipient. The spec's `Undvik` list bans
 * a bare "Delad", so this component makes an unlabelled shared state
 * unrepresentable: every branch of `shareLabel()` returns copy that either says
 * private or says who can see it.
 *
 * The visual is the framework's `StatusPill` (§4.4) rather than a second pill
 * implementation. The pill exposes its colour through one custom property,
 * `--ui-pill-tone`, so the accent tint is a token override on the wrapper — no
 * restyling, and the pill's shape grammar and metrics stay in one place.
 *
 * Brass is deliberately absent from `StatusPillTone` (an *outcome* never borrows
 * the brand colour). Sharing is not an outcome — it is the brand's trust
 * promise — so the accent belongs here, and only here.
 */
export interface ShareChipProps {
    /** Who can see the object. Empty means nobody but the owner. */
    recipients: ShareRecipient[] | (() => ShareRecipient[]);
    /**
     * Force the shared state when the recipient names are not loaded yet.
     * Defaults to `recipients.length > 0`. A shared object with no known name
     * renders `Delad: okänd mottagare` — degraded, but never silent.
     */
    shared?: boolean | (() => boolean);
    /** Element the chip renders as. `span` by default; `li` inside a chip list. */
    as?: 'span' | 'li';
}

const resolve = <T>(value: T | (() => T)): T =>
    typeof value === 'function' ? (value as () => T)() : value;

export class ShareChipComponent extends Component<ShareChipProps> {
    static styles = `
        .share-chip {
            display: inline-flex;
        }

        /* Shared = accent-tinted. The pill publishes its colour as one custom
           property, so this is a token swap rather than a restyle: shape,
           metrics and the ring all still come from StatusPill. */
        .share-chip--shared .ui-status-pill {
            --ui-pill-tone: ${token('accent-strong')};
            background: ${token('accent-soft')};
        }

        /* Private = neutral outline, which is StatusPill's default. Named here
           only so the two states read as a pair in this file. */
        .share-chip--private .ui-status-pill {
            --ui-pill-tone: ${token('text-muted')};
        }
    `;

    private recipients(): ShareRecipient[] {
        return resolve(this.props.recipients);
    }

    private isShared(): boolean {
        return this.props.shared === undefined
            ? this.recipients().length > 0
            : resolve(this.props.shared);
    }

    render(): HTMLElement {
        const host = document.createElement(this.props.as ?? 'span');

        this.spawn(StatusPillComponent, host, {
            label: () => shareLabel(this.recipients(), this.isShared()),
            variant: 'outline',
        });

        this.track(effect(() => {
            const shared = this.isShared();
            host.className = `share-chip share-chip--${shared ? 'shared' : 'private'}`;
            const description = shareDescription(this.recipients(), shared);
            if (description) host.setAttribute('title', description);
            else host.removeAttribute('title');
        }));

        return host;
    }
}
