import SwiftUI
import Observation

/// Owns the Notes of a SINGLE parent as observable state — the port of
/// `web/lessons/notes.service.ts`.
///
/// Every mutation reloads. Visibility is decided server-side (a shared note is
/// visible to a different set of people than a private one), so the truth about
/// what a thread now contains lives on the server and is read back rather than
/// patched locally.
@MainActor
@Observable
final class NoteThreadModel {
    private(set) var items: [Note] = []
    private(set) var isLoading = false
    private(set) var error: ApiError?

    private let api: NotesApi
    private var parentKind: NoteParentKind?
    private var parentId: String?

    init(api: NotesApi = NotesApi()) {
        self.api = api
    }

    /// (Re)point the feed and fetch it.
    func load(parentKind: NoteParentKind, parentId: String) async {
        self.parentKind = parentKind
        self.parentId = parentId
        _ = await run { [api] in
            let notes = try await api.list(parentKind: parentKind, parentId: parentId)
            return { self.items = notes }
        }
    }

    @discardableResult
    func create(body: String, visibility: NoteVisibility) async -> Bool {
        guard let parentKind, let parentId else { return false }
        let ok = await run { [api] in
            _ = try await api.create(
                parentKind: parentKind,
                parentId: parentId,
                body: body,
                visibility: visibility
            )
            return nil
        }
        if ok { await reload() }
        return ok
    }

    @discardableResult
    func update(id: String, body: String? = nil, visibility: NoteVisibility? = nil) async -> Bool {
        let ok = await run { [api] in
            _ = try await api.update(id: id, body: body, visibility: visibility)
            return nil
        }
        if ok { await reload() }
        return ok
    }

    @discardableResult
    func delete(id: String) async -> Bool {
        let ok = await run { [api] in
            _ = try await api.delete(id: id)
            return nil
        }
        if ok { await reload() }
        return ok
    }

    private func reload() async {
        guard let parentKind, let parentId else { return }
        await load(parentKind: parentKind, parentId: parentId)
    }

    /// The port of the framework's `request(loading, error, fn)`: one place that
    /// raises the loading flag, clears the previous error, and maps a thrown
    /// transport failure onto `ApiError` so the view never sees a raw `Error`.
    private func run(_ work: @escaping () async throws -> (@MainActor () -> Void)?) async -> Bool {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            let apply = try await work()
            apply?()
            return true
        } catch let apiError as ApiError {
            error = apiError
            return false
        } catch {
            self.error = ApiError.transport(error, traceId: nil)
            return false
        }
    }
}

/// Error copy for the thread. Its own type so the mapping sits next to the
/// catalog keys rather than inside a view body.
enum NoteThreadCopy {
    static func errorKey(_ error: ApiError) -> String {
        switch error.code {
        case .conflict: return "notes.error.conflict"
        case .notFound: return "notes.error.notFound"
        case .validation: return "notes.error.validation"
        case .network, .timeout: return "auth.error.network"
        case .rateLimit: return "auth.error.rateLimit"
        default: return "notes.error"
        }
    }
}

/// Note & feedback thread — design system §4.7.
///
/// One chronological column. The spec's `Undvik` list rules out the three
/// things a chat UI reaches for first: speech bubbles, alternating left/right
/// layout, and truncating long notes. So entries are stacked blocks at reading
/// measure and the body has no clamp of any kind.
///
/// What the spec MANDATES, and this view owns:
///
/// - a **context row** saying what the thread hangs on ("Träningspass · 14 juli
///   · Luna"), so a thread is never free-floating;
/// - the **teacher's hairline brass rule** on their entries — the one place the
///   brass appears inside a thread, marking instruction apart from reflection;
/// - **visibility at the point of writing** (§4.5, IA §1): the composer carries
///   the Privat/Delad choice and NAMES who "Delad" would reach, rather than
///   hiding the decision in a menu or revealing it after the fact.
///
/// Notes attach to several parent kinds, so the parent is a parameter, not a
/// subclass — this one view replaces the goal, exercise and training-session
/// threads the web had grown separately.
struct NoteThreadView: View {
    let parentKind: NoteParentKind
    let parentId: String
    /// Already-composed domain copy, e.g. `Träningspass · 14 juli · Luna`. The
    /// caller composes it because only the caller knows which facts identify
    /// its parent.
    let context: String
    /// Who a note written HERE, NOW would reach when shared. Drives the
    /// composer's named Delad option; empty DISABLES sharing rather than
    /// offering an unlabelled one.
    let recipients: [ShareRecipient]
    /// The author's role in this relation. Roles are contextual (IA §1), so
    /// this is a per-note question the caller answers, not a field on the
    /// account.
    let roleOf: (Note) -> PersonRole
    /// Who an existing shared note reaches. Defaults to `recipients`.
    ///
    /// The chip on an entry states which CHANNEL the note is in — private to
    /// its author, or the shared channel this thread runs on — so it names the
    /// same counterparties for every shared entry regardless of who wrote it.
    /// Filtering the author out would leave a teacher's own note with an empty
    /// audience and an unnamed "Delad", which §4.5 forbids.
    let audienceOf: ((Note) -> [ShareRecipient])?
    /// Show the Lärare/Elev tag on entries. Pass `false` where the context is
    /// already unambiguous — §4.6 names a student's own training log as the
    /// example. Names still render; only the role tag is suppressed.
    let showRoles: Bool
    /// Heading level of the thread title, for outline correctness. Default 3.
    let headingLevel: Int

    init(
        parentKind: NoteParentKind,
        parentId: String,
        context: String,
        recipients: [ShareRecipient],
        roleOf: @escaping (Note) -> PersonRole,
        audienceOf: ((Note) -> [ShareRecipient])? = nil,
        showRoles: Bool = true,
        headingLevel: Int = 3
    ) {
        self.parentKind = parentKind
        self.parentId = parentId
        self.context = context
        self.recipients = recipients
        self.roleOf = roleOf
        self.audienceOf = audienceOf
        self.showRoles = showRoles
        self.headingLevel = headingLevel
    }

    @Environment(SessionStore.self) private var session
    @State private var model = NoteThreadModel()
    @State private var draft = ""
    @State private var draftShared = false
    @State private var editingId: String?
    @State private var editingBody = ""
    @State private var editingShared = false
    @State private var pendingDeleteId: String?
    @State private var isSubmitting = false

    /// Only recipients this thread can NAME. A blank display name cannot be
    /// stated, and §4.5 forbids offering a shared state whose audience isn't —
    /// so an unnameable recipient disables sharing instead of producing a
    /// confident, empty "Delad: ".
    private var namedRecipients: [ShareRecipient] { ShareCopy.named(recipients) }
    private var canShare: Bool { !namedRecipients.isEmpty }

    private func audience(for note: Note) -> [ShareRecipient] {
        audienceOf?(note) ?? namedRecipients
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            header
            if !model.items.isEmpty {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    ForEach(model.items) { note in
                        entry(note)
                    }
                }
            } else {
                Text(I18n.t("notes.empty"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
            composer
        }
        .frame(maxWidth: 620, alignment: .leading)
        // Rebuild the feed only when the thread's IDENTITY changes. A parent
        // that merely reloads must not discard a half-typed note.
        .task(id: "\(parentKind.rawValue):\(parentId)") {
            await model.load(parentKind: parentKind, parentId: parentId)
        }
        // A recipient list that empties out must not leave a shared draft armed.
        .onChange(of: canShare) { _, nowCanShare in
            if !nowCanShare {
                draftShared = false
                editingShared = false
            }
        }
        .alert(
            I18n.t("notes.deleteTitle"),
            isPresented: Binding(
                get: { pendingDeleteId != nil },
                set: { if !$0 { pendingDeleteId = nil } }
            )
        ) {
            Button(I18n.t("notes.delete"), role: .destructive) {
                guard let id = pendingDeleteId else { return }
                pendingDeleteId = nil
                Task { await model.delete(id: id) }
            }
            Button(I18n.t("notes.cancel"), role: .cancel) { pendingDeleteId = nil }
        } message: {
            Text(I18n.t("notes.deleteConsequence"))
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(I18n.plural("notes.heading", model.items.count))
                .font(headingLevel <= 2 ? Typography.pageTitle : Typography.sectionTitle)
                .foregroundStyle(Palette.text)
                .accessibilityAddTraits(.isHeader)
            Text(context)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, Spacing.sm)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    // MARK: - Entries

    @ViewBuilder
    private func entry(_ note: Note) -> some View {
        let role = roleOf(note)
        VStack(alignment: .leading, spacing: Spacing.sm) {
            WrapLayout(horizontalSpacing: Spacing.sm, verticalSpacing: Spacing.xs) {
                PersonMarker(name: note.authorDisplayName, role: role, showRole: showRoles)
                Text(I18n.formatDate(iso: note.createdAt, .noteTimestamp) ?? note.createdAt)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .monospacedDigit()
                ShareChip(recipients: audience(for: note), shared: note.visibility == .shared)
            }

            if editingId == note.id {
                editor(note)
            } else {
                Text(note.body)
                    // No clamp, no ellipsis: §4.7 forbids cutting long notes.
                    .font(Typography.body)
                    .foregroundStyle(Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                // Author-only. Reading a thread never offers to edit someone
                // else's words, and the server enforces the same rule.
                if note.authorId == session.currentUser?.id {
                    HStack(spacing: Spacing.md) {
                        Button(I18n.t("notes.edit")) {
                            editingBody = note.body
                            editingShared = note.visibility == .shared
                            editingId = note.id
                        }
                        .font(Typography.caption)
                        .foregroundStyle(Palette.textMuted)
                        Button(I18n.t("notes.delete")) { pendingDeleteId = note.id }
                            .font(Typography.caption)
                            .foregroundStyle(Palette.danger)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.leading, Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        // The teacher's hairline brass rule (§4.7). Non-teacher entries keep the
        // identical indent and an invisible rule so the column stays flush —
        // only the colour changes.
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(role == .teacher ? Palette.brassLine : .clear)
                .frame(width: 1)
        }
    }

    @ViewBuilder
    private func editor(_ note: Note) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            TextEditor(text: $editingBody)
                .font(Typography.body)
                .frame(minHeight: 88)
                .scrollContentBackground(.hidden)
                .background(Palette.bg, in: RoundedRectangle(cornerRadius: Radius.sm))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.sm)
                        .strokeBorder(Palette.borderStrong, lineWidth: 1)
                }
                .accessibilityLabel(I18n.t("notes.placeholder"))
            visibilityControl(isShared: $editingShared)
            HStack(spacing: Spacing.md) {
                Button(I18n.t("notes.save")) {
                    let body = editingBody.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !body.isEmpty else { return }
                    let visibility: NoteVisibility = editingShared && canShare ? .shared : .private
                    Task {
                        if await model.update(id: note.id, body: body, visibility: visibility) {
                            editingId = nil
                        }
                    }
                }
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                Button(I18n.t("notes.cancel")) { editingId = nil }
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Composer

    private var composer: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            TextEditor(text: $draft)
                .font(Typography.body)
                .frame(minHeight: 88)
                .scrollContentBackground(.hidden)
                .background(Palette.bg, in: RoundedRectangle(cornerRadius: Radius.sm))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.sm)
                        .strokeBorder(Palette.borderStrong, lineWidth: 1)
                }
                .accessibilityLabel(I18n.t("notes.placeholder"))
                .overlay(alignment: .topLeading) {
                    if draft.isEmpty {
                        Text(I18n.t("notes.placeholder"))
                            .font(Typography.body)
                            .foregroundStyle(Palette.textMuted)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, Spacing.sm)
                            .allowsHitTesting(false)
                    }
                }

            WrapLayout(horizontalSpacing: Spacing.md, verticalSpacing: Spacing.sm) {
                visibilityControl(isShared: $draftShared)
                Button(I18n.t("notes.submit"), action: submit)
                    .font(Typography.button)
                    .buttonStyle(.borderedProminent)
                    .tint(Palette.accent)
                    .disabled(isSubmitting || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }

            // The consequence of the current choice, stated in terms of a NAMED
            // person — this sentence is what makes the control a trust surface
            // rather than a toggle. The writer learns who will read them BEFORE
            // they write, not after.
            Text(visibilityHint)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            if let error = model.error {
                // Authored Swedish per code — `ApiError.message` is the server's
                // developer English and never reaches a reader.
                Text(I18n.t(NoteThreadCopy.errorKey(error)))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        // The composer is a PANEL. The §4.8 field recipe fills with the page
        // paper colour, and a thread sits straight on that same colour — so
        // without the panel the editor would vanish into its background.
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
        }
    }

    private var visibilityHint: String {
        // Nobody nameable is the same situation as nobody at all: there is no
        // audience this sentence could honestly state.
        guard canShare else { return I18n.t("notes.hintNoRecipients") }
        guard draftShared else { return I18n.t("notes.hintPrivate") }
        return I18n.t("notes.hintShared", ["names": ShareCopy.joinNames(recipients)])
    }

    /// The Privat/Delad control. Two buttons rather than a switch: a switch has
    /// only ONE label, which is exactly how an unlabelled "shared" state gets
    /// created. Here both states are always spelled out, and the shared option
    /// either names its audience or says plainly that there is nobody to share
    /// with and disables itself.
    private func visibilityControl(isShared: Binding<Bool>) -> some View {
        HStack(spacing: 0) {
            visibilityOption(
                label: I18n.t("share.private"),
                isOn: !isShared.wrappedValue,
                isEnabled: true
            ) { isShared.wrappedValue = false }

            visibilityOption(
                label: canShare
                    ? ShareCopy.label(namedRecipients, shared: true)
                    : I18n.t("notes.shareUnavailable"),
                isOn: isShared.wrappedValue,
                isEnabled: canShare
            ) { isShared.wrappedValue = true }
        }
        .clipShape(Capsule())
        .overlay { Capsule().strokeBorder(Palette.borderStrong, lineWidth: 1) }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(I18n.t("notes.visibility"))
    }

    private func visibilityOption(
        label: String,
        isOn: Bool,
        isEnabled: Bool,
        select: @escaping () -> Void
    ) -> some View {
        Button(action: select) {
            Text(label)
                .font(Typography.caption.weight(.semibold))
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.xs)
                .foregroundStyle(isOn ? Palette.accentStrong : Palette.textMuted)
                .background(isOn ? Palette.accentSoft : .clear)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.5)
        .accessibilityAddTraits(isOn ? [.isSelected] : [])
    }

    private func submit() {
        let body = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return }
        let shared = draftShared && canShare
        isSubmitting = true
        Task {
            let ok = await model.create(body: body, visibility: shared ? .shared : .private)
            isSubmitting = false
            if ok {
                draft = ""
                draftShared = false
            }
        }
    }
}
