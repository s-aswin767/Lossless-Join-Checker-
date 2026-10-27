# Lossless Join Lab — delivery outcomes

## 1. Checker input and validation

- [ ] The dashboard accepts an original relation schema, decomposed relation schemas, and functional dependencies in structured text format.
- [ ] The UI validates missing values, malformed attributes, duplicate names, and invalid dependency arrows with specific inline messages.
- [ ] At least five realistic examples can be loaded into the input panel with one action.

## 2. Lossless-join simulation and visualization

- [ ] The backend runs the standard tableau/chase-style lossless-join test and returns a deterministic verdict.
- [ ] The center workbench shows one tableau row per decomposition and distinguishes copied symbols from fresh symbols.
- [ ] The user can move step-by-step through initialization and each dependency application, with the active dependency and changed cells highlighted.
- [ ] The final state clearly reports Lossless or Lossy and explains why.
- [ ] The UI remains responsive for normal educational inputs and is usable on desktop and mobile widths.

## 3. Theory, explanations, and tutor insight

- [ ] The learn page includes concise definitions, algorithm selection, complexity, real-world use cases, and limitations.
- [ ] The explanation rail translates the current step into classroom-ready language.
- [ ] The tutor panel produces a contextual explanation based on the current verdict and input without blocking the core checker on an external AI key.

## 4. History and export

- [ ] Successful runs can be saved with a timestamp, verdict, schema summary, and step count.
- [ ] The history page lists prior runs, supports reopening a result, and keeps a local fallback cache if the managed database is unavailable.
- [ ] The current analysis can be downloaded as a readable Markdown report.

## 5. Backend and persistence

- [ ] tRPC exposes analysis and history procedures through the existing Express server.
- [ ] Drizzle schema includes an analyses table with input snapshot, verdict, summary, serialized result, and timestamps.
- [ ] `/api/health` remains unauthenticated and returns a successful readiness response.

## 6. Documentation and quality

- [ ] The source is modular and documented with algorithm notes, user manual, test cases, references, and AI prompt/usage log.
- [ ] Route manifest lists all page routes and is served at `/manus-routes.json`.
- [ ] Typecheck, tests, and production build complete successfully before delivery.
- [ ] The final preview is visually checked at desktop and mobile breakpoints.
