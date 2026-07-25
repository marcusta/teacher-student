import SwiftUI

/// Ny plan (IA §3.11) — the port of `web/plans/plan-create.component.ts`.
///
/// Presented as a sheet rather than a pushed screen: creating a Plan is a
/// detour from reading the list, and a sheet is the phone's way of saying the
/// detour is cancellable. One `POST /plans` carries every field, so a Plan is
/// never half-made.
struct PlanCreateView: View {
    /// The list's model, so a created Plan lands in the list behind the sheet
    /// instead of waiting for the next read.
    let model: PlansModel
    let onCreated: (Plan) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var options = PlanTeacherOptions()
    @State private var titleField = ""
    @State private var descriptionField = ""
    @State private var startISO = ""
    @State private var endISO = ""
    @State private var primaryTeacherId = ""
    /// The title error appears only after a submit attempt — flagging an empty
    /// field the moment the form opens tells the reader they did something wrong
    /// before they have done anything at all.
    @State private var didAttemptSubmit = false
    @State private var isSubmitting = false
    /// THIS form's failed submit, held here rather than read off the shared list
    /// model. The model outlives every sheet opened over it, so a failure left
    /// standing there greets the next "Ny plan" with the previous attempt's
    /// conflict on an empty form. The three other create sheets in this app hold
    /// their failure locally for the same reason.
    @State private var createFailure: ApiError?

    private var trimmedTitle: String {
        titleField.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isRangeValid: Bool {
        PlanCopy.isValidRange(startDate: optional(startISO), endDate: optional(endISO))
    }

    private var showTitleError: Bool { didAttemptSubmit && trimmedTitle.isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                titleSection
                descriptionSection
                datesSection
                teacherSection
                // The CREATE's own failure, never the list's — a Plan list that
                // could not be refreshed is not a reason to tell someone their
                // new Plan was rejected. A 409 gets its own sentence: the list
                // behind this sheet had moved on and has already been re-read,
                // so the way forward is to look rather than to retry blind.
                if let failure = createFailure {
                    SwiftUI.Section {
                        PlanningNotice(
                            text: PlanCopy.isConflict(failure)
                                ? I18n.t("plans.conflict.create")
                                : I18n.t("plan.saveError"),
                            tone: PlanCopy.isConflict(failure) ? .info : .danger
                        )
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                    }
                }
            }
            .navigationTitle(I18n.t("planCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("planCreate.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("planCreate.submit")) { submit() }
                        .disabled(isSubmitting || !isRangeValid)
                }
            }
            .task { await options.load() }
        }
    }

    // MARK: - Sections

    private var titleSection: some View {
        SwiftUI.Section {
            TextField(I18n.t("planCreate.field.title"), text: $titleField)
                .textInputAutocapitalization(.sentences)
            if showTitleError {
                Text(I18n.t("plan.error.title"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
            }
        } header: {
            Text(I18n.t("planCreate.field.title"))
        }
    }

    private var descriptionSection: some View {
        SwiftUI.Section {
            TextField(
                I18n.t("planCreate.field.description"),
                text: $descriptionField,
                axis: .vertical
            )
            .lineLimit(3...8)
        } header: {
            Text(I18n.t("planCreate.field.description"))
        } footer: {
            Text(I18n.t("planCreate.field.description.hint"))
        }
    }

    /// Both ends are optional and each is a toggle plus a day picker: a Plan may
    /// run from a date with no end, or toward a date with no start.
    private var datesSection: some View {
        SwiftUI.Section {
            DateField(label: I18n.t("planCreate.field.start"), iso: $startISO)
            // The end field seeds from the START, not from today: a plan that
            // begins next month would otherwise open its end date on a day that
            // is already before its own start, and the range error below would
            // fire on a value the reader never chose.
            DateField(label: I18n.t("planCreate.field.end"), iso: $endISO, initialISO: startISO)
            // The range fault belongs to the END field, which is the one that is
            // wrong — a form-level error would make the reader hunt for it.
            if !isRangeValid {
                Text(I18n.t("plan.error.range", ["start": startLabel()]))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
            }
        } footer: {
            if let preview = PlanCopy.dateRangeLabel(startDate: optional(startISO), endDate: optional(endISO)),
               isRangeValid {
                Text(preview)
            }
        }
    }

    /// Hidden entirely when there is nobody to pick — an empty picker asks a
    /// question the reader cannot answer. The hint states in words that this is
    /// a label, not a permission.
    @ViewBuilder
    private var teacherSection: some View {
        if !options.teachers.isEmpty {
            SwiftUI.Section {
                Picker(I18n.t("planCreate.field.primaryTeacher"), selection: $primaryTeacherId) {
                    Text(I18n.t("plan.primaryTeacher.none")).tag("")
                    ForEach(options.teachers) { teacher in
                        Text(teacher.displayName).tag(teacher.id)
                    }
                }
            } header: {
                Text(I18n.t("planCreate.field.primaryTeacher"))
            } footer: {
                Text(I18n.t("plan.primaryTeacher.hint"))
            }
        }
    }

    // MARK: - Behaviour

    private func startLabel() -> String {
        guard let start = GoalCopy.calendarDate(optional(startISO)) else { return "" }
        return I18n.formatDate(start, .fullDate)
    }

    private func optional(_ value: String) -> String? {
        value.isEmpty ? nil : value
    }

    private func submit() {
        didAttemptSubmit = true
        guard !trimmedTitle.isEmpty, isRangeValid, !isSubmitting else { return }
        isSubmitting = true
        createFailure = nil
        Task {
            let created = await model.create(
                title: trimmedTitle,
                description: optional(descriptionField.trimmingCharacters(in: .whitespacesAndNewlines)),
                startDate: optional(startISO),
                endDate: optional(endISO),
                primaryTeacherId: optional(primaryTeacherId)
            )
            isSubmitting = false
            guard let created else {
                // The sheet stays open with everything typed still in it, and
                // takes a copy of why the POST failed. The copy is what makes the
                // message this form's own: the model's `createError` outlives the
                // sheet, this does not.
                createFailure = model.createError
                return
            }
            dismiss()
            onCreated(created)
        }
    }
}
