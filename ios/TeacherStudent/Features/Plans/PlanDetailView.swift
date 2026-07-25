import SwiftUI

/// One Plan (IA §3.12) — the port of `web/plans/plan-detail.component.ts`.
///
/// The screen answers, in this order: what this Plan is, what it is aiming at
/// (Mål), and what has happened under it (Lektioner, Träningspass). The
/// archived notice comes LAST because it explains a limit on what you have just
/// read — stated up top it would read as "stop reading".
///
/// Entry point for the shell: `PlanDetailView(planId:)`. The optional `flash`
/// carries a confirmation across the push from the create sheet, since the
/// confirmation belongs on the object it is about.
struct PlanDetailView: View {
    let planId: String
    var flash: String?

    init(planId: String, flash: String? = nil) {
        self.planId = planId
        self.flash = flash
    }

    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var model = PlanDetailModel()
    @State private var notice: String?
    @State private var noticeTone: PlanningNotice.Tone = .success

    @State private var titleField = ""
    @State private var descriptionField = ""
    @State private var startISO = ""
    @State private var endISO = ""
    @State private var primaryTeacherId = ""
    @State private var didAttemptSave = false
    @State private var didSeedForm = false

    @State private var attachSelection = ""
    @State private var isConfirmingArchive = false

    private var controls: PlanCopy.Controls { model.controls }

    private var isRangeValid: Bool {
        PlanCopy.isValidRange(startDate: optional(startISO), endDate: optional(endISO))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                content
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.lg)
        }
        .background(Palette.bg)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            model.currentUserId = session.currentUser?.id
            if notice == nil { notice = flash }
            if model.detail == nil { await model.load(id: planId) }
            seedForm()
        }
        .alert(I18n.t("plan.confirm.archive.title"), isPresented: $isConfirmingArchive) {
            Button(I18n.t("plan.confirm.dismiss"), role: .cancel) {}
            Button(I18n.t("plan.action.archive"), role: .destructive) { archive() }
        } message: {
            // States the specific consequence — readable, keeps its links, takes
            // nothing new — rather than a generic "are you sure".
            Text(I18n.t("plan.confirm.archive.message"))
        }
    }

    // MARK: - States

    @ViewBuilder
    private var content: some View {
        if !model.isResolved {
            LoadingView(I18n.t("plan.loading"))
        } else if let detail = model.detail {
            loaded(detail)
        } else if PlanCopy.isNotFound(model.error) {
            // Not found and not-yours are the same answer on purpose: telling a
            // reader that a Plan exists but is not theirs is itself a leak.
            NotFoundView(
                title: I18n.t("plan.notFound.heading"),
                message: I18n.t("plan.notFound.body"),
                actionTitle: I18n.t("plan.notFound.action"),
                action: { dismiss() }
            )
        } else {
            ErrorStateView(
                message: I18n.t("plans.error"),
                retryTitle: I18n.t("plans.retry")
            ) {
                Task { await model.load(id: planId) }
            }
        }
    }

    @ViewBuilder
    private func loaded(_ detail: PlanDetail) -> some View {
        header(detail)
        if let notice {
            PlanningNotice(text: notice, tone: noticeTone)
        }
        descriptionSection(detail)
        goalsSection(detail)
        lessonsSection(detail)
        sessionsSection(detail)
        if detail.status == .archived {
            PlanningNotice(text: I18n.t("plan.archived.notice"), tone: .info)
        }
    }

    // MARK: - Header

    private func header(_ detail: PlanDetail) -> some View {
        DetailHeaderView(
            eyebrow: I18n.t("objectKind.plan"),
            title: detail.title,
            status: detail.status.chip,
            // Archive is the one destructive move here and it lives in ⋯ at
            // every width: it is not what anyone came to this screen to do.
            overflowActions: controls.archive
                ? [DetailHeaderAction(label: I18n.t("plan.action.archive")) { isConfirmingArchive = true }]
                : [],
            meta: metaLine(detail)
        )
    }

    private func metaLine(_ detail: PlanDetail) -> String? {
        let parts = [
            PlanCopy.dateRangeLabel(startDate: detail.startDate, endDate: detail.endDate),
            PlanCopy.primaryTeacherLabel(detail.primaryTeacherDisplayName),
        ].compactMap { $0 }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    // MARK: - Description / details

    /// The owner gets the editable form; everyone else gets the prose. Not the
    /// same section rendered twice with a toggle — a Teacher has no edit state
    /// to be in, so there is nothing to toggle.
    @ViewBuilder
    private func descriptionSection(_ detail: PlanDetail) -> some View {
        if controls.editDetails {
            VStack(alignment: .leading, spacing: Spacing.md) {
                SectionHeader(I18n.t("plan.section.details"))
                field(I18n.t("plan.field.title")) {
                    TextField(I18n.t("plan.field.title"), text: $titleField)
                        .textFieldStyle(.roundedBorder)
                }
                if didAttemptSave && titleField.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text(I18n.t("plan.error.title"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.danger)
                }
                field(I18n.t("plan.field.description")) {
                    TextField(I18n.t("plan.field.description"), text: $descriptionField, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...8)
                }
                DateField(label: I18n.t("plan.field.start"), iso: $startISO)
                // Seeded from the start date for the same reason the create form
                // is: adding an end to a plan that runs from next month must not
                // open on a day that is already before its own start.
                DateField(label: I18n.t("plan.field.end"), iso: $endISO, initialISO: startISO)
                if !isRangeValid {
                    Text(I18n.t("plan.error.range", ["start": startLabel()]))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.danger)
                }
                if !model.teachers.isEmpty {
                    field(I18n.t("plan.field.primaryTeacher")) {
                        Picker(I18n.t("plan.field.primaryTeacher"), selection: $primaryTeacherId) {
                            Text(I18n.t("plan.primaryTeacher.none")).tag("")
                            ForEach(model.teachers) { teacher in
                                Text(teacher.displayName).tag(teacher.id)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    Text(I18n.t("plan.primaryTeacher.hint"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Button(I18n.t("plan.save")) { save() }
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .disabled(model.isLoading || !isRangeValid)
            }
        } else {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                SectionHeader(I18n.t("plan.section.description"))
                Text(prose(detail.description) ?? I18n.t("plan.description.empty"))
                    .font(Typography.body)
                    .foregroundStyle(detail.description == nil ? Palette.textMuted : Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Mål

    /// The Goals hanging off this Plan.
    ///
    /// `detail.goals` is server-filtered per reader, so this section never
    /// states a count and never compares its length with anything: a Teacher
    /// seeing one of three shared Goals must not be able to infer the other two.
    @ViewBuilder
    private func goalsSection(_ detail: PlanDetail) -> some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(I18n.t("plan.section.goals"))
            if detail.goals.isEmpty {
                Text(I18n.t(PlanCopy.goalsEmptyKey(model.viewer)))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                ForEach(detail.goals) { goal in
                    HStack(alignment: .top, spacing: Spacing.md) {
                        NavigationLink(value: Route.goal(id: goal.id)) {
                            VStack(alignment: .leading, spacing: Spacing.xs) {
                                Text(goal.title)
                                    .font(Typography.bodyEmphasis)
                                    .foregroundStyle(Palette.text)
                                    .fixedSize(horizontal: false, vertical: true)
                                if let target = GoalCopy.targetDateLabel(goal.targetDate) {
                                    Text(target)
                                        .font(Typography.caption)
                                        .foregroundStyle(Palette.textMuted)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        goal.status.chip
                        // Detach survives archiving: a Goal must never be
                        // trapped inside a Plan its owner filed away.
                        if controls.detachGoals {
                            Button(I18n.t("plan.goals.detach")) {
                                detach(goalId: goal.id, title: goal.title)
                            }
                            .font(Typography.caption)
                            .buttonStyle(.borderless)
                            .tint(Palette.accent)
                        }
                    }
                    .padding(.vertical, Spacing.sm)
                    if goal.id != detail.goals.last?.id {
                        Divider().overlay(Palette.border)
                    }
                }
            }
            if controls.attachGoals {
                attachControl
            }
        }
    }

    @ViewBuilder
    private var attachControl: some View {
        if model.attachableGoals.isEmpty {
            Text(I18n.t("plan.goals.none"))
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
        } else {
            HStack(spacing: Spacing.md) {
                Picker(I18n.t("plan.goals.placeholder"), selection: $attachSelection) {
                    Text(I18n.t("plan.goals.placeholder")).tag("")
                    ForEach(model.attachableGoals) { goal in
                        Text(goal.title).tag(goal.id)
                    }
                }
                .pickerStyle(.menu)
                Button(I18n.t("plan.goals.attach")) { attach() }
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
                    .disabled(attachSelection.isEmpty || model.isLoading)
            }
        }
    }

    // MARK: - Lektioner / Träningspass

    /// Lessons split the way every occasion list in this product splits: what is
    /// coming, soonest first, then what happened, most recent first.
    @ViewBuilder
    private func lessonsSection(_ detail: PlanDetail) -> some View {
        let split = OccasionGrouping.split(detail.lessons) { $0.scheduledAt }
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(I18n.t("plan.section.lessons"))
            if detail.lessons.isEmpty {
                Text(I18n.t("plan.lessons.empty"))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
            } else {
                if !split.upcoming.isEmpty {
                    Text(I18n.t("plan.group.upcoming"))
                        .font(Typography.label)
                        .foregroundStyle(Palette.textMuted)
                    lessonRows(split.upcoming)
                }
                if !split.past.isEmpty {
                    Text(I18n.t("plan.group.past"))
                        .font(Typography.label)
                        .foregroundStyle(Palette.textMuted)
                    lessonRows(split.past)
                }
            }
        }
    }

    /// No status pill: `PlanCopy.lessonMeta` already prints the status word on
    /// the meta line, so a chip beside it says "Inställd · Inställd". The web
    /// renders these rows without one for the same reason. The mute stays — it
    /// ranks a cancelled row down without repeating anything.
    @ViewBuilder
    private func lessonRows(_ lessons: [LinkedLessonRef]) -> some View {
        ForEach(lessons) { lesson in
            NavigationLink(value: Route.lesson(id: lesson.id)) {
                OccasionRow(
                    date: OccasionDateBlock(iso: lesson.scheduledAt),
                    title: PlanCopy.occasionWhen(lesson.scheduledAt),
                    meta: [PlanCopy.lessonMeta(lesson)],
                    isMuted: lesson.status == .cancelled
                )
            }
            .buttonStyle(.plain)
            Divider().overlay(Palette.border)
        }
    }

    @ViewBuilder
    private func sessionsSection(_ detail: PlanDetail) -> some View {
        let sessions = OccasionGrouping.sortByRecency(detail.trainingSessions) { $0.performedAt }
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(I18n.t("plan.section.trainingSessions"))
            if sessions.isEmpty {
                Text(I18n.t("plan.trainingSessions.empty"))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
            } else {
                ForEach(sessions) { item in
                    NavigationLink(value: Route.trainingSession(id: item.id)) {
                        OccasionRow(
                            date: OccasionDateBlock(iso: item.performedAt),
                            title: PlanCopy.occasionWhen(item.performedAt),
                            meta: PlanCopy.sessionMeta(item).map { [$0] } ?? []
                        )
                    }
                    .buttonStyle(.plain)
                    Divider().overlay(Palette.border)
                }
            }
        }
    }

    // MARK: - Pieces

    @ViewBuilder
    private func field<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.label)
                .foregroundStyle(Palette.textMuted)
            content()
        }
    }

    // MARK: - Behaviour

    /// Fills the edit form from the loaded Plan, once. Re-seeding on every body
    /// pass would fight the reader's typing.
    private func seedForm() {
        guard !didSeedForm, let detail = model.detail else { return }
        didSeedForm = true
        titleField = detail.title
        descriptionField = detail.description ?? ""
        startISO = detail.startDate ?? ""
        endISO = detail.endDate ?? ""
        primaryTeacherId = detail.primaryTeacherId ?? ""
    }

    private func save() {
        didAttemptSave = true
        let trimmed = titleField.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, isRangeValid else { return }
        Task {
            let outcome = await model.save(
                id: planId,
                title: trimmed,
                description: optional(descriptionField.trimmingCharacters(in: .whitespacesAndNewlines)),
                startDate: optional(startISO),
                endDate: optional(endISO),
                primaryTeacherId: optional(primaryTeacherId)
            )
            report(outcome, success: I18n.t("plan.saved"))
        }
    }

    private func attach() {
        let goalId = attachSelection
        guard let goal = model.attachableGoals.first(where: { $0.id == goalId }) else { return }
        Task {
            let outcome = await model.attachGoal(goalId: goalId, planId: planId)
            attachSelection = ""
            report(outcome, success: I18n.t("plan.toast.goalAttached", ["title": goal.title]))
        }
    }

    private func detach(goalId: String, title: String) {
        Task {
            let outcome = await model.detachGoal(goalId: goalId, planId: planId)
            // The confirmation says where the Goal went, because detaching it
            // from a Plan does not remove it from the rider's Mål.
            report(outcome, success: I18n.t("plan.toast.goalDetached", ["title": title]))
        }
    }

    private func archive() {
        Task {
            let outcome = await model.archive(id: planId)
            report(outcome, success: I18n.t("plan.toast.archived"))
        }
    }

    /// Every write on this screen reports itself the same way, and each of the
    /// four outcomes says something the others do not.
    ///
    /// A 409 does not mean "kunde inte sparas" — it means the Plan changed
    /// elsewhere, most often that it was already archived, and `PlanDetailModel`
    /// has refetched it by now. Saying "försök igen" there would invite the
    /// reader to repeat a write the server has already answered.
    ///
    /// A write that landed under a re-read that did not still gets its
    /// confirmation: the change happened, and what is owed on top of it is a
    /// caveat about the screen, not a retraction. A cancelled write says nothing
    /// at all — the reader has left, and a notice would be here waiting for them.
    private func report(_ outcome: PlanDetailModel.WriteOutcome, success: String) {
        switch outcome {
        case .saved:
            show(success, tone: .success)
        case .savedStale:
            show(success + " " + I18n.t("plan.stale"), tone: .info)
        case .cancelled:
            break
        case .failed:
            let conflict = PlanCopy.isConflict(model.error)
            show(
                conflict ? I18n.t("plan.conflict.message") : I18n.t("plan.saveError"),
                tone: conflict ? .info : .danger
            )
        }
    }

    private func show(_ message: String, tone: PlanningNotice.Tone) {
        notice = message
        noticeTone = tone
    }

    private func startLabel() -> String {
        guard let start = GoalCopy.calendarDate(optional(startISO)) else { return "" }
        return I18n.formatDate(start, .fullDate)
    }

    private func optional(_ value: String) -> String? {
        value.isEmpty ? nil : value
    }

    private func prose(_ value: String?) -> String? {
        guard let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        return value
    }
}
