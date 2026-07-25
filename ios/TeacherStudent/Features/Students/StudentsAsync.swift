import Foundation
import Observation

/// One independently-loading slice of a view. Port of `web/students/async.ts`.
///
/// IA §3.3 and §3.4 ask for the same thing in different words: "Students and
/// invitations load independently; one failing must not erase the other", and
/// "Each tab owns its loading, empty, and error state." A single model with one
/// shared loading/error pair cannot express either, so state is per-fetch and a
/// screen owns as many holders as it has sections.
///
/// `isResolved` is separate from `isLoading` because "finished, and the answer
/// was nothing" and "not asked yet" are different states, and only the first may
/// render an empty state. Without it every section flashes its empty copy in the
/// moment before its request goes out.
@Observable
@MainActor
final class AsyncSection<Value> {
    private(set) var data: Value?
    private(set) var isLoading = false
    private(set) var error: ApiError?
    /// True once a fetch has completed, successfully or not.
    private(set) var isResolved = false

    private var started = false

    init() {}

    var hasFailed: Bool { error != nil }

    /// Whether the failure means "not yours" rather than "broken". Read off
    /// `ApiError.code`, which now carries `.notFound`/`.forbidden` in their own
    /// right rather than folding them into `.server`.
    var isNotFound: Bool { StudentCopy.isNotFound(error) }

    /// True when the section resolved to nothing, and nothing went wrong.
    func isEmpty(_ count: (Value) -> Int) -> Bool {
        guard isResolved, error == nil else { return false }
        guard let data else { return true }
        return count(data) == 0
    }

    /// Run the fetch. Errors land in `error`, never thrown — a section that
    /// cannot load is a state this view renders, not an exception it propagates.
    ///
    /// `data` survives a failure, exactly as the web holder keeps its last good
    /// value: a retry that fails must not blank a list the reader was reading.
    func run(_ work: () async throws -> Value) async {
        started = true
        isLoading = true
        error = nil
        do {
            data = try await work()
        } catch is CancellationError {
            // `ApiClient` cancels in-flight requests when the reader leaves the
            // screen, and a request nobody waited for did not fail. So nothing
            // is recorded: no `error` (the section would render a retry for an
            // answer it never asked to keep) and no `isResolved` (it would
            // render an empty state for an answer that never arrived). `started`
            // rewinds too, so a later `runOnce` — the same screen re-entered —
            // fetches instead of resting on a request that was thrown away.
            started = false
            isLoading = false
            return
        } catch let apiError as ApiError {
            error = apiError
        } catch {
            self.error = ApiError(status: nil, code: .unknown, message: String(describing: error))
        }
        isLoading = false
        isResolved = true
    }

    /// Run once. Elevvy's tabs load on first activation, and switching back to a
    /// tab must not refetch — the tab row is navigation, not a refresh button.
    func runOnce(_ work: () async throws -> Value) async {
        guard !started else { return }
        await run(work)
    }

    /// Force the next `runOnce` to fetch again. Used by the retry action.
    func reset() {
        started = false
    }

    /// Write the loaded value directly — the web's `data.set(…)`, used where a
    /// mutation already knows the new row and refetching the whole list to learn
    /// it would blank the section the reader is looking at.
    func set(_ value: Value) {
        data = value
        started = true
        isResolved = true
    }
}

extension AsyncSection {
    /// Convenience for the list sections, whose emptiness is just `count == 0`.
    func isEmptyList<Element>() -> Bool where Value == [Element] {
        isEmpty { $0.count }
    }

    /// The list, or `[]` while it is unknown.
    func items<Element>() -> [Element] where Value == [Element] {
        data ?? []
    }
}
