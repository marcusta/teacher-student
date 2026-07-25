import Foundation

enum InvitationStatus: String, Codable, Sendable, CaseIterable {
    case pending
    case accepted
    case declined
    case revoked
    case expired
}

/// `web/api/invitations.gen.ts` → `Invitation`. The SENDER's view.
struct Invitation: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let teacherId: String
    let inviteeEmail: String
    let status: InvitationStatus
    let createdAt: String
    let expiresAt: String
    let acceptedAt: String?
}

/// The RECIPIENT's view — the same invitation with the inviting Teacher named,
/// so the Inkorg never shows an anonymous request.
struct InboxInvitation: Codable, Identifiable, Equatable, Sendable {
    let teacherDisplayName: String
    let teacherEmail: String
    let id: String
    let teacherId: String
    let inviteeEmail: String
    let status: InvitationStatus
    let createdAt: String
    let expiresAt: String
    let acceptedAt: String?
}

/// The Teacher↔Student edge an accepted invitation creates.
struct Relation: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let teacherId: String
    let studentId: String
    let invitationId: String
    let createdAt: String
}

/// Port of `createInvitationsClient`. Every mutation here is a POST to a named
/// verb path with the id in the BODY — this module has no `:id` routes at all.
struct InvitationsApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /invitations`.
    func create(inviteeEmail: String) async throws -> Invitation {
        var payload = JSONBody()
        payload.set("inviteeEmail", inviteeEmail)
        return try await client.post("/invitations", body: payload.value, as: Invitation.self)
    }

    /// `POST /invitations/revoke`. Answers `{ changed }`, not `{ ok }`: revoking
    /// an already-settled invitation is a no-op, and the flag says which
    /// happened.
    @discardableResult
    func revoke(invitationId: String) async throws -> ChangedResponse {
        var payload = JSONBody()
        payload.set("invitationId", invitationId)
        return try await client.post("/invitations/revoke", body: payload.value, as: ChangedResponse.self)
    }

    /// `GET /invitations` — the ones this account sent.
    func list() async throws -> [Invitation] {
        try await client.get("/invitations", as: [Invitation].self)
    }

    /// `GET /invitations/inbox` — the ones this account received.
    func inbox() async throws -> [InboxInvitation] {
        try await client.get("/invitations/inbox", as: [InboxInvitation].self)
    }

    /// `POST /invitations/accept` — creates the Relation and returns it.
    func accept(invitationId: String) async throws -> Relation {
        var payload = JSONBody()
        payload.set("invitationId", invitationId)
        return try await client.post("/invitations/accept", body: payload.value, as: Relation.self)
    }

    /// `POST /invitations/decline`.
    @discardableResult
    func decline(invitationId: String) async throws -> OkResponse {
        var payload = JSONBody()
        payload.set("invitationId", invitationId)
        return try await client.post("/invitations/decline", body: payload.value, as: OkResponse.self)
    }
}
