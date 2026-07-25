import Foundation

enum GoalStatus: String, Codable, Sendable, CaseIterable {
    case active
    case achieved
    case abandoned
}

/// `web/api/goals.gen.ts` → `Goal`. The OWNER's view: it carries
/// `sharedTeacherIds`, which the teacher-facing projection does not.
struct Goal: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let studentId: String
    let title: String
    let description: String?
    let targetDate: String?
    let achievedAt: String?
    let status: GoalStatus
    let horseId: String?
    let horseName: String?
    let sharedTeacherIds: [String]
    let planIds: [String]
    let createdAt: String
    let updatedAt: String
}

/// The same Goal WITHOUT `sharedTeacherIds` — a Teacher may not enumerate the
/// other Teachers a Student shared a Goal with. Declared identically in
/// `goals.gen.ts` and `students.gen.ts`; defined once here, since it is a Goal.
struct GoalTeacherView: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let studentId: String
    let title: String
    let description: String?
    let targetDate: String?
    let achievedAt: String?
    let status: GoalStatus
    let horseId: String?
    let horseName: String?
    let planIds: [String]
    let createdAt: String
    let updatedAt: String
}

struct SharedTeacherRef: Codable, Identifiable, Equatable, Sendable {
    let teacherId: String
    let displayName: String

    var id: String { teacherId }
}

/// Port of `createGoalsClient`.
struct GoalsApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /goals`.
    func create(
        title: String,
        description: String? = nil,
        targetDate: String? = nil,
        horseId: String? = nil
    ) async throws -> Goal {
        var payload = JSONBody()
        payload.set("title", title)
        payload.set("description", optional: description)
        payload.set("targetDate", optional: targetDate)
        payload.set("horseId", optional: horseId)
        return try await client.post("/goals", body: payload.value, as: Goal.self)
    }

    /// `GET /goals` — the signed-in Student's own Goals.
    func list() async throws -> [Goal] {
        try await client.get("/goals", as: [Goal].self)
    }

    /// `GET /goals/:id`. Answers the TEACHER projection even for the owner —
    /// that is the contract, not a bug: `Goal` comes back from `list` and
    /// `update`, `GoalTeacherView` from `get`.
    func get(id: String) async throws -> GoalTeacherView {
        try await client.get("/goals/\(pathSegment(id))", as: GoalTeacherView.self)
    }

    /// `PATCH /goals/:id`.
    ///
    /// The three nullable fields take `PatchField` rather than an optional: the
    /// web clears a description by sending `description: null`, and an omitted
    /// key means "leave it alone". `String?` cannot say both.
    func update(
        id: String,
        title: String? = nil,
        description: PatchField<String> = .unchanged,
        horseId: PatchField<String> = .unchanged,
        targetDate: PatchField<String> = .unchanged
    ) async throws -> Goal {
        var payload = JSONBody()
        payload.set("title", optional: title)
        payload.set("description", description)
        payload.set("horseId", horseId)
        payload.set("targetDate", targetDate)
        return try await client.patch("/goals/\(pathSegment(id))", body: payload.value, as: Goal.self)
    }

    /// `POST /goals/:id/abandon`.
    @discardableResult
    func abandon(id: String) async throws -> OkResponse {
        try await client.post("/goals/\(pathSegment(id))/abandon", body: JSONBody().value, as: OkResponse.self)
    }

    /// `POST /goals/:id/achieve`.
    @discardableResult
    func achieve(id: String) async throws -> OkResponse {
        try await client.post("/goals/\(pathSegment(id))/achieve", body: JSONBody().value, as: OkResponse.self)
    }

    /// `POST /goals/:id/reopen`.
    @discardableResult
    func reopen(id: String) async throws -> OkResponse {
        try await client.post("/goals/\(pathSegment(id))/reopen", body: JSONBody().value, as: OkResponse.self)
    }

    /// `POST /goals/:id/shares` — `teacherId` travels in the BODY here, and in
    /// the PATH on `unshare`. Asymmetric in the contract; kept as it is.
    @discardableResult
    func share(id: String, teacherId: String) async throws -> OkResponse {
        var payload = JSONBody()
        payload.set("teacherId", teacherId)
        return try await client.post("/goals/\(pathSegment(id))/shares", body: payload.value, as: OkResponse.self)
    }

    /// `DELETE /goals/:id/shares/:teacherId`.
    @discardableResult
    func unshare(id: String, teacherId: String) async throws -> OkResponse {
        try await client.delete(
            "/goals/\(pathSegment(id))/shares/\(pathSegment(teacherId))",
            as: OkResponse.self
        )
    }

    /// `POST /goals/:id/plans/:planId`.
    @discardableResult
    func attachPlan(id: String, planId: String) async throws -> OkResponse {
        try await client.post(
            "/goals/\(pathSegment(id))/plans/\(pathSegment(planId))",
            body: JSONBody().value,
            as: OkResponse.self
        )
    }

    /// `DELETE /goals/:id/plans/:planId`.
    @discardableResult
    func detachPlan(id: String, planId: String) async throws -> OkResponse {
        try await client.delete(
            "/goals/\(pathSegment(id))/plans/\(pathSegment(planId))",
            as: OkResponse.self
        )
    }

    /// `GET /goals/:id/shares` — the named audience, so a sharing chip is never
    /// forced to render an anonymous "Delad".
    func listShares(id: String) async throws -> [SharedTeacherRef] {
        try await client.get("/goals/\(pathSegment(id))/shares", as: [SharedTeacherRef].self)
    }
}
