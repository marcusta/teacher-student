import Foundation

/// Which of the two roles the signed-in account actually plays. Both can be
/// true; the Hem screen composes itself from whichever are (IA §3.7).
struct DashboardCapabilities: Codable, Equatable, Sendable {
    let teaches: Bool
    let rides: Bool
}

/// The single next Lesson, pre-projected for the reader — `role` is the
/// READER's role on it, so `counterpartyDisplayName` is always the other party.
struct DashboardNextLesson: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let scheduledAt: String
    let role: OccasionRole
    let counterpartyDisplayName: String
    let horseName: String?
    let planId: String?
    let planTitle: String?
    /// The first few Exercise names, already truncated server-side.
    let exercisePreview: [String]
    /// The TOTAL count, which `exercisePreview` may be shorter than.
    let exerciseCount: Int
}

/// What a feedback item hangs off. The full 5-member set the dashboard can
/// surface — narrower than `NoteParentKind`, which covers every thread in the
/// system.
enum DashboardFeedbackParentKind: String, Codable, Sendable, CaseIterable {
    case lesson
    case trainingSession = "training_session"
    case trainingSessionExercise = "training_session_exercise"
    case lessonExercise = "lesson_exercise"
    case goal
}

/// What the feedback item LINKS to. Coarser than the parent kind: a note on a
/// Lesson Exercise still navigates to the Lesson.
enum DashboardTargetKind: String, Codable, Sendable, CaseIterable {
    case lesson
    case trainingSession = "training_session"
    case goal
}

/// The most recent note written to the reader by someone else.
struct DashboardFeedback: Codable, Identifiable, Equatable, Sendable {
    let noteId: String
    let parentKind: DashboardFeedbackParentKind
    let parentId: String
    let targetKind: DashboardTargetKind
    let targetId: String
    /// A composed human label for the target, e.g. `Träningspass · 14 juli`.
    let targetLabel: String
    /// Set when the thread hangs off an Exercise occurrence rather than the
    /// occasion itself.
    let exerciseName: String?
    let authorId: String
    let authorDisplayName: String
    let body: String
    let createdAt: String

    var id: String { noteId }
}

/// Which kind of occasion is waiting for the Teacher to write something.
enum DashboardAwaitingKind: String, Codable, Sendable, CaseIterable {
    case lesson
    case trainingSession = "training_session"
}

/// One occasion that has happened but has no note from the reader yet — the
/// Teacher-side queue on Hem.
struct DashboardAwaitingItem: Codable, Identifiable, Equatable, Sendable {
    let kind: DashboardAwaitingKind
    let id: String
    let occurredAt: String
    let studentDisplayName: String
    let horseName: String?
}

/// A Plan reduced to what a Hem card shows.
struct DashboardPlanRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let startDate: String?
    let endDate: String?
    let primaryTeacherDisplayName: String?
}

/// A Goal whose target date is close.
struct DashboardGoalRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let targetDate: String
}

/// `web/api/dashboard.gen.ts` → `DashboardView`. One request answers the whole
/// Hem screen; the read model is assembled server-side (IA §3.7) so the client
/// never fans out to six endpoints to paint one page.
struct DashboardView: Codable, Equatable, Sendable {
    let capabilities: DashboardCapabilities
    let nextLesson: DashboardNextLesson?
    let latestFeedback: DashboardFeedback?
    let awaitingFeedback: [DashboardAwaitingItem]
    let activePlans: [DashboardPlanRef]
    let goalsNearingTarget: [DashboardGoalRef]
    let pendingInvitations: Int
    let generatedAt: String
}

/// Port of `createDashboardClient`.
struct DashboardApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `GET /dashboard`.
    func get() async throws -> DashboardView {
        try await client.get("/dashboard", as: DashboardView.self)
    }
}
