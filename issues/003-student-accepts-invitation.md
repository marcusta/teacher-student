# 003 — Student sees and responds to Invitation

**Type:** AFK
**Status:** done

## What to build

A **User** sees pending **Invitations** addressed to their email and can accept or decline each one. Accepting creates a **Relation** between the inviting **Teacher** and the accepting **User** (acting as **Student**). Declining marks the **Invitation** terminal without creating a **Relation**.

Newly-registered users see any pre-existing **Invitations** matching their email at next login.

## Acceptance criteria

- [ ] `teacher_student` table migration: `id`, `teacher_id`, `student_id`, `invitation_id`, `created_at`. `unique(teacher_id, student_id)`.
- [ ] `InvitationService.listForUser(userEmail)` returns all `pending` **Invitations** whose `invitee_email` matches (case-insensitive).
- [ ] `InvitationService.acceptInvitation(invitationId, userId, userEmail)` validates ownership (invitation's `invitee_email` matches user's email), creates the **Relation** in a transaction with the status update to `accepted` and `accepted_at`, and returns the new **Relation**.
- [ ] `InvitationService.declineInvitation(invitationId, userId, userEmail)` sets status to `declined`. Same ownership check.
- [ ] Re-accepting/declining a non-`pending` **Invitation** returns 409.
- [ ] API descriptors: `GET /api/invitations/inbox`, `POST /api/invitations/accept`, `POST /api/invitations/decline`. All `requireAuth()`.
- [ ] Generated client + `web/api.ts` expose the three methods.
- [ ] `/inbox` route in web client: list of inbound invitations with teacher name + accept/decline buttons. Empty state when no pending invitations.
- [ ] Navigation gains a badge / link to `/inbox` when at least one pending invitation exists for the logged-in user.
- [ ] Tests: service tests (list-by-email case-insensitive, accept creates relation in transaction, decline does not, ownership rejected, double-accept 409), route tests for happy paths + 409s.

## Blocked by

- 002 — Teacher creates Invitation
