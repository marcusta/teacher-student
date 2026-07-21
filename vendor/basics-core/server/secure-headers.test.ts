import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { parseCrossOriginResourcePolicy, type CrossOriginResourcePolicy } from './config';

// Mirrors the secureHeaders wiring in createApp() (app.ts) so header behavior
// can be verified without booting databases and migrations.
function createTestApp(policy: CrossOriginResourcePolicy): Hono {
    const app = new Hono();
    app.use(secureHeaders({ crossOriginResourcePolicy: policy }));
    app.get('/tiles/0.png', (c) => c.body('tile-bytes'));
    app.get('/tiles/custom.png', (c) => {
        c.header('Cross-Origin-Resource-Policy', 'cross-origin');
        return c.body('tile-bytes');
    });
    return app;
}

test('parse: undefined defaults to same-origin', () => {
    expect(parseCrossOriginResourcePolicy(undefined)).toBe('same-origin');
});

test('parse: passes through explicit values', () => {
    expect(parseCrossOriginResourcePolicy('same-origin')).toBe('same-origin');
    expect(parseCrossOriginResourcePolicy('same-site')).toBe('same-site');
    expect(parseCrossOriginResourcePolicy('cross-origin')).toBe('cross-origin');
});

test("parse: 'false' disables the header", () => {
    expect(parseCrossOriginResourcePolicy('false')).toBe(false);
});

test('default policy sets Cross-Origin-Resource-Policy: same-origin', async () => {
    const app = createTestApp(parseCrossOriginResourcePolicy(undefined));
    const res = await app.request('/tiles/0.png');
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
});

test('handlers cannot override the header while the policy is active', async () => {
    // secureHeaders runs after handlers (onion middleware) — the configured
    // value wins even when a route sets its own header.
    const app = createTestApp('same-origin');
    const res = await app.request('/tiles/custom.png');
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
});

test('cross-origin policy makes responses consumable from other origins', async () => {
    const app = createTestApp(parseCrossOriginResourcePolicy('cross-origin'));
    const res = await app.request('/tiles/0.png');
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');
});

test('disabled policy omits the header so routes can set their own', async () => {
    const app = createTestApp(parseCrossOriginResourcePolicy('false'));
    const plain = await app.request('/tiles/0.png');
    expect(plain.headers.get('Cross-Origin-Resource-Policy')).toBeNull();
    const custom = await app.request('/tiles/custom.png');
    expect(custom.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');
});

test('other secure headers remain intact when policy changes', async () => {
    const app = createTestApp('cross-origin');
    const res = await app.request('/tiles/0.png');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
});
