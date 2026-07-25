import Foundation

/// `web/api/exercises.gen.ts` → `Exercise`.
struct Exercise: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let teacherId: String
    let name: String
    let description: String
    let archivedAt: String?
    let createdAt: String
    let updatedAt: String
}

/// Port of `createExercisesClient`.
struct ExercisesApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /exercises`.
    func create(name: String, description: String? = nil) async throws -> Exercise {
        var payload = JSONBody()
        payload.set("name", name)
        payload.set("description", optional: description)
        return try await client.post("/exercises", body: payload.value, as: Exercise.self)
    }

    /// `GET /exercises` — the signed-in Teacher's own catalog.
    func list() async throws -> [Exercise] {
        try await client.get("/exercises", as: [Exercise].self)
    }

    /// `GET /exercises/for-student` — every Exercise owned by a Teacher this
    /// account rides for. A different endpoint, not a filter on `list()`.
    func listForStudent() async throws -> [Exercise] {
        try await client.get("/exercises/for-student", as: [Exercise].self)
    }

    /// `GET /exercises/:id`.
    func get(id: String) async throws -> Exercise {
        try await client.get("/exercises/\(pathSegment(id))", as: Exercise.self)
    }

    /// `PATCH /exercises/:id`.
    func update(id: String, name: String? = nil, description: String? = nil) async throws -> Exercise {
        var payload = JSONBody()
        payload.set("name", optional: name)
        payload.set("description", optional: description)
        return try await client.patch("/exercises/\(pathSegment(id))", body: payload.value, as: Exercise.self)
    }

    /// `DELETE /exercises/:id`.
    @discardableResult
    func delete(id: String) async throws -> OkResponse {
        try await client.delete("/exercises/\(pathSegment(id))", as: OkResponse.self)
    }
}
