import Foundation
import Observation

/// Owns the dashboard payload for one mount of Hem — the port of the `Async`
/// holder `home.component.ts` keeps as an instance field.
///
/// **The payload belongs to the view, not to a shared service, and that is a
/// security property rather than a style preference.** A service cached for the
/// process outlives the account it was fetched for: sign out, sign in as someone
/// else, and a "load once" guard would serve user B the counterparty names, horse
/// names, plan titles and note bodies of user A, with no request ever made on
/// their behalf. State owned by the view dies with the view.
///
/// The price, recorded so it is not rediscovered as a bug: returning to Hem
/// refetches. For a page whose whole subject is "what needs me today?" — and
/// which prints how old its own payload is — a stale answer is the worse outcome.
///
/// **And that price has to be paid on every appearance, not only on the first.**
/// A tab's `@State` model survives tab switches, so a "load once" guard here
/// would be the same bug the web deleted from `home.component.ts` (:133-142):
/// accept an invitation in Inkorg, come back, and Hem still says one is waiting;
/// log a pass and it never appears. So `.task` calls `reload()` — one request per
/// appearance against a view-shaped endpoint, with the previous payload left on
/// screen while it runs, which is why a refetch never flashes the loading state.
@MainActor
@Observable
final class HomeViewModel {
    private(set) var view: DashboardView?
    private(set) var isLoading = false
    private(set) var error: ApiError?
    /// True once a request has settled, whichever way. Never returns to false, so
    /// it answers "has this page ever had an answer", not "is it loading".
    private(set) var hasResolved = false

    /// The reader's clock, frozen per load rather than read inside a derivation.
    ///
    /// A clock read during rendering would flip a goal's overdue marker or
    /// re-word a relative timestamp on a signal nothing subscribed to. The web
    /// freezes at mount; here it is refreshed at the start of each load, because
    /// a tab's view model can live for days while a web component cannot, and a
    /// day-old "today" would mark goals overdue that are not.
    ///
    /// Never `view.generatedAt`: that is the SERVER's assembly clock and answers
    /// exactly one question, how old this payload is.
    private(set) var now = Date()

    /// The reader's local calendar DAY — the only thing goal overdue may be
    /// derived against.
    var todayISO: String { I18n.formatIsoDate(now) }

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    // MARK: - Derived state

    /// Which of the four page states applies.
    ///
    /// `failed` is only true when the error left us with NOTHING. This is the one
    /// deviation from the web's `homeState` call site, and it is what IA §3.1's
    /// "preserve available blocks and show a scoped retry, not a page-level
    /// failure" asks for: a refresh that fails keeps the last good blocks on
    /// screen under an inline error strip, rather than replacing a working
    /// dashboard with an apology. With no payload in hand the state is `unknown`
    /// exactly as on the web — an empty state may never stand in for an
    /// unanswered one.
    var state: HomeCopy.State {
        HomeCopy.state(view, resolved: hasResolved, failed: error != nil && view == nil)
    }

    var blocks: [HomeCopy.Block] {
        guard let view, state == .ready else { return [] }
        return HomeCopy.visibleBlocks(view)
    }

    var quickActions: [HomeCopy.QuickAction] {
        guard let view, state == .ready else { return [] }
        return HomeCopy.quickActions(view.capabilities)
    }

    var pendingInvitations: Int { view?.pendingInvitations ?? 0 }

    /// Whether the pending-invitation banner is on screen.
    ///
    /// `ready` only. In `invited` the lede already carries the same sentence and
    /// the welcome state already carries the same action, so showing it there
    /// would be a second exit from a state whose whole job is to have one.
    var showsInviteBanner: Bool {
        state == .ready && pendingInvitations > 0
    }

    /// The page lede — a different answer per state, and no greeting by name
    /// anywhere: the session carries an email address, and greeting someone by
    /// their email is worse than not greeting them.
    var lede: String? {
        switch state {
        case .ready: return I18n.t("home.lede")
        case .invited: return HomeCopy.invitationsMessage(pendingInvitations)
        case .fresh, .unknown: return nil
        }
    }

    var updatedLabel: String? {
        guard let view, state == .ready else { return nil }
        return HomeCopy.updatedLabel(generatedAt: view.generatedAt, now: now)
    }

    /// The first load has nothing to show under it, so it gets the full-page
    /// treatment; a refresh over existing content does not.
    var showsInitialLoading: Bool { isLoading && view == nil }

    /// A failed read with nothing in hand — the page-level error+retry.
    var showsPageError: Bool { error != nil && view == nil }

    /// A failed refresh over content that still stands — the scoped retry.
    var showsScopedError: Bool { error != nil && view != nil }

    // MARK: - Loading

    /// The one read: the appearance load, the retry IA §4 requires on every read,
    /// and the pull-to-refresh, which are the same request and must behave the
    /// same way. No "at most once" guard — see the type docs; Hem is worthless
    /// stale.
    func reload() async {
        await fetch()
    }

    private func fetch() async {
        isLoading = true
        now = Date()
        do {
            // Assigned only on success: a failed refresh keeps the last good
            // payload on screen under the scoped error strip.
            view = try await api.dashboard.get()
            error = nil
        } catch is CancellationError {
            // The reader left Hem before the answer arrived. That is not a
            // failure and it is not an answer either: recording an error would
            // put a retry strip on a page nobody is looking at, and resolving
            // would let the "you have nothing" states render off the back of a
            // request that was never completed.
            isLoading = false
            return
        } catch let apiError as ApiError {
            error = apiError
        } catch {
            self.error = ApiError(status: nil, code: .unknown, message: "\(error)")
        }
        isLoading = false
        hasResolved = true
    }
}
