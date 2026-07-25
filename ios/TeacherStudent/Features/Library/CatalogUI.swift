import SwiftUI

/// Shared building blocks for the three catalog slices — Bibliotek · Övningar,
/// Bibliotek · Program and Hästar — which are three variations on one screen
/// shape: a retrieval list, a creation sheet, and a detail that is a form plus a
/// separated danger area.
///
/// They live in `Features/Library/` rather than in `Core/UI/` because a feature
/// task must not edit Core (PLAN.md §1). Every one of them is a port of a
/// `web/css.ts` recipe that all three web slices already share, so the
/// duplication removed here is real duplication, not an invented abstraction.
/// The `Catalog` prefix keeps them out of the way of the other feature agents'
/// names until Core grows equivalents.

// MARK: - Detail state

/// The states IA §4 requires of a screen that shows ONE object.
///
/// `notFound` is kept apart from `failed` on purpose: the web collapses them
/// (its `get()` returns `null` for any failure, so a dropped connection renders
/// as "the exercise does not exist"), but the two lead to different actions —
/// one has a retry, the other has a way out. Retrying a 404 never helps.
enum CatalogLoadState: Equatable {
    case loading
    case failed
    case notFound
    case ready

    /// An ANSWER of "not yours or not there" is `notFound`; anything else is a
    /// failure with a retry.
    ///
    /// Read off `code`, never off `status`: that is what `ApiErrorCode.notFound`
    /// exists for, and a transport failure has no status to compare. `.forbidden`
    /// lands in the same branch for the reason `StudentCopy.isNotFound` gives —
    /// a 403 is the same answer in a different word, the object is not the
    /// reader's and retrying will never change that, and §3.5 wants the two
    /// indistinguishable so the screen cannot reveal that an object it may not
    /// read exists.
    static func from(_ error: ApiError) -> CatalogLoadState {
        switch error.code {
        case .notFound, .forbidden: return .notFound
        default: return .failed
        }
    }
}

// MARK: - Surfaces

/// The web's `card()` — the panel a form's fields sit in.
///
/// The field recipe fills with the page-paper colour, so a form rendered
/// straight onto the background would give the field the same colour as
/// everything behind it. The panel is what the recessed fill is recessed into.
struct CatalogPanel<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            content
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border)
        }
    }
}

/// An aside on the brass hairline — the one place the brass carries meaning
/// without carrying text (design system §05). Used for the Program snapshot
/// rule, which has to be read where it can be acted on.
struct CatalogBrassNote: View {
    let text: String

    init(_ text: String) {
        self.text = text
    }

    var body: some View {
        Text(text)
            .font(Typography.caption)
            .foregroundStyle(Palette.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, Spacing.md)
            .overlay(alignment: .leading) {
                Rectangle().fill(Palette.brassLine).frame(width: 2)
            }
    }
}

/// §3.5/§3.6/§3.15 all require the destructive action in a **separated** area:
/// its own surface behind a rule, never another button in the form's row, where
/// a mis-aimed tap costs an object.
///
/// It carries its own `failure` slot because the destructive action is the one
/// control on a detail screen that is nowhere near the form: reporting a failed
/// archive in the edit panel puts the sentence a screen away from the button
/// that produced it, and says "your changes could not be saved" about an action
/// that saves nothing.
struct CatalogDangerSection: View {
    let heading: String
    let explanation: String
    let actionTitle: String
    var failure: CatalogWriteFailure?
    var refresh: (() -> Void)?
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Divider().overlay(Palette.border)
                .padding(.bottom, Spacing.sm)
            Text(heading)
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.danger)
            Text(explanation)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            if let failure {
                CatalogWriteErrorView(failure: failure, refresh: refresh)
            }
            Button(actionTitle, role: .destructive, action: action)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.danger)
                .padding(.top, Spacing.xs)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A section of a detail screen: serif heading, optional lede, content.
struct CatalogSection<Content: View>: View {
    let heading: String
    var lede: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(heading)
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .accessibilityAddTraits(.isHeader)
            if let lede, !lede.isEmpty {
                Text(lede)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Fields

/// The label / hint / error triple of design system §4.8. The error is a
/// separate slot rather than a colour on the label so a screen reader announces
/// it as its own alert.
struct CatalogField<Content: View>: View {
    let label: String
    var hint: String?
    var error: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.label)
                .foregroundStyle(Palette.text)
            content
            if let hint, !hint.isEmpty {
                Text(hint)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let error, !error.isEmpty {
                Text(error)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isStaticText)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct CatalogInputStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(Typography.body)
            .foregroundStyle(Palette.text)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(Palette.bg, in: RoundedRectangle(cornerRadius: Radius.sm))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.sm).strokeBorder(Palette.border)
            }
    }
}

extension View {
    /// The web's `input()` recipe: a recessed fill inside a `CatalogPanel`.
    func catalogInput() -> some View {
        modifier(CatalogInputStyle())
    }
}

// MARK: - Acknowledgement

/// IA §4 requires a success acknowledgement for every action. The web gets one
/// from `ToastService`; `Core/UI` has no equivalent yet, so this is the local
/// stand-in — an inline banner rather than a floating toast, which is also the
/// more accessible of the two (it stays put and it is in the reading order).
enum CatalogBannerTone {
    case success
    /// A conflict, not a breakage. §4 wants a stale copy to read as recoverable,
    /// and the colour is part of that sentence: nothing is broken, the screen is
    /// simply behind.
    case warning
    case danger
}

struct CatalogBanner: View {
    let message: String
    var tone: CatalogBannerTone = .success

    var body: some View {
        Text(message)
            .font(Typography.caption)
            .foregroundStyle(Palette.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Spacing.md)
            .background(fill, in: RoundedRectangle(cornerRadius: Radius.md))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.md).strokeBorder(stroke)
            }
            .accessibilityAddTraits(.isStaticText)
    }

    private var fill: Color {
        switch tone {
        case .success: return Palette.successSoft
        case .warning: return Palette.warningSoft
        case .danger: return Palette.dangerSoft
        }
    }

    private var stroke: Color {
        switch tone {
        case .success: return Palette.success
        case .warning: return Palette.warning
        case .danger: return Palette.danger
        }
    }
}

// MARK: - Failures on a screen that still stands

/// A banner carrying one recovery action.
///
/// The same shape as `TrainingSessionErrorBanner`: a sentence, and the ONE
/// button that gets the reader out of the state it describes.
struct CatalogNoticeBanner: View {
    let message: String
    var tone: CatalogBannerTone = .danger
    let actionTitle: String
    let action: () -> Void

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            Button(actionTitle, action: action)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(fill, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(stroke, lineWidth: 1)
        }
    }

    private var fill: Color {
        tone == .warning ? Palette.warningSoft : Palette.dangerSoft
    }

    private var stroke: Color {
        tone == .warning ? Palette.warning : Palette.danger
    }
}

/// A failed write or a stale read, rendered WHERE it happened.
///
/// Two shapes, and which one is used is decided by whether there is anything to
/// press. A plain failure ("try again") gets a red line: the retry is the button
/// the reader just used, and it is right there. A failure whose way out is a
/// FETCH — a 409, or a list that could not be refreshed — gets a banner with
/// that fetch on it, because the control it needs does not otherwise exist on
/// the screen. `TrainingSessionErrorBanner` draws the same distinction.
struct CatalogWriteErrorView: View {
    let failure: CatalogWriteFailure
    var refresh: (() -> Void)?

    @ViewBuilder
    var body: some View {
        if let refresh, !failure.actionTitle.isEmpty {
            CatalogNoticeBanner(
                message: failure.message,
                tone: failure.isConflict ? .warning : .danger,
                actionTitle: failure.actionTitle,
                action: refresh
            )
        } else {
            Text(failure.message)
                .font(Typography.caption)
                .foregroundStyle(Palette.danger)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityAddTraits(.isStaticText)
        }
    }
}

private struct CatalogAcknowledgementModifier: ViewModifier {
    @Binding var message: String?

    func body(content: Content) -> some View {
        VStack(spacing: 0) {
            if let message {
                CatalogBanner(message: message)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.sm)
            }
            content
        }
        .animation(Motion.standard, value: message)
        .task(id: message) {
            guard message != nil else { return }
            // Long enough to be read at a walk-past glance, short enough that it
            // is gone before the next action needs the space.
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            message = nil
        }
    }
}

extension View {
    /// Shows a transient success line above the screen's content.
    func catalogAcknowledgement(_ message: Binding<String?>) -> some View {
        modifier(CatalogAcknowledgementModifier(message: message))
    }
}
