# Agent guide — teacher-student

This file is for coding agents working in this repo. Humans can skim it; agents should follow it.

## Stack (local)

| Process | Command | URL |
|---|---|---|
| API + static | `bun run dev:server` | http://localhost:4810 |
| Vite (UI) | `bun run dev` | http://localhost:4811 (proxies `/api` → :4810) |

SQLite files (gitignored under `data/`):

- `DB_PATH` → `./data/app.sqlite` (default)
- `SESSION_DB_PATH` → `./data/sessions.sqlite` (default)

## Framework dependency

`@basics/core` is a **versioned tarball** committed at
`vendor/basics-core-X.Y.Z.tgz` — not a source mirror. It installs into
`node_modules/@basics/core` as a real directory with its integrity hash in
`bun.lock`, and resolves through normal node_modules resolution (there is no
Vite alias). Upstream source lives in `../mackans-client-fw`, which cuts real
releases: git tags, a `CHANGELOG.md`, `release.ts`, and consumer tooling in
`tools/`.

**1. Never edit the installed copy.** Nothing under `node_modules/@basics/core`
is editable — every install overwrites it — and `vendor/basics-core/` must
never come back as a directory. Framework fixes go in `../mackans-client-fw`,
get released there (`bun release.ts <major|minor|patch>`, which requires a
matching `## <version>` heading in its `CHANGELOG.md`), then land here:

```bash
bun run fw:update [X.Y.Z]
```

Run the checks, then commit `vendor/*.tgz`, `package.json` and `bun.lock`
**together** in one commit so app code and framework version move — and revert
— as one.

**2. Active framework development** against this app: `bun link @basics/core`
here, edit `../mackans-client-fw`, and Vite serves and HMRs the linked source
(`vite.config.ts` excludes it from `optimizeDeps` for exactly this).
**Never commit while linked** — `bun run test` starts with
`../mackans-client-fw/tools/assert-not-linked.ts` and fails loudly. Do not
remove or bypass that guard. Finish by cutting a real release upstream and
running `fw:update`.

**3. Restart the Vite dev server** after any `fw:update` or link/unlink. Only
if modules still look stale (`does not provide an export named ...`) do
`rm -rf node_modules/.vite`. This is no longer a routine ritual: the version in
the tarball filename invalidates Vite's pre-bundle cache on its own.

**4. Recipe interpolations come first in a CSS block.** `${btn()}`,
`${input()}`, `${label()}`, `${errorText()}` go at the **top** of the block and
app overrides after (ADR-005, `../mackans-client-fw/docs/decisions.md`). The
1.x recipes emit sizing (padding, font-size, line-height), so a recipe placed
after an override silently wins. `${card()}` emits no sizing today, so its call
sites are order-insensitive — re-check the framework `CHANGELOG.md` on every
update in case that changes.

**5. `web/theme.ts` stays on the design-system vocabulary it already uses.**
This app drove the 1.x control-token vocabulary; its `controlTokens` are
byte-identical to v1.1.0 and every `--field-*`/`--btn-*` read in `css.ts`
carries an inline fallback. New framework tokens go into `web/theme.ts` by
name. Do **not** introduce legacy aliases or call `bridgeLegacyControls` — that
helper exists for pre-1.0 legacy-vocabulary themes (tapscore) and would be
actively wrong here.

Consumption status across all consumers: `bun ../mackans-client-fw/tools/status.ts`.

## Database deployment

`deploy.json` configures `data/app.sqlite` for the sig-infra database workflow.
`deploy --db` stops the service, snapshots the database, migrates and validates
the snapshot, then backs up and replaces the live file. `deploy --auto` detects
changes under `server/db/migrations`.

The deploy commands reuse the same migrations as app startup:

```bash
DB_PATH=deploy-tmp/db.sqlite bun run db:migrate
DB_PATH=deploy-tmp/db.sqlite bun run db:health
```

Both commands require an explicit `DB_PATH` pointing to an existing SQLite file.
During deploy, sig-infra supplies the snapshot path. Use a database copy for
local rehearsal. Validation checks migration history, required runtime columns,
SQLite integrity and foreign keys.

Regression checks: `bun test scripts/db-deploy.test.ts`.

## Signing in for UI testing (no passwords)

Agents must **not** automate the login form and must **not** use or invent credentials.
There is a supported path that mints a real session cookie and bypasses `POST /api/auth/login`.

### 1. Seed local data

```bash
bun run dev:seed
```

Creates (idempotent) a Swedish riding fixture that lights up all four Hem cards for the primary user:

| Email | Role in the fixture |
|---|---|
| `anna@example.com` | Primary — rides with Lisa, teaches Maja |
| `lisa@example.com` | Anna's teacher |
| `maja@example.com` | Anna's junior student |

What Anna gets on Hem:

1. **Nästa lektion** — upcoming lesson with horse Saga + exercises  
2. **Senaste återkoppling** — shared note from Lisa  
3. **Väntar på återkoppling** — completed lesson Anna taught Maja  
4. **Ridning** — active plan + goal inside the 30-day horizon  

Both `dev:seed` and `dev:session` refuse to run when `NODE_ENV=production` or when the DB path is not a local SQLite file under the project root.

### 2. Mint a session cookie

```bash
bun run dev:session -- anna@example.com
```

Prints the cookie name (`session` by default) and value, plus ready-to-paste Playwright / CDP cookie objects for both origins.

### 3. Set the cookie in the browser

The cookie is **httpOnly** — `document.cookie` will not work. Use the browser automation cookie API instead.

**Vite UI (:4811):**

```json
{
  "name": "session",
  "value": "<token from dev:session>",
  "url": "http://localhost:4811",
  "path": "/",
  "httpOnly": true,
  "sameSite": "Lax"
}
```

**Hono-served build (:4810):** same object with `"url": "http://localhost:4810"`.

Then open `/` (or reload). `GET /api/auth/me` should return Anna; Hem should show the four cards.

### Why this exists

- Agents are often blocked from password-based login flows.
- Writing a password into scripts, chat, or browser automation is unnecessary when the sessions table already stores opaque tokens (`SessionStore` in `@basics/core/server/auth`).
- Real-session verification should be the default. If you cannot sign in, use this route — do not invent another one.

## Quick checks

```bash
bun run check:client && bun run check:server
bun test scripts/dev-guard.test.ts scripts/dev-session.test.ts
```
