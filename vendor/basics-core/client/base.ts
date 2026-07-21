// Deploy base path — lets an app be served under a sub-path (e.g.
// '/tapscore/', '/teacher-student/') behind a reverse proxy that strips the
// prefix before proxying. Sourced from Vite's BASE_URL, which is the build-time
// `base` config ('/' → '' when served at the root).
//
// Anything in the framework that builds an absolute URL must go through these,
// not a hardcoded '/api' — a literal would resolve against the origin root and
// hit the wrong service on a shared-host, path-routed deploy.
export const BASE_PATH = ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/').replace(/\/+$/, '');

/** Base for framework-owned API calls (auth, obs). Apps build their own from BASE_PATH. */
export const API_BASE = BASE_PATH + '/api';
