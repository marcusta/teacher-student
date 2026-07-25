import SwiftUI

@main
struct TeacherStudentApp: App {
    @State private var session: SessionStore

    init() {
        // Catalogs before any view can ask for a string.
        I18n.bootstrap()
        _session = State(initialValue: SessionStore())
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .tint(Palette.accent)
        }
    }
}
