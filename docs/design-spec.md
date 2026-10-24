# Team 91 research portfolio website: design

Status: **draft for approval** (nothing built yet). Date: 2026-10-24.
Items marked **[my call]** are decisions I made, not ones you made. Everything else comes from your answers in the conversation.

## 1. Intent

Team 91 (Amrita School of Computing, guides Mr. Dayanand V. and Dr. Gowtham R.) has spent about nine months on one research question: *can ML predict how much pollutant a metal-organic framework (MOF) takes up from water, for experiments it has never seen?* The work has four code repositories, three review decks, a report, a concept note and a paper draft (v0.1, 22 Oct 2026). The story is spread across all of them, and several of the documents contradict each other.

The site gives reviewers and external researchers one place to understand the whole project end to end: the question, the pivots, what failed, what worked, the evidence, and what is still open. Its strongest asset is the rigour of the work (publication-held-out evaluation, measured noise floors, reported negative results). The site should show that rather than only a headline number.

**The reliability requirement drives every other decision.** You said there must be no wrong information. The site must never state something the sources do not support, and must make that checkable.

## 2. Goals, non-goals, anti-goals

Goals
- A comprehensive but minimal, professional, light-mode, frontend-only site.
- Journey-led: headline result first, then the timeline of stages, pivots and failures.
- Data-driven interactive explorers built from the committed result files.
- Every displayed number traceable to a source file or paper section, and mechanically checked.
- Honest labelling of anything unbuilt, unverified or draft.

Non-goals
- No live model (TabPFN-3 needs Python, torch and a non-commercial licence; a frontend-only site cannot run it).
- No downloads of the raw transcribed literature data (redistribution rights are an open TODO in the paper) and no CSV or paper-PDF downloads (you did not select them).
- No per-person roles (the paper's contribution statement is still a TODO), no register numbers, no emails.
- No backend, accounts, analytics or CMS.

Anti-goals (failure even if it technically works)
- Presenting KL-HGNN or the Solvation Gate as an implemented, working model. It is **planned**.
- Implying the model predicts sensor performance (limit of detection, selectivity) or performance in food. It predicts **equilibrium uptake from water**; food matrices are essentially absent from the data.
- Headlining R² = 0.778 without its caveat (see 5.4).
- Quoting numbers from the aspirational KL-HGNN README as results.
- Looking like a template.

## 3. Source-of-truth rules

Hierarchy, highest first:
1. Committed result files in `PredModel_FeatureExtraction/outputs/` (CSV, `summary.json`) and the code that produced them.
2. Paper draft v0.1 (22 Oct 2026). It agrees with (1) wherever I compared them.
3. Panel Review 2 (16 Sep 2026).
4. Earlier decks, report and concept note: used only for the history of the idea and its literature framing.
5. READMEs: used only where they agree with (1), (2) or the data. Known wrong or unsupported claims are listed in section 8 and must not appear.

Rules
- If two sources disagree, use the higher one and record it in section 8.
- The site says the paper is a draft, not peer reviewed.
- Citations come from the paper's reference list, not from the Phase-1 decks (the decks have errors the paper corrects).

## 4. Constraints and decisions

- **Stack (your choice):** Vite + React + TypeScript, static build.
- **Look (your choice, plus my details):** editorial minimal, light mode only, warm off-white background, serif headlines with a clean sans body, generous whitespace, restrained charts with direct labels.
  - **[my call] Accent:** deep aqueous teal (about `#0E6B6B`) on warm off-white (about `#FAF8F4`), near-black ink. Teal is related to the topic (water, adsorption). A secondary muted amber is used only for caveats and "planned, not built" markers. Colour is never the only carrier of meaning.
  - **[my call] Type:** a serif display face (Newsreader or Source Serif 4) with Inter for body, tabular numerals for data. Fonts are bundled with `@fontsource` packages so the site makes no third-party requests.
- **[my call] Charts:** hand-written SVG React components using `d3-scale` and `d3-array` only, for full control of direct labelling and accessibility. Every chart has a table view and a text alternative.
- **[my call] Location:** site in `/Users/midhunan/team-91-website/site/`; this spec in `docs/superpowers/specs/`. The folder is not a git repo, so nothing is committed.
- **[my call] Hosting:** the build is plain static files (`dist/`), deployable to GitHub Pages, Netlify or Vercel. I will not deploy anything without asking.
- Responsive from phone to wide desktop, keyboard operable, WCAG AA contrast, honours reduced-motion. No horizontal page scroll.
- **Links (your choice):** the four public repos under `github.com/team-91-rp/` (`PredModel_FeatureExtraction`, `prediction_model`, `KL-HGNN-MOF-Sensor`, `ToxPredict`). No other outbound downloads. The paper's own TODO says the repos were not yet public; you have confirmed they are, so links go in.
- Skills to apply when building: `design-taste-frontend`, `minimalist-ui`, `ui-ux-pro-max`, `dataviz`; `test-driven-development` and `verification-before-completion` for the data layer.

## 5. Content: sections in page order

### 5.0 Hero
Title: "Predicting aqueous pollutant uptake by MOFs for unseen publications". One-line summary. Four facts, each with a "source" affordance:
- Held-out RMSE **0.386 dex** (53% below predicting the mean) on **46 publications never seen** (188 rows).
- **1,271** modelling rows from 1,902 literature records, 191 publications, 43 frameworks, 119 species.
- Pretrained tabular transformer (TabPFN-3), 87 features.
- A random-row split would have understated error by **0.128 ± 0.007 dex**.
A visible status line: "Research in progress. Paper draft v0.1, not peer reviewed."

### 5.1 The problem
Phase blindness: gas-phase models ignore solvent, pH and guest charge. No public aqueous MOF-pollutant dataset exists at scale. Literature rows cluster by publication, which leaks. Scope box: what the model predicts and does not (single-solute equilibrium capacity; not limit of detection, selectivity, kinetics, regeneration; aqueous, not food matrices).

### 5.2 The journey (timeline, core of the site)
Ordered by when work was first committed or presented. Each stage: what was built, what happened, the lesson. Expandable detail.
1. **Concept, Phase 1 (Jan to Mar 2026).** Key-Lock heterogeneous GNN with a Solvation Gate; literature survey. Outcome: architecture specified, no liquid-phase dataset. Lesson: dataset and baseline first. Three decks (28 Jan, 22 Feb, 30 Mar) and the Panel Review 1 report (23 Feb) show the idea sharpening. Include the gate formula `G_ij = σ(W_g[h_i ‖ h_j ‖ z_env])` and gated message `m̃_ij = G_ij · m_ij`, labelled "planned design".
2. **ToxPredict side study (first commit 22 Jul 2026).** GCN from scratch vs fine-tuned ChemBERTa on Tox21 NR-AR, plus a QM9 GIN. See 5.9 for how it is labelled.
3. **Prototype dataset (first commit 1 Sep 2026, `KL-HGNN-MOF-Sensor`).** 531 records, 314 MOF names, 76 source groups; explicit structure-resolution states; XGBoost baseline on integer-coded framework/analyte, pH, temperature, raw mg/g target. It was trained on a 124-row subset (105 train, 4 val, 15 test). Test RMSE 266.8 mg/g, R² −0.91 (train 0.82). Lesson: raw-scale target, identity codes and few source groups do not transfer.
4. **Reference-data ensemble (2 to 3 Sep 2026, `prediction_model`).** 1,762 rows, 226 publications, 103 features from PubChem, the periodic table and CoRE MOF 2019. XGBoost + histogram boosting + random forest with a mass-balance offset branch. 54 held-out publications (270 rows): R² 0.642, MAE 0.343 dex, 91% within 5×. Few-shot per-paper calibration: MAE 0.411 → 0.211 with three revealed measurements. Lesson: offset helps where C₀ and dose are known; per-paper offsets are large but measurable.
5. **Final pipeline (6 Sep to 20 Oct 2026, `PredModel_FeatureExtraction`, 33 commits).** Structure-built frameworks, frozen MOFTransformer, physics-coupled block, TabPFN-3. 46 held-out publications: RMSE 0.386 dex, R² 0.778. Sub-timeline of the notable pivots: pH folded into material properties; noise floor measured; estimator swap LightGBM → TabPFN; newest checkpoint found not best; ensembles tested; target form tested; H₂ fine-tune tested; CI that checks every reported number.
6. **Now / next.** Panel Review 2 status table (see 5.8).

The paper's Table 9 lists "Toxicity encoders" after the prototype; commit dates put it earlier. The site orders by date and says so.

### 5.3 The dataset
- Funnel chart: 1,902 → 1,762 → 1,643 → 1,604 → 1,425 → 1,271 (labels as in paper Table 1), then split 1,083 dev / 188 test (145 / 46 publications).
- Provenance: 8 extraction batches; method shares (table 31.1%, review table 24.6%, digitised figure 22.6%, text 21.7%); 64.5% of usable rows carry a DOI.
- Composition: 16 pollutant classes; **36% of rows are bare ions or oxyanions** (461 rows, 20 species).
- Leakage audit: 27 target-derived columns, 23 identifier/provenance columns and 10 tabulated MOF-property columns dropped; reasons shown.
- Structures: 527 free-text names → 44 crystal structures; four recipes (26 CoRE MOF as-is, 1 COD, 4 metal exchange, 13 functionalised); ten cross-checked against COD (volume per metal within 0–3.0%): interactive table. The 11 named frameworks without a structure (154 rows) are listed as the top next step.
- Stated limitations: manual extraction, search protocol and inclusion criteria not yet documented (paper TODO).

### 5.4 Method
Interactive pipeline diagram: 44 CIFs → frozen MOFTransformer (768-d `[CLS]`, PCA-8 fitted on development frameworks only; embedded 32 times and averaged); 142 curated SMILES → 58 RDKit descriptors; conditions → 7 dosing features; pH-coupled block (14). Total 87 → TabPFN-3 → log₁₀ qe (+ conformal interval). Click a block to see its columns and what its ablation showed. Equations: Henderson–Hasselbalch fractions, mass-balance ceiling, metrics. A notes panel explains dex (an error of δ dex is a factor of 10^δ in qe).

### 5.5 Results explorers (all from committed CSVs)
1. **Held-out scoreboard:** mean predictor vs LightGBM vs TabPFN-3 (RMSE, MAE, R², median fold-error, within 2×/3×), including the unflattering rows (median fold-error and within-2× got slightly worse).
2. **Parity plot:** 188 held-out rows from `test_predictions.csv`, 2× and 5× bands, hover for row details, colour by pollutant class.
3. **Error by pollutant class:** 13 classes, bars shaded by n, light bars for n < 10 (the paper does the same).
4. **Split convention:** random-row vs whole-publication, hold-out and 10-partition CV; slider or toggle. Headline: 0.4200 vs 0.2920 dex, paired gap 0.1280 ± 0.0073, at least 0.115 in every partition.
5. **R² reality check:** toggle showing the same predictions scored against test spread (SD 0.819 → R² 0.778) vs pooled spread (≈ 0.61) vs train spread (0.549), and the effect of ten NU-1000 PFAS rows that carry 54% of test variance (RMSE 0.364 without them, R² 0.565).
6. **Estimator comparison:** the ten-cell estimator × target table (five estimators × two targets), with bootstrap intervals; shows TabPFN-3's interval includes zero while TabPFN v2's does not, and that the shipped checkpoint follows the better mean.
7. **Ablations:** block build-up on an unseen framework; the conditions × coupled 2×2; block permutation importance.
8. **Learning curve:** held-out, framework-disjoint and species-disjoint, with the fitted projection and asymptotes (≈ 0.365 dex for new frameworks/pollutants), clearly marked as booster-scored extrapolation.
9. **Prediction intervals:** coverage and width (84.6% at nominal 80%, 93.1% at 90%; widths 8.8× and 19× in qe).

### 5.6 Experiment ledger
Filterable, searchable list of every experiment with question, verdict (helped / no effect / hurt / tie / rejected despite a better score) and the numbers. Seeded from the README table of ~40 experiments and the paper. It includes negative results by design: pretrained molecular encoders vs descriptors (32 variants), gas-phase fine-tuned MOF embedding, tabulated MOF properties, ensembles of up to twelve estimators, 39 LightGBM committees, hyper-parameter search (tuned on dev CV costs 0.11–0.16 dex held-out), five reweighting remedies, monotone constraints, unsupervised compressions, offset target (best score, rejected, and why), raw qe target.

### 5.7 What limits accuracy (the findings)
- Mass-balance anchor: with no dosing information the model scores R² −0.082, worse than the mean; about 85% of the coupled block's recovery is one column (`log10_capacity_limit`); genuine pH chemistry contributes 0.047 dex.
- Publication effect: ICC 41.7%; knowing every offset would lower RMSE from 0.441 to 0.341 on the rows analysed; five remedies all worsen held-out error; independent laboratories disagree by a median 0.138 dex.
- MOF embedding encodes pore geometry (LOO R² 0.96 for cavity diameter, 0.489 for metal fraction), little chemistry.
- Data: more rows help new publications about 2.6 times more than new frameworks or pollutants.

### 5.8 Where the project stands, and what is next
Panel Review 2 status table verbatim in meaning: data curation, structures/MOF embedding, toxin chemistry, physics-coupled features, prediction model, reference-data ensemble = Functional; ChemBERTa toxin encoder = In progress (fine-tuned on Tox21; adaptation to T3DB/FooDB ongoing); heterogeneous GNN + Solvation Gate = **Planned**. Staged ladder: tabular baselines (done), physics-coupled + TabPFN-3 (done), simple GNN (in progress), heterogeneous GNN (planned), full KL-HGNN (target). A "planned architecture" illustration (host/guest/environment, gate) carries an amber "Planned, not built" badge. The bar it must beat is stated: 0.376 dex seed-averaged on held-out publications and 0.428 on unseen frameworks, same protocol. Roadmap from the paper (recover 11 frameworks / 154 rows; targeted extraction for cationic dyes and pesticides and isotherm-level data; few-shot calibration for the final model; per-framework PZC; the GNN; CoRE MOF screening with conformal intervals and active learning).

### 5.9 Side study: ToxPredict (caveated)
Shown as "as reported in the repo README": GCN from scratch ROC-AUC 0.74, F1 0.38; fine-tuned ChemBERTa ROC-AUC 0.919, F1 0.69; Tox21 NR-AR, 7,265 labelled molecules, 4.25% positive. Accuracy is not headlined (a majority-class guess is about 95.7% accurate). Visible note: the two models' test splits differ in code and no run logs are saved, so the comparison is indicative, not controlled (the paper has the same TODO). QM9 GIN: "trained; no results recorded in the repo". Its role in the project: ChemBERTa looked promising, so it was then tested for adsorption, where it did not help (link to 5.6).

### 5.10 Team, references, repositories
Authors as in the paper: Midhunan Vijendra Prabhaharan, Siva Dharaneesh A. R., Sabari L. R. M., Varun Hirthik V., Barath Arjun B.; guides Gowtham R. and Dayanand V. (corresponding author). Department of CSE, Amrita School of Computing, Amrita Vishwa Vidyapeetham, Coimbatore. Reference list from the paper (with DOIs). Links to the four repos. Data and licence notes: crystal structures from CoRE MOF 2019 v2 and COD, MOFTransformer checkpoint, TabPFN-3 weights are non-commercial (v2 is permissive and 0.023 dex worse). Acknowledgements and the contribution statement are left out until the paper has them.

## 6. Data layer and the reliability mechanism

1. `scripts/extract.mjs` reads the sibling repos' committed CSV/JSON files and writes typed JSON into `site/src/data/` (committed). Each record carries its source file and column.
2. `src/data/facts.ts` holds every number that appears in prose or labels, each with `{value, source, location}`. Prose references facts by key; there are no hand-typed numbers in components.
3. `npm run verify` (Vitest) asserts: facts equal the extracted values; extracted values equal the source files when the sibling repos are present; cross-source agreement (paper vs README vs CSV) for the headline figures; and absence checks for the known wrong claims in section 8. The build fails if any check fails.
4. Charts read only the extracted JSON. Each explorer shows a "source" line naming the file.
5. Numbers that exist only in the paper or deck (not in a CSV) are entered once in `facts.ts` with a page or section citation and an independent re-read before sign-off.

## 7. Testing and acceptance

- Verify suite above passes. Type-check and lint clean. Production build succeeds.
- Smoke test in a real browser at phone, tablet and desktop widths: all sections render, explorers respond, no console errors, keyboard navigation reaches every control.
- Accessibility: contrast check, chart table views, focus order, reduced-motion.
- Final fact audit: I list every number on the page against its source and report it to you.
- Anything I could not verify is reported, not hidden.

## 8. Known source problems and how the site handles them

| Source says | Reality | Site |
|---|---|---|
| KL-HGNN README: baselines with test R² 0.60–0.80, scripts `simple_gnn.py`, `env_aware_gnn.py`, `kl_hgnn.py` | Those scripts do not exist; only the XGBoost baseline ran, test R² −0.91 on 15 rows | Report the real result; GNN is Planned |
| KL-HGNN README: "Knowledge-Limited" | Decks and concept note: "Key-Lock" | Use "Key-Lock" |
| Phase-1 decks: ALIGNN in Nature Communications; MOFDiff by Gong et al. | Paper: npj Comput. Mater. 7:185; Fu et al. | Use the paper's references |
| Phase-1 architecture slide: cross-attention, FiLM, multi-task | Formal spec elsewhere: sigmoid Solvation Gate | Show the gate as the planned design; mention the richer diagram as a Phase-1 sketch |
| ToxPredict README: 7,823 samples; ~95% accuracy | CSV has 7,831 molecules, 7,265 labelled; 4.25% positive | Use 7,265 / 4.25%; do not headline accuracy |
| ToxPredict ChemBERTa/GCN comparison | Different splits and thresholds across scripts; no logs | Caveat shown |
| Panel Review 2 abbreviates names | Paper has full names | Use the paper's |
| Paper draft has TODOs (search protocol, logD form, PZC functional form, contribution roles, licence) | Open | Not invented; limitations mention them where relevant |

## 9. Left to the builder

Exact component structure, spacing scale, animation details (kept subtle), chart interaction details, section copy within the facts above, file layout of the `site/` project, and the test harness details.

## 10. Calls I made that you should check

1. Teal accent, serif + Inter type, bundled fonts.
2. Plain SVG + d3-scale charts rather than a chart library.
3. Site in `site/`, spec in `docs/superpowers/specs/`, no git commits, no deployment.
4. Timeline ordered by commit date, with ToxPredict before the prototype.
5. The ToxPredict accuracy figure is not shown.
6. Contribution roles, acknowledgements, register numbers and emails are omitted.
7. The paper is described on the site as a draft; no PDF is linked.

## 11. Changes made during the build (all mine; none change the content rules)

- Sans face is Geist (not Inter) and the neutral background is a cooler paper `#F5F8F7` (not the warm `#FAF8F4`), to avoid two common template tells. Accent stays deep teal.
- Hero headline is "Will this MOF capture that pollutant?" so it fits two lines.
- Dosing-block permutation importance is shown as 0.494 (result file: 0.4945); the paper text says 0.495.
- The deploy target is the GitHub repo `team-91-rp/research-portfolio`, hosted on Vercel; the `site/` folder is the repo root.
