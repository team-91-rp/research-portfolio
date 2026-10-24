// Every number that appears in prose or labels lives here, with where it came from.
// A fact is either DERIVED (a `check` recomputes it from the extracted result files and
// `npm run verify` fails on any drift) or PAPER-ONLY (no committed file holds it, so it
// carries an explicit citation). Components never hand-type numbers: they call t('key').
import { D, find } from './index';

export interface Fact {
  value: number;
  dp: number; // decimals shown
  source: string;
  check?: () => number;
  paperOnly?: boolean;
}

const derived = (value: number, dp: number, source: string, check: () => number): Fact => ({ value, dp, source, check });
const cited = (value: number, dp: number, source: string): Fact => ({ value, dp, source, paperOnly: true });

// ---- helpers over the 188 held-out rows ----
const H = D.heldout;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const rmseOf = (rows: typeof H) => Math.sqrt(mean(rows.map((r) => (r.yPred - r.y) ** 2)));
const sdOf = (rows: typeof H) => {
  const m = mean(rows.map((r) => r.y));
  return Math.sqrt(mean(rows.map((r) => (r.y - m) ** 2)));
};
const r2Of = (rows: typeof H) => 1 - rmseOf(rows) ** 2 / sdOf(rows) ** 2;
const nu1000Low = H.filter((r) => r.paper === 'doi:10.1021/acs.chemmater.1c00324' && r.qe <= 0.5);
const restRows = H.filter((r) => !nu1000Low.includes(r));
const S = D.summary;
const rep = (view: string, metric: string) =>
  find(D.splits.repeated, (r) => r.view === view && r.metric === metric, `${view}/${metric}`);
const single = (est: string, ev: string, split: string) =>
  find(D.splits.single, (r) => r.estimator === est && r.evaluation === ev && r.split.startsWith(split), `${est}/${ev}/${split}`);
const est = (variant: string) => find(D.estimators, (r) => r.variant === variant, variant);
const cross = (e: string, v: string) => find(D.ablations.cross, (r) => r.estimator === e && r.variant === v, `${e}/${v}`);
const fwAbl = (e: string, b: string) => find(D.ablations.fwDisjoint, (r) => r.estimator === e && r.block === b, `${e}/${b}`);
const perm = (e: string, b: string) => find(D.ablations.permutation, (r) => r.estimator === e && r.block === b, `${e}/${b}`).increase;
const conf = (target: string, method: string, nominal: number) =>
  find(D.conformal, (r) => r.estimator === 'tabpfn' && r.target === target && r.method === method && r.nominal === nominal, `conformal ${nominal}`);
const probe = (p: string) => find(D.embeddingProbe, (r) => r.property === p, p).loo;
const filt = (step: string) => find(S.row_filter, (r) => r.step === step, step).rows;
const proto = (split: string) => find(D.proto.results, (r) => r.split === split, split);

const PAPER = 'Paper draft v0.1';
const REPO = 'PredModel_FeatureExtraction README';

export const FACTS = {
  // ---- headline (held-out publications) ----
  rmse: derived(0.386, 3, 'outputs/test_predictions.csv (recomputed from 188 rows) = summary.json', () => rmseOf(H)),
  mae: derived(0.299, 3, 'outputs/summary.json test.mae', () => S.test.mae),
  r2: derived(0.778, 3, 'outputs/test_predictions.csv (recomputed from 188 rows)', () => r2Of(H)),
  meanBaselineRmse: derived(0.819, 3, 'outputs/summary.json test_baseline.rmse', () => S.test_baseline.rmse),
  meanBaselineMae: derived(0.575, 3, 'outputs/summary.json test_baseline.mae', () => S.test_baseline.mae),
  meanBaselineR2: derived(0, 3, 'outputs/summary.json test_baseline.r2', () => Math.abs(S.test_baseline.r2)),
  pctBelowMean: derived(53, 0, 'outputs/summary.json (1 - 0.3856/0.8186)', () => 100 * (1 - S.test.rmse / S.test_baseline.rmse)),
  medianFE: derived(1.69, 2, 'outputs/summary.json test_fold_stats', () => S.test_fold_stats.median_fold_error),
  within2: derived(60.6, 1, 'outputs/summary.json test_fold_stats', () => S.test_fold_stats.within_2x_pct),
  within3: derived(81.9, 1, 'outputs/summary.json test_fold_stats', () => S.test_fold_stats.within_3x_pct),
  lgbmRmse: derived(0.473, 3, 'outputs/summary.json test_previous_estimator', () => S.test_previous_estimator.rmse),
  lgbmMae: derived(0.333, 3, 'outputs/summary.json test_previous_estimator', () => S.test_previous_estimator.mae),
  lgbmR2: derived(0.666, 3, 'outputs/summary.json test_previous_estimator', () => S.test_previous_estimator.r2),
  lgbmMedianFE: derived(1.64, 2, 'outputs/summary.json test_fold_stats_previous_estimator', () => S.test_fold_stats_previous_estimator.median_fold_error),
  lgbmWithin2: derived(62.8, 1, 'outputs/summary.json test_fold_stats_previous_estimator', () => S.test_fold_stats_previous_estimator.within_2x_pct),
  lgbmWithin3: derived(78.7, 1, 'outputs/summary.json test_fold_stats_previous_estimator', () => S.test_fold_stats_previous_estimator.within_3x_pct),
  swapGain: derived(0.088, 3, 'outputs/summary.json (0.4734 - 0.3856)', () => S.test_previous_estimator.rmse - S.test.rmse),

  // ---- dataset funnel and counts ----
  records: derived(1902, 0, 'outputs/summary.json row_filter', () => filt('all rows')),
  positive: derived(1762, 0, 'outputs/summary.json row_filter', () => filt('has positive qe')),
  measured: derived(1643, 0, 'outputs/summary.json row_filter', () => filt('target not an isotherm-model fit')),
  nonDup: derived(1604, 0, 'outputs/summary.json row_filter', () => filt('not a flagged near-duplicate')),
  named: derived(1425, 0, 'outputs/summary.json row_filter', () => filt('MOF resolves to a named framework')),
  nRows: derived(1271, 0, 'outputs/summary.json n_rows', () => S.n_rows),
  nDev: derived(1083, 0, 'outputs/summary.json n_dev', () => S.n_dev),
  nTest: derived(188, 0, 'outputs/test_predictions.csv rows', () => H.length),
  nFrameworks: derived(43, 0, 'outputs/summary.json n_frameworks', () => S.n_frameworks),
  nSpecies: derived(119, 0, 'outputs/summary.json n_species', () => S.n_species),
  nPapers: derived(191, 0, 'outputs/summary.json n_papers', () => S.n_papers),
  nTestPapers: derived(46, 0, 'outputs/test_predictions.csv distinct paper_group', () => new Set(H.map((r) => r.paper)).size),
  nDevPapers: derived(145, 0, 'outputs/summary.json (191 - 46)', () => S.n_papers - new Set(H.map((r) => r.paper)).size),
  nFeatures: derived(87, 0, 'outputs/summary.json n_features', () => S.n_features),
  nCoupled: derived(14, 0, 'outputs/summary.json n_coupled_features', () => S.n_coupled_features),
  nMofBlock: cited(8, 0, `${PAPER} eq. 1`),
  nAdsBlock: cited(58, 0, `${PAPER} eq. 1`),
  nDosing: cited(7, 0, `${PAPER} eq. 1`),
  rawRecords: derived(1902, 0, 'mof_adsorption_combined.csv rows', () => D.dataset.records),
  pubGroups: derived(262, 0, 'mof_adsorption_combined.csv distinct paper_group', () => D.dataset.publicationGroups),
  mofNames: derived(527, 0, 'mof_adsorption_combined.csv distinct mof_name', () => D.dataset.mofNames),
  adsorbateNames: derived(187, 0, 'mof_adsorption_combined.csv distinct adsorbate_name', () => D.dataset.adsorbateNames),
  nStructures: cited(44, 0, `${PAPER} Sec. 3.3 (44 CIFs in data/cif)`),
  nSmiles: cited(142, 0, `${PAPER} Sec. 3.4`),
  nClasses: cited(16, 0, `${PAPER} Sec. 3.2`),
  ionRows: cited(461, 0, `${PAPER} Sec. 3.2`),
  ionShare: cited(36, 0, `${PAPER} Sec. 3.2`),
  ionSpecies: cited(20, 0, `${PAPER} Sec. 3.2`),
  shareTable: derived(31.1, 1, 'mof_adsorption_combined.csv extraction_method (usable rows)', () => 100 * D.dataset.extractionShare.table),
  shareReview: derived(24.6, 1, 'mof_adsorption_combined.csv extraction_method (usable rows)', () => 100 * D.dataset.extractionShare.review_table),
  shareFigure: derived(22.6, 1, 'mof_adsorption_combined.csv extraction_method (usable rows)', () => 100 * D.dataset.extractionShare.figure_digitised),
  shareText: derived(21.7, 1, 'mof_adsorption_combined.csv extraction_method (usable rows)', () => 100 * D.dataset.extractionShare.text),
  doiShare: derived(64.5, 1, 'mof_adsorption_combined.csv doi (usable rows)', () => 100 * D.dataset.doiShare),
  leakTarget: derived(27, 0, 'outputs/leak_audit.csv', () => D.leakAudit.counts['target-derived']),
  leakId: derived(23, 0, 'outputs/leak_audit.csv', () => D.leakAudit.counts['identifier/provenance']),
  leakMof: derived(10, 0, 'outputs/leak_audit.csv', () => D.leakAudit.counts['excluded MOF property']),
  recipeCoremof: derived(26, 0, 'data/structure_manifest.csv', () => D.dataset.structureRecipes['coremof']),
  recipeCod: derived(1, 0, 'data/structure_manifest.csv', () => D.dataset.structureRecipes['cod']),
  recipeMetal: derived(4, 0, 'data/structure_manifest.csv', () => D.dataset.structureRecipes['metal exchange']),
  recipeFunc: derived(13, 0, 'data/structure_manifest.csv', () => D.dataset.structureRecipes['functionalisation']),
  codMax: derived(3.0, 1, 'data/structure_verification.csv max pct_diff', () => Math.max(...D.structureVerification.map((r) => r.pctDiff))),
  codMin: derived(0.0, 1, 'data/structure_verification.csv min pct_diff', () => Math.min(...D.structureVerification.map((r) => r.pctDiff))),
  unbuiltFrameworks: cited(11, 0, `${PAPER} Sec. 8`),
  unbuiltRows: cited(154, 0, `${PAPER} Sec. 8`),
  unbuiltGain: cited(0.026, 3, `${PAPER} Sec. 5.11 (measured, booster-scored)`),
  qeMin: cited(0.046, 3, `${PAPER} Sec. 3.6`),
  qeMax: cited(3900, 0, `${PAPER} Sec. 3.6`),
  qeDecades: cited(4.9, 1, `${PAPER} Sec. 3.6`),
  missingShare: cited(6.0, 1, `${PAPER} Sec. 3.6`),

  // ---- split convention ----
  cvGrouped: derived(0.42, 4, 'outputs/exp_repeated_cv_summary.csv', () => rep('5-fold CV, paper-grouped', 'rmse').mean),
  cvMixed: derived(0.292, 4, 'outputs/exp_repeated_cv_summary.csv', () => rep('5-fold CV, mixed (shuffled rows)', 'rmse').mean),
  gap: derived(0.128, 3, 'outputs/exp_repeated_cv_summary.csv (paired gap)', () => rep('gap, paper-grouped minus mixed (paired)', 'rmse').mean),
  gapSd: derived(0.007, 3, 'outputs/exp_repeated_cv_summary.csv (paired gap)', () => rep('gap, paper-grouped minus mixed (paired)', 'rmse').sd),
  gapMin: derived(0.115, 3, 'outputs/exp_repeated_cv_summary.csv (paired gap)', () => rep('gap, paper-grouped minus mixed (paired)', 'rmse').min),
  holdoutMixed: derived(0.294, 3, 'outputs/split_comparison.csv', () => single('tabpfn', 'hold-out', 'mixed').rmse),
  holdoutMixedFE: derived(1.15, 2, 'outputs/split_comparison.csv', () => single('tabpfn', 'hold-out', 'mixed').medianFE),
  holdoutMixedR2: derived(0.755, 3, 'outputs/split_comparison.csv', () => single('tabpfn', 'hold-out', 'mixed').r2),
  holdoutMixedWithin2: derived(81.8, 1, 'outputs/split_comparison.csv', () => single('tabpfn', 'hold-out', 'mixed').within2),
  lgbmGap: derived(0.137, 3, 'outputs/split_comparison.csv (5-fold CV, LightGBM)', () =>
    single('lgbm', '5-fold CV', 'paper').rmse - single('lgbm', '5-fold CV', 'mixed').rmse),

  // ---- why R2 flatters ----
  testSd: derived(0.819, 3, 'outputs/test_predictions.csv (SD of log10 qe, 188 rows)', () => sdOf(H)),
  trainSd: cited(0.574, 3, `${REPO}, "Why R² is 0.778"`),
  pooledSd: cited(0.617, 3, `${REPO}, "Why R² is 0.778"`),
  r2Pooled: derived(0.61, 2, 'derived: 1 - (0.3856/0.617)^2', () => 1 - (S.test.rmse / 0.617) ** 2),
  r2Train: derived(0.549, 3, 'derived: 1 - (0.3856/0.574)^2', () => 1 - (S.test.rmse / 0.574) ** 2),
  nuRows: derived(10, 0, 'outputs/test_predictions.csv (PFAS on NU-1000, qe <= 0.5)', () => nu1000Low.length),
  nuShare: derived(54, 0, 'outputs/test_predictions.csv (share of test variance)', () => {
    const m = mean(H.map((r) => r.y));
    const tot = H.reduce((a, r) => a + (r.y - m) ** 2, 0);
    return (100 * nu1000Low.reduce((a, r) => a + (r.y - m) ** 2, 0)) / tot;
  }),
  nuRmseWithout: derived(0.364, 3, 'outputs/test_predictions.csv (without those 10 rows)', () => rmseOf(restRows)),
  nuR2Without: derived(0.565, 3, 'outputs/test_predictions.csv (without those 10 rows)', () => r2Of(restRows)),
  nuSdWithout: derived(0.552, 3, 'outputs/test_predictions.csv (without those 10 rows)', () => sdOf(restRows)),

  // ---- estimator comparison ----
  tabpfn3Test: derived(0.3757, 4, 'outputs/exp_tabpfn_versions.csv (5 seeds)', () => est('TabPFN-3, log10(qe)').testRmse),
  tabpfn3Sd: derived(0.0114, 4, 'outputs/exp_tabpfn_versions.csv', () => est('TabPFN-3, log10(qe)').testSd),
  lgbmSeedAvg: derived(0.4688, 4, 'outputs/exp_tabpfn_versions.csv (30 seeds)', () => est('LightGBM, log10(qe)').testRmse),
  lgbmSeedSd: derived(0.0107, 4, 'outputs/exp_tabpfn_versions.csv', () => est('LightGBM, log10(qe)').testSd),
  seedGap: derived(0.093, 3, 'outputs/exp_tabpfn_versions.csv', () => est('LightGBM, log10(qe)').testRmse - est('TabPFN-3, log10(qe)').testRmse),
  v2Test: derived(0.3991, 4, 'outputs/exp_tabpfn_versions.csv', () => est('TabPFN v2, log10(qe)').testRmse),
  fwLgbm: derived(0.4948, 4, 'outputs/exp_tabpfn_versions.csv', () => est('LightGBM, log10(qe)').fw),
  fwTabpfn: derived(0.428, 4, 'outputs/exp_tabpfn_versions.csv', () => est('TabPFN-3, log10(qe)').fw),
  spLgbm: derived(0.4712, 4, 'outputs/exp_tabpfn_versions.csv', () => est('LightGBM, log10(qe)').sp),
  spTabpfn: derived(0.4407, 4, 'outputs/exp_tabpfn_versions.csv', () => est('TabPFN-3, log10(qe)').sp),
  t3Lo: derived(-0.2, 3, 'outputs/exp_tabpfn_versions_bootstrap.csv', () => est('TabPFN-3, log10(qe)').deltaLo as number),
  t3Hi: derived(0.009, 3, 'outputs/exp_tabpfn_versions_bootstrap.csv', () => est('TabPFN-3, log10(qe)').deltaHi as number),
  t3P: derived(0.95, 2, 'outputs/exp_tabpfn_versions_bootstrap.csv', () => est('TabPFN-3, log10(qe)').pBetter as number),
  v2Lo: derived(-0.121, 3, 'outputs/exp_tabpfn_versions_bootstrap.csv', () => est('TabPFN v2, log10(qe)').deltaLo as number),
  v2Hi: derived(-0.007, 3, 'outputs/exp_tabpfn_versions_bootstrap.csv', () => est('TabPFN v2, log10(qe)').deltaHi as number),
  offsetV2: derived(0.326, 3, 'outputs/exp_tabpfn_versions.csv (offset target, TabPFN v2)', () => est('TabPFN v2, log10(qe / ceiling)').testRmse),
  v2Cost: cited(0.023, 3, `${PAPER} Sec. 7 (v2 vs TabPFN-3 held-out RMSE)`),
  offsetShuffled: cited(0.87, 3, `${PAPER} Sec. 5.4 (outputs/exp_target_form_controls.csv)`),
  offsetRowsShare: cited(46, 0, `${PAPER} Sec. 5.4 (579 of 1,271 rows report C0 and dose)`),
  arithmeticOnly: cited(0.234, 3, `${PAPER} Sec. 5.4 (90 held-out rows with a ceiling)`),
  offsetModelOn90: cited(0.296, 3, `${PAPER} Sec. 5.4`),
  medianRemoval: cited(0.7, 2, `${PAPER} Sec. 5.4 (median qe / (C0/m))`),
  rawQeRmse: cited(0.707, 3, `${PAPER} Sec. 5.4 (raw qe target, held-out)`),
  seedFloor: cited(0.0117, 4, `${PAPER} Sec. 4.7 (25 LightGBM seeds)`),
  ensembleTie: cited(0.0012, 4, `${PAPER} Sec. 5.5 (mean of TabPFN-3 and v2, paired Δ gen_all)`),
  ensembleStackCost: cited(0.06, 2, `${PAPER} Sec. 5.5 (worst learned combiner, held-out views)`),
  tunedCostLo: cited(0.11, 2, `${PAPER} Sec. 5.12`),
  tunedCostHi: cited(0.16, 2, `${PAPER} Sec. 5.12`),

  pfasLgbm: cited(0.896, 3, `${REPO}, accuracy by pollutant class`),

  commitsFinal: cited(33, 0, 'git log of PredModel_FeatureExtraction (6 Sep to 20 Oct 2026)'),
  foldFewer: cited(12, 0, `${PAPER} Sec. 5.7 (standalone condition columns removed)`),

  valPapers: cited(32, 0, `${PAPER} Sec. 4.8 (validation publications used for calibration)`),
  valRows: cited(203, 0, `${PAPER} Sec. 4.8`),
  addRows: cited(1000, 0, `${PAPER} Sec. 5.11 (additional rows in the projection)`),
  nuCutoff: cited(0.5, 1, `${PAPER} Sec. 5.3 (qe at or below this value, mg/g)`),
  embedDim: cited(768, 0, `${PAPER} Sec. 4.2`),
  embedPasses: cited(32, 0, `${PAPER} Sec. 4.2`),
  refArchetypes: cited(17, 0, 'prediction_model README (framework-to-structure assignments)'),

  // ---- experiment ledger numbers (paper / README only) ----
  ensembleCommittee: cited(0.004, 3, `${PAPER} Sec. 5.5 (39-booster committee, best case over one booster)`),
  encLead: cited(0.0017, 4, `${PAPER} Sec. 5.9`),
  encFloor: cited(0.012, 3, `${PAPER} Sec. 5.9 (seed floor)`),
  encLoses: cited(0.0041, 4, `${PAPER} Sec. 5.9 (strongest ChemBERTa, unseen pollutant)`),
  descRemoval: cited(0.034, 3, `${PAPER} Sec. 5.9 (removing the descriptor block)`),
  foldWithdraw: cited(0.0055, 4, `${PAPER} Table 6`),
  foldReturn: cited(0.0098, 4, `${PAPER} Table 6`),
  foldPaired: cited(0.0043, 4, `${PAPER} Table 6 (p = 0.019, 15 of 20 repeats)`),
  dosingFold: cited(0.062, 3, `${PAPER} Sec. 5.7`),
  rawMofLo: cited(0.507, 3, `${PAPER} Sec. 5.8 (raw 768-d under TabPFN-3)`),
  rawMofHi: cited(0.511, 3, `${PAPER} Sec. 5.8`),
  pca8: cited(0.484, 3, `${PAPER} Sec. 5.8 (PCA-8, LightGBM, unseen-framework rule)`),
  pls8: cited(0.4926, 4, `${PAPER} Sec. 5.8 (eight PLS components)`),
  h2Cost: cited(0.032, 3, `${PAPER} Sec. 5.8 (H2 fine-tuned embedding as replacement)`),
  h2Added: cited(0.0003, 4, `${PAPER} Sec. 5.8 (as a ninth column, unseen framework)`),
  tabBest: cited(0.0002, 4, `${PAPER} Sec. 5.8 (best tabulated variant)`),
  tabWorst: cited(0.0171, 4, `${PAPER} Sec. 5.8 (tabulated replacing the embedding)`),
  unresolvedHurt: cited(0.025, 3, 'PredModel_FeatureExtraction README, Future work (179 unresolved rows)'),
  offsetBranchWorth: cited(0.069, 3, 'prediction_model README (MAE gain of the offset branch)'),
  hpRank: cited(2, 0, `${PAPER} Sec. 5.12 (hand-set values on the generalisation views)`),
  hpPool: cited(65, 0, `${PAPER} Sec. 5.12`),
  committeeMembers: cited(39, 0, 'PredModel_FeatureExtraction README (LightGBM committees)'),
  encCandidates: cited(32, 0, `${PAPER} Sec. 5.9`),
  ensembleMembers: cited(12, 0, `${PAPER} Sec. 5.5`),
  testBootstrapHalf: cited(0.14, 2, `${PAPER} Sec. 8 (publication-clustered bootstrap, roughly plus or minus)`),
  ceilingRows: cited(90, 0, `${PAPER} Sec. 5.4 (held-out rows that report C0 and dose)`),
  ceilingExceed: cited(11, 0, `${PAPER} Sec. 8 (held-out rows where the prediction exceeds the ceiling)`),

  // ---- ablations and importance ----
  adsWorth: derived(0.023, 3, 'outputs/ablations_framework_disjoint.csv', () =>
    fwAbl('tabpfn', 'conditions only').rmse - fwAbl('tabpfn', 'conditions + adsorbate').rmse),
  mofWorth: derived(0.01, 3, 'outputs/ablations_framework_disjoint.csv', () =>
    fwAbl('tabpfn', 'conditions + adsorbate').rmse - fwAbl('tabpfn', 'full').rmse),
  noDosing: derived(0.089, 3, 'outputs/exp_block_ablation.csv', () => cross('tabpfn', 'without conditions').testRmse! - cross('tabpfn', 'both blocks (shipped)').testRmse!),
  noCoupled: derived(0.016, 3, 'outputs/exp_block_ablation.csv', () => cross('tabpfn', 'without coupled').testRmse! - cross('tabpfn', 'both blocks (shipped)').testRmse!),
  noBoth: derived(0.476, 3, 'outputs/exp_block_ablation.csv', () => cross('tabpfn', 'without conditions + coupled').testRmse! - cross('tabpfn', 'both blocks (shipped)').testRmse!),
  noBothRmse: derived(0.852, 3, 'outputs/exp_block_ablation.csv', () => cross('tabpfn', 'without conditions + coupled').testRmse!),
  noBothR2: derived(-0.082, 3, 'outputs/exp_block_ablation.csv', () => cross('tabpfn', 'without conditions + coupled').testR2!),
  permDosing: derived(0.494, 3, 'outputs/permutation_importance.csv', () => perm('tabpfn', 'conditions')),
  permCoupled: derived(0.077, 3, 'outputs/permutation_importance.csv', () => perm('tabpfn', 'coupled MOF x toxin')),
  permAds: derived(0.053, 3, 'outputs/permutation_importance.csv', () => perm('tabpfn', 'adsorbate')),
  permToxPh: derived(0.007, 3, 'outputs/permutation_importance.csv', () => perm('tabpfn', 'toxin at this pH')),
  permMofPh: derived(0.001, 3, 'outputs/permutation_importance.csv', () => perm('tabpfn', 'MOF at this pH')),
  permEmbedding: derived(-0.007, 3, 'outputs/permutation_importance.csv', () => perm('tabpfn', 'MOF embedding')),
  capacityShare: cited(85, 0, `${PAPER} Sec. 5.6 (0.169 of 0.198 dex)`),
  phChemistry: cited(0.047, 3, `${PAPER} Sec. 5.6`),
  foldingGain: cited(0.0043, 4, `${PAPER} Table 6 (paired, unseen pollutant, 20 repeats)`),
  mofRemovalCost: cited(0.0082, 4, `${PAPER} Sec. 5.6 (paired, 10 repeats, worse in all ten)`),

  // ---- learning curve, intervals, publication effect ----
  gain1000: derived(0.073, 3, 'outputs/exp_learning_curve_projection.csv', () => -find(D.learning.projection, (r) => r.rows === 2083, '+1000 rows').gain),
  asymFw: derived(0.367, 3, 'outputs/exp_learning_curve_views_fit.csv', () => find(D.learning.asymptotes, (r) => r.view === 'fw_disjoint', 'fw').asymptote),
  asymSp: derived(0.364, 3, 'outputs/exp_learning_curve_views_fit.csv', () => find(D.learning.asymptotes, (r) => r.view === 'sp_disjoint', 'sp').asymptote),
  drawSpread: cited(0.1, 2, `${PAPER} Sec. 5.11 (draw-to-draw spread 0.05 to 0.10 dex)`),
  cov80: derived(84.6, 1, 'outputs/exp_conformal.csv', () => 100 * conf('log10(qe)', 'absolute', 0.8).coverage),
  cov90: derived(93.1, 1, 'outputs/exp_conformal.csv', () => 100 * conf('log10(qe)', 'absolute', 0.9).coverage),
  width80: derived(0.942, 3, 'outputs/exp_conformal.csv', () => conf('log10(qe)', 'absolute', 0.8).widthDex),
  width90: derived(1.278, 3, 'outputs/exp_conformal.csv', () => conf('log10(qe)', 'absolute', 0.9).widthDex),
  fold80: derived(8.8, 1, 'outputs/exp_conformal.csv', () => conf('log10(qe)', 'absolute', 0.8).widthFold),
  fold90: derived(19.0, 1, 'outputs/exp_conformal.csv', () => conf('log10(qe)', 'absolute', 0.9).widthFold),
  icc: derived(41.7, 1, 'outputs/exp_paper_variance.csv', () => 100 * D.paperVariance.icc),
  rmseNow: derived(0.441, 3, 'outputs/exp_paper_variance.csv', () => D.paperVariance.rmseNow),
  rmseNoOffset: derived(0.341, 3, 'outputs/exp_paper_variance.csv', () => D.paperVariance.rmseIfRemoved),
  icPapers: derived(52, 0, 'outputs/exp_paper_variance.csv', () => D.paperVariance.papers),
  icRows: derived(970, 0, 'outputs/exp_paper_variance.csv', () => D.paperVariance.rows),
  interLab: cited(0.138, 3, `${PAPER} Sec. 5.10 (42 pairs measured by more than one publication)`),
  topPaperRows: cited(181, 0, `${PAPER} Sec. 5.10`),
  topPaperShare: cited(16.7, 1, `${PAPER} Sec. 5.10`),
  probeLcd: derived(0.96, 3, 'outputs/mof_embedding_probe.csv', () => probe('lcd_A')),
  probeVoid: derived(0.951, 3, 'outputs/mof_embedding_probe.csv', () => probe('void_fraction')),
  probePld: derived(0.906, 3, 'outputs/mof_embedding_probe.csv', () => probe('pld_A')),
  probeMetal: derived(0.489, 3, 'outputs/mof_embedding_probe.csv', () => probe('metal_frac')),
  probeMetalZ: derived(0.139, 3, 'outputs/mof_embedding_probe.csv', () => probe('mean_metal_Z')),
  probeHalogen: derived(-0.047, 3, 'outputs/mof_embedding_probe.csv', () => probe('frac_halogen')),
  moreDataRatio: cited(2.6, 1, `${PAPER} Sec. 5.11`),

  // ---- earlier stages ----
  protoRecords: derived(531, 0, 'KL-HGNN-MOF-Sensor/data/processed/cleaned_mof_data_v1.csv', () => D.proto.records),
  protoMofs: derived(314, 0, 'KL-HGNN-MOF-Sensor cleaned_mof_data_v1.csv', () => D.proto.mofNames),
  protoGroups: derived(76, 0, 'KL-HGNN-MOF-Sensor cleaned_mof_data_v1.csv', () => D.proto.sourceGroups),
  protoRows: derived(124, 0, 'KL-HGNN-MOF-Sensor/data/processed/ml_dataset_v1.csv', () => D.proto.baselineRows),
  protoTrain: derived(105, 0, 'KL-HGNN-MOF-Sensor ml_dataset_v1.csv', () => D.proto.baselineSplit.train),
  protoVal: derived(4, 0, 'KL-HGNN-MOF-Sensor ml_dataset_v1.csv', () => D.proto.baselineSplit.val),
  protoTest: derived(15, 0, 'KL-HGNN-MOF-Sensor ml_dataset_v1.csv', () => D.proto.baselineSplit.test),
  protoTestRmse: derived(266.8, 1, 'KL-HGNN-MOF-Sensor/models/xgboost_baseline_results.csv', () => proto('test').rmse),
  protoTestR2: derived(-0.91, 2, 'KL-HGNN-MOF-Sensor/models/xgboost_baseline_results.csv', () => proto('test').r2),
  protoTrainR2: derived(0.82, 2, 'KL-HGNN-MOF-Sensor/models/xgboost_baseline_results.csv', () => proto('train').r2),
  refRows: derived(1762, 0, 'mof_adsorption_combined.csv (qe > 0)', () => D.dataset.usable),
  refPapers: derived(226, 0, 'mof_adsorption_combined.csv (qe > 0)', () => D.dataset.usablePapers),
  refTestPapers: derived(54, 0, 'prediction_model/mof_adsorption_test.csv', () => D.dataset.refTestPapers),
  refTestRows: derived(270, 0, 'prediction_model/mof_adsorption_test.csv', () => D.dataset.refTestRows),
  refFeatures: cited(103, 0, 'prediction_model README'),
  refR2: cited(0.642, 3, `${PAPER} Table 9 and prediction_model README`),
  refMae: cited(0.343, 3, `${PAPER} Table 9 and prediction_model README`),
  refWithin5: cited(91, 0, `${PAPER} Table 9 and prediction_model README`),
  fewshotK0: cited(0.344, 3, 'prediction_model README (few-shot table, k = 3, uncalibrated)'),
  fewshotK3: cited(0.211, 3, 'prediction_model README (few-shot table, k = 3)'),
  fewshotK1Before: cited(0.411, 3, 'prediction_model README (few-shot table, k = 1)'),
  fewshotK1After: cited(0.331, 3, 'prediction_model README (few-shot table, k = 1)'),
  toxLabelled: derived(7265, 0, 'ToxPredict/TOX21/tox21.csv (NR-AR labelled)', () => D.tox.labelled),
  toxPositive: derived(4.25, 2, 'ToxPredict/TOX21/tox21.csv (NR-AR = 1)', () => 100 * D.tox.positiveShare),
  gcnAuc: cited(0.74, 2, 'ToxPredict README (as reported)'),
  gcnF1: cited(0.38, 2, 'ToxPredict README (as reported)'),
  bertAuc: cited(0.919, 3, 'ToxPredict README (as reported)'),
  bertF1: cited(0.69, 2, 'ToxPredict README (as reported)'),
  barToBeat: cited(0.376, 3, `${PAPER} Sec. 6 (seed-averaged held-out target for a graph model)`),
  barToBeatFw: cited(0.428, 3, `${PAPER} Sec. 6 (unseen frameworks)`),
} satisfies Record<string, Fact>;

export type FactKey = keyof typeof FACTS;

const fmtNum = (v: number, dp: number) => {
  const s = Math.abs(v).toFixed(dp);
  const [i, f] = s.split('.');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = f ? `${withCommas}.${f}` : withCommas;
  return v < 0 ? `−${body}` : body;
};

/** Formatted value of a fact, e.g. t('nRows') -> "1,271". */
export const t = (key: FactKey): string => fmtNum(FACTS[key].value, FACTS[key].dp);
/** Raw numeric value, for charts and layout. */
export const v = (key: FactKey): number => FACTS[key].value;
/** Where a fact comes from. */
export const src = (key: FactKey): string => FACTS[key].source;
