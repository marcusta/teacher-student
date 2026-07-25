import SwiftUI

/// The uppercase, letterspaced group label above a list section — design
/// system §4.3, and the same recipe as the detail header's eyebrow.
///
/// Never the serif: the serif is reserved for page and section TITLES. This is
/// a label, so it stays in the UI face and earns its rank from tracking and
/// case rather than from size.
struct SectionHeader: View {
    let label: String

    init(_ label: String) {
        self.label = label
    }

    var body: some View {
        Text(label.uppercased(with: I18n.locale))
            .font(Typography.groupLabel)
            .tracking(1.4)
            .foregroundStyle(Palette.textMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader)
    }
}

/// Kommande / Tidigare — the split every occasion list that has a FUTURE shares
/// (IA §3.7). Port of `groupLessons` in `web/lessons/lesson-copy.ts`, generic
/// over the timestamp so a Lesson's `scheduledAt` and anything else datable go
/// through the same rule.
///
/// The comparison is on the ISO strings, exactly as the web does it: these
/// timestamps are UTC and lexicographically ordered, so string comparison is
/// the correct total order and needs no parsing. Training sessions deliberately
/// do NOT use this — a logged session is always in the past, so that list is one
/// newest-first run (see `sortByRecency`).
enum OccasionGrouping {
    struct Split<Item> {
        /// Soonest first — the next thing you must do is the first thing you see.
        var upcoming: [Item]
        /// Most recent first.
        var past: [Item]
    }

    /// The split boundary, in the same spelling the server writes.
    ///
    /// The comparison below is lexicographic on ISO strings, which is only sound
    /// when both sides have the same shape: server rows carry fractional seconds
    /// (`…T12:00:00.000Z`) and a bare `ISO8601DateFormatter()` does not, and
    /// since `'.' < 'Z'` an occasion inside the current second would sort to the
    /// wrong side of the boundary.
    static func nowISO(_ date: Date = Date()) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }

    static func split<Item>(
        _ items: [Item],
        nowISO: String = OccasionGrouping.nowISO(),
        at timestamp: (Item) -> String
    ) -> Split<Item> {
        var upcoming: [Item] = []
        var past: [Item] = []
        for item in items {
            if timestamp(item) >= nowISO { upcoming.append(item) } else { past.append(item) }
        }
        upcoming.sort { timestamp($0) < timestamp($1) }
        past.sort { timestamp($0) > timestamp($1) }
        return Split(upcoming: upcoming, past: past)
    }

    /// Newest first, no split — `sortSessions` in
    /// `web/training-sessions/training-session-copy.ts`.
    static func sortByRecency<Item>(_ items: [Item], at timestamp: (Item) -> String) -> [Item] {
        items.sorted { timestamp($0) > timestamp($1) }
    }
}
