import SwiftUI

/// The §4.3 date block: `22 / JUL / 17:00`.
///
/// Port of the `dateBlock(iso)` that both `lesson-copy.ts` and
/// `training-session-copy.ts` declare identically — one rule, defined once
/// here, because a Lesson and a Training Session are siblings in the same
/// shared row grammar (IA §1).
///
/// `formatMonthBlock`, not `formatMonthAbbrev`: Swedish four-character months
/// (`JULI`, `MARS`) break the block's alignment (UI_DECISIONS §4).
struct OccasionDateBlock: Equatable {
    /// `22`.
    var day: String
    /// `JUL` — three characters, so the block keeps its fixed width.
    var month: String
    /// `17:00`.
    var time: String

    init(day: String, month: String, time: String) {
        self.day = day
        self.month = month
        self.time = time
    }

    /// Derive the block from an ISO timestamp. Falls back to the raw string's
    /// pieces being empty rather than to invented values — an unparsable
    /// timestamp is a contract bug, not something to paper over.
    init(iso: String) {
        guard let date = I18n.date(fromISO: iso) else {
            self.init(day: "", month: "", time: "")
            return
        }
        self.init(
            day: I18n.formatDate(date, .dayOfMonth),
            month: I18n.formatMonthBlock(date),
            time: I18n.formatDate(date, .clockTime)
        )
    }
}

/// One row in a Lesson or Training Session list — the shared occasion grammar
/// of IA §1, ported from `lessons.component.ts` and
/// `training-sessions.component.ts`, which had grown two near-identical rows.
///
/// The row draws CONTENT only. It carries no tap target of its own, because
/// §4.3 wants a row to have exactly one, and only the caller knows where it
/// leads — so a caller wraps this in a single `NavigationLink`. That is also
/// why the chips here are plain labels rather than links: a link inside a link
/// is not a thing.
///
/// What varies between the two occasion kinds is passed in rather than branched
/// on. A Lesson supplies a counterparty marker and a status chip; a Training
/// Session supplies a share chip and a duration, and has no status at all
/// (nothing about a logged session is pending). The ORDER of the meta parts and
/// the chip labels stay with the caller, since the per-feature `*-copy.ts`
/// modules are where those sentences are composed.
struct OccasionRow: View {
    /// The counterparty on this occasion, in their contextual role — always the
    /// inverse of the reader's own (IA §1).
    struct Person: Equatable {
        var name: String
        var role: PersonRole

        init(name: String, role: PersonRole) {
            self.name = name
            self.role = role
        }
    }

    /// Sharing state for the row's leading chip. `nil` means the object has no
    /// sharing dimension (a Lesson), not that it is private.
    struct Sharing: Equatable {
        var recipients: [ShareRecipient]
        /// Force the shared state while recipient names are still resolving.
        var shared: Bool?

        init(recipients: [ShareRecipient], shared: Bool? = nil) {
            self.recipients = recipients
            self.shared = shared
        }
    }

    let date: OccasionDateBlock
    /// The headline — `lessonTitle(lesson)` / `sessionTitle(session)`.
    var title: String
    /// Rendered first on the meta line, as a person marker (§4.6).
    var counterparty: Person?
    /// The rest of the meta line, in the caller's order: duration, horse name,
    /// exercise summary, summary excerpt. One line, wrapping — §4.3 allows at
    /// most two rows of text, so callers keep this short.
    var meta: [String]
    /// Drawn before the label chips — the trust surface leads (§4.5).
    var sharing: Sharing?
    /// Plan chip first, then program badges. Already-composed labels.
    var chips: [String]
    /// Trailing outcome pill. Absent on Training Session rows.
    var status: StatusChip?
    /// Cancelled rows are muted but READABLE (IA §3.7) — muted TEXT, never an
    /// opacity wash, so the row keeps its contrast against the page rather than
    /// fading toward it. The dashed pill and its ✕ carry the meaning; this only
    /// ranks the row.
    var isMuted: Bool

    init(
        date: OccasionDateBlock,
        title: String,
        counterparty: Person? = nil,
        meta: [String] = [],
        sharing: Sharing? = nil,
        chips: [String] = [],
        status: StatusChip? = nil,
        isMuted: Bool = false
    ) {
        self.date = date
        self.title = title
        self.counterparty = counterparty
        self.meta = meta
        self.sharing = sharing
        self.chips = chips
        self.status = status
        self.isMuted = isMuted
    }

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.lg) {
            dateBlock
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(title)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(isMuted ? Palette.textMuted : Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
                if counterparty != nil || !meta.isEmpty {
                    metaLine
                }
                if sharing != nil || !chips.isEmpty {
                    chipLine
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if let status {
                status.padding(.top, 2)
            }
        }
        .padding(.vertical, Spacing.md)
        .contentShape(Rectangle())
    }

    private var dateBlock: some View {
        VStack(spacing: 0) {
            Text(date.day)
                .font(.title3.weight(.bold))
                .foregroundStyle(isMuted ? Palette.textMuted : Palette.text)
            Text(date.month)
                .font(Typography.groupLabel)
                .tracking(1.2)
                .foregroundStyle(Palette.textMuted)
            Text(date.time)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .padding(.top, 2)
        }
        // Tabular numerals so the blocks line up column-wise down the list
        // (§4.3). `minWidth` rather than a fixed width: the block must still
        // grow with the reader's text size.
        .monospacedDigit()
        .frame(minWidth: 48)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(date.day) \(date.month) \(date.time)")
    }

    private var metaLine: some View {
        WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
            if let counterparty {
                PersonMarker(name: counterparty.name, role: counterparty.role)
            }
            ForEach(Array(meta.enumerated()), id: \.offset) { _, part in
                Text(part)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
        }
    }

    private var chipLine: some View {
        WrapLayout(horizontalSpacing: Spacing.xs, verticalSpacing: Spacing.xs) {
            if let sharing {
                ShareChip(recipients: sharing.recipients, shared: sharing.shared)
            }
            ForEach(Array(chips.enumerated()), id: \.offset) { _, label in
                OccasionRowChip(label: label)
            }
        }
    }
}

/// A row chip: a LABEL, not a link.
///
/// The clickable parent chips live in `DetailHeaderView`; §4.3 wants the row to
/// have exactly one target, and the row itself is it.
private struct OccasionRowChip: View {
    let label: String

    var body: some View {
        Text(label)
            .font(Typography.caption.weight(.semibold))
            // Two lines, not one: at accessibility text sizes a one-line clamp
            // turns "Plan: Hoppsäsong vår 2026" into an ellipsis.
            .lineLimit(2)
            .truncationMode(.tail)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, 2)
            .foregroundStyle(Palette.textMuted)
            .overlay { Capsule().strokeBorder(Palette.border, lineWidth: 1) }
    }
}

#Preview("Occasion rows") {
    ScrollView {
        VStack(alignment: .leading, spacing: 0) {
            SectionHeader(I18n.t("lessons.group.upcoming"))
            Divider()
            OccasionRow(
                date: OccasionDateBlock(day: "22", month: "JUL", time: "17:00"),
                title: "Hoppning: rytm och avstånd",
                counterparty: .init(name: "Alva Lind", role: .teacher),
                meta: ["Caspian", I18n.plural("lesson.exerciseSummary", 3, ["names": "Volt, Serpentin, Ridvägar"])],
                chips: ["Plan: Hoppsäsong vår 2026"],
                status: .lesson(.planned)
            )
            Divider()
            OccasionRow(
                date: OccasionDateBlock(day: "14", month: "JUL", time: "19:04"),
                title: "Lugnt distanspass i skogen",
                meta: [I18n.plural("trainingSession.duration", 45), "Luna"],
                sharing: .init(recipients: [ShareRecipient(id: "t1", name: "Alva Lind")]),
                chips: ["Program: Grundgymnastik"]
            )
            Divider()
            OccasionRow(
                date: OccasionDateBlock(day: "02", month: "JUL", time: "09:00"),
                title: "Inställd lektion",
                counterparty: .init(name: "Björn Ek", role: .student),
                meta: [I18n.t("lesson.exercises.none")],
                status: .lesson(.cancelled),
                isMuted: true
            )
        }
        .padding(Spacing.lg)
    }
}
