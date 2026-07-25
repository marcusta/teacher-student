import SwiftUI

/// Bibliotek · Övningar — IA §3.5 list, the port of
/// `web/library/exercise-list.component.ts`.
///
/// **Retrieval first.** The create form is not on this screen; §1's shared
/// interface grammar says creation "must not dominate the list", so **Ny
/// övning** is a single toolbar action that opens a sheet. The list is
/// therefore never inert behind a pending create.
///
/// **Search appears with volume** (§3.5 step 2, "when volume requires it").
/// Below `LibraryCopy.searchThreshold` rows the whole library is on one screen
/// and a search field is a control that teaches nothing.
///
/// **Three list-less states, not one.** A failed fetch, an empty library and a
/// search that matched nothing are different facts and get different single
/// actions (§4.14). Collapsing them offers to create a first exercise to a
/// teacher who has forty and mistyped, and quietly reports a network failure as
/// success.
///
/// **A failed refresh is not a failed screen.** The reload below runs silently
/// every time the reader comes back from a detail; on a flaky connection it will
/// fail while a perfectly good list is on screen. That is a banner over the rows
/// it could not update, never the error page — replacing forty readable rows
/// with "biblioteket kunde inte hämtas" removes the content the reader came
/// back to.
struct LibraryRootView: View {
    @State private var store = LibraryStore()
    @State private var query = ""
    @State private var isCreating = false
    @State private var acknowledgement: String?

    private var visible: [Exercise] {
        LibraryCopy.filterExercises(store.items, query: query)
    }

    private var state: LibraryCopy.ExerciseListState {
        LibraryCopy.exerciseListState(
            loading: !store.hasResolved || store.isLoading,
            // Only a read that left NOTHING on screen takes the whole screen.
            failed: store.showsPageError,
            total: store.items.count,
            visible: visible.count
        )
    }

    var body: some View {
        searchable
            .background(Palette.bg)
            .navigationTitle(I18n.t("library.heading"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(I18n.t("library.create")) { isCreating = true }
                        .font(Typography.button)
                }
            }
            .catalogAcknowledgement($acknowledgement)
            .sheet(isPresented: $isCreating) {
                ExerciseCreateSheet(store: store) { _ in
                    // The web lands on the new Exercise's detail route. A root
                    // list cannot push a `Route` without owning the navigation
                    // path, so the new row is prepended and acknowledged
                    // instead — it is the first row, one tap away.
                    query = ""
                    acknowledgement = I18n.t("exerciseCreate.created")
                }
            }
            .task { await store.loadIfNeeded() }
            .onAppear {
                // A push does not tear this view down, so `.task` will not run
                // again when the reader comes back from a detail that may have
                // archived or renamed a row.
                guard store.hasResolved else { return }
                Task { await store.load(silent: true) }
            }
    }

    /// The search field is withheld, not disabled, below the volume threshold.
    @ViewBuilder
    private var searchable: some View {
        if LibraryCopy.shouldOfferSearch(store.items.count) {
            content.searchable(
                text: $query,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: Text(I18n.t("library.search.placeholder"))
            )
        } else {
            content
        }
    }

    private var content: some View {
        VStack(spacing: 0) {
            // Above the rows, not instead of them. `showsStaleNotice` is only
            // true when there is something on screen to caveat.
            if store.showsStaleNotice {
                CatalogNoticeBanner(
                    message: I18n.t("library.refreshError"),
                    actionTitle: I18n.t("library.retry"),
                    action: { Task { await store.load(silent: true) } }
                )
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.sm)
            }
            stateContent
        }
    }

    @ViewBuilder
    private var stateContent: some View {
        switch state {
        case .loading:
            LoadingView(I18n.t("library.loading"))
        case .error:
            ErrorStateView(
                message: I18n.t("library.error"),
                retryTitle: I18n.t("library.retry")
            ) {
                Task { await store.load() }
            }
        case .empty:
            EmptyStateView(
                title: I18n.t("library.empty.heading"),
                message: I18n.t("library.empty.body"),
                actionTitle: I18n.t("library.empty.action"),
                action: { isCreating = true }
            )
        case .noMatches:
            EmptyStateView(
                title: I18n.t("library.noMatches.heading"),
                message: I18n.t("library.noMatches.body"),
                actionTitle: I18n.t("library.noMatches.action"),
                action: { query = "" }
            )
        case .rows:
            list
        }
    }

    private var list: some View {
        List(visible) { exercise in
            // The row IS the link, so there is no branch in which an Exercise
            // renders without its detail destination.
            NavigationLink(value: Route.exercise(id: exercise.id)) {
                ExerciseRow(exercise: exercise)
            }
        }
        .listStyle(.plain)
        .refreshable { await store.load(silent: true) }
    }
}

/// Name and description excerpt — §3.5 list step 4.
private struct ExerciseRow: View {
    let exercise: Exercise

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(exercise.name)
                .font(Typography.bodyEmphasis)
                .foregroundStyle(Palette.text)
            let excerpt = LibraryCopy.descriptionExcerpt(exercise.description)
            if !excerpt.isEmpty {
                Text(excerpt)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}
