import Foundation
import Observation

/// The Mål list (IA §3.13) — port of `web/goals/goals.service.ts` and the state
/// half of `goals.component.ts`.
///
/// Three reads, not one. A Goal row states who it is shared with and which
/// Plans it belongs to, and both of those arrive as ids: `sharedTeacherIds` and
/// `planIds`. Names come from `GET /teachers` and `GET /plans`, so the list
/// waits for all three to SETTLE — including failing — before it renders rows.
/// A row that briefly says "Delad med" and then names two teachers is a worse
/// answer than a row that arrives complete.
@MainActor
@Observable
final class GoalsModel {
    private(set) var items: [Goal] = []
    private(set) var isLoading = false
    private(set) var error: ApiError?

    /// id → title, for `planMembership`. A Plan missing from this map is one
    /// this reader cannot resolve; its name is omitted rather than guessed.
    private(set) var planTitles: [String: String] = [:]
    /// id → display name, for the sharing chip.
    private(set) var teacherNames: [String: String] = [:]
    /// True once the two name reads have settled, either way. Rows are held
    /// until then; a name read that FAILED still resolves this, because a chip
    /// that can only count is still better than an empty screen.
    private(set) var namesResolved = false

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            items = try await api.goals.list()
        } catch is CancellationError {
            // The reader left Mål before the list landed and `ApiClient`
            // cancelled the request. Nothing failed, so no error is recorded —
            // and `namesResolved` stays down, because a list whose names never
            // arrived must not start rendering rows that cannot state their
            // audience.
            return
        } catch {
            self.error = GoalCopy.apiError(error)
        }

        // Both name reads are allowed to fail without failing the page: a Goal
        // list with unnamed plans still tells you what you are working toward.
        let plans = (try? await api.plans.list()) ?? []
        let teachers = (try? await api.teachers.list()) ?? []
        planTitles = Dictionary(
            plans.map { ($0.id, $0.title) },
            uniquingKeysWith: { first, _ in first }
        )
        teacherNames = Dictionary(
            teachers.map { ($0.id, $0.displayName) },
            uniquingKeysWith: { first, _ in first }
        )
        namesResolved = true
    }

    func create(
        title: String,
        description: String?,
        targetDate: String?,
        horseId: String?
    ) async -> Goal? {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            let goal = try await api.goals.create(
                title: title,
                description: description,
                targetDate: targetDate,
                horseId: horseId
            )
            items.insert(goal, at: 0)
            return goal
        } catch is CancellationError {
            // The sheet went away mid-write. Whether the Goal was created is
            // unknown, but an error the reader cannot see and did not cause is
            // not worth recording — the list re-reads on its next visit.
            return nil
        } catch {
            self.error = GoalCopy.apiError(error)
            return nil
        }
    }
}

/// The stable, for the horse picker on a new Goal.
///
/// Its own read with its own settled flag: IA §3.13 hides the horse field when
/// the stable is empty, and a failed read is indistinguishable from an empty
/// stable as far as the form is concerned — neither can offer a horse.
@MainActor
@Observable
final class GoalHorseOptions {
    private(set) var horses: [Horse] = []
    private(set) var isResolved = false

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    /// Only un-archived horses are offerable on a NEW Goal.
    var selectable: [Horse] { GoalCopy.selectableHorses(horses) }

    func load() async {
        do {
            horses = try await api.horses.list()
        } catch is CancellationError {
            // Not an answer: the sheet closed mid-read. Left un-resolved so the
            // horse field is never hidden on the strength of a read that was
            // never allowed to finish.
            return
        } catch {
            // A failed read IS an answer as far as this form goes — neither it
            // nor an empty stable can offer a horse.
            horses = []
        }
        isResolved = true
    }
}
