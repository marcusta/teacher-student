import Foundation

/// The authenticated account, exactly as `GET /auth/me` and `POST /auth/login`
/// return it.
///
/// VERIFIED against the server rather than assumed: both endpoints return the
/// `AuthUser` of `vendor/basics-core/server/auth.ts`, which is `{ id, username }`
/// — and `server/services/user.service.ts` fills `username` with the account's
/// EMAIL (`{ id: row.id, username: row.email }`). There is no `displayName` and
/// no `createdAt` on this contract; `display_name` lives in the users table but
/// is not part of the auth payload.
struct User: Codable, Equatable, Identifiable, Sendable {
    let id: String
    /// The email the account is keyed on. IA §3.17: the identity contract is
    /// email end to end — only the transport field kept the older name.
    let username: String
}

/// `POST /auth/register` returns the `User` of `server/services/user.service.ts`,
/// which is a DIFFERENT shape from the auth payload above. Mirrors
/// `web/api/register.gen.ts` field for field.
struct RegisteredUser: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let email: String
    let displayName: String
}

struct RegisterInput: Encodable, Sendable {
    let email: String
    let password: String
    let displayName: String
}

/// Auth endpoints. Thin — the interesting behaviour is in `SessionStore`.
struct AuthApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /auth/login`. `username` is the email; the name is the framework's.
    ///
    /// Opted out of session-expiry publishing: a 401 here means the credentials
    /// were wrong, not that a session lapsed.
    func login(username: String, password: String) async throws -> User {
        struct Input: Encodable {
            let username: String
            let password: String
        }
        return try await client.post(
            "/auth/login",
            body: Input(username: username, password: password),
            as: User.self,
            options: .authEndpoint
        )
    }

    /// `POST /auth/logout`. A 401 means the cookie had already lapsed on a
    /// deliberate sign-out — not news to someone who just pressed the button.
    func logout() async throws {
        struct Ok: Decodable { let ok: Bool }
        _ = try await client.post("/auth/logout", as: Ok.self, options: .authEndpoint)
    }

    /// `GET /auth/me`. Deliberately NOT opted out: a 401 here really does mean
    /// the session is gone.
    func me() async throws -> User {
        try await client.get("/auth/me", as: User.self)
    }

    /// `POST /auth/register` — `web/api/register.gen.ts`. Establishes a session
    /// on success (the server issues the cookie in the same response), so a
    /// caller follows this with `me()` to learn the auth-shaped user.
    func register(email: String, displayName: String, password: String) async throws -> RegisteredUser {
        try await client.post(
            "/auth/register",
            body: RegisterInput(email: email, password: password, displayName: displayName),
            as: RegisteredUser.self,
            options: .authEndpoint
        )
    }
}
