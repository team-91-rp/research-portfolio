# Team 91 research portfolio

A frontend-only site presenting the Team 91 project: predicting aqueous pollutant uptake by metal-organic
frameworks (MOFs) for publications a model has never seen. Vite + React + TypeScript, static output.

Status of the work it describes: paper Draft v0.1 (22 Oct 2026), not peer reviewed. The heterogeneous
GNN with a solvation gate is **planned, not built**, and the site says so.

## Why you can trust the numbers

- `scripts/extract.mjs` reads the committed result files of the project repositories
  (`PredModel_FeatureExtraction`, `prediction_model`, `KL-HGNN-MOF-Sensor`, `ToxPredict`) and writes typed JSON to
  `src/data/generated/`. It stops without writing anything if a file is missing or a row count is off.
- `src/data/facts.ts` holds every number used in prose. Each is either **derived** (recomputed from the extracted
  data) or **cited** to the paper draft or a README, because no committed file holds it.
- `npm test` fails if a derived fact drifts from its data, if a known wrong claim from the source material
  appears (see `tests/absence.test.ts`), or if an em or en dash is introduced.
- Charts read only the extracted JSON, and every chart has a table view and a named source.

## Commands

```bash
npm ci
npm run dev        # local development
npm test           # fact and absence checks (uses the committed generated JSON)
npm run build      # type-check and production build into dist/
npm run check      # tests, build, then the absence check on dist/ (what Vercel runs)
npm run verify     # re-extract from the sibling repositories, then test (authors' machines only)
```

`npm run extract` and `npm run verify` expect the four project repositories to sit next to this folder, as they do
in the authors' workspace. On a deploy host they are absent, so the committed `src/data/generated/*.json` is used.

## Deploying to Vercel

The project is configured by `vercel.json` (framework `vite`, output `dist`, build `npm run build:ci`). With the
Vercel CLI: `npx vercel login`, then `npx vercel` for a preview and `npx vercel --prod` for production. Or import the
GitHub repository in the Vercel dashboard; no environment variables are needed.

## Updating the numbers

After new results are committed to the project repositories, run `npm run verify`. A failing fact means the
site's stated value no longer matches its source: update `src/data/facts.ts` (and the prose that quotes it) on purpose.
