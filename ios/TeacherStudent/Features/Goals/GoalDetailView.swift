import SwiftUI

/// One Goal (IA §3.14) — the port of `web/goals/goal-detail.component.ts`.
///
/// Two readers, one screen, deliberately different: the owner manages the Goal
/// and its audience; a shared Teacher reads it, can mark it achieved or reopen
/// it, and writes in the thread. What a Teacher never sees is WHO ELSE it is
/// shared with — that section does not render for them, and the projection they
/// are served does not carry the ids either.
///
/// Entry point for the shell: `GoalDetailView(goalId:)`. The optional `flash`
/// carries the create confirmation across the push, the same as its sibling
/// `PlanDetailView(planId:flash:)`.
struct GoalDetailView: View {
    let goalId: String
    var flash: String?

    init(goalId: String, flash: String? = nil) {
        self.goalId = goalId
        self.flash = flash
    }

    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var model = GoalDetailModel()
    @State private var notice: String?
    @State private var noticeTone: PlanningNotice.Tone = .success

    @State private var titleField = ""
    @State private var descriptionField = ""
    @State private var targetISO = ""
    @State private var horseId = ""
    @State private var didAttemptSave = false
    /// The values the last read put in the fields. Kept so the screen can tell
    /// "the reader has typed something" from "these are simply what the server
    /// answered" — the question every re-seed after a conflict turns on.
    @State private var seededForm: FormSnapshot?
    /// Frozen at mount, the same contract `GoalsRootView` holds for its rows, so
    /// "Måldatumet har passerat" cannot appear in the meta line under a reader
    /// who is looking at it. A body evaluation is not a clock tick.
    @State private var today = Date()

    @State private var attachSelection = ""
    @State private var isConfirmingAbandon = false
    /// Switches the reader has flipped but the server has not confirmed. Keeps
    /// the control honest while the write is in flight, and lets a failure put
    /// it back where it was.
    @State private var pendingShares: [String: Bool] = [:]
    /// A Plan chip in the header was tapped. Pushed directly, since the shell
    /// owns the stack and this view may not add a `Route` destination.
    @State private var chipPlanId: String?

    private var controls: GoalCopy.Controls { model.controls }
    private var transitions: GoalCopy.Transitions { model.transitions }

    private var isTargetValid: Bool {
        targetISO.isEmpty || GoalCopy.calendarDate(targetISO) != nil
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
        .navigationDestination(item: $chipPlanId) { planId in
            PlanDetailView(planId: planId)
        }
        .task {
            model.currentUserId = session.currentUser?.id
            if notice == nil { notice = flash }
            if model.detail == nil { await model.load(id: goalId) }
            seedForm()
        }
        .alert(I18n.t("goal.confirm.abandon.title"), isPresented: $isConfirmingAbandon) {
            Button(I18n.t("goal.confirm.dismiss"), role: .cancel) {}
            Button(I18n.t("goal.action.abandon"), role: .destructive) { abandon() }
        } message: {
            // The consequence, stated: it moves to Avbrutna, and reopening
            // brings it back as ACTIVE — an achieved goal that is abandoned
            // cannot be recovered as achieved.
            Text(I18n.t("goal.confirm.abandon.message"))
        }
    }

    // MARK: - States

    @ViewBuilder
    private var content: some View {
        if !model.isResolved {
            LoadingView(I18n.t("goal.loading"))
        } else if let detail = model.detail {
            loaded(detail)
        } else if let error = model.error, GoalCopy.isNotFound(error) {
            // Deleted, or no longer shared with this reader — the same answer,
            // because distinguishing them would confirm the Goal exists.
            NotFoundView(
                title: I18n.t("goal.notFound.heading"),
                message: I18n.t("goal.notFound.body"),
                actionTitle: I18n.t("goal.notFound.action"),
                action: { dismiss() }
            )
        } else {
            ErrorStateView(
                message: I18n.t("goals.error"),
                retryTitle: I18n.t("goals.retry")
            ) {
                Task { await model.load(id: goalId) }
            }
        }
    }

    @ViewBuilder
    private func loaded(_ detail: GoalTeacherView) -> some View {
        header(detail)
        if model.hasConflict {
            conflictBanner
        }
        // Above the confirmation it qualifies: the write landed, but what is
        // rendered below may be the version from before it.
        if model.isStale {
            PlanningNotice(text: I18n.t("goal.stale"), tone: .info)
        }
        if let notice {
            PlanningNotice(text: notice, tone: noticeTone)
        }
        if detail.status == .abandoned {
            PlanningNotice(text: I18n.t("goal.abandoned.notice"), tone: .info)
        }
        detailsSection(detail)
        plansSection(detail)
        if controls.manageSharing {
            sharingSection
        }
        if controls.notes, model.recipientsResolved {
            NoteThreadView(
                parentKind: .goal,
                parentId: goalId,
                context: "\(I18n.t("objectKind.goal")) · \(detail.title)",
                recipients: model.noteRecipients,
                // Roles are contextual: the Goal's owner is the student in this
                // thread, and anyone else writing in it is a teacher.
                roleOf: { note in note.authorId == detail.studentId ? .student : .teacher }
            )
        }
    }

    /// A 409 is not a failure to retry. Someone else moved this Goal while this
    /// copy sat open, so the only honest next step is a fresh read.
    private var conflictBanner: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(I18n.t("goal.conflict.message"))
                .font(Typography.caption)
                .foregroundStyle(Palette.warning)
                .fixedSize(horizontal: false, vertical: true)
            Button(I18n.t("goal.conflict.action")) { resolveConflict() }
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Palette.warningSoft, in: RoundedRectangle(cornerRadius: Radius.md))
    }

    // MARK: - Header

    private func header(_ detail: GoalTeacherView) -> some View {
        DetailHeaderView(
            eyebrow: I18n.t("objectKind.goal"),
            title: detail.title,
            status: detail.status.chip,
            // Plan memberships are the Goal's edges up the hierarchy, and every
            // one of them navigates. Plans whose titles did not resolve are
            // omitted rather than rendered as ids.
            chips: detail.planIds.compactMap { planId in
                guard let title = model.planTitles[planId] else { return nil }
                return DetailHeaderChip(label: I18n.t("goal.chip.plan", ["title": title])) {
                    chipPlanId = planId
                }
            },
            // No audience chip in this header, for either role. IA §3.14 puts
            // the header at title/status/target date/achieved and states the
            // audience in **Delat med** below, which is what the web renders
            // too (`goal-detail.component.ts` passes no `recipients`). The chip
            // would also have to draw before `GET /goals/:id/shares` answers,
            // and an audience that is merely UNKNOWN reads as "Privat" through
            // `ShareCopy.label` — §4.5 makes this a trust surface, and a trust
            // surface may not state the wrong audience, not even for a frame.
            primaryAction: transitions.achieve
                ? DetailHeaderAction(label: I18n.t("goal.action.achieve")) { achieve() }
                : nil,
            secondaryActions: transitions.reopen
                ? [DetailHeaderAction(label: I18n.t("goal.action.reopen")) { reopen() }]
                : [],
            overflowActions: transitions.abandon
                ? [DetailHeaderAction(label: I18n.t("goal.action.abandon")) { isConfirmingAbandon = true }]
                : [],
            meta: metaLine(detail)
        )
    }

    private func metaLine(_ detail: GoalTeacherView) -> String? {
        var parts: [String] = []
        if let horseName = detail.horseName, !horseName.isEmpty {
            parts.append(I18n.t("goal.meta.horse", ["name": horseName]))
        }
        if let target = GoalCopy.targetDateLabel(detail.targetDate) {
            parts.append(target)
        }
        if GoalCopy.isOverdue(targetDate: detail.targetDate, status: detail.status, today: today) {
            parts.append(I18n.t("goal.overdue"))
        }
        if let achieved = GoalCopy.achievedLabel(detail.achievedAt) {
            parts.append(achieved)
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    // MARK: - Uppgifter / Beskrivning

    /// The owner edits in place; everyone else reads. A Teacher has no edit
    /// state to be in, so there is no toggle — just the prose.
    @ViewBuilder
    private func detailsSection(_ detail: GoalTeacherView) -> some View {
        if controls.editDetails {
            VStack(alignment: .leading, spacing: Spacing.md) {
                SectionHeader(I18n.t("goal.section.details"))
                labelled(I18n.t("goal.field.title")) {
                    TextField(I18n.t("goal.field.title"), text: $titleField)
                        .textFieldStyle(.roundedBorder)
                }
                if didAttemptSave && titleField.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text(I18n.t("goal.error.title"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.danger)
                }
                labelled(I18n.t("goal.field.description")) {
                    TextField(I18n.t("goal.field.description"), text: $descriptionField, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...8)
                }
                DateField(label: I18n.t("goal.field.target"), iso: $targetISO)
                if !isTargetValid {
                    Text(I18n.t("goal.error.target"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.danger)
                }
                if !model.horseChoices.isEmpty {
                    labelled(I18n.t("goal.field.horse")) {
                        // The Goal's own horse stays in this list even if it has
                        // since been archived, so saving a title change cannot
                        // silently drop it.
                        Picker(I18n.t("goal.field.horse"), selection: $horseId) {
                            Text(I18n.t("goal.horse.none")).tag("")
                            ForEach(model.horseChoices) { horse in
                                Text(horse.name).tag(horse.id)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                }
                Button(I18n.t("goal.save")) { save() }
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .disabled(model.isLoading || !isTargetValid)
            }
        } else {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                SectionHeader(I18n.t("goal.section.description"))
                Text(prose(detail.description) ?? I18n.t("goal.description.empty"))
                    .font(Typography.body)
                    .foregroundStyle(prose(detail.description) == nil ? Palette.textMuted : Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Tillhör planer

    /// Both readers see the memberships; only the owner changes them. A Plan a
    /// Teacher cannot read is left out entirely — an id is not a name.
    ///
    /// Three states, not two. "Målet hör inte till någon plan" is answered from
    /// `planIds` — the authoritative set the Goal itself carries — and never
    /// from the titles that happened to resolve. The two differ whenever a
    /// lookup failed: for the owner when `GET /plans` errored, for a shared
    /// Teacher when the per-Plan `GET /plans/:id` calls 404'd. Keying the empty
    /// state off the resolvable subset would turn either into the confident
    /// false claim that a Goal sitting in four Plans belongs to none. So: the
    /// names it has, "no plans" only when there genuinely are none, and
    /// otherwise silence.
    @ViewBuilder
    private func plansSection(_ detail: GoalTeacherView) -> some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(I18n.t("goal.section.plans"))
            let named = detail.planIds.compactMap { id -> (String, String)? in
                guard let title = model.planTitles[id] else { return nil }
                return (id, title)
            }
            if detail.planIds.isEmpty {
                Text(I18n.t("goal.plans.empty"))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            } else if !named.isEmpty {
                ForEach(named, id: \.0) { planId, title in
                    HStack(alignment: .top, spacing: Spacing.md) {
                        NavigationLink(value: Route.plan(id: planId)) {
                            Text(title)
                                .font(Typography.bodyEmphasis)
                                .foregroundStyle(Palette.text)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        if controls.managePlans {
                            Button(I18n.t("goal.plans.detach")) {
                                detachPlan(planId: planId, title: title)
                            }
                            .font(Typography.caption)
                            .buttonStyle(.borderless)
                            .tint(Palette.accent)
                        }
                    }
                    .padding(.vertical, Spacing.sm)
                    if planId != named.last?.0 {
                        Divider().overlay(Palette.border)
                    }
                }
            }
            if controls.managePlans, model.ownerPlansResolved {
                attachControl
            }
        }
    }

    @ViewBuilder
    private var attachControl: some View {
        if model.attachablePlans.isEmpty {
            Text(I18n.t("goal.plans.none"))
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
        } else {
            HStack(spacing: Spacing.md) {
                Picker(I18n.t("goal.plans.placeholder"), selection: $attachSelection) {
                    Text(I18n.t("goal.plans.placeholder")).tag("")
                    ForEach(model.attachablePlans) { plan in
                        Text(plan.title).tag(plan.id)
                    }
                }
                .pickerStyle(.menu)
                Button(I18n.t("goal.plans.attach")) { attachPlan() }
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
                    .disabled(attachSelection.isEmpty || model.isLoading)
            }
        }
    }

    // MARK: - Delat med (owner only)

    /// One switch per connected Teacher. The hint states what a shared Teacher
    /// can actually DO — read it, write notes, mark it achieved or reopen it —
    /// because "delad" alone does not tell a rider what they are agreeing to.
    @ViewBuilder
    private var sharingSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(I18n.t("goal.section.sharing"))
            // The hint describes what sharing WITH A TEACHER would do, so with
            // no connected Teachers it explains a control that is not there.
            // The web hides it at a count of zero, where `goal.sharing.none`
            // ("Du har ingen lärare att dela med än") is the whole answer.
            if !model.teachers.isEmpty {
                Text(I18n.t("goal.sharing.hint"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if !model.sharesSeeded {
                Text(I18n.t("goal.sharing.loading"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            } else if model.teachers.isEmpty {
                Text(I18n.t("goal.sharing.none"))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                ForEach(model.teachers) { teacher in
                    Toggle(teacher.displayName, isOn: shareBinding(teacher.id))
                        .font(Typography.body)
                        .tint(Palette.accent)
                }
            }
        }
    }

    private func shareBinding(_ teacherId: String) -> Binding<Bool> {
        Binding(
            get: { pendingShares[teacherId] ?? model.sharedTeacherIds.contains(teacherId) },
            set: { next in
                // The guard is what keeps a settling list from firing an unshare
                // for every Teacher the moment the shares arrive.
                guard GoalCopy.shouldCommitShare(
                    seeded: model.sharesSeeded,
                    teacherId: teacherId,
                    next: next,
                    stored: model.sharedTeacherIds
                ) else { return }
                pendingShares[teacherId] = next
                Task {
                    let result = await model.setShare(id: goalId, teacherId: teacherId, shared: next)
                    // Either way the switch goes back to reflecting the SERVER:
                    // a control that stays on after a failed write claims a
                    // Teacher can see this Goal when they cannot.
                    pendingShares[teacherId] = nil
                    // Its own failure sentence — this is the audience, not the
                    // Goal's fields — but the same conflict rule as every other
                    // write: "Försök igen" is the wrong advice for a 409.
                    report(
                        result,
                        success: I18n.t("goal.sharing.saved"),
                        failure: I18n.t("goal.sharing.error")
                    )
                }
            }
        )
    }

    // MARK: - Pieces

    @ViewBuilder
    private func labelled<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.label)
                .foregroundStyle(Palette.textMuted)
            content()
        }
    }

    // MARK: - Behaviour

    /// The four editable fields, as one value, so they can be compared.
    private struct FormSnapshot: Equatable {
        var title: String
        var description: String
        var targetISO: String
        var horseId: String
    }

    private var currentForm: FormSnapshot {
        FormSnapshot(
            title: titleField,
            description: descriptionField,
            targetISO: targetISO,
            horseId: horseId
        )
    }

    /// Whether the reader has changed anything since the last read seeded the
    /// fields. Not "has the form ever been touched" — typing a character and
    /// deleting it again leaves nothing to protect.
    private var isFormDirty: Bool {
        guard let seededForm else { return false }
        return seededForm != currentForm
    }

    /// Fills the edit fields from the loaded Goal. Only on the first read, so
    /// re-reads cannot overwrite what the reader is in the middle of typing —
    /// `reseedForm` is the deliberate exception.
    private func seedForm() {
        guard seededForm == nil else { return }
        reseedForm()
    }

    private func reseedForm() {
        guard let detail = model.detail else { return }
        titleField = detail.title
        descriptionField = detail.description ?? ""
        targetISO = detail.targetDate ?? ""
        horseId = detail.horseId ?? ""
        seededForm = currentForm
    }

    /// A 409 is answered with a fresh read, and the fields have to end up
    /// honest about it.
    ///
    /// The choice, stated: an UNTOUCHED form follows the header, because the
    /// whole point of the re-read is to stop the screen showing two different
    /// versions of the same Goal. A form the reader has typed into is left
    /// alone — their words are not ours to discard over a conflict they did not
    /// cause — and then the screen SAYS so, because fields quietly out of step
    /// with the header above them are exactly the divergence the re-read was
    /// meant to end.
    private func resolveConflict() {
        Task {
            let wasDirty = isFormDirty
            await model.resolveConflict(id: goalId)
            guard model.detail != nil else { return }
            if wasDirty {
                show(I18n.t("goal.conflict.formKept"), tone: .info)
            } else {
                reseedForm()
            }
        }
    }

    private func save() {
        didAttemptSave = true
        let trimmed = titleField.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, isTargetValid else { return }
        Task {
            let result = await model.save(
                id: goalId,
                title: trimmed,
                description: optional(descriptionField.trimmingCharacters(in: .whitespacesAndNewlines)),
                targetDate: optional(targetISO),
                horseId: optional(horseId)
            )
            // The saved values are the new baseline. Without this the form
            // would count as edited forever after one save, and a later
            // conflict would claim to have preserved changes nobody made.
            if case .ok = result { seededForm = currentForm }
            report(result, success: I18n.t("goal.saved"))
        }
    }

    private func achieve() {
        Task {
            let result = await model.achieve(id: goalId)
            report(result, success: I18n.t("goal.toast.achieved"))
        }
    }

    private func reopen() {
        Task {
            let result = await model.reopen(id: goalId)
            report(result, success: I18n.t("goal.toast.reopened"))
        }
    }

    private func abandon() {
        Task {
            let result = await model.abandon(id: goalId)
            report(result, success: I18n.t("goal.toast.abandoned"))
        }
    }

    private func attachPlan() {
        let planId = attachSelection
        guard let plan = model.attachablePlans.first(where: { $0.id == planId }) else { return }
        Task {
            let result = await model.attachPlan(id: goalId, planId: planId)
            attachSelection = ""
            report(result, success: I18n.t("goal.toast.planAttached", ["title": plan.title]))
        }
    }

    private func detachPlan(planId: String, title: String) {
        Task {
            let result = await model.detachPlan(id: goalId, planId: planId)
            report(result, success: I18n.t("goal.toast.planDetached", ["title": title]))
        }
    }

    /// Every write on this screen reports itself, and reports itself the same
    /// way — including the lifecycle moves, which used to say nothing at all on
    /// failure. `model.error` has nowhere to render once the Goal has loaded
    /// (`content` only reaches `ErrorStateView` while `detail` is nil), so a
    /// failed achieve or abandon was invisible: the status chip still read
    /// "Aktivt" and nothing told the reader whether the server had heard them.
    ///
    /// A 409 is the one failure that does not belong here. `GoalDetailModel`
    /// has already raised `conflictBanner`, which says the one useful thing —
    /// re-read — and repeating it as a notice would be two messages for one
    /// event. What does have to go is the notice above it: leaving "Målet är
    /// markerat som uppnått" standing over a banner about a write that did NOT
    /// land is worse than saying nothing.
    ///
    /// The other two answers are not failures and are not written as failures.
    /// A write that landed keeps its confirmation even when the re-read after it
    /// did not — `model.isStale` warns about the CONTENT in its own line above,
    /// rather than turning "Målet är avbrutet" into "det gick inte" and inviting
    /// the reader to send the same change twice. And a cancelled write says
    /// nothing at all: the reader left mid-request, whether it landed is
    /// genuinely unknown, and a screen nobody is on is no place to guess.
    private func report(_ result: GoalDetailModel.WriteResult, success: String, failure: String = I18n.t("goal.saveError")) {
        switch result {
        case .ok:
            show(success, tone: .success)
        case .failed where model.hasConflict:
            notice = nil
        case .failed:
            show(failure, tone: .danger)
        case .cancelled:
            break
        }
    }

    private func show(_ message: String, tone: PlanningNotice.Tone) {
        notice = message
        noticeTone = tone
    }

    private func optional(_ value: String) -> String? {
        value.isEmpty ? nil : value
    }

    private func prose(_ value: String?) -> String? {
        guard let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        return value
    }
}
