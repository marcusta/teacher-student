import SwiftUI

/// A confirmation, a warning, or an undo offer — the local stand-in for the
/// web's `ToastService`.
///
/// `Core/UI` has no toast, and this slice may not add one to it. So the same
/// four messages the web raises as toasts (`lesson.saved`,
/// `lesson.toast.completed` / `.cancelled`, and the two undo offers) are drawn
/// INLINE, at the top of the screen that caused them, rather than floating over
/// the tab bar.
///
/// Inline is arguably the better shape on a phone: the message sits where the
/// change happened, it moves the content instead of covering it, and an undo
/// button in the flow of the page is a real target rather than a 44pt strip
/// competing with the home indicator.
struct LessonNotice: Identifiable {
    enum Tone {
        /// It worked.
        case success
        /// It half worked, and the reader has something to fix.
        case warning
    }

    let id = UUID()
    let message: String
    var tone: Tone = .success
    /// The undo offer, where the action can actually be taken back (§4.12).
    /// Terminal transitions deliberately carry none: their reversibility was
    /// spent on the confirmation dialog, BEFORE the decision was taken.
    var actionLabel: String?
    var action: (() -> Void)?

    /// Longer with an action than without: an undo the reader has to notice,
    /// read and hit needs more than an acknowledgement they only have to see.
    /// Same split as the web `ToastService` (8s with an action, 5s without).
    var lifetime: Duration {
        actionLabel == nil ? .seconds(5) : .seconds(8)
    }
}

/// Draws a `LessonNotice` and expires it.
///
/// Self-dismissing on purpose: a close button needs a label, the catalog has no
/// key for one, and inventing Swedish copy locally is exactly what the "copy
/// via i18n" convention forbids. So the notice times out the way the toast it
/// replaces did, and nothing here says a word the catalog has not authored.
struct LessonNoticeBar<Trailing: View>: View {
    let notice: LessonNotice
    let onExpire: () -> Void
    @ViewBuilder var trailing: () -> Trailing

    init(
        notice: LessonNotice,
        onExpire: @escaping () -> Void,
        @ViewBuilder trailing: @escaping () -> Trailing = { EmptyView() }
    ) {
        self.notice = notice
        self.onExpire = onExpire
        self.trailing = trailing
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(notice.message)
                .font(Typography.body)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)

            if let label = notice.actionLabel, let action = notice.action {
                Button(label) {
                    action()
                    onExpire()
                }
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
            }
            trailing()
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(border, lineWidth: 1)
        }
        .accessibilityElement(children: .contain)
        // Announced, not just drawn: the reader may not be looking at the top
        // of the page when the change lands.
        .accessibilityAddTraits(.isStaticText)
        .task(id: notice.id) {
            try? await Task.sleep(for: notice.lifetime)
            guard !Task.isCancelled else { return }
            onExpire()
        }
    }

    private var background: Color {
        notice.tone == .success ? Palette.successSoft : Palette.warningSoft
    }

    private var border: Color {
        notice.tone == .success ? Palette.success : Palette.warning
    }
}

/// The §4.4 conflict banner: a 409 says this screen is working from a stale
/// copy, so the way out is a re-read, not a retry of the same write.
struct LessonConflictBanner: View {
    let refresh: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(I18n.t("lesson.conflict.message"))
                .font(Typography.body)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            Button(I18n.t("lesson.conflict.action"), action: refresh)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.warningSoft, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.warning, lineWidth: 1)
        }
    }
}

/// A read that failed while the screen already has content to show. The full
/// `ErrorStateView` replaces a view; this one sits above what is still there,
/// which is the web's behaviour when a reload fails over a populated list.
struct LessonErrorBanner: View {
    let retry: () -> Void

    var body: some View {
        HStack(spacing: Spacing.md) {
            Text(I18n.t("lessons.error"))
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            Button(I18n.t("lessons.retry"), action: retry)
                .font(Typography.caption.weight(.semibold))
                .buttonStyle(.plain)
                .foregroundStyle(Palette.accentStrong)
        }
        .padding(Spacing.md)
        .background(Palette.dangerSoft, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.danger, lineWidth: 1)
        }
    }
}

/// The material behind a picker could not be read.
///
/// Sits exactly where the control it replaces would sit, and that placement is
/// the whole point. Attaching a Program and adding an Övning are CAPABILITIES
/// the reader has; hiding the control because its catalog came back empty makes
/// a failed read look like a permission the reader does not have, and leaves no
/// way to get it back. So the failure is stated in the control's own place,
/// with the retry that restores it.
///
/// Deliberately quieter than `LessonErrorBanner`: one section is degraded, not
/// the screen.
struct LessonLoadFailureRow: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        HStack(spacing: Spacing.md) {
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            Button(I18n.t("lessons.retry"), action: retry)
                .font(Typography.caption.weight(.semibold))
                .buttonStyle(.plain)
                .foregroundStyle(Palette.accentStrong)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
        }
    }
}

/// Where a picker's catalog has got to.
///
/// Three states because they are three different sentences, and the middle one
/// is the one that is easy to lose: `failed` is "we could not find out" and
/// wants a retry, `loaded` with nothing in it is "you have none", and `pending`
/// is neither — it is the answer not being back yet. Collapsed into a boolean,
/// `pending` renders as whatever the empty case renders as, which for a control
/// that only appears when it has something to offer is NO CONTROL — the same
/// thing the reader sees when they are not allowed one.
///
/// Shared by the Lesson detail's two pickers and the create sheet's, so the
/// three states cannot drift apart between the screen that attaches a Program
/// and the screen that picks one at booking time.
enum LessonCatalogLoad {
    case pending, loaded, failed
}

/// The material behind a picker has not answered yet.
///
/// The twin of `LessonLoadFailureRow`, and it exists for the same reason one
/// level earlier: a control that appears only once its catalog has something in
/// it is INDISTINGUISHABLE, while the read is in flight, from a control this
/// Lesson is not allowed to have. So the place the control will occupy says that
/// it is on its way, and the reader waits for a control they can see coming
/// instead of concluding there is none.
///
/// Quieter than a `LoadingView`: this is one section still arriving, not a
/// screen that has yet to say anything at all.
struct LessonCatalogLoadingRow: View {
    let message: String

    var body: some View {
        HStack(spacing: Spacing.md) {
            ProgressView()
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
    }
}

/// A parent chip that PUSHES a `Route`.
///
/// `DetailHeaderChip` takes a `navigate` closure, and a feature has no way to
/// perform a push: `MainTabView` builds its `NavigationStack` without a path
/// binding, so the only push a slice can make is a `NavigationLink`. Hence this
/// chip row, drawn under the header rather than inside it, in the header chip's
/// own recipe so the two read as one cluster.
struct LessonRouteChip: View {
    let label: String
    let route: Route

    var body: some View {
        NavigationLink(value: route) {
            Text(label)
                .font(Typography.caption.weight(.semibold))
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, 2)
                .foregroundStyle(Palette.accentStrong)
                .overlay { Capsule().strokeBorder(Palette.borderStrong, lineWidth: 1) }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(.isLink)
    }
}

/// The §4.8 field wrapper the web form draws with `input()` inside a panel:
/// label, control, optional hint. Local because it is a form recipe, and the
/// two Lesson forms are the only things in this slice that need one.
struct LessonField<Control: View>: View {
    let label: String
    var hint: String?
    @ViewBuilder var control: () -> Control

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.label)
                .foregroundStyle(Palette.text)
            control()
                .frame(maxWidth: .infinity, alignment: .leading)
            if let hint {
                Text(hint)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The card the fields sit in. §4.8's recessed field fill is recessed INTO
/// something — on the page colour alone a field would be invisible.
struct LessonPanel<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            content()
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
        }
    }
}
