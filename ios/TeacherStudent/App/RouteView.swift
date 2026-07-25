import SwiftUI

/// Resolves a pushed `Route` to its detail screen. The shell owns this switch;
/// feature slices push `Route` values and never register a destination of their
/// own, so any screen can deep-link into any other.
struct RouteView: View {
    let route: Route

    var body: some View {
        switch route {
        case .lesson(let id):
            LessonDetailView(lessonId: id)
        case .trainingSession(let id):
            TrainingSessionDetailView(id: id)
        case .plan(let id):
            PlanDetailView(planId: id)
        case .goal(let id):
            GoalDetailView(goalId: id)
        case .horse(let id):
            HorseDetailView(horseId: id)
        case .student(let id):
            StudentDetailView(studentId: id)
        case .exercise(let id):
            ExerciseDetailView(exerciseId: id)
        case .program(let id):
            ProgramDetailView(programId: id)
        case .exerciseHistory(let studentId, let exerciseId):
            ExerciseHistoryView(studentId: studentId, exerciseId: exerciseId)
        }
    }
}
