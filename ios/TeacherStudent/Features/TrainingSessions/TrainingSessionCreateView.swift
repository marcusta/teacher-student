import SwiftUI

/// **Logga pass** — the creation sequence of IA §3.9, in that order:
/// when → how long → which horse → what happened → which plan → from which
/// program → who may read it.
///
/// **Only the timestamp is required.** Everything else is optional, and every
/// optional field that has nothing to offer is ABSENT rather than empty: a rider
/// with no horses sees no horse field, one with no teachers sees no sharing
/// control. An empty picker teaches nothing and reads as something broken.
///
/// **Absent means "there is none", so it is only said once we know.** A catalog
/// that did not answer keeps its field, with what failed and a retry. Silence
/// would put a false sentence on the screen — worst of all in the sharing block,
/// where it would read as "you have nobody to share with" and let a failed GET
/// decide who gets to see the session.
///
/// **Sharing is last, and defaults to private.** It is the only decision here
/// that reaches another person, so it is made deliberately, after the session is
/// described — never as an unnoticed default.
///
/// **One request.** The Program's exercises are copied and the share rows are
/// written in the same transaction as the session, so a lost connection cannot
/// leave a half-built session behind.
struct TrainingSessionCreateView: View {
    /// Handed the created session so the list can fold it in without a refetch.
    let onLogged: (TrainingSession) -> Void

    @State private var model = TrainingSessionCreateModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    whenField
                    durationField
                    horseField
                    summaryField
                    planField
                    programField
                    sharingField

                    if let error = model.error {
                        TrainingSessionErrorBanner(error: error, refresh: { submit() })
                    }
                }
                .padding(Spacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Palette.bg)
            .navigationTitle(I18n.t("trainingSessionCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("trainingSessionCreate.cancel")) { dismiss() }
                        .font(Typography.button)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("trainingSessionCreate.submit")) { submit() }
                        .font(Typography.button)
                        // Held while the audience question is still in flight —
                        // the sharing block above says why, and it is a moment.
                        // A press that landed first would log the session with
                        // an empty audience the rider was never offered.
                        .disabled(model.isSaving || !model.sharingAnswered)
                }
            }
            .task { await model.loadCatalogs() }
        }
    }

    // MARK: - Fields

    private var whenField: some View {
        TrainingSessionField(label: I18n.t("trainingSessionCreate.field.when")) {
            DatePicker(
                I18n.t("trainingSessionCreate.field.when"),
                selection: $model.performedAt,
                displayedComponents: [.date, .hourAndMinute]
            )
            .labelsHidden()
            .datePickerStyle(.compact)
        }
    }

    private var durationField: some View {
        TrainingSessionField(
            label: I18n.t("trainingSessionCreate.field.duration"),
            hint: I18n.t("trainingSessionCreate.field.duration.hint")
        ) {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                TextField("", text: $model.duration)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)
                    .font(Typography.body)
                if let validation = model.validationMessage {
                    Text(validation)
                        .font(Typography.caption)
                        .foregroundStyle(Palette.danger)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    @ViewBuilder
    private var horseField: some View {
        if model.horsesStatus == .failed {
            // Absent means "you have no horses". A stable that did not answer
            // has not said that, so the field stays and says what happened.
            TrainingSessionField(label: I18n.t("trainingSessionCreate.field.horse")) {
                TrainingSessionCatalogRetry(
                    message: I18n.t("trainingSession.catalog.horses.failed"),
                    retry: { Task { await model.loadHorses() } }
                )
            }
        } else if !model.loggableHorses.isEmpty {
            TrainingSessionField(
                label: I18n.t("trainingSessionCreate.field.horse"),
                hint: I18n.t("trainingSessionCreate.field.horse.hint")
            ) {
                Picker(I18n.t("trainingSessionCreate.field.horse"), selection: $model.horseId) {
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
    }

    private var summaryField: some View {
        TrainingSessionField(
            label: I18n.t("trainingSessionCreate.field.summary"),
            hint: I18n.t("trainingSessionCreate.field.summary.hint")
        ) {
            TextEditor(text: $model.summary)
                .font(Typography.body)
                .frame(minHeight: 120)
                .scrollContentBackground(.hidden)
                .padding(Spacing.sm)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.md)
                        .strokeBorder(Palette.border, lineWidth: 1)
                }
        }
    }

    @ViewBuilder
    private var planField: some View {
        if model.plansStatus == .failed {
            TrainingSessionField(label: I18n.t("trainingSessionCreate.field.plan")) {
                TrainingSessionCatalogRetry(
                    message: I18n.t("trainingSession.catalog.plans.failed"),
                    retry: { Task { await model.loadPlans() } }
                )
            }
        } else if !model.loggablePlans.isEmpty {
            TrainingSessionField(
                label: I18n.t("trainingSessionCreate.field.plan"),
                hint: I18n.t("trainingSessionCreate.field.plan.hint")
            ) {
                Picker(I18n.t("trainingSessionCreate.field.plan"), selection: $model.planId) {
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
    }

    @ViewBuilder
    private var programField: some View {
        if model.programsStatus == .failed {
            TrainingSessionField(label: I18n.t("trainingSessionCreate.field.program")) {
                TrainingSessionCatalogRetry(
                    message: I18n.t("trainingSession.catalog.programs.failed"),
                    retry: { Task { await model.loadPrograms() } }
                )
            }
        } else if !model.programGroups.isEmpty {
            TrainingSessionField(
                label: I18n.t("trainingSessionCreate.field.program"),
                // The copy states the one thing a rider could otherwise get
                // wrong: the session takes a COPY. It does not follow the
                // program, and a later edit to the program never rewrites
                // history here.
                hint: I18n.t("trainingSessionCreate.field.program.hint")
            ) {
                CatalogPickerMenu(
                    groups: model.programGroups,
                    placeholder: I18n.t("trainingSession.programs.placeholder"),
                    selection: $model.programId
                )
            }
        }
    }

    @ViewBuilder
    private var sharingField: some View {
        if model.teachersStatus == .failed {
            // The one absence that must never be silent. Dropping the whole
            // block here would tell a rider who HAS teachers that they have
            // none, and they would log the session privately on the strength of
            // it — a disclosure decision made for them by a failed GET.
            TrainingSessionField(label: I18n.t("trainingSession.section.sharing")) {
                TrainingSessionCatalogRetry(
                    message: I18n.t("trainingSession.catalog.teachers.failed"),
                    retry: { Task { await model.loadTeachers() } }
                )
            }
        } else if model.teachersStatus == .loading {
            // The other fields may render nothing while their catalog is in
            // flight, because their absence costs the rider a field and nothing
            // more. This one's absence is a SENTENCE — "you have nobody to
            // share with" — so the block stays put and says it is still asking.
            // Logga pass waits on the same fact (`sharingAnswered`).
            TrainingSessionField(label: I18n.t("trainingSession.section.sharing")) {
                Text(I18n.t("trainingSession.catalog.teachers.loading"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        } else if !model.teachers.isEmpty {
            // Absent, not empty: with no teacher there is nobody to share with,
            // and a disabled control would only pose a question that has no
            // answers. Reachable only once the list has ANSWERED.
            TrainingSessionField(label: I18n.t("trainingSession.section.sharing")) {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    ShareTeacherControl(
                        teachers: model.teachers,
                        isSelected: { model.isSharing(with: $0) },
                        toggle: { model.toggleSharing(with: $0) }
                    )
                    if let owner = model.pendingProgramOwner {
                        ProgramOwnerOffer(teacher: owner) {
                            model.toggleSharing(with: owner.id)
                        }
                    }
                }
            }
        }
    }

    private func submit() {
        Task {
            guard let created = await model.submit() else { return }
            onLogged(created)
            dismiss()
        }
    }
}
