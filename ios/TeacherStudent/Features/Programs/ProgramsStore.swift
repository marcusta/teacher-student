import Foundation
import Observation

/// Owns the signed-in Teacher's Programs (reusable Exercise routines) as
/// observable state — the port of `web/programs/programs.service.ts`.
///
/// Mirrors `LibraryStore` for Exercises: same pattern, distinct entity. It also
/// carries the open Program's Exercise sequence and the picker's source library,
/// because those three reads are one screen's state and separating them would
/// only move the coordination into the view.
@Observable
@MainActor
final class ProgramsStore {
    // MARK: - List

    private(set) var items: [Program] = []
    private(set) var isLoading = false

    /// Three failure properties, not one — same split as `LibraryStore`, for the
    /// same reason: a read the reader waited for, a silent reload behind rows
    /// that are still on screen, and a write that belongs to the control that
    /// issued it are three different screen states, and one `error` property can
    /// only ever be one of them.
    ///
    /// `writeError` covers the writes that resolve in one go — create, update,
    /// archive. The BUILDER mutations deliberately do not use it: they suspend a
    /// second time before returning, and a shared slot cannot survive that. See
    /// `ProgramBuilderWrite`.
    private(set) var loadError: ApiError?
    private(set) var refreshError: ApiError?
    private(set) var writeError: ApiError?

    /// Distinguishes "no programs" from "not asked yet".
    private(set) var hasResolved = false

    /// Exercise count per Program id. An ABSENT entry means "not known", which
    /// is not the same as zero — `GET /programs` carries no count, so each row's
    /// number is a separate read that can fail on its own.
    private(set) var exerciseCounts: [String: Int] = [:]

    // MARK: - Detail / builder

    private(set) var program: Program?
    private(set) var detailState: CatalogLoadState = .loading
    /// Exercises attached to the open Program, sort_order ASC.
    private(set) var exercises: [ProgramExerciseRef] = []
    /// The sequence was asked for and did not answer. The SAME distinction
    /// `libraryFailed` makes below, and needed for the same reason: the last
    /// sequence read stays published on failure, so "the program has no
    /// exercises" would otherwise be asserted about a program whose exercises
    /// merely could not be fetched — and, because this read runs after every
    /// builder mutation, asserted about a sequence that was on screen a moment
    /// ago and has not changed.
    private(set) var exercisesFailed = false
    /// The Teacher's full Exercise library — the picker's source.
    private(set) var availableExercises: [Exercise] = []

    /// Whether `GET /exercises` has answered SUCCESSFULLY, with a list. The
    /// picker's explanatory sentence must not say "your library is empty" about
    /// a library that has simply not replied yet.
    private(set) var libraryLoaded = false
    /// The library was asked and did not answer. Distinct from `!libraryLoaded`,
    /// which is also true while the request is still in flight.
    private(set) var libraryFailed = false

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

    /// `silent` re-reads under the rows already on screen — used when the list
    /// reappears after a push. Its failures land in `refreshError`, which is a
    /// banner over the rows and never the error page: a background read that did
    /// not arrive has not made the visible list untrue.
    func load(silent: Bool = false) async {
        if !silent { isLoading = true }
        if silent { refreshError = nil } else { loadError = nil }
        do {
            items = try await api.programs.list()
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
        await loadCounts()
    }

    /// One count per Program, gathered in parallel. A count that failed is
    /// simply absent, so its row renders without one — reporting an unknown
    /// count as 0 would say the Program is empty, which is a different and
    /// possibly false claim.
    private func loadCounts() async {
        let programs = items
        guard !programs.isEmpty else {
            exerciseCounts = [:]
            return
        }
        let programsApi = api.programs
        var next: [String: Int] = [:]
        await withTaskGroup(of: Optional<(String, Int)>.self) { group in
            for program in programs {
                group.addTask {
                    do {
                        let refs = try await programsApi.listExercises(id: program.id)
                        return (program.id, refs.count)
                    } catch {
                        return nil
                    }
                }
            }
            for await result in group {
                if let result { next[result.0] = result.1 }
            }
        }
        exerciseCounts = next
    }

    /// Returns the created Program so the caller can name it.
    ///
    /// It deliberately leaves `isLoading` alone: that flag describes the LIST's
    /// read, and driving it from a write replaced the rows behind the creation
    /// sheet with a spinner for the duration of a POST they are not waiting on.
    func create(title: String, description: String) async -> Program? {
        writeError = nil
        do {
            let created = try await api.programs.create(title: title, description: description)
            // `list()` is ordered created_at DESC — prepend.
            items.insert(created, at: 0)
            exerciseCounts[created.id] = 0
            return created
        } catch is CancellationError {
            return nil
        } catch {
            writeError = Self.apiError(error)
            return nil
        }
    }

    // MARK: - Detail

    func loadProgram(id: String) async {
        detailState = .loading
        loadError = nil
        do {
            let loaded = try await api.programs.get(id: id)
            program = loaded
            detailState = .ready
        } catch is CancellationError {
            // Left mid-read. `detailState` stays `.loading`, which is what the
            // screen was doing when it was abandoned — an error state here would
            // be waiting for a reader who has already gone.
            return
        } catch let apiError as ApiError {
            loadError = apiError
            detailState = CatalogLoadState.from(apiError)
            return
        } catch {
            loadError = Self.apiError(error)
            detailState = .failed
            return
        }
        await loadExercises(id: id)
        await loadAvailableExercises()
    }

    func update(id: String, title: String, description: String) async -> Program? {
        writeError = nil
        do {
            let updated = try await api.programs.update(id: id, title: title, description: description)
            program = updated
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
    /// The endpoint is `DELETE /programs/:id` and the HTTP verb deliberately
    /// lies: past Lessons and Training Sessions reference the Program through
    /// `lesson_program` / `source_program_id` to render their "från program X"
    /// provenance, and a cascade would erase it. The Program leaves this list
    /// and every picker; the copied Exercises and the provenance on occasions
    /// that already used it survive.
    func archive(id: String) async -> Bool {
        writeError = nil
        do {
            _ = try await api.programs.delete(id: id)
            items.removeAll { $0.id == id }
            exerciseCounts[id] = nil
            return true
        } catch is CancellationError {
            return false
        } catch {
            writeError = Self.apiError(error)
            return false
        }
    }

    // MARK: - Builder

    /// Publishes the open Program's sequence and reports whether it ANSWERED.
    ///
    /// It does NOT publish `[]` on failure. This helper runs after every builder
    /// mutation, so blanking on failure means a successful remove followed by a
    /// dropped reload erases the entire visible sequence and offers the add
    /// picker over rows the teacher can no longer see. Keeping the last known
    /// sequence and raising `exercisesFailed` lets the builder say "this may be
    /// out of date" instead of the false "this program is empty".
    func loadExercises(id: String) async {
        do {
            exercises = try await api.programs.listExercises(id: id)
            exercisesFailed = false
        } catch is CancellationError {
            return
        } catch {
            exercisesFailed = true
        }
    }

    /// Publishes the picker source and reports whether the library ANSWERED.
    /// It deliberately does not publish `[]` on failure: the picker's
    /// explanatory sentence must be able to tell "your library is empty" from
    /// "the library did not reply", and only this distinction lets it.
    func loadAvailableExercises() async {
        do {
            availableExercises = try await api.exercises.list()
            libraryLoaded = true
            libraryFailed = false
        } catch is CancellationError {
            // Left mid-read: the picker's note must not say the library could
            // not be fetched because the reader walked away from it.
            return
        } catch {
            libraryLoaded = false
            libraryFailed = true
        }
    }

    func addExercise(programId: String, exerciseId: String) async -> ProgramBuilderWrite {
        await mutateBuilder(programId: programId) {
            _ = try await self.api.programs.addExercise(id: programId, exerciseId: exerciseId)
        }
    }

    func reorder(programId: String, exerciseIds: [String]) async -> ProgramBuilderWrite {
        await mutateBuilder(programId: programId) {
            _ = try await self.api.programs.reorderExercises(id: programId, exerciseIds: exerciseIds)
        }
    }

    /// Rewrite one row's instructional note (IA §3.6). Blank clears it — the
    /// builder sends `nil` for an emptied field and the contract's `notes` is
    /// required-but-nullable, so "no note" has exactly one representation.
    func updateNotes(
        programId: String,
        exerciseId: String,
        notes: String?
    ) async -> ProgramBuilderWrite {
        await mutateBuilder(programId: programId) {
            _ = try await self.api.programs.updateExerciseNotes(
                id: programId,
                exerciseId: exerciseId,
                notes: notes
            )
        }
    }

    func removeExercise(programId: String, exerciseId: String) async -> ProgramBuilderWrite {
        await mutateBuilder(programId: programId) {
            _ = try await self.api.programs.removeExercise(id: programId, exerciseId: exerciseId)
        }
    }

    /// Every builder mutation has the same shape, including the part that
    /// matters: a 409.
    ///
    /// A conflict means the sequence on screen is a stale copy — the Program was
    /// edited elsewhere, or the row this write names is already gone. IA §4 wants
    /// that recoverable rather than reported as a breakage, and the recovery IS
    /// the re-read, so the sequence is fetched on conflict exactly as it is on
    /// success. Only the sentence differs, and it travels back with the call.
    private func mutateBuilder(
        programId: String,
        _ perform: () async throws -> Void
    ) async -> ProgramBuilderWrite {
        do {
            try await perform()
        } catch is CancellationError {
            return .cancelled
        } catch {
            let failure = Self.apiError(error)
            if failure.code == .conflict { await loadExercises(id: programId) }
            return .failed(failure)
        }
        await loadExercises(id: programId)
        return .ok
    }

    private static func apiError(_ error: Error) -> ApiError {
        (error as? ApiError)
            ?? ApiError(status: nil, code: .unknown, message: error.localizedDescription)
    }
}

/// How one builder mutation ended — with its failure ATTACHED, not left behind
/// in a property for the caller to fetch afterwards.
///
/// A builder write suspends twice: once on the request, and again on the re-read
/// that IS the conflict recovery. A caller that reported its failure by reading
/// a shared `writeError` after its own `await` therefore read it a suspension
/// too late. A second row control tapped in that window cleared the slot as its
/// first act, and the first caller resumed to find nothing there — so a 409 on
/// "flytta ner" was announced as no sentence at all, which is the one outcome §4
/// forbids for a refused write. Carrying the error in the return value makes the
/// failure belong to the call that produced it, whatever else ran meanwhile.
enum ProgramBuilderWrite {
    case ok
    /// The reader left mid-write. Nothing failed, so nothing is said — and the
    /// caller must not read it as success either: the write may or may not have
    /// landed, and no acknowledgement can honestly be shown for it.
    case cancelled
    case failed(ApiError)
}
