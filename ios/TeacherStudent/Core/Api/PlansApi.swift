import Foundation

enum PlanStatus: String, Codable, Sendable, CaseIterable {
    case active
    case archived
}

/// `web/api/plans.gen.ts` → `Plan`. The canonical Plan; `students.gen.ts`
/// re-declares the identical interface and `web/api.ts` re-exports THIS one.
struct Plan: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let studentId: String
    let primaryTeacherId: String?
    let primaryTeacherDisplayName: String?
    let title: String
    let description: String?
    let startDate: String?
    let endDate: String?
    let status: PlanStatus
    let createdAt: String
    let updatedAt: String
}

/// `Plan` plus everything hanging off it. A separate type, not a `Plan` with
/// optional collections — `GET /plans/:id` always fills the three lists.
struct PlanDetail: Codable, Identifiable, Equatable, Sendable {
    let lessons: [LinkedLessonRef]
    let trainingSessions: [LinkedTrainingSessionRef]
    let goals: [LinkedGoalRef]
    let id: String
    let studentId: String
    let primaryTeacherId: String?
    let primaryTeacherDisplayName: String?
    let title: String
    let description: String?
    let startDate: String?
    let endDate: String?
    let status: PlanStatus
    let createdAt: String
    let updatedAt: String
}

struct LinkedLessonRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let scheduledAt: String
    let teacherDisplayName: String
    let status: LessonStatus
    let horseName: String?
}

struct LinkedTrainingSessionRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let performedAt: String
    let durationMin: Int?
    let summary: String?
    let horseName: String?
}

struct LinkedGoalRef: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let status: GoalStatus
    let targetDate: String?
}

/// Port of `createPlansClient`.
struct PlansApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /plans` — takes every field at once, so a Plan is never half made.
    func create(
        title: String,
        description: String? = nil,
        startDate: String? = nil,
        endDate: String? = nil,
        primaryTeacherId: String? = nil
    ) async throws -> Plan {
        var payload = JSONBody()
        payload.set("title", title)
        payload.set("description", optional: description)
        payload.set("startDate", optional: startDate)
        payload.set("endDate", optional: endDate)
        payload.set("primaryTeacherId", optional: primaryTeacherId)
        return try await client.post("/plans", body: payload.value, as: Plan.self)
    }

    /// `GET /plans`.
    func list() async throws -> [Plan] {
        try await client.get("/plans", as: [Plan].self)
    }

    /// `GET /plans/:id`.
    func get(id: String) async throws -> PlanDetail {
        try await client.get("/plans/\(pathSegment(id))", as: PlanDetail.self)
    }

    /// `PATCH /plans/:id`. The four nullable fields clear with an explicit null.
    func update(
        id: String,
        title: String? = nil,
        description: PatchField<String> = .unchanged,
        startDate: PatchField<String> = .unchanged,
        endDate: PatchField<String> = .unchanged,
        primaryTeacherId: PatchField<String> = .unchanged
    ) async throws -> Plan {
        var payload = JSONBody()
        payload.set("title", optional: title)
        payload.set("description", description)
        payload.set("startDate", startDate)
        payload.set("endDate", endDate)
        payload.set("primaryTeacherId", primaryTeacherId)
        return try await client.patch("/plans/\(pathSegment(id))", body: payload.value, as: Plan.self)
    }

    /// `POST /plans/:id/archive`. A Plan is archived, never deleted — its
    /// Lessons, Sessions and Goals keep pointing at it.
    @discardableResult
    func archive(id: String) async throws -> OkResponse {
        try await client.post("/plans/\(pathSegment(id))/archive", body: JSONBody().value, as: OkResponse.self)
    }
}
