# 002 — Teacher creates Invitation

**Type:** AFK
**Status:** open

## What to build

A logged-in **User** acting as **Teacher** can create an **Invitation** by entering an email address. The **Invitation** is persisted regardless of whether a **User** with that email exists yet — when the invitee registers (or is already registered), the **Invitation** becomes visible to them.

The web client gets a "My invitations" view listing **Invitations** the teacher has created, with their current status. The teacher can revoke a `pending` **Invitation**.

## Acceptance criteria

- [ ] `invitation` table migration: `id`, `teacher_id`, `invitee_email`, `status`, `created_at`, `expires_at`, `accepted_at?`.
- [ ] Status starts at `pending`. Allowed transitions: `pending → accepted | declined | revoked | expired`.
- [ ] `expires_at` set automatically (suggest 30 days from creation).
- [ ] Email is lowercased and trimmed before insert. Same `(teacher_id, invitee_email)` can have only one non-terminal **Invitation** at a time (unique partial index on `pending`).
- [ ] `InvitationService.createInvitation(teacherId, inviteeEmail)` returns the new **Invitation**. Throws a domain error if a pending one already exists.
- [ ] `InvitationService.revokeInvitation(invitationId, teacherId)` sets status to `revoked`. Only the owning **Teacher** can revoke.
- [ ] `InvitationService.listByTeacher(teacherId)` returns all **Invitations** the **Teacher** has created, newest first.
- [ ] API descriptors: `POST /api/invitations`, `POST /api/invitations/revoke`, `GET /api/invitations`. All `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose the three methods.
- [ ] `/invitations` route in web client: form to invite by email + list of created invitations with status badges. Revoke button on `pending` rows.
- [ ] Tests: service tests (create, duplicate-pending, revoke, list, only-owner-can-revoke), route tests covering auth + happy path + 409 on duplicate.

## Blocked by

- 001 — Self-registration
