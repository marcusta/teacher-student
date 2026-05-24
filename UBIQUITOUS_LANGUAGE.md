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
| **Fork** (`fork`, later feature) | Fork | A copy of a shared **Exercise** into another **Teacher**'s **Library**, with tracked provenance. | Clone, branch |

## Instructional events

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Lesson** (`lesson`) | Lektion | A planned or completed instructional event between a **Teacher** and a **Student**, optionally tied to a **Horse** and a **Program**. Status: `planned`, `completed`, `cancelled`. | Session, class |
| **Training Session** (`training_session`) | Träningspass | A self-directed practice event a **Student** logs without a teacher present. | Self-practice, home training |
| **Program** (`program`) | Program | An umbrella a **Teacher** sets up for a **Student**: contains both scheduled **Lessons** and **Exercises** to perform independently. | Plan, course, schedule, curriculum |

## Reflection and communication

| Term | Swedish | Definition | Aliases to avoid |
|------|---------|------------|------------------|
| **Note** (`note`) | Anteckning | A text bound polymorphically to a **Lesson**, **Student**, **Training Session** or **Question**. Has a **Visibility**. | Comment, journal entry |
| **Visibility** (`visibility`) | Synlighet | A **Note**'s access mode: `private` (author only) or `shared` (both parties in the **Relation**). | Access, privacy |
| **Question** (`question`) | Fråga | A **Student**'s question about a specific **Exercise**. Status: `open`, `answered`, `closed`. Answers are stored as a **Note** with `parent_kind = exercise_question`. | Query, request |
| **Goal** (`goal`) | Mål | A **Student**'s long-term objective. Status: `active`, `achieved`, `abandoned`. | Ambition, target |

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
- A **Lesson** has exactly one **Teacher**, exactly one **Student**, zero or one **Horse**, zero or one **Program**.
- A **Lesson** contains zero or more **Exercises** (ordered).
- A **Program** belongs to exactly one **Teacher**–**Student** **Relation** and contains zero or more **Lessons** plus zero or more **Exercises** (home training).
- A **Training Session** belongs to exactly one **Student**, optionally to one **Horse** and optionally to one **Program**.
- A **Note** has exactly one author (**User**) and exactly one parent entity.

## Example dialogue

> **Dev:** "When a **Teacher** creates a **Lesson** for a **Student** — must they pick a **Horse**?"
>
> **Domain expert:** "No, the **Horse** is optional. In practice the teacher usually wants to record which **Horse** the lesson concerned so they can comment on how it went. Remember a **Student** can own several **Horses**."
>
> **Dev:** "And if the teacher adds **Exercises** to the lesson — are those the same **Exercises** that appear in a **Program**?"
>
> **Domain expert:** "Yes, the same entities from the teacher's **Library**. The difference is that a **Lesson** is a single event with the teacher present, while a **Program** is an umbrella that can hold both scheduled **Lessons** *and* **Exercises** the student does on their own between lessons."
>
> **Dev:** "What if a **Student** practices at home and wants feedback?"
>
> **Domain expert:** "They log a **Training Session**. The teacher can then leave a **Note** with `shared` **Visibility** attached to it. If the student has a specific **Question** about an **Exercise**, they open a **Question** instead, and the teacher's reply is stored as a **Note** linked to that question."

## Flagged ambiguities

- **"Trainer" vs "Teacher"** were used interchangeably during design (Swedish: tränare vs lärare). Canonical term is **Teacher** (matches `teacher_id`). Avoid "trainer", "instructor", "coach" in code, docs and UI.
- **"Program"** is overloaded in everyday language. In this domain a **Program** is strictly *the umbrella of scheduled **Lessons** + home **Exercises** for one specific **Student***. Do not use the word loosely for other planning constructs.
- **"Lesson" vs "Training Session"** — distinct entities. **Lesson** = teacher present (planned or completed). **Training Session** = student practices alone and logs it. Never use "session" as a synonym for "lesson".
- **"User" vs "Teacher" vs "Student"** — **User** is an authentication identity. **Teacher** and **Student** are *roles* a user holds inside a specific **Relation**, not types of user. The same **User** can be both at the same time in different **Relations**.
- **"Invitation"** refers only to a teacher's request to an email address to establish a **Relation**. Not to be confused with future notifications or calendar invites for lessons.
