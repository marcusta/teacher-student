import Foundation

/// Copy and derivation rules for Lektioner (IA §3.7) and Lektion (IA §3.8) —
/// the port of `web/lessons/lesson-copy.ts`.
///
/// Kept apart from the views for the reason the web module states: everything
/// here is pure — the terminal-state control matrix, the derived title, the
/// compact summaries — which is precisely the part worth asserting, and a view
/// is the wrong place to assert it.
///
/// The pieces the web module owns that already live in `Core/UI` are NOT
/// duplicated: `statusPill` is `LessonStatus.chip`, `groupLessons` is
/// `OccasionGrouping.split`, and `dateBlock` is `OccasionDateBlock(iso:)`.
enum LessonCopy {

    // MARK: - The terminal-state control matrix

    /// Which controls a Lektion detail view may render, given status and the
    /// reader's role in this relation.
    ///
    /// The server answers **409** for `addExercise`, `removeExercise`,
    /// `attachProgram` and `detachProgram` once a Lesson is terminal. A control
    /// that can only fail is worse than no control, so those four are withheld
    /// rather than disabled. What deliberately stays OPEN after a terminal
    /// transition: reschedule/horse/plan (a lesson recorded on the wrong horse
    /// must remain correctable) and notes at both levels (most feedback on a
    /// lesson is written *after* it is taught).
    ///
    /// Students never mutate structure at all, at any status, so the role gate
    /// and the status gate are separate conditions rather than one blended flag.
    struct Controls: Equatable {
        /// Mark completed / cancel. Only while planned, and only for the teacher.
        var transition: Bool
        /// Date/time, horse and plan. Open post-terminal — corrections survive.
        var editDetails: Bool
        /// Add and remove Exercise occurrences. 409 after terminal.
        var editExercises: Bool
        /// Attach and detach source Programs. 409 after terminal.
        var editPrograms: Bool
        /// Author notes on the Lesson and on each Exercise occurrence. Always.
        var notes: Bool
        /// Explain why the structural controls are gone.
        var lockNotice: Bool

        /// Nothing is offered while the Lesson is unresolved.
        static let none = Controls(
            transition: false,
            editDetails: false,
            editExercises: false,
            editPrograms: false,
            notes: false,
            lockNotice: false
        )
    }

    static func controls(status: LessonStatus, role: OccasionRole) -> Controls {
        let teacher = role == .teacher
        let open = !status.isTerminal
        return Controls(
            transition: teacher && open,
            editDetails: teacher,
            editExercises: teacher && open,
            editPrograms: teacher && open,
            notes: true,
            lockNotice: teacher && !open
        )
    }

    /// The sentence that replaces the withheld controls. Names what is still open.
    static func lockNotice(_ status: LessonStatus) -> String {
        status == .cancelled ? I18n.t("lesson.locked.cancelled") : I18n.t("lesson.locked.completed")
    }

    /// A 409 means the copy of the Lesson this view is working from is stale —
    /// the status moved somewhere else. IA §4 wants that surfaced as a
    /// *recoverable conflict with a refresh path*, not as a generic failure, so
    /// it is detected by CODE rather than by matching a message string.
    static func isConflict(_ error: ApiError?) -> Bool {
        error?.code == .conflict
    }

    // MARK: - Row and header content

    /// `Onsdag 22 juli · 17:00` — the §4.10 metadata line.
    ///
    /// The design spec's example reads `17:00–18:00`, but the contract carries
    /// only `scheduledAt`; there is no end time or duration anywhere on a
    /// Lesson. Rendering a range would mean inventing the second half of it, so
    /// the line states the start and stops.
    static func lessonWhen(iso: String) -> String {
        guard let date = I18n.date(fromISO: iso) else { return iso }
        return [
            I18n.capitalize(I18n.formatDate(date, .longDay)),
            I18n.formatDate(date, .clockTime),
        ].joined(separator: " · ")
    }

    /// The Lesson's headline.
    ///
    /// IA §3.7 asks for a title "if retained by the contract" — it is not: the
    /// `lessons` table has no title or description column. Rather than print the
    /// bare word "Lektion" on every row, the headline is derived from what the
    /// occasion actually contains, in descending order of how much it says.
    static func title(programs: [AttachedProgramRef], exercises: [LessonExerciseRef]) -> String {
        if programs.count == 1, let only = programs.first { return only.title }
        if !programs.isEmpty { return I18n.plural("lesson.title.programs", programs.count) }
        if !exercises.isEmpty { return I18n.plural("lesson.title.exercises", exercises.count) }
        return I18n.t("lesson.title.plain")
    }

    static func title(_ lesson: LessonForUser) -> String {
        title(programs: lesson.programs, exercises: lesson.exercises)
    }

    /// Source-Program badges, minus any program whose title was promoted into
    /// the headline by `title`. Printing the same string twice on one row is the
    /// kind of noise §4.3's "max two rows of text" rule exists to prevent.
    static func programBadges(_ programs: [AttachedProgramRef]) -> [AttachedProgramRef] {
        programs.count == 1 ? [] : programs
    }

    /// The counterparty's role marker (§4.6): the inverse of the reader's own
    /// role on THIS Lesson. `OccasionRole` is a fact about the relation and
    /// `PersonRole` is what the marker draws, so the crossing happens here once
    /// rather than in every row.
    static func counterpartyRole(_ role: OccasionRole) -> PersonRole {
        role == .teacher ? .student : .teacher
    }

    /// `Program: Grundhoppning A` — a source chip, always named.
    static func programChipLabel(_ program: AttachedProgramRef) -> String {
        I18n.t("lesson.chip.program", ["title": program.title])
    }

    /// `Plan: Hoppsäsong vår 2026`.
    static func planChipLabel(_ title: String) -> String {
        I18n.t("lesson.chip.plan", ["title": title])
    }

    /// How many names the compact row summary prints before it starts counting.
    private static let summaryNames = 3

    /// `4 övningar · Volt, Serpentin, Trav +1` — the compact Exercise summary
    /// (IA §3.7). Never the full list: a row that grows with its content stops
    /// being scannable, which is what §4.3's two-row limit protects.
    static func exerciseSummary(_ exercises: [LessonExerciseRef]) -> String {
        guard !exercises.isEmpty else { return I18n.t("lesson.exercises.none") }
        let shown = exercises.prefix(summaryNames).map(\.name)
        let hidden = exercises.count - shown.count
        let names = hidden > 0
            ? shown.joined(separator: ", ") + " " + I18n.t("lesson.more", ["count": String(hidden)])
            : shown.joined(separator: ", ")
        return I18n.plural("lesson.exerciseSummary", exercises.count, ["names": names])
    }

    /// The static Row note copied with an Exercise occurrence (IA §3.8).
    ///
    /// `notes` is copied verbatim from the source Program at snapshot time. This
    /// is the instructional text, distinct from the Note thread that hangs off
    /// the occurrence's id. Blank and whitespace-only notes collapse to nil so
    /// the row omits the label rather than rendering an empty paragraph.
    static func rowNote(_ exercise: LessonExerciseRef) -> String? {
        guard let note = exercise.notes else { return nil }
        let trimmed = note.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    /// Occurrence rows in taught order — `sortOrder` is the Program's order.
    static func orderedExercises(_ exercises: [LessonExerciseRef]) -> [LessonExerciseRef] {
        exercises.sorted { $0.sortOrder < $1.sortOrder }
    }

    /// `Från Grundhoppning A` — which Program an occurrence was copied from.
    static func exerciseSource(
        _ exercise: LessonExerciseRef,
        programs: [AttachedProgramRef]
    ) -> String? {
        guard let sourceId = exercise.sourceProgramId else { return nil }
        // A detached Program leaves its copied Exercises behind (IA §3.8), so
        // the source id can outlive the label. Say so rather than printing a
        // dangling "Från ".
        guard let program = programs.first(where: { $0.id == sourceId }) else {
            return I18n.t("lesson.exercise.sourceGone")
        }
        return I18n.t("lesson.exercise.source", ["title": program.title])
    }

    /// `Lektion · Onsdag 22 juli · 17:00 · Luna` — the §4.7 thread context row.
    static func threadContext(_ lesson: LessonForUser) -> String {
        [I18n.t("objectKind.lesson"), lessonWhen(iso: lesson.scheduledAt), lesson.horseName]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    /// The §4.10 metadata line: when, who, on which horse.
    static func headerMeta(_ lesson: LessonForUser) -> String {
        [lessonWhen(iso: lesson.scheduledAt), lesson.counterpartyDisplayName, lesson.horseName]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    // MARK: - Creation

    /// IA §3.7 step 3: "Horse from the selected Student's **non-archived**
    /// stable". `GET /students/:id/horses` returns the whole stable including
    /// retired horses, so the filter is the client's job — booking a lesson on a
    /// horse the student has retired is a data-entry trap, not a choice.
    static func bookableHorses(_ horses: [Horse]) -> [Horse] {
        horses.filter { $0.archivedAt == nil }
    }

    /// IA §3.7 step 4: the **active** Plan. An archived Plan is not a destination.
    static func bookablePlans(_ plans: [Plan]) -> [Plan] {
        plans.filter { $0.status == .active }
    }

    // MARK: - Timestamps

    /// The wire spelling of a scheduled time, byte-for-byte what the web sends.
    ///
    /// The web builds its payload with `new Date(value).toISOString()`, which
    /// always carries three fractional digits. `LessonDetail` compares the value
    /// it is about to PATCH against the stored `scheduledAt` to decide whether
    /// anything changed at all, so a formatter that dropped `.000` would report
    /// every unchanged schedule as an edit.
    static func isoTimestamp(_ date: Date) -> String {
        isoFormatter.string(from: minutePrecision(date))
    }

    /// The instant "now" is read at, in the same spelling the timestamps on the
    /// wire use, for the Kommande/Tidigare split. NOT minute-truncated: rounding
    /// the clock down would move a Lesson that started forty seconds ago back
    /// into Kommande.
    static func nowTimestamp(_ date: Date = Date()) -> String {
        isoFormatter.string(from: date)
    }

    /// Drop seconds, exactly as the web's `datetime-local` control does — its
    /// value has minute resolution, so a round trip through the form can never
    /// introduce a second-level difference.
    static func minutePrecision(_ date: Date) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        let parts = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        return calendar.date(from: parts) ?? date
    }

    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()
}
