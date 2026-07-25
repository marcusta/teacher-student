import SwiftUI

/// Elevvy — one Student's workspace (IA §3.4).
///
/// Seven tabs over one persistent header. Each tab owns its own source, and its
/// own loading, empty and error state: a broken goals request costs the reader
/// one tab, never the page. Tabs load on FIRST activation and never refetch on a
/// switch back — the tab row is navigation, not a refresh button.
@Observable
@MainActor
final class StudentDetailModel {
    let studentId: String
    private let api: Api

    let student = AsyncSection<Student>()
    let lessons = AsyncSection<[LessonForUser]>()
    let sessions = AsyncSection<[TrainingSession]>()
    let plans = AsyncSection<[Plan]>()
    let goals = AsyncSection<[GoalTeacherView]>()
    let horses = AsyncSection<[Horse]>()
    let exercises = AsyncSection<[Exercise]>()

    var activeTab: StudentCopy.Tab = StudentCopy.defaultTab
    var historyPick: String = ""

    /// The clock the "kommande vs tidigare" split and "nästa lektion" are
    /// answered against. Read ONCE PER TAB LOAD (`loadTab`) and never during a
    /// render: a `Date()` read inside the derived properties would move a Lesson
    /// from Kommande to Tidigare mid-pass, on nothing the view observed. Held on
    /// a tab load rather than at mount so a workspace left open across an
    /// afternoon does not keep sorting against the morning.
    private(set) var nowISO = StudentCopy.nowISO()

    init(studentId: String, api: Api = .shared) {
        self.studentId = studentId
        self.api = api
    }

    // MARK: - Loading

    func start() {
        Task { await student.runOnce { try await self.api.students.get(id: self.studentId) } }
        loadTab(activeTab)
    }

    func reloadStudent() {
        student.reset()
        Task { await student.run { try await self.api.students.get(id: self.studentId) } }
    }

    func select(_ tab: StudentCopy.Tab) {
        activeTab = tab
        loadTab(tab)
    }

    func loadTab(_ tab: StudentCopy.Tab) {
        nowISO = StudentCopy.nowISO()
        switch tab {
        case .oversikt:
            loadLessons()
            loadSessions()
            loadPlans()
            loadGoals()
        case .lektioner:
            loadLessons()
        case .pass:
            loadSessions()
        case .planer:
            loadPlans()
        case .mal:
            loadGoals()
        case .hastar:
            loadHorses()
        case .historik:
            loadExercises()
        }
    }

    /// The retry action: forget that the section ran, then run it again.
    func reloadTab(_ tab: StudentCopy.Tab) {
        switch tab {
        case .oversikt:
            lessons.reset(); sessions.reset(); plans.reset(); goals.reset()
        case .lektioner: lessons.reset()
        case .pass: sessions.reset()
        case .planer: plans.reset()
        case .mal: goals.reset()
        case .hastar: horses.reset()
        case .historik: exercises.reset()
        }
        loadTab(tab)
    }

    private func loadLessons() {
        Task { await lessons.runOnce { try await self.api.lessons.list() } }
    }

    /// A Lesson booked from this screen invalidates the one source behind both
    /// "nästa lektion" and the Lektioner tab. It is REFETCHED rather than
    /// patched in: `POST /lessons` answers a bare `Lesson`, which carries
    /// neither `role` nor the counterparty projection these rows read — those
    /// are projections of the reader, and a write does not know who is reading.
    ///
    /// The tab switch is the confirmation. There is no notice bar on this
    /// screen, so instead of announcing the booking the view SHOWS it, in the
    /// list it now belongs to — which also lets a partial booking (a Horse or
    /// Program that failed to attach) be seen rather than claimed.
    func lessonBooked() {
        activeTab = .lektioner
        lessons.reset()
        loadLessons()
    }

    private func loadSessions() {
        Task { await sessions.runOnce { try await self.api.students.listTrainingSessions(id: self.studentId) } }
    }

    private func loadPlans() {
        Task { await plans.runOnce { try await self.api.students.listPlans(id: self.studentId) } }
    }

    private func loadGoals() {
        Task { await goals.runOnce { try await self.api.students.listGoals(id: self.studentId) } }
    }

    private func loadHorses() {
        Task { await horses.runOnce { try await self.api.students.listHorses(id: self.studentId) } }
    }

    private func loadExercises() {
        Task { await exercises.runOnce { try await self.api.exercises.list() } }
    }

    // MARK: - Page states

    /// `.notFound` (and the rare `.forbidden`) means "not yours" — a missing
    /// Student, a revoked Relation and another teacher's student are answered
    /// identically on purpose, so the client preserves the ambiguity rather than
    /// reporting which.
    var isMissing: Bool { student.hasFailed && student.isNotFound }
    /// Anything else that went wrong is a failure, and retrying may fix it.
    var hasFailed: Bool { student.hasFailed && !student.isNotFound }
    var isReady: Bool { student.data != nil }

    // MARK: - Derived per tab

    /// Privacy boundary: only lessons where the reader is the TEACHER of this
    /// student. `GET /lessons` carries both sides of the reader's calendar.
    var myLessons: [LessonForUser] {
        StudentCopy.lessonsWithStudent(lessons.items(), studentId: studentId)
    }

    var groupedLessons: OccasionGrouping.Split<LessonForUser> {
        OccasionGrouping.split(myLessons, nowISO: nowISO) { $0.scheduledAt }
    }

    var mySessions: [TrainingSession] { StudentCopy.sharedSessions(sessions.items()) }
    var myPlans: [Plan] { StudentCopy.activePlans(plans.items()) }
    var myGoals: [GoalTeacherView] { StudentCopy.sharedGoals(goals.items()) }
    var myHorses: [Horse] { StudentCopy.activeHorses(horses.items()) }

    var nextLesson: LessonForUser? {
        guard lessons.data != nil else { return nil }
        return StudentCopy.nextLessonWith(lessons.items(), studentId: studentId, nowISO: nowISO)
    }

    var latestSession: TrainingSession? {
        guard sessions.data != nil else { return nil }
        return StudentCopy.latestSharedSession(sessions.items())
    }

    var recentActivity: [StudentCopy.ActivityItem] {
        StudentCopy.recentActivity(lessons: myLessons, sessions: mySessions, nowISO: nowISO)
    }

    /// The activity block is a fifth card and follows the same rule as the rest:
    /// it may only say "inget har hänt" once both of its sources have answered
    /// AND neither of them failed.
    var activityState: StudentCopy.ActivityLineState {
        StudentCopy.activityLineState(
            sourcesFailed: lessons.hasFailed || sessions.hasFailed,
            sourcesAnswered: lessons.isResolved && sessions.isResolved,
            count: recentActivity.count
        )
    }
}

// MARK: - View

/// Standalone detail screen — the shell resolves `Route.student(id:)` to this.
struct StudentDetailView: View {
    @State private var model: StudentDetailModel
    @Environment(\.dismiss) private var dismiss

    /// **Boka lektion** (IA §3.4) opens the Lessons slice's own creation panel
    /// rather than a second booking form that would drift from it. The roster
    /// handed to the panel is this one Student, so the form cannot book for
    /// anybody else.
    ///
    /// TODO(shell): §3.4 asks for the action "prefilled with this Student", and
    /// `LessonCreateSheet` has no seed for its student field — so the reader
    /// still opens a picker holding exactly one name. Seeding it means a new
    /// parameter on that sheet, which belongs to the Lessons slice.
    @State private var bookingStore = LessonsStore()
    @State private var isBooking = false
    /// Armed by a successful POST, spent when the panel has finished closing —
    /// the same two-step the Lektioner list uses, because a push started while
    /// a sheet is still dismissing is the one SwiftUI drops.
    @State private var pendingBooked: BookedLesson?
    @State private var booked: BookedLesson?

    /// The Lesson this screen just created.
    ///
    /// Landing on it is not a flourish: `LessonsStore.create` reports
    /// `incomplete` when the follow-up Program attach or Horse PATCH failed, and
    /// the Lesson detail is the ONLY screen where either can be added. Booking
    /// from the Student workspace has to say that as loudly as booking from the
    /// Lektioner list does — otherwise the reader is told nothing and leaves a
    /// lesson standing without its horse.
    struct BookedLesson: Hashable {
        let id: String
        let incomplete: Bool

        var notice: LessonNotice {
            LessonNotice(
                message: I18n.t(incomplete ? "lessonCreate.createdPartial" : "lessonCreate.created"),
                tone: incomplete ? .warning : .success
            )
        }
    }

    init(studentId: String) {
        _model = State(initialValue: StudentDetailModel(studentId: studentId))
    }

    var body: some View {
        Group {
            if model.isMissing {
                NotFoundView(
                    title: I18n.t("student.notFound.heading"),
                    message: I18n.t("student.notFound.body"),
                    actionTitle: I18n.t("student.notFound.action"),
                    action: { dismiss() }
                )
            } else if model.hasFailed {
                ErrorStateView(
                    message: I18n.t("student.error"),
                    retryTitle: I18n.t("students.retry"),
                    retry: { model.reloadStudent() }
                )
            } else if let student = model.student.data {
                workspace(student)
            } else {
                LoadingView(I18n.t("student.loading"))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Palette.bg)
        .navigationTitle(I18n.t("student.eyebrow"))
        .navigationBarTitleDisplayMode(.inline)
        .task { model.start() }
        .sheet(isPresented: $isBooking, onDismiss: {
            booked = pendingBooked
            pendingBooked = nil
        }) {
            if let student = model.student.data {
                LessonCreateSheet(store: bookingStore, students: [student]) { outcome in
                    model.lessonBooked()
                    pendingBooked = BookedLesson(id: outcome.lesson.id, incomplete: outcome.incomplete)
                }
            }
        }
        .navigationDestination(item: $booked) { booked in
            LessonDetailView(lessonId: booked.id, arrival: booked.notice)
        }
    }

    /// Open the booking panel from a clean slate — `pendingBooked` can only be
    /// armed by a POST that already left, so a dismiss that beat the response
    /// would otherwise leave it set with nothing to clear it, and the next
    /// abandoned booking would push into the previous one's lesson.
    private func book() {
        pendingBooked = nil
        isBooking = true
    }

    // MARK: Workspace

    private func workspace(_ student: Student) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                // §4.6: the header names the person AND their contextual role in
                // this relation, with the address that identifies them below.
                DetailHeaderView(
                    eyebrow: I18n.t("student.eyebrow"),
                    title: student.displayName,
                    meta: StudentCopy.relationContext(email: student.email)
                )
                PersonMarker(name: student.displayName, role: .student)
                // §3.4's single primary action, on the persistent header: the
                // one thing a Teacher comes here to DO, above the seven tabs
                // they come here to read.
                Button(I18n.t("student.book")) { book() }
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                tabRow
                panel(for: model.activeTab, student: student)
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var tabRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.sm) {
                ForEach(StudentCopy.Tab.allCases) { tab in
                    let isActive = tab == model.activeTab
                    Button {
                        model.select(tab)
                    } label: {
                        Text(tab.label)
                            .font(Typography.button)
                            .padding(.horizontal, Spacing.md)
                            .padding(.vertical, Spacing.sm)
                            .foregroundStyle(isActive ? Palette.onAccent : Palette.text)
                            .background(
                                isActive ? Palette.accent : Palette.surface2,
                                in: Capsule()
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(isActive ? [.isSelected] : [])
                }
            }
            .padding(.vertical, Spacing.xs)
        }
    }

    @ViewBuilder
    private func panel(for tab: StudentCopy.Tab, student: Student) -> some View {
        switch tab {
        case .oversikt: overviewPanel
        case .lektioner: lessonsPanel
        case .pass: sessionsPanel
        case .planer: plansPanel
        case .mal: goalsPanel
        case .hastar: horsesPanel
        case .historik: historyPanel(student)
        }
    }

    // MARK: Översikt

    /// The overview has no empty state of its own — every card states its own
    /// absence, and its own source's failure.
    private var overviewPanel: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            OverviewCard(
                label: I18n.t("student.overview.nextLesson"),
                value: nextLessonValue,
                meta: model.nextLesson.map { StudentCopy.lessonTitle($0) },
                route: model.nextLesson.map { Route.lesson(id: $0.id) }
            )
            OverviewCard(
                label: I18n.t("student.overview.latestSession"),
                value: latestSessionValue,
                meta: model.latestSession.map { StudentCopy.sessionTitle($0) },
                route: model.latestSession.map { Route.trainingSession(id: $0.id) }
            )
            OverviewCard(
                label: I18n.t("student.overview.activePlans"),
                value: model.plans.hasFailed
                    ? I18n.t("student.overview.unavailable")
                    : (model.plans.data == nil ? "…" : StudentCopy.planCountLabel(model.myPlans.count)),
                meta: nil,
                route: nil
            )
            OverviewCard(
                label: I18n.t("student.overview.sharedGoals"),
                // No "x av y": the total would disclose the existence of Goals
                // this Student did not share.
                value: model.goals.hasFailed
                    ? I18n.t("student.overview.unavailable")
                    : (model.goals.data == nil
                        ? "…"
                        : StudentCopy.goalCountLabel(StudentCopy.sharedGoalCount(model.myGoals))),
                meta: I18n.t("student.overview.sharedGoals.meta"),
                route: nil
            )
            VStack(alignment: .leading, spacing: Spacing.md) {
                SectionHeader(I18n.t("student.overview.activity"))
                switch model.activityState {
                case .unavailable:
                    Text(I18n.t("student.overview.unavailable"))
                        .font(Typography.body)
                        .foregroundStyle(Palette.textMuted)
                case .empty:
                    Text(I18n.t("student.overview.activity.empty"))
                        .font(Typography.body)
                        .foregroundStyle(Palette.textMuted)
                case .silent:
                    EmptyView()
                }
                ForEach(model.recentActivity) { item in
                    NavigationLink(value: item.route) {
                        ActivityRow(item: item)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var nextLessonValue: String {
        if model.lessons.hasFailed { return I18n.t("student.overview.unavailable") }
        guard model.lessons.data != nil else { return "…" }
        guard let next = model.nextLesson else { return I18n.t("student.overview.nextLesson.none") }
        return StudentCopy.occasionWhen(next.scheduledAt)
    }

    private var latestSessionValue: String {
        if model.sessions.hasFailed { return I18n.t("student.overview.unavailable") }
        guard model.sessions.data != nil else { return "…" }
        guard let latest = model.latestSession else { return I18n.t("student.overview.latestSession.none") }
        return StudentCopy.occasionWhen(latest.performedAt)
    }

    // MARK: Lektioner

    /// No person marker on these rows: §4.6 avoids a marker when the context is
    /// already unambiguous, and every row here is about the person in the header.
    private var lessonsPanel: some View {
        TabPanel(
            prefix: "student.lessons",
            isLoading: model.lessons.isLoading,
            isResolved: model.lessons.isResolved,
            hasFailed: model.lessons.hasFailed,
            isEmpty: model.lessons.isResolved && !model.lessons.hasFailed && model.myLessons.isEmpty,
            // "Boka den första lektionen" is what the empty body promises, so
            // the empty state offers exactly that rather than reading as a dead
            // end (web: the same `student.book` action on this panel).
            emptyActionTitle: I18n.t("student.book"),
            emptyAction: book,
            retry: { model.reloadTab(.lektioner) }
        ) {
            let groups = model.groupedLessons
            if !groups.upcoming.isEmpty {
                SectionHeader(I18n.t("lessons.group.upcoming"))
                ForEach(groups.upcoming) { lesson in lessonRow(lesson) }
            }
            if !groups.past.isEmpty {
                SectionHeader(I18n.t("lessons.group.past"))
                ForEach(groups.past) { lesson in lessonRow(lesson) }
            }
        }
    }

    private func lessonRow(_ lesson: LessonForUser) -> some View {
        NavigationLink(value: Route.lesson(id: lesson.id)) {
            OccasionRow(
                date: OccasionDateBlock(iso: lesson.scheduledAt),
                title: StudentCopy.lessonTitle(lesson),
                meta: [lesson.horseName, StudentCopy.lessonExerciseSummary(lesson.exercises)].compactMap { $0 },
                chips: (lesson.planTitle.map { [StudentCopy.lessonPlanChip($0)] } ?? [])
                    + StudentCopy.lessonProgramChips(lesson),
                status: lesson.status.chip,
                isMuted: lesson.status == .cancelled
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: Pass

    /// Only Training Sessions explicitly shared with this Teacher — enforced by
    /// the endpoint. No sharing chip: every row here is shared with the reader
    /// by definition, so a chip would say the same thing on every row and naming
    /// the recipient would mean naming the reader to themselves. The standing
    /// lede states the rule once instead.
    private var sessionsPanel: some View {
        TabPanel(
            prefix: "student.sessions",
            isLoading: model.sessions.isLoading,
            isResolved: model.sessions.isResolved,
            hasFailed: model.sessions.hasFailed,
            isEmpty: model.sessions.isEmptyList(),
            lede: I18n.t("student.sessions.lede"),
            retry: { model.reloadTab(.pass) }
        ) {
            ForEach(model.mySessions) { session in
                NavigationLink(value: Route.trainingSession(id: session.id)) {
                    OccasionRow(
                        date: OccasionDateBlock(iso: session.performedAt),
                        title: StudentCopy.sessionTitle(session),
                        meta: [StudentCopy.durationLabel(session.durationMin), session.horseName]
                            .compactMap { $0 },
                        chips: session.planTitle.map { [StudentCopy.sessionPlanChip($0)] } ?? []
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: Planer

    /// Active Plans, read-only. The Primary Teacher label is exactly that — a
    /// label; nothing here derives access from it.
    private var plansPanel: some View {
        TabPanel(
            prefix: "student.plans",
            isLoading: model.plans.isLoading,
            isResolved: model.plans.isResolved,
            hasFailed: model.plans.hasFailed,
            isEmpty: model.plans.isResolved && !model.plans.hasFailed && model.myPlans.isEmpty,
            retry: { model.reloadTab(.planer) }
        ) {
            ForEach(model.myPlans) { plan in
                NavigationLink(value: Route.plan(id: plan.id)) {
                    PlainRow(
                        title: plan.title,
                        meta: [
                            StudentCopy.dateRangeLabel(startDate: plan.startDate, endDate: plan.endDate),
                            StudentCopy.primaryTeacherLabel(plan.primaryTeacherDisplayName),
                        ].compactMap { $0 },
                        status: plan.status.chip
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: Mål

    /// Goals explicitly shared with this Teacher. A Goal reachable by title
    /// through a Plan is not shown here, and there is no count of the ones that
    /// are not. Status changes are not offered on the row — that judgement is
    /// made while reading the Goal, so the row links to the Goal instead.
    private var goalsPanel: some View {
        TabPanel(
            prefix: "student.goals",
            isLoading: model.goals.isLoading,
            isResolved: model.goals.isResolved,
            hasFailed: model.goals.hasFailed,
            isEmpty: model.goals.isEmptyList(),
            lede: I18n.t("student.goals.lede"),
            retry: { model.reloadTab(.mal) }
        ) {
            ForEach(model.myGoals) { goal in
                NavigationLink(value: Route.goal(id: goal.id)) {
                    PlainRow(
                        title: goal.title,
                        meta: [StudentCopy.targetDateLabel(goal.targetDate)].compactMap { $0 },
                        status: goal.status.chip
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: Hästar

    /// Non-archived Horses, read-only. The stable belongs to the Student.
    private var horsesPanel: some View {
        TabPanel(
            prefix: "student.horses",
            isLoading: model.horses.isLoading,
            isResolved: model.horses.isResolved,
            hasFailed: model.horses.hasFailed,
            isEmpty: model.horses.isResolved && !model.horses.hasFailed && model.myHorses.isEmpty,
            retry: { model.reloadTab(.hastar) }
        ) {
            WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.sm) {
                ForEach(model.myHorses) { horse in
                    Text(horse.name)
                        .font(Typography.label)
                        .foregroundStyle(Palette.text)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Palette.surface2, in: Capsule())
                }
            }
        }
    }

    // MARK: Historik

    /// Choose an Exercise, then open Övningshistorik for this Student. The
    /// picker is this tab; the history itself is its own screen.
    ///
    /// TODO(shell): the web's empty state exits to the Exercise library
    /// (`student.history.empty.action` → `/library`), which lives in ANOTHER
    /// TAB. A slice cannot switch tabs — the shell owns the selection — so the
    /// empty state is left without an action rather than given one that lands
    /// somewhere else. The exit belongs to `MainTabView`.
    private func historyPanel(_ student: Student) -> some View {
        TabPanel(
            prefix: "student.history",
            isLoading: model.exercises.isLoading,
            isResolved: model.exercises.isResolved,
            hasFailed: model.exercises.hasFailed,
            isEmpty: model.exercises.isEmptyList(),
            retry: { model.reloadTab(.historik) }
        ) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text(I18n.t("student.history.hint", ["name": student.displayName]))
                    .font(Typography.lede)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                Picker(I18n.t("student.history.field"), selection: historyPickBinding) {
                    Text(I18n.t("student.history.placeholder")).tag("")
                    ForEach(model.exercises.items()) { exercise in
                        Text(exercise.name).tag(exercise.id)
                    }
                }
                .pickerStyle(.menu)
                .tint(Palette.accent)
                if model.historyPick.isEmpty {
                    Button(I18n.t("student.history.open")) {}
                        .font(Typography.button)
                        .buttonStyle(.borderedProminent)
                        .tint(Palette.accent)
                        .disabled(true)
                } else {
                    NavigationLink(
                        value: Route.exerciseHistory(studentId: model.studentId, exerciseId: model.historyPick)
                    ) {
                        Text(I18n.t("student.history.open"))
                            .font(Typography.button)
                            .padding(.horizontal, Spacing.lg)
                            .padding(.vertical, Spacing.sm)
                            .foregroundStyle(Palette.onAccent)
                            .background(Palette.accent, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var historyPickBinding: Binding<String> {
        Binding(get: { model.historyPick }, set: { model.historyPick = $0 })
    }
}

// MARK: - Panel scaffold

/// One tab's body, in the IA §4 state grammar: lede, then loading, error with a
/// retry, empty, and only then content. Every tab gets its own copy of all four.
private struct TabPanel<Content: View>: View {
    let prefix: String
    let isLoading: Bool
    let isResolved: Bool
    let hasFailed: Bool
    let isEmpty: Bool
    var lede: String?
    var emptyActionTitle: String?
    var emptyAction: (() -> Void)?
    let retry: () -> Void
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            if let lede {
                Text(lede)
                    .font(Typography.lede)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if isLoading && !isResolved {
                LoadingView(I18n.t("\(prefix).loading"))
            }
            if hasFailed {
                ErrorStateView(
                    message: I18n.t("\(prefix).error"),
                    retryTitle: I18n.t("students.retry"),
                    retry: retry
                )
            }
            if isEmpty {
                EmptyStateView(
                    title: I18n.t("\(prefix).empty.heading"),
                    message: I18n.t("\(prefix).empty.body"),
                    actionTitle: emptyActionTitle,
                    action: emptyAction
                )
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        // No accessibility label here. `prefix` is a catalog NAMESPACE, so a
        // label built from it announced "student dot lessons"; and on a bare
        // VStack the label propagates DOWN onto every child rather than naming
        // a group, which relabels the rows the reader came for. The panel is
        // already named by the selected tab in the row above and by its own
        // `SectionHeader`s, which carry `.isHeader` — that is the navigable
        // structure VoiceOver needs.
    }
}

// MARK: - Rows

private struct OverviewCard: View {
    let label: String
    let value: String
    var meta: String?
    var route: Route?

    var body: some View {
        if let route {
            NavigationLink(value: route) { card }
                .buttonStyle(.plain)
        } else {
            card
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.groupLabel)
                .foregroundStyle(Palette.textMuted)
            Text(value)
                .font(Typography.bodyEmphasis)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            if let meta, !meta.isEmpty {
                Text(meta)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay { RoundedRectangle(cornerRadius: Radius.md).stroke(Palette.border) }
    }
}

private struct ActivityRow: View {
    let item: StudentCopy.ActivityItem

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.sm) {
            Text(StudentCopy.activityKindLabel(item.kind))
                .font(Typography.groupLabel)
                .foregroundStyle(Palette.textMuted)
            Text(item.title)
                .font(Typography.body)
                .foregroundStyle(Palette.text)
            Spacer(minLength: Spacing.sm)
            // Omitted when the timestamp will not parse: the row still names
            // the occasion, and a raw ISO string would say less than nothing.
            if let when = StudentCopy.activityWhen(item.at) {
                Text(when)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}

/// The non-occasion row shape: title, muted meta line, trailing status pill.
private struct PlainRow: View {
    let title: String
    let meta: [String]
    var status: StatusChip?

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(title)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                if !meta.isEmpty {
                    Text(meta.joined(separator: " · "))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: Spacing.sm)
            if let status { status }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay { RoundedRectangle(cornerRadius: Radius.md).stroke(Palette.border) }
    }
}
