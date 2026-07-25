import SwiftUI

/// Lektion — IA §3.8. The Teacher's cockpit and the Student's record of the same
/// taught occasion, in the information order the IA fixes: detail header, the
/// occasion's own details, source Programs, Övningar with a thread per
/// occurrence, then the Lesson's own thread.
///
/// Two things shape this screen more than the layout does.
///
/// **One view, two readers.** There is no separate student view. The same screen
/// serves both roles and the difference is which CONTROLS exist — a student
/// reads the structure and writes notes; only the teacher changes what the
/// lesson is. `LessonCopy.controls` is the single place that decides, so no
/// section here re-tests the status inline.
///
/// **Terminal is not read-only.** Once a Lesson is completed or cancelled the
/// server answers 409 for adding or removing Exercises and for attaching or
/// detaching Programs, so those controls are WITHHELD rather than disabled — a
/// control that can only fail is worse than no control. What stays open is
/// deliberate: reschedule/horse/plan, because a lesson recorded on the wrong
/// horse must remain correctable, and notes at both levels, because most
/// feedback on a lesson is written after it is taught. That is the whole reason
/// a finished Lesson is still worth opening.
struct LessonDetailView: View {
    let lessonId: String

    /// Explicit because the synthesized memberwise initializer would be private:
    /// this view holds private `@State`, and that decides its access level.
    ///
    /// `arrival` is the notice the caller wants shown the moment this screen
    /// appears — the booking flow lands here rather than back on the list, and
    /// "bokad, men allt kunde inte läggas till" belongs on the only screen where
    /// the missing Horse or Program can actually be added.
    init(lessonId: String, arrival: LessonNotice? = nil) {
        self.lessonId = lessonId
        _notice = State(initialValue: arrival)
    }

    @Environment(\.dismiss) private var dismiss

    @State private var store = LessonsStore()

    /// What the single-Lesson read settled on. Nothing is drawn before it does —
    /// least of all a "not found" the reader would have to watch being disproved
    /// (IA §4).
    ///
    /// `notFound` and `failed` are kept apart because they want opposite screens:
    /// a 404 is a final answer and the way out is BACK, while a 500 or a dropped
    /// connection says nothing about whether the Lesson exists and the way out is
    /// a RETRY. Collapsing them tells a student on a flaky connection that the
    /// lesson they booked does not exist.
    private enum Resolution {
        case pending, ready, notFound, failed
    }

    @State private var resolution: Resolution = .pending

    // Teacher-only picker material. A student never triggers these loads.
    @State private var horses: [Horse] = []
    @State private var plans: [Plan] = []
    @State private var library: [Exercise] = []
    @State private var programs: [Program] = []

    /// Whether a picker's catalog is IN, as opposed to empty — `LessonCatalogLoad`
    /// for both, so the two pickers answer the question the same way.
    ///
    /// All THREE cases are drawn here, `pending` included. The controls these
    /// catalogs feed exist only when there is something to offer, so a catalog
    /// that has not answered yet renders as no control at all — which on this
    /// screen is how "this Lesson cannot have one" also looks. A teacher who
    /// opens a finished Lesson gets no Lägg till övning, and a teacher whose
    /// library is still in flight would get the same nothing. So `pending` says
    /// so, in the place the control will take.
    @State private var libraryLoad: LessonCatalogLoad = .pending
    @State private var programsLoad: LessonCatalogLoad = .pending

    @State private var when = Date()
    @State private var horseId = ""
    @State private var planId = ""
    @State private var programPick = ""
    @State private var exercisePick = ""
    @State private var openNotes: Set<String> = []
    @State private var pendingTransition: LessonTransitionTarget?
    @State private var notice: LessonNotice?

    private var lesson: LessonForUser? { store.lesson(id: lessonId) }

    /// The control matrix, recomputed from whatever the server last said.
    private var controls: LessonCopy.Controls {
        guard let lesson else { return .none }
        return LessonCopy.controls(status: lesson.status, role: lesson.role)
    }

    var body: some View {
        Group {
            switch resolution {
            case .pending:
                LoadingView(I18n.t("lesson.loading"))
                    .frame(maxHeight: .infinity)
            case .notFound:
                notFound
            case .failed:
                // NOT the not-found screen: nothing here says this Lesson does
                // not exist, only that we could not find out. So the exit is the
                // retry IA §4 requires for every failed read — a way back would
                // send the reader off a screen that may be perfectly fine.
                ErrorStateView(
                    message: I18n.t("lesson.error"),
                    retryTitle: I18n.t("lessons.retry")
                ) {
                    Task { await resolve() }
                }
            case .ready:
                if let lesson {
                    content(lesson)
                } else {
                    // Resolved once, and then the row left `items` — the same
                    // final answer a 404 gives.
                    notFound
                }
            }
        }
        .frame(maxWidth: .infinity)
        .background(Palette.bg)
        .navigationTitle(I18n.t("objectKind.lesson"))
        .navigationBarTitleDisplayMode(.inline)
        .task { await resolve() }
        .alert(
            pendingTransition == .cancelled
                ? I18n.t("lesson.confirm.cancel.title")
                : I18n.t("lesson.confirm.complete.title"),
            isPresented: Binding(
                get: { pendingTransition != nil },
                set: { if !$0 { pendingTransition = nil } }
            )
        ) {
            // §4.12: a dialog before a TERMINAL change, stating the consequence.
            // Both messages name what becomes impossible AND what stays possible
            // — "Är du säker?" is on the spec's Undvik list.
            if let target = pendingTransition {
                Button(
                    I18n.t(target == .cancelled ? "lesson.action.cancel" : "lesson.action.complete"),
                    role: target == .cancelled ? .destructive : nil
                ) {
                    pendingTransition = nil
                    Task { await transition(target) }
                }
            }
            Button(I18n.t("lesson.confirm.dismiss"), role: .cancel) { pendingTransition = nil }
        } message: {
            Text(I18n.t(
                pendingTransition == .cancelled
                    ? "lesson.confirm.cancel.message"
                    : "lesson.confirm.complete.message"
            ))
        }
    }

    // MARK: - Body

    /// Missing and not-yours render identically — the server answers 404 for
    /// both, which is leak-safe and true (IA §3.8). Retrying will not help, so
    /// the one exit is a way back rather than a retry button.
    private var notFound: some View {
        NotFoundView(
            title: I18n.t("lesson.notFound.heading"),
            message: I18n.t("lesson.notFound.body"),
            actionTitle: I18n.t("lesson.notFound.action"),
            action: { dismiss() }
        )
    }

    private func content(_ lesson: LessonForUser) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                header(lesson)
                parentChips(lesson)

                if let notice {
                    LessonNoticeBar(notice: notice) { self.notice = nil }
                }
                if LessonCopy.isConflict(store.error) {
                    LessonConflictBanner { Task { await resolve() } }
                } else if store.error != nil {
                    LessonErrorBanner { Task { await resolve() } }
                }
                if controls.lockNotice {
                    Text(LessonCopy.lockNotice(lesson.status))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if controls.editDetails {
                    detailsSection(lesson)
                }
                if controls.editPrograms {
                    programsSection(lesson)
                }
                exercisesSection(lesson)
                lessonThread(lesson)
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func header(_ lesson: LessonForUser) -> some View {
        DetailHeaderView(
            eyebrow: I18n.t("objectKind.lesson"),
            title: LessonCopy.title(lesson),
            status: lesson.status.chip,
            // Who this occasion is shared with, named (§4.5). A Lesson is always
            // shared with its counterparty — that is what a Lesson IS.
            recipients: counterparty(lesson),
            shared: true,
            primaryAction: controls.transition
                ? DetailHeaderAction(label: I18n.t("lesson.action.complete")) {
                    pendingTransition = .completed
                }
                : nil,
            secondaryActions: controls.transition
                ? [DetailHeaderAction(label: I18n.t("lesson.action.cancel")) {
                    pendingTransition = .cancelled
                }]
                : [],
            meta: LessonCopy.headerMeta(lesson)
        )
    }

    /// The walk upward: the Plan, and each source Program (IA §1 — "every detail
    /// view must expose its parents as links").
    ///
    /// Drawn beside the header rather than inside it. `DetailHeaderChip` wants a
    /// `navigate` closure, and a feature slice cannot push: `MainTabView` builds
    /// its `NavigationStack` with no path binding, so a `NavigationLink` is the
    /// only push available. Same chips, same recipe, one level down the view
    /// tree.
    @ViewBuilder
    private func parentChips(_ lesson: LessonForUser) -> some View {
        let hasPlan = lesson.planId != nil && lesson.planTitle != nil
        if hasPlan || !lesson.programs.isEmpty {
            WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
                if let planId = lesson.planId, let planTitle = lesson.planTitle {
                    LessonRouteChip(
                        label: LessonCopy.planChipLabel(planTitle),
                        route: .plan(id: planId)
                    )
                }
                ForEach(lesson.programs) { program in
                    LessonRouteChip(
                        label: LessonCopy.programChipLabel(program),
                        route: .program(id: program.id)
                    )
                }
            }
        }
    }

    // MARK: - Details

    private func detailsSection(_ lesson: LessonForUser) -> some View {
        section(I18n.t("lesson.section.details")) {
            LessonPanel {
                LessonField(label: I18n.t("lesson.field.when")) {
                    DatePicker(
                        I18n.t("lesson.field.when"),
                        selection: $when,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .labelsHidden()
                    .environment(\.locale, I18n.locale)
                }
                LessonField(label: I18n.t("lesson.field.horse")) {
                    Picker(I18n.t("lesson.field.horse"), selection: $horseId) {
                        Text(I18n.t("lesson.horse.none")).tag("")
                        ForEach(LessonCopy.bookableHorses(horses)) { horse in
                            Text(horse.name).tag(horse.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(Palette.accentStrong)
                    .labelsHidden()
                }
                LessonField(label: I18n.t("lesson.field.plan")) {
                    Picker(I18n.t("lesson.field.plan"), selection: $planId) {
                        Text(I18n.t("lesson.plan.none")).tag("")
                        ForEach(LessonCopy.bookablePlans(plans)) { plan in
                            Text(plan.title).tag(plan.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(Palette.accentStrong)
                    .labelsHidden()
                }
                Button(I18n.t("lesson.save")) { Task { await saveDetails(lesson) } }
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .disabled(store.isLoading)
            }
        }
    }

    // MARK: - Programs

    private func programsSection(_ lesson: LessonForUser) -> some View {
        section(I18n.t("lesson.section.programs")) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                // Stated where it can be acted on: detaching a source does not
                // withdraw the Exercises it already copied in (IA §3.8).
                Text(I18n.t("lesson.programs.detachHint"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)

                if lesson.programs.isEmpty {
                    Text(I18n.t("lesson.programs.empty"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                } else {
                    ForEach(lesson.programs) { program in
                        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
                            Text(program.title)
                                .font(Typography.body)
                                .foregroundStyle(Palette.text)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Button(I18n.t("lesson.programs.detach")) {
                                Task { await detachProgram(lesson, program) }
                            }
                            .font(Typography.caption)
                            .buttonStyle(.plain)
                            .foregroundStyle(Palette.danger)
                        }
                        .padding(.vertical, Spacing.xs)
                    }
                }

                if programsLoad == .failed {
                    // The catalog read failed, so `programs` is empty for a
                    // reason that has nothing to do with how many Programs this
                    // teacher owns. Hiding the control here would make a dropped
                    // request look like a capability the reader does not have.
                    LessonLoadFailureRow(message: I18n.t("lesson.programs.loadError")) {
                        Task { await reloadPrograms() }
                    }
                } else if programsLoad == .pending {
                    // Still asking. Without this the reader sees the same
                    // nothing a terminal Lesson shows, and concludes that Koppla
                    // program is not on offer here — a conclusion the answer,
                    // arriving a second later, then contradicts.
                    LessonCatalogLoadingRow(message: I18n.t("programs.loading"))
                } else if !attachableePrograms(lesson).isEmpty {
                    HStack(spacing: Spacing.sm) {
                        Picker(I18n.t("lesson.programs.placeholder"), selection: $programPick) {
                            Text(I18n.t("lesson.programs.placeholder")).tag("")
                            ForEach(attachableePrograms(lesson)) { program in
                                Text(program.title).tag(program.id)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(Palette.accentStrong)
                        .labelsHidden()
                        Button(I18n.t("lesson.programs.attach")) {
                            Task { await attachProgram(lesson) }
                        }
                        .font(Typography.button)
                        .buttonStyle(.bordered)
                        .tint(Palette.accent)
                        .disabled(programPick.isEmpty)
                    }
                }
            }
        }
    }

    /// Everything not already attached — offering an attached Program would be
    /// offering a call that changes nothing.
    private func attachableePrograms(_ lesson: LessonForUser) -> [Program] {
        let attached = Set(lesson.programs.map(\.id))
        return programs.filter { !attached.contains($0.id) }
    }

    // MARK: - Exercise occurrences

    private func exercisesSection(_ lesson: LessonForUser) -> some View {
        section(I18n.t("lesson.section.exercises")) {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if lesson.exercises.isEmpty {
                    Text(I18n.t("lesson.exercises.empty"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                } else {
                    let ordered = LessonCopy.orderedExercises(lesson.exercises)
                    ForEach(Array(ordered.enumerated()), id: \.element.id) { index, occurrence in
                        occurrenceRow(lesson, occurrence, ordinal: index + 1)
                        if index < ordered.count - 1 {
                            Divider().overlay(Palette.border)
                        }
                    }
                }

                if controls.editExercises && libraryLoad == .failed {
                    // Same reasoning as the Program picker: an empty library and
                    // a library that could not be read are the same array, and
                    // only one of them means "nothing left to add".
                    LessonLoadFailureRow(message: I18n.t("lesson.exercises.loadError")) {
                        Task { await reloadLibrary() }
                    }
                } else if controls.editExercises && libraryLoad == .pending {
                    // Same again: the library is the only thing standing between
                    // the reader and Lägg till övning, so while it is in flight
                    // the section says that rather than showing the empty space a
                    // completed Lesson shows. Gated on `editExercises` like the
                    // controls it stands in for — a student never asks for the
                    // library, so their `pending` is permanent and means nothing.
                    LessonCatalogLoadingRow(message: I18n.t("library.loading"))
                } else if controls.editExercises && !addableExercises(lesson).isEmpty {
                    HStack(spacing: Spacing.sm) {
                        Picker(I18n.t("lesson.exercise.placeholder"), selection: $exercisePick) {
                            Text(I18n.t("lesson.exercise.placeholder")).tag("")
                            ForEach(addableExercises(lesson)) { exercise in
                                Text(exercise.name).tag(exercise.id)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(Palette.accentStrong)
                        .labelsHidden()
                        Button(I18n.t("lesson.exercise.add")) {
                            Task { await addExercise(lesson) }
                        }
                        .font(Typography.button)
                        .buttonStyle(.bordered)
                        .tint(Palette.accent)
                        .disabled(exercisePick.isEmpty)
                    }
                }
            }
        }
    }

    private func addableExercises(_ lesson: LessonForUser) -> [Exercise] {
        let linked = Set(lesson.exercises.map(\.exerciseId))
        return library.filter { !linked.contains($0.id) }
    }

    private func occurrenceRow(
        _ lesson: LessonForUser,
        _ occurrence: LessonExerciseRef,
        ordinal: Int
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
                Text("\(ordinal).")
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .monospacedDigit()
                Text(occurrence.name)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                if let source = LessonCopy.exerciseSource(occurrence, programs: lesson.programs) {
                    Text(source)
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        .padding(.horizontal, Spacing.sm)
                        .padding(.vertical, 2)
                        .overlay { Capsule().strokeBorder(Palette.border, lineWidth: 1) }
                }
            }

            // The instructional row note, copied verbatim from the source
            // Program at snapshot time. Not the thread — that hangs off the
            // occurrence's own id, below.
            if let note = LessonCopy.rowNote(occurrence) {
                Text(note)
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            WrapLayout(horizontalSpacing: Spacing.lg, verticalSpacing: Spacing.xs) {
                Button(I18n.t(openNotes.contains(occurrence.id)
                    ? "lesson.exercise.notesHide"
                    : "lesson.exercise.notesShow")) {
                    toggleNotes(occurrence.id)
                }
                .font(Typography.caption)
                .buttonStyle(.plain)
                .foregroundStyle(Palette.accentStrong)

                // The same Exercise across every Lesson this Student has ridden
                // (IA §3.16) — the reason an occurrence is worth naming at all.
                NavigationLink(value: Route.exerciseHistory(
                    studentId: lesson.studentId,
                    exerciseId: occurrence.exerciseId
                )) {
                    Text(I18n.t("lesson.exercise.history"))
                        .font(Typography.caption)
                        .foregroundStyle(Palette.accentStrong)
                }
                .buttonStyle(.plain)

                // Withheld, not disabled: past a terminal transition the server
                // answers 409 for this call.
                if controls.editExercises {
                    Button(I18n.t("lesson.exercise.remove")) {
                        Task { await removeExercise(lesson, occurrence) }
                    }
                    .font(Typography.caption)
                    .buttonStyle(.plain)
                    .foregroundStyle(Palette.danger)
                }
            }

            if openNotes.contains(occurrence.id) {
                NoteThreadView(
                    parentKind: .lessonExercise,
                    // The OCCURRENCE, not the catalog Exercise: feedback belongs
                    // to the time it was ridden, and one Lesson can hold the same
                    // Exercise twice.
                    parentId: occurrence.id,
                    context: [I18n.t("objectKind.exercise"), occurrence.name].joined(separator: " · "),
                    recipients: counterparty(lesson),
                    roleOf: { note in roleOf(note, in: lesson) },
                    headingLevel: 4
                )
                .padding(.top, Spacing.sm)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func toggleNotes(_ id: String) {
        if openNotes.contains(id) {
            openNotes.remove(id)
        } else {
            openNotes.insert(id)
        }
    }

    // MARK: - Lesson thread

    /// Open at every status — this is the feedback loop, and it is what makes a
    /// terminal Lesson worth opening at all.
    private func lessonThread(_ lesson: LessonForUser) -> some View {
        NoteThreadView(
            parentKind: .lesson,
            parentId: lesson.id,
            context: LessonCopy.threadContext(lesson),
            recipients: counterparty(lesson),
            roleOf: { note in roleOf(note, in: lesson) }
        )
    }

    /// Who a shared Note here reaches: the other party, by name (§4.5).
    private func counterparty(_ lesson: LessonForUser) -> [ShareRecipient] {
        let id = lesson.role == .student ? lesson.teacherId : lesson.studentId
        return [ShareRecipient(id: id, name: lesson.counterpartyDisplayName)]
    }

    /// On a Lesson the teacher is whoever TAUGHT it, not whoever is reading.
    private func roleOf(_ note: Note, in lesson: LessonForUser) -> PersonRole {
        note.authorId == lesson.teacherId ? .teacher : .student
    }

    // MARK: - Layout helper

    private func section<Content: View>(
        _ title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text(title)
                .font(Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .accessibilityAddTraits(.isHeader)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Behaviour

    private func resolve() async {
        switch await store.loadOne(id: lessonId) {
        case .loaded(let lesson):
            syncForm(lesson)
            resolution = .ready
            await loadPickerMaterial(for: lesson)
        case .notFound:
            resolution = .notFound
        case .failed:
            // A failed RE-read over a Lesson already on screen keeps the Lesson:
            // `content` carries a banner for exactly that, and replacing a
            // readable page with an error screen loses more than it explains.
            // Only a first read that never arrived owns the whole view.
            resolution = lesson == nil ? .failed : .ready
        case .cancelled:
            // The reader left mid-flight. Nothing settled, so nothing moves —
            // least of all into a state this view would paint on the way out.
            break
        }
    }

    /// Only the teacher can act on this Lesson's structure, so only the teacher
    /// pays for the pickers' data.
    ///
    /// Horses and Plans fail QUIETLY: their controls render either way, and the
    /// worst a failed read costs is a shorter menu beside a value that is still
    /// shown. The two catalogs below are different — their controls exist only
    /// when the catalog has something in it, so a swallowed failure removes a
    /// capability. Those are tracked.
    private func loadPickerMaterial(for lesson: LessonForUser) async {
        guard lesson.role == .teacher else { return }
        async let stable = Api.shared.students.listHorses(id: lesson.studentId)
        async let studentPlans = Api.shared.students.listPlans(id: lesson.studentId)
        async let catalog: Void = reloadLibrary()
        async let ownPrograms: Void = reloadPrograms()
        horses = (try? await stable) ?? []
        plans = (try? await studentPlans) ?? []
        await catalog
        await ownPrograms
    }

    private func reloadLibrary() async {
        // A RETRY re-enters the loading state, so pressing it does something the
        // reader can see; a re-read over a catalog already in hand does not, so a
        // resolve() in the background never blanks a working control. Same rule
        // as the lists elsewhere: a refresh keeps what it has until it is beaten.
        if libraryLoad == .failed { libraryLoad = .pending }
        do {
            library = try await Api.shared.exercises.list()
            libraryLoad = .loaded
        } catch is CancellationError {
            // The reader left. Leave the flag where it was rather than reporting
            // a failure onto a screen that is on its way out.
        } catch {
            library = []
            libraryLoad = .failed
        }
    }

    private func reloadPrograms() async {
        // Same rule as `reloadLibrary()`: the retry shows itself working, the
        // background re-read leaves the control it already drew alone.
        if programsLoad == .failed { programsLoad = .pending }
        do {
            programs = try await Api.shared.programs.list()
            programsLoad = .loaded
        } catch is CancellationError {
        } catch {
            programs = []
            programsLoad = .failed
        }
    }

    /// Point the form at what the server last said. Called on every resolve, so
    /// a save that lands elsewhere does not leave stale values in the controls.
    private func syncForm(_ lesson: LessonForUser) {
        when = I18n.date(fromISO: lesson.scheduledAt) ?? Date()
        horseId = lesson.horseId ?? ""
        planId = lesson.planId ?? ""
    }

    private func saveDetails(_ lesson: LessonForUser) async {
        var scheduledAt: String?
        let candidate = LessonCopy.isoTimestamp(when)
        if candidate != lesson.scheduledAt { scheduledAt = candidate }

        var horse: PatchField<String> = .unchanged
        if horseId != (lesson.horseId ?? "") {
            horse = horseId.isEmpty ? .clear : .set(horseId)
        }
        var plan: PatchField<String> = .unchanged
        if planId != (lesson.planId ?? "") {
            plan = planId.isEmpty ? .clear : .set(planId)
        }

        // Nothing changed: a PATCH that says nothing still bumps `updatedAt`.
        let hasChange = scheduledAt != nil
            || !isUnchanged(horse)
            || !isUnchanged(plan)
        guard hasChange else { return }

        let updated = await store.update(
            id: lesson.id,
            scheduledAt: scheduledAt,
            horseId: horse,
            planId: plan
        )
        guard updated != nil else { return }
        if let fresh = store.lesson(id: lessonId) { syncForm(fresh) }
        notice = LessonNotice(message: I18n.t("lesson.saved"))
    }

    private func isUnchanged(_ field: PatchField<String>) -> Bool {
        if case .unchanged = field { return true }
        return false
    }

    private func transition(_ target: LessonTransitionTarget) async {
        guard await store.transition(id: lessonId, target: target) != nil else { return }
        // No undo offer: the transition is terminal, and §4.12 reserves Ångra
        // for what can actually be taken back. The dialog is where this decision
        // was reversible — before it was taken.
        notice = LessonNotice(message: I18n.t(
            target == .completed ? "lesson.toast.completed" : "lesson.toast.cancelled"
        ))
    }

    private func addExercise(_ lesson: LessonForUser) async {
        let exerciseId = exercisePick
        guard !exerciseId.isEmpty else { return }
        if await store.addExercise(lessonId: lesson.id, exerciseId: exerciseId) != nil {
            exercisePick = ""
        }
    }

    private func removeExercise(_ lesson: LessonForUser, _ occurrence: LessonExerciseRef) async {
        guard await store.removeExercise(
            lessonId: lesson.id,
            exerciseId: occurrence.exerciseId
        ) != nil else { return }
        // Recoverable, so it gets an undo offer rather than a dialog (§4.12).
        // Re-adding appends the Exercise back rather than restoring its old
        // position, which is the same thing the web's undo does.
        notice = LessonNotice(
            message: I18n.t("lesson.toast.exerciseRemoved", ["name": occurrence.name]),
            actionLabel: I18n.t("lesson.toast.undo"),
            action: {
                Task {
                    await store.addExercise(lessonId: lesson.id, exerciseId: occurrence.exerciseId)
                }
            }
        )
    }

    private func attachProgram(_ lesson: LessonForUser) async {
        let programId = programPick
        guard !programId.isEmpty else { return }
        if await store.attachProgram(lessonId: lesson.id, programId: programId) != nil {
            programPick = ""
        }
    }

    private func detachProgram(_ lesson: LessonForUser, _ program: AttachedProgramRef) async {
        guard await store.detachProgram(lessonId: lesson.id, programId: program.id) != nil else { return }
        // The second place the copy semantics are stated — the first is the
        // section hint, above the control. Detaching removes the LABEL, not the
        // Exercises it copied in.
        notice = LessonNotice(
            message: I18n.t("lesson.toast.programDetached", ["title": program.title]),
            actionLabel: I18n.t("lesson.toast.undo"),
            action: {
                Task { await store.attachProgram(lessonId: lesson.id, programId: program.id) }
            }
        )
    }
}
