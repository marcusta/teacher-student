import Foundation

/// Cross-feature navigation targets. Every detail screen is reached by pushing
/// a `Route` value (`NavigationLink(value:)` / `navigationPath.append`), which
/// the shell resolves in `App/RouteView.swift`. This keeps feature slices free
/// to deep-link into each other — lesson → plan, goal → plan, student → history
/// — without importing each other's views.
///
/// Creation flows are NOT routes; they are local sheets owned by their feature
/// (IA shared grammar: creation opens in a dedicated panel, not a destination).
enum Route: Hashable {
    case lesson(id: String)
    case trainingSession(id: String)
    case plan(id: String)
    case goal(id: String)
    case horse(id: String)
    case student(id: String)
    case exercise(id: String)
    case program(id: String)
    case exerciseHistory(studentId: String, exerciseId: String)
}
