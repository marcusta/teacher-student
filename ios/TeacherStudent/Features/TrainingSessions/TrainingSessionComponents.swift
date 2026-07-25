import SwiftUI

/// A one-line confirmation, with an optional undo.
///
/// Core has no toast, so what the web says in a transient toast is said here as
/// an inline notice that stays until the reader dismisses it or acts on it. That
/// is arguably the better trade on a phone: an undo that expires while the
/// reader is still reading the sentence is not an undo.
struct TrainingSessionNoticeBanner: View {
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?
    let dismiss: () -> Void

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(Typography.button)
                    .buttonStyle(.bordered)
                    .tint(Palette.accent)
            }
            Button {
                dismiss()
            } label: {
                // `.plain` strips the padding a bordered button would have given
                // the glyph, which would leave a ~17pt target. The frame and
                // `contentShape` put the HIG's 44×44 back without moving the
                // 17pt icon a pixel.
                Image(systemName: "xmark")
                    .frame(minWidth: 44, minHeight: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .foregroundStyle(Palette.textMuted)
            .accessibilityLabel(I18n.t("trainingSession.confirm.dismiss"))
        }
        .padding(Spacing.md)
        .background(Palette.successSoft, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.success, lineWidth: 1)
        }
    }
}

/// A failure on a page that still stands.
///
/// A 409 is NOT a generic failure: the page is working from a stale copy, so the
/// way out is to fetch the current one — which is a different sentence and a
/// different button from "try again" (IA §4).
struct TrainingSessionErrorBanner: View {
    /// Which failure is being reported. A refused WRITE and a READ that never
    /// arrived need different sentences: one says the change did not land, the
    /// other says the content standing behind the banner may be behind. Saying
    /// "kunde inte sparas" over a failed refresh would name an edit the reader
    /// never made.
    enum Failure {
        case write
        case refresh
    }

    let error: ApiError
    var failure: Failure = .write
    let refresh: () -> Void

    private var isConflict: Bool { TrainingSessionCopy.isConflict(error) }

    private var message: String {
        if isConflict { return I18n.t("trainingSession.conflict.message") }
        switch failure {
        case .write: return I18n.t("trainingSessions.saveError")
        case .refresh: return I18n.t("trainingSession.refreshError")
        }
    }

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.md) {
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            Button(isConflict
                   ? I18n.t("trainingSession.conflict.action")
                   : I18n.t("trainingSessions.retry"),
                   action: refresh)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .padding(Spacing.md)
        .background(isConflict ? Palette.warningSoft : Palette.dangerSoft,
                    in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(isConflict ? Palette.warning : Palette.danger, lineWidth: 1)
        }
    }
}

/// A labelled form field. The label is a real label, always visible — a
/// placeholder that disappears on focus is not one.
struct TrainingSessionField<Content: View>: View {
    let label: String
    var hint: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.label)
                .foregroundStyle(Palette.text)
            content
            if let hint {
                Text(hint)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A card with a section heading — the detail page's repeating unit.
struct TrainingSessionSection<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.lg)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
        }
    }
}

/// The §4.9 catalog picker: options grouped by their **owning Teacher**, because
/// provenance is part of the content. `SwiftUI.Section` carries the grouping the
/// web had to fake with disabled `<option>` rows.
///
/// A single flat `Picker` would have been less code and would have thrown away
/// the one fact that tells two identically named exercises apart.
struct CatalogPickerMenu: View {
    let groups: [CatalogGroup]
    let placeholder: String
    @Binding var selection: String

    private var selectedLabel: String? {
        groups.lazy.compactMap { $0.items.first(where: { $0.id == selection })?.label }.first
    }

    var body: some View {
        Menu {
            if !selection.isEmpty {
                Button(placeholder) { selection = "" }
            }
            ForEach(groups) { group in
                Section(group.teacherName) {
                    ForEach(group.items) { item in
                        Button(item.label) { selection = item.id }
                    }
                }
            }
        } label: {
            HStack(spacing: Spacing.sm) {
                Text(selectedLabel ?? placeholder)
                    .font(Typography.body)
                    .foregroundStyle(selectedLabel == nil ? Palette.textMuted : Palette.text)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Image(systemName: "chevron.up.chevron.down")
                    .font(.footnote)
                    .foregroundStyle(Palette.textMuted)
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay {
                RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.border, lineWidth: 1)
            }
        }
        // The label alone REPLACES the composed label VoiceOver would have read
        // off the button's contents, so without a value the reader hears "Välj
        // övning" whether or not something is picked and can never read their
        // own choice back. The value is the choice; the label stays the question.
        .accessibilityLabel(placeholder)
        .accessibilityValue(selectedLabel ?? "")
    }
}

/// A catalog that did not answer, said out loud.
///
/// Every optional field in this slice is ABSENT when it has nothing to offer,
/// which is only honest once the list is KNOWN to be empty. A read that failed
/// looks exactly like an empty stable from the inside, so it gets this line
/// rather than silence: what could not be fetched, and a way to ask again (§4's
/// retry for failed reads).
struct TrainingSessionCatalogRetry: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(message)
                .font(Typography.caption)
                .foregroundStyle(Palette.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Button(I18n.t("trainingSessions.retry"), action: retry)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The sharing control, which is three different controls depending on how many
/// Teachers the rider actually has (IA §3.9 step 7).
///
/// - **none** — the control is ABSENT, replaced by a line explaining why. A
///   multi-select with nothing in it teaches nothing. Reached from the detail
///   page, which keeps its Delning section standing for the owner whatever the
///   Relation count; the create sheet drops the whole field instead, because a
///   sheet is a sequence of questions and one with no answers does not belong
///   in it.
/// - **one** — a single named checkbox. `Dela med Anna Berg`, not a picker with
///   one row in it.
/// - **several** — named rows with a running count.
///
/// The hint explains a CHOICE, so it appears only where there is one; with no
/// Teacher it would be an instruction for a control that is not there (the web
/// hides it on the same condition).
///
/// Default is always private: sharing a training log is the rider's decision to
/// make, not a default to opt out of.
struct ShareTeacherControl: View {
    let teachers: [Teacher]
    let isSelected: (String) -> Bool
    let toggle: (String) -> Void

    private var selectedCount: Int {
        teachers.filter { isSelected($0.id) }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            if !teachers.isEmpty {
                Text(I18n.t("trainingSession.sharing.hint"))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if teachers.isEmpty {
                Text(I18n.t("trainingSession.sharing.none"))
                    .font(Typography.body)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            } else if teachers.count == 1, let only = teachers.first {
                Toggle(
                    I18n.t("trainingSession.sharing.withTeacher", ["name": only.displayName]),
                    isOn: Binding(
                        get: { isSelected(only.id) },
                        set: { _ in toggle(only.id) }
                    )
                )
                .font(Typography.body)
                .tint(Palette.accent)
            } else {
                Text(I18n.t("trainingSession.sharing.legend"))
                    .font(Typography.label)
                    .foregroundStyle(Palette.text)
                ForEach(teachers) { teacher in
                    Button {
                        toggle(teacher.id)
                    } label: {
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: isSelected(teacher.id) ? "checkmark.square.fill" : "square")
                                .foregroundStyle(isSelected(teacher.id) ? Palette.accent : Palette.borderStrong)
                            Text(teacher.displayName)
                                .font(Typography.body)
                                .foregroundStyle(Palette.text)
                            Spacer(minLength: 0)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(isSelected(teacher.id) ? [.isSelected] : [])
                }
                Text(I18n.plural("trainingSession.sharing.count", selectedCount))
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
            }
        }
    }
}

/// The standing offer to share with a Teacher whose Program is attached here.
/// IA §3.10 is explicit that this is an OFFER — attaching content never
/// discloses the session on the rider's behalf.
struct ProgramOwnerOffer: View {
    let teacher: Teacher
    let accept: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(I18n.t("trainingSession.programOffer", ["name": teacher.displayName]))
                .font(Typography.caption)
                .foregroundStyle(Palette.text)
                .fixedSize(horizontal: false, vertical: true)
            Button(I18n.t("trainingSession.programOffer.action", ["name": teacher.displayName]),
                   action: accept)
                .font(Typography.button)
                .buttonStyle(.bordered)
                .tint(Palette.accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Palette.infoSoft, in: RoundedRectangle(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md).strokeBorder(Palette.info, lineWidth: 1)
        }
    }
}
