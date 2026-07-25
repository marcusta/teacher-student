import SwiftUI

/// Bibliotek · Övning — IA §3.5 detail, port of
/// `web/library/exercise-detail.component.ts`.
///
/// Pushed as `Route.exercise(id:)`; the shell resolves that case to
/// `ExerciseDetailView(exerciseId:)`.
///
/// **The danger area says what actually happens, which is not deletion.**
/// `DELETE /exercises/:id` archives: `lesson_exercise` and
/// `training_session_exercise` rows are the record of what was actually ridden,
/// and the Notes hanging off them have no FK to cascade through. So the copy
/// says the Exercise leaves the library and every picker, and that occasions
/// which already used it keep it, with their notes.
///
/// **Övningshistorik is withheld, not disabled, when there is no Student**
/// (§3.5 detail step 4). A picker with nothing in it beside a greyed button is a
/// dead end that explains nothing; a sentence saying history arrives with the
/// first student is the same information without the broken control.
///
/// "Används i program" (§3.5 step 3) is deliberately absent: the IA marks it a
/// **Backend gap** ("when supported"), and there is no endpoint that answers it.
/// A count this view cannot compute is not rendered as zero.
struct ExerciseDetailView: View {
    let exerciseId: String

    @Environment(\.dismiss) private var dismiss
    @State private var store = LibraryStore()
    @State private var roster = LibraryRosterStore()

    @State private var name = ""
    @State private var descriptionText = ""
    @State private var touched = false
    /// A failed SAVE, reported in the edit panel it came from.
    @State private var saveFailure: CatalogWriteFailure?
    /// A failed ARCHIVE, reported at the danger button it came from. Kept apart
    /// from `saveFailure` because they are different actions in different parts
    /// of the screen: an archive failure shown in the edit panel puts the
    /// sentence far above the control that produced it, and says the reader's
    /// changes could not be saved about an action that saves nothing.
    @State private var archiveFailure: CatalogWriteFailure?
    @State private var isSaving = false
    @State private var selectedStudentId: String?
    @State private var confirmArchive = false
    @State private var acknowledgement: String?

    private var nameIsMissing: Bool {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        content
            .background(Palette.bg)
            .navigationTitle(I18n.t("nav.library"))
            .navigationBarTitleDisplayMode(.inline)
            .catalogAcknowledgement($acknowledgement)
            .task {
                await store.loadExercise(id: exerciseId)
                if let loaded = store.exercise {
                    name = loaded.name
                    descriptionText = loaded.description
                }
                await roster.load()
            }
            .alert(
                I18n.t("exercise.confirm.archive.title"),
                isPresented: $confirmArchive
            ) {
                Button(I18n.t("exercise.danger.action"), role: .destructive) {
                    Task { await archive() }
                }
                Button(I18n.t("exercise.confirm.dismiss"), role: .cancel) {}
            } message: {
                // §4.12: state the consequence, do not ask "Är du säker?". There
                // is no unarchive endpoint, so an "Ångra" offer would be a
                // promise this screen could not keep.
                Text(I18n.t("exercise.confirm.archive.message"))
            }
    }

    @ViewBuilder
    private var content: some View {
        switch store.detailState {
        case .loading:
            LoadingView(I18n.t("exercise.loading"))
        case .failed:
            // A read that failed is not a missing Exercise. Retrying is the way
            // out of one and useless for the other, so they are separate states.
            ErrorStateView(
                message: I18n.t("library.error"),
                retryTitle: I18n.t("library.retry")
            ) {
                Task { await reload() }
            }
        case .notFound:
            // A missing Exercise and one in another teacher's library resolve
            // identically — the server answers 404 for both, and §3.5 wants
            // exactly that: the view must not reveal that an object it may not
            // read exists.
            NotFoundView(
                title: I18n.t("exercise.notFound.heading"),
                message: I18n.t("exercise.notFound.body"),
                actionTitle: I18n.t("exercise.notFound.action"),
                action: { dismiss() }
            )
        case .ready:
            form
        }
    }

    private var form: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                DetailHeaderView(
                    eyebrow: I18n.t("exercise.eyebrow"),
                    title: name
                )

                editPanel
                historySection

                CatalogDangerSection(
                    heading: I18n.t("exercise.danger.heading"),
                    explanation: I18n.t("exercise.danger.body"),
                    actionTitle: I18n.t("exercise.danger.action"),
                    failure: archiveFailure,
                    refresh: { Task { await reload() } },
                    action: { confirmArchive = true }
                )
            }
            .padding(Spacing.lg)
        }
    }

    private var editPanel: some View {
        CatalogPanel {
            CatalogField(
                label: I18n.t("exercise.field.name"),
                error: touched && nameIsMissing ? I18n.t("exercise.error.name") : nil
            ) {
                TextField("", text: $name)
                    .catalogInput()
                    .textInputAutocapitalization(.sentences)
            }

            CatalogField(label: I18n.t("exercise.field.description")) {
                TextField("", text: $descriptionText, axis: .vertical)
                    .lineLimit(4...10)
                    .catalogInput()
            }

            if let saveFailure {
                // A 409 gets the fetch, not a retry: the Exercise was rewritten
                // somewhere else, and pressing Spara again would overwrite an
                // edit this screen has never shown its reader.
                CatalogWriteErrorView(failure: saveFailure) {
                    Task { await reload() }
                }
            }

            Button(I18n.t("exercise.save")) { Task { await save() } }
                .font(Typography.button)
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
                .disabled(isSaving)
        }
    }

    @ViewBuilder
    private var historySection: some View {
        CatalogSection(
            heading: I18n.t("exercise.history.heading"),
            lede: roster.state == .ready ? I18n.t("exercise.history.body") : nil
        ) {
            switch roster.state {
            case .ready:
                historyPicker
            case .loading:
                Text(I18n.t("exercise.history.rosterLoading"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            case .failed:
                // Never the roster's failure reported as "you have no students".
                Text(I18n.t("exercise.history.rosterError"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            case .noStudents:
                Text(I18n.t("exercise.history.noStudents"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var historyPicker: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Picker(I18n.t("exercise.history.placeholder"), selection: $selectedStudentId) {
                Text(I18n.t("exercise.history.placeholder")).tag(String?.none)
                ForEach(roster.students) { student in
                    Text(student.displayName).tag(String?.some(student.id))
                }
            }
            .pickerStyle(.menu)
            .tint(Palette.accent)

            // The link is only representable once a Student is chosen — the
            // scoped history has no meaning without one.
            if let studentId = selectedStudentId {
                NavigationLink(
                    value: Route.exerciseHistory(studentId: studentId, exerciseId: exerciseId)
                ) {
                    Text(I18n.t("exercise.history.open"))
                        .font(Typography.button)
                }
                .buttonStyle(.bordered)
                .tint(Palette.accent)
            } else {
                Button(I18n.t("exercise.history.open")) {}
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
                    .disabled(true)
            }
        }
    }

    /// Re-reads the Exercise and re-seeds the fields from it. Also the conflict
    /// recovery: after a 409 the fields must show what the server holds, not the
    /// draft that lost.
    private func reload() async {
        saveFailure = nil
        archiveFailure = nil
        await store.loadExercise(id: exerciseId)
        if let loaded = store.exercise {
            name = loaded.name
            descriptionText = loaded.description
        }
    }

    private func save() async {
        touched = true
        guard !nameIsMissing else { return }
        isSaving = true
        saveFailure = nil
        defer { isSaving = false }

        let updated = await store.update(
            id: exerciseId,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            description: descriptionText.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        guard updated != nil else {
            saveFailure = LibraryCopy.writeFailure(
                store.writeError,
                conflict: "exercise.conflict.message",
                action: "exercise.conflict.action",
                failure: "exercise.saveError"
            )
            return
        }
        acknowledgement = I18n.t("exercise.saved")
    }

    private func archive() async {
        archiveFailure = nil
        guard await store.archive(id: exerciseId) else {
            archiveFailure = LibraryCopy.writeFailure(
                store.writeError,
                conflict: "exercise.conflict.message",
                action: "exercise.conflict.action",
                failure: "exercise.archiveError"
            )
            return
        }
        // The Exercise is gone from the library, so this screen has nothing left
        // to show: back to the list, which is where the web navigates too.
        dismiss()
    }
}
