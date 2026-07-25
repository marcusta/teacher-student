import Foundation
import Observation

/// Turns anything thrown by the API layer into the classified error the views
/// read. `ApiClient` already classifies everything it throws; this only exists so
/// a `catch` never has to fall through to an unclassified `Error`.
func trainingSessionError(_ error: Error) -> ApiError {
    (error as? ApiError) ?? ApiError.transport(error, traceId: nil)
}

/// What one optional catalog behind a picker has told us so far.
///
/// The distinction is the whole point: this slice hides a field that has nothing
/// to offer (IA §3.9 — "missing optional catalog data hides that field"), and
/// that is only honest when the emptiness is KNOWN. `failed` and `loaded` with an
/// empty list look identical from the field's side and mean opposite things —
/// one is "you have no horses", the other is "we could not ask".
enum TrainingSessionCatalogStatus: Equatable {
    /// Asked, no answer yet. Renders nothing: neither the field nor a failure.
    case loading
    case loaded
    case failed
}

/// **Träningspass, the list** (IA §3.9) — port of `TrainingSessionsService`'s
/// list half plus the component state that surrounds it.
///
/// One thing here is load-bearing and easy to lose: the list waits for BOTH the
/// sessions AND the Teacher list before it paints a row. A shared row's chip
/// names its recipients (§4.5), and names come from `teachers.list()`. Painting
/// rows the moment sessions arrive would flash "Delad: okänd mottagare" and then
/// correct itself — a wrong claim about who can see a training log, which is
/// exactly the claim §4.5 exists to keep honest.
///
/// A failure to load Teachers is NOT a failure to load the page: the sessions
/// still render, and the unresolved ids fall back to unnamed recipients behind
/// the `+N`. Only the session request can put the page into its error state.
@MainActor
@Observable
final class TrainingSessionsListModel {
    private(set) var items: [TrainingSession] = []
    private(set) var teachers: [Teacher] = []
    private(set) var isLoading = false
    private(set) var error: ApiError?

    /// Set once the Teacher request has settled, whether it succeeded or not.
    private(set) var teachersResolved = false
    private(set) var hasLoaded = false

    /// A one-line confirmation after a session is logged. The web says this in a
    /// toast; Core has no toast, so it is an inline notice the list owns.
    var notice: String?

    private let api: Api
    @ObservationIgnored private var refreshTask: Task<Void, Never>?

    init(api: Api = .shared) {
        self.api = api
    }

    /// Newest first (IA §3.9), and empty until the names are in.
    var ordered: [TrainingSession] {
        teachersResolved ? TrainingSessionCopy.sortSessions(items) : []
    }

    /// The §4 loading state: only while there is nothing to show and nothing has
    /// failed. A refresh over standing content leaves the content up.
    var showsLoading: Bool {
        (!teachersResolved || isLoading) && ordered.isEmpty && error == nil
    }

    /// The §4 empty state — reachable only once we know the list really is
    /// empty, never while we are still finding out.
    var showsEmpty: Bool {
        teachersResolved && !isLoading && error == nil && items.isEmpty
    }

    func loadIfNeeded() async {
        guard !hasLoaded else { return }
        await load()
    }

    /// A silent refresh on re-entry, so a session deleted on the detail view does
    /// not linger as a ghost row here. Fire-and-forget: the standing list keeps
    /// rendering while it runs.
    func refresh() {
        guard hasLoaded, refreshTask == nil else { return }
        refreshTask = Task { [weak self] in
            await self?.load()
            self?.refreshTask = nil
        }
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            items = try await api.trainingSessions.list()
        } catch is CancellationError {
            // The reader left; there is nobody to show an error to, and the
            // page keeps whatever it already had for when they come back.
            isLoading = false
            return
        } catch {
            self.error = trainingSessionError(error)
        }
        // Always attempted, never fatal — see the note above.
        teachers = (try? await api.teachers.list()) ?? []
        teachersResolved = true
        isLoading = false
        hasLoaded = true
    }

    /// Fold a session written elsewhere (the create sheet) into the list without
    /// a refetch, so a slow network does not make a just-logged session vanish
    /// for a second.
    func merge(_ session: TrainingSession) {
        if let index = items.firstIndex(where: { $0.id == session.id }) {
            items[index] = session
        } else {
            items.append(session)
        }
    }

    func recipients(for session: TrainingSession) -> [ShareRecipient] {
        TrainingSessionCopy.ownerRecipients(
            sharedWithTeacherIds: session.sharedWithTeacherIds,
            teachers: teachers
        )
    }
}

/// **Logga pass** (IA §3.9's creation sequence) — port of
/// `TrainingSessionCreateComponent`'s state plus the single transactional
/// `create` call underneath it.
///
/// The whole session is written in ONE request: when, duration, horse, summary,
/// plan, an optional source Program and the audience. The server copies the
/// Program's Exercises and writes the share rows in the same transaction, so
/// there is no half-created session to clean up if the app dies mid-flight —
/// which is why the sheet does not create-then-attach.
@MainActor
@Observable
final class TrainingSessionCreateModel {
    // Field order is IA §3.9's creation sequence, and the form renders it in
    // this order: when → duration → horse → summary → plan → program → sharing.
    var performedAt = Date()
    var duration = ""
    var horseId = ""
    var summary = ""
    var planId = ""
    var programId = ""
    private(set) var shareWithTeacherIds: [String] = []

    private(set) var horses: [Horse] = []
    private(set) var plans: [Plan] = []
    private(set) var programs: [Program] = []
    private(set) var teachers: [Teacher] = []

    // One status per catalog, because they fail independently: a stable that
    // did not answer must not take the sharing question down with it, and a
    // sharing question that did not answer must never read as "you have nobody
    // to share with" — that one would have the rider log a session privately
    // believing it was their only option.
    private(set) var horsesStatus: TrainingSessionCatalogStatus = .loading
    private(set) var plansStatus: TrainingSessionCatalogStatus = .loading
    private(set) var programsStatus: TrainingSessionCatalogStatus = .loading
    private(set) var teachersStatus: TrainingSessionCatalogStatus = .loading

    private(set) var isSaving = false
    private(set) var error: ApiError?
    /// Field-level copy, authored here rather than taken from the server.
    private(set) var validationMessage: String?

    private let api: Api

    init(api: Api = .shared) {
        self.api = api
    }

    /// Only horses that are still in the stable and plans that are still active
    /// — a picker that offers an archived answer is a trap the server will
    /// refuse (`assertOwnUnarchivedHorse`).
    var loggableHorses: [Horse] { TrainingSessionCopy.loggableHorses(horses) }
    var loggablePlans: [Plan] { TrainingSessionCopy.loggablePlans(plans) }

    /// The student-visible Program catalog, grouped by owning Teacher (§4.9).
    var programGroups: [CatalogGroup] {
        TrainingSessionCopy.groupByTeacher(programs, teachers: teachers)
    }

    /// The Teacher who owns the chosen Program but would not be able to see this
    /// session. IA §3.10's rule applies at creation too: OFFER the share, never
    /// force it.
    var pendingProgramOwner: Teacher? {
        guard !programId.isEmpty,
              let program = programs.first(where: { $0.id == programId })
        else { return nil }
        return TrainingSessionCopy.unsharedProgramOwners(
            attachedPrograms: [AttachedProgramRef(id: program.id, title: program.title)],
            catalog: programs,
            sharedWithTeacherIds: shareWithTeacherIds,
            teachers: teachers
        ).first
    }

    func isSharing(with teacherId: String) -> Bool {
        shareWithTeacherIds.contains(teacherId)
    }

    func toggleSharing(with teacherId: String) {
        if let index = shareWithTeacherIds.firstIndex(of: teacherId) {
            shareWithTeacherIds.remove(at: index)
        } else {
            shareWithTeacherIds.append(teacherId)
        }
    }

    /// The sharing question has ANSWERED — with a list of Teachers, or with a
    /// failure the field states out loud and offers a retry for.
    ///
    /// It is the one catalog that gates Logga pass. A stable or a plan list that
    /// has not arrived costs the rider a field they could have filled in and can
    /// still set afterwards on the session itself. The Teacher list is the one
    /// whose silence gets READ as an answer — "you have nobody to share with" —
    /// and a session written while it is still in flight is filed privately on a
    /// decision the rider was never shown.
    var sharingAnswered: Bool { teachersStatus != .loading }

    func loadCatalogs() async {
        // Asked together rather than one after another. Sequentially the sharing
        // question came last, so on a slow connection it was still unanswered
        // long after the rest of the sheet had settled — and it is the answer
        // this sheet cannot proceed without.
        async let stable: Void = loadHorses()
        async let planning: Void = loadPlans()
        async let catalog: Void = loadPrograms()
        async let relations: Void = loadTeachers()
        await stable
        await planning
        await catalog
        await relations
    }

    // Each catalog is retried on its own: one failed read is not a reason to
    // re-ask the three that answered, and the retry sits in the field that is
    // missing something.

    func loadHorses() async {
        horsesStatus = .loading
        do {
            horses = try await api.horses.list()
            horsesStatus = .loaded
        } catch is CancellationError {
            // The sheet is going away. Claiming nothing beats claiming a
            // failure nobody will be there to read.
            return
        } catch {
            horsesStatus = .failed
        }
    }

    func loadPlans() async {
        plansStatus = .loading
        do {
            plans = try await api.plans.list()
            plansStatus = .loaded
        } catch is CancellationError {
            return
        } catch {
            plansStatus = .failed
        }
    }

    func loadPrograms() async {
        programsStatus = .loading
        do {
            programs = try await api.programs.listForStudent()
            programsStatus = .loaded
        } catch is CancellationError {
            return
        } catch {
            programsStatus = .failed
        }
    }

    func loadTeachers() async {
        teachersStatus = .loading
        do {
            teachers = try await api.teachers.list()
            teachersStatus = .loaded
            // A Relation withdrawn while the sheet was open must not be able to
            // ride along into the create call as a stale id.
            let valid = Set(teachers.map(\.id))
            shareWithTeacherIds = shareWithTeacherIds.filter { valid.contains($0) }
        } catch is CancellationError {
            // The ONE loader that may not settle on `.loading`, because this is
            // the catalog `sharingAnswered` gates Logga pass on: a cancellation
            // that left it in flight would disable the submit button for as long
            // as the sheet lives, with no retry anywhere to clear it. `.failed`
            // is the recoverable answer — it draws the field's own retry. The
            // three sibling loaders cost a field rather than the write, so they
            // keep the quieter "claim nothing" branch above.
            teachersStatus = .failed
        } catch {
            // The selections stand: they came from a list that DID answer, and
            // dropping them would quietly un-share a session the rider already
            // decided to share.
            teachersStatus = .failed
        }
    }

    /// Returns the created session, or nil when validation or the request failed
    /// — the sheet stays open on nil, with its own state intact.
    func submit() async -> TrainingSession? {
        // `sharingAnswered` is a guard here as well as a disabled button,
        // because the rule belongs to the write: nothing may create a session
        // while the audience question is still in flight, whatever route the
        // press arrived by.
        guard !isSaving, sharingAnswered else { return nil }
        // Cleared before the field check, not after it: pressing Logga pass ends
        // the previous attempt whatever happens next. Leaving the banner up under
        // a fresh field error would offer "försök igen" for a request this press
        // never sent.
        error = nil

        var durationMin: Int?
        let rawDuration = duration.trimmingCharacters(in: .whitespaces)
        if !rawDuration.isEmpty {
            guard let parsed = Int(rawDuration), parsed >= 0 else {
                validationMessage = I18n.t("trainingSessionCreate.error.duration")
                return nil
            }
            durationMin = parsed
        }
        validationMessage = nil

        let trimmedSummary = summary.trimmingCharacters(in: .whitespacesAndNewlines)
        isSaving = true
        defer { isSaving = false }

        do {
            return try await api.trainingSessions.create(
                performedAt: TrainingSessionCopy.isoTimestamp(performedAt),
                durationMin: durationMin,
                summary: trimmedSummary.isEmpty ? nil : trimmedSummary,
                horseId: horseId.isEmpty ? nil : horseId,
                planId: planId.isEmpty ? nil : planId,
                programId: programId.isEmpty ? nil : programId,
                shareWithTeacherIds: shareWithTeacherIds
            )
        } catch is CancellationError {
            return nil
        } catch {
            self.error = trainingSessionError(error)
            return nil
        }
    }
}
