import SwiftUI

/// The five tabs of PLAN.md §Hard conventions 7 — the phone form of the web's
/// four navigation groups (`web/app/nav.structure.ts`).
///
///   Hem · Inkorg · Träning · Planering · Undervisning
///
/// The two group tabs that hold more than one destination open on a short index
/// rather than guessing which half the reader wanted; the destinations behind
/// them are the same nine the sidebar lists.
///
/// `Undervisning` is NOT capability-gated, and neither are Mål, Planer, Hästar
/// or Träningspass. UI_DECISIONS §1: role is contextual, so gating a group
/// hides the feature from exactly the accounts that need to discover it. Empty
/// states teach it instead.
struct MainTabView: View {
    @Environment(SessionStore.self) private var session

    @State private var selection: Tab = .home
    /// Owned by the shell, not by Inkorg's own screen, for two reasons: the tab
    /// bar must know the pending count before anyone opens the tab, and an
    /// accept or decline must retire the badge the moment the row settles. Held
    /// as shell `@State` so the auth gate destroys it on sign-out — a count from
    /// the previous account must never outlive the session.
    @State private var inbox = InboxViewModel()
    /// One path per group tab, so a push in Träning does not disturb Planering
    /// and each tab keeps its own Back stack.
    @State private var trainingPath = NavigationPath()
    @State private var planningPath = NavigationPath()
    @State private var teachingPath = NavigationPath()

    enum Tab: Hashable { case home, inbox, training, planning, teaching }

    var body: some View {
        TabView(selection: $selection) {
            tab(labelKey: "nav.home", systemImage: "house", tag: .home, path: nil) {
                HomeRootView()
                    .environment(\.homeShellNavigation, go)
            }
            tab(labelKey: "nav.inbox", systemImage: "tray", tag: .inbox, path: nil, badge: inbox.pendingCount) {
                InboxRootView(model: inbox)
            }
            tab(labelKey: "nav.group.training", systemImage: "calendar", tag: .training, path: $trainingPath) {
                SectionIndexView(title: I18n.t("nav.group.training"), rows: NavSection.training)
            }
            tab(labelKey: "nav.group.planning", systemImage: "flag", tag: .planning, path: $planningPath) {
                SectionIndexView(title: I18n.t("nav.group.planning"), rows: NavSection.planning)
            }
            tab(labelKey: "nav.group.teaching", systemImage: "person.2", tag: .teaching, path: $teachingPath) {
                SectionIndexView(title: I18n.t("nav.group.teaching"), rows: NavSection.teaching)
            }
        }
        .tint(Palette.accent)
        // The badge is the only thing on the shell that speaks for a tab nobody
        // has opened, so the count has to be fetched here rather than waiting
        // for Inkorg's own appearance. A failure leaves the last known count
        // alone; the tab bar is not a place to report one.
        .task { await inbox.prefetch() }
    }

    /// Hem's cross-tab exits (`HomeShellDestination`). `Route` deliberately
    /// cannot express a list root or a creation flow, so the shell resolves
    /// those by switching tab and pushing the section the reader asked for.
    /// Creation lands on the owning list, where its primary action lives —
    /// one tap short of the web's prefilled form, but never a dead end.
    private func go(_ destination: HomeShellDestination) {
        switch destination {
        case .inbox:
            selection = .inbox
        case .lessons, .newLesson:
            trainingPath = NavigationPath([NavSection.lessons])
            selection = .training
        case .newTrainingSession:
            trainingPath = NavigationPath([NavSection.trainingSessions])
            selection = .training
        case .students:
            teachingPath = NavigationPath([NavSection.students])
            selection = .teaching
        case .stable:
            planningPath = NavigationPath([NavSection.stable])
            selection = .planning
        case .newGoal:
            planningPath = NavigationPath([NavSection.goals])
            selection = .planning
        }
    }

    /// Every tab owns its own `NavigationStack`, and every stack resolves the
    /// same two destination types: `NavSection` (a list root) and `Route` (a
    /// detail). Feature slices push `Route` values and register nothing.
    private func tab<Content: View>(
        labelKey: String,
        systemImage: String,
        tag: Tab,
        path: Binding<NavigationPath>?,
        badge: Int = 0,
        @ViewBuilder content: () -> Content
    ) -> some View {
        Group {
            if let path {
                NavigationStack(path: path) { stackBody(content()) }
            } else {
                NavigationStack { stackBody(content()) }
            }
        }
        .tabItem { Label(I18n.t(labelKey), systemImage: systemImage) }
        // `.badge(0)` renders nothing, so the zero case needs no branch here.
        .badge(badge)
        .tag(tag)
    }

    private func stackBody<Content: View>(_ content: Content) -> some View {
        content
            .toolbar { signOutToolbarItem }
            .navigationDestination(for: NavSection.self) { $0.destination }
            .navigationDestination(for: Route.self) { RouteView(route: $0) }
    }

    @ToolbarContentBuilder
    private var signOutToolbarItem: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                Task { await session.logout() }
            } label: {
                Label(I18n.t("topBar.signOut"), systemImage: "rectangle.portrait.and.arrow.right")
            }
            .labelStyle(.iconOnly)
        }
    }
}

/// A list root reached from a group tab's index. Value-based so the shell can
/// also push one programmatically for Hem's cross-tab exits.
enum NavSection: Hashable, CaseIterable {
    case lessons, trainingSessions, plans, goals, stable, students, library, programs

    static let training: [NavSection] = [.lessons, .trainingSessions]
    static let planning: [NavSection] = [.plans, .goals, .stable]
    /// Program is a tab inside Bibliotek on the web; on a phone it is a sibling
    /// row, reachable rather than nested two levels down.
    static let teaching: [NavSection] = [.students, .library, .programs]

    var labelKey: String {
        switch self {
        case .lessons: "nav.lessons"
        case .trainingSessions: "nav.trainingSessions"
        case .plans: "nav.plans"
        case .goals: "nav.goals"
        case .stable: "nav.stable"
        case .students: "nav.students"
        case .library: "nav.library"
        case .programs: "nav.programs"
        }
    }

    var systemImage: String {
        switch self {
        case .lessons: "figure.equestrian.sports"
        case .trainingSessions: "stopwatch"
        case .plans: "list.bullet.rectangle"
        case .goals: "target"
        case .stable: "house.lodge"
        case .students: "person.crop.circle"
        case .library: "books.vertical"
        case .programs: "square.stack.3d.up"
        }
    }

    @ViewBuilder
    var destination: some View {
        switch self {
        case .lessons: LessonsRootView()
        case .trainingSessions: TrainingSessionsRootView()
        case .plans: PlansRootView()
        case .goals: GoalsRootView()
        case .stable: StableRootView()
        case .students: StudentsRootView()
        case .library: LibraryRootView()
        case .programs: ProgramsRootView()
        }
    }
}

/// The index a group tab opens on.
struct SectionIndexView: View {
    let title: String
    let rows: [NavSection]

    var body: some View {
        List(rows, id: \.self) { row in
            NavigationLink(value: row) {
                Label(I18n.t(row.labelKey), systemImage: row.systemImage)
                    .font(Typography.body)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(title)
    }
}
