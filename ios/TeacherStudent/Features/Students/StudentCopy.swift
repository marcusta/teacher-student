import Foundation

/// The pure rules and copy of the Students slice — port of
/// `web/students/student-copy.ts`, plus the handful of row-label helpers this
/// slice needs from the Lessons, Training Session, Plan and Goal copy modules.
///
/// Three of the functions here are PRIVACY BOUNDARIES rather than formatting:
/// `lessonsWithStudent` (role check), `sharedGoals`/`sharedGoalCount` and
/// `sharedSessions`. They are named functions so that a future edit sourcing the
/// data from somewhere wider has to delete a documented boundary rather than
/// quietly widen a filter.
enum StudentCopy {

    // MARK: - Tabs (IA §3.4)

    /// The Elevvy workspace tabs, in the web's order.
    enum Tab: String, CaseIterable, Identifiable, Hashable {
        case oversikt
        case lektioner
        case pass
        case planer
        case mal
        case hastar
        case historik

        var id: String { rawValue }

        var labelKey: String {
            switch self {
            case .oversikt: return "student.tab.overview"
            case .lektioner: return "student.tab.lessons"
            case .pass: return "student.tab.sessions"
            case .planer: return "student.tab.plans"
            case .mal: return "student.tab.goals"
            case .hastar: return "student.tab.horses"
            case .historik: return "student.tab.history"
            }
        }

        var label: String { I18n.t(labelKey) }
    }

    static let defaultTab: Tab = .oversikt

    // MARK: - Roster (IA §3.3)

    /// Display-name order in the ACTIVE LOCALE's collation. A Swedish roster
    /// containing Åsa, Örjan and Anna is otherwise ordered by code-unit value and
    /// puts both of the first two after Z. The server orders by SQLite's binary
    /// collation, so the client is where this can be got right at all.
    static func sortStudents(_ students: [Student]) -> [Student] {
        students.sorted {
            $0.displayName.compare($1.displayName, options: [], range: nil, locale: I18n.locale) == .orderedAscending
        }
    }

    /// The Lessons of one Student that the reader TEACHES.
    ///
    /// The role check is a privacy boundary, not a tidiness one: `GET /lessons`
    /// returns both sides of the reader's calendar, and a teacher must not read
    /// the lessons this person takes with somebody else.
    static func lessonsWithStudent(_ lessons: [LessonForUser], studentId: String) -> [LessonForUser] {
        lessons.filter { $0.studentId == studentId && $0.role == .teacher }
    }

    /// The next Lesson with this Student, or nil.
    ///
    /// Cancelled lessons are excluded: "nästa lektion" naming an occasion that
    /// will not happen is worse than saying nothing.
    static func nextLessonWith(_ lessons: [LessonForUser], studentId: String, nowISO: String) -> LessonForUser? {
        lessonsWithStudent(lessons, studentId: studentId)
            .filter { $0.status == .planned && $0.scheduledAt >= nowISO }
            .sorted { $0.scheduledAt < $1.scheduledAt }
            .first
    }

    /// 'Nästa lektion onsdag 22 juli · 17:00', or nil when there is none.
    ///
    /// Nil rather than "Ingen bokad lektion" on every row: IA §3.3 makes the
    /// summary optional, and a roster of twelve students each announcing an
    /// absence is noise. Elevvy's Översikt tab, which is about one student, does
    /// state the absence.
    static func nextLessonSummary(_ lesson: LessonForUser?) -> String? {
        guard let lesson else { return nil }
        return I18n.t("student.nextLesson", ["when": occasionWhen(lesson.scheduledAt)])
    }

    /// Which of the three §3.3 states Mina elever is in.
    ///
    /// - `empty` — no students AND no invitations: one branded empty state.
    /// - `invitedOnly` — invitations exist but none accepted: the list is kept
    ///   and the next step explained.
    /// - `roster` — at least one Relation.
    /// - `unknown` — a source has not answered. An ERRORED list has not answered
    ///   either, which is why only `empty` may render the branded empty state.
    enum RosterState {
        case unknown
        case empty
        case invitedOnly
        case roster
    }

    static func rosterState(
        students: Int,
        invitations: Int,
        studentsResolved: Bool,
        invitationsResolved: Bool
    ) -> RosterState {
        if students > 0 { return .roster }
        // Nothing below this line may be claimed without both answers in hand.
        if !studentsResolved || !invitationsResolved { return .unknown }
        return invitations > 0 ? .invitedOnly : .empty
    }

    // MARK: - Invitations (IA §3.3, absorbed from /invitations)

    /// IA §3.3: "Pending invitations may be revoked; terminal rows are
    /// read-only." Every non-pending status is terminal, and the control is
    /// WITHHELD rather than disabled — a greyed Återkalla on an accepted
    /// invitation suggests the relation could be undone from here, and it cannot.
    static func canRevoke(_ status: InvitationStatus) -> Bool {
        status == .pending
    }

    /// 'Skickad i går 19:32' — sent time, IA §3.3.
    ///
    /// Note what is NOT here: no countdown, no "gäller till". Nothing in the
    /// server ever writes `expired`, so the UI must not promise expiry.
    ///
    /// Nil rather than the raw timestamp when the string will not parse: a row
    /// reading "Skickad 2026-07-24T19:32:11.000Z" is machine exhaust, and the
    /// sent time is a nice-to-have line the row can simply omit.
    static func invitationSentLabel(_ createdAt: String, now: Date = Date()) -> String? {
        guard let when = I18n.formatRelative(iso: createdAt, now: now) else { return nil }
        return I18n.t("invitations.sent", ["when": when])
    }

    /// Pending first, newest first inside each group. The pending ones are the
    /// only actionable rows on the page, so they lead; terminal rows are a
    /// record. The server returns creation order only, so the grouping is ours.
    static func sortInvitations(_ invitations: [Invitation]) -> [Invitation] {
        invitations.sorted { a, b in
            let aPending = a.status == .pending
            let bPending = b.status == .pending
            if aPending != bPending { return aPending }
            return a.createdAt > b.createdAt
        }
    }

    // MARK: - The invite form (IA §3.3)

    /// Same shape as the register form's check: an `@` with something either
    /// side and a dot in the domain. Deliberately not an RFC 5322 attempt — the
    /// server is the authority, and an over-strict client regex rejects
    /// addresses that are legal.
    private static let emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"

    /// Field-level validation copy, or nil when the field is fine. Both messages
    /// name the FIX rather than the fault.
    static func inviteEmailError(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return I18n.t("invite.error.emailRequired") }
        if trimmed.range(of: emailPattern, options: .regularExpression) == nil {
            return I18n.t("invite.error.emailInvalid")
        }
        return nil
    }

    /// Duplicate-pending detection — IA §3.3: "reports duplicate-pending
    /// conflicts inline". Keyed on the CODE, never on the server's message text,
    /// which is developer English and would never have worked in Swedish.
    static func isConflict(_ error: ApiError?) -> Bool {
        error?.code == .conflict
    }

    /// The inline message for a duplicate pending invitation. Names the address.
    static func duplicateInviteMessage(_ email: String) -> String {
        I18n.t("invite.error.conflict", ["email": email.trimmingCharacters(in: .whitespacesAndNewlines)])
    }

    // MARK: - Elevvy header (IA §3.4)

    /// The header's relation context. IA §1: role is a fact about a Relation,
    /// never an account type — so the line states the reader's own side of THIS
    /// relation and the address that identifies the other. There is no relation
    /// start date in the contract, so none is invented.
    static func relationContext(email: String) -> String {
        I18n.t("student.relation", ["email": email])
    }

    // MARK: - Tab data rules (IA §3.4)

    /// Non-archived horses. The stable is the Student's own; a Teacher reads it.
    static func activeHorses(_ horses: [Horse]) -> [Horse] {
        horses.filter { $0.archivedAt == nil }
    }

    static func activePlans(_ plans: [Plan]) -> [Plan] {
        plans.filter { $0.status == .active }
    }

    /// **Elevvy's Mål tab and every count derived from it read from
    /// `GET /students/:id/goals` and from nothing else.** A count sourced from
    /// anywhere wider — a Plan's linked goals, a total-goals field — would leak
    /// the existence of Goals the Student chose not to share. A number is a
    /// disclosure.
    static func sharedGoals(_ goalsFromShareEndpoint: [GoalTeacherView]) -> [GoalTeacherView] {
        goalsFromShareEndpoint
    }

    static func sharedGoalCount(_ goalsFromShareEndpoint: [GoalTeacherView]) -> Int {
        sharedGoals(goalsFromShareEndpoint).count
    }

    /// IA §3.4 Pass: "only Training Sessions explicitly shared with this
    /// Teacher". `GET /students/:id/training-sessions` inner-joins the share
    /// table, so the payload IS the shared set and this only orders it — newest
    /// first, because a coach reads the latest ride.
    static func sharedSessions(_ sessions: [TrainingSession]) -> [TrainingSession] {
        sessions.sorted { $0.performedAt > $1.performedAt }
    }

    static func latestSharedSession(_ sessions: [TrainingSession]) -> TrainingSession? {
        sharedSessions(sessions).first
    }

    // MARK: - Översikt (IA §3.4)

    /// 'Aktiva planer · 2'. Counts go through `plural` — 1 plan, 2 planer.
    static func planCountLabel(_ count: Int) -> String {
        I18n.plural("student.overview.planCount", count)
    }

    /// 'Delade mål · 3'. See `sharedGoalCount` for why this count is safe.
    static func goalCountLabel(_ count: Int) -> String {
        I18n.plural("student.overview.goalCount", count)
    }

    enum ActivityKind {
        case lesson
        case session
    }

    struct ActivityItem: Identifiable, Equatable {
        let kind: ActivityKind
        let objectId: String
        let at: String
        let title: String

        var id: String {
            "\(kind == .lesson ? "lesson" : "session"):\(objectId):\(at)"
        }

        var route: Route {
            kind == .lesson ? .lesson(id: objectId) : .trainingSession(id: objectId)
        }
    }

    static let activityLimit = 5

    /// The last five things that HAPPENED — past lessons and past shared
    /// sessions, merged and newest first.
    static func recentActivity(
        lessons: [LessonForUser],
        sessions: [TrainingSession],
        nowISO: String,
        limit: Int = activityLimit
    ) -> [ActivityItem] {
        var items: [ActivityItem] = []
        for lesson in lessons where lesson.scheduledAt <= nowISO {
            items.append(ActivityItem(
                kind: .lesson,
                objectId: lesson.id,
                at: lesson.scheduledAt,
                title: lessonTitle(lesson)
            ))
        }
        for session in sessions where session.performedAt <= nowISO {
            items.append(ActivityItem(
                kind: .session,
                objectId: session.id,
                at: session.performedAt,
                title: sessionTitle(session)
            ))
        }
        return Array(items.sorted { $0.at > $1.at }.prefix(limit))
    }

    /// `recentActivity` is fed from two lists that may be missing or broken, so
    /// an empty result means one of three different things and only one of them
    /// is "nothing has happened". Rendering the empty copy for the other two
    /// tells a Teacher their rider has done nothing when the truth is that the
    /// request has not come back, or came back broken.
    ///
    /// Failure outranks the unresolved window because a source that has errored
    /// is never coming back on its own, and the reader is owed the reason.
    enum ActivityLineState {
        case silent
        case empty
        case unavailable
    }

    static func activityLineState(sourcesFailed: Bool, sourcesAnswered: Bool, count: Int) -> ActivityLineState {
        if sourcesFailed { return .unavailable }
        if !sourcesAnswered { return .silent }
        return count == 0 ? .empty : .silent
    }

    static func activityKindLabel(_ kind: ActivityKind) -> String {
        kind == .lesson ? I18n.t("objectKind.lesson") : I18n.t("objectKind.trainingSession")
    }

    /// 'i går 19:32' — the §4.6 in-row timestamp. Nil rather than the raw ISO
    /// string when it will not parse: the row already names the object, and a
    /// blank trailing column reads better than a machine timestamp.
    static func activityWhen(_ iso: String, now: Date = Date()) -> String? {
        I18n.formatRelative(iso: iso, now: now)
    }

    // MARK: - Not found (IA §3.4)

    /// Whether a failed read means "not yours" rather than "we are broken".
    ///
    /// The server answers 404 for a missing Student, a revoked Relation, and
    /// another teacher's student alike — deliberately, so the response never
    /// reveals that an account exists. `.forbidden` joins it because a 403 is
    /// the same answer in a different word: the object is not the reader's, and
    /// retrying will never change that. Anything else — a 500, a dropped
    /// connection — is a FAILURE, not an answer, and must render as an error
    /// with a retry: showing "Eleven finns inte" because the network blinked
    /// tells the reader their student was removed.
    static func isNotFound(_ error: ApiError?) -> Bool {
        guard let error else { return false }
        return error.code == .notFound || error.code == .forbidden
    }

    /// Whether a failure means the server was never reached — the
    /// Övningshistorik `unreachable` state (`isUnreachable` in
    /// `web/students/exercise-history-copy.ts`).
    static func isUnreachable(_ error: ApiError?) -> Bool {
        guard let error else { return false }
        return error.code == .network || error.code == .timeout
    }

    // MARK: - Row labels borrowed from the sibling copy modules
    //
    // These are ports of `lesson-copy.ts`, `training-session-copy.ts`,
    // `plan-copy.ts` and `goal-copy.ts`. They live here, privately, because the
    // Swift ports of those modules belong to other feature slices and this slice
    // may not reach into them. Same rules, same catalog keys.

    /// 'Onsdag 22 juli · 17:00' — `lessonWhen` / `sessionWhen`.
    static func occasionWhen(_ iso: String) -> String {
        guard let date = I18n.date(fromISO: iso) else { return iso }
        return I18n.capitalize(I18n.formatDate(date, .longDay)) + " · " + I18n.formatDate(date, .clockTime)
    }

    /// The Lesson's headline, derived from what the occasion contains: the
    /// `lessons` table has no title column, so a bare "Lektion" on every row
    /// would say nothing.
    static func lessonTitle(_ lesson: LessonForUser) -> String {
        if lesson.programs.count == 1, let first = lesson.programs.first { return first.title }
        if !lesson.programs.isEmpty { return I18n.plural("lesson.title.programs", lesson.programs.count) }
        if !lesson.exercises.isEmpty { return I18n.plural("lesson.title.exercises", lesson.exercises.count) }
        return I18n.t("lesson.title.plain")
    }

    /// Source-Program badges, minus any program whose title `lessonTitle`
    /// promoted into the headline. Printing the same string twice on one row is
    /// the noise §4.3's two-row limit exists to prevent.
    static func lessonProgramChips(_ lesson: LessonForUser) -> [String] {
        guard lesson.programs.count != 1 else { return [] }
        return lesson.programs.map { I18n.t("lesson.chip.program", ["title": $0.title]) }
    }

    static func lessonPlanChip(_ title: String) -> String {
        I18n.t("lesson.chip.plan", ["title": title])
    }

    /// How many names a compact row summary prints before it starts counting.
    private static let summaryNames = 3

    /// '4 övningar · Volt, Serpentin, Trav +1' — never the full list: a row that
    /// grows with its content stops being scannable.
    static func lessonExerciseSummary(_ exercises: [LessonExerciseRef]) -> String {
        if exercises.isEmpty { return I18n.t("lesson.exercises.none") }
        let names = summaryNameList(exercises.map(\.name), moreKey: "lesson.more")
        return I18n.plural("lesson.exerciseSummary", exercises.count, ["names": names])
    }

    static func sessionExerciseSummary(_ exercises: [TrainingSessionExerciseRef]) -> String {
        if exercises.isEmpty { return I18n.t("trainingSession.exercises.none") }
        let names = summaryNameList(exercises.map(\.name), moreKey: "trainingSession.more")
        return I18n.plural("trainingSession.exerciseSummary", exercises.count, ["names": names])
    }

    private static func summaryNameList(_ allNames: [String], moreKey: String) -> String {
        let shown = Array(allNames.prefix(summaryNames))
        let hidden = allNames.count - shown.count
        let joined = shown.joined(separator: ", ")
        guard hidden > 0 else { return joined }
        return joined + " " + I18n.t(moreKey, ["count": String(hidden)])
    }

    /// How many characters of a summary a row shows before it elides.
    private static let excerptLength = 90

    /// Collapsed to a single line and cut at a word boundary. The full text is
    /// one tap away on the detail view, which is where it is meant to be read.
    static func summaryExcerpt(_ summary: String?, max: Int = excerptLength) -> String? {
        let flat = (summary ?? "")
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        if flat.isEmpty { return nil }
        if flat.count <= max { return flat }
        let cut = String(flat.prefix(max))
        if let lastSpace = cut.lastIndex(of: " ") {
            let head = cut.distance(from: cut.startIndex, to: lastSpace)
            if Double(head) > Double(max) * 0.6 {
                return String(cut[cut.startIndex..<lastSpace]) + "…"
            }
        }
        return cut.trimmingCharacters(in: .whitespaces) + "…"
    }

    static func sessionTitle(_ session: TrainingSession) -> String {
        if let excerpt = summaryExcerpt(session.summary, max: 60) { return excerpt }
        if session.programs.count == 1, let first = session.programs.first { return first.title }
        if !session.programs.isEmpty { return I18n.plural("trainingSession.title.programs", session.programs.count) }
        if !session.exercises.isEmpty {
            return I18n.plural("trainingSession.title.exercises", session.exercises.count)
        }
        return I18n.t("trainingSession.title.plain")
    }

    /// A summary took the headline, so no Program title was promoted and all of
    /// them are still worth showing.
    static func sessionProgramChips(_ session: TrainingSession) -> [String] {
        let programs: [AttachedProgramRef]
        if summaryExcerpt(session.summary, max: 60) != nil {
            programs = session.programs
        } else {
            programs = session.programs.count == 1 ? [] : session.programs
        }
        return programs.map { I18n.t("trainingSession.chip.program", ["title": $0.title]) }
    }

    static func sessionPlanChip(_ title: String) -> String {
        I18n.t("trainingSession.chip.plan", ["title": title])
    }

    /// '45 min'. Nil when no duration was logged — missing optional data hides
    /// its field rather than printing '(ej angiven)'.
    static func durationLabel(_ durationMin: Int?) -> String? {
        guard let durationMin else { return nil }
        return I18n.plural("trainingSession.duration", durationMin)
    }

    /// '1 mars 2026 – 31 maj 2026' / 'Från …' / 'Till och med …', or nil.
    static func dateRangeLabel(startDate: String?, endDate: String?) -> String? {
        let start = startDate.flatMap { I18n.formatDate(iso: $0, .dayMonthYear) }
        let end = endDate.flatMap { I18n.formatDate(iso: $0, .dayMonthYear) }
        if let start, let end { return I18n.t("plan.range.both", ["start": start, "end": end]) }
        if let start { return I18n.t("plan.range.from", ["start": start]) }
        if let end { return I18n.t("plan.range.until", ["end": end]) }
        return nil
    }

    static func primaryTeacherLabel(_ displayName: String?) -> String? {
        guard let displayName, !displayName.isEmpty else { return nil }
        return I18n.t("plan.primaryTeacher", ["name": displayName])
    }

    /// 'Måldatum 1 september 2026' — nil when the Goal has no target date.
    static func targetDateLabel(_ targetDate: String?) -> String? {
        guard let targetDate, let formatted = I18n.formatDate(iso: targetDate, .dayMonthYear) else { return nil }
        return I18n.t("goal.target", ["date": formatted])
    }

    // MARK: - Övningshistorik (IA §3.16)

    /// 'Grundhoppning A' or 'Fristående' — where the occurrence came from.
    static func historySourceLabel(_ sourceProgramTitle: String?) -> String {
        sourceProgramTitle ?? I18n.t("exerciseHistory.standalone")
    }

    /// Blank and whitespace-only row notes collapse to nil so the row omits the
    /// label entirely rather than rendering an empty paragraph.
    static func rowNote(_ note: String?) -> String? {
        guard let trimmed = note?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
            return nil
        }
        return trimmed
    }

    /// Oldest first inside one occurrence — a thread reads as a conversation.
    /// The API decides WHICH notes are visible (shared, plus the reader's own
    /// private); this only orders what it returned.
    static func visibleNotes(_ notes: [Note]) -> [Note] {
        notes.sorted { $0.createdAt < $1.createdAt }
    }

    static func noteVisibilityLabel(_ visibility: NoteVisibility) -> String {
        visibility == .shared
            ? I18n.t("exerciseHistory.note.shared")
            : I18n.t("exerciseHistory.note.private")
    }

    /// One occurrence of the exercise, ready to render.
    struct HistoryRow: Identifiable, Equatable {
        let id: String
        let lessonId: String
        let scheduledAt: String
        let dateLabel: String
        let sourceLabel: String
        let rowNote: String?
        let notes: [Note]
    }

    /// Reverse-chronological — the latest ride first.
    static func historyRows(_ entries: [ExerciseHistoryEntry]) -> [HistoryRow] {
        entries
            .sorted { $0.scheduledAt > $1.scheduledAt }
            .map { entry in
                HistoryRow(
                    id: entry.lessonExerciseId,
                    lessonId: entry.lessonId,
                    scheduledAt: entry.scheduledAt,
                    dateLabel: I18n.date(fromISO: entry.scheduledAt).map { I18n.formatIsoDate($0) } ?? entry.scheduledAt,
                    sourceLabel: historySourceLabel(entry.sourceProgramTitle),
                    rowNote: rowNote(entry.rowNotes),
                    notes: visibleNotes(entry.notes)
                )
            }
    }

    /// Which of the five Övningshistorik states the screen is in.
    enum HistoryState {
        case loading
        case unreachable
        case notFound
        case empty
        case rows
    }

    static func historyState(resolved: Bool, found: Bool, unreachable: Bool, count: Int) -> HistoryState {
        if !resolved { return .loading }
        if unreachable { return .unreachable }
        if !found { return .notFound }
        return count == 0 ? .empty : .rows
    }

    // MARK: - Shared plumbing

    static func nowISO(_ date: Date = Date()) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.string(from: date)
    }

    /// The one error sentence every failed section in this slice shows. The
    /// server's own `message` is developer English and never reaches the screen.
    static func errorText(_ key: String) -> String {
        I18n.t(key)
    }
}
