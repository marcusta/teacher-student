import SwiftUI

/// Häst — IA §3.15 detail/edit, port of `web/stable/horse-edit.component.ts`.
///
/// Pushed as `Route.horse(id:)`; the shell resolves that case to
/// `HorseDetailView(horseId:)`.
///
/// The form is one field because the contract is one field: `PATCH /horses/:id`
/// takes a name. Nothing else about a Horse is stored, so nothing else is shown.
///
/// **The danger area says what actually happens, which is not deletion.**
/// `DELETE /horses/:id` archives — Lessons and Training Sessions that reference
/// the Horse have to survive its removal. The Horse leaves the stable and every
/// picker for NEW occasions; the ones already ridden keep it, with their notes.
/// There is no unarchive endpoint, so the confirmation says the action cannot be
/// undone from here rather than offering an "Ångra" it could not honour.
struct HorseDetailView: View {
    let horseId: String

    @Environment(\.dismiss) private var dismiss
    @State private var store = StableStore()

    @State private var name = ""
    @State private var touched = false
    /// A failed SAVE, as the reader is shown it.
    ///
    /// A `CatalogWriteFailure` rather than a bool, because "it failed" is not
    /// one sentence: a 409 means the Horse was renamed somewhere else and the
    /// way out is a fetch, not the Spara the reader just pressed. A bool could
    /// only ever say "försök igen", which for a conflict is advice to overwrite
    /// an edit this screen has never shown. `HorseCreateSheet` draws the same
    /// distinction for the create.
    @State private var saveFailure: CatalogWriteFailure?
    /// Kept apart from `saveFailure` because they are apologies for different
    /// things. Archiving saves nothing, so telling the reader their *changes*
    /// could not be saved — which is what `horse.saveError` says, inside the
    /// edit panel — would be a sentence about a form they never submitted.
    @State private var archiveFailure: CatalogWriteFailure?
    @State private var isSaving = false
    @State private var confirmArchive = false
    @State private var acknowledgement: String?

    private var nameIsMissing: Bool {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        content
            .background(Palette.bg)
            .navigationTitle(I18n.t("stable.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .catalogAcknowledgement($acknowledgement)
            .task { await reload() }
            .alert(I18n.t("horse.confirm.archive.title"), isPresented: $confirmArchive) {
                Button(I18n.t("horse.danger.action"), role: .destructive) {
                    Task { await archive() }
                }
                Button(I18n.t("horse.confirm.dismiss"), role: .cancel) {}
            } message: {
                // §4.12: state the consequence, do not ask "Är du säker?".
                Text(I18n.t("horse.confirm.archive.message"))
            }
    }

    @ViewBuilder
    private var content: some View {
        switch store.detailState {
        case .loading:
            LoadingView(I18n.t("horse.loading"))
        case .failed:
            // A read that failed is not a missing Horse. Retrying is the way out
            // of one and useless for the other, so they are separate states.
            ErrorStateView(
                message: I18n.t("stable.error"),
                retryTitle: I18n.t("stable.retry")
            ) {
                Task { await reload() }
            }
        case .notFound:
            // Missing, archived and another student's Horse resolve identically
            // — the view must not reveal that an object it may not read exists.
            NotFoundView(
                title: I18n.t("horse.notFound.heading"),
                message: I18n.t("horse.notFound.body"),
                actionTitle: I18n.t("horse.notFound.action"),
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
                    eyebrow: I18n.t("horse.eyebrow"),
                    title: name
                )

                CatalogPanel {
                    CatalogField(
                        label: I18n.t("horse.field.name"),
                        error: touched && nameIsMissing ? I18n.t("horse.error.name") : nil
                    ) {
                        TextField("", text: $name)
                            .catalogInput()
                            .textInputAutocapitalization(.words)
                    }

                    if let saveFailure {
                        // A 409 gets the fetch, not a retry: the Horse was
                        // renamed somewhere else, and pressing Spara again would
                        // overwrite a name this screen has never shown.
                        CatalogWriteErrorView(failure: saveFailure) {
                            Task { await reload() }
                        }
                    }

                    Button(I18n.t("horse.save")) { Task { await save() } }
                        .font(Typography.button)
                        .buttonStyle(.borderedProminent)
                        .tint(Palette.accent)
                        .disabled(isSaving)
                }

                // The archive failure stays INSIDE the danger area, next to the
                // control that produced it, rather than in the edit panel above
                // — which is what the section's own `failure` slot is for.
                CatalogDangerSection(
                    heading: I18n.t("horse.danger.heading"),
                    explanation: I18n.t("horse.danger.body"),
                    actionTitle: I18n.t("horse.danger.action"),
                    failure: archiveFailure,
                    refresh: { Task { await reload() } },
                    action: { confirmArchive = true }
                )
            }
            .padding(Spacing.lg)
        }
    }

    /// Re-reads the Horse and re-seeds the field. Also the conflict recovery:
    /// after a 409 the form has to show the name the server holds, not the draft
    /// that lost.
    private func reload() async {
        saveFailure = nil
        archiveFailure = nil
        await store.loadHorse(id: horseId)
        if let loaded = store.horse {
            name = loaded.name
        }
    }

    /// Both writes on this screen classify their failure the same way, and by
    /// CODE rather than by matching the server's message — that text is
    /// developer English and never reaches a reader (PLAN.md §6). A 409 is a
    /// stale copy with a fetch as the way out; anything else is the authored
    /// sentence for that particular action.
    private func horseFailure(_ failureKey: String) -> CatalogWriteFailure? {
        LibraryCopy.writeFailure(
            store.writeError,
            conflict: "horse.conflict.message",
            action: "horse.conflict.action",
            failure: failureKey
        )
    }

    private func save() async {
        touched = true
        guard !nameIsMissing else { return }
        isSaving = true
        saveFailure = nil
        defer { isSaving = false }

        let updated = await store.update(
            id: horseId,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        guard updated != nil else {
            saveFailure = horseFailure("horse.saveError")
            return
        }
        acknowledgement = I18n.t("horse.saved")
    }

    private func archive() async {
        archiveFailure = nil
        guard await store.archive(id: horseId) else {
            archiveFailure = horseFailure("horse.archiveError")
            return
        }
        // The Horse is gone from the stable, so this screen has nothing left to
        // show: back to the list, which is where the web navigates too. The
        // confirmation §4 asks for cannot be shown on a view that is being torn
        // down, so it is handed to the list the reader is about to land on.
        StableHandover.shared.post(I18n.t("horse.archived"))
        dismiss()
    }
}
