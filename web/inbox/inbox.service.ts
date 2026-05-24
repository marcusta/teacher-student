import { Signal, Computed } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api, type Invitation } from '../api';

/**
 * Owns the current user's inbound invitation list as observable state.
 *
 * Deep module: exposes `items`, `pendingCount`, `loading`, `error` signals
 * plus `load`, `accept`, `decline`. Hides the API calls, request lifecycle,
 * and list mutation after accept/decline. The nav badge reads
 * `pendingCount`; the inbox page reads `items`.
 */
export class InboxService {
    readonly items = new Signal<Invitation[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly pendingCount = new Computed(() => this.items.get().length);

    async load(): Promise<void> {
        const result = await request(this.loading, this.error, () => api.invitations.inbox());
        if (result) this.items.set(result);
    }

    async accept(invitationId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.invitations.accept({ invitationId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().filter((i) => i.id !== invitationId));
        return true;
    }

    async decline(invitationId: string): Promise<boolean> {
        const result = await request(this.loading, this.error, () =>
            api.invitations.decline({ invitationId }),
        );
        if (!result) return false;
        this.items.set(this.items.get().filter((i) => i.id !== invitationId));
        return true;
    }
}
