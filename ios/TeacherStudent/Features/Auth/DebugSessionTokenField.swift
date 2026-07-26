#if DEBUG
import SwiftUI

/// Debug-only sign-in for agents and developers — AGENTS.md, PLAN.md §Backend.
///
/// `bun run dev:session -- anna@example.com` mints a real session token against
/// the local database. The cookie it belongs in is httpOnly, so it cannot be
/// installed from anywhere but the client's own cookie storage; pasting it here
/// does exactly that and then re-runs the launch-time `/auth/me`.
///
/// This exists so that nothing in this app ever needs a password: agents must
/// not automate the login form, and must not use or invent credentials. It is
/// compiled out of Release builds entirely.
struct DebugSessionTokenField: View {
    @Environment(SessionStore.self) private var session

    @State private var isExpanded = false
    @State private var token = ""
    @State private var baseURL = ApiClient.shared.baseURL.absoluteString
    @State private var isWorking = false

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text("bun run dev:session -- anna@example.com")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(Palette.textMuted)
                    .textSelection(.enabled)

                TextField("apiBaseURL", text: $baseURL)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                    .onSubmit(persistBaseURL)
                    // Also on every keystroke: the retry that USES this value
                    // lives on another view, so requiring a return key means a
                    // finished address that was never submitted is silently
                    // ignored and the retry re-asks the old host.
                    .onChange(of: baseURL) { persistBaseURL() }

                TextField("session token", text: $token)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(.system(.footnote, design: .monospaced))

                Button("Använd token") { adopt() }
                    .buttonStyle(.bordered)
                    .disabled(token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isWorking)
            }
            .padding(.top, Spacing.sm)
        } label: {
            Text("Utvecklarinloggning")
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
        }
        .tint(Palette.textMuted)
    }

    private func persistBaseURL() {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        UserDefaults.standard.set(trimmed, forKey: ApiClient.baseURLDefaultsKey)
    }

    private func adopt() {
        persistBaseURL()
        isWorking = true
        session.adoptSessionToken(token)
        Task {
            await session.restore()
            isWorking = false
        }
    }
}
#endif
