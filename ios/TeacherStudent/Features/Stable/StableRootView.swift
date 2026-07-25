import SwiftUI

/// Hästar — IA §3.15 list, port of `web/stable/stable.component.ts`.
///
/// The stable is a Student's own list of Horses. Archived Horses are absent from
/// it by construction (`GET /horses` filters them, and `StableCopy.activeHorses`
/// filters again) while remaining attached to every Lesson and Training Session
/// already ridden — which is what the archive copy on the detail screen states.
struct StableRootView: View {
    @State private var store = StableStore()
    @State private var isCreating = false
    @State private var acknowledgement: String?

    private var state: StableCopy.StableState {
        StableCopy.stableState(
            loading: !store.hasResolved || store.isLoading,
            // Only a read that left NOTHING on screen takes the whole screen —
            // the same `showsPageError` the library and the programs list use. A
            // failure over rows that are still up is the banner in `list`.
            failed: store.showsPageError,
            count: store.items.count
        )
    }

    var body: some View {
        content
            .background(Palette.bg)
            .navigationTitle(I18n.t("stable.heading"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(I18n.t("stable.create")) { isCreating = true }
                        .font(Typography.button)
                }
            }
            .catalogAcknowledgement($acknowledgement)
            .sheet(isPresented: $isCreating) {
                HorseCreateSheet(store: store) { _ in
                    acknowledgement = I18n.t("horseCreate.created")
                }
            }
            .task { await store.loadIfNeeded() }
            .onAppear {
                // Re-entry from a Horse, which may have been renamed or
                // archived there. Silent: the rows stay up while it runs, and
                // a failure lands in the banner rather than on the whole page.
                if store.hasResolved {
                    Task { await store.load(silent: true) }
                }
                // A Horse archived on the detail screen confirms itself here —
                // that screen dismissed before it could say anything (IA §4).
                if let handover = StableHandover.shared.take() {
                    acknowledgement = handover
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .error:
            // Reached only by a read that failed with nothing on screen: a
            // failed fetch is not an empty stable, it is an unknown one. Once
            // there are rows, a failure is the banner in `list` instead.
            ErrorStateView(
                message: I18n.t("stable.error"),
                retryTitle: I18n.t("stable.retry")
            ) {
                Task { await store.load() }
            }
        case .loading:
            LoadingView(I18n.t("stable.loading"))
        case .empty:
            EmptyStateView(
                title: I18n.t("stable.empty.heading"),
                message: I18n.t("stable.empty.body"),
                actionTitle: I18n.t("stable.empty.action"),
                action: { isCreating = true }
            )
        case .rows:
            list
        }
    }

    private var list: some View {
        List {
            // A read that did not land, over a stable that did. The rows keep
            // their place and the failure is stated above them — replacing them
            // would throw away good content to report that we could not confirm
            // it is still current. `showsStaleNotice` covers the foreground read
            // too: with rows on screen the error page is withheld, so a failure
            // that only checked `refreshError` would be swallowed whole.
            if store.showsStaleNotice {
                CatalogBanner(message: I18n.t("stable.refreshError"), tone: .danger)
                    .listRowInsets(EdgeInsets(
                        top: Spacing.sm,
                        leading: Spacing.lg,
                        bottom: Spacing.sm,
                        trailing: Spacing.lg
                    ))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
            ForEach(store.items) { horse in
                NavigationLink(value: Route.horse(id: horse.id)) {
                    Text(horse.name)
                        .font(Typography.bodyEmphasis)
                        .foregroundStyle(Palette.text)
                        .padding(.vertical, Spacing.xs)
                }
            }
        }
        .listStyle(.plain)
        .refreshable { await store.load(silent: true) }
    }
}
