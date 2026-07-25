import Foundation

/// A Program attached to an occasion as a SOURCE. Declared identically in
/// `lessons.gen.ts`, `training-sessions.gen.ts` and `students.gen.ts`; defined
/// once here, which is where `web/api.ts` re-exports it from.
struct AttachedProgramRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
}

/// `web/api/training-sessions.gen.ts` → `TrainingSession`. The canonical shape;
/// `students.gen.ts` re-declares it identically.
struct TrainingSession: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let studentId: String
    let performedAt: String
    let durationMin: Int?
    let summary: String?
    let horseId: String?
    let horseName: String?
    let planId: String?
    let planTitle: String?
    let sharedWithTeacherIds: [String]
    let exercises: [TrainingSessionExerciseRef]
    let programs: [AttachedProgramRef]
    let createdAt: String
    let updatedAt: String
}

/// One Exercise occurrence inside a session. Structurally identical to
/// `LessonExerciseRef` and deliberately a separate type: the two occasion kinds
/// are siblings, not the same thing, and `web/api.ts` exports both names.
struct TrainingSessionExerciseRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let exerciseId: String
    let name: String
    let sortOrder: Int
    let sourceProgramId: String?
    let notes: String?
}

/// Port of `createTrainingSessionsClient`.
struct TrainingSessionsApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /training-sessions`.
    ///
    /// The nullable fields are plain optionals here rather than `PatchField`: on
    /// a create there is nothing to clear, and the web never sends a null it
    /// could have omitted.
    func create(
        performedAt: String,
        durationMin: Int? = nil,
        summary: String? = nil,
        horseId: String? = nil,
        planId: String? = nil,
        programId: String? = nil,
        shareWithTeacherIds: [String]? = nil
    ) async throws -> TrainingSession {
        var payload = JSONBody()
        payload.set("performedAt", performedAt)
        payload.set("durationMin", optional: durationMin)
        payload.set("summary", optional: summary)
        payload.set("horseId", optional: horseId)
        payload.set("planId", optional: planId)
        payload.set("programId", optional: programId)
        payload.set("shareWithTeacherIds", optional: shareWithTeacherIds)
        return try await client.post("/training-sessions", body: payload.value, as: TrainingSession.self)
    }

    /// `GET /training-sessions` — own sessions plus the ones shared with you.
    func list() async throws -> [TrainingSession] {
        try await client.get("/training-sessions", as: [TrainingSession].self)
    }

    /// `GET /training-sessions/:id`.
    func get(id: String) async throws -> TrainingSession {
        try await client.get("/training-sessions/\(pathSegment(id))", as: TrainingSession.self)
    }

    /// `PATCH /training-sessions/:id`.
    ///
    /// `shareWithTeacherIds` REPLACES the audience wholesale — an empty array
    /// unshares everyone, which is why it is a plain optional (send it or don't)
    /// and never a null.
    func update(
        id: String,
        performedAt: String? = nil,
        durationMin: PatchField<Int> = .unchanged,
        summary: PatchField<String> = .unchanged,
        horseId: PatchField<String> = .unchanged,
        planId: PatchField<String> = .unchanged,
        shareWithTeacherIds: [String]? = nil
    ) async throws -> TrainingSession {
        var payload = JSONBody()
        payload.set("performedAt", optional: performedAt)
        payload.set("durationMin", durationMin)
        payload.set("summary", summary)
        payload.set("horseId", horseId)
        payload.set("planId", planId)
        payload.set("shareWithTeacherIds", optional: shareWithTeacherIds)
        return try await client.patch(
            "/training-sessions/\(pathSegment(id))",
            body: payload.value,
            as: TrainingSession.self
        )
    }

    /// `DELETE /training-sessions/:id` — a hard delete, unlike a Plan's archive.
    @discardableResult
    func delete(id: String) async throws -> OkResponse {
        try await client.delete("/training-sessions/\(pathSegment(id))", as: OkResponse.self)
    }

    /// `POST /training-sessions/:id/exercises`.
    func addExercise(id: String, exerciseId: String) async throws -> [TrainingSessionExerciseRef] {
        var payload = JSONBody()
        payload.set("exerciseId", exerciseId)
        return try await client.post(
            "/training-sessions/\(pathSegment(id))/exercises",
            body: payload.value,
            as: [TrainingSessionExerciseRef].self
        )
    }

    /// `DELETE /training-sessions/:id/exercises/:exerciseId`.
    @discardableResult
    func removeExercise(id: String, exerciseId: String) async throws -> [TrainingSessionExerciseRef] {
        try await client.delete(
            "/training-sessions/\(pathSegment(id))/exercises/\(pathSegment(exerciseId))",
            as: [TrainingSessionExerciseRef].self
        )
    }

    /// `GET /training-sessions/:id/exercises`.
    func listExercises(id: String) async throws -> [TrainingSessionExerciseRef] {
        try await client.get(
            "/training-sessions/\(pathSegment(id))/exercises",
            as: [TrainingSessionExerciseRef].self
        )
    }

    /// `POST /training-sessions/:id/programs`.
    func attachProgram(id: String, programId: String) async throws -> TrainingSession {
        var payload = JSONBody()
        payload.set("programId", programId)
        return try await client.post(
            "/training-sessions/\(pathSegment(id))/programs",
            body: payload.value,
            as: TrainingSession.self
        )
    }

    /// `DELETE /training-sessions/:id/programs/:programId`. Copied Exercises
    /// stay behind (IA §3.10).
    func detachProgram(id: String, programId: String) async throws -> TrainingSession {
        try await client.delete(
            "/training-sessions/\(pathSegment(id))/programs/\(pathSegment(programId))",
            as: TrainingSession.self
        )
    }
}
