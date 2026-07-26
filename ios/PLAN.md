# iOS app — implementation plan & conventions

Goal: native SwiftUI port of the web client (`web/`), talking to the same Hono backend under `/api`. This file is the shared spec for every agent working in `ios/`. Read it fully before writing code.

Source-of-truth documents (read the parts relevant to your slice):

- `INFORMATION_ARCHITECTURE.md` — view specs (17 view groups), state requirements (§4), interface grammar.
- `SCOPE.md` — domain model and vocabulary.
- `web/api/*.gen.ts` — the API contract. Port field-by-field; do not invent fields.
- `web/<feature>/` — reference behavior for each screen (services = view logic, components = markup).
- `web/i18n/sv.json` + `en.json` — the copy. Never hardcode user-facing strings.

## Stack

| Concern | Choice |
|---|---|
| UI | SwiftUI, iOS 17+, `@Observable` view models (MVVM, mirrors web services) |
| Project | XcodeGen (`ios/project.yml`), target `TeacherStudent` |
| Networking | `URLSession` + `Codable`; session cookie auth via shared `HTTPCookieStorage` |
| i18n | The web JSON catalogs, bundled as resources from `../web/i18n/` via project.yml |
| Dependencies | None. No SPM packages. |

## Directory layout

```
ios/
  project.yml
  PLAN.md
  TeacherStudent/
    App/            # entry, root auth gate, tab shell, navigation
    Core/
      Api/          # ApiClient + one file per web/api/*.gen.ts port + AuthApi
      Session/      # SessionStore (current user, login/logout/me, debug token)
      I18n/         # catalog loader, t()/plural(), date formatters
      Theme/        # colors, spacing, typography
      UI/           # shared components (chips, DetailHeader, NoteThread, OccasionRow, state views)
    Features/
      Auth/         # login + register
      Home/         # Hem dashboard
      Inbox/        # Inkorg (invitations)
      Lessons/      # Lektioner list/create/detail
      TrainingSessions/
      Plans/
      Goals/
      Students/     # Mina elever, Elevvy tabs, exercise history
      Library/      # exercises (Bibliotek · Övningar)
      Programs/     # Bibliotek · Program
      Stable/       # Hästar
```

## Hard conventions (all agents)

1. **Ownership**: touch only the directories your task assigns. Shared code lives in `Core/` — use it, never edit it from a feature task. If something is missing in Core, work around it locally in your feature dir and note it in your final report.
2. **No project mutation**: `project.yml` uses directory globs; adding Swift files requires no project edits. Do not run `xcodegen` or `xcodebuild` from feature tasks (the orchestrator does the integration build). Syntax-check your files with `xcrun swiftc -parse <files>`.
3. **API fidelity**: Swift models mirror `web/api/*.gen.ts` exactly — same property names (camelCase as-is), `null | T` → `T?`, string unions → `enum ... : String, Codable` plus lenient decoding fallback where the web treats values loosely. Timestamps/dates arrive as ISO strings — keep `String` in DTOs and convert via `Core/I18n` formatters at the view layer.
4. **Copy**: every user-facing string via `I18n.t("key")` / `I18n.plural("key", n)` using existing keys from `web/i18n/sv.json`. Missing key → add nothing; reuse the closest existing key or fall back to sv text noted in your report. Swedish is source of truth; locale default sv, no auto-detect.
5. **State grammar** (IA §4): every screen defines loading, empty, error+retry, and not-found states explicitly (use `Core/UI` state views). Destructive actions confirm with the specific consequence. Lists put retrieval first; creation is a separate sheet/screen.
6. **Errors**: `ApiClient` maps the server error envelope the same way `node_modules/@basics/core/client/fetch.ts` + `api-error.ts` do (status, code, message). 401 anywhere → SessionStore signs out to the auth gate. Show actionable Swedish copy, not raw messages.
7. **Navigation**: 5 tabs — Hem, Inkorg, Träning (Lektioner/Träningspass), Planering (Planer/Mål/Hästar), Undervisning (Mina elever/Bibliotek). Sub-destinations inside a tab use `NavigationStack`; labels come from the `nav.*` i18n keys. Never gate Mål/Planer/Hästar/Träningspass on role.
8. **Style**: match Apple HIG; system fonts; theme colors in `Core/Theme` approximating the web theme (`web/theme.ts`). Support dark mode and Dynamic Type. Comments only where the code can't explain a constraint.

## Backend

- Base URL: `UserDefaults` key `apiBaseURL`, Debug default `http://localhost:4810/api`. ATS exception for localhost only.
- Auth: `POST /auth/login` `{username, password}` (username = email) → user JSON + `Set-Cookie: session=…` (httpOnly; URLSession stores it automatically). `POST /auth/logout`, `GET /auth/me`. Registration per `web/api/register.gen.ts`.
- Debug builds only: an extra field on the login screen accepting a raw session token (from `bun run dev:session -- anna@example.com`), which sets the `session` cookie in `HTTPCookieStorage` for the base URL host. This is the supported agent/dev sign-in path (see AGENTS.md); never hardcode or invent passwords.

## Screen inventory → feature slice

| IA # | Screen | Feature dir |
|---|---|---|
| 17 | Login / Registrera | Auth (scaffold wave) |
| 1 | Hem dashboard (`dashboard.gen.ts`) | Home |
| 2 | Inkorg — invitations, accept/decline | Inbox |
| 3–4 | Mina elever + Elevvy (Översikt/Lektioner/Pass/Planer/Mål/Hästar/Historik tabs) | Students |
| 16 | Övningshistorik | Students |
| 5 | Bibliotek · Övningar CRUD | Library |
| 6 | Bibliotek · Program builder (ordered exercises, reorder, row notes) | Programs |
| 7–8 | Lektioner list (Kommande/Tidigare) + create + detail (exercises, per-exercise notes, lesson notes, status transitions) | Lessons |
| 9–10 | Träningspass list + logga pass + detail (sharing, programs, notes) | TrainingSessions |
| 11–12 | Planer + Plan detail (goals, lessons, sessions linked) | Plans |
| 13–14 | Mål + Mål detail (status transitions, sharing, plan links, notes) | Goals |
| 15 | Hästar list + detail + archive | Stable |

Per-feature reference: mirror the corresponding `web/<dir>/` service + components. The web client is the product spec where IA and code disagree on details.

## Waves

1. **Scaffold** (one agent): project.yml, App shell + tabs, Theme, I18n, ApiClient + AuthApi, SessionStore, Auth screens, `Core/UI` state views + chips, placeholder feature screens. Must build clean via `xcodegen generate` + `xcodebuild -scheme TeacherStudent -destination 'generic/platform=iOS Simulator' build`.
2. **API + shared UI** (one agent): port all 13 `web/api/*.gen.ts` files; build `NoteThread`, `OccasionRow`, `DetailHeader` shared components.
3. **Features** (parallel agents): one slice each per the table above.
4. **Integration build + fixes** (orchestrator).
5. **Review** (parallel agents): web parity, API fidelity, Swift quality, auth/i18n/state.
6. Fixes, final build, commit on main.
