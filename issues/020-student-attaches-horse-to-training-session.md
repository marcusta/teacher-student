# 020 — Student attaches a Horse to a Training Session

**Type:** AFK
**Status:** open

## What to build

A **Student** can optionally attach one of their own **Horses** to a **Training Session** at create or edit time. Mirrors 014 but for Training Sessions and student-owned.

## Acceptance criteria

- [x] Migration `011_training_sessions_horse.ts` adds `horse_id` (text NULL, FK → horses.id ON DELETE SET NULL) to `training_sessions`. Index `(horse_id)`.
- [x] `TrainingSessionService.create` + `update` accept optional `horseId`. Validates the horse belongs to the acting student (NotFoundError otherwise) and is not archived. `null` clears the attachment.
- [x] Generated `TrainingSession` type gains `horseId: string | null` and `horseName: string | null` (resolved server-side, like lessons do for counterparty).
- [x] `listForStudent` includes the resolved `horseName`.
- [x] Web `/traningspass`: form gains a horse picker (current student's non-archived horses; empty option for "Ingen häst"). List rows show horse name when present.
- [x] Tests: service (create with own horse persists, create with someone else's horse → NotFoundError, create with archived horse → NotFoundError, update clears via `null`, listForStudent includes horseName), routes parity.

## Blocked by

- 019 — Student logs and lists own Training Sessions
- 008 — Student creates and lists own Horses
