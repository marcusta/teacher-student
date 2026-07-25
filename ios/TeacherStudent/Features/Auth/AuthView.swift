import SwiftUI

/// The signed-out shell. One stack, login at its root, register pushed onto it —
/// which is the phone-shaped equivalent of the web's two public routes.
struct AuthView: View {
    var body: some View {
        NavigationStack {
            LoginView()
        }
        .tint(Palette.accent)
    }
}
