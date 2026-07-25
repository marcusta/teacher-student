import Foundation
import Observation

/// Owns the signed-in Student's stable of Horses as observable state — the port
/// of `web/stable/stable.service.ts`.
///
/// Mirrors `LibraryStore`: list plus the currently-open Horse, each screen
/// holding its own instance.
///
/// **Three error slots, not one.** A stable nobody could fetch, a stable that is
/// on screen but one refresh out of date, and a write the server refused are
/// three different situations, and a single `error` made all three render as the
/// same full-screen failure: returning from a Horse on a flaky connection
/// replaced a fully populated stable with an error page, and a create that
/// failed inside the sheet did the same to the list behind it the moment the
/// sheet closed. `InboxViewModel` splits its read failure from its action
/// message for exactly this reason.
@Observable
@MainActor
final class StableStore {
    private(set) var items: [Horse] = []
    private(set) var isLoading = false
    /// A failed FOREGROUND read — the first load, or a retry from the error
    /// state. The only one allowed to take over the screen, and only while
    /// there is nothing on it.
    private(set) var loadError: ApiError?
    /// A failed SILENT reload — re-entry from a Horse, or pull-to-refresh. The
    /// rows it failed to replace are still the last thing the server said, so
    /// this is stated ABOVE them and never instead of them.
    private(set) var refreshError: ApiError?
    /// A failed create/update/archive. Belongs to the form that submitted it:
    /// `items` is untouched by a rejected write, so the list has nothing to
    /// report.
    private(set) var writeError: ApiError?
    /// Distinguishes "no horses" from "not asked yet".
    private(set) var hasResolved = false

    private(set) var horse: Horse?
    private(set) var detailState: CatalogLoadState = .loading

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    /// A read that failed with NOTHING to fall back on — the only failure that
    /// earns the whole screen.
    var showsPageError: Bool { loadError != nil && items.isEmpty }

    /// A read that failed while rows were on screen. They stay, under a line
    /// saying they may be out of date.
    ///
    /// BOTH slots, exactly as `LibraryStore` and `ProgramsStore` do it. Keying
    /// this on `refreshError` alone made a failed foreground read over a
    /// populated stable say nothing at all: `showsPageError` withholds the error
    /// page while rows are up, so the banner is the only place left for it.
    var showsStaleNotice: Bool {
        (refreshError != nil || loadError != nil) && !items.isEmpty
    }

    // MARK: - List

    func loadIfNeeded() async {
        guard !hasResolved else { return }
        await load()
    }

    func load(silent: Bool = false) async {
        if !silent { isLoading = true }
        if silent { refreshError = nil } else { loadError = nil }
        do {
            // Filtered and re-sorted locally too — the view must not depend on
            // an ordering it does not state.
            items = StableCopy.activeHorses(try await api.horses.list())
            // A read that landed answers for both kinds of read: whatever the
            // previous attempt failed to tell us, this one just did.
            loadError = nil
            refreshError = nil
        } catch is CancellationError {
            // The reader left the screen mid-request. Nothing failed, so
            // nothing is reported and nothing is marked resolved — recording an
            // error here would greet them with a banner about a fetch they
            // walked away from.
            isLoading = false
            return
        } catch {
            if silent {
                refreshError = Self.apiError(error)
            } else {
                loadError = Self.apiError(error)
            }
        }
        isLoading = false
        hasResolved = true
    }

    /// Returns the created Horse so the caller can name it.
    func create(name: String) async -> Horse? {
        isLoading = true
        writeError = nil
        defer { isLoading = false }
        do {
            let created = try await api.horses.create(name: name)
            // `list()` is ordered created_at DESC — prepend.
            items.insert(created, at: 0)
            return created
        } catch is CancellationError {
            return nil
        } catch {
            let failure = Self.apiError(error)
            writeError = failure
            // 409: the stable this sheet was opened over is stale, so the
            // refusal is recoverable rather than broken (IA §4). Re-read it
            // silently, so the reader's next attempt is a decision about what
            // is actually in the stable.
            if failure.code == .conflict { await load(silent: true) }
            return nil
        }
    }

    // MARK: - Detail

    func loadHorse(id: String) async {
        detailState = .loading
        loadError = nil
        do {
            let loaded = try await api.horses.get(id: id)
            horse = loaded
            // An archived Horse reached by a stale link is not part of the
            // stable any more, and §3.15 gives it the same treatment as one that
            // never existed — the edit form must not be offered for it.
            detailState = StableCopy.isArchived(loaded) ? .notFound : .ready
        } catch is CancellationError {
            // Left before the Horse arrived. The screen is going away, so it
            // keeps its loading state rather than flashing a failure at a
            // reader who is already somewhere else.
            return
        } catch let apiError as ApiError {
            loadError = apiError
            detailState = CatalogLoadState.from(apiError)
        } catch {
            loadError = Self.apiError(error)
            detailState = .failed
        }
    }

    func update(id: String, name: String) async -> Horse? {
        isLoading = true
        writeError = nil
        defer { isLoading = false }
        do {
            let updated = try await api.horses.update(id: id, name: name)
            horse = updated
            items = items.map { $0.id == id ? updated : $0 }
            return updated
        } catch is CancellationError {
            return nil
        } catch {
            writeError = Self.apiError(error)
            return nil
        }
    }

    /// Archive, not delete — and named for what it does.
    ///
    /// The endpoint is `DELETE /horses/:id` and the HTTP verb deliberately lies:
    /// `horses.api.ts` calls `HorseService.archive`, because Lessons and
    /// Training Sessions that reference a Horse have to survive its removal. The
    /// Horse leaves this list and every picker for NEW occasions; it stays
    /// attached to the ones already ridden. The copy this backs has to say that.
    func archive(id: String) async -> Bool {
        isLoading = true
        writeError = nil
        defer { isLoading = false }
        do {
            _ = try await api.horses.delete(id: id)
            items.removeAll { $0.id == id }
            return true
        } catch is CancellationError {
            return false
        } catch {
            writeError = Self.apiError(error)
            return false
        }
    }

    /// The models catch `Error` but store `ApiError`, so a view has one shape to
    /// render. Anything that is not already an `ApiError` can only have come
    /// from the transport.
    private static func apiError(_ error: Error) -> ApiError {
        (error as? ApiError) ?? ApiError.transport(error, traceId: nil)
    }
}

/// The confirmation a screen that DISMISSES itself cannot show.
///
/// Archiving a Horse removes the very object `HorseDetailView` is about, so the
/// screen navigates back — and a banner on a view being torn down is a banner
/// nobody reads. IA §4 still wants the acknowledgement, so it is left here for
/// the stable list, which is where the reader lands.
///
/// One process-wide box rather than a callback because the shell owns the
/// navigation stack and resolves `Route.horse` itself: a pushed detail has no
/// closure back to the list that pushed it, and each screen holds its own
/// `StableStore`.
@MainActor
@Observable
final class StableHandover {
    static let shared = StableHandover()

    private var pending: String?

    private init() {}

    func post(_ message: String) {
        pending = message
    }

    /// Consumed exactly once. A confirmation about something that happened
    /// minutes ago must not replay on a later visit to the stable.
    func take() -> String? {
        defer { pending = nil }
        return pending
    }
}
