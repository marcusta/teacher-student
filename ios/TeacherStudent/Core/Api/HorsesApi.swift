import Foundation

/// `web/api/horses.gen.ts` → `Horse`. The canonical Horse: `students.gen.ts`
/// re-declares the identical interface, and `web/api.ts` re-exports THIS one.
struct Horse: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let studentId: String
    let name: String
    let archivedAt: String?
    let createdAt: String
    let updatedAt: String
}

/// Port of `createHorsesClient`.
struct HorsesApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /horses`.
    func create(name: String) async throws -> Horse {
        var payload = JSONBody()
        payload.set("name", name)
        return try await client.post("/horses", body: payload.value, as: Horse.self)
    }

    /// `GET /horses`.
    func list() async throws -> [Horse] {
        try await client.get("/horses", as: [Horse].self)
    }

    /// `GET /horses/:id`.
    func get(id: String) async throws -> Horse {
        try await client.get("/horses/\(pathSegment(id))", as: Horse.self)
    }

    /// `PATCH /horses/:id`.
    func update(id: String, name: String? = nil) async throws -> Horse {
        var payload = JSONBody()
        payload.set("name", optional: name)
        return try await client.patch("/horses/\(pathSegment(id))", body: payload.value, as: Horse.self)
    }

    /// `DELETE /horses/:id` — the archive verb (IA §3.15); the server retires the
    /// horse rather than erasing it, which is why `archivedAt` exists.
    @discardableResult
    func delete(id: String) async throws -> OkResponse {
        try await client.delete("/horses/\(pathSegment(id))", as: OkResponse.self)
    }
}
