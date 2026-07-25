import SwiftUI

/// Bibliotek · Program — IA §3.6 detail/builder, port of
/// `web/programs/program-detail.component.ts`.
///
/// Pushed as `Route.program(id:)`; the shell resolves that case to
/// `ProgramDetailView(programId:)`.
///
/// **The snapshot rule is stated at the builder, not in a help page.** Lessons
/// and Training Sessions COPY the Exercises when a Program is attached, so
/// editing here rewrites nothing that already happened. That is the single fact
/// that makes every edit on this screen safe, and it has to be readable where
/// the edits are made.
///
/// **An archived row is inert but not hidden.** `attachProgram` skips archived
/// Exercises when it copies, so the row silently contributes nothing — hiding it
/// would shrink the Program without telling anyone. It is marked `Arkiverad` and
/// keeps its remove and note controls; only the reorder controls are withheld,
/// because moving a row that is skipped is a write with no observable effect.
///
/// **Removing an archived row is the one irreversible edit here**, because
/// `addExercise` refuses an archived Exercise — it cannot be put back. It, and
/// a row carrying a note, get a consequence-stating dialog (§4.12). A live,
/// note-free row removes straight through: re-adding it is one tap away.
struct ProgramDetailView: View {
    let programId: String

    @Environment(\.dismiss) private var dismiss
    @State private var store = ProgramsStore()

    @State private var title = ""
    @State private var descriptionText = ""
    @State private var touched = false
    /// A failed SAVE, reported in the edit panel it came from.
    @State private var saveFailure: CatalogWriteFailure?
    /// A failed ARCHIVE, reported at the danger button. Kept apart from
    /// `saveFailure` because they are different actions at opposite ends of the
    /// screen, and "programmet kunde inte sparas" is the wrong sentence for an
    /// action that saves nothing.
    @State private var archiveFailure: CatalogWriteFailure?
    @State private var isSaving = false

    /// A builder write is in flight. The row controls and the add button are
    /// disabled while it is: every one of them reloads the sequence when it
    /// lands, so a second tap issued over the first one's re-read is a write
    /// aimed at an order that is about to be replaced under it. The failure of
    /// each write travels back with the call, so this is a guard against
    /// nonsense writes and not the thing that keeps their messages apart.
    @State private var isMutating = false

    /// The picker's current choice. `nil` is "nothing chosen".
    @State private var pickedId: String?
    @State private var addFailure: CatalogWriteFailure?

    /// The Exercise id whose note is open for editing, or `nil` for none. One at
    /// a time, and held here rather than per row so a reload cannot resurrect a
    /// second open editor.
    @State private var editingNoteId: String?
    /// The open editor's uncommitted text. Saved explicitly; never on blur.
    @State private var noteDraft = ""
    @State private var noteError: String?

    /// A failed reorder is reported AT the sequence, not in the success banner:
    /// the web shows an error toast, and a failure has to be readable next to
    /// the rows whose order did not change.
    @State private var reorderFailure: CatalogWriteFailure?

    /// A failed removal, and the row it belongs to. Scoped to the row for the
    /// same reason the note error is: the reader pressed **Ta bort** on one
    /// line, and a sentence anywhere else does not say which line stayed.
    @State private var removeFailure: CatalogWriteFailure?
    @State private var removeFailureId: String?

    @State private var confirmArchive = false
    @State private var pendingRemoval: ProgramBuilderRow?
    @State private var acknowledgement: String?

    private var titleIsMissing: Bool {
        title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var rows: [ProgramBuilderRow] {
        ProgramBuilder.rows(store.exercises)
    }

    private var pickable: [Exercise] {
        ProgramBuilder.pickable(library: store.availableExercises, attached: store.exercises)
    }

    var body: some View {
        content
            .background(Palette.bg)
            .navigationTitle(I18n.t("nav.programs"))
            .navigationBarTitleDisplayMode(.inline)
            .catalogAcknowledgement($acknowledgement)
            .task { await reload() }
            .alert(I18n.t("program.confirm.archive.title"), isPresented: $confirmArchive) {
                Button(I18n.t("program.danger.action"), role: .destructive) {
                    Task { await archive() }
                }
                Button(I18n.t("program.confirm.dismiss"), role: .cancel) {}
            } message: {
                // §4.12: state the consequence. There is no unarchive endpoint,
                // so an "Ångra" offer would be a promise this screen could not
                // keep.
                Text(I18n.t("program.confirm.archive.message", ["title": title]))
            }
            .alert(
                I18n.t("program.confirm.remove.title"),
                isPresented: Binding(
                    get: { pendingRemoval != nil },
                    set: { if !$0 { pendingRemoval = nil } }
                ),
                presenting: pendingRemoval
            ) { row in
                Button(I18n.t("program.row.remove"), role: .destructive) {
                    Task { await remove(row) }
                }
                Button(I18n.t("program.confirm.dismiss"), role: .cancel) {
                    pendingRemoval = nil
                }
            } message: { row in
                Text(removalMessage(for: row))
            }
    }

    @ViewBuilder
    private var content: some View {
        switch store.detailState {
        case .loading:
            LoadingView(I18n.t("program.loading"))
        case .failed:
            // A read that failed is not a missing Program. Retrying is the way
            // out of one and useless for the other, so they are separate states.
            ErrorStateView(
                message: I18n.t("programs.error"),
                retryTitle: I18n.t("programs.retry")
            ) {
                Task { await reload() }
            }
        case .notFound:
            NotFoundView(
                title: I18n.t("program.notFound.heading"),
                message: I18n.t("program.notFound.body"),
                actionTitle: I18n.t("program.notFound.action"),
                action: { dismiss() }
            )
        case .ready:
            form(rows)
        }
    }

    private func form(_ rows: [ProgramBuilderRow]) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                DetailHeaderView(
                    eyebrow: I18n.t("program.eyebrow"),
                    title: title
                )

                editPanel
                builderSection(rows)
                addSection

                CatalogDangerSection(
                    heading: I18n.t("program.danger.heading"),
                    explanation: I18n.t("program.danger.body"),
                    actionTitle: I18n.t("program.danger.action"),
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
                label: I18n.t("program.field.title"),
                error: touched && titleIsMissing ? I18n.t("program.error.title") : nil
            ) {
                TextField("", text: $title)
                    .catalogInput()
                    .textInputAutocapitalization(.sentences)
            }

            CatalogField(label: I18n.t("program.field.description")) {
                TextField("", text: $descriptionText, axis: .vertical)
                    .lineLimit(4...10)
                    .catalogInput()
            }

            if let saveFailure {
                // A 409 gets the fetch, not a retry: the Program was rewritten
                // somewhere else, and pressing Spara again would overwrite an
                // edit this screen has never shown its reader.
                CatalogWriteErrorView(failure: saveFailure) {
                    Task { await reload() }
                }
            }

            Button(I18n.t("program.save")) { Task { await save() } }
                .font(Typography.button)
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
                .disabled(isSaving)
        }
    }

    @ViewBuilder
    private func builderSection(_ rows: [ProgramBuilderRow]) -> some View {
        CatalogSection(heading: I18n.t("program.exercises.heading")) {
            // The rule that makes every edit below safe — read where it is acted
            // on, not in a help page.
            CatalogBrassNote(I18n.t("program.snapshot"))

            if let reorderFailure {
                CatalogWriteErrorView(failure: reorderFailure) {
                    Task { await reload() }
                }
            }

            // Checked BEFORE the empty copy, because a sequence that could not
            // be read is not an empty program — and this read runs after every
            // mutation, so the false claim would land right after a successful
            // edit. With rows still up they stay, marked as possibly out of
            // date; with nothing to show, the failure is the state.
            if store.exercisesFailed {
                CatalogWriteErrorView(
                    failure: CatalogWriteFailure(
                        message: I18n.t(rows.isEmpty
                                        ? "program.exercises.error"
                                        : "program.exercises.stale"),
                        actionTitle: I18n.t("programs.retry")
                    ),
                    refresh: { Task { await reload() } }
                )
            }

            if rows.isEmpty {
                if !store.exercisesFailed {
                    Text(I18n.t("program.exercises.empty"))
                        .font(Typography.body)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, Spacing.sm)
                }
            } else {
                VStack(spacing: Spacing.sm) {
                    ForEach(rows) { row in
                        ProgramBuilderRowView(
                            row: row,
                            isBusy: isMutating,
                            isEditingNote: editingNoteId == row.id,
                            noteDraft: $noteDraft,
                            noteError: editingNoteId == row.id ? noteError : nil,
                            removeFailure: removeFailureId == row.id ? removeFailure : nil,
                            onMove: { delta in Task { await move(row, delta: delta) } },
                            onOpenNote: { openNote(row) },
                            onSaveNote: { Task { await saveNote(row) } },
                            onCancelNote: closeNote,
                            onRemove: { requestRemoval(row) }
                        )
                    }
                }
                .padding(.top, Spacing.sm)
            }
        }
    }

    /// Withheld while the sequence is unknown — failed AND nothing to show.
    /// Adding to a list the teacher cannot see is a write with no readable
    /// outcome, and the duplicate guard it depends on has nothing to check
    /// against. The failure above it says why, and carries the fetch.
    @ViewBuilder
    private var addSection: some View {
        if !(store.exercisesFailed && rows.isEmpty) {
            addPanel
        }
    }

    @ViewBuilder
    private var addPanel: some View {
        CatalogPanel {
            CatalogField(label: I18n.t("program.add.label")) {
                Picker(I18n.t("program.add.placeholder"), selection: $pickedId) {
                    Text(I18n.t("program.add.placeholder")).tag(String?.none)
                    ForEach(pickable) { exercise in
                        Text(exercise.name).tag(String?.some(exercise.id))
                    }
                }
                .pickerStyle(.menu)
                .tint(Palette.accent)
            }

            // Says WHY there is nothing to pick, rather than leaving an empty
            // menu to be interpreted.
            if let note = pickerNote {
                Text(note)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let addFailure {
                CatalogWriteErrorView(failure: addFailure) {
                    Task { await reload() }
                }
            }

            Button(I18n.t("program.add.submit")) { Task { await add() } }
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
                .disabled(pickedId == nil || isMutating)
        }
    }

    /// Failure first: an unanswered library is not an empty one, and must never
    /// be reported as "you have no exercises".
    private var pickerNote: String? {
        if store.libraryFailed { return I18n.t("program.add.error") }
        guard store.libraryLoaded else { return nil }
        if store.availableExercises.isEmpty { return I18n.t("program.add.none") }
        if pickable.isEmpty { return I18n.t("program.add.exhausted") }
        return nil
    }

    /// The four-branch selection the web makes: only archived and noted rows get
    /// here at all, and the archived+noted case is the one that has to name both
    /// losses.
    private func removalMessage(for row: ProgramBuilderRow) -> String {
        if row.archived {
            return row.notes?.isEmpty == false
                ? I18n.t("program.confirm.removeArchivedNoted.message", ["name": row.name])
                : I18n.t("program.confirm.remove.message", ["name": row.name])
        }
        return I18n.t("program.confirm.removeNoted.message", ["name": row.name])
    }

    // MARK: - Actions

    /// Re-reads the Program, its sequence and the picker's library, and re-seeds
    /// the fields. Also the conflict recovery: after a 409 every panel on this
    /// screen has to show what the server holds, not the draft that lost.
    private func reload() async {
        saveFailure = nil
        archiveFailure = nil
        addFailure = nil
        reorderFailure = nil
        removeFailure = nil
        removeFailureId = nil
        await store.loadProgram(id: programId)
        if let loaded = store.program {
            title = loaded.title
            descriptionText = loaded.description
        }
        // Drop a selection that stopped being offerable — it just got attached,
        // or the library changed underneath.
        if let picked = pickedId, !pickable.contains(where: { $0.id == picked }) {
            pickedId = nil
        }
    }

    private func save() async {
        touched = true
        guard !titleIsMissing else { return }
        isSaving = true
        saveFailure = nil
        defer { isSaving = false }

        let updated = await store.update(
            id: programId,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            description: descriptionText.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        guard updated != nil else {
            saveFailure = programFailure(store.writeError, "program.saveError")
            return
        }
        acknowledgement = I18n.t("program.saved")
    }

    /// Every write on this screen classifies its failure the same way: a 409 is
    /// a stale copy with a fetch as the way out, anything else is the authored
    /// sentence for that particular action.
    ///
    /// The error is passed IN rather than read off the store, because the
    /// builder writes hand theirs back with the call — see `ProgramBuilderWrite`
    /// for why a shared slot could not be trusted across their re-read.
    private func programFailure(
        _ error: ApiError?,
        _ failureKey: String
    ) -> CatalogWriteFailure? {
        LibraryCopy.writeFailure(
            error,
            conflict: "program.conflict.message",
            action: "program.conflict.action",
            failure: failureKey
        )
    }

    private func add() async {
        guard let exerciseId = pickedId else { return }

        // §3.6: "Reject duplicate Exercises with a row-level explanation." The
        // picker already withholds attached Exercises, so this only fires on a
        // stale list — but the server rejects the write outright, and an
        // unexplained failure at the field is worse than the same fact stated.
        if ProgramBuilder.isDuplicate(store.exercises, exerciseId: exerciseId) {
            let name = store.availableExercises.first { $0.id == exerciseId }?.name ?? ""
            // Caught locally, so there is no request and no conflict to recover
            // from — the sentence stands on its own.
            addFailure = CatalogWriteFailure(
                message: I18n.t("program.add.duplicate", ["name": name])
            )
            return
        }

        addFailure = nil
        isMutating = true
        defer { isMutating = false }

        switch await store.addExercise(programId: programId, exerciseId: exerciseId) {
        case .ok:
            pickedId = nil
        case .cancelled:
            // The screen is going away — the picker keeps its selection and
            // says nothing about a write nobody is waiting for.
            break
        case .failed(let error):
            addFailure = programFailure(error, "program.add.failed")
        }
    }

    private func move(_ row: ProgramBuilderRow, delta: Int) async {
        // `nil` means the move is unavailable. Issuing the write anyway would
        // reload the list and flicker the row for no change.
        guard let order = ProgramBuilder.move(store.exercises, exerciseId: row.id, delta: delta)
        else { return }
        reorderFailure = nil
        isMutating = true
        defer { isMutating = false }

        if case .failed(let error) = await store.reorder(
            programId: programId,
            exerciseIds: order
        ) {
            reorderFailure = programFailure(error, "program.reorderError")
        }
    }

    private func openNote(_ row: ProgramBuilderRow) {
        noteError = nil
        noteDraft = row.notes ?? ""
        editingNoteId = row.id
    }

    private func closeNote() {
        editingNoteId = nil
        noteDraft = ""
        noteError = nil
    }

    /// Commit the open note. An emptied field CLEARS the note rather than being
    /// rejected — "no note" is a legitimate destination, and the server stores
    /// null for blank so it has exactly one representation.
    private func saveNote(_ row: ProgramBuilderRow) async {
        let draft = noteDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        // Nothing to write, and a no-op request would still reload the sequence
        // — the same reason `move` refuses an unavailable move.
        guard draft != (row.notes ?? "") else {
            closeNote()
            return
        }
        noteError = nil
        editingNoteId = nil
        isMutating = true
        defer { isMutating = false }

        switch await store.updateNotes(
            programId: programId,
            exerciseId: row.id,
            notes: draft.isEmpty ? nil : draft
        ) {
        case .ok:
            closeNote()
            acknowledgement = I18n.t("program.row.note.saved")
        case .cancelled:
            // Nothing failed, so nothing is said — and the editor is not
            // reopened over a screen the reader has already left.
            break
        case .failed(let error):
            // Reopened with the text still in it: a failed save must not also
            // lose what was typed. The field takes a sentence and not a button,
            // so a 409 is stated here and recovered by the fetch the store has
            // already made — the row below now shows the note that won.
            guard let failure = programFailure(error, "program.row.note.failed")
            else { break }
            noteDraft = draft
            editingNoteId = row.id
            noteError = failure.message
        }
    }

    /// Consequence-stating dialog for the two lossy cases; straight through for
    /// a live note-free row, which really is one tap from restored.
    private func requestRemoval(_ row: ProgramBuilderRow) {
        if row.archived || row.notes?.isEmpty == false {
            pendingRemoval = row
            return
        }
        Task { await remove(row) }
    }

    /// A removal that fails must SAY so, at the row that stayed.
    ///
    /// Discarding the result made a failure indistinguishable from a success
    /// whose reload had not landed yet: no sentence, no acknowledgement, and the
    /// row reappearing on the next read as if the tap had never happened.
    private func remove(_ row: ProgramBuilderRow) async {
        pendingRemoval = nil
        if editingNoteId == row.id { closeNote() }
        removeFailure = nil
        removeFailureId = nil
        isMutating = true
        defer { isMutating = false }

        // The row leaving the sequence is the acknowledgement of a success — the
        // same reading `InboxViewModel` makes of a settled invitation.
        if case .failed(let error) = await store.removeExercise(
            programId: programId,
            exerciseId: row.id
        ) {
            removeFailure = programFailure(error, "program.row.remove.failed")
            removeFailureId = removeFailure == nil ? nil : row.id
        }
    }

    private func archive() async {
        archiveFailure = nil
        guard await store.archive(id: programId) else {
            archiveFailure = programFailure(store.writeError, "program.archiveError")
            return
        }
        // The Program is gone from the library, so this screen has nothing left
        // to show: back to the list, which is where the web navigates too.
        dismiss()
    }
}

/// One row of the ordered sequence: position, name, archived marking, the note
/// as text or as an open editor, and the controls.
private struct ProgramBuilderRowView: View {
    let row: ProgramBuilderRow
    /// Another builder write is still in flight. Its controls are disabled
    /// rather than withheld: the row must not move under the reader's finger
    /// while it is being looked at.
    let isBusy: Bool
    let isEditingNote: Bool
    @Binding var noteDraft: String
    let noteError: String?
    /// A removal that did not go through, said at the row that stayed.
    let removeFailure: CatalogWriteFailure?
    let onMove: (Int) -> Void
    let onOpenNote: () -> Void
    let onSaveNote: () -> Void
    let onCancelNote: () -> Void
    let onRemove: () -> Void

    /// The reorder buttons are square, and the square has to grow with the glyph
    /// inside it. A fixed 32×32 box around Dynamic Type text is a box that its
    /// own content outgrows at accessibility sizes, and the ↑ then collides with
    /// the ↓ beside it.
    @ScaledMetric private var orderSide: CGFloat = 32

    private var hasNote: Bool {
        row.notes?.isEmpty == false
    }

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            Text("\(row.position)")
                .font(Typography.caption.monospacedDigit())
                .foregroundStyle(Palette.textMuted)
                .frame(minWidth: 20, alignment: .trailing)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(row.name)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                    // An archived row is inert, and reads that way — the same
                    // dimming §4.3 gives a cancelled row. The controls keep full
                    // contrast.
                    .opacity(row.archived ? 0.72 : 1)

                if row.archived {
                    // §4.4: the pill's SHAPE carries the state, so the row stays
                    // readable with colour removed entirely. Dashed = withdrawn.
                    StatusChip(
                        label: I18n.t("program.row.archived"),
                        variant: .dashed,
                        tone: .warning
                    )
                    Text(I18n.t("program.row.archived.hint"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if isEditingNote {
                    noteEditor
                } else if let notes = row.notes, !notes.isEmpty {
                    Text(notes)
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                        .opacity(row.archived ? 0.72 : 1)
                }

                controls

                if let removeFailure {
                    CatalogWriteErrorView(failure: removeFailure)
                }
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.sm))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.sm).strokeBorder(Palette.border)
        }
    }

    private var noteEditor: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            CatalogField(
                label: I18n.t("program.row.note.label"),
                error: noteError
            ) {
                TextField("", text: $noteDraft, axis: .vertical)
                    .lineLimit(2...6)
                    .catalogInput()
            }
            HStack(spacing: Spacing.sm) {
                // Explicit save (§3.6 asks for an editable note, not a
                // live-binding one): nothing is written on blur or on keystroke.
                Button(I18n.t("program.row.note.save"), action: onSaveNote)
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
                    .disabled(isBusy)
                Button(I18n.t("program.row.note.cancel"), action: onCancelNote)
                    .font(Typography.button)
                    .buttonStyle(.plain)
                    .foregroundStyle(Palette.textMuted)
            }
        }
        .padding(.top, Spacing.xs)
    }

    private var controls: some View {
        HStack(spacing: Spacing.sm) {
            // Reorder is explicit (§3.6): two real buttons, each labelled with
            // the Exercise it moves, so the control is comprehensible out of
            // visual context. Withheld at the ends and on an archived row rather
            // than disabled — the server would take the write, but it would
            // change nothing anyone can act on.
            if !row.archived {
                if !row.isFirst {
                    orderButton("↑", I18n.t("program.row.up", ["name": row.name])) { onMove(-1) }
                }
                if !row.isLast {
                    orderButton("↓", I18n.t("program.row.down", ["name": row.name])) { onMove(1) }
                }
            }

            // §3.6 step 3: the row note is editable, not write-once. Offered on
            // an archived row too — its text is the only thing still worth
            // correcting there, and unlike reordering it is not a no-op.
            if !isEditingNote {
                Button(hasNote
                       ? I18n.t("program.row.note.edit")
                       : I18n.t("program.row.note.add"),
                       action: onOpenNote)
                    .font(Typography.caption)
                    .buttonStyle(.plain)
                    .foregroundStyle(Palette.accent)
                    .accessibilityLabel(hasNote
                        ? I18n.t("program.row.note.editNamed", ["name": row.name])
                        : I18n.t("program.row.note.addNamed", ["name": row.name]))
            }

            Spacer(minLength: 0)

            Button(I18n.t("program.row.remove"), role: .destructive, action: onRemove)
                .font(Typography.caption)
                .buttonStyle(.plain)
                .foregroundStyle(Palette.danger)
                .accessibilityLabel(I18n.t("program.row.removeNamed", ["name": row.name]))
        }
        .padding(.top, Spacing.xs)
        // Every control here issues a write that re-reads the sequence when it
        // lands. A second one fired over the first one's re-read would be aimed
        // at an order that is already being replaced.
        .disabled(isBusy)
    }

    private func orderButton(
        _ glyph: String,
        _ label: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(glyph)
                .font(Typography.body)
                // `min`, not a fixed size: the glyph may need more room than the
                // metric gives it, and a button that clips its own label is
                // worse than one that grows.
                .frame(minWidth: orderSide, minHeight: orderSide)
        }
        .buttonStyle(.bordered)
        .tint(Palette.accent)
        .accessibilityLabel(label)
    }
}
