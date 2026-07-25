import SwiftUI

/// Colour tokens, ported from `web/theme.ts`.
///
/// The web layer emits `[data-theme="light"]` / `[data-theme="dark"]` custom
/// property blocks; here each token is a single dynamic `UIColor` that resolves
/// against the trait collection, so light and dark stay one declaration and
/// nothing has to observe `colorScheme` by hand.
///
/// Values are verbatim from the design system. Do not invent shades — a token
/// that is missing here is missing on the web too, and that is a copy/design
/// decision, not a local one.
enum Palette {
    static let bg = dynamic(light: 0xF6F4F1, dark: 0x131A20)
    static let surface = dynamic(light: 0xFFFFFF, dark: 0x1C1F21)
    static let surface2 = dynamic(light: 0xEFEBE4, dark: 0x262A2B)
    static let text = dynamic(light: 0x1C1F21, dark: 0xF1ECE3)
    static let textMuted = dynamic(light: 0x696159, dark: 0xAFA698)
    static let border = dynamic(light: 0xDED7CF, dark: 0x3B372F)
    static let borderStrong = dynamic(light: 0x9A8E7B, dark: 0x7A7059)
    static let accent = dynamic(light: 0x845C24, dark: 0xCFAA81)
    static let accentStrong = dynamic(light: 0x6B4A1D, dark: 0xE2C29C)
    static let accentSoft = dynamic(light: 0xF3EADD, dark: 0x2C271F)
    static let onAccent = dynamic(light: 0xFFFFFF, dark: 0x1C1F21)
    static let brassLine = dynamic(light: 0xCFAA81, dark: 0x8A6B45)
    static let cream = dynamic(light: 0xFFE9C2, dark: 0xFFE9C2)
    static let success = dynamic(light: 0x2E6047, dark: 0x8CC5A4)
    static let successSoft = dynamic(light: 0xE4EFE8, dark: 0x1E2B23)
    static let warning = dynamic(light: 0x9A4A1E, dark: 0xE1955F)
    static let warningSoft = dynamic(light: 0xF7E9DE, dark: 0x2E231A)
    static let danger = dynamic(light: 0xA3292F, dark: 0xE39396)
    static let dangerSoft = dynamic(light: 0xF8E6E6, dark: 0x332122)
    static let onDanger = dynamic(light: 0xFFFFFF, dark: 0x1C1F21)
    static let info = dynamic(light: 0x3E5974, dark: 0x93B3CE)
    static let infoSoft = dynamic(light: 0xE3EAF1, dark: 0x1E2733)

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

/// The three shadow tiers of `web/theme.ts`, as SwiftUI shadow parameters.
struct ShadowToken {
    let color: Color
    let radius: CGFloat
    let y: CGFloat

    static let one = ShadowToken(color: shadowColor(lightAlpha: 0.06, darkAlpha: 0.40), radius: 2, y: 1)
    static let two = ShadowToken(color: shadowColor(lightAlpha: 0.10, darkAlpha: 0.50), radius: 12, y: 4)
    static let three = ShadowToken(color: shadowColor(lightAlpha: 0.22, darkAlpha: 0.60), radius: 40, y: 16)

    private static func shadowColor(lightAlpha: CGFloat, darkAlpha: CGFloat) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(white: 0, alpha: darkAlpha)
                : UIColor(red: 28 / 255, green: 31 / 255, blue: 33 / 255, alpha: lightAlpha)
        })
    }
}

extension View {
    func tsShadow(_ token: ShadowToken) -> some View {
        shadow(color: token.color, radius: token.radius, x: 0, y: token.y)
    }
}
