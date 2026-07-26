# Deploy

Runs on `app.swedenindoorgolf.se` behind Caddy via
[sig-infra](https://github.com/marcusta/sig-infra), at path `/teacher-student/`,
port **4810**.

## Every deploy

```bash
bun run build     # writes ./public — committed, the server runs no build step
bun test
git commit -am "..."
deploy            # sig-infra: push → maintenance on → pull → install → restart → health check
```

Forgetting `bun run build` ships a stale client — the server serves whatever
`public/` holds in git.

## How the pieces fit

- **Sub-path**: Caddy `handle_path` strips `/teacher-student` before proxying,
  so the server still sees `/api/...`. `vite.config.ts` sets
  `base: '/teacher-student/'` in production; asset URLs, the router
  (`BASE_PATH` in `@basics/core/client/base`) and the API base in `web/api.ts`
  all derive from Vite's `BASE_URL`. Dev stays at `/`.
- **Static client**: `server/main.ts` serves `./public` after the `/api` routes,
  falling through to `index.html` for client-side routing.
- **Port**: `server/main.ts` defaults to 4810 — the systemd unit sets only
  `NODE_ENV`. `bun run dev:server` overrides via `PORT`.
- **Framework**: `@basics/core` is consumed as a committed, versioned tarball
  (`vendor/basics-core-X.Y.Z.tgz`), because the server has no access to the
  `mackans-client-fw` repo and runs `bun install` after pulling. To take a new
  framework release: `bun run fw:update [X.Y.Z] && bun test`, then commit
  `vendor/`, `package.json` and `bun.lock` together — app code and framework
  version then move (and revert) as one.
  Active framework work uses `bun link @basics/core`; never commit while
  linked — `bun run test` fails loudly if you try.
- **Migrations**: run automatically at boot (`createApp` in `@basics/core`), so
  `deploy.json` has no `database` section — no pre-deploy migration test and no
  automatic DB rollback. Add one (see sig-infra `SERVICE-DATABASE-GUIDE.md`) if
  migrations get risky enough to want a dry run against production data.
- **No dev seed in production**: `NODE_ENV=production` skips it; the first user
  signs up through self-registration.

## One-time server setup (not done yet)

1. Create a git remote and push (`gh repo create`) — `deploy` pushes, the server pulls.
2. On the server: `cd /srv && sudo create_and_clone_repo` (creates the directory,
   the service user and the systemd unit; set `NODE_ENV=production` in the unit).
3. `caddy_add teacher-student 4810`
4. `deploy`
