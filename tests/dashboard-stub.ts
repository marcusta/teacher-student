import type { DashboardView } from '../web/api';

/**
 * A plausible, empty `GET /api/dashboard` body for the DOM tests that mount the
 * app shell.
 *
 * `/` and `/home` mount `HomeComponent`, which loads the dashboard on mount and
 * then reads `view.awaitingFeedback.length`, `view.capabilities.teaches` and the
 * rest through `home-copy.visibleBlocks`. The shell tests answer every request
 * with `[]`, which is a fine stand-in for a collection endpoint and a nonsense
 * one for a view-shaped payload — an array has none of those fields, so the
 * first block-selection read throws inside an effect.
 *
 * Those tests are about routing, titles and shell classes, not about the
 * dashboard, so the fix is the one their own comments already state: the shape
 * still has to be plausible. This is the plausible shape, and it is typed so it
 * cannot drift from `DashboardView` without failing `bun run check:test`.
 *
 * Deliberately the ALL-EMPTY payload: no relations, no content, no pending
 * invitations, which is the `fresh` state — the post-registration landing every
 * new account gets, and the least eventful thing Hem can render.
 */
export const EMPTY_DASHBOARD: DashboardView = {
    capabilities: { teaches: false, rides: false },
    nextLesson: null,
    latestFeedback: null,
    awaitingFeedback: [],
    activePlans: [],
    goalsNearingTarget: [],
    pendingInvitations: 0,
    generatedAt: '2026-07-20T09:00:00.000Z',
};

export const EMPTY_DASHBOARD_JSON = JSON.stringify(EMPTY_DASHBOARD);

/** True for the dashboard endpoint, whatever base path the client is using. */
export function isDashboardUrl(url: string): boolean {
    return url.includes('/dashboard');
}
