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
    // @basics/core arrives as a versioned tarball, so its pre-bundle is
    // invalidated by the version in the filename. Excluding it from
    // optimizeDeps additionally means that during active framework work
    // (`bun link @basics/core`) Vite serves the linked source and HMRs it,
    // instead of pinning a pre-bundled snapshot for the life of the server.
    // Harmless when unlinked.
    optimizeDeps: {
        exclude: ['@basics/core'],
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
