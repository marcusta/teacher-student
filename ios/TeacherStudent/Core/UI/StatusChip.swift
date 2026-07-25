import SwiftUI

/// Shape grammar — the port of the framework's `StatusPill` (design system §4.4).
///
/// Status must stay legible with colour removed entirely, so the VARIANT, not
/// the tone, is what carries the meaning:
///
///   - `outline` — ongoing or future (hairline ring, no fill)
///   - `filled`  — completed (solid plate, no ring)
///   - `dashed`  — cancelled (broken ring, no fill)
enum StatusChipVariant {
    case outline
    case filled
    case dashed
}

/// Tone comes only from the semantic scale. Brass (`accent`) means "brand and
/// action" and is deliberately absent — an outcome never borrows it.
enum StatusChipTone {
    case neutral
    case success
    case warning
    case danger
    case info

    var color: Color {
        switch self {
        // The scale has no neutral entry of its own; muted text is the stand-in.
        case .neutral: return Palette.textMuted
        case .success: return Palette.success
        case .warning: return Palette.warning
        case .danger: return Palette.danger
        case .info: return Palette.info
        }
    }
}

/// A status pill. Never glyph-only — the label is always present.
struct StatusChip: View {
    let label: String
    var variant: StatusChipVariant = .outline
    var tone: StatusChipTone = .neutral
    /// Decorative leading glyph, e.g. `✕` on a cancelled pill.
    var glyph: String?

    var body: some View {
        HStack(spacing: Spacing.xs) {
            if let glyph {
                Text(glyph).accessibilityHidden(true)
            }
            Text(label)
        }
        .font(Typography.caption.weight(.semibold))
        .padding(.horizontal, Spacing.sm)
        .padding(.vertical, 2)
        .foregroundStyle(foreground)
        .background(background, in: Capsule())
        .overlay {
            switch variant {
            case .outline:
                Capsule().strokeBorder(tone.color, lineWidth: 1)
            case .dashed:
                Capsule().strokeBorder(tone.color, style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
            case .filled:
                EmptyView()
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(label)
    }

    private var foreground: Color {
        // A filled pill puts the theme's paper colour on the tone, so it inverts
        // correctly in dark mode instead of hardcoding white.
        variant == .filled ? Palette.surface : tone.color
    }

    private var background: Color {
        variant == .filled ? tone.color : .clear
    }
}

// MARK: - Domain status factories
//
// The catalog has no single `status.*` namespace: statuses are per domain
// (`lesson.status.*`, `goal.status.*`, `plan.status.*`, `invitations.status.*`),
// and the variant/tone pairing for each is fixed by `web/<feature>/*-copy.ts`.
// These factories are the one place that mapping lives, so a chip cannot be
// assembled with the wrong shape on some screen.

extension StatusChip {
    enum LessonStatus: String {
        case planned, completed, cancelled
    }

    /// `web/lessons/lesson-copy.ts`. Cancelled takes the NEUTRAL tone, not
    /// danger — IA §3.7 wants those rows quiet, not alarming.
    static func lesson(_ status: LessonStatus) -> StatusChip {
        switch status {
        case .planned:
            return StatusChip(label: I18n.t("lesson.status.planned"), variant: .outline, tone: .info)
        case .completed:
            return StatusChip(label: I18n.t("lesson.status.completed"), variant: .filled, tone: .success)
        case .cancelled:
            return StatusChip(label: I18n.t("lesson.status.cancelled"), variant: .dashed, tone: .neutral, glyph: "✕")
        }
    }

    enum GoalStatus: String {
        case active, achieved, abandoned
    }

    /// `web/goals/goal-copy.ts`.
    static func goal(_ status: GoalStatus) -> StatusChip {
        switch status {
        case .active:
            return StatusChip(label: I18n.t("goal.status.active"), variant: .outline, tone: .info)
        case .achieved:
            return StatusChip(label: I18n.t("goal.status.achieved"), variant: .filled, tone: .success)
        case .abandoned:
            return StatusChip(label: I18n.t("goal.status.abandoned"), variant: .dashed, tone: .neutral, glyph: "✕")
        }
    }

    /// `web/plans/plan-copy.ts`. A plan is active or archived, nothing else.
    static func plan(archived: Bool) -> StatusChip {
        archived
            ? StatusChip(label: I18n.t("plan.status.archived"), variant: .dashed, tone: .neutral)
            : StatusChip(label: I18n.t("plan.status.active"), variant: .outline, tone: .info)
    }

    enum InvitationStatus: String {
        case pending, accepted, declined, revoked, expired
    }

    /// `invitations.status.*`. Pending is the only ongoing state.
    static func invitation(_ status: InvitationStatus) -> StatusChip {
        switch status {
        case .pending:
            return StatusChip(label: I18n.t("invitations.status.pending"), variant: .outline, tone: .info)
        case .accepted:
            return StatusChip(label: I18n.t("invitations.status.accepted"), variant: .filled, tone: .success)
        case .declined:
            return StatusChip(label: I18n.t("invitations.status.declined"), variant: .dashed, tone: .neutral, glyph: "✕")
        case .revoked:
            return StatusChip(label: I18n.t("invitations.status.revoked"), variant: .dashed, tone: .neutral, glyph: "✕")
        case .expired:
            // The ✕ is not decoration here: §4.4's grammar is shape-and-glyph so
            // an ended state reads as ended without relying on colour. The web
            // carries it (`web/students/student-copy.ts:207`) and dropping it
            // left `expired` distinguishable from `pending` by tone alone.
            return StatusChip(label: I18n.t("invitations.status.expired"), variant: .dashed, tone: .neutral, glyph: "✕")
        }
    }
}

// MARK: - Bridges from the API enums
//
// The factories above take chip-local enums, which is what keeps this file
// independent of the transport layer: the shape/tone grammar is a design fact
// and must not be re-decided when a DTO changes. These bridges are the one
// place the two vocabularies meet, so no screen has to spell the mapping out
// again. They live at file scope on purpose — inside `extension StatusChip` the
// name `LessonStatus` would resolve to the NESTED enum, not the API one.

extension LessonStatus {
    /// The §4.4 pill for this status.
    var chip: StatusChip {
        switch self {
        case .planned: return .lesson(.planned)
        case .completed: return .lesson(.completed)
        case .cancelled: return .lesson(.cancelled)
        }
    }

    /// Terminal states are one-way; the row and the header both rank them
    /// quieter than a planned occasion.
    var isTerminal: Bool { self != .planned }
}

extension GoalStatus {
    var chip: StatusChip {
        switch self {
        case .active: return .goal(.active)
        case .achieved: return .goal(.achieved)
        case .abandoned: return .goal(.abandoned)
        }
    }
}

extension PlanStatus {
    var chip: StatusChip { .plan(archived: self == .archived) }
}

extension InvitationStatus {
    var chip: StatusChip {
        switch self {
        case .pending: return .invitation(.pending)
        case .accepted: return .invitation(.accepted)
        case .declined: return .invitation(.declined)
        case .revoked: return .invitation(.revoked)
        case .expired: return .invitation(.expired)
        }
    }
}
