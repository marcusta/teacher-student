import SwiftUI

/// The auth gate — IA §3.17: an existing session skips public entry, and a
/// protected view is not reachable without one.
///
/// Three states, and the splash is not decoration: without it the login form
/// paints for a frame on every cold start before `/auth/me` answers, which is a
/// flash of the wrong view for a visitor who is already signed in. The web
/// client solves the same problem by deriving the view at read time; here the
/// restoring flag does it.
struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        Group {
            if session.isRestoring {
                SplashView()
            } else if session.restoreFailed {
                // The server was unreachable, so whether a session exists is
                // UNKNOWN. Showing the gate would assert the reader is signed
                // out and offer a sign-in that cannot succeed either.
                ErrorStateView(
                    message: I18n.t("auth.error.network"),
                    retryTitle: I18n.t("home.retry")
                ) {
                    Task { await session.restore() }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Palette.bg)
            } else if session.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .animation(Motion.standard, value: session.isRestoring)
        .animation(Motion.standard, value: session.currentUser)
        .task {
            await session.restore()
        }
    }
}

/// Launch state. Brand only — nothing to read, nothing to press.
struct SplashView: View {
    var body: some View {
        VStack(spacing: Spacing.lg) {
            Text(I18n.t("app.brand"))
                .font(Typography.wordmark)
                .foregroundStyle(Palette.text)
                .textCase(.uppercase)
                .kerning(1.5)
            ProgressView()
                .tint(Palette.accent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Palette.bg)
    }
}
