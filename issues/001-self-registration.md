# 001 — Self-registration

**Type:** HITL (small)
**Status:** done

## What to build

A new **User** can create an account via the web client. Replaces the scaffold's `username`-based registration with `email` + `display_name` + `password`. After successful registration the user is logged in and lands on `/home`.

This is the tracer-bullet slice for the stack: exercises a migration, a service method, a TypeBox-validated API descriptor, the codegen pipeline, a web form using the framework's signal/wire primitives, and end-to-end error handling on duplicate email.

## Acceptance criteria

- [ ] `users` table has `email` (unique, not null), `password_hash`, `display_name`, `created_at`. Migration replaces the existing scaffold schema.
- [ ] `UserService.register(email, password, displayName)` creates a row with hashed password, returns `{ id, email, display_name }`.
- [ ] `POST /api/auth/register` descriptor exists with TypeBox schema. Duplicate email returns a clean 409 (not a 500).
- [ ] `bun run generate` produces a typed client for the endpoint; `web/api.ts` exposes it.
- [ ] `/register` route in web client shows a form with email + display name + password. Submitting calls the API, then logs the user in (creates a session) and navigates to `/home`.
- [ ] Login form (existing) accepts email instead of username. Framework auth wired through (`verify` uses email).
- [ ] Validation: empty fields blocked client-side; invalid email format blocked; password length enforced (decision pending).
- [ ] Tests: service test (register + duplicate), route test (register + duplicate + login by email + me), client service signal test.

## HITL decisions needed before merging

- Minimum password length (suggest 8)
- bcrypt/argon work factor (Bun.password defaults are fine if confirmed)
- Whether `/register` is publicly linked from `/login` (suggest yes) or only reachable via direct URL

## Blocked by

None — can start immediately.
