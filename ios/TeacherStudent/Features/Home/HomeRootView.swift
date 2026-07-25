import SwiftUI

/// **Hem** — IA §3.1. The launchpad that answers "what needs me today?" and
/// deep-links back into the training loop.
///
/// Everything this page decides, it decides in `HomeCopy`: which block renders,
/// in what order, which of the four page states applies, and every phrase. This
/// file only mounts what it is told to.
///
/// **A launchpad, and nothing more.** No data is edited here — every control
/// either pushes a `Route` the shell resolves, or asks the shell to switch tabs.
///
/// **Four states, and the fourth is the important one.** With no payload in hand
/// the page renders "we do not know", never "you have nothing": `invited` and
/// `fresh` are unreachable while the first fetch is in flight or broken, and the
/// error state with its retry is what shows instead.
///
/// **`capabilities` gates exactly one thing**: whether Boka lektion renders. Not
/// the riding block, not either starting path, not navigation.
struct HomeRootView: View {
    @State private var model = HomeViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if let lede = model.lede {
                    Text(lede)
                        .font(Typography.lede)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if model.showsInitialLoading {
                    LoadingView(I18n.t("home.loading"))
                        .frame(minHeight: 160)
                } else if model.showsPageError {
                    ErrorStateView(
                        message: I18n.t("home.error"),
                        retryTitle: I18n.t("home.retry"),
                        retry: { Task { await model.reload() } }
                    )
                }

                // A failed refresh over content that still stands. IA §3.1 wants
                // partial failure to preserve the working blocks and offer a
                // scoped retry rather than collapsing the page — one endpoint
                // cannot fail per block, but it can fail without taking the last
                // good answer down with it.
                if model.showsScopedError {
                    scopedError
                }

                switch model.state {
                case .invited:
                    invitedState
                case .fresh:
                    freshState
                case .ready:
                    readyState
                case .unknown:
                    EmptyView()
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("home.title"))
        // Every appearance, not just the first: the model outlives a tab switch,
        // so anything the reader did in another tab (accepting an invitation,
        // logging a pass) would otherwise never reach this page.
        .task { await model.reload() }
        .refreshable { await model.reload() }
    }

    // MARK: - `ready`

    @ViewBuilder
    private var readyState: some View {
        // A quiet banner, not a fifth card: the grid is capped at four and a
        // waiting invitation is a one-line fact with one destination. Deliberately
        // without a danger or warning tone — an invitation is an opportunity.
        if model.showsInviteBanner {
            HomeInviteBanner(count: model.pendingInvitations)
        }

        HomeQuickActionsRow(actions: model.quickActions)

        ForEach(model.blocks) { block in
            switch block {
            case .nextLesson(let lesson):
                HomeNextLessonCard(lesson: lesson)
            case .latestFeedback(let feedback):
                HomeFeedbackCard(feedback: feedback, now: model.now)
            case .awaitingFeedback(let items):
                HomeAwaitingCard(items: items)
            case .riding(let plans, let goals):
                HomeRidingCard(plans: plans, goals: goals, todayISO: model.todayISO)
            }
        }

        if let updated = model.updatedLabel {
            Text(updated)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .padding(.top, Spacing.sm)
        }
    }

    // MARK: - `invited` (the post-registration landing)

    private var invitedState: some View {
        HomeInvitedState()
    }

    // MARK: - `fresh` (two equally weighted starting paths)

    private var freshState: some View {
        HomeFreshState()
    }

    // MARK: - Scoped failure

    private var scopedError: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
            Text(I18n.t("home.error"))
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            Button(I18n.t("home.retry")) { Task { await model.reload() } }
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .padding(Spacing.md)
        .background(Palette.warningSoft, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(Palette.warning, lineWidth: 1)
        }
        .accessibilityElement(children: .contain)
    }
}

/// The pending-invitation line on a dashboard that has other content too. The
/// `invited` state covers only an account with nothing else, so without this an
/// established rider invited by a second teacher would see nothing at all.
struct HomeInviteBanner: View {
    let count: Int
    @Environment(\.homeShellNavigation) private var navigate

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(HomeCopy.invitationsMessage(count))
                .font(Typography.body)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            if let navigate {
                HomeGhostAction(title: I18n.t("home.invitations.cta")) { navigate(.inbox) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(Palette.border, lineWidth: 1)
        }
    }
}

/// IA §3.1 item 6. Rendered only in `ready` — the two empty states each own a
/// single action of their own, and a header action beside one would be a second
/// exit from a state whose whole job is to have one.
///
/// One primary per view, and it is the first action: Logga pass, which is
/// unconditional. The page's primary action is one every account can complete.
struct HomeQuickActionsRow: View {
    let actions: [HomeCopy.QuickAction]
    @Environment(\.homeShellNavigation) private var navigate

    var body: some View {
        if let navigate, !actions.isEmpty {
            WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.sm) {
                ForEach(Array(actions.enumerated()), id: \.element.id) { index, action in
                    if index == 0 {
                        Button(I18n.t(action.labelKey)) { navigate(action.destination) }
                            .font(Typography.button)
                            .buttonStyle(.borderedProminent)
                            .tint(Palette.accent)
                    } else {
                        Button(I18n.t(action.labelKey)) { navigate(action.destination) }
                            .font(Typography.button)
                            .buttonStyle(.bordered)
                            .tint(Palette.accent)
                    }
                }
            }
        }
    }
}

/// The `invited` state: welcome, plus exactly one action.
struct HomeInvitedState: View {
    @Environment(\.homeShellNavigation) private var navigate

    var body: some View {
        EmptyStateView(
            title: I18n.t("home.welcome.title"),
            message: I18n.t("home.welcome.body"),
            actionTitle: navigate == nil ? nil : I18n.t("home.invitations.cta"),
            action: navigate == nil ? nil : { navigate?(.inbox) }
        )
    }
}

/// The `fresh` state: two starting paths at equal weight.
///
/// Neither path is capability-gated and neither outranks the other, so both
/// actions sit in the secondary tier — a primary on one panel would make the two
/// paths unequal, which is the one thing IA §3.1 asks of this state. The third
/// link is quieter still, so it does not compete with the panel it sits under.
///
/// Hand-rolled rather than two `EmptyStateView`s: that component is a single
/// centred column with one action, which is right for "this list is empty" and
/// wrong for "here are two ways in".
struct HomeFreshState: View {
    @Environment(\.homeShellNavigation) private var navigate

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text(I18n.t("home.start.title"))
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .accessibilityAddTraits(.isHeader)

            ForEach(HomeCopy.startPaths()) { path in
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text(I18n.t(path.titleKey))
                        .font(Typography.bodyEmphasis)
                        .foregroundStyle(Palette.text)
                    Text(I18n.t(path.bodyKey))
                        .font(Typography.body)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                    if let navigate {
                        Button(I18n.t(path.actionKey)) { navigate(path.destination) }
                            .font(Typography.button)
                            .buttonStyle(.bordered)
                            .tint(Palette.accent)
                        if let secondary = path.secondary {
                            HomeGhostAction(title: I18n.t(secondary.actionKey)) {
                                navigate(secondary.destination)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Spacing.lg)
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.md)
                        .strokeBorder(Palette.border, lineWidth: 1)
                }
            }
        }
    }
}
