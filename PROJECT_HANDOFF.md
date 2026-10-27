# Lossless Join Checker — Project Handoff and Viva Guide

## 1. Project summary

**Project title:** Lossless Join Checker

**DBMS module:** Relational database design, decomposition, functional dependencies, and normalization.

**Purpose:** This application checks whether decomposing a relation into smaller relations is **lossless** or **potentially lossy**. It does not only print a final answer: it displays the tableau/chase process step by step so that a student can explain why the answer is correct.

The delivered website follows the supplied HTML reference exactly. It has a compact header, input panel, central chase tableau, explanation panel, step playback, report download, history, theory notes, dark mode, and a large example selector.

---

## 2. Theory of lossless join decomposition

Let a relation schema be:

```text
R(A, B, C, ...)
```

Suppose it is decomposed into:

```text
R1, R2, ..., Rk
```

The decomposition is **lossless** if, for every legal relation instance `r` that satisfies the functional dependencies:

```text
JOIN(PROJECT(R1, r), PROJECT(R2, r), ..., PROJECT(Rk, r)) = r
```

In simpler words, after splitting the original table and joining the fragments again, we should get **exactly the original rows**.

A lossless decomposition must not:

1. Lose any original tuple.
2. Create extra or spurious tuples.
3. Invent combinations of attribute values that were never present together.

A decomposition that creates extra tuples is called **lossy** or **additive**.

### Real-world example

Consider:

```text
STUDENT_COURSE(STUDENT_ID, COURSE_ID, DEPARTMENT)
```

If `COURSE_ID -> DEPARTMENT`, we can decompose into:

```text
ENROLLMENT(STUDENT_ID, COURSE_ID)
COURSE(COURSE_ID, DEPARTMENT)
```

The common attribute is `COURSE_ID`. Since it determines `DEPARTMENT`, the fragments can be joined without inventing incorrect student-course-department combinations. The decomposition is lossless under the given dependency.

---

## 3. Functional dependency

A functional dependency is written as:

```text
X -> Y
```

It means that whenever two tuples agree on all attributes in `X`, they must also agree on all attributes in `Y`.

Example:

```text
COURSE_ID -> DEPARTMENT
```

This says that one course belongs to one department. If two rows have the same `COURSE_ID`, their `DEPARTMENT` values must be equal.

The left side is the **determinant**. The right side is the **dependent attribute set**.

---

## 4. Tableau/chase algorithm used by the project

The application uses the standard educational **chase/tableau test**.

### Step 1 — Create the tableau

Create one row for every decomposed relation and one column for every attribute of the original relation.

For each cell:

- If the fragment contains that attribute, place a distinguished symbol `a_j`.
- If the fragment does not contain that attribute, place a fresh symbol `b_ij`.

Example for `R(A, B, C)` and fragments `R1(A, B)` and `R2(B, C)`:

| Fragment | A | B | C |
| --- | --- | --- | --- |
| R1 | a1 | a2 | b13 |
| R2 | b21 | a2 | a3 |

### Step 2 — Apply functional dependencies

For every dependency `X -> Y`:

1. Find rows that agree on every attribute in `X`.
2. Make their values equal on every attribute in `Y`.
3. If an `a` symbol is available, it wins over a `b` symbol because it represents a value preserved from the original relation.
4. Record the changed cells.

### Step 3 — Repeat

Continue applying dependencies until:

- A row becomes completely distinguished, or
- No more cells can change and the tableau reaches a fixed point.

### Step 4 — Decide

- If any row contains only distinguished `a` symbols, the decomposition is **lossless**.
- If no row becomes fully distinguished, the decomposition is **potentially lossy**.

### Pseudocode

```text
create one tableau row per decomposed relation
for each row and attribute:
    if attribute is in the relation:
        put distinguished a-symbol
    else:
        put fresh b-symbol

repeat until no changes:
    for each functional dependency X -> Y:
        find rows agreeing on X
        copy the most informative Y value across those rows
        mark copied cells as changed
        if any row is all distinguished symbols:
            return LOSSLESS

return POTENTIALLY LOSSY
```

---

## 5. Meaning of the dotted and solid boxes

The visual highlighting is an important part of the demonstration.

### Dashed/dotted purple boxes

The dashed or dotted purple outline marks the **LHS/determinant cells** of the functional dependency currently being applied.

For example, if the current dependency is:

```text
A -> C
```

then the cells containing `A` in the rows that agree on `A` receive a dashed outline. These are the cells that prove the rows have the same determinant value.

They answer the question:

> Which cells caused these rows to be grouped together?

### Solid purple boxes

The solid purple outline marks the **changed RHS/dependent cells**.

For `A -> C`, the `C` cells that are copied or updated receive the solid outline. They answer:

> Which values were forced to become equal by the dependency?

### Cell colors

- **Green cell:** distinguished `a` symbol; the attribute value is known/preserved from the original relation.
- **Amber/brown cell:** fresh `b` symbol; the value is currently unknown or row-specific.
- **Dashed purple outline:** determinant/LHS cells used to trigger the rule.
- **Solid purple outline:** dependent/RHS cells changed in the current step.
- **Highlighted full row:** a fully distinguished row, which is the proof witness for losslessness.

This is why the visualization is more informative than a simple “lossless/lossy” label: it shows exactly which dependency caused which value to propagate.

---

## 6. Frontend implementation

### Main frontend file

```text
client/index.html
```

The final visible interface is the supplied standalone HTML reference. It contains:

- Semantic HTML structure.
- CSS variables for light and dark themes.
- Responsive three-column layout.
- Input controls for relation attributes, dependencies, and decomposition.
- Example selector.
- Chase tableau table.
- Step log and explanation card.
- First, previous, play, next, and last controls.
- Playback speed selector.
- Progress bar.
- Binary-rule and dependency-preservation tabs.
- Download and copy report controls.
- Browser localStorage history.
- Theory, complexity, use-case, and limitations section.
- Optional AI tutor integration hook.

### Frontend parsing

The HTML JavaScript accepts:

- Comma-separated or space-separated attributes.
- Multi-character names such as `STUDENT_ID` and `COURSE`.
- Functional dependencies using `->` or Unicode `→`.
- Decomposition formats such as `R1: A, B`, `R1(A, B)`, or plain attribute lists.

It validates unknown attributes, empty dependencies, malformed arrows, missing attributes, and too few fragments.

### Frontend state

The browser keeps a state object containing:

- Parsed relation and dependencies.
- Current chase result.
- Current step index.
- Playback timer.
- Recent checks in `localStorage`.

Every time a new step is shown, the table is rebuilt from that step’s snapshot. This is why the highlights move correctly when the user presses Play, Next, Previous, or selects a step from the explanation log.

---

## 7. Backend implementation

The project also contains a full server-side implementation using **Node.js, Express, tRPC, Drizzle ORM, and MySQL-compatible persistence**.

### Backend algorithm file

```text
server/checker.ts
```

This module contains:

- Input types.
- Relation parser.
- Functional-dependency parser.
- Decomposition parser.
- Tableau row and cell types.
- Distinguished/fresh symbol creation.
- Dependency application.
- Iteration limit.
- Lossless/lossy verdict.
- Step-by-step result snapshots.
- Complexity text for the UI.

The server algorithm uses the same conceptual tableau test as the supplied HTML. The server returns structured JSON rather than HTML.

### API router

```text
server/routers.ts
```

Important procedures:

```text
checker.analyze
```

Accepts:

```text
relationSchema
decompositions
functionalDependencies
```

Returns:

```text
ok
errors
relationAttributes
relations
dependencies
lossless
verdict
summary
steps
complexity
iterations
```

History procedures:

```text
history.list
history.create
```

### Database access

```text
server/db.ts
drizzle/schema.ts
```

The `analyses` table stores:

- Original relation schema.
- Decompositions.
- Functional dependencies.
- Verdict.
- Explanation summary.
- Serialized checker result.
- Creation timestamp.

The code also has a safe no-database fallback for local/demo environments.

### Health endpoint

The server exposes:

```text
/api/health
```

A healthy server responds with:

```json
{"status":"ok"}
```

### Important implementation note

The visible page is intentionally the supplied standalone HTML so that its markup and behavior remain exactly as requested. Therefore, the exact-reference page performs its interactive chase and local history in browser JavaScript. The project’s matching server checker, tRPC procedures, Drizzle schema, and persistence layer remain in the source tree as the backend implementation and API layer.

For a production version, the HTML controls can call `checker.analyze` instead of running the inline browser algorithm. The data contract is already defined for that integration.

---

## 8. Examples included

The selector contains 21 cases:

1. Lossy binary split.
2. Lossless binary split.
3. Five-way chase.
4. Student/Course/Instructor.
5. Disjoint fragments.
6. Employee/Project/Budget.
7. Missing FD.
8. Trivial decomposition where `R` itself is a fragment.
9. No FDs with an overlap.
10. Binary lossless via common key.
11. Binary lossless on one side only.
12. Three-way lossless dependency chain.
13. Three-way disconnected chain.
14. Cyclic dependencies.
15. Multi-attribute determinant.
16. Redundant fragment.
17. Attribute not covered warning.
18. Unknown attribute validation error.
19. Malformed dependency validation error.
20. Duplicate-attribute normalization warning.
21. Unicode arrow and compact FD syntax.

These cases cover normal success, normal failure, immediate proof, multi-step propagation, disconnected schemas, parser behavior, warnings, and invalid input.

---

## 9. How to demonstrate to the sir

### Recommended 5-minute demonstration

1. Open the website.
2. Explain that the page has three areas: input, tableau, and explanation.
3. Choose **2 · Lossless split of R(A,B,C)**.
4. Click **Check decomposition** if necessary.
5. Explain the initial `a` and `b` symbols.
6. Click **Next** or **Play**.
7. Point to the dashed determinant cells and solid changed cells.
8. Show the final fully distinguished row.
9. Select **1 · Lossy split of R(A,B,C)**.
10. Explain that the chase reaches a fixed point without a fully distinguished row.
11. Open **Binary rule & closures**.
12. Open **Dependency preservation** and explain that losslessness and dependency preservation are separate properties.
13. Open the theory section and show the complexity and limitations.
14. Download a Markdown report.

### Suggested explanation

> Our system accepts a relation, a decomposition, and functional dependencies. It builds a tableau with one row per fragment. Green a-symbols represent values known to come from the original relation, while amber b-symbols represent unknown values. When rows agree on the left side of a functional dependency, the right-side values are unified. The dashed cells show the determinant that caused the rule to fire, and the solid purple cells show the values changed by that rule. If a complete row of a-symbols appears, the decomposition is lossless. Otherwise the chase reaches a fixed point and the decomposition is potentially lossy.

---

## 10. Complexity

Let:

- `k` = number of decomposed relations.
- `n` = number of attributes.
- `|F|` = number of functional dependencies.
.

The tableau contains `k × n` cells. The educational implementation repeatedly compares rows for each dependency. A conservative classroom bound is:

```text
O(|F| × k² × n²)
```

Attribute closure for the binary shortcut is approximately:

```text
O(|F| × n)
```

The application also uses a bounded iteration limit so malformed or unusually cyclic inputs cannot run forever.

---

## 11. Limitations

- The result is only as correct as the supplied functional dependencies.
- Losslessness does not automatically mean dependency preservation.
- The current chase is for functional dependencies; multivalued dependencies require an MVD/4NF chase.
- The checker does not measure query performance, redundancy, indexing, or null behavior.
- Outer joins and incomplete data semantics are outside this educational model.
- The visible exact-reference page stores recent history in browser localStorage; the server API additionally supports persistent analysis records.

---

## 12. Run and test commands

From the project folder:

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm check
pnpm test
pnpm build
```

The implemented automated tests cover:

- Lossless tableau behavior.
- Potentially lossy tableau behavior.
- Parser validation.
- Authentication/platform starter regression tests.

---

## 13. Important files

| File | Responsibility |
| --- | --- |
| `client/index.html` | Exact supplied frontend, styles, inline checker, examples, playback, report, theory |
| `server/checker.ts` | Server-side parser and tableau/chase engine |
| `server/routers.ts` | tRPC analysis and history API procedures |
| `server/db.ts` | Database query helpers and no-database fallback |
| `drizzle/schema.ts` | Users and analyses database tables |
| `server/checker.test.ts` | Checker unit tests |
| `README.md` | Short project setup |
| `USER_MANUAL.md` | User instructions |
| `TEST_CASES.md` | Test case table |
| `AI_USAGE_LOG.md` | AI-assisted development record |
| `REFERENCES.md` | DBMS references |

---

## 14. Conclusion

Lossless Join Checker is both a working checker and a teaching tool. Its main innovation is making the proof visible: the student can watch dependencies propagate values through the tableau, inspect the exact cells that caused each change, and connect the final all-a row to the formal definition of a lossless decomposition.
