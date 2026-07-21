import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Invitation } from '../api';

/**
 * Owns the teacher's invitation list as observable state.
 *
 * Deep module: callers see `items`, `loading`, `error`, `resolved` signals and
 * three methods (`load`, `create`, `revoke`). Hides the API calls, request
 * lifecycle, and optimistic list mutation.
 */
export class InvitationsService {
    readonly items = new Signal<Invitation[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    /**
     * True once a load has completed, successfully or not.
     *
     * Separate from `loading` because "asked, and the answer was none" and "not
     * asked yet" are different states, and Mina elever may only claim the
     * teacher has no invitations in the first. Without it the roster page
     * flashes its branded empty state in the gap before this request goes out —
     * and, worse, could show it permanently if the request failed.
     */
    readonly resolved = new Signal(false);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.invitations.list());
        if (result) this.items.set(result);
        this.resolved.set(true);
    }

    async create(inviteeEmail: string): Promise<boolean> {
        const created = await request(this.loading, this.error, () =>
            api.invitations.create({ inviteeEmail }),
        );
        if (!created) return false;
        this.items.set([created, ...this.items.get()]);
        return true;
    }

    async revoke(invitationId: string): Promise<void> {
        const result = await request(this.loading, this.error, () =>
            api.invitations.revoke({ invitationId }),
        );
        if (!result) return;
        if (result.changed) {
            this.items.set(this.items.get().map((i) =>
                i.id === invitationId ? { ...i, status: 'revoked' } : i,
            ));
        }
    }
}
