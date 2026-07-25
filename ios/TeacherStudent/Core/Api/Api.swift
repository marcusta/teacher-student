import Foundation

/// The single injection point for everything a feature can ask the server, port
/// of `web/api.ts`'s `api` object.
///
/// A feature takes an `Api` and reaches for `api.goals`, `api.lessons`, … the
/// same way the web services reach for `api.goals`, `api.lessons`, … Nothing
/// here holds state: every client is a struct over the shared `ApiClient`, so
/// passing `Api` around costs nothing and a test can hand a model its own
/// instance pointed at a different base URL.
///
/// One deviation from `web/api.ts`: the web calls its auth client `register`
/// (the generated file only covers registration, and login/logout come from the
/// framework's own module). On iOS all four live in `AuthApi`, so this exposes
/// `auth` instead of `register`.
struct Api: Sendable {
    let auth: AuthApi
    let invitations: InvitationsApi
    let students: StudentsApi
    let exercises: ExercisesApi
    let horses: HorsesApi
    let lessons: LessonsApi
    let notes: NotesApi
    let trainingSessions: TrainingSessionsApi
    let teachers: TeachersApi
    let programs: ProgramsApi
    let plans: PlansApi
    let goals: GoalsApi
    let dashboard: DashboardApi

    init(client: ApiClient = .shared) {
        auth = AuthApi(client: client)
        invitations = InvitationsApi(client: client)
        students = StudentsApi(client: client)
        exercises = ExercisesApi(client: client)
        horses = HorsesApi(client: client)
        lessons = LessonsApi(client: client)
        notes = NotesApi(client: client)
        trainingSessions = TrainingSessionsApi(client: client)
        teachers = TeachersApi(client: client)
        programs = ProgramsApi(client: client)
        plans = PlansApi(client: client)
        goals = GoalsApi(client: client)
        dashboard = DashboardApi(client: client)
    }

    /// The app-wide instance, over `ApiClient.shared`.
    static let shared = Api()
}
