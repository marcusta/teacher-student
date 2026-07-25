import SwiftUI

/// Övningshistorik — one Exercise, one Student, every Lesson it appeared in
/// (IA §3.16). Read-only: notes are written on the Lesson, where the occasion
/// they belong to is in front of the writer.
///
/// **Notes: shared, plus the reader's own private ones — never the other side's
/// private ones.** The server filters `visibility = 'shared' OR author_id =
/// <actor>`, so the other side's private notes never reach this client. The
/// scope line says so, because a reader who cannot see the filter has no way to
/// know whether silence means "nothing was written" or "not for you".
@Observable
@MainActor
final class ExerciseHistoryModel {
    let studentId: String
    let exerciseId: String
    private let api: Api

    let student = AsyncSection<Student>()
    let exercise = AsyncSection<Exercise>()
    let history = AsyncSection<[ExerciseHistoryEntry]>()

    init(studentId: String, exerciseId: String, api: Api = .shared) {
        self.studentId = studentId
        self.exerciseId = exerciseId
        self.api = api
    }

    func load() {
        Task { await student.run { try await self.api.students.get(id: self.studentId) } }
        Task { await exercise.run { try await self.api.exercises.get(id: self.exerciseId) } }
        Task {
            await history.run {
                try await self.api.students.exerciseHistory(id: self.studentId, exerciseId: self.exerciseId)
            }
        }
    }

    var studentName: String { student.data?.displayName ?? "" }
    var exerciseName: String { exercise.data?.name ?? "" }
    var rows: [StudentCopy.HistoryRow] { StudentCopy.historyRows(history.items()) }

    private var sources: [Bool] { [student.isResolved, exercise.isResolved, history.isResolved] }

    /// Any of the three failing resolves as NOT FOUND: the server answers 404
    /// for a missing Relation, Student or Exercise alike, and §3.16 asks for one
    /// indistinguishable state rather than a hint that the object exists but is
    /// not ours. A request that never REACHED the server is the one case that
    /// must not be folded in — that is `unreachable`.
    var state: StudentCopy.HistoryState {
        StudentCopy.historyState(
            resolved: sources.allSatisfy { $0 },
            found: student.data != nil && exercise.data != nil && history.data != nil,
            unreachable: StudentCopy.isUnreachable(student.error)
                || StudentCopy.isUnreachable(exercise.error)
                || StudentCopy.isUnreachable(history.error),
            count: rows.count
        )
    }
}

/// Standalone screen — the shell resolves
/// `Route.exerciseHistory(studentId:exerciseId:)` to this.
struct ExerciseHistoryView: View {
    @State private var model: ExerciseHistoryModel
    @Environment(\.dismiss) private var dismiss
    @Environment(SessionStore.self) private var session

    init(studentId: String, exerciseId: String) {
        _model = State(initialValue: ExerciseHistoryModel(studentId: studentId, exerciseId: exerciseId))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                header
                switch model.state {
                case .loading:
                    LoadingView(I18n.t("exerciseHistory.loading"))
                case .unreachable:
                    unreachableState
                case .notFound:
                    NotFoundView(
                        title: I18n.t("exerciseHistory.notFound.heading"),
                        message: I18n.t("exerciseHistory.notFound.body"),
                        actionTitle: I18n.t("exerciseHistory.notFound.action"),
                        action: { dismiss() }
                    )
                case .empty:
                    EmptyStateView(
                        title: I18n.t("exerciseHistory.empty.heading"),
                        message: I18n.t("exerciseHistory.empty.body"),
                        actionTitle: I18n.t("exerciseHistory.empty.action"),
                        action: { dismiss() }
                    )
                case .rows:
                    ForEach(model.rows) { row in
                        HistoryRowView(
                            row: row,
                            studentId: model.studentId,
                            studentName: model.studentName,
                            viewerIsStudent: session.currentUser?.id == model.studentId
                        )
                    }
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("exerciseHistory.eyebrow"))
        .navigationBarTitleDisplayMode(.inline)
        .task { model.load() }
    }

    /// The request never reached the server. A failed read gets RETRY, never a
    /// link away: nothing about it was the reader's doing.
    ///
    /// The heading is carried above `ErrorStateView` rather than inside it: the
    /// web's state says WHAT failed ("Historiken gick inte att hämta") before it
    /// says what to do about it, and the shared error view has no title slot —
    /// which is Core's to add, not this slice's.
    private var unreachableState: some View {
        // Spacing 0: `ErrorStateView` carries its own generous top padding, and
        // adding to it would drift the heading away from what it names.
        VStack(spacing: 0) {
            Text(I18n.t("exerciseHistory.unreachable.heading"))
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            ErrorStateView(
                message: I18n.t("exerciseHistory.unreachable.body"),
                retryTitle: I18n.t("exerciseHistory.unreachable.action"),
                retry: { model.load() }
            )
        }
        .frame(maxWidth: .infinity)
    }

    /// Context header: whose history this is, and of what.
    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(I18n.t("exerciseHistory.eyebrow").uppercased(with: I18n.locale))
                .font(Typography.groupLabel)
                .foregroundStyle(Palette.textMuted)
            Text(model.exerciseName)
                .font(Typography.pageTitle)
                .foregroundStyle(Palette.text)
            if !model.studentName.isEmpty {
                Text(I18n.t("exerciseHistory.subtitle", ["student": model.studentName]))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
            }
            // Only where there is something to scope. On an empty or failed
            // screen the sentence would describe a filter over nothing.
            if model.state == .rows {
                Text(I18n.t("exerciseHistory.scope"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// One Lesson occurrence: when, where it came from, its row note, and the notes
/// written on it. Reverse-chronological, newest first.
private struct HistoryRowView: View {
    let row: StudentCopy.HistoryRow
    let studentId: String
    let studentName: String
    let viewerIsStudent: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack(alignment: .firstTextBaseline, spacing: Spacing.sm) {
                NavigationLink(value: Route.lesson(id: row.lessonId)) {
                    Text(row.dateLabel)
                        .font(Typography.bodyEmphasis)
                        .foregroundStyle(Palette.accentStrong)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(I18n.t("exerciseHistory.openLesson", ["date": row.dateLabel]))
                Spacer(minLength: Spacing.sm)
                // §4.15 wants a neutral chip here; §4.4's shape grammar keeps it
                // legible with colour removed: outline, neutral, no glyph.
                StatusChip(label: row.sourceLabel, variant: .outline, tone: .neutral)
            }
            if let note = row.rowNote {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(I18n.t("exerciseHistory.col.rowNote"))
                        .font(Typography.groupLabel)
                        .foregroundStyle(Palette.textMuted)
                    Text(note)
                        .font(Typography.body)
                        .foregroundStyle(Palette.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            if !row.notes.isEmpty {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text(I18n.t("exerciseHistory.col.notes"))
                        .font(Typography.groupLabel)
                        .foregroundStyle(Palette.textMuted)
                    ForEach(row.notes) { note in
                        noteEntry(note)
                    }
                }
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay { RoundedRectangle(cornerRadius: Radius.md).stroke(Palette.border) }
    }

    private func noteEntry(_ note: Note) -> some View {
        // The Student of this history is the counterparty for everyone except
        // themselves; the brass rule marks the OTHER side's notes as
        // instruction, which is what §4.7 uses it for.
        let authoredByStudent = note.authorId == studentId
        return HStack(alignment: .top, spacing: Spacing.sm) {
            Rectangle()
                .fill(authoredByStudent ? Color.clear : Palette.brassLine)
                .frame(width: 2)
            VStack(alignment: .leading, spacing: Spacing.xs) {
                WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
                    Text(note.authorDisplayName)
                        .font(Typography.label)
                        .foregroundStyle(Palette.text)
                    // Omitted when it will not parse. The author's name is the
                    // load-bearing part of a note's byline; a raw ISO string
                    // beside it is machine exhaust, not a timestamp.
                    if let stamp = I18n.formatDate(iso: note.createdAt, .noteTimestamp) {
                        Text(stamp)
                            .font(Typography.caption)
                            .foregroundStyle(Palette.textMuted)
                    }
                    // §4.5 forbids a bare "Delad": the chip NAMES its audience.
                    // The shared channel on a lesson-exercise thread runs
                    // between this Student and the Teacher reading it, so the
                    // Student is the recipient to name — and when the reader IS
                    // the Student, `ShareChip` degrades to the explicit
                    // "Delad: okänd mottagare" rather than to an unlabelled one.
                    ShareChip(
                        recipients: note.visibility == .shared && !viewerIsStudent
                            ? [ShareRecipient(id: studentId, name: studentName)]
                            : [],
                        shared: note.visibility == .shared
                    )
                    .accessibilityLabel(StudentCopy.noteVisibilityLabel(note.visibility))
                }
                Text(note.body)
                    .font(Typography.body)
                    .foregroundStyle(Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.leading, Spacing.xs)
    }
}
