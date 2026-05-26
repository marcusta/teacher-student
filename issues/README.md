# Issues

Lokala issues för teacher-student. Filer numreras `NNN-kebab-name.md`.

## Status-konvention

- `open` — redo att plockas upp
- `in_progress` — pågår
- `blocked` — väntar på beroende
- `done` — färdig (flyttas eventuellt till `issues/archive/` när det börjar bli många)

## Aktiva slices

| # | Titel | Type | Blocked by |
|---|-------|------|------------|
| [001](001-self-registration.md) | Self-registration | HITL (small) | — |
| [002](002-teacher-creates-invitation.md) | Teacher creates Invitation | AFK | 001 |
| [003](003-student-accepts-invitation.md) | Student sees and responds to Invitation | AFK | 002 |
| [004](004-teacher-sees-students.md) | Teacher sees Students list | AFK | 003 |

Efter 004 är hela `User ↔ Relation`-grafen på plats. Då kan följande features byggas i valfri ordning mot den: Horse, Exercise, Library, Lesson, Program, Training Session, Note, Question, Goal.
| [005](005-teacher-creates-and-lists-exercises.md) | Teacher creates and lists Exercises | AFK | 004 |
| [006](006-teacher-edits-exercise.md) | Teacher edits an Exercise | AFK | 005 |
| [007](007-teacher-deletes-exercise.md) | Teacher deletes an Exercise | AFK | 005 |
| [008](008-student-creates-and-lists-horses.md) | Student creates and lists own Horses | AFK | 004 |
| [009](009-student-edits-horse.md) | Student edits a Horse | AFK | 008 |
| [010](010-student-archives-horse.md) | Student archives a Horse | AFK | 008 |
| [011](011-teacher-sees-student-horses.md) | Teacher sees a Student's Horses | AFK | 008 |
| [012](012-teacher-schedules-and-lists-lessons.md) | Teacher schedules and lists own Lessons | AFK | 004 |
| [013](013-student-sees-own-lessons.md) | Student sees own Lessons | AFK | 012 |
| [014](014-teacher-attaches-horse-to-lesson.md) | Teacher attaches a Horse to a Lesson | AFK | 012, 008 |
| [015](015-teacher-transitions-lesson-status.md) | Teacher transitions Lesson status | AFK | 014 |
| [016](016-teacher-links-exercises-to-lesson.md) | Teacher links Exercises to a Lesson | AFK | 014, 005 |
| [017](017-teacher-writes-notes-on-lesson.md) | Teacher writes Notes on a Lesson | AFK | 012 |
| [018](018-student-writes-notes-on-shared-lesson.md) | Student writes Notes on a shared Lesson | AFK | 017, 013 |
| [019](019-student-logs-and-lists-training-sessions.md) | Student logs and lists own Training Sessions | AFK | 004 |
| [020](020-student-attaches-horse-to-training-session.md) | Student attaches a Horse to a Training Session | AFK | 019, 008 |
| [021](021-student-writes-notes-on-training-session.md) | Student writes Notes on own Training Session | AFK | 019, 017 |
| [022](022-teacher-sees-and-notes-shared-training-sessions.md) | Teacher sees and writes Notes on shared Training Sessions | AFK | 021 |

### Group A — Program (reusable exercise routine / "ridprogram" in teacher's library)

| # | Titel | Type | Blocked by |
|---|-------|------|------------|
| [023](023-teacher-creates-and-lists-programs.md) | Teacher creates and lists own Programs in library | AFK | — |
| [024](024-teacher-edits-program.md) | Teacher edits a Program | AFK | 023 |
| [025](025-teacher-deletes-program.md) | Teacher deletes a Program | AFK | 023 |
| [026](026-teacher-adds-exercise-to-program.md) | Teacher adds an Exercise to a Program | AFK | 023, 005 |
| [027](027-teacher-manages-program-exercises.md) | Teacher reorders and removes Exercises in a Program | AFK | 026 |

### Group B — Program attaches to Lesson (snapshot-copy) + per-Exercise tracking

| # | Titel | Type | Blocked by |
|---|-------|------|------------|
| [028](028-teacher-attaches-program-at-lesson-create.md) | Teacher attaches Program when creating Lesson | AFK | 026, 012 |
| [029](029-lesson-exercise-surrogate-id-and-source-program.md) | `lesson_exercise` surrogate id + `source_program_id` | AFK | 028 |
| [030](030-multiple-programs-per-lesson.md) | Multiple Programs per Lesson via `lesson_program` junction | AFK | 029 |
| [031](031-notes-on-lesson-exercise.md) | Notes on a `lesson_exercise` row | AFK | 029, 017 |
| [032](032-exercise-history-per-rider.md) | Exercise history for a Student ("Övningshistorik") | AFK | 031 |
