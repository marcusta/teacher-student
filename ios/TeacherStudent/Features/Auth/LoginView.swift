import SwiftUI

/// Login — IA §3.17.
///
/// The identity field is EMAIL. The transport parameter is still called
/// `username` inside the framework's auth service, and the old test client
/// surfaced that name to the person typing into it; the server keys accounts on
/// email, so the label says what the field actually holds.
///
/// There is no Teacher/Student choice here and there must never be one — IA §1
/// has no account mode to pick.
struct LoginView: View {
    @Environment(SessionStore.self) private var session

    @State private var email = ""
    @State private var password = ""
    @State private var fieldErrors: [AuthCopy.LoginField: String] = [:]
    /// Empty until the first submit; drives every invalid-state binding.
    @State private var submitted = false
    @State private var isLoading = false
    @State private var alertKey: String?
    @State private var showRegister = false
    @FocusState private var focused: AuthCopy.LoginField?

    var body: some View {
        AuthScaffold(
            title: I18n.t("auth.login.title"),
            lede: I18n.t("auth.login.lede"),
            alert: alertKey.map { I18n.t($0) }
        ) {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                AuthField(
                    label: I18n.t("auth.field.email"),
                    error: AuthCopy.message(fieldErrors[.email])
                ) {
                    TextField("", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focused, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focused = .password }
                        .onChange(of: email) { revalidate() }
                }

                AuthField(
                    label: I18n.t("auth.field.password"),
                    error: AuthCopy.message(fieldErrors[.password])
                ) {
                    SecureField("", text: $password)
                        .textContentType(.password)
                        .focused($focused, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { submit() }
                        .onChange(of: password) { revalidate() }
                }

                AuthSubmitButton(
                    title: I18n.t("auth.login.submit"),
                    loadingTitle: I18n.t("auth.login.submitting"),
                    isLoading: isLoading,
                    action: submit
                )

                #if DEBUG
                DebugSessionTokenField()
                #endif
            }
        } footer: {
            HStack(spacing: Spacing.xs) {
                Text(I18n.t("auth.login.altPrompt"))
                    .foregroundStyle(Palette.textMuted)
                Button(I18n.t("auth.login.altLink")) { showRegister = true }
                    .foregroundStyle(Palette.accent)
            }
            .font(Typography.caption)
        }
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    /// Validate on input only once the person has actually submitted. Marking a
    /// half-typed address invalid on the third keystroke is noise; leaving a
    /// flagged field flagged while it is being fixed is worse.
    private func revalidate() {
        guard submitted else { return }
        fieldErrors = AuthCopy.validateLogin(email: email, password: password)
    }

    private func submit() {
        submitted = true
        let errors = AuthCopy.validateLogin(email: email, password: password)
        fieldErrors = errors
        guard errors.isEmpty else {
            // A rejected submit must land the caret on the thing to fix.
            focused = errors[.email] != nil ? .email : .password
            return
        }
        // A failure belongs to the attempt that caused it, so the alert opens clean.
        alertKey = nil
        isLoading = true
        Task {
            defer { isLoading = false }
            do {
                try await session.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
            } catch let error as ApiError {
                alertKey = AuthCopy.loginErrorKey(error)
            } catch {
                alertKey = "auth.error.server"
            }
        }
    }
}
