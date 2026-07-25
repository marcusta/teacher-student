import SwiftUI

/// **Träningspass, detalj** — IA §3.10. One session, in the order a reader needs
/// it: what and when, what the rider wrote, where the content came from, what
/// they actually did, and the conversation about it.
///
/// **The whole page is one permission decision, made once.** `model.viewer`
/// compares the session's owner to the signed-in user, and every control below
/// asks `model.controls`. The rider owns the structure; a Teacher the session
/// was shared with reads it and answers. That is not a hierarchy — the same
/// person is on the other side of it one screen over.
///
/// **Withheld, not disabled.** A shared Teacher sees no Spara, no sharing
/// control, no attach, no remove, no delete. The server answers NotFound for
/// every one of those calls, so a greyed-out button would be a promise it
/// refuses to keep.
///
/// **Notes are the one thing both roles do**, at both levels: on the session and
/// on each Exercise occurrence.
struct TrainingSessionDetailView: View {
    let id: String

    @Environment(SessionStore.self) private var sessionStore
    @Environment(\.dismiss) private var dismiss

    @State private var model: TrainingSessionDetailModel
    @State private var expandedNotes: Set<String> = []
    @State private var pendingExerciseRemoval: TrainingSessionExerciseRef?
    @State private var confirmDelete = false
    @State private var exercisePick = ""
    @State private var programPick = ""

    init(id: String) {
        self.id = id
        _model = State(initialValue: TrainingSessionDetailModel(sessionId: id))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                content
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("objectKind.trainingSession"))
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.resolve(currentUserId: sessionStore.currentUser?.id) }
        .confirmationDialog(
            I18n.t("trainingSession.confirm.delete.title"),
            isPresented: $confirmDelete,
            titleVisibility: .visible
        ) {
            Button(I18n.t("trainingSession.action.delete"), role: .destructive) {
                Task { if await model.remove() { dismiss() } }
            }
            Button(I18n.t("trainingSession.confirm.dismiss"), role: .cancel) {}
        } message: {
            // States what is actually lost, including the part a rider would not
            // think of: their teachers' notes go with it.
            Text(I18n.t("trainingSession.confirm.delete.message"))
        }
        .confirmationDialog(
            I18n.t("trainingSession.confirm.removeExercise.title"),
            isPresented: Binding(
                get: { pendingExerciseRemoval != nil },
                set: { if !$0 { pendingExerciseRemoval = nil } }
            ),
            titleVisibility: .visible,
            presenting: pendingExerciseRemoval
        ) { exercise in
            Button(I18n.t("trainingSession.exercise.remove"), role: .destructive) {
                pendingExerciseRemoval = nil
                Task { await model.removeExercise(exercise.exerciseId) }
            }
            Button(I18n.t("trainingSession.confirm.dismiss"), role: .cancel) {
                pendingExerciseRemoval = nil
            }
        } message: { exercise in
            Text(I18n.t("trainingSession.confirm.removeExercise.message", ["name": exercise.name]))
        }
    }

    // MARK: - Page states (§4)

    @ViewBuilder
    private var content: some View {
        if !model.resolved {
            LoadingView(I18n.t("trainingSession.loading"))
                .frame(minHeight: 200)
        } else if model.notFound {
            // Deliberately not an error: a session that was deleted, or unshared
            // from this Teacher, is a legitimate answer and retrying will not
            // change it. The way out is navigation.
            NotFoundView(
                title: I18n.t("trainingSession.notFound.heading"),
                message: I18n.t("trainingSession.notFound.body"),
                actionTitle: I18n.t("trainingSession.notFound.action"),
                action: { dismiss() }
            )
        } else if model.showsPageError {
            // Nothing was ever on screen to keep, so the failure gets the whole
            // page. A read that fails over a session already rendered takes the
            // notice in `loaded` instead.
            ErrorStateView(
                message: I18n.t("trainingSessions.error"),
                retryTitle: I18n.t("trainingSessions.retry"),
                retry: { Task { await model.resolve(currentUserId: sessionStore.currentUser?.id) } }
            )
        } else if let session = model.session {
            loaded(session)
        }
    }

    @ViewBuilder
    private func loaded(_ session: TrainingSession) -> some View {
        header(session)
        parentChips(session)

        if let error = model.refreshFailure {
            // Above the content, never instead of it. The reader asked for the
            // current session — from this banner, from the write banner under
            // it, or by returning to the page — and did not get it. Every fact
            // below is still the last thing the server said, so it stays and is
            // caveated rather than replaced. Without this line, the refresh
            // offered on a failed write erased the banner the reader was
            // looking at and put nothing in its place.
            TrainingSessionErrorBanner(error: error, failure: .refresh) {
                Task { await model.resolve(currentUserId: sessionStore.currentUser?.id) }
            }
        }
        if let notice = model.notice {
            noticeBanner(notice)
        }
        if let error = model.actionError {
            TrainingSessionErrorBanner(error: error) {
                Task { await model.resolve(currentUserId: sessionStore.currentUser?.id) }
            }
        }

        if model.controls.editDetails {
            detailsSection
        } else {
            summarySection(session)
        }

        if model.controls.editSharing {
            sharingSection
        }

        programsSection(session)
        exercisesSection(session)
        sessionNotes(session)
    }

    // MARK: - Header (§4.10)

    private func header(_ session: TrainingSession) -> some View {
        DetailHeaderView(
            eyebrow: I18n.t("objectKind.trainingSession"),
            title: TrainingSessionCopy.sessionTitle(session),
            // Held back until the names resolve — §4.5 has no unnamed "Delad".
            recipients: model.audience,
            shared: model.audience == nil ? nil : !session.sharedWithTeacherIds.isEmpty,
            overflowActions: model.controls.remove
                ? [DetailHeaderAction(label: I18n.t("trainingSession.action.delete")) {
                    confirmDelete = true
                }]
                : [],
            meta: [
                TrainingSessionCopy.sessionWhen(iso: session.performedAt),
                TrainingSessionCopy.durationLabel(session.durationMin),
                session.horseName,
            ].compactMap { $0 }.joined(separator: " · ")
        )
    }

    /// The §4.10 parent chips — Plan and source Programs, as real paths upward.
    ///
    /// They sit under the header rather than inside it: `DetailHeaderChip` takes
    /// an action closure, and a `Route` push on this shell is a
    /// `NavigationLink(value:)` (the tab's stack owns the destination map, and
    /// no path binding reaches down here). A link is also the more honest
    /// control — it previews, it long-presses, it is a link.
    @ViewBuilder
    private func parentChips(_ session: TrainingSession) -> some View {
        let chips = parentChipData(session)
        if !chips.isEmpty {
            WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.sm) {
                ForEach(chips) { chip in
                    NavigationLink(value: chip.route) {
                        Text(chip.label)
                            .font(Typography.caption.weight(.semibold))
                            .lineLimit(1)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, Spacing.xs)
                            .foregroundStyle(Palette.accentStrong)
                            .overlay { Capsule().strokeBorder(Palette.border, lineWidth: 1) }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func parentChipData(_ session: TrainingSession) -> [ParentChip] {
        var chips: [ParentChip] = []
        if let planId = session.planId, let planTitle = session.planTitle {
            chips.append(ParentChip(
                label: TrainingSessionCopy.planChipLabel(planTitle),
                route: .plan(id: planId)
            ))
        }
        for program in session.programs {
            chips.append(ParentChip(
                label: TrainingSessionCopy.programChipLabel(program),
                route: .program(id: program.id)
            ))
        }
        return chips
    }

    /// A parent edge: the composed label plus where it goes.
    private struct ParentChip: Identifiable {
        let label: String
        let route: Route

        var id: String { label }
    }

    private func noticeBanner(_ notice: TrainingSessionNotice) -> some View {
        Group {
            if case .programDetached(let programId, _) = notice {
                // The undo re-attaches the source. It cannot un-copy anything,
                // because detaching never removed the copied Exercises — which
                // is exactly what the message says.
                TrainingSessionNoticeBanner(
                    message: notice.message,
                    actionTitle: I18n.t("trainingSession.toast.undo"),
                    action: { Task { await model.attachProgram(programId) } },
                    dismiss: { model.notice = nil }
                )
            } else {
                TrainingSessionNoticeBanner(message: notice.message, dismiss: { model.notice = nil })
            }
        }
    }

    // MARK: - Uppgifter (owner)

    private var detailsSection: some View {
        TrainingSessionSection(title: I18n.t("trainingSession.section.details")) {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                TrainingSessionField(label: I18n.t("trainingSession.field.when")) {
                    DatePicker(
                        I18n.t("trainingSession.field.when"),
                        selection: $model.whenValue,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .labelsHidden()
                    .datePickerStyle(.compact)
                }

                TrainingSessionField(label: I18n.t("trainingSession.field.duration")) {
                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        TextField("", text: $model.durationValue)
                            .keyboardType(.numberPad)
                            .textFieldStyle(.roundedBorder)
                            .font(Typography.body)
                        if let validation = model.detailsValidation {
                            Text(validation)
                                .font(Typography.caption)
                                .foregroundStyle(Palette.danger)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }

                if !model.loggableHorses.isEmpty {
                    TrainingSessionField(label: I18n.t("trainingSession.field.horse")) {
                        Picker(I18n.t("trainingSession.field.horse"), selection: $model.horseValue) {
                            Text(I18n.t("trainingSession.horse.none")).tag("")
                            ForEach(model.loggableHorses) { horse in
                                Text(horse.name).tag(horse.id)
                            }
                        }
                        .labelsHidden()
                        .pickerStyle(.menu)
                        .tint(Palette.accent)
                    }
                }

                if !model.loggablePlans.isEmpty {
                    TrainingSessionField(label: I18n.t("trainingSession.field.plan")) {
                        Picker(I18n.t("trainingSession.field.plan"), selection: $model.planValue) {
                            Text(I18n.t("trainingSession.plan.none")).tag("")
                            ForEach(model.loggablePlans) { plan in
                                Text(plan.title).tag(plan.id)
                            }
                        }
                        .labelsHidden()
                        .pickerStyle(.menu)
                        .tint(Palette.accent)
                    }
                }

                TrainingSessionField(label: I18n.t("trainingSession.field.summary")) {
                    TextEditor(text: $model.summaryValue)
                        .font(Typography.body)
                        .frame(minHeight: 140)
                        .scrollContentBackground(.hidden)
                        .padding(Spacing.sm)
                        .background(Palette.bg, in: RoundedRectangle(cornerRadius: Radius.md))
                        .overlay {
                            RoundedRectangle(cornerRadius: Radius.md)
                                .strokeBorder(Palette.border, lineWidth: 1)
                        }
                }

                Button(I18n.t("trainingSession.save")) { Task { await model.saveDetails() } }
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .disabled(model.isSaving)
            }
        }
    }

    // MARK: - Sammanfattning (shared teacher)

    private func summarySection(_ session: TrainingSession) -> some View {
        let summary = (session.summary ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return TrainingSessionSection(title: I18n.t("trainingSession.section.summary")) {
            // The rider's own words are why a Teacher opened this page, so they
            // come before the structure — and their absence is stated rather
            // than left as a blank.
            Text(summary.isEmpty ? I18n.t("trainingSession.summary.empty") : summary)
                .font(Typography.body)
                .foregroundStyle(summary.isEmpty ? Palette.textMuted : Palette.text)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Delning (owner)

    @ViewBuilder
    private var sharingSection: some View {
        TrainingSessionSection(title: I18n.t("trainingSession.section.sharing")) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                if model.teachersFailed {
                    // Without this the control falls through to "Du har ingen
                    // lärare att dela med än" — a statement about the rider's
                    // relations that a failed GET is in no position to make.
                    TrainingSessionCatalogRetry(
                        message: I18n.t("trainingSession.catalog.teachers.failed"),
                        retry: { Task { await model.loadTeachers() } }
                    )
                } else {
                    ShareTeacherControl(
                        teachers: model.teachers,
                        isSelected: { model.isSharing(with: $0) },
                        // Committed as it is toggled: a share is a trust
                        // decision, and a checkbox waiting behind an unpressed
                        // Spara would misstate who can already read the log.
                        toggle: { teacherId in Task { await model.toggleSharing(with: teacherId) } }
                    )
                    ForEach(model.unsharedProgramOwners) { owner in
                        ProgramOwnerOffer(teacher: owner) {
                            Task { await model.share(with: owner.id) }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Program

    private func programsSection(_ session: TrainingSession) -> some View {
        TrainingSessionSection(title: I18n.t("trainingSession.section.programs")) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                if session.programs.isEmpty {
                    Text(I18n.t("trainingSession.programs.empty"))
                        .font(Typography.body)
                        .foregroundStyle(Palette.textMuted)
                } else {
                    ForEach(session.programs) { program in
                        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
                            NavigationLink(value: Route.program(id: program.id)) {
                                Text(program.title)
                                    .font(Typography.body)
                                    .foregroundStyle(Palette.accentStrong)
                                    .multilineTextAlignment(.leading)
                            }
                            .buttonStyle(.plain)
                            Spacer(minLength: 0)
                            if model.controls.editPrograms {
                                Button(I18n.t("trainingSession.programs.detach")) {
                                    Task { await model.detachProgram(program) }
                                }
                                .font(Typography.caption.weight(.semibold))
                                .buttonStyle(.plain)
                                .foregroundStyle(Palette.danger)
                                .disabled(model.isSaving)
                            }
                        }
                    }
                }

                if model.controls.editPrograms {
                    // Says the consequence BEFORE the action, not after: the
                    // copied exercises stay, which is the one thing a rider
                    // would otherwise expect to lose.
                    Text(I18n.t("trainingSession.programs.detachHint"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)

                    if !model.programGroups.isEmpty {
                        HStack(spacing: Spacing.sm) {
                            CatalogPickerMenu(
                                groups: model.programGroups,
                                placeholder: I18n.t("trainingSession.programs.placeholder"),
                                selection: $programPick
                            )
                            Button(I18n.t("trainingSession.programs.attach")) {
                                let picked = programPick
                                programPick = ""
                                Task { await model.attachProgram(picked) }
                            }
                            .font(Typography.button)
                            .buttonStyle(.bordered)
                            .tint(Palette.accent)
                            .disabled(programPick.isEmpty || model.isSaving)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Övningar

    private func exercisesSection(_ session: TrainingSession) -> some View {
        TrainingSessionSection(title: I18n.t("trainingSession.section.exercises")) {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if model.orderedExercises.isEmpty {
                    Text(I18n.t("trainingSession.exercises.empty"))
                        .font(Typography.body)
                        .foregroundStyle(Palette.textMuted)
                } else {
                    ForEach(Array(model.orderedExercises.enumerated()), id: \.element.id) { index, exercise in
                        occurrenceRow(session: session, exercise: exercise, position: index + 1)
                    }
                }

                if model.controls.editExercises, !model.exerciseGroups.isEmpty {
                    HStack(spacing: Spacing.sm) {
                        CatalogPickerMenu(
                            groups: model.exerciseGroups,
                            placeholder: I18n.t("trainingSession.exercise.placeholder"),
                            selection: $exercisePick
                        )
                        Button(I18n.t("trainingSession.exercise.add")) {
                            let picked = exercisePick
                            exercisePick = ""
                            Task { await model.addExercise(picked) }
                        }
                        .font(Typography.button)
                        .buttonStyle(.bordered)
                        .tint(Palette.accent)
                        .disabled(exercisePick.isEmpty || model.isSaving)
                    }
                }
            }
        }
    }

    /// One Exercise occurrence: its place in the session, its name, where it was
    /// copied from, the instruction copied with it, and its own note thread.
    ///
    /// The occurrence deliberately does NOT link to the Exercise's history: that
    /// view is a Teacher's read of one Student's occurrences (IA §3.16), and it
    /// is reached from the student workspace, not from inside a session.
    private func occurrenceRow(
        session: TrainingSession,
        exercise: TrainingSessionExerciseRef,
        position: Int
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack(alignment: .firstTextBaseline, spacing: Spacing.sm) {
                Text("\(position).")
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .accessibilityHidden(true)
                Text(exercise.name)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                Spacer(minLength: 0)
                if model.controls.editExercises {
                    Button(I18n.t("trainingSession.exercise.remove")) {
                        pendingExerciseRemoval = exercise
                    }
                    .font(Typography.caption.weight(.semibold))
                    .buttonStyle(.plain)
                    .foregroundStyle(Palette.danger)
                    .disabled(model.isSaving)
                }
            }

            if let source = TrainingSessionCopy.exerciseSource(exercise, programs: session.programs) {
                Text(source)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }

            // The instruction copied from the Program at snapshot time. Not the
            // note thread — this text is the teacher's original wording, frozen.
            if let note = TrainingSessionCopy.rowNote(exercise) {
                Text(note)
                    .font(Typography.body)
                    .foregroundStyle(Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.leading, Spacing.md)
                    .overlay(alignment: .leading) {
                        Rectangle().fill(Palette.brassLine).frame(width: 2)
                    }
            }

            Button(expandedNotes.contains(exercise.id)
                   ? I18n.t("trainingSession.exercise.notesHide")
                   : I18n.t("trainingSession.exercise.notesShow")) {
                if expandedNotes.contains(exercise.id) {
                    expandedNotes.remove(exercise.id)
                } else {
                    expandedNotes.insert(exercise.id)
                }
            }
            .font(Typography.button)
            .buttonStyle(.bordered)
            .tint(Palette.accent)

            if expandedNotes.contains(exercise.id) {
                NoteThreadView(
                    parentKind: .trainingSessionExercise,
                    // The OCCURRENCE's id, never the Exercise's: a note belongs
                    // to this ride of this exercise, not to the library entry.
                    parentId: exercise.id,
                    context: "\(I18n.t("objectKind.exercise")) · \(exercise.name)",
                    recipients: model.noteRecipients,
                    roleOf: { model.role(of: $0) },
                    headingLevel: 4
                )
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Palette.bg, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
        }
    }

    // MARK: - Session notes

    private func sessionNotes(_ session: TrainingSession) -> some View {
        NoteThreadView(
            parentKind: .trainingSession,
            parentId: session.id,
            context: [
                I18n.t("objectKind.trainingSession"),
                TrainingSessionCopy.sessionWhen(iso: session.performedAt),
                session.horseName,
            ].compactMap { $0 }.joined(separator: " · "),
            recipients: model.noteRecipients,
            roleOf: { model.role(of: $0) }
        )
    }
}
