import SwiftUI

/// The four states IA §4 requires every view to define explicitly, rather than
/// leaving to blank space or disabled content. Use these — a screen that draws
/// its own spinner has already drifted.

/// Initial loading. The message names what is being fetched, because
/// "Hämtar lektioner…" tells the reader more than a bare spinner does.
struct LoadingView: View {
    let message: String

    init(_ message: String) {
        self.message = message
    }

    var body: some View {
        VStack(spacing: Spacing.md) {
            ProgressView()
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
    }
}

/// Empty collection. The body TEACHES the feature — the web empty states are
/// how a rider discovers that they can also teach — so it is required, and an
/// action is offered wherever there is one thing to do next.
struct EmptyStateView: View {
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: Spacing.md) {
            Text(title)
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .multilineTextAlignment(.center)
            Text(message)
                .font(Typography.body)
                .foregroundStyle(Palette.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .padding(.top, Spacing.xs)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity)
    }
}

/// Failed read. Always paired with a retry — IA §4 requires one for every read.
struct ErrorStateView: View {
    let message: String
    var retryTitle: String
    let retry: () -> Void

    init(message: String, retryTitle: String? = nil, retry: @escaping () -> Void) {
        self.message = message
        // `common.retry` does not exist in the catalog; every view carries its
        // own `<feature>.retry` key with the same wording, so the caller passes
        // theirs and this default only covers the ones that forget.
        self.retryTitle = retryTitle ?? I18n.t("lessons.retry")
        self.retry = retry
    }

    var body: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: "exclamationmark.triangle")
                .font(.title2)
                .foregroundStyle(Palette.warning)
                // Decorative: the message below says the same thing in words, so
                // VoiceOver announcing the symbol first is noise.
                .accessibilityHidden(true)
            Text(message)
                .font(Typography.body)
                .foregroundStyle(Palette.text)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            Button(retryTitle, action: retry)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity)
    }
}

/// Not found / not yours. Deliberately distinct from the error state: nothing
/// is broken and retrying will not help, so the way out is a navigation action.
struct NotFoundView: View {
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: Spacing.md) {
            Text(title)
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .multilineTextAlignment(.center)
            Text(message)
                .font(Typography.body)
                .foregroundStyle(Palette.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
                    .padding(.top, Spacing.xs)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity)
    }
}

#Preview("States") {
    ScrollView {
        VStack(spacing: Spacing.xxl) {
            LoadingView(I18n.t("lessons.loading"))
                .frame(height: 120)
            EmptyStateView(
                title: I18n.t("lessons.empty.teacher.heading"),
                message: I18n.t("lessons.empty.teacher.body"),
                actionTitle: I18n.t("lessons.retry"),
                action: {}
            )
            ErrorStateView(message: I18n.t("lessons.error"), retryTitle: I18n.t("lessons.retry"), retry: {})
            NotFoundView(
                title: I18n.t("lesson.notFound.heading"),
                message: I18n.t("lesson.notFound.body"),
                actionTitle: I18n.t("lesson.notFound.action"),
                action: {}
            )
        }
    }
}
