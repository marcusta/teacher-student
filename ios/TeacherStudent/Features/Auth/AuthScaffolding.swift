import SwiftUI

/// Shared chrome for the two public entry views — the port of
/// `web/auth/auth-styles.ts`.
///
/// One brand moment per view (design system §02): the centred wordmark and its
/// brass rule. The signed-out shell shows no navigation, which is why these
/// screens carry their own mark instead of inheriting one.
struct AuthScaffold<Content: View, Footer: View>: View {
    let title: String
    let lede: String
    /// Server-side failure copy, already resolved to authored Swedish.
    let alert: String?
    @ViewBuilder var content: Content
    @ViewBuilder var footer: Footer

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.xl) {
                VStack(spacing: Spacing.md) {
                    Text(I18n.t("app.brand"))
                        .font(Typography.wordmark)
                        .foregroundStyle(Palette.text)
                        .textCase(.uppercase)
                        .kerning(1.5)
                    Rectangle()
                        .fill(Palette.brassLine)
                        .frame(width: 64, height: 1)
                }
                .padding(.top, Spacing.xxl)

                VStack(alignment: .leading, spacing: Spacing.lg) {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text(title)
                            .font(Typography.pageTitle)
                            .foregroundStyle(Palette.text)
                        Text(lede)
                            .font(Typography.lede)
                            .foregroundStyle(Palette.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if let alert, !alert.isEmpty {
                        Text(alert)
                            .font(Typography.body)
                            .foregroundStyle(Palette.danger)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(Spacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Palette.dangerSoft, in: RoundedRectangle(cornerRadius: Radius.sm))
                            .accessibilityAddTraits(.isStaticText)
                    }

                    content
                }
                .padding(Spacing.xl)
                // The recessed field treatment of §4.8 only reads on a surface
                // parent — every form in this app sits in a card for that reason.
                .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.md))
                .tsShadow(.one)

                footer
            }
            .frame(maxWidth: 480)
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)
            .frame(maxWidth: .infinity)
        }
        .background(Palette.bg)
        .scrollDismissesKeyboard(.interactively)
    }
}

/// A labelled field with its hint and its inline error — the `auth__field`
/// block. The error is announced, never merely coloured.
struct AuthField<Field: View>: View {
    let label: String
    var hint: String?
    /// Resolved error copy; empty when the field is fine.
    var error: String
    @ViewBuilder var field: Field

    private var isInvalid: Bool { !error.isEmpty }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.label)
                .foregroundStyle(Palette.text)
                // The control below carries this same string as its
                // `accessibilityLabel`, so leaving this one visible to VoiceOver
                // makes every field announce its name twice.
                .accessibilityHidden(true)

            field
                .font(Typography.body)
                .foregroundStyle(Palette.text)
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, 10)
                .background(Palette.bg, in: RoundedRectangle(cornerRadius: Radius.sm))
                .overlay(alignment: .bottom) {
                    // §4.8's "logbook line": the 3:1 control edge is a weighted
                    // bottom rule, not a uniform outline — and only the rule
                    // turns red on an invalid field.
                    Rectangle()
                        .fill(isInvalid ? Palette.danger : Palette.borderStrong)
                        .frame(height: 2)
                }
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.sm)
                        .strokeBorder(Palette.border, lineWidth: 1)
                }
                .accessibilityLabel(label)

            if let hint, !isInvalid {
                Text(hint)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if isInvalid {
                Text(error)
                    .font(Typography.caption)
                    .foregroundStyle(Palette.danger)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// The single primary submit of an entry form. Loading disables resubmission
/// WITHOUT clearing entered values (IA §3.17) — the label changes, the fields
/// do not.
struct AuthSubmitButton: View {
    let title: String
    let loadingTitle: String
    let isLoading: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.sm) {
                if isLoading { ProgressView().tint(Palette.onAccent) }
                Text(isLoading ? loadingTitle : title)
                    .font(Typography.button)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 9)
        }
        .buttonStyle(.borderedProminent)
        .tint(Palette.accent)
        .foregroundStyle(Palette.onAccent)
        .disabled(isLoading)
    }
}
