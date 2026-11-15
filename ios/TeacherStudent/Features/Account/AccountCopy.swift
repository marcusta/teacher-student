import Foundation

/// Validation and error copy for Kontoinställningar — the signed-in account
/// screen, whose one write is a password change.
///
/// Kept apart from the view for the reason `AuthCopy` gives: which field is
/// wrong, and what a failed request should SAY, is the part worth asserting.
/// The same two design system §4.8 rules are encoded here:
///
///   1. An error explains what is wrong AND how to fix it.
///   2. No raw server text reaches the screen. `ApiError.message` is English
///      written for a developer; every code maps to authored copy instead, so
///      the `message` field is deliberately never read.
enum AccountCopy {
    /// Server-enforced minimum, the same one registration is held to
    /// (`RegisterInput.password.minLength`). Duplicated as a value rather than
    /// read off `AuthCopy` so the account screen is not silently re-tuned by an
    /// edit to the public entry views.
    static let minPasswordLength = 8

    /// The server's cap on both fields. Checked here so a generated passphrase
    /// that is too long is refused BY THE FIELD it is in — without it the server
    /// answers 400 and the form apologises generically, marking nothing, about
    /// the one problem the reader could have fixed in a second.
    static let maxPasswordLength = 200

    enum ChangePasswordField: String, CaseIterable {
        case currentPassword, newPassword, confirmPassword
    }

    /// Order matters: the first problem found is the one the caret lands on, and
    /// it must be the topmost field with something wrong — a reader fixing the
    /// confirmation while the new password is empty is fixing the wrong thing.
    ///
    /// The current password is checked for PRESENCE only, never for length or
    /// shape. A rule that tightened after the account was made would otherwise
    /// refuse the very password the server is about to verify, and the one
    /// screen that could change it would be the screen refusing.
    static func validate(current: String, new: String, confirm: String) -> [ChangePasswordField: String] {
        var errors: [ChangePasswordField: String] = [:]

        if current.isEmpty {
            errors[.currentPassword] = "account.error.currentPasswordRequired"
        }

        if new.isEmpty {
            errors[.newPassword] = "account.error.newPasswordRequired"
        } else if new.count < minPasswordLength {
            errors[.newPassword] = "account.error.newPasswordTooShort"
        } else if new.count > maxPasswordLength {
            errors[.newPassword] = "account.error.newPasswordTooLong"
        } else if new == current {
            // Caught here rather than at the server, which would accept it: a
            // change that changes nothing is a mistake, not a preference.
            errors[.newPassword] = "account.error.newPasswordSameAsCurrent"
        }

        if confirm != new {
            errors[.confirmPassword] = "account.error.confirmMismatch"
        }

        return errors
    }

    /// Password-change failure copy.
    ///
    /// 409 is the one branch that carries real information back to the reader:
    /// the server verified the current password and it was wrong. It does NOT
    /// collapse into a generic failure the way a sign-in's 401 does — there is
    /// no account-enumeration oracle on a screen only the account holder can
    /// reach, and telling them which of the three fields to retype is the whole
    /// difference between a fixable form and a stuck one.
    ///
    /// `.auth` is a lapsed session, not a rejected password: the request never
    /// got as far as verifying anything, so the copy has to send the reader to
    /// sign in rather than to the current-password field.
    static func changePasswordErrorKey(_ error: ApiError) -> String {
        switch error.code {
        case .conflict: return "account.error.currentPasswordWrong"
        case .validation: return "account.error.validation"
        case .rateLimit: return "account.error.rateLimit"
        case .auth: return "account.error.auth"
        case .network, .timeout: return "account.error.network"
        default: return "account.error.server"
        }
    }

    /// Resolve a key from any function above into display text.
    static func message(_ key: String?) -> String {
        guard let key else { return "" }
        return I18n.t(key)
    }
}
