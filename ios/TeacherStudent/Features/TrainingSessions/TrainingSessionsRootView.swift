import SwiftUI

/// **Träningspass** — IA §3.9. The rider's own log: what they rode, when, on
/// which horse, and who they let read it.
///
/// The whole page is one list of one kind of thing, newest first. There is no
/// Kommande/Tidigare split as on Lektioner, because a logged session has always
/// already happened.
///
/// **Rows do not paint until the recipient names are in.** A shared session's
/// chip names its Teachers (§4.5); rendering the row the moment the sessions
/// arrive would flash an unnamed "Delad" and then correct itself. A momentary
/// wrong claim about who can read a training log is worse than a slightly longer
/// spinner, so the list waits for `teachers.list()` too.
///
/// **The primary action is unconditional.** Logga pass needs no teacher, no
/// plan, no horse — a rider with an empty account can log a session, and the
/// empty state says so in the same words.
struct TrainingSessionsRootView: View {
    @State private var model = TrainingSessionsListModel()
    @State private var isLogging = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if let notice = model.notice {
                    TrainingSessionNoticeBanner(message: notice, dismiss: { model.notice = nil })
                }

                // Withheld while the page is empty and still resolving: the
                // empty state owns the only action in that case, and two ways
                // to do the same thing is one too many.
                if !model.showsEmpty && !model.showsLoading {
                    Button(I18n.t("trainingSessions.log")) { isLogging = true }
                        .font(Typography.button)
                        .buttonStyle(.borderedProminent)
                        .tint(Palette.accent)
                }

                content
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("trainingSessions.heading"))
        .task { await model.loadIfNeeded() }
        // Re-entry after a detail view deleted or edited a session. Guarded on
        // "already loaded once", so this never doubles the first fetch.
        .onAppear { model.refresh() }
        .refreshable { await model.load() }
        .sheet(isPresented: $isLogging) {
            TrainingSessionCreateView { created in
                model.merge(created)
                model.notice = I18n.t("trainingSessionCreate.created")
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if model.showsLoading {
            LoadingView(I18n.t("trainingSessions.loading"))
                .frame(minHeight: 160)
        } else if model.error != nil, model.ordered.isEmpty {
            ErrorStateView(
                message: I18n.t("trainingSessions.error"),
                retryTitle: I18n.t("trainingSessions.retry"),
                retry: { Task { await model.load() } }
            )
        } else if model.showsEmpty {
            EmptyStateView(
                title: I18n.t("trainingSessions.empty.heading"),
                message: I18n.t("trainingSessions.empty.body"),
                actionTitle: I18n.t("trainingSessions.empty.action"),
                action: { isLogging = true }
            )
        } else {
            // A refresh that failed over a list that still stands: the rows keep
            // their place and the failure is stated above them, rather than the
            // page collapsing into an error state that throws away good content.
            if let error = model.error {
                TrainingSessionErrorBanner(error: error, refresh: { Task { await model.load() } })
            }
            list
        }
    }

    private var list: some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            ForEach(model.ordered) { session in
                NavigationLink(value: Route.trainingSession(id: session.id)) {
                    TrainingSessionRow(session: session, recipients: model.recipients(for: session))
                }
                .buttonStyle(.plain)
                if session.id != model.ordered.last?.id {
                    Divider().overlay(Palette.border)
                }
            }
        }
    }
}

/// One row of the log (IA §3.9), in the shared occasion grammar of §4.3.
///
/// The order of the facts is the order a rider scans them: when, what it was,
/// then how long / which horse / which exercises, and finally the trust and
/// label chips. The share chip leads the chip row because the trust surface
/// outranks a label.
struct TrainingSessionRow: View {
    let session: TrainingSession
    let recipients: [ShareRecipient]

    var body: some View {
        let title = TrainingSessionCopy.sessionTitle(session)
        let excerpt = TrainingSessionCopy.summaryExcerpt(session.summary)
        OccasionRow(
            date: OccasionDateBlock(iso: session.performedAt),
            title: title,
            meta: [
                TrainingSessionCopy.durationLabel(session.durationMin),
                session.horseName,
                TrainingSessionCopy.exerciseSummary(session.exercises),
                // The headline is often the excerpt already; printing it twice
                // wastes the row's second line.
                excerpt == title ? nil : excerpt,
            ].compactMap { $0 },
            sharing: OccasionRow.Sharing(
                recipients: recipients,
                shared: !session.sharedWithTeacherIds.isEmpty
            ),
            chips: chips
        )
        .padding(.vertical, Spacing.md)
        .contentShape(Rectangle())
    }

    private var chips: [String] {
        var labels: [String] = []
        if let planTitle = session.planTitle {
            labels.append(TrainingSessionCopy.planChipLabel(planTitle))
        }
        labels.append(contentsOf: TrainingSessionCopy.programBadges(session).map(TrainingSessionCopy.programChipLabel))
        return labels
    }
}
