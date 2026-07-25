import SwiftUI

/// Lägg till häst — IA §3.15 creation, port of
/// `web/stable/horse-create.component.ts`.
///
/// One field, because the contract has one: `POST /horses` takes a name and
/// nothing else. Inventing breed, age or height here would be inventing storage
/// the server does not have.
struct HorseCreateSheet: View {
    let store: StableStore
    var onCreated: (Horse) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    /// Set only after a submit attempt, so the form does not scold while typing.
    @State private var touched = false
    @State private var didFail = false
    @State private var isSubmitting = false

    private var nameIsMissing: Bool {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    /// Detected by CODE, never by matching the server's message — that text is
    /// developer English and never reaches the screen (PLAN.md §6).
    private var isConflict: Bool {
        store.writeError?.code == .conflict
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                CatalogPanel {
                    CatalogField(
                        label: I18n.t("horseCreate.field.name"),
                        hint: I18n.t("horseCreate.field.name.hint"),
                        error: touched && nameIsMissing ? I18n.t("horse.error.name") : nil
                    ) {
                        TextField("", text: $name)
                            .catalogInput()
                            .textInputAutocapitalization(.words)
                    }

                    if didFail {
                        // A 409 is not a breakage: the stable this sheet was
                        // opened over had moved on, and the store has already
                        // re-read it. §4 calls that a recoverable conflict, and
                        // it gets its own sentence and its own colour so the
                        // reader knows to look before trying again.
                        Text(isConflict
                             ? I18n.t("horseCreate.conflict")
                             : I18n.t("horse.saveError"))
                            .font(Typography.caption)
                            .foregroundStyle(isConflict ? Palette.warning : Palette.danger)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(Spacing.lg)
            }
            .background(Palette.bg)
            .navigationTitle(I18n.t("horseCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("horseCreate.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("horseCreate.submit")) { Task { await submit() } }
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
        didFail = false
        defer { isSubmitting = false }

        let created = await store.create(name: name.trimmingCharacters(in: .whitespacesAndNewlines))
        guard let created else {
            // Validation and save failures stay with the form: the sheet does
            // not dismiss, so nothing typed is lost to a dropped connection.
            didFail = true
            return
        }
        onCreated(created)
        dismiss()
    }
}
