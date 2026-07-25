import Foundation

/// One row of the ordered Exercise sequence, with everything the builder needs
/// to render it and to decide which controls are offerable.
///
/// Port of `BuilderRow` in `web/programs/program-copy.ts`.
struct ProgramBuilderRow: Identifiable, Equatable {
    /// The Exercise id. Also the reorder/remove key the API takes — the join
    /// row carries no identity of its own.
    let id: String
    let name: String
    /// The optional instructional row note (§3.6 detail step 3).
    let notes: String?
    /// 1-based, as shown. `sortOrder` is 0-based on the wire.
    let position: Int
    /// No "move up" on the first row, no "move down" on the last.
    let isFirst: Bool
    let isLast: Bool
    /// The Exercise behind this row has been archived.
    ///
    /// Read straight off `ProgramExerciseRef.archivedAt`, which the server
    /// states per row. Inferring it from the row's ABSENCE from `GET /exercises`
    /// is exact only while that endpoint returns the whole library unpaginated,
    /// and quietly wrong for every Exercise past page one the day it does not.
    let archived: Bool
}

/// The view-free rules behind the IA §3.6 builder — port of
/// `web/programs/program-copy.ts`.
enum ProgramBuilder {
    static func rows(_ refs: [ProgramExerciseRef]) -> [ProgramBuilderRow] {
        let ordered = refs.sorted { $0.sortOrder < $1.sortOrder }
        return ordered.enumerated().map { index, ref in
            ProgramBuilderRow(
                id: ref.id,
                name: ref.name,
                notes: ref.notes,
                position: index + 1,
                isFirst: index == 0,
                isLast: index == ordered.count - 1,
                archived: ref.archivedAt != nil
            )
        }
    }

    /// The add-Exercise picker, scoped to the Teacher's own library (§3.6 step
    /// 4) and minus what is already attached.
    ///
    /// Withholding the already-attached ones is not the duplicate guard — it is
    /// what makes the guard rarely fire. `isDuplicate` still exists because the
    /// list can be stale: another device, or a slow add, can put a value in the
    /// picker that has since been attached.
    static func pickable(library: [Exercise], attached: [ProgramExerciseRef]) -> [Exercise] {
        let taken = Set(attached.map(\.id))
        return library.filter { !taken.contains($0.id) }
    }

    /// §3.6: "Reject duplicate Exercises with a row-level explanation." The
    /// server rejects the second attach outright, so this is the local half of
    /// the same rule — caught before the request, explained where the choice was
    /// made.
    static func isDuplicate(_ attached: [ProgramExerciseRef], exerciseId: String) -> Bool {
        attached.contains { $0.id == exerciseId }
    }

    /// Reorder by one step. Returns the new id order for
    /// `PUT /programs/:id/exercises/order`, or `nil` when the move is not
    /// available — off either end, or an id that is not in the list.
    ///
    /// Returning `nil` rather than the unchanged array is deliberate: the caller
    /// must not issue a write that changes nothing, because a no-op PUT still
    /// reloads the list and would flicker the row the user just tried to move.
    static func move(_ refs: [ProgramExerciseRef], exerciseId: String, delta: Int) -> [String]? {
        let ordered = refs.sorted { $0.sortOrder < $1.sortOrder }
        guard let index = ordered.firstIndex(where: { $0.id == exerciseId }) else { return nil }
        let target = index + delta
        guard target >= 0, target < ordered.count else { return nil }
        var order = ordered.map(\.id)
        order.swapAt(index, target)
        return order
    }
}
