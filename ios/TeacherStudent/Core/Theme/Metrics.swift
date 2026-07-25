import SwiftUI

/// Spacing scale — `web/theme.ts` `space-1…8`, which is the same ladder the
/// framework's `s()` helper exposes as `xs…4xl`.
enum Spacing {
    /// 4pt — `space-1` / `s('xs')`
    static let xs: CGFloat = 4
    /// 8pt — `space-2` / `s('sm')`
    static let sm: CGFloat = 8
    /// 12pt — `space-3` / `s('md')`
    static let md: CGFloat = 12
    /// 16pt — `space-4` / `s('lg')`
    static let lg: CGFloat = 16
    /// 24pt — `space-5` / `s('xl')`
    static let xl: CGFloat = 24
    /// 32pt — `space-6` / `s('2xl')`
    static let xxl: CGFloat = 32
    /// 48pt — `space-7` / `s('3xl')`
    static let xxxl: CGFloat = 48
    /// 64pt — `space-8` / `s('4xl')`
    static let xxxxl: CGFloat = 64
}

/// Corner radii — `radius-sm` / `radius-md` / `radius-pill`.
enum Radius {
    static let sm: CGFloat = 4
    static let md: CGFloat = 8
    /// The web token is `999px`; anything past half the height is a pill.
    static let pill: CGFloat = 999
}

/// Motion durations and the standard easing curve.
enum Motion {
    static let fast: TimeInterval = 0.12
    static let base: TimeInterval = 0.20
    static let slow: TimeInterval = 0.32

    /// `cubic-bezier(.2,.7,.3,1)`.
    static let standard = Animation.timingCurve(0.2, 0.7, 0.3, 1, duration: base)
}
