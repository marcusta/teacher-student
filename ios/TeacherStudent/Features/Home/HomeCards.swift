import SwiftUI

// The card primitives of Hem — design system §4.2. A launchpad, and nothing
// more: there is no form, no toggle, no status transition and no note composer
// anywhere below. Every control here navigates.

/// A dashboard card surface.
struct HomeCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.lg)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(Palette.border, lineWidth: 1)
        }
        .tsShadow(.one)
    }
}

/// The card's headline value.
struct HomeCardValue: View {
    let text: String

    var body: some View {
        Text(text)
            .font(Typography.bodyEmphasis)
            .foregroundStyle(Palette.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A supporting line under the value.
struct HomeCardMeta: View {
    let text: String

    var body: some View {
        Text(text)
            .font(Typography.caption)
            .foregroundStyle(Palette.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// One row inside a card that lists things. Content only — the caller wraps it
/// in the single `NavigationLink` that gives the row its one tap target.
struct HomeCardRow: View {
    let title: String
    var meta: [String?] = []
    /// The `Datum passerat` marker. A WORD beside the date, never a pill and
    /// never colour alone.
    var marker: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(Typography.label)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            if !visibleMeta.isEmpty || marker != nil {
                WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
                    ForEach(Array(visibleMeta.enumerated()), id: \.offset) { _, part in
                        Text(part)
                            .font(Typography.caption)
                            .foregroundStyle(Palette.textMuted)
                    }
                    if let marker {
                        Text(marker)
                            .font(Typography.caption.weight(.semibold))
                            .foregroundStyle(Palette.warning)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, Spacing.sm)
        .contentShape(Rectangle())
    }

    private var visibleMeta: [String] {
        meta.compactMap { $0 }.filter { !$0.isEmpty }
    }
}

/// A hairline-separated stack of card rows.
struct HomeCardRows<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) {
            Divider().overlay(Palette.border)
            content
        }
        .padding(.top, Spacing.xs)
    }
}

/// The lowest action tier — a card's single exit. Rendered by the caller only
/// when the shell can actually perform it.
struct HomeGhostAction: View {
    let title: String
    let perform: () -> Void

    var body: some View {
        Button(title, action: perform)
            .font(Typography.button)
            .buttonStyle(.plain)
            .foregroundStyle(Palette.accentStrong)
            .padding(.top, Spacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isLink)
    }
}

// MARK: - Blocks

/// IA §3.1 item 2 — date/time, counterparty, Horse, compact Exercise preview.
///
/// Empty is an answer here, not an absence: someone asked what their next lesson
/// is, and "Ingen bokad lektion" is the reply.
struct HomeNextLessonCard: View {
    let lesson: DashboardNextLesson?

    var body: some View {
        if let lesson {
            NavigationLink(value: Route.lesson(id: lesson.id)) {
                HomeCard {
                    SectionHeader(I18n.t(HomeCopy.BlockKind.nextLesson.titleKey))
                    HomeCardValue(text: HomeCopy.nextLessonWhen(lesson))
                    HomeCardMeta(text: HomeCopy.nextLessonMeta(lesson))
                    HomeCardMeta(text: HomeCopy.nextLessonExercises(lesson))
                }
            }
            .buttonStyle(.plain)
        } else {
            HomeEmptyCard(
                kind: .nextLesson,
                valueKey: "home.nextLesson.none",
                actionKey: "home.nextLesson.empty.action"
            )
        }
    }
}

/// IA §3.1 item 3 — the latest **shared** note someone else wrote.
///
/// No badge, no dot, no "ny": this is the latest, not the unread, and there is no
/// read-state in the schema to make it otherwise. The card links by `targetKind`,
/// which is why the payload carries a target separate from the parent — the two
/// junction kinds have no destination of their own.
struct HomeFeedbackCard: View {
    let feedback: DashboardFeedback?
    let now: Date

    var body: some View {
        if let feedback {
            NavigationLink(value: HomeCopy.route(for: feedback)) {
                HomeCard {
                    SectionHeader(I18n.t(HomeCopy.BlockKind.latestFeedback.titleKey))
                    HomeCardValue(text: HomeCopy.feedbackValue(feedback))
                    HomeCardMeta(text: HomeCopy.feedbackContext(feedback))
                    HomeCardMeta(text: HomeCopy.feedbackByline(feedback, now: now))
                }
            }
            .buttonStyle(.plain)
        } else {
            HomeEmptyCard(
                kind: .latestFeedback,
                valueKey: "home.feedback.none",
                actionKey: "home.feedback.empty.action"
            )
        }
    }
}

/// IA §3.1 item 4 — what I owe someone, ahead of my own training on purpose.
///
/// A prompt, never a work queue: the server returns a bounded list with no total,
/// so the count is of what is shown and the card links to the full list rather
/// than claiming a backlog.
struct HomeAwaitingCard: View {
    let items: [DashboardAwaitingItem]
    @Environment(\.homeShellNavigation) private var navigate

    var body: some View {
        HomeCard {
            SectionHeader(I18n.t(HomeCopy.BlockKind.awaitingFeedback.titleKey))
            // "Du har svarat på allt" states completion, not absence — the block
            // only renders at all when the reader teaches, so there is something
            // for it to be the empty state OF.
            HomeCardValue(
                text: items.isEmpty
                    ? I18n.t("home.awaiting.none")
                    : HomeCopy.awaitingCountLabel(items)
            )
            if !items.isEmpty {
                HomeCardRows {
                    ForEach(items) { item in
                        NavigationLink(value: HomeCopy.route(for: item)) {
                            HomeCardRow(
                                title: HomeCopy.awaitingLabel(item),
                                meta: [HomeCopy.awaitingWhen(item), item.horseName]
                            )
                        }
                        .buttonStyle(.plain)
                        Divider().overlay(Palette.border)
                    }
                }
            }
            if let navigate {
                // Names its DESTINATION, not its contents: this block lists
                // lessons and training sessions while the exit only reaches the
                // first of the two, so the label says "Öppna Lektioner" rather
                // than claiming to show everything above.
                HomeGhostAction(title: I18n.t("home.awaiting.all")) { navigate(.lessons) }
            }
        }
    }
}

/// IA §3.1 item 5 — my own Plans and Goals, sharing one card.
///
/// **Never gated on `capabilities.rides`.** Both lists are ownership-scoped, so
/// an account with zero Relations can own both, and gating here would hide a
/// person's own Goals from them.
struct HomeRidingCard: View {
    let plans: [DashboardPlanRef]
    let goals: [DashboardGoalRef]
    let todayISO: String

    var body: some View {
        HomeCard {
            SectionHeader(I18n.t(HomeCopy.BlockKind.riding.titleKey))
            HomeCardValue(
                text: plans.isEmpty
                    ? I18n.t("home.plans.none")
                    : HomeCopy.planCountLabel(plans)
            )
            if !plans.isEmpty {
                HomeCardRows {
                    ForEach(plans) { plan in
                        NavigationLink(value: Route.plan(id: plan.id)) {
                            HomeCardRow(
                                title: plan.title,
                                meta: [
                                    HomeCopy.dateRangeLabel(start: plan.startDate, end: plan.endDate),
                                    HomeCopy.primaryTeacherLabel(plan.primaryTeacherDisplayName),
                                ]
                            )
                        }
                        .buttonStyle(.plain)
                        Divider().overlay(Palette.border)
                    }
                }
            }

            SectionHeader(I18n.t("home.goals.nearing"))
                .padding(.top, Spacing.sm)
            if goals.isEmpty {
                HomeCardMeta(text: I18n.t("home.goals.none"))
            } else {
                HomeCardRows {
                    ForEach(goals) { goal in
                        NavigationLink(value: Route.goal(id: goal.id)) {
                            HomeCardRow(
                                title: goal.title,
                                meta: [HomeCopy.goalTargetLabel(goal)],
                                marker: HomeCopy.goalOverdueLabel(goal, todayISO: todayISO)
                            )
                        }
                        .buttonStyle(.plain)
                        Divider().overlay(Palette.border)
                    }
                }
            }
        }
    }
}

/// A card whose block has nothing to show: one line of copy and at most one
/// ghost-tier exit. The exit lives in another tab, so it renders only when the
/// shell can perform it — a card with a dead button would be worse than a card
/// that states the fact and stops.
struct HomeEmptyCard: View {
    let kind: HomeCopy.BlockKind
    let valueKey: String
    let actionKey: String
    @Environment(\.homeShellNavigation) private var navigate

    var body: some View {
        HomeCard {
            SectionHeader(I18n.t(kind.titleKey))
            HomeCardValue(text: I18n.t(valueKey))
            if let navigate {
                HomeGhostAction(title: I18n.t(actionKey)) { navigate(.lessons) }
            }
        }
    }
}
