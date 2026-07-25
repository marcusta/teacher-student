import SwiftUI

/// Someone an object is shared with. Rendered verbatim — sharing is never
/// anonymous.
struct ShareRecipient: Identifiable, Hashable {
    /// Stable id where the caller has one. Used only for de-duplication.
    var id: String?
    var name: String

    init(id: String? = nil, name: String) {
        self.id = id
        self.name = name
    }
}

/// Sharing copy — port of `web/ui/copy.ts`. Pure, so the rules that decide what
/// the trust surface SAYS live apart from the view that draws it.
enum ShareCopy {
    /// De-duplicate by id where present, by name otherwise.
    static func dedupe(_ recipients: [ShareRecipient]) -> [ShareRecipient] {
        var seen = Set<String>()
        return recipients.filter { recipient in
            seen.insert(recipient.id ?? "name:\(recipient.name)").inserted
        }
    }

    /// The recipients this UI can actually NAME.
    ///
    /// A blank name cannot be named, and §4.5's whole point is that a shared
    /// state is never anonymous — `Delad: ` with a dangling colon is the bare
    /// "Delad" the spec forbids, just punctuated. So a blank name counts as no
    /// name at all and the label degrades to `Delad: okänd mottagare`.
    static func named(_ recipients: [ShareRecipient]) -> [ShareRecipient] {
        dedupe(recipients).filter { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
    }

    /// `Alva, Björn och Cecilia`. Joining a list is a grammar rule, so it comes
    /// from the locale rather than from a catalogued separator.
    static func joinNames(_ recipients: [ShareRecipient]) -> String {
        named(recipients).map(\.name).formatted(.list(type: .and).locale(I18n.locale))
    }

    /// `Privat` · `Delad: Alva` · `Delad: Alva +1`. No branch can return a bare
    /// "Delad": a shared state either names someone or says outright that the
    /// recipient is unknown.
    static func label(_ recipients: [ShareRecipient], shared: Bool? = nil) -> String {
        let isShared = shared ?? !recipients.isEmpty
        guard isShared else { return I18n.t("share.private") }
        let all = dedupe(recipients)
        // Name the first recipient we CAN name; the +N count still covers the
        // whole audience, so an unnameable member hides behind the count rather
        // than rendering as an empty name.
        guard let first = all.first(where: { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }) else {
            return I18n.t("share.sharedUnknown")
        }
        let others = all.count - 1
        return others == 0
            ? I18n.t("share.sharedWith", ["name": first.name])
            : I18n.plural("share.sharedWithMore", others, ["name": first.name])
    }

    /// The full recipient list for an accessibility label, so a name hidden
    /// behind "+1" is still reachable. `nil` when the visible label already says
    /// everything.
    static func description(_ recipients: [ShareRecipient], shared: Bool? = nil) -> String? {
        let isShared = shared ?? !recipients.isEmpty
        guard isShared else { return nil }
        let namedRecipients = named(recipients)
        guard namedRecipients.count >= 2 else { return nil }
        return I18n.t("share.sharedWithAll", ["names": joinNames(namedRecipients)])
    }
}

/// Sharing chip — design system §4.5, "the trust surface".
///
/// Two states and no third: **Privat** is a neutral outline; **Delad** is
/// accent-tinted and ALWAYS names its recipient. Sharing is not an outcome — it
/// is the brand's trust promise — which is why this is the one chip allowed to
/// borrow the accent that `StatusChip` may not touch.
struct ShareChip: View {
    let recipients: [ShareRecipient]
    /// Force the shared state when recipient names have not loaded yet.
    var shared: Bool?

    private var isShared: Bool { shared ?? !recipients.isEmpty }

    var body: some View {
        Text(ShareCopy.label(recipients, shared: shared))
            .font(Typography.caption.weight(.semibold))
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, 2)
            .foregroundStyle(isShared ? Palette.accentStrong : Palette.textMuted)
            .background(isShared ? Palette.accentSoft : .clear, in: Capsule())
            .overlay {
                Capsule().strokeBorder(isShared ? Palette.accentStrong : Palette.textMuted, lineWidth: 1)
            }
            .accessibilityLabel(
                ShareCopy.description(recipients, shared: shared) ?? ShareCopy.label(recipients, shared: shared)
            )
    }
}
