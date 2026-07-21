import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Served behind Caddy at https://app.swedenindoorgolf.se/teacher-student/ in
// production (Caddy strips the /teacher-student prefix before proxying).
// `base` makes asset URLs, the router's BASE_URL, and the API base carry the
// prefix; dev stays at '/'.
export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/teacher-student/' : '/',
    // No separate static-assets dir; ./public is the build output, so disable
    // publicDir to avoid it colliding with outDir on rebuilds.
    publicDir: false,
    resolve: {
        alias: {
            // Resolve @basics/core to the in-project vendor mirror rather than
            // to node_modules.
            //
            // `package.json` declares it `file:./vendor/basics-core`, and bun
            // COPIES a file: dep into node_modules rather than symlinking. Vite
            // then treats that copy as an ordinary dependency: it does not watch
            // node_modules, it pre-bundles it, and it serves the result with
            // `Cache-Control: immutable`. All three assume a dependency cannot
            // change while the server runs — which is false for a framework
            // vendored from a sibling repo you are actively editing.
            //
            // The result was a dev server that silently served hours-old
            // framework code, with no HMR event and no failure to notice. A
            // `curl` of the module looked correct, because that re-reads from
            // disk and bypasses both the pre-bundle and the browser cache.
            //
            // Pointing at vendor/ puts the framework inside the watched tree, so
            // it hot-reloads like any other source file and `bun install` stops
            // mattering in dev. The build resolves through the same alias, so
            // dev and production cannot diverge. Re-run `bun run vendor:basics`
            // after editing the framework repo — that mirror is still the thing
            // the deploy server installs.
            '@basics/core': fileURLToPath(new URL('./vendor/basics-core', import.meta.url)),
        },
    },
    build: {
        // Built client is committed to git and served by the Hono server
        // (server/main.ts). The deploy runs no build step, so this is the
        // shipped artifact — run `bun run build` before deploying.
        outDir: 'public',
        emptyOutDir: true,
    },
    server: {
        port: 4811,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4810',
                changeOrigin: true,
            },
        },
    },
});
