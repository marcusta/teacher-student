import SwiftUI

/// Nytt program — IA §3.6 creation, port of
/// `web/programs/program-create.component.ts`.
///
/// A Program is created with a name and a description only; its Exercises are
/// added afterwards, in the builder. That is not a shortcut — `POST /programs`
/// takes no exercises, and offering a picker here would have to make a second
/// write that could fail after the Program already existed, leaving a half-made
/// thing behind a success message.
///
/// The snapshot rule is stated here as well as in the builder because it changes
/// what a Program IS: naming one is a decision about a template, not about the
/// lessons that will copy it.
struct ProgramCreateSheet: View {
    let store: ProgramsStore
    var onCreated: (Program) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var descriptionText = ""
    /// Set only after a submit attempt, so the form does not scold while typing.
    @State private var touched = false
    @State private var failure: CatalogWriteFailure?
    @State private var isSubmitting = false

    private var titleIsMissing: Bool {
        title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    CatalogPanel {
                        CatalogField(
                            label: I18n.t("programCreate.field.title"),
                            hint: I18n.t("programCreate.field.title.hint"),
                            error: touched && titleIsMissing ? I18n.t("program.error.title") : nil
                        ) {
                            TextField("", text: $title)
                                .catalogInput()
                                .textInputAutocapitalization(.sentences)
                        }

                        CatalogField(
                            label: I18n.t("programCreate.field.description"),
                            hint: I18n.t("programCreate.field.description.hint")
                        ) {
                            TextField("", text: $descriptionText, axis: .vertical)
                                .lineLimit(4...10)
                                .catalogInput()
                        }

                        if let failure {
                            // A 409 is not "try again": the list has moved under
                            // this form, and the way out is to fetch it — the
                            // program being named may already be in it.
                            CatalogWriteErrorView(failure: failure) {
                                Task { await store.load(silent: true) }
                            }
                        }
                    }

                    CatalogBrassNote(I18n.t("program.snapshot"))
                }
                .padding(Spacing.lg)
            }
            .background(Palette.bg)
            .navigationTitle(I18n.t("programCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("programCreate.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("programCreate.submit")) { Task { await submit() } }
                        .font(Typography.button)
                        .disabled(isSubmitting)
                }
            }
        }
    }

    private func submit() async {
        touched = true
        guard !titleIsMissing else { return }
        isSubmitting = true
        failure = nil
        defer { isSubmitting = false }

        let created = await store.create(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            description: descriptionText.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        guard let created else {
            // §3.6: validation and save failures stay with the form. The sheet
            // does not dismiss, so nothing typed is lost to a dropped
            // connection — and the failure is the store's `writeError`, which
            // the list behind the sheet does not read.
            failure = LibraryCopy.writeFailure(
                store.writeError,
                conflict: "programCreate.conflict",
                action: "program.conflict.action",
                failure: "program.saveError"
            )
            return
        }
        onCreated(created)
        dismiss()
    }
}
