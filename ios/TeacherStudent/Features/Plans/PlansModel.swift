import Foundation
import Observation

/// The Planer list (IA §3.11) — port of `web/plans/plans.service.ts` and the
/// state half of `plans.component.ts`.
///
/// One loading flag and one error for the whole screen, the way the web service
/// carries them: a Plan list has exactly one read, so a per-row spinner would be
/// inventing a granularity the API does not have.
@MainActor
@Observable
final class PlansModel {
    private(set) var items: [Plan] = []
    private(set) var isLoading = false
    /// A failed READ the reader waited for — the first load, or the retry on the
    /// error screen. Only that kind of failure may take over the screen, and only
    /// when there is nothing on it to lose.
    private(set) var error: ApiError?
    /// A failed SILENT re-read, the one that runs when the list reappears after a
    /// push. Kept apart from `error` because it must never become the error page:
    /// a reader with no Plans at all would otherwise come back from a detail
    /// screen offline and find their correct empty list replaced by a full-page
    /// failure that no amount of retrying can clear — the list is empty either
    /// way. Programs, Bibliotek and Stallet split their read failures the same
    /// way, for the same reason.
    private(set) var refreshError: ApiError?
    /// A failed CREATE, which belongs to the sheet that submitted it. Folding it
    /// into `error` would put a red line over a list that is perfectly good the
    /// moment the sheet closes. The sheet copies it into its own state, so this
    /// property is a hand-off and not the thing that gets rendered.
    private(set) var createError: ApiError?
    /// True once the list has been fetched at least once, so a re-entry refresh
    /// can tell itself apart from the first load.
    private(set) var hasLoaded = false

    private let api: Api
    @ObservationIgnored private var refreshTask: Task<Void, Never>?

    init(api: Api = .shared) {
        self.api = api
    }

    /// A read that failed with NOTHING to fall back on — the only failure that
    /// earns the whole screen.
    var showsPageError: Bool { error != nil && items.isEmpty }

    /// A read that failed while rows were on screen. They stay, under a line
    /// saying they may be out of date.
    var showsStaleNotice: Bool {
        (refreshError != nil || error != nil) && !items.isEmpty
    }

    func loadIfNeeded() async {
        guard !hasLoaded else { return }
        await load()
    }

    /// A silent refresh on re-entry, so a Plan archived on its detail screen
    /// does not linger under Aktiva after Back. Fire-and-forget: the standing
    /// list keeps rendering while it runs, and a failure lands in `refreshError`,
    /// which the view states above the rows and never instead of them.
    func refresh() {
        guard hasLoaded, refreshTask == nil else { return }
        refreshTask = Task { [weak self] in
            await self?.load(silent: true)
            self?.refreshTask = nil
        }
    }

    /// `GET /plans`. Ordered by the server (`status ASC, created_at DESC`); the
    /// view only partitions.
    ///
    /// `silent` re-reads under whatever is already on screen: no spinner, and a
    /// failure that lands in `refreshError` rather than `error`. It is what a
    /// re-entry and a pull-to-refresh want, because neither of them has taken the
    /// rows away first — and because an unanswered background read has not made
    /// an empty list untrue.
    func load(silent: Bool = false) async {
        if !silent { isLoading = true }
        if silent { refreshError = nil } else { error = nil }
        do {
            items = try await api.plans.list()
            // A read that answered settles both failures, whichever one was
            // standing: the list on screen is now the server's.
            error = nil
            refreshError = nil
            hasLoaded = true
        } catch is CancellationError {
            // The reader left the screen mid-request. Nothing failed, so
            // nothing is reported — an error recorded here would meet them on
            // their way back in.
            isLoading = false
            return
        } catch {
            if silent {
                refreshError = PlanCopy.apiError(error)
            } else {
                self.error = PlanCopy.apiError(error)
            }
        }
        isLoading = false
    }

    /// `POST /plans`. Returns the created Plan so the caller can land the reader
    /// on it — §3.11's "creating one takes you to it".
    func create(
        title: String,
        description: String?,
        startDate: String?,
        endDate: String?,
        primaryTeacherId: String?
    ) async -> Plan? {
        isLoading = true
        createError = nil
        defer { isLoading = false }
        do {
            let plan = try await api.plans.create(
                title: title,
                description: description,
                startDate: startDate,
                endDate: endDate,
                primaryTeacherId: primaryTeacherId
            )
            items.insert(plan, at: 0)
            return plan
        } catch is CancellationError {
            return nil
        } catch {
            let failure = PlanCopy.apiError(error)
            createError = failure
            // 409: the list this sheet was opened over is stale, which §4 calls
            // a recoverable conflict rather than a failure. Re-read it so the
            // reader's next attempt is a decision about the Plans that actually
            // exist — silently, because the reader is looking at a form, not at
            // the list, and a fetch they did not ask for must not spin over it or
            // leave a read failure behind on the screen they return to.
            if failure.code == .conflict { await load(silent: true) }
            return nil
        }
    }
}

/// The Teachers the create form offers as Primary Teacher.
///
/// Kept beside the Plan models rather than folded into them because it is a
/// different read with a different failure: a Plan list that loads while the
/// Teacher list fails should still render. IA §3.11 says the field disappears
/// when there is nobody to pick, so an empty list and a failed one look the
/// same to the form — neither can offer a choice.
@MainActor
@Observable
final class PlanTeacherOptions {
    private(set) var teachers: [Teacher] = []
    /// True once the read has settled either way. The form waits for this
    /// before deciding to hide the field, so it never flickers a picker in.
    private(set) var isResolved = false

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    func load() async {
        do {
            teachers = try await api.teachers.list()
        } catch {
            teachers = []
        }
        isResolved = true
    }
}
