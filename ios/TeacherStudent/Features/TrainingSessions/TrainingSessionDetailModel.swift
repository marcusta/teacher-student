import Foundation
import Observation

/// The one-line confirmations the detail view shows after a write.
///
/// The web says these in a toast with an optional undo action. Core has no toast
/// component, so the same sentences are an inline notice the view owns — which
/// keeps `trainingSession.toast.*` copy and, importantly, keeps the **undo**
/// path after detaching a Program (IA §3.10: detaching leaves the copied
/// Exercises behind, so the undo has to re-attach the Program, not re-create the
/// work).
enum TrainingSessionNotice: Equatable {
    case detailsSaved
    case sharingSaved
    case programDetached(programId: String, title: String)

    var message: String {
        switch self {
        case .detailsSaved: return I18n.t("trainingSession.saved")
        case .sharingSaved: return I18n.t("trainingSession.sharing.saved")
        case .programDetached(_, let title):
            return I18n.t("trainingSession.toast.programDetached", ["title": title])
        }
    }
}

/// **Träningspass, the detail** (IA §3.10) — port of
/// `TrainingSessionDetailComponent`'s resolve/mutate cycle over
/// `TrainingSessionsService`.
///
/// Two rules run through everything below:
///
/// 1. **Ownership decides, not account type.** `viewer` is derived by comparing
///    `session.studentId` to the signed-in user's id. The same person is the
///    owner here and a shared Teacher on the next session over. Every control
///    asks `controls`, never "am I a teacher".
/// 2. **A write never silently refetches.** Each mutation folds the server's
///    answer into `session` in place. A refetch would clear an error the reader
///    has not seen yet, and a 409 in particular must survive long enough to be
///    read and acted on.
@MainActor
@Observable
final class TrainingSessionDetailModel {
    let sessionId: String

    private(set) var session: TrainingSession?
    /// The first resolve has settled. Until then the view renders loading, never
    /// "not found" — §4's states are mutually exclusive for a reason.
    private(set) var resolved = false
    private(set) var notFound = false
    private(set) var isLoading = false
    private(set) var isSaving = false

    /// The page could not be READ. It earns the whole screen only when there is
    /// nothing behind it; over a session that is already on display it is the
    /// stale-read notice above the content (§4).
    private(set) var loadError: ApiError?
    /// A WRITE failed. The page still stands; the failure is stated next to the
    /// control that caused it.
    private(set) var actionError: ApiError?

    private(set) var teachers: [Teacher] = []
    /// The Teacher list did not answer. It is tracked apart from `teachers`
    /// being empty because the Delning section reads the two as opposite facts:
    /// an answered empty list says "you have no teacher yet", an unanswered one
    /// says nothing at all — and saying the first on the strength of the second
    /// would misstate who the rider can let in.
    private(set) var teachersFailed = false
    private(set) var horses: [Horse] = []
    private(set) var plans: [Plan] = []
    private(set) var exerciseCatalog: [Exercise] = []
    private(set) var programCatalog: [Program] = []
    /// The owner's display name, for a shared Teacher's note recipients.
    private(set) var studentName = ""
    /// Names are in. Until then the header withholds its sharing chip rather
    /// than claiming an unnamed audience (§4.5).
    private(set) var recipientsResolved = false

    // Details form, seeded from the loaded session.
    var whenValue = Date()
    var durationValue = ""
    var summaryValue = ""
    var horseValue = ""
    var planValue = ""
    private(set) var detailsValidation: String?

    private(set) var shareValues: [String] = []

    var notice: TrainingSessionNotice?

    private let api: Api
    @ObservationIgnored private var currentUserId: String?

    init(sessionId: String, api: Api = .shared) {
        self.sessionId = sessionId
        self.api = api
    }

    // MARK: - Derived

    var viewer: TrainingSessionViewer {
        guard let session, let currentUserId else { return .sharedTeacher }
        return session.studentId == currentUserId ? .owner : .sharedTeacher
    }

    var controls: TrainingSessionControls {
        TrainingSessionControls.forViewer(viewer)
    }

    /// A read that failed with nothing left standing — the only failure that
    /// earns the whole page (§4). Asked after `resolved` and `notFound`, which
    /// answer first: a session that is absent because nobody has asked yet, or
    /// because it genuinely is not there, is not an error.
    var showsPageError: Bool { session == nil }

    /// A read that failed while the session was already on screen: the reader
    /// asked for the current facts and did not get them. The page keeps
    /// rendering and caveats itself, because everything on it is still the last
    /// thing the server actually said — the rule the Library and Program lists
    /// spell as `showsStaleNotice`.
    var refreshFailure: ApiError? { session == nil ? nil : loadError }

    var orderedExercises: [TrainingSessionExerciseRef] {
        TrainingSessionCopy.orderedExercises(session?.exercises ?? [])
    }

    /// Who can see this session, said with names (§4.5). Held back until the
    /// name sources have settled.
    var audience: [ShareRecipient]? {
        guard recipientsResolved, let session else { return nil }
        switch viewer {
        case .owner:
            return TrainingSessionCopy.ownerRecipients(
                sharedWithTeacherIds: session.sharedWithTeacherIds,
                teachers: teachers
            )
        case .sharedTeacher:
            guard let currentUserId else { return nil }
            return TrainingSessionCopy.sharedTeacherRecipients(
                sharedWithTeacherIds: session.sharedWithTeacherIds,
                viewerId: currentUserId,
                youLabel: I18n.t("trainingSession.share.you")
            )
        }
    }

    /// Who a note written HERE reaches — which is not the same list as the
    /// header's audience. The owner writes to the Teachers they shared with; a
    /// shared Teacher writes to the Student whose log this is, and naming the
    /// Student is the honest answer for them (the other Teachers are not theirs
    /// to enumerate).
    var noteRecipients: [ShareRecipient] {
        guard let session else { return [] }
        switch viewer {
        case .owner:
            return TrainingSessionCopy.ownerRecipients(
                sharedWithTeacherIds: session.sharedWithTeacherIds,
                teachers: teachers
            )
        case .sharedTeacher:
            return [ShareRecipient(id: session.studentId, name: studentName)]
        }
    }

    /// The Student authored it if the author is the session's owner; anyone else
    /// writing here is a Teacher the session was shared with.
    func role(of note: Note) -> PersonRole {
        note.authorId == session?.studentId ? .student : .teacher
    }

    var loggableHorses: [Horse] { TrainingSessionCopy.loggableHorses(horses) }
    var loggablePlans: [Plan] { TrainingSessionCopy.loggablePlans(plans) }

    /// The Exercise picker: the student-visible catalog grouped by owning
    /// Teacher, minus what this session already contains.
    var exerciseGroups: [CatalogGroup] {
        TrainingSessionCopy.groupByTeacher(
            exerciseCatalog,
            teachers: teachers,
            excluding: Set((session?.exercises ?? []).map(\.exerciseId))
        )
    }

    var programGroups: [CatalogGroup] {
        TrainingSessionCopy.groupByTeacher(
            programCatalog,
            teachers: teachers,
            excluding: Set((session?.programs ?? []).map(\.id))
        )
    }

    /// Teachers who wrote a Program attached here but cannot see the session.
    /// The view offers the share; it never applies it on their behalf.
    var unsharedProgramOwners: [Teacher] {
        guard let session else { return [] }
        return TrainingSessionCopy.unsharedProgramOwners(
            attachedPrograms: session.programs,
            catalog: programCatalog,
            sharedWithTeacherIds: session.sharedWithTeacherIds,
            teachers: teachers
        )
    }

    func isSharing(with teacherId: String) -> Bool {
        shareValues.contains(teacherId)
    }

    // MARK: - Resolve

    func resolve(currentUserId: String?) async {
        self.currentUserId = currentUserId
        isLoading = true
        loadError = nil
        actionError = nil

        do {
            let loaded = try await api.trainingSessions.get(id: sessionId)
            notFound = false
            apply(loaded, seedForm: true)
            await loadSideData(for: loaded)
        } catch is CancellationError {
            // The reader left mid-resolve. `resolved` stays false, so coming
            // back finds the loading state rather than an error about a request
            // that was abandoned on purpose.
            isLoading = false
            return
        } catch {
            let apiError = trainingSessionError(error)
            // A not-found here is not a failure — it is the answer. It is also
            // what a Teacher gets for a session that was unshared from them,
            // which is why "not found" and "something broke" are separate
            // states. A 403 is that same answer worded differently, so it takes
            // the same screen rather than a retry that cannot succeed.
            if TrainingSessionCopy.isNotFound(apiError) {
                notFound = true
                session = nil
            } else {
                loadError = apiError
            }
            recipientsResolved = true
        }

        isLoading = false
        resolved = true
    }

    private func loadSideData(for session: TrainingSession) async {
        recipientsResolved = false
        switch viewer {
        case .owner:
            await loadTeachers()
            horses = (try? await api.horses.list()) ?? []
            plans = (try? await api.plans.list()) ?? []
            exerciseCatalog = (try? await api.exercises.listForStudent()) ?? []
            programCatalog = (try? await api.programs.listForStudent()) ?? []
        case .sharedTeacher:
            // A Teacher gets exactly one name: the Student's. Nothing else on
            // this page is theirs to edit, so nothing else is theirs to load.
            studentName = (try? await api.students.get(id: session.studentId))?.displayName ?? ""
        }
        recipientsResolved = true
    }

    /// Retryable on its own: the session is already on screen, so a Teacher list
    /// that failed is one section to repair, not a page to reload.
    func loadTeachers() async {
        do {
            teachers = try await api.teachers.list()
            teachersFailed = false
        } catch is CancellationError {
            return
        } catch {
            teachersFailed = true
        }
    }

    private func apply(_ loaded: TrainingSession, seedForm: Bool) {
        session = loaded
        // The audience always follows the server: it is committed the moment it
        // changes, so there is never local sharing state worth preserving.
        shareValues = loaded.sharedWithTeacherIds
        guard seedForm else { return }
        if let date = I18n.date(fromISO: loaded.performedAt) {
            whenValue = TrainingSessionCopy.minuteTruncated(date)
        }
        durationValue = loaded.durationMin.map(String.init) ?? ""
        summaryValue = loaded.summary ?? ""
        horseValue = loaded.horseId ?? ""
        planValue = loaded.planId ?? ""
    }

    // MARK: - Writes

    /// PATCH only what actually changed. Sending the whole form back would
    /// overwrite a field a Teacher's note never touched, and would turn every
    /// save into a potential lost update.
    func saveDetails() async {
        guard let current = session, controls.editDetails, !isSaving else { return }

        var nextDuration: Int?
        let rawDuration = durationValue.trimmingCharacters(in: .whitespaces)
        if !rawDuration.isEmpty {
            guard let parsed = Int(rawDuration), parsed >= 0 else {
                detailsValidation = I18n.t("trainingSessionCreate.error.duration")
                return
            }
            nextDuration = parsed
        }
        detailsValidation = nil

        var performedAt: String?
        let nextWhen = TrainingSessionCopy.minuteTruncated(whenValue)
        let storedWhen = I18n.date(fromISO: current.performedAt).map(TrainingSessionCopy.minuteTruncated)
        if storedWhen != nextWhen {
            performedAt = TrainingSessionCopy.isoTimestamp(nextWhen)
        }

        var duration: PatchField<Int> = .unchanged
        if nextDuration != current.durationMin { duration = .value(nextDuration) }

        let trimmedSummary = summaryValue.trimmingCharacters(in: .whitespacesAndNewlines)
        let nextSummary = trimmedSummary.isEmpty ? nil : trimmedSummary
        var summary: PatchField<String> = .unchanged
        if nextSummary != current.summary { summary = .value(nextSummary) }

        var horse: PatchField<String> = .unchanged
        let nextHorse = horseValue.isEmpty ? nil : horseValue
        if nextHorse != current.horseId { horse = .value(nextHorse) }

        var plan: PatchField<String> = .unchanged
        let nextPlan = planValue.isEmpty ? nil : planValue
        if nextPlan != current.planId { plan = .value(nextPlan) }

        guard performedAt != nil
                || !duration.isUnchanged
                || !summary.isUnchanged
                || !horse.isUnchanged
                || !plan.isUnchanged
        else { return }

        await perform(notice: .detailsSaved) {
            try await self.api.trainingSessions.update(
                id: self.sessionId,
                performedAt: performedAt,
                durationMin: duration,
                summary: summary,
                horseId: horse,
                planId: plan
            )
        }
    }

    /// The audience is committed as it is changed — a share is a trust decision,
    /// and leaving it sitting behind an unpressed Spara would make the checkbox
    /// lie about who can already see the log.
    func saveSharing(_ next: [String]) async {
        guard let current = session, controls.editSharing else { return }
        guard TrainingSessionCopy.sharingChanged(next: next, stored: current.sharedWithTeacherIds) else {
            shareValues = next
            return
        }
        shareValues = next
        await perform(notice: .sharingSaved) {
            try await self.api.trainingSessions.update(id: self.sessionId, shareWithTeacherIds: next)
        }
        // However it went, the checkbox goes back to reflecting the SERVER. A
        // write that succeeded has already folded the new audience in, so this
        // is a no-op there; a write that was refused — or abandoned, which
        // reports no error at all — must not leave the control claiming a share
        // that was never made.
        if let session { shareValues = session.sharedWithTeacherIds }
    }

    func share(with teacherId: String) async {
        guard !shareValues.contains(teacherId) else { return }
        await saveSharing(shareValues + [teacherId])
    }

    func toggleSharing(with teacherId: String) async {
        if shareValues.contains(teacherId) {
            await saveSharing(shareValues.filter { $0 != teacherId })
        } else {
            await saveSharing(shareValues + [teacherId])
        }
    }

    func addExercise(_ exerciseId: String) async {
        guard controls.editExercises, !isSaving else { return }
        await perform(notice: nil) {
            _ = try await self.api.trainingSessions.addExercise(id: self.sessionId, exerciseId: exerciseId)
            // The add endpoint answers with the occurrence list, but the note
            // threads hang off occurrence ids and the header reads the whole
            // session — so the session is re-read to keep one source of truth.
            return try await self.api.trainingSessions.get(id: self.sessionId)
        }
    }

    func removeExercise(_ exerciseId: String) async {
        guard controls.editExercises, !isSaving else { return }
        await perform(notice: nil) {
            _ = try await self.api.trainingSessions.removeExercise(
                id: self.sessionId,
                exerciseId: exerciseId
            )
            return try await self.api.trainingSessions.get(id: self.sessionId)
        }
    }

    func attachProgram(_ programId: String) async {
        guard controls.editPrograms, !isSaving else { return }
        await perform(notice: nil) {
            try await self.api.trainingSessions.attachProgram(id: self.sessionId, programId: programId)
        }
    }

    func detachProgram(_ program: AttachedProgramRef) async {
        guard controls.editPrograms, !isSaving else { return }
        await perform(notice: .programDetached(programId: program.id, title: program.title)) {
            try await self.api.trainingSessions.detachProgram(id: self.sessionId, programId: program.id)
        }
    }

    /// Returns true when the session is gone and the view should pop.
    func remove() async -> Bool {
        guard controls.remove, !isSaving else { return false }
        isSaving = true
        actionError = nil
        defer { isSaving = false }
        do {
            try await api.trainingSessions.delete(id: sessionId)
            return true
        } catch is CancellationError {
            return false
        } catch {
            actionError = trainingSessionError(error)
            return false
        }
    }

    private func perform(
        notice: TrainingSessionNotice?,
        _ write: @escaping () async throws -> TrainingSession
    ) async {
        isSaving = true
        actionError = nil
        do {
            apply(try await write(), seedForm: false)
            // The server has just answered with the current session, so a
            // standing stale-read notice is no longer true and must not outlive
            // the fact it stated.
            loadError = nil
            self.notice = notice
        } catch is CancellationError {
            // Not a failure to report — the reader left before the answer came
            // back. Nothing is folded in, and the page is re-resolved on return.
            isSaving = false
            return
        } catch {
            actionError = trainingSessionError(error)
        }
        isSaving = false
    }
}

private extension PatchField {
    var isUnchanged: Bool {
        if case .unchanged = self { return true }
        return false
    }
}
