import Foundation

/// A person on the other side of a Relation. The server reuses this one shape
/// for both directions — `GET /students` and `GET /teachers` — so `Teacher` is
/// an alias of it rather than a second struct (see `TeachersApi`).
struct Student: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let email: String
    let displayName: String
}

/// One past occurrence of a single Exercise for one Student (IA §3.16), with
/// the note thread that hangs off that occurrence.
struct ExerciseHistoryEntry: Codable, Identifiable, Equatable, Sendable {
    let lessonExerciseId: String
    let lessonId: String
    let scheduledAt: String
    let sourceProgramId: String?
    let sourceProgramTitle: String?
    let rowNotes: String?
    let notes: [Note]

    /// The occurrence is the row's identity; one Lesson can hold the same
    /// Exercise twice.
    var id: String { lessonExerciseId }
}

/// Port of `createStudentsClient`. Every method is a Teacher-side read of one
/// Student's material; `Horse`, `Plan`, `GoalTeacherView`, `TrainingSession` and
/// `Note` are the canonical types from their own modules, which is exactly what
/// `students.gen.ts` re-declares.
struct StudentsApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `GET /students` — the signed-in Teacher's roster.
    func list() async throws -> [Student] {
        try await client.get("/students", as: [Student].self)
    }

    /// `GET /students/:id`.
    func get(id: String) async throws -> Student {
        try await client.get("/students/\(pathSegment(id))", as: Student.self)
    }

    /// `GET /students/:id/horses` — the WHOLE stable, archived horses included.
    /// Filtering retired horses out of a picker is the client's job.
    func listHorses(id: String) async throws -> [Horse] {
        try await client.get("/students/\(pathSegment(id))/horses", as: [Horse].self)
    }

    /// `GET /students/:id/plans`.
    func listPlans(id: String) async throws -> [Plan] {
        try await client.get("/students/\(pathSegment(id))/plans", as: [Plan].self)
    }

    /// `GET /students/:id/goals` — only the Goals shared with this Teacher, in
    /// the projection that hides the rest of the audience.
    func listGoals(id: String) async throws -> [GoalTeacherView] {
        try await client.get("/students/\(pathSegment(id))/goals", as: [GoalTeacherView].self)
    }

    /// `GET /students/:id/training-sessions` — only the sessions shared with
    /// this Teacher.
    func listTrainingSessions(id: String) async throws -> [TrainingSession] {
        try await client.get(
            "/students/\(pathSegment(id))/training-sessions",
            as: [TrainingSession].self
        )
    }

    /// `GET /students/:id/exercises/:exerciseId/history`.
    func exerciseHistory(id: String, exerciseId: String) async throws -> [ExerciseHistoryEntry] {
        try await client.get(
            "/students/\(pathSegment(id))/exercises/\(pathSegment(exerciseId))/history",
            as: [ExerciseHistoryEntry].self
        )
    }
}
