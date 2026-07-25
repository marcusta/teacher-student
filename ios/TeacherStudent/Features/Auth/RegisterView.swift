import SwiftUI

/// Register — IA §3.17.
///
/// Email, display name, password, and nothing else. In particular there is no
/// Teacher/Student question: IA §1 has no account mode, and asking would invent
/// a product concept that does not exist. Capability follows from Relations, and
/// the email keyed here is what an invitation matches against.
struct RegisterView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var displayName = ""
    @State private var password = ""
    @State private var fieldErrors: [AuthCopy.RegisterField: String] = [:]
    @State private var submitted = false
    @State private var isLoading = false
    @State private var alertKey: String?
    @FocusState private var focused: AuthCopy.RegisterField?

    var body: some View {
        AuthScaffold(
            title: I18n.t("auth.register.title"),
            lede: I18n.t("auth.register.lede"),
            alert: alertKey.map { I18n.t($0) }
        ) {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                AuthField(
                    label: I18n.t("auth.field.email"),
                    hint: I18n.t("auth.hint.email"),
                    error: AuthCopy.message(fieldErrors[.email])
                ) {
                    TextField("", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focused, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focused = .displayName }
                        .onChange(of: email) { revalidate() }
                }

                AuthField(
                    label: I18n.t("auth.field.displayName"),
                    hint: I18n.t("auth.hint.displayName"),
                    error: AuthCopy.message(fieldErrors[.displayName])
                ) {
                    TextField("", text: $displayName)
                        .textContentType(.name)
                        .focused($focused, equals: .displayName)
                        .submitLabel(.next)
                        .onSubmit { focused = .password }
                        .onChange(of: displayName) { revalidate() }
                }

                AuthField(
                    label: I18n.t("auth.field.password"),
                    hint: I18n.t("auth.hint.password"),
                    error: AuthCopy.message(fieldErrors[.password])
                ) {
                    SecureField("", text: $password)
                        .textContentType(.newPassword)
                        .focused($focused, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { submit() }
                        .onChange(of: password) { revalidate() }
                }

                AuthSubmitButton(
                    title: I18n.t("auth.register.submit"),
                    loadingTitle: I18n.t("auth.register.submitting"),
                    isLoading: isLoading,
                    action: submit
                )
            }
        } footer: {
            HStack(spacing: Spacing.xs) {
                Text(I18n.t("auth.register.altPrompt"))
                    .foregroundStyle(Palette.textMuted)
                Button(I18n.t("auth.register.altLink")) { dismiss() }
                    .foregroundStyle(Palette.accent)
            }
            .font(Typography.caption)
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func revalidate() {
        guard submitted else { return }
        fieldErrors = AuthCopy.validateRegister(email: email, displayName: displayName, password: password)
    }

    private func submit() {
        submitted = true
        let errors = AuthCopy.validateRegister(email: email, displayName: displayName, password: password)
        fieldErrors = errors
        guard errors.isEmpty else {
            focused = AuthCopy.RegisterField.allCases.first { errors[$0] != nil }
            return
        }
        alertKey = nil
        isLoading = true
        Task {
            defer { isLoading = false }
            do {
                try await session.register(
                    email: email.trimmingCharacters(in: .whitespaces),
                    displayName: displayName.trimmingCharacters(in: .whitespaces),
                    password: password
                )
                // Success signs the visitor in; the root view swaps the whole
                // shell, so there is nothing to navigate to from here.
            } catch let error as ApiError {
                alertKey = AuthCopy.registerErrorKey(error)
            } catch {
                alertKey = "auth.error.server"
            }
        }
    }
}
