import { defineConfig } from 'vite';

export default defineConfig({
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
