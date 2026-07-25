import SwiftUI

/// **Inkorg** — IA §3.2. Items addressed to the reader that expect a response.
///
/// MVP scope is invitations, and only invitations. The future activity groups
/// (feedback received, a Goal or Training Session newly shared, exercise
/// questions) are a backend gap: there is no notification log and no `read_at`,
/// so this screen must not imply unread activity by scanning current rows.
/// **Badge and count semantics are invitations-only** for the same reason.
///
/// Replies happen on the object itself, so no row here hosts a composer: the two
/// controls settle the invitation and nothing else.
///
/// The model is injectable so the tab shell can hand in the instance its badge
/// reads (`InboxViewModel`'s ownership contract): shared, the badge settles the
/// moment a row does. Left alone, this screen owns its own — either way the
/// instance dies with the session, which is the part that matters.
struct InboxRootView: View {
    @State private var model: InboxViewModel

    init(model: InboxViewModel? = nil) {
        _model = State(initialValue: model ?? InboxViewModel())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if model.pendingCount > 0 {
                    Text(I18n.plural("nav.inboxPending", model.pendingCount))
                        .font(Typography.lede)
                        .foregroundStyle(Palette.textMuted)
                }

                // What just happened, in words. Without it, accepting and
                // declining look identical to each other and to a row that was
                // revoked from under the reader (IA §4).
                if let notice = model.actionNotice {
                    LessonNoticeBar(notice: notice, onExpire: { model.dismissActionNotice() })
                }

                if let key = model.actionMessageKey {
                    recoverableMessage(I18n.t(key))
                }

                // A failed refresh over rows that still stand. Without this the
                // list would silently keep showing the old rows with no word that
                // the re-read failed and no way to ask again — the same scoped
                // retry Hem draws, for the same reason (IA §4).
                if model.showsScopedError {
                    scopedError
                }

                if model.showsInitialLoading {
                    LoadingView(I18n.t("invitations.loading"))
                        .frame(minHeight: 160)
                } else if model.showsPageError {
                    ErrorStateView(
                        message: I18n.t("invitations.error"),
                        retryTitle: I18n.t("students.retry"),
                        retry: { Task { await model.load() } }
                    )
                } else if model.showsEmptyState {
                    // The body is IA §3.2's own promise — invitations ARRIVE
                    // here, so an empty inbox is a state to wait in rather than
                    // something the reader failed to do. Deliberately not
                    // borrowed from `students.invitedOnly.body`, which describes
                    // an OUTGOING invitation and would say the opposite.
                    EmptyStateView(
                        title: I18n.t("inbox.empty"),
                        message: I18n.t("inbox.empty.body")
                    )
                } else {
                    ForEach(model.items) { invitation in
                        InboxInvitationRow(
                            invitation: invitation,
                            isBusy: model.busyIDs.contains(invitation.id),
                            accept: { Task { await model.accept(invitation) } },
                            decline: { Task { await model.decline(invitation) } }
                        )
                    }
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.bg)
        .navigationTitle(I18n.t("inbox.heading"))
        // Every appearance, not just the first: the model outlives a tab switch,
        // so an invitation that arrives while the app is open would otherwise
        // stay invisible until the next launch. The rows stay put while the
        // request runs, so a refetch that changes nothing is invisible too.
        .task { await model.load() }
        .refreshable { await model.load() }
    }

    /// A read that failed with content still on screen: state what happened,
    /// offer the re-read, keep the rows. Same recipe as `HomeRootView`'s scoped
    /// error — one screen's failed refresh should not look different from
    /// another's.
    private var scopedError: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
            Text(I18n.t("invitations.error"))
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            Button(I18n.t("students.retry")) { Task { await model.load() } }
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

    /// A recoverable conflict, not a failure: the row it referred to has already
    /// been refetched, so this explains what happened and the list has already
    /// corrected itself.
    private func recoverableMessage(_ text: String) -> some View {
        Text(text)
            .font(Typography.caption)
            .foregroundStyle(Palette.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Spacing.md)
            .background(Palette.warningSoft, in: RoundedRectangle(cornerRadius: Radius.md))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.md)
                    .strokeBorder(Palette.warning, lineWidth: 1)
            }
            .accessibilityAddTraits(.isStaticText)
    }
}

/// One inbound invitation: who is inviting, at which address, when they sent it,
/// and the two ways to answer.
///
/// The inviting Teacher is named rather than shown as a bare email — the Inkorg
/// never presents an anonymous request — and the address is kept beside the name
/// because it is what the reader recognises when the display name is unfamiliar.
struct InboxInvitationRow: View {
    let invitation: InboxInvitation
    let isBusy: Bool
    let accept: () -> Void
    let decline: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(I18n.t("inbox.from", [
                "name": invitation.teacherDisplayName,
                "email": invitation.teacherEmail,
            ]))
            .font(Typography.body)
            .foregroundStyle(Palette.text)
            .fixedSize(horizontal: false, vertical: true)

            if let sent = sentLabel {
                Text(sent)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }

            HStack(spacing: Spacing.sm) {
                Button(I18n.t("inbox.accept"), action: accept)
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                Button(I18n.t("inbox.decline"), action: decline)
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
                if isBusy {
                    ProgressView()
                }
                Spacer(minLength: 0)
            }
            .disabled(isBusy)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.lg)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(Palette.border, lineWidth: 1)
        }
        .tsShadow(.one)
    }

    /// `Skickad i går` — relative, because how long an invitation has been
    /// waiting is the fact that matters, not the calendar date it was created on.
    private var sentLabel: String? {
        guard let when = I18n.formatRelative(iso: invitation.createdAt) else { return nil }
        return I18n.t("invitations.sent", ["when": when])
    }
}
