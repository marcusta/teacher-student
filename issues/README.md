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
