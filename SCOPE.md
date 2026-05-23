# Teacher-Student — Scope & Design

iOS- och webbapp för tränare och elever inom hästdressyr. Server-baserad så data delas mellan parterna.

## Roller

En användare kan vara både lärare och elev samtidigt (rollen är kontextuell — bestäms av sidan av en `teacher_student`-relation, inte av en kolumn på `user`).

### Lärare kan
- Se sina elever
- Skapa övningar (lärarens privata bibliotek, ej knutna till elev) med beskrivning och senare video
- Per elev:
  - Planera lektioner med innehåll och övningar
  - Anteckna kring lektioner (privat eller delat med elev)
  - Allmänna anteckningar om eleven
  - Lägga upp träningsprogram (innehåller både planerade lektioner och hemma-övningar)
  - Se elevens anteckningar och kommentera

### Elever kan
- Se träningsprogram, övningar, lektioner från sina lärare
- Ställa frågor om övningar
- Anteckna kring lektioner och egna träningspass
- Lägga upp långsiktiga mål

## Avgränsningar (Sverige, MVP)

- Alla användare antas vara 15+ initialt
- Endast Sverige
- Ingen betalmodell (alla funktioner gratis under MVP)
- Föräldrasamtycke / minderåriga: senare (svenska regler — under 13 kräver vårdnadshavare enligt dataskyddsförordningen / IMY:s vägledning)

## Teknik-stack

| Lager | Val |
|-------|-----|
| Mönster | `mackans-client-fw` — strikt följt |
| Backend | Bun + Hono + Kysely + SQLite (WAL) på egen VPS |
| Schema | `@sinclair/typebox` |
| Web | Vite + `@basics/core/client` (signals, MVVM, ingen virtuell DOM) |
| iOS | Native Swift/SwiftUI (senare) |
| Auth | Framework-inbyggd `SessionStore` / `createAuthApi()` |
| Codegen | TS-klient idag, Swift-klient läggs till i framework senare |
| Media | Cloudflare R2 via presigned PUT (fri egress) |
| Video | H.265, 720p, 25–30fps, lång GOP. Transkodning klientside i iOS. Webbklienten visar metadata/thumbnail. |

## Repo-struktur

```
teacher-student/
  server/      # Bun + Hono + Kysely + SQLite
  web/         # Vite + @basics/core/client (testklient)
  ios/         # Swift (senare)
  SCOPE.md
```

Båda paketen tar `@basics/core` via `"file:../../mackans-client-fw/core"`.

## Datamodell — MVP

Alla `*_at`-fält är unix epoch ms i UTC. Presenteras i användarens tidszon klientside.

```
user
  id, email (unique), password_hash, display_name, created_at

session                            [från framework]

invitation
  id, teacher_id, invitee_email, status, created_at,
  expires_at, accepted_at?
  status: pending | accepted | declined | revoked | expired

teacher_student
  id, teacher_id, student_id, invitation_id, created_at
  unique(teacher_id, student_id)

horse
  id, student_id, name, breed?, birth_year?, notes?,
  archived_at?, created_at

exercise                           [lärarens privata bibliotek]
  id, teacher_id, title, description, level?,
  tags (json array), created_at

lesson
  id, teacher_id, student_id, horse_id?, program_id?,
  scheduled_at, duration_min?, status, created_at
  status: planned | completed | cancelled

lesson_exercise
  lesson_id, exercise_id, sort_order, notes?
  PK(lesson_id, exercise_id)

program                            [paraply: lektioner + hemma-övningar]
  id, teacher_id, student_id, title, description?,
  start_date?, end_date?, created_at

program_exercise                   [hemma-övningar i programmet]
  program_id, exercise_id, sort_order, notes?
  PK(program_id, exercise_id)

training_session                   [elevens egen logg]
  id, student_id, horse_id?, program_id?, performed_at,
  duration_min?, summary?, created_at

note                               [unifierad, polymorf parent]
  id, author_id, parent_kind, parent_id, body,
  visibility, created_at
  parent_kind: lesson | student | training_session | exercise_question
  visibility:  private | shared

goal                               [elevens långsiktiga mål]
  id, student_id, title, description?, target_date?,
  status, created_at
  status: active | achieved | abandoned

question                           [elev frågar om övning]
  id, student_id, exercise_id, body, status, created_at
  status: open | answered | closed
  (svar = note med parent_kind=exercise_question)
```

### Designnoteringar

- **Unifierad `note`** istället för per-typ-anteckningstabeller. Behörighet: `private` → endast `author_id`; `shared` → båda parter i relationen.
- **`exercise.tags`** som JSON-array i SQLite. Normaliseras vid behov.
- **`teacher_student.invitation_id`** spårar härkomst.
- **Inbjudningsflöde**: lärare anger e-post → invitation skapas oavsett om kontot finns → vid registrering matchas mot pending invitations → eleven accepterar → relation skapas.
- **Soft-delete**: bara `horse.archived_at` initialt.

## Media-modell (fas 2)

```
media
  id, owner_id, kind, r2_key, mime, size_bytes,
  duration_ms?, thumb_r2_key?, status, created_at
  kind: video | image
  status: pending | ready | failed

media_link                         [polymorf koppling]
  media_id, parent_kind, parent_id
  parent_kind: exercise | lesson | training_session | note
  PK(media_id, parent_kind, parent_id)
```

### Uppladdningsflöde
1. Klient initierar: POST till backend med metadata (filename, size, parent).
2. Backend validerar auktorisering, skapar presigned PUT-URL (15 min) mot R2, returnerar URL + nyckel.
3. Klient laddar upp direkt till R2 via URLSession (bakgrundsuppladdning på iOS).
4. Klient committar: backend HEAD:ar objektet i R2, skapar `media` + `media_link`.
5. Cron städar pending uploads äldre än X timmar. R2 lifecycle på `tmp/`-prefix som backup.

Säkerhet i presign: max-storleksgräns, `Content-Type` och checksum låsta i signaturen.

## Senare features (medvetna avgränsningar)

- **Community-delning av övningar** — additivt: `exercise.visibility`, `forked_from_id`, `original_author_id`. Kopia-vid-fork (ingen referens till annans rad), så ägaren av originalet inte påverkar forks.
- **Avsluta lärare↔elev-relation** — `ended_at` eller hård delete
- **GDPR / minderåriga / föräldrasamtycke** (Sverige)
- **Notifieringar** + read-status, push på iOS
- **Närvaro / inställda lektioner med skäl**
- **Tävlingsprotokoll**
- **Video — fas 2**: uppladdning + uppspelning
- **Live-video + dubbelriktat ljud — fas 3**: WebRTC, t.ex. LiveKit
- **AV1 / ffmpeg.wasm fallback** för webbklient om H.265-uppspelning behövs där
- **Häst-delning mellan elever**

## Arbetsordning

1. Scaffolda `server/` och `web/` från `mackans-client-fw/apps/starter`.
2. Migrations för MVP-tabellerna.
3. Bygg feature-för-feature med tester:
   auth → invitations → relations → horses → exercises → lessons → programs → notes → goals → questions.
4. Minimal webbtestklient parallellt (en sida per feature).
5. Iterera tills backend känns stabil.
6. Lägg till Swift-codegen i `mackans-client-fw`.
7. iOS-app.
