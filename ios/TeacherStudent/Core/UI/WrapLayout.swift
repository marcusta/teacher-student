import SwiftUI

/// A row that wraps instead of scrolling — the port of the web's
/// `display: flex; flex-wrap: wrap`.
///
/// `HStack` cannot wrap, and a horizontal `ScrollView` is the wrong answer, not
/// merely a different one: UI_DECISIONS §6 says chips WRAP rather than scroll,
/// because a path upward that has scrolled out of view is a path you cannot
/// take. The same rule governs the meta line on a list row and the meta row on
/// a note entry, so all three go through this.
struct WrapLayout: Layout {
    var horizontalSpacing: CGFloat = Spacing.sm
    var verticalSpacing: CGFloat = Spacing.xs
    /// Baseline-ish alignment of items within one line. `.firstTextBaseline` is
    /// not expressible here, so items centre on the line's height.
    var lineAlignment: VerticalAlignment = .center

    /// The size to lay an item out at, never wider than the line it sits on.
    ///
    /// `.unspecified` asks a `Text` for its IDEAL width, which for a long
    /// sentence — an exercise summary on a Lesson row — is a single line wider
    /// than the phone. Placed at that size it runs off the right edge instead of
    /// wrapping. So an oversized item is re-measured against the full line
    /// width, which lets it wrap (or truncate, if it has a `lineLimit`) inside
    /// its own bounds.
    private func measure(_ subview: LayoutSubviews.Element, within limit: CGFloat) -> CGSize {
        let ideal = subview.sizeThatFits(.unspecified)
        guard limit.isFinite, ideal.width > limit else { return ideal }
        return subview.sizeThatFits(ProposedViewSize(width: limit, height: nil))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout Void) -> CGSize {
        let limit = proposal.width ?? .infinity
        let lines = lines(within: limit, subviews: subviews)
        let width = lines.map(\.width).max() ?? 0
        let height = lines.reduce(0) { $0 + $1.height }
            + verticalSpacing * CGFloat(max(0, lines.count - 1))
        return CGSize(width: min(width, limit), height: height)
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout Void
    ) {
        let lines = lines(within: bounds.width, subviews: subviews)
        var y = bounds.minY
        for line in lines {
            var x = bounds.minX
            for index in line.indices {
                let size = measure(subviews[index], within: bounds.width)
                let dy: CGFloat
                switch lineAlignment {
                case .top: dy = 0
                case .bottom: dy = line.height - size.height
                default: dy = (line.height - size.height) / 2
                }
                subviews[index].place(
                    at: CGPoint(x: x, y: y + dy),
                    anchor: .topLeading,
                    proposal: ProposedViewSize(size)
                )
                x += size.width + horizontalSpacing
            }
            y += line.height + verticalSpacing
        }
    }

    private struct Line {
        var indices: [Int] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    private func lines(within limit: CGFloat, subviews: Subviews) -> [Line] {
        var lines: [Line] = []
        var current = Line()
        for index in subviews.indices {
            let size = measure(subviews[index], within: limit)
            let advance = current.indices.isEmpty ? size.width : current.width + horizontalSpacing + size.width
            if !current.indices.isEmpty && advance > limit {
                lines.append(current)
                current = Line()
                current.indices = [index]
                current.width = size.width
                current.height = size.height
            } else {
                current.indices.append(index)
                current.width = advance
                current.height = max(current.height, size.height)
            }
        }
        if !current.indices.isEmpty { lines.append(current) }
        return lines
    }
}
