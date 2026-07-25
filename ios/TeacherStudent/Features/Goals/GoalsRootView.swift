import SwiftUI

/// Mål (IA §3.13) — the port of `web/goals/goals.component.ts`.
///
/// The Student's own Goals: active, achieved, and abandoned behind a
/// disclosure. Every row states its own sharing, because a Goal is private
/// until its owner shares it and "who can see this" is the fact a rider scans
/// this list for.
struct GoalsRootView: View {
    @State private var model = GoalsModel()
    @State private var isCreating = false
    @State private var showAbandoned = false
    @State private var createdGoalId: String?
    @State private var isShowingCreated = false
    /// Frozen at mount, so "Måldatumet har passerat" cannot flip on a row while
    /// the reader is looking at it.
    @State private var today = Date()

    private var groups: GoalCopy.Groups { GoalCopy.group(model.items) }

    /// Rows wait for the name reads to settle: a row states its Plans and its
    /// audience by NAME, and both arrive as ids from `GET /goals`.
    private var isPreparing: Bool {
        model.isLoading || !model.namesResolved
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                content
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("goals.heading"))
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(I18n.t("goals.create")) { isCreating = true }
                    .font(Typography.button)
            }
        }
        .task {
            if model.items.isEmpty { await model.load() }
        }
        .refreshable { await model.load() }
        .sheet(isPresented: $isCreating) {
            GoalCreateView(model: model) { goal in
                createdGoalId = goal.id
                isShowingCreated = true
            }
        }
        // §3.13: creating a Goal takes you to it. Pushed directly rather than
        // through a `Route`, because the shell owns the stack.
        .navigationDestination(isPresented: $isShowingCreated) {
            if let createdGoalId {
                GoalDetailView(goalId: createdGoalId, flash: I18n.t("goalCreate.created"))
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if model.error != nil, model.items.isEmpty {
            ErrorStateView(
                message: I18n.t("goals.error"),
                retryTitle: I18n.t("goals.retry")
            ) {
                Task { await model.load() }
            }
        } else if isPreparing && model.items.isEmpty {
            LoadingView(I18n.t("goals.loading"))
        } else if model.items.isEmpty {
            EmptyStateView(
                title: I18n.t("goals.empty.heading"),
                message: I18n.t("goals.empty.body"),
                actionTitle: I18n.t("goals.empty.action"),
                action: { isCreating = true }
            )
        } else {
            if model.error != nil {
                PlanningNotice(text: I18n.t("goals.error"), tone: .danger)
                    .padding(.top, Spacing.md)
            }
            if !groups.active.isEmpty {
                SectionHeader(I18n.t("goals.group.active"))
                    .padding(.top, Spacing.md)
                rows(groups.active)
            }
            if !groups.achieved.isEmpty {
                SectionHeader(I18n.t("goals.group.achieved"))
                    .padding(.top, Spacing.lg)
                rows(groups.achieved)
            }
            if !groups.abandoned.isEmpty {
                abandonedSection
            }
        }
    }

    /// Abandoned Goals are collapsed on every visit. They are kept — a
    /// withdrawn intention is part of the record — but they are not what the
    /// list is for.
    @ViewBuilder
    private var abandonedSection: some View {
        Button {
            withAnimation(Motion.standard) { showAbandoned.toggle() }
        } label: {
            HStack(spacing: Spacing.sm) {
                Image(systemName: showAbandoned ? "chevron.down" : "chevron.right")
                    .font(.caption)
                Text(
                    showAbandoned
                        ? I18n.t("goals.abandoned.hide")
                        : I18n.plural("goals.abandoned.show", groups.abandoned.count)
                )
                .font(Typography.button)
            }
            .foregroundStyle(Palette.accent)
            .padding(.vertical, Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)

        if showAbandoned {
            rows(groups.abandoned)
        }
    }

    @ViewBuilder
    private func rows(_ goals: [Goal]) -> some View {
        ForEach(goals) { goal in
            NavigationLink(value: Route.goal(id: goal.id)) {
                GoalRow(
                    goal: goal,
                    today: today,
                    planTitles: model.planTitles,
                    teacherNames: model.teacherNames
                )
            }
            .buttonStyle(.plain)
            if goal.id != goals.last?.id {
                Divider().overlay(Palette.border)
            }
        }
    }
}

/// One Goal in a list.
///
/// Meta order is deliberate: the horse (which Goal is this about), the target
/// date (when), and which Plans it belongs to. The sharing chip closes the row
/// because sharing is the fact this object's privacy rule turns on.
private struct GoalRow: View {
    let goal: Goal
    let today: Date
    let planTitles: [String: String]
    let teacherNames: [String: String]

    private var metaParts: [String] {
        var parts: [String] = []
        if let horseName = goal.horseName, !horseName.isEmpty {
            parts.append(I18n.t("goal.meta.horse", ["name": horseName]))
        }
        if let target = GoalCopy.targetDateLabel(goal.targetDate) {
            parts.append(target)
        }
        if let membership = GoalCopy.planMembership(planIds: goal.planIds, plans: planTitles) {
            parts.append(membership)
        }
        return parts
    }

    private var isOverdue: Bool {
        GoalCopy.isOverdue(targetDate: goal.targetDate, status: goal.status, today: today)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            HStack(alignment: .top, spacing: Spacing.md) {
                Text(goal.title)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                goal.status.chip
            }
            if !metaParts.isEmpty {
                Text(metaParts.joined(separator: " · "))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            // Overdue is a warning, not an outcome — warning-toned text rather
            // than a pill, so it cannot be mistaken for a status.
            if isOverdue {
                Text(I18n.t("goal.overdue"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.warning)
            }
            if let excerpt = GoalCopy.descriptionExcerpt(goal.description) {
                Text(excerpt)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            ShareChip(
                recipients: GoalCopy.ownerRecipients(
                    sharedTeacherIds: goal.sharedTeacherIds,
                    teachers: teacherNames
                )
            )
        }
        .padding(.vertical, Spacing.md)
        .contentShape(Rectangle())
        .opacity(goal.status == .abandoned ? 0.72 : 1)
    }
}
