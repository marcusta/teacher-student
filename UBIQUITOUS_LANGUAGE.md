# Ubiquitous Language

Canonical terms are English (matches code, DB columns, API). The Swedish column is for dialogue with domain experts and UI copy reference — not for code identifiers.

## Actors

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Teacher** (`teacher`) | Lärare | A user who instructs one or more students in dressage. | Trainer, instructor, coach |
| **Student** (`student`) | Elev | A user who receives instruction from one or more teachers. | Rider, adept, pupil |
| **User** (`user`) | Användare | An authentication identity. The same user can be both **Teacher** and **Student** (in different **Relations**). | Account, person |

## Relation and invitation

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Relation** (`teacher_student`) | Relation | An accepted link between a **Teacher** and a **Student** that grants teacher-side features access to that student's data. | Link, connection |
| **Invitation** (`invitation`) | Inbjudan | A **Teacher**'s request to an email address to establish a **Relation**. Status: `pending`, `accepted`, `declined`, `revoked`, `expired`. | Invite |

## Horses

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Horse** (`horse`) | Häst | An animal owned by a **Student** that can be linked to **Lessons**, **Training Sessions** and **Notes**. | Mount, equine |

## Exercises and content

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Exercise** (`exercise`) | Övning | A reusable instructional unit in a **Teacher**'s **Library**, independent of any student. | Drill, move |
| **Library** (`exercise library`) | Bibliotek | A **Teacher**'s private collection of **Exercises**. | Catalogue, repertoire |
| **Student-visible catalog** | Elevkatalog | **Exercises** and **Programs** from all **Teachers** in active **Relations** with a **Student** — read-only picker source for **Training Session** attach. Not the student's own library. | Shared library, student exercises |
| **Fork** (`fork`, later feature) | Fork | A copy of a shared **Exercise** into another **Teacher**'s **Library**, with tracked provenance. | Clone, branch |

## Instructional events

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Lesson** (`lesson`) | Lektion | A planned or completed instructional event between a **Teacher** and a **Student**, optionally tied to a **Horse**, a **Plan**, and a **Program** (routine). Status: `planned`, `completed`, `cancelled`. Carries its own ordered **Exercises** via `lesson_exercise`. | Session, class |
| **Training Session** (`training_session`) | Träningspass | A practice event for a **Student**, either logged by the student or prescribed by a **Teacher** in a **Relation** with that student. Carries its own ordered **Exercises** via `training_session_exercise` and attached **Programs** via `training_session_program`. May reference a **Plan**. | Self-practice, home training |
| **Program** (`program`) | Program / Ridprogram | A **Teacher**'s reusable named sequence of **Exercises** — a routine or "ridprogram". Lives in the teacher's **Library**, independent of any student or date. When attached to a **Lesson** or **Training Session**, its exercises are **snapshot-copied** into that occasion's exercise list; later edits to the Program do not affect past occasions. | Plan, curriculum, umbrella |
| **Plan** (`plan`) | Plan / Träningsplan | A **Student**'s long-running umbrella for development over weeks or months. Contains **Lessons**, **Training Sessions**, and **Goals** via `plan_id` references. Owned by the student; any **Teacher** in an active **Relation** with the student can contribute their own authored content. Optionally designates one **Primary Teacher**. Status: `active`, `archived`. | Program, course, schedule, curriculum |
| **Primary Teacher** (`plan.primary_teacher_id`) | Huvudtränare | A soft designation on a **Plan** marking one **Teacher** as the student's main coach for that plan. Must be a teacher in an active **Relation** with the plan owner. In MVP, no elevated permissions — purely a label. | Main coach, head trainer |

## Reflection and communication

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Note** (`note`) | Anteckning | A text bound polymorphically to a **Lesson**, **Student**, **Training Session** or **Question**. Has a **Visibility**. | Comment, journal entry |
| **Visibility** (`visibility`) | Synlighet | A **Note**'s access mode: `private` (author only) or `shared` (both parties in the **Relation**). | Access, privacy |
| **Question** (`question`) | Fråga | A **Student**'s question about a specific **Exercise**. Status: `open`, `answered`, `closed`. Answers are stored as a **Note** with `parent_kind = exercise_question`. | Query, request |
| **Goal** (`goal`) | Mål | A **Student**'s long-term objective. Status: `active`, `achieved`, `abandoned`. | Ambition, target |
| **Exercise history** (`exercise_history`) | Övningshistorik | A read-only chronological view of one **Exercise** as it appeared across a **Student**'s **Lessons**, keyed by `(student_id, exercise_id)`. | Performance log, drill history |
| **Row notes** (`lesson_exercise.notes`, `training_session_exercise.notes`) | Radkommentar | Pre-written instructional text copied onto a junction row (from a **Program** snapshot or entered at attach time). Not a **Note**. | Inline notes, exercise comment |

## Media (phase 2)

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Media** (`media`) | Media | A video or image stored in R2, polymorphically linked to an **Exercise**, **Lesson**, **Training Session** or **Note** via a **Media Link**. | File, attachment |
| **Media Link** (`media_link`) | Medialänk | The binding that ties a **Media** to its parent entity. | Reference |
| **Live Session** (later) | Live-pass | A two-way video and audio event where a **Teacher** observes and talks with a **Student** training physically at a remote location. | Stream, broadcast |

## Relationships (cardinalities)

- A **User** can take part in many **Relations** — as **Teacher** in some, **Student** in others.
- An **Invitation** results in at most one **Relation**.
- A **Student** owns zero or more **Horses**.
- A **Teacher** owns zero or more **Exercises** in their **Library**.
- A **Lesson** has exactly one **Teacher**, exactly one **Student**, zero or one **Horse**, zero or one **Plan**, zero or one **Program** (routine).
- A **Lesson** contains zero or more **Exercises** (ordered, inline).
- A **Training Session** belongs to exactly one **Student**, has exactly one creator (**User**: the student or a contributing **Teacher**), optionally one **Horse**, optionally one **Plan**, zero or more attached **Programs** (routine).
- A **Training Session** contains zero or more **Exercises** (ordered, inline).
- A **Program** (routine) belongs to exactly one **Teacher** and contains one or more **Exercises** (ordered). It is reusable across many **Lessons** and **Training Sessions**.
- A **Plan** belongs to exactly one **Student**, optionally designates one **Primary Teacher**, and contains zero or more **Lessons**, **Training Sessions**, and **Goals**.
- A **Note** has exactly one author (**User**) and exactly one parent entity.
- An **Exercise history** query scopes to exactly one **Student** and one **Exercise**; each timeline entry is one `lesson_exercise` row on a **Lesson** where `student_id` matches and `exercise_id` matches.

## Example dialogue

> **Dev:** "When a **Student** logs a **Training Session**, where do the **Exercises** in the picker come from?"
>
> **Domain expert:** "From the **Student-visible catalog** — every **Exercise** owned by a **Teacher** they're in a **Relation** with. Not the student's own library; students don't author **Exercises**."
>
> **Dev:** "Can the **Student** attach a **Program** the same way?"
>
> **Domain expert:** "Yes — same catalog rule for **Programs**. Attaching snapshot-copies the routine's **Exercises** into `training_session_exercise` with `source_program_id` set. Detaching the **Program** removes only the junction row; the copied **Exercises** stay on the pass."
>
> **Dev:** "Can a **Teacher** who sees the pass via **share** edit the **Exercises**?"
>
> **Domain expert:** "No — read-only for teachers with share in slices 033–034. Only the owning **Student** adds, removes, attaches, or detaches."

## Flagged ambiguities

- **"Trainer" vs "Teacher"** were used interchangeably during design (Swedish: tränare vs lärare). Canonical term is **Teacher** (matches `teacher_id`). Avoid "trainer", "instructor", "coach" in code, docs and UI.
- **"Program" vs "Plan"** — these are deliberately distinct and easy to confuse. **Program** is a *reusable named exercise routine* in a teacher's library ("ridprogram") — no student, no date. **Plan** is *one student's long-term umbrella* ("träningsplan") — contains lessons, training sessions, and goals over weeks or months. Never use "program" to mean an umbrella or "plan" to mean a routine.
- **"Lesson" vs "Training Session"** — distinct entities by *teacher presence*, not by who creates them. **Lesson** = teacher present at the event (planned or completed). **Training Session** = no teacher present at the event, but the session itself may be either student-logged (after the fact) or teacher-prescribed (planned home work). Both carry their own ordered exercises. Never use "session" as a synonym for "lesson".
- **"User" vs "Teacher" vs "Student"** — **User** is an authentication identity. **Teacher** and **Student** are *roles* a user holds inside a specific **Relation**, not types of user. The same **User** can be both at the same time in different **Relations**.
- **"Invitation"** refers only to a teacher's request to an email address to establish a **Relation**. Not to be confused with future notifications or calendar invites for lessons.
- **"Rider" vs "Student"** — slice 032 title says "per Rider"; canonical domain term is **Student** (`student_id`). Use **Student** in code, API, and glossary; "rider" only in informal UI if ever needed.
- **"notes" overload** — `lesson_exercise.notes` and `training_session_exercise.notes` are **Row notes** (static junction text). Polymorphic `notes` rows are **Note** entities with **Visibility**. API field `rowNotes` vs `notes[]` keeps them distinct.
- **"Student-visible catalog" vs teacher Library** — `listForTeacher` scopes to the caller's own **Library**; `listForStudent` scopes to connected teachers' content for **Training Session** pickers only. Do not reuse `listForTeacher` for student attach flows.
