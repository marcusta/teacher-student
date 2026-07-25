import Foundation

enum LessonStatus: String, Codable, Sendable, CaseIterable {
    case completed
    case cancelled
    case planned
}

/// The reader's contextual role on ONE occasion (IA §1) — a fact about the
/// relation, never about the account.
enum OccasionRole: String, Codable, Sendable, CaseIterable {
    case student
    case teacher

    /// The other party's role: the inverse of the reader's own.
    var counterparty: OccasionRole { self == .teacher ? .student : .teacher }
}

/// The two terminal states a planned Lesson may be moved to.
enum LessonTransitionTarget: String, Codable, Sendable, CaseIterable {
    case completed
    case cancelled
}

/// `web/api/lessons.gen.ts` → `Lesson`. What POST/PATCH answer: no `role`, no
/// counterparty — those are projections of the READER, and a write does not
/// know who is reading.
struct Lesson: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let teacherId: String
    let studentId: String
    let scheduledAt: String
    let status: LessonStatus
    let horseId: String?
    let horseName: String?
    let planId: String?
    let planTitle: String?
    let programs: [AttachedProgramRef]
    let exercises: [LessonExerciseRef]
    let createdAt: String
    let updatedAt: String
}

/// The same Lesson as the signed-in reader sees it. `GET /lessons` and
/// `GET /lessons/:id` answer this shape; the list rows need `role` and
/// `counterpartyDisplayName` and cannot derive either locally.
struct LessonForUser: Codable, Identifiable, Equatable, Sendable {
    let role: OccasionRole
    let counterpartyDisplayName: String
    let id: String
    let teacherId: String
    let studentId: String
    let scheduledAt: String
    let status: LessonStatus
    let horseId: String?
    let horseName: String?
    let planId: String?
    let planTitle: String?
    let programs: [AttachedProgramRef]
    let exercises: [LessonExerciseRef]
    let createdAt: String
    let updatedAt: String
}

/// One Exercise occurrence inside a Lesson. `id` identifies the OCCURRENCE (it
/// is what a note thread hangs off); `exerciseId` identifies the catalog entry
/// it was copied from. `notes` is the instructional row note snapshotted from
/// the source Program — not the note thread.
struct LessonExerciseRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let exerciseId: String
    let name: String
    let sortOrder: Int
    let sourceProgramId: String?
    let notes: String?
}

/// Port of `createLessonsClient`.
struct LessonsApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /lessons`. One Program at creation; further ones are attached from
    /// the detail view, each with its own outcome.
    func create(
        studentId: String,
        scheduledAt: String,
        planId: String? = nil,
        programId: String? = nil
    ) async throws -> Lesson {
        var payload = JSONBody()
        payload.set("studentId", studentId)
        payload.set("scheduledAt", scheduledAt)
        payload.set("planId", optional: planId)
        payload.set("programId", optional: programId)
        return try await client.post("/lessons", body: payload.value, as: Lesson.self)
    }

    /// `GET /lessons` — one timeline of everything the reader teaches OR attends.
    func list() async throws -> [LessonForUser] {
        try await client.get("/lessons", as: [LessonForUser].self)
    }

    /// `GET /lessons/:id`.
    func get(id: String) async throws -> LessonForUser {
        try await client.get("/lessons/\(pathSegment(id))", as: LessonForUser.self)
    }

    /// `POST /lessons/:id/exercises`. Answers the whole ordered list back.
    func addExercise(id: String, exerciseId: String) async throws -> [LessonExerciseRef] {
        var payload = JSONBody()
        payload.set("exerciseId", exerciseId)
        return try await client.post(
            "/lessons/\(pathSegment(id))/exercises",
            body: payload.value,
            as: [LessonExerciseRef].self
        )
    }

    /// `DELETE /lessons/:id/exercises/:exerciseId`.
    @discardableResult
    func removeExercise(id: String, exerciseId: String) async throws -> [LessonExerciseRef] {
        try await client.delete(
            "/lessons/\(pathSegment(id))/exercises/\(pathSegment(exerciseId))",
            as: [LessonExerciseRef].self
        )
    }

    /// `GET /lessons/:id/exercises`.
    func listExercises(id: String) async throws -> [LessonExerciseRef] {
        try await client.get("/lessons/\(pathSegment(id))/exercises", as: [LessonExerciseRef].self)
    }

    /// `POST /lessons/:id/transition`. Terminal and one-way — the server refuses
    /// to move a completed or cancelled Lesson anywhere.
    func transition(id: String, target: LessonTransitionTarget) async throws -> Lesson {
        var payload = JSONBody()
        payload.set("target", target.rawValue)
        return try await client.post(
            "/lessons/\(pathSegment(id))/transition",
            body: payload.value,
            as: Lesson.self
        )
    }

    /// `POST /lessons/:id/programs`. Copies the Program's Exercises in.
    func attachProgram(id: String, programId: String) async throws -> Lesson {
        var payload = JSONBody()
        payload.set("programId", programId)
        return try await client.post(
            "/lessons/\(pathSegment(id))/programs",
            body: payload.value,
            as: Lesson.self
        )
    }

    /// `DELETE /lessons/:id/programs/:programId`. Leaves the copied Exercises
    /// behind — detaching a source is not an undo (IA §3.8).
    func detachProgram(id: String, programId: String) async throws -> Lesson {
        try await client.delete(
            "/lessons/\(pathSegment(id))/programs/\(pathSegment(programId))",
            as: Lesson.self
        )
    }

    /// `PATCH /lessons/:id`. Horse and Plan clear with an explicit null; the
    /// schedule has no null, since a Lesson always has a time.
    func update(
        id: String,
        scheduledAt: String? = nil,
        horseId: PatchField<String> = .unchanged,
        planId: PatchField<String> = .unchanged
    ) async throws -> Lesson {
        var payload = JSONBody()
        payload.set("scheduledAt", optional: scheduledAt)
        payload.set("horseId", horseId)
        payload.set("planId", planId)
        return try await client.patch("/lessons/\(pathSegment(id))", body: payload.value, as: Lesson.self)
    }
}
