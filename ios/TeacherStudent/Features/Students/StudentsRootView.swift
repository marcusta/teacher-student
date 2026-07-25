import SwiftUI

/// Mina elever — the roster and the outgoing invitations, on one screen
/// (IA §3.3). The standalone `/invitations` page was absorbed here: an
/// invitation is a student who has not answered yet, and reading the two apart
/// made the roster lie about how many people were in flight.
@Observable
@MainActor
final class StudentsRosterModel {
    private let api: Api

    /// The three sources load INDEPENDENTLY. IA §3.3: "one failing must not
    /// erase the other" — a broken invitations request must leave a live roster
    /// on screen, and vice versa.
    let students = AsyncSection<[Student]>()
    let invitations = AsyncSection<[Invitation]>()
    /// Opportunistic: `GET /lessons` is a single call every row reads from,
    /// which is the only reason IA §3.3's "when cheaply available" next-lesson
    /// summary is affordable at all. A failure here costs a line, never a row.
    let lessons = AsyncSection<[LessonForUser]>()

    var isInviteOpen = false
    var inviteEmail = ""
    var isSubmitting = false
    var pendingRevoke: Invitation?
    /// One-shot banner, in place of the web's toast host.
    ///
    /// It carries a TONE because it reports both outcomes of the same action: a
    /// revoke that failed drawn in the confirmation surface reads as "done", and
    /// the row it contradicts is still sitting underneath saying "Väntar på
    /// svar". The text alone cannot fix that — the colour is the first thing
    /// read.
    var notice: Notice?

    struct Notice: Equatable {
        enum Tone {
            case confirmation
            case failure
        }

        let text: String
        let tone: Tone
    }

    private var validation: String?
    private var inviteError: ApiError?

    init(api: Api = .shared) {
        self.api = api
    }

    // MARK: - Loading

    func load() {
        Task { await students.run { try await self.api.students.list() } }
        Task { await invitations.run { try await self.api.invitations.list() } }
        Task { await lessons.run { try await self.api.lessons.list() } }
    }

    func reloadStudents() {
        Task { await students.run { try await self.api.students.list() } }
    }

    func reloadInvitations() {
        Task { await invitations.run { try await self.api.invitations.list() } }
    }

    // MARK: - Derived

    var sortedStudents: [Student] { StudentCopy.sortStudents(students.items()) }
    var sortedInvitations: [Invitation] { StudentCopy.sortInvitations(invitations.items()) }

    var rosterState: StudentCopy.RosterState {
        StudentCopy.rosterState(
            students: students.items().count,
            invitations: invitations.items().count,
            // An errored list has NOT answered. Treating a failure as "resolved
            // to zero" is precisely how a failed invitations request would turn
            // a page with a live roster into a branded "you have nobody yet".
            studentsResolved: students.isResolved && !students.hasFailed,
            invitationsResolved: invitations.isResolved && !invitations.hasFailed
        )
    }

    /// The optional per-row line. Nil while `GET /lessons` is unknown or broken —
    /// a row states the next lesson or says nothing, never "kunde inte hämtas".
    func nextLessonSummary(for student: Student) -> String? {
        guard lessons.isResolved, !lessons.hasFailed else { return nil }
        let next = StudentCopy.nextLessonWith(
            lessons.items(),
            studentId: student.id,
            nowISO: StudentCopy.nowISO()
        )
        return StudentCopy.nextLessonSummary(next)
    }

    // MARK: - The invite form

    func openInvite() {
        inviteEmail = ""
        validation = nil
        inviteError = nil
        isInviteOpen = true
    }

    func closeInvite() {
        isInviteOpen = false
        inviteEmail = ""
        validation = nil
        inviteError = nil
    }

    /// Field validation wins over the server's, because it is about what the
    /// reader just typed. The conflict branch is keyed on the CODE, never on the
    /// message text.
    var formErrorText: String? {
        if let validation { return validation }
        guard let inviteError else { return nil }
        if StudentCopy.isConflict(inviteError) { return StudentCopy.duplicateInviteMessage(inviteEmail) }
        return I18n.t("invite.error.failed")
    }

    func submitInvite() async {
        let email = inviteEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        if let problem = StudentCopy.inviteEmailError(email) {
            validation = problem
            return
        }
        validation = nil
        inviteError = nil
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let created = try await api.invitations.create(inviteeEmail: email)
            // Prepend rather than refetch: the new row is known, and a refetch
            // would blank the list the reader is watching.
            invitations.set([created] + invitations.items())
            notice = Notice(text: I18n.t("invite.sent", ["email": email]), tone: .confirmation)
            closeInvite()
        } catch is CancellationError {
            // The sheet went away mid-request. Nobody is left to read a field
            // error, and the send may well have landed — reporting a failure
            // here would be a guess.
        } catch let error as ApiError {
            inviteError = error
        } catch {
            inviteError = ApiError(status: nil, code: .unknown, message: String(describing: error))
        }
    }

    // MARK: - Revoke

    func confirmRevoke(_ invitation: Invitation) {
        pendingRevoke = invitation
    }

    func revoke(_ invitation: Invitation) async {
        pendingRevoke = nil
        do {
            let result = try await api.invitations.revoke(invitationId: invitation.id)
            guard result.changed else {
                notPending(invitation)
                return
            }
            invitations.set(invitations.items().map { row in
                row.id == invitation.id ? row.withStatus(.revoked) : row
            })
            notice = Notice(
                text: I18n.t("invitations.toast.revoked", ["email": invitation.inviteeEmail]),
                tone: .confirmation
            )
        } catch is CancellationError {
            // The reader navigated away; the outcome is unknown and there is
            // nobody to tell. The next load answers the question properly.
        } catch let error as ApiError where StudentCopy.isConflict(error) {
            // The defensive twin of the `changed: false` branch, for the day the
            // endpoint reports the same situation the way `create` already does.
            notPending(invitation)
        } catch {
            notice = Notice(text: I18n.t("invitations.revokeError"), tone: .failure)
        }
    }

    /// The invitation stopped being pending between this list loading and the
    /// tap — the invitee answered it.
    ///
    /// The server says so with `changed: false` on a 200, NOT with a status
    /// code: `revokeInvitation` returns false for any non-pending row. So the
    /// case cannot be caught, only read off the payload — and reporting the
    /// blanket "kunde inte återkallas. Försök igen." for it invites a retry that
    /// will never succeed, under a row still reading "Väntar på svar". The
    /// refetch is what makes that row tell the truth.
    private func notPending(_ invitation: Invitation) {
        notice = Notice(
            text: I18n.t("invitations.revoke.notPending", ["email": invitation.inviteeEmail]),
            tone: .failure
        )
        reloadInvitations()
    }
}

private extension Invitation {
    /// The revoke response says only `{ changed }`, so the new status is applied
    /// locally rather than refetched.
    func withStatus(_ status: InvitationStatus) -> Invitation {
        Invitation(
            id: id,
            teacherId: teacherId,
            inviteeEmail: inviteeEmail,
            status: status,
            createdAt: createdAt,
            expiresAt: expiresAt,
            acceptedAt: acceptedAt
        )
    }
}

// MARK: - View

struct StudentsRootView: View {
    @State private var model = StudentsRosterModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                header
                if let notice = model.notice {
                    noticeBanner(notice)
                }
                switch model.rosterState {
                case .empty:
                    EmptyStateView(
                        title: I18n.t("students.empty.heading"),
                        message: I18n.t("students.empty.body"),
                        actionTitle: I18n.t("students.invite"),
                        action: { model.openInvite() }
                    )
                case .invitedOnly:
                    Text(I18n.t("students.invitedOnly.body"))
                        .font(Typography.lede)
                        .foregroundStyle(Palette.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                    rosterSection
                    invitationsSection
                case .roster, .unknown:
                    rosterSection
                    invitationsSection
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("nav.students"))
        .navigationBarTitleDisplayMode(.inline)
        .task { model.load() }
        .sheet(isPresented: Binding(get: { model.isInviteOpen }, set: { if !$0 { model.closeInvite() } })) {
            InviteSheet(model: model)
        }
        .confirmationDialog(
            I18n.t("invitations.confirm.title"),
            isPresented: Binding(
                get: { model.pendingRevoke != nil },
                set: { if !$0 { model.pendingRevoke = nil } }
            ),
            titleVisibility: .visible,
            presenting: model.pendingRevoke
        ) { invitation in
            Button(I18n.t("invitations.revoke"), role: .destructive) {
                Task { await model.revoke(invitation) }
            }
            Button(I18n.t("invitations.confirm.dismiss"), role: .cancel) {
                model.pendingRevoke = nil
            }
        } message: { invitation in
            Text(I18n.t("invitations.confirm.message", ["email": invitation.inviteeEmail]))
        }
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(I18n.t("students.heading"))
                .font(Typography.pageTitle)
                .foregroundStyle(Palette.text)
            Spacer(minLength: Spacing.md)
            Button(I18n.t("students.invite")) { model.openInvite() }
                .font(Typography.button)
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
        }
    }

    /// Confirmation and failure share one banner and differ only in surface: a
    /// failure in the accent surface reads as a confirmation of the thing that
    /// did not happen.
    private func noticeBanner(_ notice: StudentsRosterModel.Notice) -> some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            Text(notice.text)
                .font(Typography.body)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: Spacing.sm)
            Button {
                model.notice = nil
            } label: {
                Image(systemName: "xmark")
                    // `.plain` drops the button style's own padding, which would
                    // leave the glyph's own ~17pt box as the whole target. The
                    // frame restores the HIG minimum; `contentShape` makes the
                    // grown box tappable rather than just occupied.
                    .frame(minWidth: 44, minHeight: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .foregroundStyle(Palette.textMuted)
            .accessibilityLabel(I18n.t("invitations.confirm.dismiss"))
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            notice.tone == .failure ? Palette.dangerSoft : Palette.accentSoft,
            in: RoundedRectangle(cornerRadius: Radius.md)
        )
    }

    // MARK: Roster

    @ViewBuilder
    private var rosterSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            if model.students.isLoading && model.students.items().isEmpty {
                LoadingView(I18n.t("students.loading"))
            } else if model.students.hasFailed {
                ErrorStateView(
                    message: I18n.t("students.error"),
                    retryTitle: I18n.t("students.retry"),
                    retry: { model.reloadStudents() }
                )
            }
            ForEach(model.sortedStudents) { student in
                NavigationLink(value: Route.student(id: student.id)) {
                    StudentRow(
                        student: student,
                        nextLesson: model.nextLessonSummary(for: student)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: Invitations

    @ViewBuilder
    private var invitationsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(I18n.t("invitations.heading"))
            if model.invitations.isLoading && model.invitations.items().isEmpty {
                LoadingView(I18n.t("invitations.loading"))
            } else if model.invitations.hasFailed {
                ErrorStateView(
                    message: I18n.t("invitations.error"),
                    retryTitle: I18n.t("students.retry"),
                    retry: { model.reloadInvitations() }
                )
            } else if model.invitations.isEmptyList() {
                Text(I18n.t("invitations.empty"))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
            }
            ForEach(model.sortedInvitations) { invitation in
                InvitationRow(invitation: invitation) {
                    model.confirmRevoke(invitation)
                }
            }
        }
    }
}

// MARK: - Rows

private struct StudentRow: View {
    let student: Student
    let nextLesson: String?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            HStack(spacing: Spacing.sm) {
                // §4.6: the name carries its contextual role. On a teacher's
                // roster the role is the point — these people are Elever *to
                // this reader*, and the same person is a Lärare elsewhere in
                // the app (IA §1), so the row states which relation it is about.
                PersonMarker(name: student.displayName, role: .student)
                Spacer(minLength: Spacing.sm)
                Image(systemName: "chevron.right")
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
            Text(student.email)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
            if let nextLesson {
                Text(nextLesson)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).stroke(Palette.border)
        }
    }
}

private struct InvitationRow: View {
    let invitation: Invitation
    let revoke: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack(alignment: .firstTextBaseline, spacing: Spacing.sm) {
                Text(invitation.inviteeEmail)
                    .font(Typography.bodyEmphasis)
                    .foregroundStyle(Palette.text)
                Spacer(minLength: Spacing.sm)
                invitation.status.chip
            }
            // Sent time only, and only when it parsed. Nothing in the server
            // ever writes `expired`, so the row promises no expiry: no
            // countdown, no "gäller till".
            if let sent = StudentCopy.invitationSentLabel(invitation.createdAt) {
                Text(sent)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
            // Withheld, not disabled, on terminal rows: a greyed Återkalla on an
            // accepted invitation suggests the relation could be undone here.
            if StudentCopy.canRevoke(invitation.status) {
                Button(I18n.t("invitations.revoke"), role: .destructive, action: revoke)
                    .font(Typography.button)
                    .buttonStyle(.bordered)
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).stroke(Palette.border)
        }
    }
}

// MARK: - Invite sheet

private struct InviteSheet: View {
    @Bindable var model: StudentsRosterModel

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(I18n.t("invite.field.email"), text: $model.inviteEmail)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(Typography.body)
                } header: {
                    Text(I18n.t("invite.field.email"))
                } footer: {
                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        Text(I18n.t("invite.field.email.hint"))
                        if let problem = model.formErrorText {
                            Text(problem)
                                .foregroundStyle(Palette.danger)
                        }
                    }
                    .font(Typography.caption)
                    .fixedSize(horizontal: false, vertical: true)
                }
            }
            .navigationTitle(I18n.t("students.invite"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(I18n.t("invite.cancel")) { model.closeInvite() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(I18n.t("invite.submit")) {
                        Task { await model.submitInvite() }
                    }
                    .disabled(model.isSubmitting)
                }
            }
        }
    }
}
