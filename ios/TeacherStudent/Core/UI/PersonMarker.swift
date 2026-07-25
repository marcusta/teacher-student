import SwiftUI

/// Contextual role in ONE relation, not a global account type (IA §1). The same
/// person is a student here and a teacher there.
enum PersonRole: String {
    case teacher
    case student

    var label: String {
        I18n.t(self == .teacher ? "role.teacher" : "role.student")
    }

    /// Teacher accent, student neutral — the ONLY difference between the two.
    var tone: Color {
        self == .teacher ? Palette.accentStrong : Palette.textMuted
    }
}

/// Person marker — design system §4.6.
///
/// An author name plus the contextual role tag. The spec's constraint is that
/// the two roles are otherwise identical ("samma vikt, ingen hierarki i
/// storlek"), so both render the same pill at the same size and weight and
/// differ only in tone. Nothing here can express a size or weight difference.
///
/// Avatars are explicitly forbidden by the spec, so there is no image slot and
/// none may be added.
///
/// `showRole` exists for the other `Undvik` clause — "markering när kontexten
/// redan är entydig (t.ex. elevens egen logg)". A student reading their own
/// training log already knows who wrote it; the tag would be noise.
struct PersonMarker: View {
    let name: String
    let role: PersonRole
    var showRole: Bool = true

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.sm) {
            Text(name)
                .font(Typography.label)
                .foregroundStyle(Palette.text)
            if showRole {
                Text(role.label)
                    .font(Typography.caption.weight(.semibold))
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, 2)
                    .foregroundStyle(role.tone)
                    .overlay { Capsule().strokeBorder(role.tone, lineWidth: 1) }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(showRole ? "\(name), \(role.label)" : name)
    }
}
