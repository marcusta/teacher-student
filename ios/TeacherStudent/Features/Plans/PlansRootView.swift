import SwiftUI

/// Planer (IA §3.11) — the port of `web/plans/plans.component.ts`.
///
/// A flat list of the signed-in Student's own Plans: active ones, then archived
/// ones behind a disclosure. There are no counts on a row. A Plan's Goals are
/// privacy-filtered per reader, so "3 mål" on a row a Teacher can see would be
/// a number about objects that reader is not allowed to know exist.
struct PlansRootView: View {
    @State private var model = PlansModel()
    @State private var isCreating = false
    @State private var showArchived = false
    @State private var createdPlanId: String?
    @State private var isShowingCreated = false

    private var groups: PlanCopy.Groups { PlanCopy.group(model.items) }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                content
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("plans.heading"))
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(I18n.t("plans.create")) { isCreating = true }
                    .font(Typography.button)
            }
        }
        // The first read only. `loadIfNeeded` is guarded on `hasLoaded`, so the
        // re-run `.task` gets on every reappearance costs nothing and never
        // races the silent re-entry read below.
        .task { await model.loadIfNeeded() }
        // Re-entry after a detail screen archived or edited a Plan — without
        // this, a Plan archived there stays under Aktiva until the tab is torn
        // down. Guarded on "already loaded once", so it never doubles the first
        // fetch, and silent: a refresh that fails keeps the rows and states the
        // failure above them.
        .onAppear { model.refresh() }
        // Silent too, and for the reason a re-entry is: pulling on a list that
        // is legitimately empty must not be able to replace the empty state with
        // a full-page error, which is the one screen a reader with no Plans can
        // never clear.
        .refreshable { await model.load(silent: true) }
        .sheet(isPresented: $isCreating) {
            PlanCreateView(model: model) { plan in
                createdPlanId = plan.id
                isShowingCreated = true
            }
        }
        // §3.11: creating a Plan takes you to it. This pushes the detail view
        // DIRECTLY rather than through a `Route`, because the shell owns the
        // stack and exposes no path to append to.
        .navigationDestination(isPresented: $isShowingCreated) {
            if let createdPlanId {
                PlanDetailView(planId: createdPlanId, flash: I18n.t("planCreate.created"))
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        // Order matters: a failed read keeps whatever it had, so the error box
        // sits ABOVE the rows rather than replacing them. Only a read the reader
        // WAITED for, with nothing to show for it, takes over the screen — a
        // silent re-read that failed lands in `refreshError` and never gets here.
        if model.showsPageError {
            ErrorStateView(
                message: I18n.t("plans.error"),
                retryTitle: I18n.t("plans.retry")
            ) {
                Task { await model.load() }
            }
        } else if model.isLoading && model.items.isEmpty {
            LoadingView(I18n.t("plans.loading"))
        } else if model.items.isEmpty {
            EmptyStateView(
                title: I18n.t("plans.empty.heading"),
                message: I18n.t("plans.empty.body"),
                actionTitle: I18n.t("plans.empty.action"),
                action: { isCreating = true }
            )
        } else {
            if model.showsStaleNotice {
                // The rows below are still true, they are merely older than the
                // reader assumes — so the line says that rather than "kunde inte
                // hämtas", which would be a claim about a list that is right there.
                PlanningNotice(text: I18n.t("plans.refreshError"), tone: .danger)
                    .padding(.top, Spacing.md)
            }
            if !groups.active.isEmpty {
                SectionHeader(I18n.t("plans.group.active"))
                    .padding(.top, Spacing.md)
                rows(groups.active)
            }
            if !groups.archived.isEmpty {
                archivedSection
            }
        }
    }

    /// Archived Plans are collapsed on every visit, not remembered: the reason
    /// to open a Plan list is what is running now, and a section that stayed
    /// open from last time buries it.
    @ViewBuilder
    private var archivedSection: some View {
        Button {
            withAnimation(Motion.standard) { showArchived.toggle() }
        } label: {
            HStack(spacing: Spacing.sm) {
                Image(systemName: showArchived ? "chevron.down" : "chevron.right")
                    .font(.caption)
                Text(
                    showArchived
                        ? I18n.t("plans.archived.hide")
                        : I18n.plural("plans.archived.show", groups.archived.count)
                )
                .font(Typography.button)
            }
            .foregroundStyle(Palette.accent)
            .padding(.vertical, Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)

        if showArchived {
            rows(groups.archived)
        }
    }

    @ViewBuilder
    private func rows(_ plans: [Plan]) -> some View {
        ForEach(plans) { plan in
            NavigationLink(value: Route.plan(id: plan.id)) {
                PlanRow(plan: plan)
            }
            .buttonStyle(.plain)
            if plan.id != plans.last?.id {
                Divider().overlay(Palette.border)
            }
        }
    }
}

/// One Plan in a list: what it is called, when it runs, who its Primary Teacher
/// is, and one line of what it is for.
private struct PlanRow: View {
    let plan: Plan

    private var metaLine: String? {
        let parts = [
            PlanCopy.dateRangeLabel(startDate: plan.startDate, endDate: plan.endDate),
            PlanCopy.primaryTeacherLabel(plan.primaryTeacherDisplayName),
        ].compactMap { $0 }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(plan.title)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
                if let metaLine {
                    Text(metaLine)
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                }
                if let excerpt = PlanCopy.descriptionExcerpt(plan.description) {
                    Text(excerpt)
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            plan.status.chip
        }
        .padding(.vertical, Spacing.md)
        .contentShape(Rectangle())
        // Archived rows rank quieter but stay readable — the same treatment a
        // cancelled Lesson gets, for the same reason.
        .opacity(plan.status == .archived ? 0.72 : 1)
    }
}

/// A one-line banner for something that just happened, or just failed.
///
/// Core has no toast component and this slice must not add one to `Core/`, so
/// the confirmations §3.11–3.14 call for land inline, where the thing they
/// describe is. Shared by the Plan and Goal screens in this slice.
struct PlanningNotice: View {
    enum Tone {
        case success
        case danger
        case info
    }

    let text: String
    var tone: Tone = .info

    private var color: Color {
        switch tone {
        case .success: return Palette.success
        case .danger: return Palette.danger
        case .info: return Palette.info
        }
    }

    private var background: Color {
        switch tone {
        case .success: return Palette.successSoft
        case .danger: return Palette.dangerSoft
        case .info: return Palette.infoSoft
        }
    }

    var body: some View {
        Text(text)
            .font(Typography.caption)
            .foregroundStyle(color)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Spacing.md)
            .background(background, in: RoundedRectangle(cornerRadius: Radius.md))
            .fixedSize(horizontal: false, vertical: true)
    }
}
