# Team 91 Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, in-session). Steps use checkbox syntax.

**Goal:** Build the frontend-only, light-mode research portfolio site described in the spec, with every number traceable to and checked against its source file.

**Architecture:** A Vite + React + TypeScript static site in `site/`. A Node script extracts committed result CSVs/JSON from the sibling repos into typed JSON under `site/src/data/`. All prose numbers live in `facts.ts` with a source citation; a Vitest suite checks facts against the extracted data and the data against the sources. Charts are hand-written SVG with `d3-scale`/`d3-array`.

**Tech Stack:** Vite, React 18, TypeScript, Vitest, d3-scale, d3-array, @fontsource (Newsreader, Inter), papaparse (extraction only).

**Spec:** `docs/design-spec.md`

## Global Constraints

- Light mode only; accent deep teal `#0E6B6B` on warm off-white `#FAF8F4`; amber only for caveat / "Planned, not built".
- Serif display (Newsreader) + Inter body, bundled via `@fontsource`; no third-party requests at runtime.
- No hand-typed numbers in components: prose numbers come from `facts.ts` keys; charts read extracted JSON.
- KL-HGNN / Solvation Gate is always labelled "Planned, not built".
- Never claim sensor performance (LOD, selectivity) or food-matrix performance; scope box states aqueous equilibrium uptake only.
- Paper is labelled "Draft v0.1, not peer reviewed". No register numbers, emails, per-person roles, CSV/PDF downloads.
- Links only to the four public repos under `github.com/team-91-rp/`.
- Responsive phone to desktop, keyboard operable, WCAG AA, reduced-motion respected, every chart has a table view.

## Review Focus

- Empty or missing source file at extraction: script must fail loudly, never write partial JSON.
- A fact that drifts from its source: `npm run verify` fails and names the fact.
- Known wrong claims (7,823 samples; R² 0.60–0.80 KL-HGNN baselines; "Knowledge-Limited"; ALIGNN in Nat. Commun.) must be absent from built output.
- Narrow phone width: explorers must not overflow horizontally.
- Hover-only information: all chart data must also be reachable by keyboard / table view.

---

### Task 1: Scaffold, tokens, shell
**Files:** Create `site/` (Vite react-ts), `site/src/styles/tokens.css`, `site/src/App.tsx`, `site/src/components/{Section,Nav,SourceNote,Caveat}.tsx`
**Produces:** `<Section id title kicker>`, `<SourceNote files={string[]}/>`, `<Caveat tone="note"|"planned">`, CSS variables `--accent`, `--bg`, `--ink`, `--amber`.
- [ ] Scaffold with Vite, install deps, add vitest config.
- [ ] Implement tokens, global typography, sticky section nav with scroll-spy.
- [ ] Run `npm run build`; expect success.

### Task 2: Data extraction
**Files:** `site/scripts/extract.mjs`, `site/src/data/*.json`, test `site/tests/extract.test.ts`
**Produces:** JSON files: `heldout.json` (188 rows of test_predictions), `classError.json`, `splits.json`, `estimators.json`, `ablations.json`, `permutation.json`, `learning.json`, `conformal.json`, `paperVariance.json`, `embeddingProbe.json`, `structureVerification.json`, `summary.json`, `leakAudit.json`, `proto.json`; each `{source: string[], rows|data}`.
- [ ] Write test asserting `heldout.rows.length === 188` and summary `n_rows === 1271`.
- [ ] Implement extraction; fail on missing file or row-count mismatch.
- [ ] Run extraction and test; expect pass.

### Task 3: Facts and verify suite
**Files:** `site/src/data/facts.ts`, `site/tests/facts.test.ts`, `site/tests/absence.test.ts`
**Produces:** `fact(key): {value:number|string, text:string, source:string}`; `F` typed record.
- [ ] Tests: every numeric fact equals the value derived from extracted JSON (or is flagged `paperOnly` with page citation); absence test greps built `dist/` and `src` for the banned claims.
- [ ] Implement facts; run `npm run verify`; expect pass.

### Task 4: Chart primitives and explorers
**Files:** `site/src/charts/{Axis,Scatter,Bars,Lines,Table}.tsx`, `site/src/explorers/*.tsx` (Scoreboard, Parity, ClassError, SplitGap, R2Check, Estimators, Ablations, LearningCurve, Intervals)
**Produces:** each explorer takes no props and reads extracted JSON; each renders a `<SourceNote>` and a table toggle.
- [ ] Implement primitives, then explorers; test that each renders with extracted data (Vitest + react-dom/server).
- [ ] Run tests; expect pass.

### Task 5: Narrative sections
**Files:** `site/src/sections/{Hero,Problem,Journey,Dataset,Method,Results,Ledger,Findings,Status,ToxPredict,Team}.tsx`, `site/src/data/{ledger,timeline,references}.ts`
- [ ] Implement sections per spec 5.0–5.10 using `F` for numbers; ledger filterable by verdict.
- [ ] Run type-check and tests; expect pass.

### Task 6: Polish and verification
- [ ] Build, run `npm run verify` against `dist/`, serve and smoke-test in a browser at 375/768/1280 px, check console, keyboard path, contrast.
- [ ] Final fact audit listing every number against its source; report any gap.
