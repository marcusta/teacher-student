import Foundation

/// Block selection, state discrimination and copy for **Hem** (IA §3.1) — the
/// port of `web/home/home-copy.ts`.
///
/// Everything the screen decides, it decides here: which blocks render and in
/// what order, which of the four page states applies, and every phrase. The view
/// only mounts what this returns. Nothing in here reads the clock — `now` and
/// `todayISO` arrive as parameters, exactly as the web module takes `nowIso` /
/// `todayIso`, so a derivation can never flip mid-render.
///
/// Two standing rules from the frozen read contract are encoded here rather than
/// left to the view:
///
/// - **`capabilities` is a fact, not a gate.** The only capability gate in this
///   slice is whether **Boka lektion** renders. `Logga pass` is unconditional and
///   the riding block is NEVER gated on `rides` — a zero-Relation account still
///   owns Plans and Goals.
/// - **There is no read-state.** `latestFeedback` is the latest, not the unread.
///   No badge, no dot, no "ny" anywhere below.
///
/// The date/excerpt helpers at the bottom are local ports of `lesson-copy`,
/// `training-session-copy`, `goal-copy` and `plan-copy` functions the web module
/// imports. They live here, namespaced, because those feature slices are owned by
/// other agents and Hem may not depend on their symbols (PLAN.md §1).
enum HomeCopy {

    // MARK: - Page state (IA §3.1 States)

    /// Which of the page's states applies.
    ///
    /// `unknown` is the non-negotiable fourth state: while the fetch is
    /// unresolved *or has failed with nothing in hand*, neither empty state may
    /// render. Substituting "you have nothing" for "we do not know" is the one
    /// substitution that misinforms rather than merely underinforms.
    enum State {
        case unknown
        case invited
        case fresh
        case ready
    }

    /// Failure is checked before resolution because a request that errored is
    /// never coming back on its own.
    static func state(_ view: DashboardView?, resolved: Bool, failed: Bool) -> State {
        // Nothing below this line may be claimed without an answer in hand.
        if failed || !resolved { return .unknown }
        guard let view else { return .unknown }
        if hasContent(view) { return .ready }
        if view.pendingInvitations > 0 { return .invited }
        if !view.capabilities.teaches, !view.capabilities.rides { return .fresh }
        // Related to someone, but with nothing scheduled yet: a real dashboard
        // whose blocks are empty, not a blank account.
        return .ready
    }

    /// Whether the payload carries anything at all to render.
    ///
    /// `pendingInvitations` is deliberately NOT content: it is what distinguishes
    /// `invited` from `fresh`, and counting it here would collapse the two.
    private static func hasContent(_ view: DashboardView) -> Bool {
        view.nextLesson != nil
            || view.latestFeedback != nil
            || !view.awaitingFeedback.isEmpty
            || !view.activePlans.isEmpty
            || !view.goalsNearingTarget.isEmpty
    }

    // MARK: - Block selection (IA §3.1, design system §4.2)

    enum BlockKind: String {
        case nextLesson
        case latestFeedback
        case awaitingFeedback
        case riding

        /// The heading key for a block.
        var titleKey: String {
            switch self {
            case .nextLesson: return "home.nextLesson"
            case .latestFeedback: return "home.feedback"
            case .awaitingFeedback: return "home.awaiting"
            case .riding: return "home.riding"
            }
        }
    }

    enum Block: Identifiable {
        case nextLesson(DashboardNextLesson?)
        case latestFeedback(DashboardFeedback?)
        case awaitingFeedback([DashboardAwaitingItem])
        case riding(plans: [DashboardPlanRef], goals: [DashboardGoalRef])

        var kind: BlockKind {
            switch self {
            case .nextLesson: return .nextLesson
            case .latestFeedback: return .latestFeedback
            case .awaitingFeedback: return .awaitingFeedback
            case .riding: return .riding
            }
        }

        /// Port of `homeBlockKey`. Covers every field the card paints, not just
        /// ids — a card whose only change is what it SAYS must still be rebuilt,
        /// and `id` is what SwiftUI diffs on.
        var id: String {
            switch self {
            case .nextLesson(let lesson):
                return "nextLesson:\(lesson.map(HomeCopy.lessonKey) ?? "")"
            case .latestFeedback(let feedback):
                return "latestFeedback:\(feedback.map(HomeCopy.feedbackKey) ?? "")"
            case .awaitingFeedback(let items):
                return "awaitingFeedback:\(items.map(HomeCopy.awaitingKey).joined(separator: "|"))"
            case .riding(let plans, let goals):
                return [
                    "riding",
                    plans.map(HomeCopy.planKey).joined(separator: "|"),
                    goals.map(HomeCopy.goalKey).joined(separator: "|"),
                ].joined(separator: ":")
            }
        }
    }

    /// The ordered block list, in IA §3.1's information order: the time-sensitive
    /// lesson, then what someone said to me, then what I owe someone, then my own
    /// training. A phone renders one column IN THIS ORDER, so the priority has to
    /// come from this array and never from source order in the view.
    ///
    /// The first two blocks always render — they are the page's subject and both
    /// have their own empty copy, and an absence a reader asked about is an
    /// answer. `awaitingFeedback` renders when it has content or when the reader
    /// teaches (without a teaching Relation there is nothing it could be the
    /// empty state OF). `riding` renders iff it has content, and is never gated
    /// on `rides`.
    ///
    /// The four-card cap of design system §4.2 is structural: one push per kind,
    /// each guarded once, so the longest list this can return is four.
    static func visibleBlocks(_ view: DashboardView) -> [Block] {
        var blocks: [Block] = [
            .nextLesson(view.nextLesson),
            .latestFeedback(view.latestFeedback),
        ]
        if !view.awaitingFeedback.isEmpty || view.capabilities.teaches {
            blocks.append(.awaitingFeedback(view.awaitingFeedback))
        }
        if !view.activePlans.isEmpty || !view.goalsNearingTarget.isEmpty {
            blocks.append(.riding(plans: view.activePlans, goals: view.goalsNearingTarget))
        }
        return blocks
    }

    // MARK: - Routes
    //
    // The web builds Swedish hrefs; on iOS every destination is a shared `Route`
    // pushed onto the tab's stack and resolved by the shell.

    /// Where the latest-feedback card navigates.
    ///
    /// Switches on `targetKind`, never on `parentKind`: `lesson_exercise` and
    /// `training_session_exercise` have no destination of their own, which is
    /// exactly why the payload carries a separate target. `feedbackContext` is
    /// the one that reads `parentKind`, and it reads it for wording only.
    static func route(for feedback: DashboardFeedback) -> Route {
        switch feedback.targetKind {
        case .lesson: return .lesson(id: feedback.targetId)
        case .trainingSession: return .trainingSession(id: feedback.targetId)
        case .goal: return .goal(id: feedback.targetId)
        }
    }

    /// Where an "väntar på din återkoppling" row navigates.
    static func route(for item: DashboardAwaitingItem) -> Route {
        switch item.kind {
        case .lesson: return .lesson(id: item.id)
        case .trainingSession: return .trainingSession(id: item.id)
        }
    }

    // MARK: - Quick actions (IA §3.1 item 6 — the one capability gate)

    enum QuickAction: String, Identifiable {
        case logSession
        case bookLesson

        var id: String { rawValue }

        var labelKey: String {
            self == .logSession ? "home.action.logSession" : "home.action.bookLesson"
        }

        var destination: HomeShellDestination {
            self == .logSession ? .newTrainingSession : .newLesson
        }
    }

    /// **Logga pass is unconditional** — `TrainingSessionService.create` requires
    /// no Relation, so the account every new registration lands in can genuinely
    /// log a session, and hiding the action would hide the one thing it can do.
    ///
    /// **Boka lektion is gated on `teaches`, and it is the only gate in this
    /// slice**: lesson creation requires a Relation, so without one the action is
    /// unavailable rather than merely inadvisable — and the control is withheld
    /// rather than rendered disabled.
    static func quickActions(_ capabilities: DashboardCapabilities) -> [QuickAction] {
        capabilities.teaches ? [.logSession, .bookLesson] : [.logSession]
    }

    // MARK: - The `fresh` state's two equal paths

    struct StartPath: Identifiable {
        let id: String
        let titleKey: String
        let bodyKey: String
        let actionKey: String
        let destination: HomeShellDestination
        /// A deliberately lower-tier link beneath the second panel, so the two
        /// paths stay equal *to each other*.
        var secondary: (actionKey: String, destination: HomeShellDestination)?
    }

    /// The blank account's two starting paths, at equal weight.
    ///
    /// **Neither is capability-gated and the order is fixed.** A brand-new
    /// account has `teaches: false` and must still discover that inviting a
    /// student is possible — hiding the teaching path from the only accounts that
    /// have not yet found it is the exact failure that rule exists to prevent.
    /// This function therefore takes no arguments: there is nothing it could
    /// legitimately vary on.
    static func startPaths() -> [StartPath] {
        [
            StartPath(
                id: "teach",
                titleKey: "home.start.teach.title",
                bodyKey: "home.start.teach.body",
                actionKey: "home.start.teach.action",
                destination: .students
            ),
            StartPath(
                id: "ride",
                titleKey: "home.start.ride.title",
                bodyKey: "home.start.ride.body",
                actionKey: "home.start.ride.action",
                destination: .stable,
                // Goal CREATION, not the goal list: this link only ever renders
                // in the `fresh` state, so by construction the reader has no
                // goals and the list would be a blank page.
                secondary: (actionKey: "home.start.ride.goal", destination: .newGoal)
            ),
        ]
    }

    // MARK: - Next lesson (IA §3.1 item 2)

    /// `Onsdag 22 juli · 17:00`.
    static func nextLessonWhen(_ lesson: DashboardNextLesson) -> String {
        occasionWhen(lesson.scheduledAt)
    }

    /// The card's supporting line: counterparty, then Horse, then Plan.
    ///
    /// Nulls are dropped rather than printed as "Ingen häst" — a card gets two
    /// rows of text, and an absent optional fact spends one of them saying
    /// nothing.
    static func nextLessonMeta(_ lesson: DashboardNextLesson) -> String {
        [lesson.counterpartyDisplayName, lesson.horseName, lesson.planTitle]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    /// `+2 övningar till`, or nil when the preview is the whole list. Through
    /// `plural()`, never a hand-built string: `1 övning till` and `2 övningar
    /// till` are different words.
    static func moreExercisesLabel(_ lesson: DashboardNextLesson) -> String? {
        let hidden = lesson.exerciseCount - lesson.exercisePreview.count
        guard hidden > 0 else { return nil }
        return I18n.plural("home.nextLesson.exercises.more", hidden)
    }

    /// The card's exercise line — recognition, not inventory.
    static func nextLessonExercises(_ lesson: DashboardNextLesson) -> String {
        guard lesson.exerciseCount > 0 else { return I18n.t("home.nextLesson.noExercises") }
        return [lesson.exercisePreview.joined(separator: " · "), moreExercisesLabel(lesson)]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    // MARK: - Latest feedback (IA §3.1 item 3)

    /// The context line — `På övningen Volt i lektionen med Alva Lindgren`.
    ///
    /// Switches on **`parentKind`**, not `targetKind`, so an exercise-occurrence
    /// note says which exercise it was written on. That distinction is the whole
    /// reason the payload carries both: `targetKind` answers "where does this
    /// link to", `parentKind` answers "what is this about".
    ///
    /// A junction note with no `exerciseName` falls back to the occasion-level
    /// wording rather than printing a dangling preposition.
    static func feedbackContext(_ feedback: DashboardFeedback) -> String {
        let exercise = feedback.exerciseName ?? ""
        switch feedback.parentKind {
        case .lesson:
            return I18n.t("home.feedback.on.lesson", ["name": feedback.targetLabel])
        case .lessonExercise:
            return exercise.isEmpty
                ? I18n.t("home.feedback.on.lesson", ["name": feedback.targetLabel])
                : I18n.t("home.feedback.on.lessonExercise", ["exercise": exercise, "name": feedback.targetLabel])
        case .trainingSession:
            return I18n.t("home.feedback.on.trainingSession")
        case .trainingSessionExercise:
            return exercise.isEmpty
                ? I18n.t("home.feedback.on.trainingSession")
                : I18n.t("home.feedback.on.trainingSessionExercise", ["exercise": exercise])
        case .goal:
            return I18n.t("home.feedback.on.goal", ["title": feedback.targetLabel])
        }
    }

    /// `Alva Lindgren · i går 19:32`. Relative to the READER's clock — how long
    /// ago someone wrote to me is a fact about my day, never about the server's
    /// assembly time.
    static func feedbackByline(_ feedback: DashboardFeedback, now: Date) -> String {
        I18n.t("home.feedback.byline", [
            "name": feedback.authorDisplayName,
            "when": I18n.formatRelative(iso: feedback.createdAt, now: now) ?? "",
        ])
    }

    /// How many characters of a note body the card shows.
    static let feedbackExcerptLength = 110

    /// The card's headline: an excerpt of the note, or the target's own label
    /// when the body is empty.
    static func feedbackValue(_ feedback: DashboardFeedback) -> String {
        excerpt(feedback.body, max: feedbackExcerptLength) ?? feedback.targetLabel
    }

    // MARK: - Awaiting feedback (IA §3.1 item 4)

    /// `Lektion med Alva Lindgren` / `Träningspass · Alva Lindgren`.
    static func awaitingLabel(_ item: DashboardAwaitingItem) -> String {
        item.kind == .lesson
            ? I18n.t("home.awaiting.lesson", ["name": item.studentDisplayName])
            : I18n.t("home.awaiting.session", ["name": item.studentDisplayName])
    }

    /// The row's date phrase. A Lesson is *scheduled* and a Training Session is
    /// *performed*, but both feature modules spell the phrase identically, so the
    /// same instant never reads two ways on one page.
    static func awaitingWhen(_ item: DashboardAwaitingItem) -> String {
        occasionWhen(item.occurredAt)
    }

    /// `3 tillfällen` — the count of the BOUNDED list the server returned. A
    /// prompt, not a work queue; this must never be presented as a backlog total.
    static func awaitingCountLabel(_ items: [DashboardAwaitingItem]) -> String {
        I18n.plural("home.awaiting.count", items.count)
    }

    // MARK: - Riding block (IA §3.1 item 5)
    //
    // Never gated on `capabilities.rides` — see `visibleBlocks`.

    /// `2 aktiva planer`.
    static func planCountLabel(_ plans: [DashboardPlanRef]) -> String {
        I18n.plural("home.plans.count", plans.count)
    }

    /// `Måldatum 1 september 2026`, or nil.
    static func goalTargetLabel(_ goal: DashboardGoalRef) -> String? {
        guard let date = I18n.date(fromISO: goal.targetDate) else { return nil }
        return I18n.t("goal.target", ["date": I18n.formatDate(date, .fullDate)])
    }

    /// Whether a Goal on this card is past its target date.
    ///
    /// The server sends no `overdue` flag — overdue is supporting metadata, not a
    /// domain status — so the view derives it, in the READER's own calendar day.
    /// The server's horizon is a soft window computed in the server's zone;
    /// overdue is not soft. `goalsNearingTarget` contains only active goals, so
    /// the status precondition holds by construction.
    static func isGoalOverdue(_ goal: DashboardGoalRef, todayISO: String) -> Bool {
        guard
            let target = I18n.date(fromISO: goal.targetDate),
            let today = I18n.date(fromISO: todayISO)
        else { return false }
        return target < today
    }

    /// The `Datum passerat` marker, or nil. Rendered beside the date as a WORD,
    /// never as a pill: the shape grammar reserves dashed edges for cancelled
    /// things, and a passed target date is a nudge, not an abandonment.
    static func goalOverdueLabel(_ goal: DashboardGoalRef, todayISO: String) -> String? {
        isGoalOverdue(goal, todayISO: todayISO) ? I18n.t("home.goals.overdue") : nil
    }

    // MARK: - Plans (local port of `plan-copy`)

    /// `22 juli 2026 – 30 september 2026`, or one open end, or nil.
    static func dateRangeLabel(start: String?, end: String?) -> String? {
        let startDate = start.flatMap { I18n.date(fromISO: $0) }
        let endDate = end.flatMap { I18n.date(fromISO: $0) }
        if let startDate, let endDate {
            return I18n.t("plan.range.both", [
                "start": I18n.formatDate(startDate, .fullDate),
                "end": I18n.formatDate(endDate, .fullDate),
            ])
        }
        if let startDate {
            return I18n.t("plan.range.from", ["start": I18n.formatDate(startDate, .fullDate)])
        }
        if let endDate {
            return I18n.t("plan.range.until", ["end": I18n.formatDate(endDate, .fullDate)])
        }
        return nil
    }

    /// `Huvudlärare: Alva Lindgren`. Nil when unset — an explicit "Ingen
    /// huvudlärare" on every row is noise about an optional label, and the label
    /// grants no permission either way.
    static func primaryTeacherLabel(_ displayName: String?) -> String? {
        guard let displayName, !displayName.isEmpty else { return nil }
        return I18n.t("plan.primaryTeacher", ["name": displayName])
    }

    // MARK: - Invitations (a domain state, not a read state)

    /// `Du har 2 inbjudningar som väntar.`
    ///
    /// Swedish CLDR has no `zero` category, so without the explicit
    /// `home.invitations.zero` key a zero count would read "Du har 0
    /// inbjudningar som väntar." — a sentence no reader should ever be shown.
    /// `I18n.plural` prefers `<key>.zero` at 0, so the guard is a catalog key
    /// rather than a branch here.
    static func invitationsMessage(_ count: Int) -> String {
        I18n.plural("home.invitations", count)
    }

    // MARK: - Freshness

    /// `Uppdaterad i går 19:32` — how old this payload is.
    ///
    /// `generatedAt` is the SERVER's assembly clock and is used for exactly this
    /// and nothing else. Every other derivation on the page belongs to the
    /// reader's local day.
    static func updatedLabel(generatedAt: String, now: Date) -> String {
        I18n.t("home.updated", ["when": I18n.formatRelative(iso: generatedAt, now: now) ?? ""])
    }

    // MARK: - Shared date + text helpers
    //
    // Local ports of `lessonWhen` / `sessionWhen` (identical in both web modules)
    // and `descriptionExcerpt`.

    /// `Onsdag 22 juli · 17:00`.
    static func occasionWhen(_ iso: String) -> String {
        guard let date = I18n.date(fromISO: iso) else { return "" }
        return [
            I18n.capitalize(I18n.formatDate(date, .longDay)),
            I18n.formatDate(date, .clockTime),
        ].joined(separator: " · ")
    }

    /// Collapse whitespace, then cut at a word boundary with an ellipsis. Nil for
    /// an empty body, so the caller can fall back rather than print a blank line.
    static func excerpt(_ text: String?, max: Int) -> String? {
        let flat = (text ?? "")
            .split(whereSeparator: { $0.isWhitespace })
            .joined(separator: " ")
        if flat.isEmpty { return nil }
        if flat.count <= max { return flat }
        let cut = String(flat.prefix(max))
        if let lastSpace = cut.lastIndex(of: " ") {
            let offset = cut.distance(from: cut.startIndex, to: lastSpace)
            if Double(offset) > Double(max) * 0.6 {
                return trimTrailing(String(cut[cut.startIndex..<lastSpace])) + "…"
            }
        }
        return trimTrailing(cut) + "…"
    }

    private static func trimTrailing(_ value: String) -> String {
        var out = value
        while let last = out.last, last.isWhitespace { out.removeLast() }
        return out
    }

    // MARK: - Row keys
    //
    // Each key covers every field its row paints, not just the id: a row whose
    // only change is what it SAYS must still be rebuilt.

    static func lessonKey(_ lesson: DashboardNextLesson) -> String {
        [
            lesson.id,
            lesson.scheduledAt,
            lesson.counterpartyDisplayName,
            lesson.horseName ?? "",
            lesson.planTitle ?? "",
            lesson.exercisePreview.joined(separator: ","),
            String(lesson.exerciseCount),
        ].joined(separator: "|")
    }

    static func feedbackKey(_ feedback: DashboardFeedback) -> String {
        [
            feedback.noteId,
            feedback.body,
            feedback.authorDisplayName,
            feedback.createdAt,
            feedback.targetLabel,
            feedback.parentKind.rawValue,
            feedback.exerciseName ?? "",
            feedback.targetKind.rawValue,
            feedback.targetId,
        ].joined(separator: "|")
    }

    static func awaitingKey(_ item: DashboardAwaitingItem) -> String {
        [item.kind.rawValue, item.id, item.occurredAt, item.studentDisplayName, item.horseName ?? ""]
            .joined(separator: "|")
    }

    static func planKey(_ plan: DashboardPlanRef) -> String {
        [
            plan.id,
            plan.title,
            plan.startDate ?? "",
            plan.endDate ?? "",
            plan.primaryTeacherDisplayName ?? "",
        ].joined(separator: "|")
    }

    /// Includes `targetDate` because the row paints two things derived from it —
    /// the target-date label and the overdue marker — neither of which the server
    /// sends.
    static func goalKey(_ goal: DashboardGoalRef) -> String {
        [goal.id, goal.title, goal.targetDate].joined(separator: "|")
    }
}
