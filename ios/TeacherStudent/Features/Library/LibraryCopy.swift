import Foundation

/// Bibliotek — the view-free rules behind IA §3.5 (Övningar) and §3.6 (Program).
///
/// Direct port of `web/library/library-copy.ts`. It keeps its own namespace for
/// the same reason the web keeps its own module: these are the rules worth
/// asserting, and a rule that only exists inside a `body` cannot be.
///
/// The tab vocabulary (`LIBRARY_TABS`, `libraryTabHref`, `resolveLibraryTab`,
/// `PROGRAM_LIST_REDIRECT`) is deliberately NOT ported: it is URL machinery for
/// a two-tab web destination, and on the phone Övningar and Program are two
/// sibling rows in the Undervisning tab (`App/MainTabView.swift`), which have no
/// query string to address.
enum LibraryCopy {
    /// Row excerpt for a description (§3.5 "name, description excerpt").
    static let excerptMaxLength = 140

    static func descriptionExcerpt(_ description: String?) -> String {
        let collapsed = (description ?? "")
            .split(whereSeparator: { $0.isWhitespace || $0.isNewline })
            .joined(separator: " ")
        guard !collapsed.isEmpty else { return "" }
        guard collapsed.count > excerptMaxLength else { return collapsed }

        let clipped = String(collapsed.prefix(excerptMaxLength))
        // Cut on a word boundary when there is one near the limit, so the
        // ellipsis does not land mid-word.
        if let lastSpace = clipped.lastIndex(of: " ") {
            let head = clipped.distance(from: clipped.startIndex, to: lastSpace)
            if head > excerptMaxLength - 24 {
                return String(clipped[clipped.startIndex..<lastSpace]) + "…"
            }
        }
        return clipped.trimmingCharacters(in: .whitespaces) + "…"
    }

    /// §3.5 asks for "search/filter **when volume requires it**". Below this
    /// many rows the whole library is on one screen and a search field is
    /// furniture that costs a tap and teaches nothing.
    static let searchThreshold = 8

    static func shouldOfferSearch(_ count: Int) -> Bool {
        count >= searchThreshold
    }

    /// Case- and diacritic-tolerant contains, over name AND description.
    static func matches(_ haystack: String, query: String) -> Bool {
        let needle = normalize(query.trimmingCharacters(in: .whitespacesAndNewlines))
        guard !needle.isEmpty else { return true }
        return normalize(haystack).contains(needle)
    }

    static func filterExercises(_ items: [Exercise], query: String) -> [Exercise] {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return items }
        return items.filter { matches("\($0.name) \($0.description)", query: query) }
    }

    private static func normalize(_ value: String) -> String {
        value.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: I18n.locale)
    }

    /// Search that matches nothing is NOT the same state as a library that is
    /// empty, and §4.14 wants a different single action for each: "clear the
    /// search" versus "create the first exercise". Collapsing them would offer
    /// to create an exercise to someone who has forty and simply mistyped.
    enum ExerciseListState: Equatable {
        case loading
        case error
        case empty
        case noMatches
        case rows
    }

    /// `failed` is a read that failed with NOTHING to fall back on — the store's
    /// `showsPageError`, not "the last request errored". A background reload that
    /// failed behind a populated list is a different fact and gets a banner over
    /// the rows it could not update; taking the whole screen for it would remove
    /// content the reader was already reading.
    static func exerciseListState(
        loading: Bool,
        failed: Bool,
        total: Int,
        visible: Int
    ) -> ExerciseListState {
        // A failed fetch must never render as an empty state (it is not empty —
        // it is unknown), so the error branch is checked before both empties.
        if failed { return .error }
        if loading { return .loading }
        if total == 0 { return .empty }
        if visible == 0 { return .noMatches }
        return .rows
    }

    /// `{count} övningar` for a Program row (§3.6 "title, description excerpt,
    /// Exercise count").
    static func exerciseCountLabel(_ count: Int) -> String {
        I18n.plural("program.exerciseCount", count)
    }

    // MARK: - Failed writes

    /// A 409 means the screen is working from a stale copy, so IA §4 wants it
    /// surfaced as a recoverable conflict with a way to fetch the current one —
    /// a different sentence and a different button from "try again". It is
    /// detected by CODE, never by matching a message, exactly as
    /// `TrainingSessionCopy.isConflict` does.
    static func isConflict(_ error: ApiError?) -> Bool {
        error?.code == .conflict
    }

    /// The sentence a failed write shows, and whether it comes with a fetch.
    ///
    /// Returns `nil` when the store recorded nothing, which is how a CANCELLED
    /// request arrives here — the reader left mid-write and nothing failed, so
    /// nothing is said. A plain failure gets no action title: the retry is the
    /// button that was just pressed, and it is still on screen. Only a conflict
    /// needs a control the screen does not already have.
    ///
    /// The server's own `message` is developer English and never reaches a
    /// reader (PLAN.md §6) — every branch here resolves an authored key.
    static func writeFailure(
        _ error: ApiError?,
        conflict: String,
        action: String,
        failure: String
    ) -> CatalogWriteFailure? {
        guard let error else { return nil }
        if isConflict(error) {
            return CatalogWriteFailure(
                message: I18n.t(conflict),
                actionTitle: I18n.t(action),
                isConflict: true
            )
        }
        return CatalogWriteFailure(message: I18n.t(failure))
    }
}

/// A write that did not go through, in the form the reader is shown it.
///
/// A resolved sentence rather than an `ApiError`, because the decision of WHICH
/// authored sentence applies belongs to the copy rules, not to a `body`, and a
/// view holding an `ApiError` is one keystroke away from rendering the server's
/// English.
struct CatalogWriteFailure: Equatable {
    let message: String
    /// The recovery action's title, or `""` for a failure whose only recovery is
    /// the control the reader already used.
    var actionTitle: String = ""
    var isConflict: Bool = false
}
