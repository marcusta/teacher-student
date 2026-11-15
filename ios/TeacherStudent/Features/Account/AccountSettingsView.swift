import SwiftUI

/// Kontoinställningar — the signed-in account screen.
///
/// It lives INSIDE the app shell, not behind the auth gate, so it speaks the
/// catalog vocabulary (`CatalogPanel` / `CatalogField` / `catalogInput`) rather
/// than the `AuthScaffold` one: the auth scaffold is the full-bleed public entry
/// surface, and a settings sheet is a form on the app's own paper.
///
/// Presented as a sheet by `MainTabView`, which is why it owns its own
/// `NavigationStack` and the way out of it. It is not a `Route`: `Routes.swift`
/// scopes `Route` to cross-feature detail deep-links, and the toolbar that opens
/// this is shared by all five tab stacks — a pushed destination would land in
/// whichever stack happened to be frontmost.
///
/// The one write here is a password change, and the screen stays put after it
/// succeeds. Dismissing on success would take the acknowledgement with it.
struct AccountSettingsView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    private let api: Api

    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var fieldErrors: [AccountCopy.ChangePasswordField: String] = [:]
    /// Empty until the first submit; drives every invalid-state binding, so the
    /// form does not scold a half-typed password.
    @State private var submitted = false
    @State private var isLoading = false
    @State private var alertKey: String?
    /// The success line, held as the message rather than a flag so
    /// `catalogAcknowledgement` can retire it after four seconds — the sheet's
    /// equivalent of the web's transient toast. A banner that never leaves would
    /// still be claiming a save while the reader typed the next one.
    @State private var acknowledgement: String?
    @FocusState private var focused: AccountCopy.ChangePasswordField?

    init(api: Api = .shared) {
        self.api = api
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.xl) {
                    Text(I18n.t("account.lede"))
                        .font(Typography.lede)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)

                    accountSection
                    passwordSection
                }
                .padding(Spacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .catalogAcknowledgement($acknowledgement)
            .background(Palette.bg)
            .navigationTitle(I18n.t("account.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("notes.cancel")) { dismiss() }
                        .disabled(isLoading)
                }
            }
            // Neither exit is available while the write is in flight. A sheet
            // swiped away mid-save leaves the password CHANGED behind a screen
            // that never got to say so, and the reader locked out of an account
            // they believe is unchanged. The web freezes its whole form with
            // `inert` for the same reason.
            .interactiveDismissDisabled(isLoading)
            // A `Text` cannot announce itself — `.accessibilityAddTraits` does
            // not move focus and does not speak. Without these the one failure a
            // VoiceOver reader cannot see coming (network, 500) is met with
            // silence and a screen that looks unchanged.
            .onChange(of: alertKey) { _, key in
                guard let key else { return }
                AccessibilityNotification.Announcement(I18n.t(key)).post()
            }
            .onChange(of: acknowledgement) { _, message in
                guard let message else { return }
                AccessibilityNotification.Announcement(message).post()
            }
        }
    }

    // MARK: - Sections

    /// Read-only, and that is the whole design: the email is the identity the
    /// server keys the account on, so it is shown to be recognised rather than
    /// edited. `User.username` IS that email — only the transport field kept the
    /// older name.
    private var accountSection: some View {
        CatalogSection(heading: I18n.t("account.section.account")) {
            CatalogPanel {
                CatalogField(label: I18n.t("account.field.email")) {
                    Text(session.currentUser?.username ?? "")
                        .font(Typography.body)
                        .foregroundStyle(Palette.text)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var passwordSection: some View {
        CatalogSection(
            heading: I18n.t("account.password.title"),
            lede: I18n.t("account.password.lede")
        ) {
            CatalogPanel {
                CatalogField(
                    label: I18n.t("account.field.currentPassword"),
                    hint: I18n.t("account.hint.currentPassword"),
                    error: AccountCopy.message(fieldErrors[.currentPassword])
                ) {
                    SecureField("", text: $currentPassword)
                        .textContentType(.password)
                        .catalogInput()
                        .focused($focused, equals: .currentPassword)
                        .submitLabel(.next)
                        .onSubmit { focused = .newPassword }
                        .onChange(of: currentPassword) { revalidate() }
                }

                CatalogField(
                    label: I18n.t("account.field.newPassword"),
                    hint: I18n.t("account.hint.newPassword"),
                    error: AccountCopy.message(fieldErrors[.newPassword])
                ) {
                    SecureField("", text: $newPassword)
                        .textContentType(.newPassword)
                        .catalogInput()
                        .focused($focused, equals: .newPassword)
                        .submitLabel(.next)
                        .onSubmit { focused = .confirmPassword }
                        .onChange(of: newPassword) { revalidate() }
                }

                CatalogField(
                    label: I18n.t("account.field.confirmPassword"),
                    hint: I18n.t("account.hint.confirmPassword"),
                    error: AccountCopy.message(fieldErrors[.confirmPassword])
                ) {
                    SecureField("", text: $confirmPassword)
                        .textContentType(.newPassword)
                        .catalogInput()
                        .focused($focused, equals: .confirmPassword)
                        .submitLabel(.go)
                        .onSubmit { submit() }
                        .onChange(of: confirmPassword) { revalidate() }
                }

                if let alertKey {
                    // A failure reported WHERE it happened, one line above the
                    // button that produced it. Nothing typed is cleared — a
                    // dropped connection must not cost three re-typed passwords.
                    // It is SPOKEN by the announcement on `alertKey`; a trait on
                    // this `Text` would neither move focus nor say anything.
                    Text(I18n.t(alertKey))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.danger)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(
                    I18n.t(isLoading ? "account.password.submitting" : "account.password.submit")
                ) {
                    submit()
                }
                .font(Typography.button)
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
                .disabled(isLoading)
            }
        }
    }

    // MARK: - Behaviour

    /// Validate on input only once the person has actually submitted. Flagging a
    /// password on the third keystroke is noise; leaving a flagged field flagged
    /// while it is being fixed is worse.
    private func revalidate() {
        guard submitted else { return }
        fieldErrors = AccountCopy.validate(
            current: currentPassword,
            new: newPassword,
            confirm: confirmPassword
        )
    }

    private func submit() {
        // The Go key on the last field is a second way in, and it is NOT covered
        // by the button's `disabled`. Two presses on a slow connection would post
        // the same body twice: the second lands after the hash has rotated, so a
        // successful change would report itself as a wrong current password.
        guard !isLoading else { return }
        submitted = true
        // Both the failure and the acknowledgement belong to the attempt that
        // caused them — including an attempt rejected right here, which must not
        // leave a green "saved" standing over a red validation error about a save
        // that never happened.
        alertKey = nil
        acknowledgement = nil
        let errors = AccountCopy.validate(
            current: currentPassword,
            new: newPassword,
            confirm: confirmPassword
        )
        fieldErrors = errors
        guard errors.isEmpty else {
            // A rejected submit must land the caret on the thing to fix, and on
            // the FIRST thing to fix.
            focused = AccountCopy.ChangePasswordField.allCases.first { errors[$0] != nil }
            return
        }

        isLoading = true
        Task {
            defer { isLoading = false }
            do {
                try await api.account.changePassword(
                    currentPassword: currentPassword,
                    newPassword: newPassword
                )
                currentPassword = ""
                newPassword = ""
                confirmPassword = ""
                fieldErrors = [:]
                submitted = false
                focused = nil
                acknowledgement = I18n.t("account.password.saved")
            } catch let error as ApiError {
                alertKey = AccountCopy.changePasswordErrorKey(error)
                // The wrong-password answer has one field to fix; send the caret
                // there rather than leaving the reader to find it.
                if error.code == .conflict { focused = .currentPassword }
            } catch {
                alertKey = "account.error.server"
            }
        }
    }
}
