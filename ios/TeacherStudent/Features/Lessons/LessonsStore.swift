import Foundation
import Observation

/// Owns the reader's Lessons as observable state — the port of
/// `web/lessons/lessons.service.ts`.
///
/// Every mutation reloads the list. That is not caution: `POST`, `PATCH` and
/// the transition/program endpoints answer a plain `Lesson`, which carries
/// neither `role` nor `counterpartyDisplayName` — those are projections of the
/// READER, and a write does not know who is reading. So the authoritative row
/// shape only ever comes back from `GET /lessons`.
@MainActor
@Observable
final class LessonsStore {
    private(set) var items: [LessonForUser] = []
    private(set) var isLoading = false
    private(set) var error: ApiError?
    /// False until the first `load()` has settled, so the list can tell "still
    /// fetching" from "genuinely empty" (IA §4).
    private(set) var hasLoaded = false

    private let api: Api
    @ObservationIgnored private var refreshTask: Task<Void, Never>?

    init(api: Api = .shared) {
        self.api = api
    }

    /// What `create` answers. The Lesson exists either way; `incomplete` says a
    /// follow-up attach or PATCH failed, which is fixable from the detail view.
    struct CreateOutcome {
        let lesson: Lesson
        let incomplete: Bool
    }

    /// `silent` keeps `isLoading` down for a reload the reader did not ask for,
    /// so a re-entry refresh cannot swap a standing list for a spinner.
    func load(silent: Bool = false) async {
        if let result = await run(silent: silent, { [api] in try await api.lessons.list() }) {
            items = result
        }
        // A cancelled read settled NOTHING. Flipping `hasLoaded` on the way out
        // would let the empty state claim a conclusion the server never gave —
        // and the reader would meet "Inga lektioner än" on their way back in.
        guard !Task.isCancelled else { return }
        hasLoaded = true
    }

    /// A silent reload on re-entry, so a Lesson cancelled on its detail screen
    /// does not linger here still reading "Bokad". Fire-and-forget, guarded on
    /// "already loaded once" so it never doubles the first fetch, and on an
    /// in-flight refresh so a fast Back/Forward cannot stack requests.
    func refresh() {
        guard hasLoaded, refreshTask == nil else { return }
        refreshTask = Task { [weak self] in
            await self?.load(silent: true)
            self?.refreshTask = nil
        }
    }

    /// Book a Lesson in the order IA §3.7 specifies: Student, time, Horse, Plan,
    /// then one or more Programs.
    ///
    /// Two of those the create contract cannot take in one call, so this method
    /// owns the follow-ups rather than leaking them into the view:
    ///
    /// - `POST /lessons` accepts a single `programId`, but the IA asks for *one
    ///   or more*. The first goes in the create body; the rest are attached
    ///   afterwards. Each attach COPIES that Program's Exercises in.
    /// - `POST /lessons` has no `horseId` at all, so the Horse is a PATCH.
    ///
    /// Returns nil when the create itself failed. Losing the booking because a
    /// Program could not be attached would be the worse outcome, so a failed
    /// follow-up keeps the Lesson — but it must not be reported as a clean
    /// success either, which is why the first failure is captured as it happens
    /// and restored onto `error` at the end. `run` clears `error` at the START
    /// of every call, so without that the closing `load()` would erase it and
    /// the user would be told the booking was complete.
    func create(
        studentId: String,
        scheduledAt: String,
        planId: String?,
        horseId: String?,
        programIds: [String]
    ) async -> CreateOutcome? {
        let firstProgram = programIds.first
        let restPrograms = Array(programIds.dropFirst())

        guard let created = await run({ [api] in
            try await api.lessons.create(
                studentId: studentId,
                scheduledAt: scheduledAt,
                planId: planId,
                programId: firstProgram
            )
        }) else { return nil }

        var firstFailure: ApiError?
        for programId in restPrograms {
            let ok = await run({ [api] in
                _ = try await api.lessons.attachProgram(id: created.id, programId: programId)
            })
            if ok == nil, firstFailure == nil { firstFailure = error }
        }
        if let horseId, !horseId.isEmpty {
            let ok = await run({ [api] in
                _ = try await api.lessons.update(id: created.id, horseId: .set(horseId))
            })
            if ok == nil, firstFailure == nil { firstFailure = error }
        }

        await load()
        if let firstFailure { error = firstFailure }
        return CreateOutcome(lesson: created, incomplete: firstFailure != nil)
    }

    /// What a single-Lesson read settled on.
    ///
    /// An optional cannot carry this. The detail view draws THREE different
    /// screens — the Lesson, "den finns inte", and "vi kunde inte ta reda på
    /// det" — and an optional collapses the last two into the first's absence.
    /// That is how a student on a flaky connection ends up being told their
    /// booked lesson does not exist.
    enum LoadOneOutcome {
        case loaded(LessonForUser)
        /// 404 — missing, or not ours; the server answers the same for both,
        /// which is leak-safe and which this app renders identically. Final:
        /// retrying cannot change it.
        case notFound
        /// Anything else — 500, a timeout, no network. Says nothing about
        /// whether the Lesson exists, so the only honest exit is a retry.
        case failed
        /// The reader left mid-flight and `ApiClient` aborted the request.
        /// Not an outcome to render: the screen it belonged to is gone.
        case cancelled
    }

    /// Fetch one Lesson from `GET /lessons/:id` and merge it into `items`, so a
    /// pushed `Route.lesson(id:)` resolves on a cold screen without first
    /// pulling the whole list.
    ///
    /// Written out rather than routed through `run` because the classification
    /// is the point: `run` answers "did it work", and this caller has to know
    /// *how* it failed.
    func loadOne(id: String) async -> LoadOneOutcome {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            let result = try await api.lessons.get(id: id)
            if let at = items.firstIndex(where: { $0.id == id }) {
                items[at] = result
            } else {
                items.append(result)
            }
            return .loaded(result)
        } catch is CancellationError {
            return .cancelled
        } catch let apiError as ApiError {
            // A 404 is not an error STATE, it is a final answer, and the view
            // has a whole screen for it. Recording it on `error` would raise
            // the failure banner on top of that screen as well.
            guard apiError.code != .notFound else { return .notFound }
            error = apiError
            return .failed
        } catch {
            self.error = ApiError.transport(error, traceId: nil)
            return .failed
        }
    }

    /// Resolve a single Lesson from what is already loaded — no round-trip.
    func lesson(id: String) -> LessonForUser? {
        items.first { $0.id == id }
    }

    @discardableResult
    func update(
        id: String,
        scheduledAt: String? = nil,
        horseId: PatchField<String> = .unchanged,
        planId: PatchField<String> = .unchanged
    ) async -> Lesson? {
        guard let result = await run({ [api] in
            try await api.lessons.update(id: id, scheduledAt: scheduledAt, horseId: horseId, planId: planId)
        }) else { return nil }
        await load()
        return result
    }

    @discardableResult
    func addExercise(lessonId: String, exerciseId: String) async -> [LessonExerciseRef]? {
        guard let result = await run({ [api] in
            try await api.lessons.addExercise(id: lessonId, exerciseId: exerciseId)
        }) else { return nil }
        await load()
        return result
    }

    @discardableResult
    func removeExercise(lessonId: String, exerciseId: String) async -> [LessonExerciseRef]? {
        guard let result = await run({ [api] in
            try await api.lessons.removeExercise(id: lessonId, exerciseId: exerciseId)
        }) else { return nil }
        await load()
        return result
    }

    @discardableResult
    func attachProgram(lessonId: String, programId: String) async -> Lesson? {
        guard let result = await run({ [api] in
            try await api.lessons.attachProgram(id: lessonId, programId: programId)
        }) else { return nil }
        await load()
        return result
    }

    @discardableResult
    func detachProgram(lessonId: String, programId: String) async -> Lesson? {
        guard let result = await run({ [api] in
            try await api.lessons.detachProgram(id: lessonId, programId: programId)
        }) else { return nil }
        await load()
        return result
    }

    @discardableResult
    func transition(id: String, target: LessonTransitionTarget) async -> Lesson? {
        guard let result = await run({ [api] in
            try await api.lessons.transition(id: id, target: target)
        }) else { return nil }
        await load()
        return result
    }

    func clearError() {
        error = nil
    }

    /// The port of the framework's `request(loading, error, fn)`: one place that
    /// raises the loading flag, clears the previous error, and maps a thrown
    /// transport failure onto `ApiError` so no view ever sees a raw `Error`.
    @discardableResult
    private func run<Value>(
        silent: Bool = false,
        _ work: @escaping () async throws -> Value
    ) async -> Value? {
        if !silent { isLoading = true }
        error = nil
        defer { isLoading = false }
        do {
            return try await work()
        } catch is CancellationError {
            // `ApiClient` throws this when the reader left the screen and the
            // request was aborted. NOTHING failed, so nothing is recorded: an
            // error painted onto a view that is already gone is a failure the
            // reader would meet on their way back in, for an action they took
            // by leaving.
            return nil
        } catch let apiError as ApiError {
            error = apiError
            return nil
        } catch {
            self.error = ApiError.transport(error, traceId: nil)
            return nil
        }
    }
}
