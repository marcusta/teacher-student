import Foundation
import Observation

/// The app's single source of truth for "who is signed in" — the port of
/// `vendor/basics-core/client/auth.ts`'s `AuthService`.
///
/// `RootView` reads it to decide between the auth gate and the tab shell
/// (IA §3.17: an existing session skips public entry, and a protected view is
/// not reachable without one). Every 401 from anywhere in the app arrives here
/// as `.apiSessionExpired` and clears the user, so a session that lapses
/// mid-visit returns to the gate instead of leaving a broken signed-in shell.
@MainActor
@Observable
final class SessionStore {
    private(set) var currentUser: User?

    /// True until the launch-time `GET /auth/me` has settled. The root view
    /// shows a splash rather than flashing the login form at someone who is
    /// already signed in.
    private(set) var isRestoring = true

    /// Set when the launch-time check could not reach the server at all. The
    /// gate is NOT the right answer then: the cookie may be perfectly valid, and
    /// signing in again cannot work either while the network is down.
    private(set) var restoreFailed = false

    private let api: AuthApi
    private let client: ApiClient
    @ObservationIgnored private var expiryObserver: NSObjectProtocol?

    init(api: AuthApi = AuthApi(), client: ApiClient = .shared) {
        self.api = api
        self.client = client
        expiryObserver = NotificationCenter.default.addObserver(
            forName: .apiSessionExpired,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            // Guarded so a burst of concurrent 401s clears once, and so a 401
            // arriving while already signed out is a no-op.
            MainActor.assumeIsolated {
                guard let self, self.currentUser != nil else { return }
                self.currentUser = nil
            }
        }
    }

    deinit {
        if let expiryObserver {
            NotificationCenter.default.removeObserver(expiryObserver)
        }
    }

    var isAuthenticated: Bool { currentUser != nil }

    /// Launch-time session check. A 401 is the expected answer for a visitor
    /// with no cookie, so it is not an error state — it is the signed-out state.
    ///
    /// A TRANSPORT failure is a third thing, and collapsing it into the second
    /// is what the web deliberately avoids: it means launching offline drops a
    /// signed-in reader on a login form that also cannot work. So it is recorded
    /// and the root view offers a retry instead of the gate.
    func restore() async {
        isRestoring = true
        restoreFailed = false
        defer { isRestoring = false }
        do {
            currentUser = try await api.me()
        } catch let error as ApiError {
            currentUser = nil
            restoreFailed = error.code == .network || error.code == .timeout
        } catch is CancellationError {
            // An abandoned request answered NOTHING, so it may not claim the
            // reader is signed out — that claim is what puts a signed-in account
            // on the login gate. Treated as unresolved: keep whatever we knew and
            // offer the retry, which is the one exit that re-asks the server.
            restoreFailed = true
        } catch {
            currentUser = nil
        }
    }

    /// Sign in. Throws `ApiError` so the caller can map the code to authored
    /// Swedish copy; the raw message is never shown.
    func login(email: String, password: String) async throws {
        currentUser = try await api.login(username: email, password: password)
    }

    /// Register and sign in. The server issues the session cookie with the
    /// registration response, so the auth-shaped user is read back from
    /// `/auth/me` rather than reconstructed from the registration payload —
    /// the two contracts genuinely differ.
    func register(email: String, displayName: String, password: String) async throws {
        _ = try await api.register(email: email, displayName: displayName, password: password)
        currentUser = try await api.me()
    }

    /// Sign out. The user is cleared unless the call failed for a transport
    /// reason, in which case the server session may well still be alive.
    func logout() async {
        do {
            try await api.logout()
            currentUser = nil
        } catch let error as ApiError {
            if error.code == .auth { currentUser = nil }
        } catch {
            // Network/timeout: leave the session alone and let the user retry.
        }
    }

    #if DEBUG
    /// Adopt a raw session token minted by `bun run dev:session -- <email>`.
    ///
    /// This is the SUPPORTED agent/dev sign-in path (AGENTS.md): the cookie is
    /// httpOnly, so it cannot be set from page script, and agents must not
    /// automate the login form or use credentials. Nothing here knows or stores
    /// a password. Debug builds only.
    /// Returns false when the token could not be installed — an empty paste, or
    /// a base URL with no host — so the caller can say so instead of leaving a
    /// silent 401 to explain itself.
    @discardableResult
    func adoptSessionToken(_ token: String) -> Bool {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        return client.setSessionCookie(trimmed)
    }
    #endif
}
