import SwiftUI

/// Nytt mål (IA §3.13) — the port of `web/goals/goal-create.component.ts`.
///
/// A Goal starts private: no sharing control appears here at all. Choosing an
/// audience is a decision about a thing that already exists, and mixing it into
/// creation would make "who sees this" a side effect of writing it down.
struct GoalCreateView: View {
    /// The list's model, so the created Goal is in the list behind the sheet.
    let model: GoalsModel
    let onCreated: (Goal) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var options = GoalHorseOptions()
    @State private var titleField = ""
    @State private var descriptionField = ""
    @State private var targetISO = ""
    @State private var horseId = ""
    @State private var didAttemptSubmit = false
    @State private var isSubmitting = false

    private var trimmedTitle: String {
        titleField.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isTargetValid: Bool {
        targetISO.isEmpty || GoalCopy.calendarDate(targetISO) != nil
    }

    var body: some View {
        NavigationStack {
            Form {
                titleSection
                descriptionSection
                targetSection
                horseSection
                if model.error != nil {
                    SwiftUI.Section {
                        PlanningNotice(text: I18n.t("goal.saveError"), tone: .danger)
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                    }
                }
            }
            .navigationTitle(I18n.t("goalCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("goalCreate.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("goalCreate.submit")) { submit() }
                        .disabled(isSubmitting || !isTargetValid)
                }
            }
            .task { await options.load() }
        }
    }

    private var titleSection: some View {
        SwiftUI.Section {
            TextField(I18n.t("goalCreate.field.title"), text: $titleField)
                .textInputAutocapitalization(.sentences)
            if didAttemptSubmit && trimmedTitle.isEmpty {
                Text(I18n.t("goal.error.title"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
            }
        } header: {
            Text(I18n.t("goalCreate.field.title"))
        } footer: {
            // The hint asks the question the title should answer, rather than
            // describing the field back to the reader.
            Text(I18n.t("goalCreate.field.title.hint"))
        }
    }

    private var descriptionSection: some View {
        SwiftUI.Section {
            TextField(
                I18n.t("goalCreate.field.description"),
                text: $descriptionField,
                axis: .vertical
            )
            .lineLimit(3...8)
        } header: {
            Text(I18n.t("goalCreate.field.description"))
        } footer: {
            Text(I18n.t("goalCreate.field.description.hint"))
        }
    }

    /// The target date is optional — an open-ended Goal is legitimate — and its
    /// hint is REPLACED by the formatted date once one is picked, so the reader
    /// reads back what they chose instead of re-reading the invitation.
    private var targetSection: some View {
        SwiftUI.Section {
            DateField(label: I18n.t("goalCreate.field.target"), iso: $targetISO)
            if !isTargetValid {
                Text(I18n.t("goal.error.target"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
            }
        } footer: {
            Text(GoalCopy.targetDateLabel(targetISO) ?? I18n.t("goalCreate.field.target.hint"))
        }
    }

    /// Hidden when the stable is empty: a picker with nothing in it asks a
    /// question the rider cannot answer yet.
    @ViewBuilder
    private var horseSection: some View {
        if !options.selectable.isEmpty {
            SwiftUI.Section {
                Picker(I18n.t("goalCreate.field.horse"), selection: $horseId) {
                    Text(I18n.t("goal.horse.none")).tag("")
                    ForEach(options.selectable) { horse in
                        Text(horse.name).tag(horse.id)
                    }
                }
            } header: {
                Text(I18n.t("goalCreate.field.horse"))
            } footer: {
                Text(I18n.t("goalCreate.field.horse.hint"))
            }
        }
    }

    private func optional(_ value: String) -> String? {
        value.isEmpty ? nil : value
    }

    private func submit() {
        didAttemptSubmit = true
        guard !trimmedTitle.isEmpty, isTargetValid, !isSubmitting else { return }
        isSubmitting = true
        Task {
            let created = await model.create(
                title: trimmedTitle,
                description: optional(descriptionField.trimmingCharacters(in: .whitespacesAndNewlines)),
                targetDate: optional(targetISO),
                horseId: optional(horseId)
            )
            isSubmitting = false
            guard let created else { return }
            dismiss()
            onCreated(created)
        }
    }
}
