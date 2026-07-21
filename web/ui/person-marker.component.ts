import { Component, effect } from '@basics/core/client/core';
import { StatusPillComponent } from '@basics/core/client/ui/status-pill';
import { roleLabel, type PersonRole } from './copy';
import { token } from '../theme';
import { s } from '../css';

// See ./copy for why the copy rules live outside the component module.
export type { PersonRole } from './copy';
export { roleLabel } from './copy';

/**
 * Person marker — design system §4.6.
 *
 * An author name plus the contextual role tag: **Lärare** carries the accent
 * tone, **Elev** the neutral one. The spec's constraint is that the two are
 * otherwise identical — "samma vikt, ingen hierarki i storlek" — so both roles
 * render the same pill at the same size and weight and differ only in the
 * `--ui-pill-tone` they resolve. Nothing here can express a size or weight
 * difference between teacher and student.
 *
 * Avatars are explicitly forbidden by the spec ("Undvik: avatarer som
 * ersättning"), so the framework's `avatar.ts` is not used and must not be
 * reintroduced here.
 *
 * `showRole` exists because of the other `Undvik` clause — "markering när
 * kontexten redan är entydig (t.ex. elevens egen logg)". A student reading
 * their own training log already knows who wrote it; the tag would be noise.
 */
export interface PersonMarkerProps {
    /** Author's display name. */
    name: string | (() => string);
    /** Contextual role in *this* relation, not a global account type. */
    role: PersonRole | (() => PersonRole);
    /** Suppress the role tag where the context already makes it unambiguous. */
    showRole?: boolean | (() => boolean);
}

const resolve = <T>(value: T | (() => T)): T =>
    typeof value === 'function' ? (value as () => T)() : value;

export class PersonMarkerComponent extends Component<PersonMarkerProps> {
    static styles = `
        .person-marker {
            display: inline-flex;
            align-items: baseline;
            gap: ${s('sm')};
            /* Author names are UI text, never the serif (§02). */
            font-family: ${token('font-ui')};
        }

        .person-marker__name {
            font-size: 0.875rem;
            font-weight: 600;
            color: ${token('text')};
        }

        /* Teacher accent / student neutral. The ONLY difference between the two
           roles — same pill, same metrics, same weight. */
        .person-marker--teacher .ui-status-pill {
            --ui-pill-tone: ${token('accent-strong')};
        }
        .person-marker--student .ui-status-pill {
            --ui-pill-tone: ${token('text-muted')};
        }

        .person-marker__role.hidden { display: none; }
    `;

    private role(): PersonRole {
        return resolve(this.props.role);
    }

    render(): HTMLElement {
        const host = document.createElement('span');
        host.className = 'person-marker';

        const nameEl = document.createElement('span');
        nameEl.className = 'person-marker__name';
        host.appendChild(nameEl);

        const roleHost = document.createElement('span');
        roleHost.className = 'person-marker__role';
        host.appendChild(roleHost);

        this.spawn(StatusPillComponent, roleHost, {
            label: () => roleLabel(this.role()),
            variant: 'outline',
        });

        this.track(effect(() => {
            nameEl.textContent = resolve(this.props.name);
        }));

        this.track(effect(() => {
            host.className = `person-marker person-marker--${this.role()}`;
            const show = this.props.showRole === undefined ? true : resolve(this.props.showRole);
            roleHost.className = show ? 'person-marker__role' : 'person-marker__role hidden';
        }));

        return host;
    }
}
