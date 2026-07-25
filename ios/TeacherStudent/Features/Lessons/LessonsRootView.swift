import SwiftUI

/// Lektioner — IA §3.7. One shared timeline of every Lesson the reader teaches
/// OR attends, grouped Kommande / Tidigare.
///
/// **Creation is not on this screen.** The list puts retrieval first (IA §1);
/// booking opens in a dedicated panel from the single primary action, so the
/// first thing the view says is "here is your teaching" rather than "fill me
/// in".
///
/// The list makes no claim about who the reader IS. `role` is per Lesson, so the
/// same timeline holds occasions taught and occasions attended, and each row
/// states the counterparty in their contextual role. What the account can do is
/// asked one question at a time: **Boka lektion** appears when there is at least
/// one Student Relation, because that is what the create contract requires.
struct LessonsRootView: View {
    @State private var store = LessonsStore()
    /// The roster, purely to answer "may this account book?" (IA §3.7).
    @State private var students: [Student] = []
    @State private var studentsLoaded = false
    /// Frozen at mount. Re-reading the clock inside the grouping would move a
    /// Lesson from Kommande to Tidigare mid-render, on nothing the view watched.
    @State private var nowISO = LessonCopy.nowTimestamp()
    @State private var isBooking = false
    /// Held from the moment the booking succeeds until the panel has closed.
    @State private var pendingBooked: Booked?
    /// The pushed Lesson. Non-nil for exactly as long as it is on the stack —
    /// SwiftUI clears it when the reader comes back.
    @State private var booked: Booked?

    /// What was just booked — the push target, and the acknowledgement that
    /// travels with it.
    ///
    /// The web navigates straight to the created Lesson rather than returning to
    /// this list, and that is not a preference: when a follow-up attach or PATCH
    /// failed, the Lesson is booked but missing its Horse or a Program, and the
    /// detail view is the ONLY place either can be added. Landing back on a list
    /// with a notice that expires puts the reader one Back-and-tap away from the
    /// only screen that can fix what the notice just told them about.
    ///
    /// `Hashable` because that is what `navigationDestination(item:)` takes —
    /// the one programmatic push a feature slice can make without a path binding
    /// from the shell.
    private struct Booked: Hashable {
        let id: String
        let incomplete: Bool

        var notice: LessonNotice {
            LessonNotice(
                message: I18n.t(incomplete ? "lessonCreate.createdPartial" : "lessonCreate.created"),
                tone: incomplete ? .warning : .success
            )
        }
    }

    private var canBook: Bool { !students.isEmpty }

    /// Empty is a CONCLUSION, not a starting state: nothing arrived, nothing is
    /// in flight, and nothing failed. Anything less and the reader is told they
    /// have no lessons while the request is still open (IA §4).
    ///
    /// The roster has to have settled too — the two empty variants say different
    /// things, and showing the rider's while the roster is still in flight would
    /// tell a teacher they have no students a moment before proving otherwise.
    private var isEmpty: Bool {
        store.items.isEmpty && !store.isLoading && store.error == nil && store.hasLoaded && studentsLoaded
    }

    private var grouped: OccasionGrouping.Split<LessonForUser> {
        OccasionGrouping.split(store.items, nowISO: nowISO, at: \.scheduledAt)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                // A failed RELOAD keeps the list it failed to replace: the rows
                // on screen are still the last thing the server said. This is
                // what a silent re-entry refresh degrades to — never the
                // full-screen error state, which would throw away good content
                // for a request the reader never asked for.
                if store.error != nil && !store.items.isEmpty {
                    LessonErrorBanner { Task { await store.load() } }
                }

                content
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("lessons.heading"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if canBook {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(I18n.t("lessons.book")) { book() }
                        .font(Typography.button)
                }
            }
        }
        // Every appearance, not just the first — re-entry after the detail view
        // changed something must not still read "Planerad" here. There is
        // deliberately NO second `.onAppear` refresh beside this: `.task` is
        // started on appear and cancelled on disappear, so adding one issues two
        // concurrent `GET /lessons` on every pop-back, and whichever finishes
        // first clears `isLoading` out from under the other.
        .task { await load() }
        .refreshable {
            nowISO = LessonCopy.nowTimestamp()
            await store.load()
        }
        .sheet(isPresented: $isBooking, onDismiss: {
            // The push waits for the panel to be GONE. A navigation started
            // while a sheet is still dismissing is the one SwiftUI drops, and
            // dropping this one strands the reader on the list with a Lesson
            // they were told is missing something.
            booked = pendingBooked
            pendingBooked = nil
        }) {
            LessonCreateSheet(store: store, students: students) { outcome in
                pendingBooked = Booked(id: outcome.lesson.id, incomplete: outcome.incomplete)
            }
        }
        // Land on the thing that was just made, as the web does. The
        // acknowledgement rides along rather than staying here: it is about a
        // Lesson, and where it says something is missing, the destination is the
        // only place to add it.
        .navigationDestination(item: $booked) { booked in
            LessonDetailView(lessonId: booked.id, arrival: booked.notice)
        }
    }

    @ViewBuilder
    private var content: some View {
        if store.isLoading && store.items.isEmpty {
            LoadingView(I18n.t("lessons.loading"))
                .frame(minHeight: 200)
        } else if store.error != nil && store.items.isEmpty {
            ErrorStateView(
                message: I18n.t("lessons.error"),
                retryTitle: I18n.t("lessons.retry")
            ) {
                Task { await store.load() }
            }
        } else if isEmpty {
            emptyState
        } else {
            groups
        }
    }

    /// Two variants, split on whether the account has a Student Relation.
    ///
    /// - **has Students** — a teacher who has not booked yet; the exit is the
    ///   same booking panel the header opens.
    /// - **no Students** — covers "no Lessons as rider" AND "no Students as
    ///   teacher", which are indistinguishable from the client: an account with
    ///   neither looks the same whether the person is waiting to be taught or
    ///   waiting to teach. The body addresses both, and creation is omitted
    ///   exactly as IA §3.7 requires.
    ///
    /// IA §3.7 requires the rider variant to LINK to **Bjud in elev** — an
    /// empty state that teaches a capability and then offers no way to reach it
    /// is the one shape §4 rules out. `Route` cannot express a list root, and a
    /// slice cannot select a tab, but the shell registers `NavSection` as a
    /// navigation destination on every stack, so pushing `.students` reaches the
    /// roster with Lektioner still under it in the Back stack. Existing seam, no
    /// new one invented — and a push that keeps its origin is arguably the
    /// better phone answer to the web's tab jump.
    ///
    /// The exit is a link rather than `EmptyStateView`'s closure action for the
    /// same reason every other push in this slice is: a `NavigationLink` is the
    /// only push available, so the button is drawn beside the state view in the
    /// state view's own primary recipe.
    @ViewBuilder
    private var emptyState: some View {
        if canBook {
            EmptyStateView(
                title: I18n.t("lessons.empty.teacher.heading"),
                message: I18n.t("lessons.empty.teacher.body"),
                actionTitle: I18n.t("lessons.book"),
                action: book
            )
        } else {
            VStack(spacing: 0) {
                EmptyStateView(
                    title: I18n.t("lessons.empty.rider.heading"),
                    message: I18n.t("lessons.empty.rider.body")
                )
                NavigationLink(value: NavSection.students) {
                    Text(I18n.t("lessons.empty.rider.action"))
                        .font(Typography.button)
                }
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
            }
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private var groups: some View {
        let split = grouped
        VStack(alignment: .leading, spacing: Spacing.xl) {
            if !split.upcoming.isEmpty {
                group(label: I18n.t("lessons.group.upcoming"), lessons: split.upcoming)
            }
            if !split.past.isEmpty {
                group(label: I18n.t("lessons.group.past"), lessons: split.past)
            }
        }
    }

    private func group(label: String, lessons: [LessonForUser]) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(label)
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(lessons.enumerated()), id: \.element.id) { index, lesson in
                    if index > 0 { Divider().overlay(Palette.border) }
                    row(lesson)
                }
            }
        }
    }

    /// The row is ONE target — the Lesson. Its chips are labels, never links,
    /// because §4.3 allows exactly one destination per row.
    private func row(_ lesson: LessonForUser) -> some View {
        NavigationLink(value: Route.lesson(id: lesson.id)) {
            OccasionRow(
                date: OccasionDateBlock(iso: lesson.scheduledAt),
                title: LessonCopy.title(lesson),
                counterparty: OccasionRow.Person(
                    name: lesson.counterpartyDisplayName,
                    role: LessonCopy.counterpartyRole(lesson.role)
                ),
                meta: meta(lesson),
                chips: chips(lesson),
                status: lesson.status.chip,
                // Cancelled rows stay READABLE — muted ranks them, the dashed
                // pill and its ✕ carry the meaning (IA §3.7).
                isMuted: lesson.status == .cancelled
            )
        }
        .buttonStyle(.plain)
    }

    private func meta(_ lesson: LessonForUser) -> [String] {
        var parts: [String] = []
        if let horseName = lesson.horseName, !horseName.isEmpty { parts.append(horseName) }
        parts.append(LessonCopy.exerciseSummary(lesson.exercises))
        return parts
    }

    private func chips(_ lesson: LessonForUser) -> [String] {
        var labels: [String] = []
        if let planTitle = lesson.planTitle, !planTitle.isEmpty {
            labels.append(LessonCopy.planChipLabel(planTitle))
        }
        labels.append(contentsOf: LessonCopy.programBadges(lesson.programs).map(LessonCopy.programChipLabel))
        return labels
    }

    /// The roster load runs alongside the timeline and its failure is SILENT:
    /// this list is not the students screen, and a rider legitimately has no
    /// roster. All it decides is whether booking is offered, and "not offered"
    /// is the safe answer either way.
    /// Open the booking panel from a clean slate.
    ///
    /// `pendingBooked` is disarmed here as well as on dismiss. It is armed by a
    /// POST that has already left, and a dismiss that beat the response would
    /// otherwise leave it set with nothing to clear it — so the NEXT booking the
    /// reader abandons would push them into a lesson from the last one.
    private func book() {
        pendingBooked = nil
        isBooking = true
    }

    @MainActor
    private func load() async {
        async let roster = Api.shared.students.list()
        await store.load()
        do {
            students = try await roster
            studentsLoaded = true
        } catch is CancellationError {
            // Settle NOTHING. `studentsLoaded` is what lets `isEmpty` choose
            // between the two empty states, and an abandoned request that
            // settled to `[]` would tell a teacher with a full roster that they
            // have no teacher yet — and hide the booking button that disproves
            // it. The next appearance re-runs this.
        } catch {
            students = []
            studentsLoaded = true
        }
    }
}
