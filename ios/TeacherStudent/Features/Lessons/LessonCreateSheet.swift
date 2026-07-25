import SwiftUI

/// Boka lektion — IA §3.7 "Creation", in the dedicated panel IA §1 asks for
/// (the web puts the same form on its own route at `/lektioner/ny`).
///
/// The field order is the specification's, and it is a DEPENDENCY order rather
/// than a preference: the Horse comes from the chosen Student's stable and the
/// Plan from that Student's plans, so neither can be offered before step 1 is
/// answered. Both pickers stay empty and disabled until a Student is chosen, and
/// both reset when the Student changes — a horse belonging to the previous
/// student is not a valid answer to the new question.
///
/// Programs is the one multi-value field, and its hint is load-bearing rather
/// than decorative: attaching a Program **copies** its Exercises into this
/// Lesson. The Lesson does not follow the Program afterwards, and IA §3.7 asks
/// for that to be stated at the point of choosing — not discovered later, when
/// an edited Program fails to change a lesson taught last month.
///
/// There is no title or description field: IA §3.7 makes step 6 conditional on
/// the contract retaining one, and the `lessons` table has neither column.
/// Offering a title that cannot be stored would be worse than omitting it.
struct LessonCreateSheet: View {
    let store: LessonsStore
    /// The roster, already loaded by the list that opened this panel.
    let students: [Student]
    let onCreated: (LessonsStore.CreateOutcome) -> Void

    /// Spelled out because the synthesized memberwise initializer would be
    /// private — this view holds private `@State`, and that is what decides the
    /// memberwise init's access level.
    init(
        store: LessonsStore,
        students: [Student],
        onCreated: @escaping (LessonsStore.CreateOutcome) -> Void
    ) {
        self.store = store
        self.students = students
        self.onCreated = onCreated
    }

    @Environment(\.dismiss) private var dismiss

    @State private var studentId = ""
    @State private var when = LessonCreateSheet.defaultWhen()
    @State private var horseId = ""
    @State private var planId = ""
    @State private var programIds: Set<String> = []
    @State private var horses: [Horse] = []
    @State private var plans: [Plan] = []
    @State private var programs: [Program] = []
    /// Whether the Program CATALOG is in, as opposed to genuinely empty or still
    /// on its way. All three are the same empty array and say different things to
    /// a teacher who knows they have programs — "du har inga" is a claim, and
    /// claiming it before the read has answered is claiming something we do not
    /// know yet.
    @State private var programsLoad: LessonCatalogLoad = .pending
    @State private var validation: String?
    @State private var isSubmitting = false

    /// Steps 3 and 4 are unanswerable until step 1 is.
    private var needsStudent: Bool { studentId.isEmpty }

    /// The Programs to attach, in the order they are offered — the FIRST one
    /// travels in the create body and the rest are attached after, so a stable
    /// order is what makes the outcome predictable.
    private var selectedProgramIds: [String] {
        programs.map(\.id).filter { programIds.contains($0) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LessonPanel {
                    studentField
                    whenField
                    horseField
                    planField
                    programField
                    if let message = errorMessage {
                        Text(message)
                            .font(Typography.body)
                            .foregroundStyle(Palette.danger)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isStaticText)
                    }
                    actions
                }
                .padding(Spacing.lg)
            }
            .background(Palette.bg)
            .navigationTitle(I18n.t("lessonCreate.heading"))
            .navigationBarTitleDisplayMode(.inline)
        }
        // The swipe-down twin of the disabled Avbryt above. Both doors have to
        // be shut, not one: a swipe dismiss during the POST leaves the same
        // unannounced Lesson behind.
        .interactiveDismissDisabled(isSubmitting)
        .task { await loadPrograms() }
        // Steps 3 and 4 depend on step 1, so changing the Student invalidates
        // both answers. `task(id:)` also cancels the in-flight fetch for the
        // previous student, which is what keeps a slow response for a student
        // the reader moved on from out of the current pickers.
        .task(id: studentId) { await loadStudentMaterial() }
    }

    // MARK: - Fields

    private var studentField: some View {
        LessonField(label: I18n.t("lessonCreate.field.student")) {
            Picker(I18n.t("lessonCreate.field.student"), selection: $studentId) {
                Text(I18n.t("lessonCreate.field.student.placeholder")).tag("")
                ForEach(students) { student in
                    Text(student.displayName).tag(student.id)
                }
            }
            .pickerStyle(.menu)
            .tint(Palette.accentStrong)
            .labelsHidden()
        }
    }

    private var whenField: some View {
        LessonField(label: I18n.t("lessonCreate.field.when")) {
            DatePicker(
                I18n.t("lessonCreate.field.when"),
                selection: $when,
                in: LessonCreateSheet.bookableWindow,
                displayedComponents: [.date, .hourAndMinute]
            )
            .labelsHidden()
            .environment(\.locale, I18n.locale)
        }
    }

    private var horseField: some View {
        LessonField(
            label: I18n.t("lessonCreate.field.horse"),
            hint: I18n.t("lessonCreate.field.horse.hint")
        ) {
            Picker(I18n.t("lessonCreate.field.horse"), selection: $horseId) {
                Text(I18n.t("lesson.horse.none")).tag("")
                ForEach(LessonCopy.bookableHorses(horses)) { horse in
                    Text(horse.name).tag(horse.id)
                }
            }
            .pickerStyle(.menu)
            .tint(Palette.accentStrong)
            .labelsHidden()
            .disabled(needsStudent)
        }
    }

    private var planField: some View {
        LessonField(
            label: I18n.t("lessonCreate.field.plan"),
            hint: I18n.t("lessonCreate.field.plan.hint")
        ) {
            Picker(I18n.t("lessonCreate.field.plan"), selection: $planId) {
                Text(I18n.t("lesson.plan.none")).tag("")
                ForEach(LessonCopy.bookablePlans(plans)) { plan in
                    Text(plan.title).tag(plan.id)
                }
            }
            .pickerStyle(.menu)
            .tint(Palette.accentStrong)
            .labelsHidden()
            .disabled(needsStudent)
        }
    }

    /// The multi-value field. Drawn as a checked list rather than a menu: the
    /// copy semantics in the hint apply to EVERY row picked here, and a closed
    /// menu would state them once and then hide what they applied to.
    private var programField: some View {
        LessonField(
            label: I18n.t("lessonCreate.field.programs"),
            hint: I18n.t("lessonCreate.field.programs.hint")
        ) {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                if programsLoad == .failed {
                    LessonLoadFailureRow(message: I18n.t("lesson.programs.loadError")) {
                        Task { await loadPrograms() }
                    }
                } else if programsLoad == .pending {
                    // The list has not answered yet, so neither has this field.
                    // Saying "du har inga program" here would be a statement of
                    // fact made before the fact is known — and the reader who
                    // believes it books the Lesson without the Program they meant
                    // to attach.
                    LessonCatalogLoadingRow(message: I18n.t("programs.loading"))
                } else if programs.isEmpty {
                    // NOT `lesson.programs.empty` — that sentence ("Inga program
                    // kopplade") is authored for the detail view's list of
                    // ATTACHED Programs. Here nothing has been attached yet;
                    // what is empty is the teacher's own catalog, which is a
                    // different fact and a different exit.
                    Text(I18n.t("lessonCreate.programs.empty"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                } else {
                    ForEach(programs) { program in
                        Button {
                            if programIds.contains(program.id) {
                                programIds.remove(program.id)
                            } else {
                                programIds.insert(program.id)
                            }
                        } label: {
                            HStack(spacing: Spacing.sm) {
                                Image(systemName: programIds.contains(program.id)
                                    ? "checkmark.square.fill"
                                    : "square")
                                    .foregroundStyle(programIds.contains(program.id)
                                        ? Palette.accentStrong
                                        : Palette.textMuted)
                                Text(program.title)
                                    .font(Typography.body)
                                    .foregroundStyle(Palette.text)
                                    .multilineTextAlignment(.leading)
                                Spacer(minLength: 0)
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(programIds.contains(program.id) ? [.isSelected] : [])
                    }
                    if !programIds.isEmpty {
                        Text(I18n.plural("lessonCreate.programsCount", programIds.count))
                            .font(Typography.caption)
                            .foregroundStyle(Palette.textMuted)
                    }
                }
            }
        }
    }

    private var actions: some View {
        VStack(spacing: Spacing.sm) {
            // §4.8: one primary per form. This is it.
            Button(I18n.t("lessonCreate.submit")) { Task { await submit() } }
                .font(Typography.button)
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
                .disabled(isSubmitting || store.isLoading)
                .frame(maxWidth: .infinity)
            // Cancel is the ghost tier — never a second bordered button.
            //
            // Disabled mid-submit, and NOT for tidiness: the POST cannot be
            // recalled, so a cancel that lands while it is in flight closes the
            // panel on a Lesson that is about to exist and that nobody will be
            // told about. The window is short; the outcome is a booking the
            // reader does not know they made.
            Button(I18n.t("lessonCreate.cancel")) { dismiss() }
                .font(Typography.button)
                .buttonStyle(.plain)
                .foregroundStyle(Palette.textMuted)
                .disabled(isSubmitting)
                .frame(maxWidth: .infinity)
        }
    }

    private var errorMessage: String? {
        // Field validation first: it names the field and what to do about it,
        // which a transport failure cannot (IA §4).
        if let validation { return validation }
        return store.error == nil ? nil : I18n.t("lessons.error")
    }

    // MARK: - Behaviour

    private func loadPrograms() async {
        // The retry re-enters the loading state so the press has a visible
        // effect; the first load is already there.
        if programsLoad == .failed { programsLoad = .pending }
        do {
            programs = try await Api.shared.programs.list()
            programsLoad = .loaded
        } catch is CancellationError {
            // The sheet closed under the request. Nothing to report to a form
            // that no longer exists — and no answer either, so the field is left
            // saying it is still asking rather than that there is nothing.
        } catch {
            programs = []
            programsLoad = .failed
        }
    }

    private func loadStudentMaterial() async {
        horseId = ""
        planId = ""
        let chosen = studentId
        guard !chosen.isEmpty else {
            horses = []
            plans = []
            return
        }
        async let stable = Api.shared.students.listHorses(id: chosen)
        async let studentPlans = Api.shared.students.listPlans(id: chosen)
        let loadedHorses = (try? await stable) ?? []
        let loadedPlans = (try? await studentPlans) ?? []
        // A slower response for a student the reader has moved on from must not
        // overwrite the current one.
        guard studentId == chosen else { return }
        horses = loadedHorses
        plans = loadedPlans
    }

    /// Field validation runs before the request, names the field it is about and
    /// says what to do (IA §4) — which is what a transport failure cannot do, and
    /// why this comes first in `errorMessage` too.
    private func submit() async {
        guard !studentId.isEmpty else {
            validation = I18n.t("lessonCreate.error.student")
            return
        }
        // The picker is already bounded, so this can only fire on a value that
        // arrived some other way — a restored sheet, a future edit that drops the
        // range. Cheap, and the alternative is a `scheduledAt` the server stores
        // and nobody notices until a lesson turns up in 2087.
        guard LessonCreateSheet.bookableWindow.contains(when) else {
            validation = I18n.t("lessonCreate.error.when")
            return
        }
        validation = nil
        isSubmitting = true
        let outcome = await store.create(
            studentId: studentId,
            scheduledAt: LessonCopy.isoTimestamp(when),
            planId: planId.isEmpty ? nil : planId,
            horseId: horseId.isEmpty ? nil : horseId,
            programIds: selectedProgramIds
        )
        isSubmitting = false
        // The Lesson exists either way. When a follow-up attach or PATCH failed
        // it is booked but missing a Program or the Horse, and saying so is what
        // makes it recoverable — both are fixable from the detail view.
        guard let outcome else { return }
        onCreated(outcome)
        dismiss()
    }

    /// The dates the picker will accept, and the range `submit` re-checks.
    ///
    /// The web validates that its `datetime-local` field is FILLED IN
    /// (`lessonCreate.error.when`); a SwiftUI `DatePicker` always holds a value,
    /// so that check has nothing to test here. What can still go wrong is the
    /// value itself — the wheels scroll freely, and a slip lands the booking a
    /// century out with nothing on the form to say so.
    ///
    /// Wide in BOTH directions on purpose. Recording a lesson taught last month
    /// is legitimate and the server accepts it, so this rejects nonsense, not
    /// the past. Frozen at first use, which is the life of one sheet.
    private static let bookableWindow: ClosedRange<Date> = {
        let calendar = Calendar(identifier: .gregorian)
        let now = Date()
        let from = calendar.date(byAdding: .year, value: -5, to: now) ?? now
        let to = calendar.date(byAdding: .year, value: 5, to: now) ?? now
        return from...to
    }()

    /// The next full hour.
    ///
    /// The web's `datetime-local` input starts EMPTY and validates with
    /// `lessonCreate.error.when`; a SwiftUI `DatePicker` always holds a value, so
    /// there is no unanswered state for that message to describe. A default that
    /// is obviously a placeholder for "soon" beats a blank the platform cannot
    /// express — and the Student picker keeps a genuine unanswered state, so
    /// field-level validation is still on this form.
    private static func defaultWhen() -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        let now = Date()
        var parts = calendar.dateComponents([.year, .month, .day, .hour], from: now)
        parts.minute = 0
        let hourStart = calendar.date(from: parts) ?? now
        return calendar.date(byAdding: .hour, value: 1, to: hourStart) ?? now
    }
}
