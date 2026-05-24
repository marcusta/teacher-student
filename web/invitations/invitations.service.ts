import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Invitation } from '../api';

/**
 * Owns the teacher's invitation list as observable state.
 *
 * Deep module: callers see `items`, `loading`, `error` signals and three
 * methods (`load`, `create`, `revoke`). Hides the API calls, request
 * lifecycle, and optimistic list mutation.
 */
export class InvitationsService {
    readonly items = new Signal<Invitation[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.invitations.list());
        if (result) this.items.set(result);
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
