import Foundation

/// What a Note can hang on. Port of the union in `web/api/notes.gen.ts`.
///
/// Strict, with no lenient fallback: the web switches on these values
/// exhaustively and without a default arm, so an unrecognised kind is a contract
/// break there too. Decoding one as `.unknown` would hide the break instead of
/// surfacing it.
enum NoteParentKind: String, Codable, Sendable, CaseIterable {
    case lesson
    case student
    case trainingSession = "training_session"
    case trainingSessionExercise = "training_session_exercise"
    case exerciseQuestion = "exercise_question"
    case lessonExercise = "lesson_exercise"
    case goal
}

enum NoteVisibility: String, Codable, Sendable, CaseIterable {
    case `private`
    case shared
}

/// `web/api/notes.gen.ts` → `Note`.
struct Note: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let authorId: String
    let authorDisplayName: String
    let parentKind: NoteParentKind
    let parentId: String
    let body: String
    let visibility: NoteVisibility
    let createdAt: String
    let updatedAt: String
}

/// Port of `createNotesClient`.
struct NotesApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /notes`.
    func create(
        parentKind: NoteParentKind,
        parentId: String,
        body: String,
        visibility: NoteVisibility
    ) async throws -> Note {
        var payload = JSONBody()
        payload.set("parentKind", parentKind.rawValue)
        payload.set("parentId", parentId)
        payload.set("body", body)
        payload.set("visibility", visibility.rawValue)
        return try await client.post("/notes", body: payload.value, as: Note.self)
    }

    /// `GET /notes?parentKind=…&parentId=…`. Both parameters are query
    /// parameters, not path parameters — the thread is addressed by its parent.
    func list(parentKind: NoteParentKind, parentId: String) async throws -> [Note] {
        let query = [
            URLQueryItem(name: "parentKind", value: parentKind.rawValue),
            URLQueryItem(name: "parentId", value: parentId),
        ].queryString
        return try await client.get("/notes\(query)", as: [Note].self)
    }

    /// `PATCH /notes/:id`. Both fields are plain optionals in the contract —
    /// there is no null to send, because a Note has neither a clearable body nor
    /// a clearable visibility.
    func update(id: String, body: String? = nil, visibility: NoteVisibility? = nil) async throws -> Note {
        var payload = JSONBody()
        payload.set("body", optional: body)
        payload.set("visibility", optional: visibility?.rawValue)
        return try await client.patch("/notes/\(pathSegment(id))", body: payload.value, as: Note.self)
    }

    /// `DELETE /notes/:id`.
    @discardableResult
    func delete(id: String) async throws -> OkResponse {
        try await client.delete("/notes/\(pathSegment(id))", as: OkResponse.self)
    }
}
