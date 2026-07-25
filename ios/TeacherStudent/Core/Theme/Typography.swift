import SwiftUI

/// Type roles — design system §02, as ported in `web/app/app.component.ts`.
///
/// Two families and no third: a serif for page and section headings only, the
/// UI sans for everything else. Lora and Open Sans are not bundled, so the
/// serif role maps to the system serif and the UI role to the system font —
/// which is also what HIG wants, and what keeps Dynamic Type working.
///
/// Every role is built from a semantic `Font.TextStyle`, never a fixed point
/// size, so the whole app scales with the reader's text-size setting.
enum Typography {
    /// Page title. Web: 28/36 serif, weight 500 (never 600 — see UI_DECISIONS §3).
    static let pageTitle = Font.system(.title, design: .serif).weight(.medium)
    /// Section heading. Web: 20/28 serif, weight 500.
    static let sectionTitle = Font.system(.title3, design: .serif).weight(.medium)
    /// The brand wordmark on the public entry views.
    static let wordmark = Font.system(.title2, design: .serif).weight(.medium)

    static let body = Font.body
    static let bodyEmphasis = Font.body.weight(.semibold)
    /// Lede paragraph under a title.
    static let lede = Font.callout
    /// Field labels, chips, metadata.
    static let label = Font.subheadline.weight(.semibold)
    static let caption = Font.footnote
    /// The letterspaced uppercase group label of the web sidebar.
    static let groupLabel = Font.caption.weight(.semibold)
    /// Button labels — the serif is forbidden on a button entirely (§02).
    static let button = Font.subheadline.weight(.semibold)
}
