import Foundation
import Observation

/// Owns the current user's inbound invitation list — the port of
/// `web/inbox/inbox.service.ts`.
///
/// A deep module: it exposes the list, the pending count, the request lifecycle
/// and the three verbs, and hides how accept/decline settle the row afterwards.
///
/// ## Ownership contract
///
/// **Session-scoped, and shareable within that session — never process-scoped.**
/// A container-cached list would outlive the account it was fetched for: sign
/// out, sign in as someone else, and the new reader is shown the previous one's
/// invitations until something forces a refetch. So the instance must be held by
/// a view that dies with the session — `InboxRootView`'s own `@State`, or
/// `MainTabView`'s, which the auth gate destroys on sign-out (`RootView`).
///
/// Within one session it is deliberately safe to share:
///
/// - `pendingCount` is a plain read of the loaded rows — no request, no work, so
///   the tab badge may read it on every render (IA §3.17, §3.2: invitations
///   only, until the schema has notification read state);
/// - the in-flight guard sits on `load()` itself, not on the shell's `prefetch()`
///   wrapper, because either side can be the one that arrives second: the badge
///   prefetches at launch and the screen loads on every appearance. So the badge
///   asking and the screen appearing at the same moment cost one GET, not two —
///   in either order;
/// - nothing here assumes a single owner. The rows, the count, the errors and
///   the acknowledgement are all derived from the same state, so a shell that
///   shares its instance with `InboxRootView` gets a badge that settles the
///   moment a row does — and a shell that keeps its own instance simply refetches
///   on its own schedule. Both work; sharing is the better of the two.
@MainActor
@Observable
final class InboxViewModel {
    private(set) var items: [InboxInvitation] = []
    private(set) var isLoading = false
    /// A failed READ. Paired with a retry; distinct from `actionMessageKey`,
    /// which reports a mutation that could not be applied.
    private(set) var loadError: ApiError?
    /// The recoverable message from the last accept/decline, as a catalog key.
    /// Cleared the moment another action starts.
    private(set) var actionMessageKey: String?
    /// The success acknowledgement IA §4 requires: what just happened, in words.
    ///
    /// Borrowed from the Lektioner slice rather than duplicated — `Core/UI` has
    /// no toast, this slice may not add one, and `LessonNotice` is already the
    /// app's shape for "an inline, self-expiring acknowledgement at the top of
    /// the screen that caused it". Held here rather than built in the view so the
    /// notice keeps one identity, and with it one expiry timer, across redraws.
    private(set) var actionNotice: LessonNotice?
    /// Rows with a request in flight. Their controls disable so a double tap
    /// cannot send two accepts for one invitation.
    private(set) var busyIDs: Set<String> = []
    private(set) var hasResolved = false

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    /// The pending count in the header and in the tab badge. Free to read:
    /// invitations only, straight off the rows already in hand.
    var pendingCount: Int { items.count }

    var showsInitialLoading: Bool { isLoading && !hasResolved }

    /// A failed read with nothing in hand — the page-level error+retry.
    var showsPageError: Bool { loadError != nil && items.isEmpty }

    /// A failed refresh over rows that still stand — the scoped retry, in the
    /// shape Hem uses (`HomeViewModel.showsScopedError`).
    ///
    /// Load-bearing now that the list refetches on every appearance: without it a
    /// refresh that fails while invitations are on screen would render no message
    /// and no retry at all, which is exactly the "retry for failed reads" IA §4
    /// requires of every view. The rows stay — they are still the last thing the
    /// server said.
    var showsScopedError: Bool { loadError != nil && !items.isEmpty }

    var showsEmptyState: Bool { hasResolved && loadError == nil && items.isEmpty }

    // MARK: - Reads

    /// The shell's entry point, for the tab badge.
    ///
    /// Nothing of its own: it is the same read the screen makes, so the badge and
    /// the list can never disagree about what is pending. The guard that keeps
    /// the two from asking twice lives in `load()`, where both of them pass.
    func prefetch() async {
        await load()
    }

    /// The read: the appearance load, the retry, and the pull-to-refresh, which
    /// are the same request and must behave the same way.
    ///
    /// **No "at most once" guard.** The `@State` model survives a tab switch, so
    /// a first-load-only guard would hide every invitation that arrives after the
    /// screen's first appearance — the reader would have to relaunch the app to
    /// see it. The web pays the same refetch per mount (`inbox.component.ts:93`).
    /// The rows stay on screen while the request runs, so a refetch is invisible
    /// unless it changes something.
    ///
    /// **But an "at most once AT A TIME" guard**, and it has to live here rather
    /// than one level up in `prefetch()`, because the screen calls this method
    /// directly and would otherwise walk straight past it. Two concurrent GETs do
    /// not merely cost twice: they settle in an order nobody controls, so the
    /// loser can land after the winner and paint `loadError` — a warning strip
    /// and a retry — over a list the other request just refreshed successfully,
    /// while `isLoading` drops on the first answer and takes the spinner with it.
    /// Declining the second request is what makes the second answer impossible.
    /// A refresh gesture that arrives mid-read is therefore dropped rather than
    /// queued; the read already running is the same request and lands anyway.
    func load() async {
        guard !isLoading else { return }
        isLoading = true
        do {
            // Assigned only on success: a failed refresh must not blank a list
            // the reader was in the middle of answering.
            items = try await api.invitations.inbox()
            loadError = nil
        } catch is CancellationError {
            // The reader left Inkorg before the answer arrived. Not a failure, so
            // no error strip; not an answer either, so `hasResolved` stays put —
            // otherwise "Inga väntande inbjudningar" would be claimed off the
            // back of a request that never completed.
            isLoading = false
            return
        } catch let error as ApiError {
            loadError = error
        } catch {
            loadError = ApiError(status: nil, code: .unknown, message: "\(error)")
        }
        isLoading = false
        hasResolved = true
    }

    // MARK: - Mutations

    /// Accepting creates the Teacher↔Student Relation and settles the row.
    ///
    /// No confirmation step: accepting is what the reader came here to do, and it
    /// is reversible in the sense that matters — the relation can be ended, and
    /// nothing is destroyed by saying yes.
    func accept(_ invitation: InboxInvitation) async {
        // The created `Relation` is discarded: the inbox cares that the call
        // succeeded, and the relation itself belongs to Mina elever.
        await mutate(invitation, acknowledgement: "inbox.toast.accepted") {
            _ = try await self.api.invitations.accept(invitationId: $0)
        }
    }

    /// Declining settles the row without creating anything. Also unconfirmed: the
    /// teacher can send a new invitation, so this destroys no history.
    func decline(_ invitation: InboxInvitation) async {
        await mutate(invitation, acknowledgement: "inbox.toast.declined") {
            _ = try await self.api.invitations.decline(invitationId: $0)
        }
    }

    /// The reader dismissing an acknowledgement, or it timing out.
    func dismissActionNotice() {
        actionNotice = nil
    }

    /// Both verbs share one shape, including the two parts that matter.
    ///
    /// **The acknowledgement.** A settled row leaves the list, and a row simply
    /// vanishing is what a revoked, expired or externally-settled invitation
    /// looks like too — identical pixels for "you accepted this" and "this was
    /// taken away from you". So the verb says which happened, and names the
    /// teacher it happened with (IA §4, success acknowledgement appropriate to
    /// the action).
    ///
    /// **A stale row.** IA §3.2 requires that a stale Accept/Decline reads as a
    /// recoverable conflict and refreshes rather than as a failure. A 409 means
    /// the invitation was revoked, expired or already settled while this list sat
    /// on screen — so the message says the invitation is no longer valid and the
    /// list is refetched, which is what makes the row disappear on its own. The
    /// reader is never left holding a control that cannot work.
    private func mutate(
        _ invitation: InboxInvitation,
        acknowledgement key: String,
        _ perform: @escaping (String) async throws -> Void
    ) async {
        guard !busyIDs.contains(invitation.id) else { return }
        busyIDs.insert(invitation.id)
        actionMessageKey = nil
        actionNotice = nil
        defer { busyIDs.remove(invitation.id) }

        do {
            try await perform(invitation.id)
            items.removeAll { $0.id == invitation.id }
            actionNotice = LessonNotice(
                message: I18n.t(key, ["name": invitation.teacherDisplayName]),
                tone: .success
            )
        } catch is CancellationError {
            // The screen went away mid-write. Whether the server applied it is
            // unknown, so nothing is claimed in either direction: the row stays
            // and the next `load()` settles it.
            return
        } catch let error as ApiError {
            actionMessageKey = Self.messageKey(for: error)
            // A 404 says the same thing a 409 does — the invitation this row
            // stands for is gone — so it gets the same treatment: explain, then
            // re-read rather than leave a dead control on screen.
            //
            // The row is dropped here rather than left to the re-read, because
            // the re-read is not guaranteed to be the thing that drops it: a read
            // already in flight makes `load()` decline, and one sent before the
            // server settled this invitation would carry the row back anyway. The
            // server has just told us this one cannot be answered, which is the
            // one fact the list can act on without asking again.
            if error.code == .conflict || error.code == .notFound {
                items.removeAll { $0.id == invitation.id }
                await load()
            }
        } catch {
            actionMessageKey = "auth.error.server"
        }
    }

    /// Authored Swedish per error code — the server's own `message` is English
    /// written for a developer and never reaches the screen (PLAN.md §6).
    private static func messageKey(for error: ApiError) -> String {
        switch error.code {
        case .conflict, .notFound: return "inbox.error.conflict"
        case .network, .timeout: return "auth.error.network"
        case .rateLimit: return "auth.error.rateLimit"
        default: return "auth.error.server"
        }
    }
}
