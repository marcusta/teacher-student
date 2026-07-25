import Foundation
import Observation

/// Owns the signed-in Teacher's Library as observable state — the port of
/// `web/library/library.service.ts`.
///
/// It carries both the list and the currently-open Exercise, exactly as the web
/// service does. Each screen holds its own instance (SwiftUI `@State` replaces
/// the web's injected singleton), so a detail screen's `exercise` can never be
/// the list screen's.
@Observable
@MainActor
final class LibraryStore {
    private(set) var items: [Exercise] = []
    private(set) var isLoading = false

    /// Three failure properties, not one, because one property cannot say which
    /// screen state a failure warrants (the split `InboxViewModel` makes between
    /// `loadError` and `actionMessageKey`, with the reload case added):
    ///
    /// - `loadError` — a read the reader asked for. Only earns the full-screen
    ///   error state when there is nothing on screen to lose.
    /// - `refreshError` — the silent reload that runs when the list reappears
    ///   after a push. It must never replace a populated list with an error
    ///   page: the rows are still true, the update simply did not arrive.
    /// - `writeError` — a create/update/archive. It belongs to the form or the
    ///   button that issued it; the list behind it is intact and must keep
    ///   rendering as a list.
    private(set) var loadError: ApiError?
    private(set) var refreshError: ApiError?
    private(set) var writeError: ApiError?

    /// Distinguishes "no exercises" from "not asked yet" — the web's `resolved`
    /// signal. Without it an unanswered list renders as an empty library.
    private(set) var hasResolved = false

    /// The Exercise open in the detail screen, and how its read went.
    private(set) var exercise: Exercise?
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
    var showsStaleNotice: Bool {
        (refreshError != nil || loadError != nil) && !items.isEmpty
    }

    // MARK: - List

    func loadIfNeeded() async {
        guard !hasResolved else { return }
        await load()
    }

    /// `silent` keeps the rows on screen while re-reading — used when the list
    /// reappears after a push, where a full-screen spinner over content the
    /// reader is already looking at would be a regression, not a state. Its
    /// failures land in `refreshError` for the same reason.
    func load(silent: Bool = false) async {
        if !silent { isLoading = true }
        if silent { refreshError = nil } else { loadError = nil }
        do {
            items = try await api.exercises.list()
            loadError = nil
            refreshError = nil
        } catch is CancellationError {
            // The reader left the screen, so the request was dropped — nothing
            // failed and nothing is reported. `hasResolved` stays as it was, so
            // the next visit asks again instead of calling the library empty.
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

    /// Returns the created Exercise so the caller can name it in its
    /// acknowledgement.
    ///
    /// It deliberately leaves `isLoading` alone: that flag describes the LIST's
    /// read, and driving it from a write replaced the rows behind the creation
    /// sheet with a spinner for the duration of a POST they are not waiting on.
    func create(name: String, description: String) async -> Exercise? {
        writeError = nil
        do {
            let created = try await api.exercises.create(name: name, description: description)
            // `list()` is ordered created_at DESC — prepend.
            items.insert(created, at: 0)
            return created
        } catch is CancellationError {
            return nil
        } catch {
            writeError = Self.apiError(error)
            return nil
        }
    }

    // MARK: - Detail

    func loadExercise(id: String) async {
        detailState = .loading
        loadError = nil
        do {
            let loaded = try await api.exercises.get(id: id)
            exercise = loaded
            detailState = .ready
        } catch is CancellationError {
            // Left mid-read. `detailState` stays `.loading`, which is what the
            // screen was doing when it was abandoned — an error state here would
            // be waiting for a reader who has already gone.
            return
        } catch let apiError as ApiError {
            loadError = apiError
            detailState = CatalogLoadState.from(apiError)
        } catch {
            loadError = Self.apiError(error)
            detailState = .failed
        }
    }

    func update(id: String, name: String, description: String) async -> Exercise? {
        writeError = nil
        do {
            let updated = try await api.exercises.update(id: id, name: name, description: description)
            exercise = updated
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
    /// The endpoint is `DELETE /exercises/:id` and the HTTP verb deliberately
    /// lies: the handler archives, because `lesson_exercise` and
    /// `training_session_exercise` rows are the record of what was actually
    /// ridden and the Notes hanging off them have no FK to cascade through. The
    /// Exercise leaves this list and every picker; it stays attached to every
    /// occasion that already used it. The copy this backs has to say that.
    func archive(id: String) async -> Bool {
        writeError = nil
        do {
            _ = try await api.exercises.delete(id: id)
            items.removeAll { $0.id == id }
            return true
        } catch is CancellationError {
            return false
        } catch {
            writeError = Self.apiError(error)
            return false
        }
    }

    private static func apiError(_ error: Error) -> ApiError {
        (error as? ApiError)
            ?? ApiError(status: nil, code: .unknown, message: error.localizedDescription)
    }
}

/// The roster behind the Övningshistorik picker (§3.5 detail step 4).
///
/// Four states, because "you have no students yet" is a claim about the world
/// and only one of the three non-ready cases supports it. Reading it off
/// `items.isEmpty` alone asserts it while the roster is still in flight and,
/// worse, asserts it when the request failed — a teacher with a full roster and
/// a dropped connection would be told they have no students, with nothing to
/// retry.
@Observable
@MainActor
final class LibraryRosterStore {
    enum State: Equatable {
        case loading
        case failed
        /// The roster ANSWERED and is empty — not "we have not asked yet".
        case noStudents
        case ready
    }

    private(set) var students: [Student] = []
    private(set) var state: State = .loading

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    func load() async {
        state = .loading
        do {
            students = try await api.students.list()
            state = students.isEmpty ? .noStudents : .ready
        } catch is CancellationError {
            // Left mid-read: not a failure, and the roster picker it feeds is on
            // its way off screen. Reporting `.failed` here would tell a teacher
            // their student list is broken because they navigated away.
            return
        } catch {
            students = []
            state = .failed
        }
    }
}
