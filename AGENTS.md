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
`vendor/basics-core-X.Y.Z.tgz` — not a source mirror. Nothing under
`node_modules/@basics/core` is editable; every install overwrites it.

- Take a new framework release: `bun run fw:update [X.Y.Z]`, run the checks,
  then commit `vendor/`, `package.json` and `bun.lock` **together** so app
  code and framework version revert as one.
- Working on the framework itself: `bun link @basics/core` here, edit
  `../mackans-client-fw`, and Vite serves the linked source. **Never commit
  while linked** — `bun run test` runs a guard that fails if you are. Finish
  by cutting a real framework release and running `fw:update`.

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
