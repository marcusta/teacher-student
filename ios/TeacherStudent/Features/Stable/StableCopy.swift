import Foundation

/// Hästar — the view-free rules behind IA §3.15, port of
/// `web/stable/stable-copy.ts`.
enum StableCopy {
    /// §3.15 list step 2: "Non-archived Horses, newest first."
    ///
    /// `GET /horses` already filters archived and orders `created_at DESC`, so
    /// this is belt-and-braces rather than the only guard — but the view must
    /// not depend on an ordering it does not state, and an archived horse
    /// arriving through any other path (a stale cache, a future endpoint) must
    /// not appear in the stable.
    static func activeHorses(_ horses: [Horse]) -> [Horse] {
        horses
            .filter { $0.archivedAt == nil }
            .sorted { $0.createdAt > $1.createdAt }
    }

    static func isArchived(_ horse: Horse) -> Bool {
        horse.archivedAt != nil
    }

    /// A failed fetch must never render as an empty state — "you have no horses"
    /// and "we could not find out" are different sentences and lead to different
    /// actions.
    enum StableState: Equatable {
        case loading
        case error
        case empty
        case rows
    }

    /// **Content outranks failure.** Rows that are already on screen were the
    /// server's own answer, and a later read that could not be completed does
    /// not make them wrong — it only makes them possibly stale, which is a line
    /// above the list rather than a page instead of it. Only a read that failed
    /// with nothing to show takes over the screen, because then there is genuinely
    /// nothing else to say.
    ///
    /// `failed` is therefore the FOREGROUND read's failure alone. A silent
    /// reload's failure never reaches this function.
    static func stableState(loading: Bool, failed: Bool, count: Int) -> StableState {
        if count > 0 { return .rows }
        if failed { return .error }
        if loading { return .loading }
        return .empty
    }
}
