import Foundation

/// Copy and derivation rules for Planer (IA §3.11) and Plan detail (§3.12) —
/// the port of `web/plans/plan-copy.ts`.
///
/// Everything here is pure: the role matrix, the date-range rules, the
/// archived-state consequences, the linked-occasion ordering. It is kept apart
/// from the views for the same reason the web module is kept apart from its
/// components — the rules are the part worth stating once.
///
/// **Why this depends on `GoalCopy` and the occasion features do not depend on
/// each other.** Lektion and Träningspass are siblings. Plan and Goal are not:
/// the hierarchy is `Goal → Plan → Lesson / Training Session`, and a Plan detail
/// renders Goal statuses and target dates as a matter of course. A one-way
/// dependency down that edge buys one spelling of "Uppnådd" and one calendar
/// date parser.
enum PlanCopy {

    // MARK: - The role matrix

    /// Who is reading this Plan. A Teacher reaches a Plan through a Relation
    /// with its owner, so unlike a Goal there is no per-object share to check.
    enum Viewer {
        case owner
        case connectedTeacher
    }

    /// Which controls a Plan detail view may render. Every withheld control is
    /// **absent**, never disabled — the server enforces the same line, so a
    /// greyed "Arkivera" would be a promise the API refuses to keep.
    struct Controls: Equatable {
        /// Title, description, dates, Primary Teacher. Owner only, any status.
        var editDetails: Bool
        /// Link a Goal to this Plan. Owner only, and only while active.
        var attachGoals: Bool
        /// Unlink a Goal. Owner only; survives archiving so nothing is trapped.
        var detachGoals: Bool
        /// Archive. Owner only, and only from active.
        var archive: Bool
    }

    /// `planControls`. The archived axis is separate from the role axis because
    /// they forbid different things: attaching closes on archive (the server
    /// rejects new links), detaching stays open (archiving must not trap a Goal
    /// inside the plan), and editing stays open (archive is a filing decision,
    /// not a freeze).
    static func controls(viewer: Viewer, status: PlanStatus) -> Controls {
        let owner = viewer == .owner
        let active = status == .active
        return Controls(
            editDetails: owner,
            attachGoals: owner && active,
            detachGoals: owner,
            archive: owner && active
        )
    }

    // MARK: - Dates

    /// `3 mars 2026 – 30 juni 2026`, or the half-open forms.
    ///
    /// A Plan is a horizon and both ends are optional, so all four combinations
    /// get their own sentence rather than one template with a dash dangling off
    /// a missing end. `nil` when neither end is set, so a row omits the fact
    /// instead of printing "Inga datum" on every line of an undated list.
    static func dateRangeLabel(startDate: String?, endDate: String?) -> String? {
        let start = GoalCopy.calendarDate(startDate)
        let end = GoalCopy.calendarDate(endDate)
        if let start, let end {
            return I18n.t("plan.range.both", [
                "start": I18n.formatDate(start, .fullDate),
                "end": I18n.formatDate(end, .fullDate),
            ])
        }
        if let start {
            return I18n.t("plan.range.from", ["start": I18n.formatDate(start, .fullDate)])
        }
        if let end {
            return I18n.t("plan.range.until", ["end": I18n.formatDate(end, .fullDate)])
        }
        return nil
    }

    /// Whether a start/end pair is orderable. IA §3.11 makes an invalid range a
    /// FIELD-level fault, so this answers the question the end-date field asks
    /// about itself. Equal dates are valid — a one-day plan is a legitimate
    /// horizon — and a missing end is not a range problem.
    static func isValidRange(startDate: String?, endDate: String?) -> Bool {
        guard
            let start = GoalCopy.calendarDate(startDate),
            let end = GoalCopy.calendarDate(endDate)
        else { return true }
        return start <= end
    }

    // MARK: - List content

    /// How many characters of the description a row shows before it elides.
    static let excerptLength = 110

    /// A row's description excerpt, collapsed to one line and cut at a word
    /// boundary — §4.3 allows a row at most two rows of text.
    static func descriptionExcerpt(_ description: String?, max: Int = excerptLength) -> String? {
        GoalCopy.excerpt(description, max: max)
    }

    /// `Huvudlärare: Alva Lindgren`.
    ///
    /// IA §3.11 is emphatic that this is a label and a defaulting convenience,
    /// **not elevated permission** — nothing in this module derives access from
    /// it, and the detail view states the rule in words next to the field.
    /// `nil` when unset: an explicit "Ingen huvudlärare" on every row is noise
    /// about an optional label.
    static func primaryTeacherLabel(_ displayName: String?) -> String? {
        guard let displayName, !displayName.isEmpty else { return nil }
        return I18n.t("plan.primaryTeacher", ["name": displayName])
    }

    struct Groups: Equatable {
        var active: [Plan]
        var archived: [Plan]
    }

    /// IA §3.11's information order: active Plans, then an archived section. The
    /// server already orders `status ASC, created_at DESC`, so this partitions
    /// rather than re-sorts. Archived is returned separately because the view
    /// collapses it behind a disclosure.
    static func group(_ plans: [Plan]) -> Groups {
        Groups(
            active: plans.filter { $0.status == .active },
            archived: plans.filter { $0.status == .archived }
        )
    }

    // MARK: - Linked occasions (§3.12)

    /// `Onsdag 22 juli · 17:00` — an occasion row's leading fact.
    static func occasionWhen(_ iso: String) -> String {
        guard let date = I18n.date(fromISO: iso) else { return iso }
        return [
            I18n.capitalize(I18n.formatDate(date, .longDay)),
            I18n.formatDate(date, .clockTime),
        ].joined(separator: " · ")
    }

    /// `Alva Lindgren · Planerad · Luna` — a linked Lesson's supporting line.
    static func lessonMeta(_ lesson: LinkedLessonRef) -> String {
        [
            lesson.teacherDisplayName,
            I18n.t("lesson.status.\(lesson.status.rawValue)"),
            lesson.horseName,
        ]
        .compactMap { $0 }
        .filter { !$0.isEmpty }
        .joined(separator: " · ")
    }

    /// `45 min · Luna · Bra tempo i galoppen` — a linked Session's line.
    static func sessionMeta(_ session: LinkedTrainingSessionRef) -> String? {
        let parts = [
            session.durationMin.map { I18n.plural("trainingSession.duration", $0) },
            session.horseName,
            descriptionExcerpt(session.summary, max: 70),
        ]
        .compactMap { $0 }
        .filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    // MARK: - Goal attachment from the Plan side (§3.12)

    /// The Goals this Plan can still take.
    ///
    /// Already-linked goals are excluded (the insert is a no-op), and so are
    /// abandoned ones: hanging an abandoned goal off a live plan states an
    /// intention that has already been withdrawn. Achieved goals stay offerable.
    ///
    /// Note what this does NOT do: it never reads `PlanDetail.goals` to decide
    /// what is already linked. That array is privacy-filtered per reader.
    static func attachableGoals(_ goals: [Goal], linkedGoalIds: [String]) -> [Goal] {
        let linked = Set(linkedGoalIds)
        return goals.filter { $0.status != .abandoned && !linked.contains($0.id) }
    }

    /// Which Goals of the owner's are linked to this Plan, derived from the
    /// **Goal** side (`goal.planIds`) rather than from `PlanDetail.goals` —
    /// that array answers "what may this reader see", which is a different
    /// question from "what is attached".
    static func linkedGoalIds(_ goals: [Goal], planId: String) -> [String] {
        goals.filter { $0.planIds.contains(planId) }.map(\.id)
    }

    // MARK: - Failures

    /// The models catch `Error` but store `ApiError`, so a view has one shape to
    /// render. Anything that is not already an `ApiError` can only have come
    /// from the transport.
    static func apiError(_ error: Error) -> ApiError {
        (error as? ApiError) ?? ApiError.transport(error, traceId: nil)
    }

    /// A 409 means the screen is working from a stale copy — the Plan was
    /// archived or edited somewhere else while this view sat open. IA §4 wants
    /// that surfaced as a recoverable conflict with a way back to the truth, not
    /// as "Kunde inte spara", which invites the reader to press the same button
    /// again on the same stale state. Detected by CODE, never by matching the
    /// server's message.
    static func isConflict(_ error: ApiError?) -> Bool {
        error?.code == .conflict
    }

    /// Whether a failed read means "not yours" rather than "we are broken".
    ///
    /// The server answers 404 for a Plan that never existed, one that was
    /// deleted, and one belonging to someone the reader has no Relation with —
    /// deliberately, since saying "that plan is not yours" would confirm it
    /// exists. `.forbidden` joins it because a 403 is the same answer in a
    /// different word: this object is not the reader's and retrying will never
    /// make it so. Read off the CODE and not off `status`, which is the whole
    /// reason `ApiErrorCode.notFound` exists. Anything else — a 500, a dropped
    /// connection — is a failure rather than an answer, and must render as an
    /// error with a retry.
    static func isNotFound(_ error: ApiError?) -> Bool {
        guard let error else { return false }
        return error.code == .notFound || error.code == .forbidden
    }

    /// The empty-state copy for the Mål section, which is **not** the same
    /// sentence for both readers: an empty array means "no goals" to the owner
    /// and "none of them is shared with you" to a Teacher. It is also why no
    /// count is rendered anywhere near this section — "1 av 3 mål" would leak
    /// precisely the two the server's filter hid.
    static func goalsEmptyKey(_ viewer: Viewer) -> String {
        viewer == .owner ? "plan.goals.empty.owner" : "plan.goals.empty.teacher"
    }
}
