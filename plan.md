# Lossless Join Lab — implementation plan

## Product scope

Lossless Join Lab is a full-stack teaching dashboard for relational schema decomposition. A student enters an original relation schema, decomposed relations, and functional dependencies. The application validates the syntax, runs the standard tableau algorithm, animates the row/cell evolution, explains the verdict, persists the analysis to history, and exports a readable report. Secondary pages cover theory, examples, and prior runs.

## Implementation approach

- **Frontend:** React + TypeScript + Wouter, with a dense but readable three-pane dashboard: input rail, central tableau visualization, and explanation rail. The frontend will own interactive step navigation, example loading, theme state, export, and responsive stacking for small screens.
- **Backend:** Express + tRPC procedures under `/api/trpc`. The checker is implemented as a pure TypeScript domain module so it is deterministic, testable, and reusable by API and UI. The server exposes `checker.analyze`, `history.list`, and `history.create` procedures.
- **Persistence:** Drizzle schema adds an `analyses` table containing the input snapshot, verdict, summary, and serialized result. The UI also keeps a small local fallback cache for resilient demos when database connectivity is unavailable.
- **Algorithm:** Use the standard lossless-join tableau/chase test. Start with one row per decomposed relation, mark distinguished symbols for attributes present in that relation, and fresh symbols elsewhere. Repeatedly apply FDs by copying distinguished/fresh symbols when determinant values match; the decomposition is lossless when a row becomes fully distinguished. Complexity is documented as O(iterations × dependencies × rows × attributes) for the bounded educational simulator.
- **AI-assisted tutor:** Provide a contextual tutor panel generated from the current checker result and algorithm facts. It remains deterministic and safe for the core demo; the copy is framed as “Tutor insight” rather than blocking the checker on an external API.
- **Export:** Generate a Markdown report in-browser containing inputs, verdict, complexity, and step summary, downloadable as `.md`.
- **Routes:** `/` checker dashboard, `/learn` theory, `/examples` five worked examples, `/history` saved analyses, `/404` fallback.

## Project structure

```text
client/
  src/
    pages/Home.tsx       # checker dashboard
    pages/Learn.tsx      # theory and use cases
    pages/Examples.tsx   # realistic examples
    pages/History.tsx    # saved runs
    components/          # dashboard primitives and icons
    lib/checker.ts       # client-safe types, examples, display helpers
    index.css            # visual system and responsive layout
server/
  checker.ts             # validation + tableau/chase algorithm
  routers.ts             # tRPC API procedures
  db.ts                  # history queries with graceful database fallback
  _core/index.ts         # health endpoint + tRPC + static server
drizzle/
  schema.ts              # users + analyses tables
  migrations/            # generated migration history
public/
  manus-routes.json      # route manifest for preview tooling
plan.md                  # this plan
TODO.md                  # acceptance outcomes and status
```

## Design direction

### Style options

- **Swiss editorial instrument — 0.06:** modular information hierarchy, paper-like neutrals, precise rules, and a single electric signal color.
- **Midnight lab console — 0.07:** dark-first technical workspace, luminous matrix cells, and instrument-grade status colors.
- **Neo-academic atlas — 0.05:** warm canvas, annotated diagrams, and classroom-friendly cards.

### Chosen movement: Swiss editorial instrument

- **Core principles:** make the algorithm legible at a glance; use rhythm and alignment as visual explanation; reserve color for meaning (distinguished, fresh, success, warning); keep every action reversible.
- **Color philosophy:** ink/navy grounds the interface; warm parchment makes theory approachable; electric cyan is the ownable signal color for active algorithm state; lime and coral are reserved for verdict semantics.
- **Layout paradigm:** a persistent left control rail, a wide central “workbench” with the tableau as the hero, and a narrow right annotation rail. On mobile, the rails become ordered sections rather than a generic grid.
- **Signature elements:** numbered algorithm steps with vertical progress spine; tableau cells with tiny symbol badges; an always-visible “Lossless / Lossy” verdict card with a checksum-style status strip.
- **Interaction philosophy:** changing inputs updates the preview only after an explicit Run check; step navigation is controlled and predictable; examples are one-click imports into the input rail; history is transparent and never destructive by default.
- **Animation:** 160–220ms ease-out transitions; tableau cell highlights fade from cyan to neutral; verdict changes use a subtle vertical scan; avoid continuous motion that competes with reading.
- **Typography system:** use `Space Grotesk` for headings and labels and `IBM Plex Mono` for schemas, FDs, symbols, and numbers. Body copy uses a system sans fallback for fast load.
- **Brand essence:** “The visual lab for proving a decomposition keeps its data.” Personality: exact, curious, encouraging.
- **Brand voice:** concise, classroom-ready, never patronizing. Example lines: “Run the chase. See where the proof closes.” / “This row carries every attribute symbol, so the decomposition is lossless.”
- **Wordmark & logo:** a compact `LJ` mark built from two interlocking relation brackets, paired with the Lossless Join Lab wordmark.
- **Signature brand color:** electric cyan `#20D9D2`.

## Build workflow

1. Implement the domain checker and tests first.
2. Add database schema/types and tRPC procedures.
3. Replace starter UI with the dashboard and secondary routes.
4. Add route manifest, metadata, and responsive styling.
5. Run typecheck, tests, production build, and inspect the preview with desktop/mobile screenshots.
6. Commit and push to the managed project main branch for checkpoint recording.
