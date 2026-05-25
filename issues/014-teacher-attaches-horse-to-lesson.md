# 014 — Teacher attaches a Horse to a Lesson

**Type:** AFK
**Status:** done

## What to build

A **Teacher** can pick a **Horse** from the connected **Student's** non-archived stable and attach it to a **Lesson** (and detach it again). The teacher can also reschedule the Lesson on the same edit page. Read-only horse picker — the teacher cannot create horses for the student.

## Acceptance criteria

- [ ] Migration `007_lessons_horse_id.ts` adds nullable `horse_id` (text FK → horses.id ON DELETE SET NULL) to `lessons`.
- [ ] `LessonService.update(teacherId, lessonId, { horseId?, scheduledAt? })` updates only if owned by `teacherId` (NotFoundError otherwise). If `horseId` is provided non-null, validates the horse belongs to the lesson's student AND isn't archived; throws `Error` (→ 400) otherwise. `horseId === null` detaches.
- [ ] API: `PATCH /api/lessons/:id` with TypeBox schema (`horseId` optional text-or-null, `scheduledAt` optional ISO). `requireAuth()`. 404 / 400 as above.
- [ ] Generated client exposes `lessons.update` and `Lesson` type gains `horseId: string | null` and a populated `horseName: string | null`.
- [ ] Web `/lektioner/:id` edit page (teacher-only — students see read-only detail or 404): horse `<select>` populated via `students.listHorses({ id: studentId })` with a "(ingen häst)" option; reschedule datetime input; "Spara" button.
- [ ] Lesson list rows show the attached horse name when present (e.g. "{counterparty} · {horseName}").
- [ ] Tests: service (update own works, other-teacher → NotFoundError, foreign horse → Error/400, archived horse → Error/400, detach via null works, reschedule alone works), routes (200, 404, 400).

## Blocked by

- 012 — Teacher schedules and lists own Lessons
- 008 — Student creates and lists own Horses
