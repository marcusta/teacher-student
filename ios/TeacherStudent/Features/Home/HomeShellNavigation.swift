import SwiftUI

/// The destinations Hem wants to send a reader to that live in **another tab**.
///
/// Every card and row on Hem deep-links with a shared `Route`, which the tab's
/// own `NavigationStack` resolves — that covers Lektion, Träningspass, Plan and
/// Mål detail. What `Route` deliberately cannot express is a LIST or a CREATION
/// flow: creation is a local sheet owned by its feature (Core/Navigation), and
/// the lists are tab roots. Hem's quick actions and empty-state exits are exactly
/// those two things, so they need the shell to switch tabs.
///
/// This is the seam for that, and it is deliberately optional. When the shell has
/// not provided a switcher the actions are **not rendered** — never rendered
/// disabled, and never rendered as a button that does nothing. A dashboard that
/// silently drops a tap is worse than one that shows the reader only what it can
/// actually do.
enum HomeShellDestination: Equatable {
    /// Inkorg tab root — the pending-invitation exit.
    case inbox
    /// Lektioner list — the awaiting block's exit and both empty cards' exit.
    case lessons
    /// Lektioner ▸ create.
    case newLesson
    /// Träningspass ▸ log.
    case newTrainingSession
    /// Mina elever — the `fresh` state's teaching path.
    case students
    /// Hästar — the `fresh` state's riding path.
    case stable
    /// Mål ▸ create — the `fresh` state's secondary link.
    case newGoal
}

private struct HomeShellNavigationKey: EnvironmentKey {
    static let defaultValue: ((HomeShellDestination) -> Void)? = nil
}

extension EnvironmentValues {
    /// Set by the tab shell to let Hem hand a cross-tab destination back up.
    /// `nil` — the default — means Hem omits every control that would need it.
    var homeShellNavigation: ((HomeShellDestination) -> Void)? {
        get { self[HomeShellNavigationKey.self] }
        set { self[HomeShellNavigationKey.self] = newValue }
    }
}
