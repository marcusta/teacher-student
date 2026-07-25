import Foundation

/// Copy and derivation rules for Mål (IA §3.13) and Goal detail (§3.14) — the
/// port of `web/goals/goal-copy.ts`.
///
/// A Goal is the object with the sharpest privacy rule in the product: it is
/// private until its owner shares it, per Teacher, and a Teacher may never
/// enumerate the other Teachers it was shared with. Several functions here exist
/// only to keep that rule from leaking through copy — see `planMembership` and
/// `ownerRecipients`.
enum GoalCopy {

    // MARK: - The role matrix

    /// Who is reading. There is no third case: a Teacher without a share gets a
    /// 404 and never reaches a Goal view at all.
    enum Viewer {
        case owner
        case sharedTeacher
    }

    /// Which controls a Goal detail view may render. Withheld controls are
    /// **absent**, not disabled.
    struct Controls: Equatable {
        /// Title, description, target date, horse. Owner only.
        var editDetails: Bool
        /// Add or remove Teachers. Owner only — a Teacher cannot even see the
        /// audience, let alone change it.
        var manageSharing: Bool
        /// Attach/detach Plans. Owner only; a Teacher sees the memberships.
        var managePlans: Bool
        /// See WHO else this Goal is shared with. Owner only. This is the rule
        /// that keeps one Teacher from learning about another.
        var seeCoWatchers: Bool
        /// Write in the thread. Both roles — a shared Goal is a conversation.
        var notes: Bool
    }

    static func controls(viewer: Viewer) -> Controls {
        let owner = viewer == .owner
        return Controls(
            editDetails: owner,
            manageSharing: owner,
            managePlans: owner,
            seeCoWatchers: owner,
            notes: true
        )
    }

    /// Which lifecycle moves are offered, by status and role.
    ///
    /// Achieve and reopen are open to BOTH roles — a Teacher who watched the
    /// rider clear the fence can mark it achieved, and either party can reopen
    /// something marked too early. Abandon is the owner's alone: withdrawing an
    /// intention is not a Teacher's call. Nothing is offered from a state the
    /// server would reject.
    struct Transitions: Equatable {
        var achieve: Bool
        var reopen: Bool
        var abandon: Bool
    }

    static func transitions(status: GoalStatus, viewer: Viewer) -> Transitions {
        Transitions(
            achieve: status == .active,
            reopen: status != .active,
            abandon: viewer == .owner && status != .abandoned
        )
    }

    /// A 409 from a lifecycle move means someone else moved this Goal while it
    /// sat open — the fix is to re-read, never to retry the same POST. Matched
    /// on the code, not on message text.
    static func isConflict(_ error: ApiError) -> Bool {
        error.code == .conflict
    }

    /// Deleted, or no longer shared with this reader — the same answer, because
    /// distinguishing them would confirm the Goal exists. Read off `code` rather
    /// than `status` so a transport failure can never be mistaken for it.
    ///
    /// `.forbidden` counts as the same answer in a different word: a 403 says
    /// this Goal is not the reader's, and no amount of retrying changes that.
    /// `ApiError` is explicit that a 403 must not read as "something broke on
    /// our end" — routing it to the generic error state would offer a "Försök
    /// igen" that re-issues the same request for the same 403 forever, where
    /// the not-found screen offers a way back. Anything else — a 500, a dropped
    /// connection — is a FAILURE rather than an answer and keeps its retry.
    static func isNotFound(_ error: ApiError) -> Bool {
        error.code == .notFound || error.code == .forbidden
    }

    /// The models catch `Error` but store `ApiError`.
    static func apiError(_ error: Error) -> ApiError {
        (error as? ApiError) ?? ApiError.transport(error, traceId: nil)
    }

    // MARK: - Dates

    /// A calendar date (`YYYY-MM-DD`) at LOCAL midnight, or `nil`.
    ///
    /// The parse itself lives in Core as the inverse of `I18n.formatIsoDate` —
    /// Plans and the shared `DateField` need the same rules, and two copies of a
    /// date parser is two chances to disagree about `2026-02-31`.
    static func calendarDate(_ value: String?) -> Date? {
        I18n.calendarDate(fromISO: value)
    }

    /// `Måldatum: 30 juni 2026`, or `nil` when the Goal has no date. An
    /// open-ended Goal is legitimate — "sitta stabilt i galopp" has no deadline
    /// — so the absence is silence, not "Inget måldatum".
    static func targetDateLabel(_ targetDate: String?) -> String? {
        guard let date = calendarDate(targetDate) else { return nil }
        return I18n.t("goal.target", ["date": I18n.formatDate(date, .fullDate)])
    }

    /// `Uppnått 12 maj 2026`. Uses the timestamp recipe, not the calendar one:
    /// `achievedAt` is an instant the server stamped, not a day the rider chose.
    static func achievedLabel(_ achievedAt: String?) -> String? {
        guard let achievedAt, let date = I18n.date(fromISO: achievedAt) else { return nil }
        return I18n.t("goal.achievedAt", ["date": I18n.formatDate(date, .fullDate)])
    }

    /// Whether an ACTIVE Goal's target date has passed.
    ///
    /// Only active Goals can be overdue: an achieved Goal whose date slipped was
    /// still achieved, and an abandoned one is nobody's debt. `today` is passed
    /// in and frozen at mount so a list cannot flip mid-scroll.
    static func isOverdue(targetDate: String?, status: GoalStatus, today: Date) -> Bool {
        guard status == .active, let target = calendarDate(targetDate) else { return false }
        return target < Calendar.current.startOfDay(for: today)
    }

    // MARK: - List content

    static let excerptLength = 90

    /// One line of description for a row, cut at a word boundary.
    ///
    /// Shared with `PlanCopy` (which passes its own length). The word-boundary
    /// rule only applies when the last space is reasonably far in — otherwise a
    /// long first word would leave a two-character stub before the ellipsis.
    static func excerpt(_ description: String?, max: Int = excerptLength) -> String? {
        guard let description else { return nil }
        let collapsed = description
            .split(whereSeparator: { $0.isWhitespace })
            .joined(separator: " ")
        guard !collapsed.isEmpty else { return nil }
        guard collapsed.count > max else { return collapsed }

        let cut = String(collapsed.prefix(max))
        if let lastSpace = cut.lastIndex(of: " "),
           cut.distance(from: cut.startIndex, to: lastSpace) > Int(Double(max) * 0.6) {
            return String(cut[cut.startIndex..<lastSpace]) + "…"
        }
        return cut + "…"
    }

    static func descriptionExcerpt(_ description: String?, max: Int = excerptLength) -> String? {
        excerpt(description, max: max)
    }

    struct Groups: Equatable {
        var active: [Goal]
        var achieved: [Goal]
        var abandoned: [Goal]
    }

    /// §3.13's order: active first, achieved next, abandoned behind a
    /// disclosure. The server already sorts within each group.
    static func group(_ goals: [Goal]) -> Groups {
        Groups(
            active: goals.filter { $0.status == .active },
            achieved: goals.filter { $0.status == .achieved },
            abandoned: goals.filter { $0.status == .abandoned }
        )
    }

    /// `Ingår i Vårsäsong 2026 och Hoppträning`, `+2` past two names.
    ///
    /// Plans whose titles could not be resolved are OMITTED rather than printed
    /// as ids — a row that says `Ingår i 550e8400-…` states nothing. When none
    /// of them resolved, the count is stated on its own (`Ingår i 3 planer`),
    /// which is honest without inventing names.
    static func planMembership(planIds: [String], plans: [String: String]) -> String? {
        guard !planIds.isEmpty else { return nil }
        let names = planIds.compactMap { plans[$0] }.filter { !$0.isEmpty }
        guard !names.isEmpty else {
            return I18n.plural("goal.plans.unnamed", planIds.count)
        }
        let shown = Array(names.prefix(2))
        let hidden = planIds.count - shown.count
        var label = ShareCopy.joinNames(shown.map { ShareRecipient(name: $0) })
        if hidden > 0 {
            label += " " + I18n.t("goal.more", ["count": String(hidden)])
        }
        return I18n.plural("goal.plans.summary", planIds.count, ["names": label])
    }

    /// The audience chip's recipients, from the OWNER's data.
    ///
    /// Unresolved teacher ids are kept with an empty name on purpose: dropping
    /// them would under-state the audience, and `ShareCopy` already refuses to
    /// render an unnameable recipient as a confident "Delad med". The chip says
    /// less; it never says something false.
    static func ownerRecipients(sharedTeacherIds: [String], teachers: [String: String]) -> [ShareRecipient] {
        sharedTeacherIds.map { ShareRecipient(id: $0, name: teachers[$0] ?? "") }
    }

    // MARK: - Seeding guards (§3.14)

    /// Whether a sharing checkbox change should be committed.
    ///
    /// The boxes are bound to loaded state, and SwiftUI fires a binding's setter
    /// while that state is still settling. Without this guard, opening a Goal
    /// with three Teachers would fire three unshare calls as the list arrives.
    /// So: never commit before the shares are seeded, and never commit a change
    /// that is not actually a change.
    static func shouldCommitShare(seeded: Bool, teacherId: String, next: Bool, stored: [String]) -> Bool {
        guard seeded else { return false }
        return next != stored.contains(teacherId)
    }

    /// The same guard for Plan membership toggles.
    static func shouldCommitPlanLink(seeded: Bool, planId: String, next: Bool, stored: [String]) -> Bool {
        guard seeded else { return false }
        return next != stored.contains(planId)
    }

    // MARK: - Pickers

    /// Plans this Goal can still be attached to: active, not already linked.
    /// An archived Plan is a closed horizon — nothing new joins it.
    static func attachablePlans(_ plans: [Plan], linkedPlanIds: [String]) -> [Plan] {
        let linked = Set(linkedPlanIds)
        return plans.filter { $0.status == .active && !linked.contains($0.id) }
    }

    /// Horses offerable for a NEW Goal: the un-archived ones.
    static func selectableHorses(_ horses: [Horse]) -> [Horse] {
        horses.filter { $0.archivedAt == nil }
    }

    /// Horses offerable when EDITING a Goal — the selectable ones, plus this
    /// Goal's own horse even if it has since been archived. Otherwise saving an
    /// unrelated title change would silently drop the horse, because the picker
    /// could not represent the current value.
    static func horseChoices(_ horses: [Horse], current: Horse?) -> [Horse] {
        var choices = selectableHorses(horses)
        if let current, !choices.contains(where: { $0.id == current.id }) {
            choices.append(current)
        }
        return choices
    }
}
