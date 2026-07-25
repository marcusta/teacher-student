import Foundation

/// `web/api/programs.gen.ts` → `Program`. Note there is no `updatedAt` on this
/// contract, unlike `Exercise` — that is the server's shape, not an omission.
struct Program: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let teacherId: String
    let title: String
    let description: String
    let archivedAt: String?
    let createdAt: String
}

/// One ordered row of a Program. `id` is the EXERCISE's id (the join carries no
/// identity of its own), and `notes` is the row's instructional text.
struct ProgramExerciseRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let description: String
    let sortOrder: Int
    let notes: String?
    let archivedAt: String?
}

/// Port of `createProgramsClient`.
struct ProgramsApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /programs`.
    func create(title: String, description: String? = nil) async throws -> Program {
        var payload = JSONBody()
        payload.set("title", title)
        payload.set("description", optional: description)
        return try await client.post("/programs", body: payload.value, as: Program.self)
    }

    /// `GET /programs`.
    func list() async throws -> [Program] {
        try await client.get("/programs", as: [Program].self)
    }

    /// `GET /programs/for-student`.
    func listForStudent() async throws -> [Program] {
        try await client.get("/programs/for-student", as: [Program].self)
    }

    /// `GET /programs/:id`.
    func get(id: String) async throws -> Program {
        try await client.get("/programs/\(pathSegment(id))", as: Program.self)
    }

    /// `PATCH /programs/:id`.
    func update(id: String, title: String? = nil, description: String? = nil) async throws -> Program {
        var payload = JSONBody()
        payload.set("title", optional: title)
        payload.set("description", optional: description)
        return try await client.patch("/programs/\(pathSegment(id))", body: payload.value, as: Program.self)
    }

    /// `DELETE /programs/:id`.
    @discardableResult
    func delete(id: String) async throws -> OkResponse {
        try await client.delete("/programs/\(pathSegment(id))", as: OkResponse.self)
    }

    /// `GET /programs/:id/exercises`.
    func listExercises(id: String) async throws -> [ProgramExerciseRef] {
        try await client.get("/programs/\(pathSegment(id))/exercises", as: [ProgramExerciseRef].self)
    }

    /// `POST /programs/:id/exercises`.
    @discardableResult
    func addExercise(id: String, exerciseId: String, notes: String? = nil) async throws -> OkResponse {
        var payload = JSONBody()
        payload.set("exerciseId", exerciseId)
        payload.set("notes", optional: notes)
        return try await client.post(
            "/programs/\(pathSegment(id))/exercises",
            body: payload.value,
            as: OkResponse.self
        )
    }

    /// `PUT /programs/:id/exercises/order` — the only PUT in the whole contract.
    /// The order is REPLACED by the list given, not merged into it.
    @discardableResult
    func reorderExercises(id: String, exerciseIds: [String]) async throws -> OkResponse {
        var payload = JSONBody()
        payload.set("exerciseIds", exerciseIds)
        return try await client.put(
            "/programs/\(pathSegment(id))/exercises/order",
            body: payload.value,
            as: OkResponse.self
        )
    }

    /// `PATCH /programs/:id/exercises/:exerciseId`.
    ///
    /// `notes` is REQUIRED and nullable in the contract, so `nil` is sent as an
    /// explicit `null` rather than omitted — that null is how a row's
    /// instructional text is cleared (`programs.service.ts`: "Blank clears it").
    @discardableResult
    func updateExerciseNotes(id: String, exerciseId: String, notes: String?) async throws -> OkResponse {
        var payload = JSONBody()
        payload.set("notes", nullable: notes)
        return try await client.patch(
            "/programs/\(pathSegment(id))/exercises/\(pathSegment(exerciseId))",
            body: payload.value,
            as: OkResponse.self
        )
    }

    /// `DELETE /programs/:id/exercises/:exerciseId`.
    @discardableResult
    func removeExercise(id: String, exerciseId: String) async throws -> OkResponse {
        try await client.delete(
            "/programs/\(pathSegment(id))/exercises/\(pathSegment(exerciseId))",
            as: OkResponse.self
        )
    }
}
