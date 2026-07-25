import SwiftUI

/// Bibliotek · Program — IA §3.6 list, port of
/// `web/programs/programs.component.ts`.
///
/// On the web this is the second tab of the Bibliotek destination. On the phone
/// the shell (`App/MainTabView.swift`) makes it a sibling row of Övningar under
/// Undervisning — reachable in one tap rather than nested behind a tab strip —
/// so this screen is a plain list with its own title.
///
/// Same three rules as the Övningar list: creation is a sheet so retrieval comes
/// first, the empty state carries exactly one action (§4.14), and a failed fetch
/// renders as a failure rather than as an empty library.
///
/// The row's Exercise count is fetched per Program because `GET /programs` does
/// not carry one; a count that failed is absent rather than zero. The
/// "historical attachment count" §3.6 also mentions is a **Backend gap** and is
/// not rendered at all.
///
/// **A failed refresh is not a failed screen.** The silent reload below runs
/// every time the reader returns from the builder; when it fails, the rows it
/// could not update are still true, so it gets a banner above them rather than
/// the error page that would take them away.
struct ProgramsRootView: View {
    @State private var store = ProgramsStore()
    @State private var isCreating = false
    @State private var acknowledgement: String?

    var body: some View {
        content
            .background(Palette.bg)
            .navigationTitle(I18n.t("nav.programs"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(I18n.t("programs.create")) { isCreating = true }
                        .font(Typography.button)
                }
            }
            .catalogAcknowledgement($acknowledgement)
            .sheet(isPresented: $isCreating) {
                ProgramCreateSheet(store: store) { _ in
                    // The web opens the builder on the Program it just made. A
                    // root list cannot push a `Route` without owning the
                    // navigation path, so the new row is prepended and
                    // acknowledged — the builder is one tap away, at the top.
                    acknowledgement = I18n.t("programCreate.created")
                }
            }
            .task { await store.loadIfNeeded() }
            .onAppear {
                guard store.hasResolved else { return }
                Task { await store.load(silent: true) }
            }
    }

    private var content: some View {
        VStack(spacing: 0) {
            // Above the rows, not instead of them. `showsStaleNotice` is only
            // true when there is something on screen to caveat.
            if store.showsStaleNotice {
                CatalogNoticeBanner(
                    message: I18n.t("programs.refreshError"),
                    actionTitle: I18n.t("programs.retry"),
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
        if store.showsPageError {
            // Checked before both empties: a failed fetch is not an empty
            // library, it is an unknown one. Scoped to a read that left NOTHING
            // on screen — with rows up, the banner above says it instead.
            ErrorStateView(
                message: I18n.t("programs.error"),
                retryTitle: I18n.t("programs.retry")
            ) {
                Task { await store.load() }
            }
        } else if !store.hasResolved || store.isLoading {
            LoadingView(I18n.t("programs.loading"))
        } else if store.items.isEmpty {
            EmptyStateView(
                title: I18n.t("programs.empty.heading"),
                message: I18n.t("programs.empty.body"),
                actionTitle: I18n.t("programs.empty.action"),
                action: { isCreating = true }
            )
        } else {
            list
        }
    }

    private var list: some View {
        List(store.items) { program in
            NavigationLink(value: Route.program(id: program.id)) {
                ProgramRow(program: program, count: store.exerciseCounts[program.id])
            }
        }
        .listStyle(.plain)
        .refreshable { await store.load(silent: true) }
    }
}

/// Title, description excerpt and Exercise count — §3.6 list step 3.
private struct ProgramRow: View {
    let program: Program
    /// `nil` means the count is not known. It is then not rendered, rather than
    /// rendered as zero.
    let count: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(program.title)
                .font(Typography.bodyEmphasis)
                .foregroundStyle(Palette.text)
            let excerpt = LibraryCopy.descriptionExcerpt(program.description)
            if !excerpt.isEmpty {
                Text(excerpt)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let count {
                Text(LibraryCopy.exerciseCountLabel(count))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}
