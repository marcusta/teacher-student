import Foundation

/// Copy and derivation rules for Träningspass (IA §3.9) and its detail (§3.10) —
/// the port of `web/training-sessions/training-session-copy.ts`.
///
/// Everything here is pure. It is kept apart from the views for the same reason
/// the web module is: the role matrix, the sharing recipients, the catalog
/// grouping and the derived headline are the parts worth reading (and asserting)
/// on their own, and none of them needs SwiftUI to be true.
///
/// This is the mirror of the Lektion copy module with authorship reversed. The
/// two occasion kinds are siblings, so the small shared helpers — the §4.3 date
/// block (`OccasionDateBlock` in Core), the compact Exercise summary, the Row
/// note reader — are spelled the same way in both.

// MARK: - The role matrix

/// Who is reading this session. Derived from ownership, not from an account
/// type: the same person is a Student here and a Teacher on someone else's
/// session (IA §1).
enum TrainingSessionViewer: Equatable {
    case owner
    case sharedTeacher
}

/// Which controls a Träningspass detail view may render.
///
/// IA §3.10 is explicit about the asymmetry: the **Student owns the structure**
/// and a **shared Teacher reads it and responds**. So a shared Teacher gets no
/// mutation of metadata, sharing, Programs or Exercises — and those controls are
/// *withheld*, never rendered disabled. The server enforces the same rule
/// (`assertTrainingSessionOwner` answers NotFound for a teacher), so a
/// disabled-but-present control would be a promise the API refuses to keep.
///
/// Notes are the one thing both roles do, at both levels. That is the entire
/// point of sharing a session: the Student writes the reflection, the Teacher
/// answers it.
struct TrainingSessionControls: Equatable {
    /// Performed date/time, duration, horse, plan, summary. Owner only.
    var editDetails: Bool
    /// Which Teachers can see the session. Owner only — it is their trust decision.
    var editSharing: Bool
    /// Attach and detach source Programs. Owner only.
    var editPrograms: Bool
    /// Add and remove Exercise occurrences. Owner only.
    var editExercises: Bool
    /// Hard delete. Owner only, and behind a consequence-stating dialog.
    var remove: Bool
    /// Author notes on the session and on each Exercise occurrence. Both roles.
    var notes: Bool

    static func forViewer(_ viewer: TrainingSessionViewer) -> TrainingSessionControls {
        let owner = viewer == .owner
        return TrainingSessionControls(
            editDetails: owner,
            editSharing: owner,
            editPrograms: owner,
            editExercises: owner,
            remove: owner,
            notes: true
        )
    }
}

// MARK: - Catalog entries

/// Something a §4.9 picker can offer: an item with an id, an owning Teacher and
/// a label. Exercises and Programs are both this shape, and the grouping rule
/// must not be written twice.
protocol CatalogEntry {
    var id: String { get }
    var teacherId: String { get }
    var catalogLabel: String { get }
}

extension Exercise: CatalogEntry {
    var catalogLabel: String { name }
}

extension Program: CatalogEntry {
    var catalogLabel: String { title }
}

/// One selectable row in a grouped picker.
struct CatalogItem: Identifiable, Equatable, Hashable {
    let id: String
    let label: String
}

/// The options owned by one Teacher. The web expresses a group as a `disabled`
/// option row because its `<select>` had nothing better; SwiftUI's `Section`
/// says the same thing structurally, so the grouping is data here rather than a
/// convention about which rows are unselectable.
struct CatalogGroup: Identifiable, Equatable {
    let teacherId: String
    /// The owning Teacher's display name, or `Okänd lärare` when the Relation
    /// has gone but the content has not.
    let teacherName: String
    var items: [CatalogItem]

    var id: String { teacherId }
}

enum TrainingSessionCopy {

    /// A 409 means this view is working from a stale copy. IA §4 wants that
    /// surfaced as a recoverable conflict with a refresh path, not as a generic
    /// failure — and it is detected by CODE, never by matching a message.
    static func isConflict(_ error: ApiError?) -> Bool {
        error?.code == .conflict
    }

    /// Whether a failed read means "there is nothing here for you" rather than
    /// "we are broken".
    ///
    /// The server answers 404 for a deleted session, for a session that was
    /// unshared from this Teacher, and for someone else's session alike —
    /// deliberately, so the response never reveals that the object exists.
    /// `.forbidden` joins it because a 403 is the same answer in a different
    /// word: the session is not the reader's, and retrying will never change
    /// that. Read by CODE, never by comparing `status` by hand — the same rule
    /// `StudentCopy.isNotFound` states for the Students slice.
    static func isNotFound(_ error: ApiError?) -> Bool {
        guard let error else { return false }
        return error.code == .notFound || error.code == .forbidden
    }

    // MARK: - Ordering

    /// IA §3.9: own sessions, **newest first**. There is no Kommande/Tidigare
    /// split here as there is on Lektioner — a Training Session is a log of
    /// practice that already happened, so every row is past by construction.
    static func sortSessions(_ items: [TrainingSession]) -> [TrainingSession] {
        OccasionGrouping.sortByRecency(items, at: \.performedAt)
    }

    /// Occurrence rows in the order they were performed — `sortOrder` is the
    /// Program's.
    static func orderedExercises(_ exercises: [TrainingSessionExerciseRef]) -> [TrainingSessionExerciseRef] {
        exercises.sorted { $0.sortOrder < $1.sortOrder }
    }

    // MARK: - Row and header content

    /// `Tisdag 14 juli · 19:32` — the §4.10 metadata line's leading fact.
    static func sessionWhen(iso: String) -> String {
        guard let date = I18n.date(fromISO: iso) else { return iso }
        return [
            I18n.capitalize(I18n.formatDate(date, .longDay)),
            I18n.formatDate(date, .clockTime),
        ].joined(separator: " · ")
    }

    /// `45 min`. Nil when no duration was logged — IA §3.9 says missing optional
    /// data hides its field rather than blocking the log, so the caller omits
    /// the fact entirely instead of printing "(ej angiven)".
    static func durationLabel(_ durationMin: Int?) -> String? {
        guard let durationMin else { return nil }
        return I18n.plural("trainingSession.duration", durationMin)
    }

    /// How many characters of the summary a row shows before it elides.
    static let excerptLength = 90

    /// The row's summary excerpt (IA §3.9).
    ///
    /// Collapsed to a single line and cut at a word boundary: §4.3 allows a row
    /// at most two rows of text, and a multi-paragraph reflection pasted
    /// verbatim would push every following row off the screen. The full text is
    /// one tap away on the detail view, which is where it is meant to be read.
    static func summaryExcerpt(_ summary: String?, max: Int = excerptLength) -> String? {
        let flat = (summary ?? "")
            .split(whereSeparator: { $0.isWhitespace })
            .joined(separator: " ")
        guard !flat.isEmpty else { return nil }
        guard flat.count > max else { return flat }
        let cut = String(flat.prefix(max))
        if let lastSpace = cut.lastIndex(of: " ") {
            let head = String(cut[cut.startIndex..<lastSpace])
            if head.count > Int(Double(max) * 0.6) {
                return trimmedEnd(head) + "…"
            }
        }
        return trimmedEnd(cut) + "…"
    }

    /// How many names the compact row summary prints before it starts counting.
    private static let summaryNames = 3

    /// `4 övningar · Volt, Serpentin, Trav +1` — the compact Exercise summary
    /// (IA §3.9). Never the full list: a row that grows with its content stops
    /// being scannable, which is what §4.3's two-row limit protects.
    static func exerciseSummary(_ exercises: [TrainingSessionExerciseRef]) -> String {
        guard !exercises.isEmpty else { return I18n.t("trainingSession.exercises.none") }
        let shown = exercises.prefix(summaryNames).map(\.name)
        let hidden = exercises.count - shown.count
        let names = hidden > 0
            ? shown.joined(separator: ", ") + " " + I18n.t("trainingSession.more", ["count": String(hidden)])
            : shown.joined(separator: ", ")
        return I18n.plural("trainingSession.exerciseSummary", exercises.count, ["names": names])
    }

    /// The session's headline.
    ///
    /// `training_sessions` has no title column, so — as on Lektioner — the
    /// headline is derived from what the occasion actually contains, in
    /// descending order of how much it says. The Student's own summary wins when
    /// there is one: it is the only text a person wrote about this specific
    /// session, and it is what they will recognise the row by.
    static func sessionTitle(_ session: TrainingSession) -> String {
        if let excerpt = summaryExcerpt(session.summary, max: 60) { return excerpt }
        if session.programs.count == 1, let first = session.programs.first { return first.title }
        if session.programs.count > 1 {
            return I18n.plural("trainingSession.title.programs", session.programs.count)
        }
        if !session.exercises.isEmpty {
            return I18n.plural("trainingSession.title.exercises", session.exercises.count)
        }
        return I18n.t("trainingSession.title.plain")
    }

    /// Source-Program badges, minus any Program whose title was promoted into
    /// the headline by `sessionTitle`. Printing the same string twice on one row
    /// is the noise §4.3's two-row rule exists to prevent.
    static func programBadges(_ session: TrainingSession) -> [AttachedProgramRef] {
        // A summary took the headline, so no Program title was promoted and all
        // of them are still worth showing.
        if summaryExcerpt(session.summary, max: 60) != nil { return session.programs }
        return session.programs.count == 1 ? [] : session.programs
    }

    /// `Program: Grundhoppning A` — a source chip, always named.
    static func programChipLabel(_ program: AttachedProgramRef) -> String {
        I18n.t("trainingSession.chip.program", ["title": program.title])
    }

    /// `Plan: Hoppsäsong vår 2026`.
    static func planChipLabel(_ title: String) -> String {
        I18n.t("trainingSession.chip.plan", ["title": title])
    }

    /// The static Row note copied with an Exercise occurrence (IA §3.10).
    ///
    /// `training_session_exercise.notes` is copied verbatim from the source
    /// Program at snapshot time. It is instructional text, distinct from the
    /// Note thread that hangs off the occurrence's id. Blank and whitespace-only
    /// notes collapse to nil so the row omits the label entirely rather than
    /// rendering an empty paragraph.
    static func rowNote(_ exercise: TrainingSessionExerciseRef) -> String? {
        guard let note = exercise.notes else { return nil }
        let trimmed = note.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    /// `Från Grundhoppning A` — which Program an occurrence was copied from.
    static func exerciseSource(
        _ exercise: TrainingSessionExerciseRef,
        programs: [AttachedProgramRef]
    ) -> String? {
        guard let sourceId = exercise.sourceProgramId else { return nil }
        // Detaching a Program leaves its copied Exercises behind, so the source
        // id outlives the label. Say so rather than printing a dangling "Från ".
        guard let program = programs.first(where: { $0.id == sourceId }) else {
            return I18n.t("trainingSession.exercise.sourceGone")
        }
        return I18n.t("trainingSession.exercise.source", ["title": program.title])
    }

    // MARK: - Sharing

    /// The audience, by name, as the **owner** sees it (§4.5).
    ///
    /// The owner can enumerate their own Teachers, so every recipient resolves
    /// to a real name. An id with no matching Teacher — a Relation removed since
    /// the session was shared — is kept as an unnamed entry rather than dropped:
    /// it still counts toward the `+N`, so the chip never understates who can
    /// see the session.
    static func ownerRecipients(
        sharedWithTeacherIds: [String],
        teachers: [Teacher]
    ) -> [ShareRecipient] {
        sharedWithTeacherIds.map { id in
            ShareRecipient(id: id, name: teachers.first(where: { $0.id == id })?.displayName ?? "")
        }
    }

    /// The audience as a **shared Teacher** sees it.
    ///
    /// A Teacher cannot enumerate the other Teachers on someone else's session —
    /// there is no endpoint for it, and inventing one would leak a Student's
    /// other relations. But the reader does know one recipient for certain:
    /// themselves. So the chip names that (`Delad: du`) and lets the remaining
    /// ids fall behind the `+N` as unnamed entries. Deliberately not a bare
    /// "Delad" and deliberately not "Delad (2 lärare)" — §4.5 forbids both.
    static func sharedTeacherRecipients(
        sharedWithTeacherIds: [String],
        viewerId: String,
        youLabel: String
    ) -> [ShareRecipient] {
        let others = sharedWithTeacherIds.filter { $0 != viewerId }
        return [ShareRecipient(id: viewerId, name: youLabel)]
            + others.map { ShareRecipient(id: $0, name: "") }
    }

    /// Whether a share set differs from what the server currently stores.
    ///
    /// The web equivalent is `shouldCommitSharing`, which also carries a
    /// `seeded` flag and a Teacher-count guard. Both exist to tame a reactive
    /// EFFECT that fires on every signal write, including the one that seeds the
    /// form from the loaded session. Here every write is user-initiated — a tap
    /// on the checkbox, a row in the selector, the program-owner offer — so
    /// there is no un-seeded state to defend against and no second writer to
    /// de-duplicate against. What remains of the rule is the part that is about
    /// the data: order-insensitive set equality, so re-selecting the same people
    /// in a different order is not a change.
    static func sharingChanged(next: [String], stored: [String]) -> Bool {
        Set(next) != Set(stored)
    }

    // MARK: - Creation

    /// IA §3.9 step 3: the Horse. An archived horse is not a valid answer —
    /// logging a session on a horse the rider has retired is a data-entry trap,
    /// and the server refuses it (`assertOwnUnarchivedHorse`), so offering it
    /// would only produce a failure the picker could have prevented.
    static func loggableHorses(_ horses: [Horse]) -> [Horse] {
        horses.filter { $0.archivedAt == nil }
    }

    /// IA §3.9 step 5: the **active** Plan. An archived Plan is not a destination.
    static func loggablePlans(_ plans: [Plan]) -> [Plan] {
        plans.filter { $0.status == .active }
    }

    // MARK: - Pickers (§4.9)

    /// Catalog options grouped by **owning Teacher** — design system §4.9, which
    /// states the rule as "upphov är en del av innehållet": provenance is
    /// content, not metadata. A Student connected to two Teachers sees two named
    /// groups, never one merged alphabetical list in which an exercise's author
    /// is invisible.
    ///
    /// `excluding` drops what is already attached, so the picker only ever
    /// offers something that would actually change the session. A group whose
    /// every member is already attached disappears with its members rather than
    /// standing as an empty header.
    static func groupByTeacher<Item: CatalogEntry>(
        _ items: [Item],
        teachers: [Teacher],
        excluding excludeIds: Set<String> = []
    ) -> [CatalogGroup] {
        let available = items.filter { !excludeIds.contains($0.id) }
        var byTeacher: [String: [Item]] = [:]
        var order: [String] = []
        for item in available {
            if byTeacher[item.teacherId] == nil { order.append(item.teacherId) }
            byTeacher[item.teacherId, default: []].append(item)
        }

        // Teacher order follows the Teacher list, so the groups keep a stable
        // order across renders rather than following insertion order.
        let ordered = teachers.map(\.id).filter { byTeacher[$0] != nil }
            + order.filter { teacherId in !teachers.contains(where: { $0.id == teacherId }) }

        return ordered.compactMap { teacherId in
            guard let group = byTeacher[teacherId], !group.isEmpty else { return nil }
            let teacher = teachers.first(where: { $0.id == teacherId })
            return CatalogGroup(
                teacherId: teacherId,
                // A Teacher whose Relation has since gone still owns the
                // content, so the group is labelled as unknown rather than
                // silently merged into another Teacher's group.
                teacherName: teacher?.displayName ?? I18n.t("trainingSession.catalog.unknownTeacher"),
                items: group.map { CatalogItem(id: $0.id, label: $0.catalogLabel) }
            )
        }
    }

    /// The Teachers who own an attached Program but cannot see the session.
    ///
    /// IA §3.10: "When attaching a Program, **offer** — do not silently force —
    /// sharing with its owning Teacher." Forcing it would turn a content
    /// decision into a disclosure the Student never made; saying nothing would
    /// leave a Program attached whose author cannot see how it went. So the gap
    /// is surfaced as a standing, dismissible offer with the Teacher named.
    ///
    /// Returns the Teachers still missing, in Teacher-list order.
    static func unsharedProgramOwners(
        attachedPrograms: [AttachedProgramRef],
        catalog: [Program],
        sharedWithTeacherIds: [String],
        teachers: [Teacher]
    ) -> [Teacher] {
        let shared = Set(sharedWithTeacherIds)
        var owners = Set<String>()
        for program in attachedPrograms {
            guard let owner = catalog.first(where: { $0.id == program.id })?.teacherId else { continue }
            if !shared.contains(owner) { owners.insert(owner) }
        }
        return teachers.filter { owners.contains($0.id) }
    }

    // MARK: - Timestamps

    /// The wire spelling of a performed time. `I18n` formats dates for READING;
    /// this is the machine direction, which no Core helper covers.
    static func isoTimestamp(_ date: Date) -> String {
        isoTimestampFormatter.string(from: date)
    }

    /// A performed time seeded into a form, or compared against one, is only
    /// ever accurate to the minute — the picker has no seconds field. Truncating
    /// both sides is what keeps "I did not touch the date" from PATCHing.
    static func minuteTruncated(_ date: Date) -> Date {
        let seconds = date.timeIntervalSinceReferenceDate
        return Date(timeIntervalSinceReferenceDate: (seconds / 60).rounded(.down) * 60)
    }

    private static let isoTimestampFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private static func trimmedEnd(_ value: String) -> String {
        var out = Substring(value)
        while let last = out.last, last.isWhitespace { out = out.dropLast() }
        return String(out)
    }
}
