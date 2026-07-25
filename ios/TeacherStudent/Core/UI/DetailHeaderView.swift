import SwiftUI

/// A path upward. Ported from `DetailHeaderChip`, whose `href` is REQUIRED —
/// there is no decorative chip variant, because these chips ARE the
/// Mål → Plan → Lektion/Träningspass → Övning navigation (IA §1: "Every detail
/// view must expose its parents as links").
///
/// On iOS the web's `href` becomes an action the caller wires to its own
/// navigation path. It is non-optional for the same reason `href` was: an
/// unclickable parent chip is unrepresentable.
struct DetailHeaderChip: Identifiable {
    /// Fully composed label, e.g. `Plan: Hoppsäsong vår 2026`.
    let label: String
    let navigate: () -> Void

    var id: String { label }

    init(label: String, navigate: @escaping () -> Void) {
        self.label = label
        self.navigate = navigate
    }
}

/// One button in the header's action cluster.
struct DetailHeaderAction: Identifiable {
    let label: String
    var isDisabled: Bool
    let perform: () -> Void

    var id: String { label }

    init(label: String, isDisabled: Bool = false, perform: @escaping () -> Void) {
        self.label = label
        self.isDisabled = isDisabled
        self.perform = perform
    }
}

/// Detail page header — design system §4.10.
///
/// Object-type eyebrow, title, status, parent chips, audience chip, metadata
/// line, action cluster. Two rules from the spec's `Undvik` list are enforced by
/// the SHAPE of the parameters rather than by review:
///
/// - **"mer än en primärhandling"** — `primaryAction` is a single optional. A
///   second primary action is unrepresentable.
/// - **"chips som inte är klickbara vägar uppåt i hierarkin"** — every chip
///   carries a required `navigate`.
///
/// Responsive behaviour follows UI_DECISIONS §6: in a compact width the
/// secondary actions fold into the ⋯ menu while the primary stays visible, and
/// chips wrap rather than scroll.
struct DetailHeaderView: View {
    /// Object type, e.g. `Lektion`. Letterspaced uppercase, never the serif.
    let eyebrow: String
    /// The object's name — the one place the serif belongs.
    let title: String
    /// Current status, or `nil` while unknown / not applicable.
    var status: StatusChip?
    /// Navigational edges up the hierarchy.
    var chips: [DetailHeaderChip]
    /// Sharing state. `nil` means the object has no sharing dimension at all;
    /// an empty array with `shared == false` means "Privat", which is different.
    var recipients: [ShareRecipient]?
    /// Whether the object is shared. Defaults to `recipients` being non-empty.
    var shared: Bool?
    /// At most one, by construction.
    var primaryAction: DetailHeaderAction?
    /// Inline at regular width, folded into ⋯ when compact.
    var secondaryActions: [DetailHeaderAction]
    /// Always in the ⋯ menu, at every width.
    var overflowActions: [DetailHeaderAction]
    /// Metadata line, e.g. `Onsdag 22 juli · 17:00 · Caspian`.
    var meta: String?
    /// 1 for a page title (the default), 2–3 for a header embedded in a section.
    var headingLevel: Int

    init(
        eyebrow: String,
        title: String,
        status: StatusChip? = nil,
        chips: [DetailHeaderChip] = [],
        recipients: [ShareRecipient]? = nil,
        shared: Bool? = nil,
        primaryAction: DetailHeaderAction? = nil,
        secondaryActions: [DetailHeaderAction] = [],
        overflowActions: [DetailHeaderAction] = [],
        meta: String? = nil,
        headingLevel: Int = 1
    ) {
        self.eyebrow = eyebrow
        self.title = title
        self.status = status
        self.chips = chips
        self.recipients = recipients
        self.shared = shared
        self.primaryAction = primaryAction
        self.secondaryActions = secondaryActions
        self.overflowActions = overflowActions
        self.meta = meta
        self.headingLevel = headingLevel
    }

    /// What the ⋯ menu holds at a given width (UI_DECISIONS §6): when narrow the
    /// secondary actions fold in beside the always-overflowed ones; otherwise
    /// only the always-overflowed ones. The single primary action is never in
    /// this list — it stays visible at every width.
    ///
    /// Port of `overflowItems` in `web/ui/copy.ts`, kept pure and static for the
    /// same reason it lived outside the web component: it is the rule worth
    /// asserting.
    static func overflowItems(
        secondary: [DetailHeaderAction],
        overflow: [DetailHeaderAction],
        narrow: Bool
    ) -> [DetailHeaderAction] {
        narrow ? secondary + overflow : overflow
    }

    @Environment(\.horizontalSizeClass) private var sizeClass

    /// UI_DECISIONS §6's `(max-width: 639px)`, expressed the way iOS expresses
    /// it. Every iPhone in portrait is compact, which is the same population the
    /// web query covers.
    private var isNarrow: Bool { sizeClass == .compact }

    private var menuActions: [DetailHeaderAction] {
        Self.overflowItems(secondary: secondaryActions, overflow: overflowActions, narrow: isNarrow)
            .filter { !$0.isDisabled }
    }

    private var titleFont: Font {
        headingLevel <= 1 ? Typography.pageTitle : Typography.sectionTitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text(eyebrow.uppercased(with: I18n.locale))
                    .font(Typography.groupLabel)
                    .tracking(1.4)
                    .foregroundStyle(Palette.textMuted)

                titleRow
                if !chips.isEmpty || recipients != nil {
                    chipRow
                }
            }

            if primaryAction != nil || !secondaryActions.isEmpty || !menuActions.isEmpty {
                actionCluster
            }

            if let meta, !meta.isEmpty {
                Text(meta)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.bottom, Spacing.lg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    private var titleRow: some View {
        WrapLayout(horizontalSpacing: Spacing.md, verticalSpacing: Spacing.sm) {
            Text(title)
                .font(titleFont)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            if let status {
                status
            }
        }
    }

    private var chipRow: some View {
        WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
            ForEach(chips) { chip in
                Button(action: chip.navigate) {
                    Text(chip.label)
                        .font(Typography.caption.weight(.semibold))
                        .padding(.horizontal, Spacing.sm)
                        .padding(.vertical, 2)
                        .foregroundStyle(Palette.accentStrong)
                        .overlay { Capsule().strokeBorder(Palette.borderStrong, lineWidth: 1) }
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(.isLink)
            }
            if let recipients {
                ShareChip(recipients: recipients, shared: shared)
            }
        }
    }

    private var actionCluster: some View {
        HStack(spacing: Spacing.sm) {
            // §4.8: the one primary on a detail view, visible at every width.
            if let primaryAction {
                Button(primaryAction.label, action: primaryAction.perform)
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .disabled(primaryAction.isDisabled)
            }
            if !isNarrow {
                ForEach(secondaryActions) { action in
                    Button(action.label, action: action.perform)
                        .font(Typography.button)
                        .buttonStyle(.bordered)
                        .tint(Palette.accent)
                        .disabled(action.isDisabled)
                }
            }
            if !menuActions.isEmpty {
                Menu {
                    ForEach(menuActions) { action in
                        Button(action.label, action: action.perform)
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(Typography.button)
                }
                .buttonStyle(.bordered)
                .tint(Palette.accent)
                .accessibilityLabel(I18n.t("detail.moreActions"))
            }
            Spacer(minLength: 0)
        }
    }
}

#Preview("Detail header") {
    ScrollView {
        DetailHeaderView(
            eyebrow: "Lektion",
            title: "Hoppning: rytm och avstånd",
            status: .lesson(.planned),
            chips: [
                DetailHeaderChip(label: "Plan: Hoppsäsong vår 2026", navigate: {}),
                DetailHeaderChip(label: "Mål: Stabil galoppfattning", navigate: {}),
            ],
            recipients: [ShareRecipient(id: "t1", name: "Alva Lind")],
            primaryAction: DetailHeaderAction(label: I18n.t("notes.submit"), perform: {}),
            secondaryActions: [DetailHeaderAction(label: I18n.t("notes.edit"), perform: {})],
            overflowActions: [DetailHeaderAction(label: I18n.t("notes.delete"), perform: {})],
            meta: "Onsdag 22 juli · 17:00 · Caspian"
        )
        .padding(Spacing.lg)
    }
}
