# Lossless Join Lab

Lossless Join Lab is an interactive DBMS teaching tool for checking whether a relational decomposition is lossless. It combines a deterministic tableau/chase simulator, visual step-by-step explanation, a contextual tutor panel, examples, report export, and saved history.

## Run locally

```bash
pnpm install
pnpm dev
```

The development server listens on port `3000` by default. The backend exposes the existing tRPC endpoint at `/api/trpc` and a readiness endpoint at `/api/health`.

## Input format

- Original relation: `A, B, C`
- Decompositions: one per line, for example `R1(A, B)` and `R2(B, C)`
- Functional dependencies: one per line, for example `B -> C`

The checker normalizes attribute names to uppercase and returns specific validation messages when the structure is incomplete.

## Algorithm

The server implements the educational tableau/chase test. It creates one row per decomposed relation, uses distinguished `a` symbols for attributes present in the row and fresh `b` symbols for the rest, then repeatedly applies functional dependencies to rows that agree on a determinant. A fully distinguished row is the proof witness for a lossless decomposition; otherwise the result is potentially lossy after the fixed point.

## Product routes

| Route | Purpose |
| --- | --- |
| `/` | Main interactive checker and tableau workbench |
| `/learn` | Definitions, algorithm, complexity, use cases, and limitations |
| `/examples` | Five worked examples and counterexamples |
| `/history` | Saved analyses and reopen flow |

## Quality checks

```bash
pnpm check
pnpm test
pnpm build
```
