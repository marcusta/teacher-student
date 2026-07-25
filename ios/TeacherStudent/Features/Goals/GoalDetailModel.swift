import Foundation
import Observation

/// One Goal (IA §3.14) — port of the state half of
/// `web/goals/goal-detail.component.ts`.
///
/// The two readers of this screen need almost disjoint data, which is why the
/// loads branch on role rather than fetching everything and hiding half:
///
/// * The **owner** needs their Plans (to attach), their Teachers and the current
///   shares (to manage sharing), and their stable (to change the horse).
/// * A **shared Teacher** needs the Student's name — they are the note thread's
///   recipient — and the titles of the Plans this Goal belongs to. They must
///   not learn who else it is shared with, so `GET /goals/:id/shares` is never
///   called for them. `GoalTeacherView` does not even carry the ids.
@MainActor
@Observable
final class GoalDetailModel {
    private(set) var detail: GoalTeacherView?
    private(set) var isResolved = false
    private(set) var isLoading = false
    private(set) var error: ApiError?

    /// A 409 — someone else moved this Goal while this copy sat open. Held
    /// separately from `error` because the fix is different: re-read, do not
    /// retry.
    private(set) var hasConflict = false

    /// A write LANDED but the read that was supposed to confirm it did not, so
    /// the Goal on screen may no longer be the Goal on the server. Held apart
    /// from `error` because it is not a failed write and must never be reported
    /// as one — see `reload`.
    private(set) var isStale = false

    // Owner-only
    private(set) var plans: [Plan] = []
    private(set) var teachers: [Teacher] = []
    private(set) var shares: [SharedTeacherRef] = []
    /// True once `GET /goals/:id/shares` has answered. Until then the sharing
    /// switches must not commit anything — binding setters fire while state is
    /// still settling, and an unguarded switch would unshare every Teacher the
    /// moment the list arrived.
    private(set) var sharesSeeded = false
    private(set) var ownerPlansResolved = false
    private(set) var horses: [Horse] = []

    // Shared-teacher only
    private(set) var studentName: String?
    /// Plan id → title, for the header chips. Only the Plans that resolved.
    private(set) var planTitles: [String: String] = [:]
    /// True once whatever this reader needs in order to NAME the note thread's
    /// audience has settled. The thread does not mount before it — §4.5 forbids
    /// offering a shared state whose audience cannot be stated.
    private(set) var recipientsResolved = false

    var currentUserId: String?

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    // MARK: - Derived

    var viewer: GoalCopy.Viewer {
        guard let detail, let currentUserId, detail.studentId == currentUserId else {
            return .sharedTeacher
        }
        return .owner
    }

    var controls: GoalCopy.Controls { GoalCopy.controls(viewer: viewer) }

    var transitions: GoalCopy.Transitions {
        GoalCopy.transitions(status: detail?.status ?? .active, viewer: viewer)
    }

    /// Who a note written here would reach. The owner writes to the Teachers
    /// they shared with; a Teacher writes to the Student. Empty until resolved,
    /// which disables sharing in the composer rather than offering an unnamed
    /// audience.
    var noteRecipients: [ShareRecipient] {
        switch viewer {
        case .owner:
            return shares.map { ShareRecipient(id: $0.teacherId, name: $0.displayName) }
        case .sharedTeacher:
            guard let detail, let studentName, !studentName.isEmpty else { return [] }
            return [ShareRecipient(id: detail.studentId, name: studentName)]
        }
    }

    var attachablePlans: [Plan] {
        GoalCopy.attachablePlans(plans, linkedPlanIds: detail?.planIds ?? [])
    }

    /// The horse picker's options: un-archived horses, plus this Goal's own
    /// horse even if archived, so saving an unrelated edit cannot drop it.
    var horseChoices: [Horse] {
        let current = detail?.horseId.flatMap { id in horses.first { $0.id == id } }
        return GoalCopy.horseChoices(horses, current: current)
    }

    var sharedTeacherIds: [String] { shares.map(\.teacherId) }

    // MARK: - Reads

    func load(id: String) async {
        isLoading = true
        error = nil
        isStale = false
        defer { isLoading = false }
        do {
            let goal = try await api.goals.get(id: id)
            detail = goal
            hasConflict = false
            if goal.studentId == currentUserId {
                try await loadOwnerContext(id: id)
            } else {
                try await loadTeacherContext(goal)
            }
            isResolved = true
        } catch is CancellationError {
            // The reader left the screen and `ApiClient` cancelled what was in
            // flight. Nothing failed, so nothing is recorded — and the HALF
            // seeded context is thrown away rather than kept: shares that never
            // arrived would otherwise sit here as an empty audience and state
            // "Privat" about a Goal that is shared (§4.5). Back to unloaded, so
            // returning to the screen reads it again.
            resetToUnloaded()
        } catch {
            detail = nil
            self.error = GoalCopy.apiError(error)
            recipientsResolved = true
            isResolved = true
        }
    }

    /// Everything a load seeds, put back. Only ever called for a cancellation:
    /// a real failure keeps its error and its resolved flags so the screen can
    /// say what went wrong.
    private func resetToUnloaded() {
        detail = nil
        isResolved = false
        isStale = false
        recipientsResolved = false
        sharesSeeded = false
        ownerPlansResolved = false
        shares = []
        plans = []
        teachers = []
        horses = []
        planTitles = [:]
        studentName = nil
    }

    private func loadOwnerContext(id: String) async throws {
        plans = try await optionalRead { [api] in try await api.plans.list() } ?? []
        ownerPlansResolved = true
        teachers = try await optionalRead { [api] in try await api.teachers.list() } ?? []
        horses = try await optionalRead { [api] in try await api.horses.list() } ?? []
        planTitles = Dictionary(plans.map { ($0.id, $0.title) }, uniquingKeysWith: { first, _ in first })
        try await loadShares(id: id)
        recipientsResolved = true
    }

    /// A context read that is ALLOWED to fail without failing the screen — a
    /// Plan this reader cannot resolve is simply not named, and a stable that
    /// did not answer only costs the horse picker.
    ///
    /// Cancellation is the one thing it does not swallow. `ApiClient` throws
    /// `CancellationError` when the reader leaves mid-request, and treating that
    /// as "the server had nothing" would seed an empty audience or an empty Plan
    /// set that no later visit repairs — the caller unwinds instead.
    private func optionalRead<T>(_ work: () async throws -> T) async throws -> T? {
        do {
            return try await work()
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            return nil
        }
    }

    /// The Teacher's context. Plan titles are fetched one by one because a
    /// Teacher has no `GET /plans` of someone else's Plans — and each fetch is
    /// allowed to fail: a Plan this Teacher cannot read is simply not named.
    /// It is never rendered as a raw id.
    private func loadTeacherContext(_ goal: GoalTeacherView) async throws {
        let student = try await optionalRead { [api] in try await api.students.get(id: goal.studentId) }
        studentName = student?.displayName
        var titles: [String: String] = [:]
        for planId in goal.planIds {
            if let plan = try await optionalRead({ [api] in try await api.plans.get(id: planId) }) {
                titles[planId] = plan.title
            }
        }
        planTitles = titles
        recipientsResolved = true
    }

    private func loadShares(id: String) async throws {
        shares = try await optionalRead { [api] in try await api.goals.listShares(id: id) } ?? []
        // A FAILED lookup seeds the gate too: the audience is unknown and will
        // stay unknown, and holding the sharing section forever would be worse
        // than saying so. A CANCELLED one does not get here — it unwinds.
        sharesSeeded = true
    }

    /// Re-read the Goal after a write, to show what the server now holds.
    ///
    /// This runs AFTER the server has already accepted something, which decides
    /// how its own failure is recorded: as `isStale`, never as `error`. A failed
    /// confirmation is a stale-content problem, and calling it a failed write
    /// would tell the reader their change was rejected and invite them to send
    /// it again — a second achieve, a second detach, or a 409 answering the
    /// change they themselves just made.
    private func reload(id: String) async {
        do {
            let goal = try await api.goals.get(id: id)
            detail = goal
            if goal.studentId == currentUserId {
                plans = try await optionalRead { [api] in try await api.plans.list() } ?? []
                planTitles = Dictionary(plans.map { ($0.id, $0.title) }, uniquingKeysWith: { first, _ in first })
            } else {
                try await loadTeacherContext(goal)
            }
            isStale = false
        } catch is CancellationError {
            // The reader left while the re-read was in flight. The write itself
            // already landed, so there is nothing to report and nothing here to
            // repair — the next visit reads the Goal fresh. Not even `isStale`:
            // a screen nobody is on has no content to warn about, and the flag
            // would be waiting for them when they came back.
        } catch {
            isStale = true
        }
    }

    // MARK: - Writes

    /// What a write did — three answers, because two of them must not be told
    /// to the reader as the third.
    ///
    /// `ok` means the SERVER accepted it, and nothing that happens afterwards
    /// downgrades it; `isStale` carries the separate news that the confirming
    /// read did not land. `cancelled` is the reader leaving mid-write: nothing
    /// is known, so nothing is claimed and nothing is painted onto a screen
    /// they are no longer on.
    enum WriteResult {
        case ok
        case failed
        case cancelled
    }

    func save(
        id: String,
        title: String,
        description: String?,
        targetDate: String?,
        horseId: String?
    ) async -> WriteResult {
        await mutate(id: id) { [api] in
            _ = try await api.goals.update(
                id: id,
                title: title,
                description: .value(description),
                horseId: .value(horseId),
                targetDate: .value(targetDate)
            )
        }
    }

    func achieve(id: String) async -> WriteResult {
        await mutate(id: id) { [api] in try await api.goals.achieve(id: id) }
    }

    func reopen(id: String) async -> WriteResult {
        await mutate(id: id) { [api] in try await api.goals.reopen(id: id) }
    }

    func abandon(id: String) async -> WriteResult {
        await mutate(id: id) { [api] in try await api.goals.abandon(id: id) }
    }

    func attachPlan(id: String, planId: String) async -> WriteResult {
        await mutate(id: id) { [api] in try await api.goals.attachPlan(id: id, planId: planId) }
    }

    func detachPlan(id: String, planId: String) async -> WriteResult {
        await mutate(id: id) { [api] in try await api.goals.detachPlan(id: id, planId: planId) }
    }

    /// Share or unshare one Teacher. Anything but `ok` puts the switch back
    /// where it was — a switch that stays on after a write that did not land
    /// claims a Teacher can see this Goal when they cannot.
    func setShare(id: String, teacherId: String, shared: Bool) async -> WriteResult {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            if shared {
                try await api.goals.share(id: id, teacherId: teacherId)
            } else {
                try await api.goals.unshare(id: id, teacherId: teacherId)
            }
        } catch is CancellationError {
            return .cancelled
        } catch {
            // The same classification every other write gets: a 409 here means
            // the audience changed under this copy — someone unshared from
            // another device, or the connection was revoked — and re-sending the
            // same POST would not fix it. It raises the re-read banner, not a
            // generic "det gick inte".
            record(error)
            return .failed
        }
        // The re-read is what puts the switch back on the SERVER's answer. It
        // cannot unmake the share that just landed, so its own failure does not
        // change the answer here — `loadShares` swallows it, and the switch
        // falls back to the last known audience.
        try? await loadShares(id: id)
        return .ok
    }

    /// After a conflict, the way forward is a fresh read.
    func resolveConflict(id: String) async {
        hasConflict = false
        await load(id: id)
    }

    /// Every write goes through here: send it, then re-read the Goal so the
    /// screen shows what the server now holds.
    ///
    /// The two halves are reported apart on purpose. The result describes the
    /// WRITE and nothing else — a re-read that fails afterwards sets `isStale`
    /// and leaves `ok` standing, because the server has already committed the
    /// change and no amount of trouble reading it back makes that untrue.
    private func mutate(id: String, _ work: @escaping () async throws -> Void) async -> WriteResult {
        isLoading = true
        error = nil
        isStale = false
        defer { isLoading = false }
        do {
            try await work()
        } catch is CancellationError {
            // The reader left before the write was answered. Whether it landed
            // is genuinely unknown, so nothing is recorded and nothing is
            // claimed — the next visit reads the Goal fresh and shows the truth.
            return .cancelled
        } catch {
            record(error)
            return .failed
        }
        await reload(id: id)
        return .ok
    }

    /// What a failed write MEANS, in one place, so every write on this screen
    /// answers the same way.
    ///
    /// A 409 is not a failure to retry — the Goal moved while this copy sat open
    /// — so it raises the re-read banner instead of the same button again. The
    /// cancellation guard is a backstop: the callers already peel that case off
    /// before they get here, because the reader left and painting an error over
    /// a screen nobody is on would greet them with it on return.
    private func record(_ error: Error) {
        if error is CancellationError { return }
        let apiError = GoalCopy.apiError(error)
        if GoalCopy.isConflict(apiError) {
            hasConflict = true
        } else {
            self.error = apiError
        }
    }
}
