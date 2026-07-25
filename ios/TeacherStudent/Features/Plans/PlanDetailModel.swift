import Foundation
import Observation

/// One Plan and everything hanging off it (IA §3.12) — port of the state half of
/// `web/plans/plan-detail.component.ts`.
///
/// The extra reads are OWNER-ONLY on purpose. A connected Teacher needs nothing
/// but `GET /plans/:id`: they cannot attach Goals (so the Goal list would be
/// unusable) and they cannot set a Primary Teacher (so the Teacher list would be
/// unused). Loading them anyway would be two requests spent to render nothing.
@MainActor
@Observable
final class PlanDetailModel {
    private(set) var detail: PlanDetail?
    /// True once the first read has settled. Distinguishes "still loading" from
    /// "loaded and there is nothing" — §4 wants those to look different.
    private(set) var isResolved = false
    private(set) var isLoading = false
    private(set) var error: ApiError?

    /// The owner's own Goals, for the attach picker and for deriving what is
    /// already linked. Empty for a Teacher, who cannot see them.
    private(set) var ownerGoals: [Goal] = []
    /// Candidates for Primary Teacher. Empty for a Teacher.
    private(set) var teachers: [Teacher] = []

    /// Who is reading. Set by the view from the session before it loads.
    var currentUserId: String?

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    // MARK: - Derived

    /// Ownership decides every control on the screen, and it is decided by one
    /// comparison: the Plan belongs to the signed-in account or it does not.
    /// A Teacher who has no Relation never reaches this view — the server 404s.
    var viewer: PlanCopy.Viewer {
        guard let detail, let currentUserId, detail.studentId == currentUserId else {
            return .connectedTeacher
        }
        return .owner
    }

    var controls: PlanCopy.Controls {
        PlanCopy.controls(viewer: viewer, status: detail?.status ?? .active)
    }

    var isArchived: Bool { detail?.status == .archived }

    /// Linked Goal ids taken from the GOAL side, never from `detail.goals` —
    /// that array is privacy-filtered, so using it would let the picker offer a
    /// Goal that is already attached and silently do nothing.
    var linkedGoalIds: [String] {
        guard let detail else { return [] }
        return PlanCopy.linkedGoalIds(ownerGoals, planId: detail.id)
    }

    var attachableGoals: [Goal] {
        PlanCopy.attachableGoals(ownerGoals, linkedGoalIds: linkedGoalIds)
    }

    // MARK: - Reads

    func load(id: String) async {
        isLoading = true
        error = nil
        do {
            let plan = try await api.plans.get(id: id)
            detail = plan
            if plan.studentId == currentUserId {
                await loadOwnerExtras()
            }
        } catch is CancellationError {
            // The reader left before the Plan arrived. Marking the read
            // resolved would paint the error state over a screen that was
            // simply abandoned, so this settles nothing and reports nothing.
            isLoading = false
            return
        } catch {
            detail = nil
            self.error = PlanCopy.apiError(error)
        }
        isLoading = false
        isResolved = true
    }

    /// The two owner-only side reads. Their failures are deliberately NOT the
    /// page's error: the Plan itself loaded, and a Goal picker that could not
    /// populate is a missing control, not a broken page.
    private func loadOwnerExtras() async {
        ownerGoals = (try? await api.goals.list()) ?? []
        teachers = (try? await api.teachers.list()) ?? []
    }

    /// Re-read after a mutation. Keeps `isResolved` and leaves the not-found
    /// path alone — a refresh that 404s means the Plan went away under us, which
    /// is the same answer as a first read that 404s.
    ///
    /// Returns whether the screen now holds the server's copy, so the caller can
    /// keep "the write landed" and "the screen is current" as the two separate
    /// facts they are.
    @discardableResult
    private func reload(id: String) async -> Bool {
        do {
            detail = try await api.plans.get(id: id)
            if detail?.studentId == currentUserId {
                ownerGoals = (try? await api.goals.list()) ?? []
            }
            return true
        } catch is CancellationError {
            // The reader left while the re-read was in flight. There is nobody
            // to caveat the screen to, so this is not a staleness to report.
            return true
        } catch {
            self.error = PlanCopy.apiError(error)
            return false
        }
    }

    // MARK: - Writes

    /// How a write ended, in the only terms the reader can act on.
    ///
    /// Four cases rather than a Bool, because a Bool cannot tell the two middle
    /// ones apart from the ends — and getting them wrong is not cosmetic. A write
    /// that landed and could not be re-read is NOT a failed save: told it failed,
    /// the reader presses Spara again and either writes twice or is refused by a
    /// server that already has the change. A cancelled write is not an answer at
    /// all; the reader has left the screen.
    enum WriteOutcome {
        /// The write landed and the screen now shows what the server holds.
        case saved
        /// The write landed; the confirming re-read did not. Everything the
        /// reader asked for happened — what is on screen may just be older than
        /// it looks.
        case savedStale
        case failed
        /// The reader left mid-write. Nothing is claimed, nothing is shown.
        case cancelled
    }

    /// `PATCH /plans/:id`. Every nullable field travels as value-or-null so a
    /// cleared date actually clears — an omitted key would silently keep it.
    func save(
        id: String,
        title: String,
        description: String?,
        startDate: String?,
        endDate: String?,
        primaryTeacherId: String?
    ) async -> WriteOutcome {
        await mutate(id: id) { [api] in
            _ = try await api.plans.update(
                id: id,
                title: title,
                description: .value(description),
                startDate: .value(startDate),
                endDate: .value(endDate),
                primaryTeacherId: .value(primaryTeacherId)
            )
        }
    }

    /// Attach from the Plan side. The write itself is on the GOAL resource —
    /// `POST /goals/:id/plans/:planId` — because the link belongs to the Goal.
    func attachGoal(goalId: String, planId: String) async -> WriteOutcome {
        await mutate(id: planId) { [api] in
            try await api.goals.attachPlan(id: goalId, planId: planId)
        }
    }

    func detachGoal(goalId: String, planId: String) async -> WriteOutcome {
        await mutate(id: planId) { [api] in
            try await api.goals.detachPlan(id: goalId, planId: planId)
        }
    }

    /// Archive. Not a delete: the Lessons, Sessions and Goals keep pointing at
    /// the Plan, and the reader keeps reading it.
    func archive(id: String) async -> WriteOutcome {
        await mutate(id: id) { [api] in
            try await api.plans.archive(id: id)
        }
    }

    /// Every write follows the same arc: clear the last error, run, re-read.
    /// The re-read is what keeps the header's status pill, the Mål section and
    /// the archived notice consistent after a mutation — the PATCH answers with
    /// a `Plan`, which does not carry the three linked lists.
    ///
    /// A 409 re-reads too, and that is the whole point of it: the write was
    /// refused because this screen is holding a copy someone else has moved on
    /// from — a Plan archived on another device, most obviously. IA §4 wants
    /// that recoverable, so the current Plan is fetched before the reader is
    /// told anything, and by the time the message renders the screen already
    /// shows the state the message is about.
    ///
    /// The write's own outcome is settled BEFORE the re-read and never revised by
    /// it. The two are different questions — "did the server take my change" and
    /// "is this screen current" — and answering the first with the second is how
    /// a reader is told their save failed, presses Spara again, and writes twice
    /// or is refused a change the server already has.
    private func mutate(id: String, _ work: @escaping () async throws -> Void) async -> WriteOutcome {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            try await work()
        } catch is CancellationError {
            // The reader left mid-write. Nothing is settled here — no error, no
            // flag — because everything on this screen is read by somebody who is
            // no longer on it, and an error left behind would be waiting for them
            // when they come back.
            return .cancelled
        } catch {
            let failure = PlanCopy.apiError(error)
            self.error = failure
            if failure.code == .conflict {
                // `reload` only writes `error` when it fails itself, so a
                // successful refetch leaves the conflict standing — which is
                // what the view has to render.
                await reload(id: id)
            }
            return .failed
        }
        // Past this line the change is committed, whatever the re-read does.
        return await reload(id: id) ? .saved : .savedStale
    }
}
