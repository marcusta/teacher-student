import Foundation

/// The server reuses `RelationService.Student` for `GET /teachers`, so the two
/// directions of a Relation carry the identical payload. `web/api.ts` states
/// this as `export type Teacher = TeacherDto`; the alias is the port of that.
typealias Teacher = Student

/// Port of `createTeachersClient`.
struct TeachersApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `GET /teachers` — everyone who teaches the signed-in account. This is the
    /// list a sharing chip resolves ids against, so a shared object can NAME its
    /// audience instead of counting it.
    func list() async throws -> [Teacher] {
        try await client.get("/teachers", as: [Teacher].self)
    }
}
