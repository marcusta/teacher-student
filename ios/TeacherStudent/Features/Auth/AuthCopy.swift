import Foundation

/// Validation and error copy for the public entry views (IA §3.17) — a port of
/// `web/auth/auth-copy.ts`.
///
/// Kept apart from the views because it is the part worth asserting: which
/// field is wrong, and what a failed request should SAY. Two design system §4.8
/// rules are encoded here rather than left to review:
///
///   1. An error explains what is wrong AND how to fix it. No branch returns a
///      bare "Ogiltig e-post", and none apologises.
///   2. No raw server text ever reaches the screen. `ApiError.message` is
///      English written for a developer ('Unauthorized'); every code maps to
///      authored Swedish instead. The `message` field is deliberately never read.
enum AuthCopy {
    /// The identity contract is EMAIL, end to end — the server keys users on
    /// email and `UserService.verify` looks it up by that. This pattern matches
    /// the server's `RegisterInput` schema, so the client rejects what the
    /// server would reject, with better copy.
    private static let emailPattern = try! NSRegularExpression(pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

    /// Server-enforced minimum (`RegisterInput.password.minLength`).
    static let minPasswordLength = 8

    enum LoginField: String, CaseIterable {
        case email, password
    }

    enum RegisterField: String, CaseIterable {
        case email, displayName, password
    }

    private static func emailProblem(_ email: String) -> String? {
        let trimmed = email.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty { return "auth.error.emailRequired" }
        let range = NSRange(trimmed.startIndex..., in: trimmed)
        if emailPattern.firstMatch(in: trimmed, range: range) == nil { return "auth.error.emailInvalid" }
        return nil
    }

    /// Login checks presence and shape only — never length. A password rule
    /// that changed after an account was made would otherwise lock its owner
    /// out of the form before the server ever got a chance to accept them.
    static func validateLogin(email: String, password: String) -> [LoginField: String] {
        var errors: [LoginField: String] = [:]
        if let problem = emailProblem(email) { errors[.email] = problem }
        if password.isEmpty { errors[.password] = "auth.error.passwordRequired" }
        return errors
    }

    static func validateRegister(
        email: String,
        displayName: String,
        password: String
    ) -> [RegisterField: String] {
        var errors: [RegisterField: String] = [:]
        if let problem = emailProblem(email) { errors[.email] = problem }
        if displayName.trimmingCharacters(in: .whitespaces).isEmpty {
            errors[.displayName] = "auth.error.displayNameRequired"
        }
        if password.isEmpty {
            errors[.password] = "auth.error.passwordRequired"
        } else if password.count < minPasswordLength {
            errors[.password] = "auth.error.passwordTooShort"
        }
        return errors
    }

    /// Sign-in failure copy.
    ///
    /// 401 and 400 collapse into one message on purpose. Distinguishing "no
    /// such account" from "wrong password" would confirm to anyone who asks
    /// whether a given address has an account here — an account-enumeration
    /// oracle on the one view that is public by definition.
    ///
    /// `rateLimit` does NOT collapse into the server message, and that is the
    /// point of it existing: routed to `auth.error.server` it read "något gick
    /// fel hos oss", the app apologising for a limit the reader tripped
    /// themselves and advising the retry that is precisely what will not work.
    static func loginErrorKey(_ error: ApiError) -> String {
        switch error.code {
        case .auth, .validation: return "auth.error.credentials"
        case .rateLimit: return "auth.error.rateLimit"
        case .network, .timeout: return "auth.error.network"
        default: return "auth.error.server"
        }
    }

    /// Registration failure copy. 409 is the duplicate-email conflict of §3.17.
    static func registerErrorKey(_ error: ApiError) -> String {
        switch error.code {
        case .conflict: return "auth.error.emailTaken"
        case .validation: return "auth.error.validation"
        case .network, .timeout: return "auth.error.network"
        default: return "auth.error.server"
        }
    }

    /// Resolve a key from any function above into display text.
    static func message(_ key: String?) -> String {
        guard let key else { return "" }
        return I18n.t(key)
    }
}
