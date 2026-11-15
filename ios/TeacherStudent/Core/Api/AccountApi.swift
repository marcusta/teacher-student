import Foundation

/// Port of `createAccountClient` — `web/api/account.gen.ts`.
///
/// Its own client rather than a method on `AuthApi`, exactly as on the web:
/// `/account/*` is what a signed-in account does to itself, `/auth/*` is how a
/// session is started and ended, and the two differ in the way that matters to
/// every call here — an `/auth/*` 401 is an answer about credentials, an
/// `/account/*` 401 is a session that has gone.
struct AccountApi: Sendable {
    private let client: ApiClient

    init(client: ApiClient = .shared) {
        self.client = client
    }

    /// `POST /account/password`.
    ///
    /// Deliberately on the DEFAULT options, with session-expiry publishing left
    /// on: this is called from inside the app shell with a session that is
    /// supposed to exist, so a 401 means it lapsed and the app should return to
    /// the auth gate. The wrong-current-password answer arrives as 409, never
    /// 401, which is what makes that safe here.
    @discardableResult
    func changePassword(currentPassword: String, newPassword: String) async throws -> OkResponse {
        struct Input: Encodable {
            let currentPassword: String
            let newPassword: String
        }
        return try await client.post(
            "/account/password",
            body: Input(currentPassword: currentPassword, newPassword: newPassword),
            as: OkResponse.self
        )
    }
}
