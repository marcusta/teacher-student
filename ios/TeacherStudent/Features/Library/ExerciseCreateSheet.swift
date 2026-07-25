import SwiftUI

/// Ny övning — IA §3.5 creation, port of
/// `web/library/exercise-create.component.ts`.
///
/// Creation is a sheet rather than a panel above the rows for the reason §1
/// gives: a form sitting over the list makes the destination about writing when
/// it is about finding. One call, one outcome — `POST /exercises` takes both
/// fields, so there is no follow-up write that could fail behind a success
/// message.
///
/// Validation and save failures stay HERE (§3.5 "Duplicate or validation errors
/// remain with the form"): the sheet does not dismiss on failure, so nothing
/// the teacher typed is lost to a dropped connection. They stay here in the
/// other sense too — a failed create writes to the store's `writeError`, which
/// the list behind this sheet does not read, so the library is still a library
/// when the sheet closes.
struct ExerciseCreateSheet: View {
    let store: LibraryStore
    var onCreated: (Exercise) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var descriptionText = ""
    /// Set only after a submit attempt, so the form does not scold while typing.
    @State private var touched = false
    @State private var failure: CatalogWriteFailure?
    @State private var isSubmitting = false

    private var nameIsMissing: Bool {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                CatalogPanel {
                    CatalogField(
                        label: I18n.t("exerciseCreate.field.name"),
                        hint: I18n.t("exerciseCreate.field.name.hint"),
                        error: touched && nameIsMissing ? I18n.t("exercise.error.name") : nil
                    ) {
                        TextField("", text: $name)
                            .catalogInput()
                            .textInputAutocapitalization(.sentences)
                    }

                    CatalogField(
                        label: I18n.t("exerciseCreate.field.description"),
                        hint: I18n.t("exerciseCreate.field.description.hint")
                    ) {
                        TextField("", text: $descriptionText, axis: .vertical)
                            .lineLimit(4...10)
                            .catalogInput()
                    }

                    if let failure {
                        // A 409 is not "try again": the library has moved under
                        // this form, and the way out is to fetch it — the
                        // exercise being typed may already be in it.
                        CatalogWriteErrorView(failure: failure) {
                            Task { await store.load(silent: true) }
                        }
                    }
                }
                .padding(Spacing.lg)
            }
            .background(Palette.bg)
            .navigationTitle(I18n.t("exerciseCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("exerciseCreate.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("exerciseCreate.submit")) { Task { await submit() } }
                        .font(Typography.button)
                        .disabled(isSubmitting)
                }
            }
        }
    }

    private func submit() async {
        touched = true
        guard !nameIsMissing else { return }
        isSubmitting = true
        failure = nil
        defer { isSubmitting = false }

        let created = await store.create(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            description: descriptionText.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        guard let created else {
            failure = LibraryCopy.writeFailure(
                store.writeError,
                conflict: "exerciseCreate.conflict",
                action: "exercise.conflict.action",
                failure: "exercise.saveError"
            )
            return
        }
        onCreated(created)
        dismiss()
    }
}
