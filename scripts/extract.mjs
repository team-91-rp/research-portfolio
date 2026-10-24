// Reads committed result files from the sibling repositories and writes typed JSON
// into src/data/generated/. Fails loudly (no partial output) on any missing file or
// row-count mismatch. Every output carries the list of source files it came from.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const PM = path.join(ROOT, 'PredModel_FeatureExtraction');
const KL = path.join(ROOT, 'KL-HGNN-MOF-Sensor');
const OUT = path.resolve(here, '..', 'src', 'data', 'generated');

const rel = (p) => path.relative(ROOT, p);

function csv(p) {
  if (!fs.existsSync(p)) throw new Error(`missing source file: ${rel(p)}`);
  const r = Papa.parse(fs.readFileSync(p, 'utf8'), { header: true, dynamicTyping: true, skipEmptyLines: true });
  if (r.errors.length) throw new Error(`parse error in ${rel(p)}: ${r.errors[0].message}`);
  if (!r.data.length) throw new Error(`empty source file: ${rel(p)}`);
  return r.data;
}
function json(p) {
  if (!fs.existsSync(p)) throw new Error(`missing source file: ${rel(p)}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function expectRows(name, rows, n) {
  if (rows.length !== n) throw new Error(`${name}: expected ${n} rows, found ${rows.length}`);
}
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

const outputs = {};
const emit = (name, sources, data) => {
  outputs[name] = { source: sources.map(rel), data };
};

const out = (f) => path.join(PM, 'outputs', f);

// ---- held-out predictions (188 rows) ----
{
  const p = out('test_predictions.csv');
  const rows = csv(p);
  expectRows('test_predictions', rows, 188);
  emit('heldout', [p], rows.map((r) => ({
    id: r.record_id, paper: r.paper_group, framework: r.framework, species: r.species,
    cls: r.adsorbate_class, qe: r.qe_mg_g, y: r.y, yPred: r.y_pred, qePred: r.qe_pred_mg_g,
    absErr: r.abs_log_error,
  })));
}

// ---- headline summary ----
{
  const p = out('summary.json');
  const s = json(p);
  if (s.n_rows !== 1271 || s.n_test !== 188) throw new Error('summary.json no longer matches 1,271 / 188');
  emit('summary', [p], s);
}

// ---- per-class error ----
{
  const p = out('test_error_by_class.csv');
  const rows = csv(p);
  expectRows('test_error_by_class', rows, 13);
  emit('classError', [p], rows.map((r) => ({ cls: r.adsorbate_class, n: r.n, rmse: r.rmse, mae: r.mae }))
    .sort((a, b) => a.rmse - b.rmse));
}

// ---- split conventions ----
{
  const p1 = out('split_comparison.csv');
  const p2 = out('exp_repeated_cv_summary.csv');
  const a = csv(p1);
  const b = csv(p2);
  emit('splits', [p1, p2], {
    single: a.map((r) => ({ estimator: r.estimator, evaluation: r.evaluation, split: r.split, n: r.n_test,
      rmse: r.rmse, mae: r.mae, r2: r.r2, medianFE: r.median_fold_error, within2: r.within_2x_pct })),
    repeated: b.map((r) => ({ view: r.view, metric: r.metric, n: r.n, mean: r.mean, sd: r.sd, min: r.min, max: r.max })),
  });
}

// ---- estimator x target comparison ----
{
  const p1 = out('exp_tabpfn_versions.csv');
  const p2 = out('exp_tabpfn_versions_bootstrap.csv');
  const a = csv(p1);
  const b = csv(p2);
  expectRows('exp_tabpfn_versions', a, 10);
  emit('estimators', [p1, p2], a.map((r) => {
    const bs = b.find((x) => x.variant === r.variant);
    return {
      variant: r.variant, version: r.version, target: r.target, testRmse: r.test_rmse, testSd: r.test_sd,
      testMae: r.test_mae, testR2: r.test_r2, within2: r.within_2x, fw: r.fw_disjoint_rmse, sp: r.sp_disjoint_rmse,
      genAll: r.gen_all, delta: bs ? bs.delta_vs_baseline : null, deltaLo: bs ? bs.delta_lo : null,
      deltaHi: bs ? bs.delta_hi : null, pBetter: bs ? bs.p_better : null,
    };
  }));
}

// ---- ablations ----
{
  const ps = [out('ablations.csv'), out('ablations_framework_disjoint.csv'), out('exp_block_ablation.csv'), out('permutation_importance.csv')];
  const [dev, fw, cross, perm] = ps.map(csv);
  emit('ablations', ps, {
    devCv: dev.map((r) => ({ estimator: r.estimator, block: r.block, n: r.n_features, rmse: r.rmse, mae: r.mae, r2: r.r2 })),
    fwDisjoint: fw.map((r) => ({ estimator: r.estimator, block: r.block, n: r.n_features, rmse: r.rmse, mae: r.mae, r2: r.r2 })),
    cross: cross.map((r) => ({ estimator: r.estimator, variant: r.variant, nFeatures: r.n_features, testRmse: num(r.test_rmse),
      testR2: num(r.test_r2), fw: num(r.fw_disjoint_rmse), sp: num(r.sp_disjoint_rmse), genAll: num(r.gen_all) })),
    permutation: perm.map((r) => ({ estimator: r.estimator, block: r.block, increase: r.rmse_increase })),
  });
}

// ---- learning curves ----
{
  const ps = [out('exp_learning_curve.csv'), out('exp_learning_curve_views.csv'), out('exp_learning_curve_views_fit.csv'), out('exp_learning_curve_projection.csv')];
  const [lc, views, fit, proj] = ps.map(csv);
  emit('learning', ps, {
    held: lc.map((r) => ({ rows: r.mean_train_rows, papers: r.mean_train_papers, rmse: r.test_rmse, drawSd: r.draw_sd, seedSd: r.seed_sd })),
    views: views.map((r) => ({ view: r.view, rows: r.mean_train_rows, rmse: r.rmse, drawSd: r.draw_sd })),
    asymptotes: fit.map((r) => ({ view: r.view, asymptote: r.asymptote_dex })),
    projection: proj.map((r) => ({ rows: r.train_rows, rmse: r.fitted_test_rmse, gain: r.gain_vs_now_dex })),
  });
}

// ---- conformal intervals ----
{
  const p = out('exp_conformal.csv');
  const rows = csv(p);
  emit('conformal', [p], rows.map((r) => ({ estimator: r.estimator, target: r.target, method: r.method, nominal: r.nominal,
    coverage: r.coverage, widthDex: r.median_width_dex, widthFold: r.median_fold_width })));
}

// ---- publication effect, embedding probe ----
{
  const p = out('exp_paper_variance.csv');
  const r = csv(p)[0];
  emit('paperVariance', [p], { papers: r.n_papers_ge3, rows: r.n_rows, rmseNow: r.rmse_now, icc: r.icc, rmseIfRemoved: r.rmse_if_paper_offset_removed });
}
{
  const p = out('mof_embedding_probe.csv');
  const rows = csv(p);
  emit('embeddingProbe', [p], rows.map((r) => ({ property: r.property, loo: r.loo_r2, spearman: r.spearman })));
}

// ---- structure verification, leak audit ----
{
  const p = path.join(PM, 'data', 'structure_verification.csv');
  const rows = csv(p);
  expectRows('structure_verification', rows, 10);
  emit('structureVerification', [p], rows.map((r) => ({ framework: r.framework, cod: r.cod, source: r.cod_source, pctDiff: r.pct_diff, status: r.status }))
    .sort((a, b) => a.pctDiff - b.pctDiff));
}
{
  const p = out('leak_audit.csv');
  const rows = csv(p);
  const counts = {};
  for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
  emit('leakAudit', [p], { counts, columns: rows.map((r) => ({ column: r.column, category: r.category, reason: r.reason })) });
}

// ---- prototype dataset and baseline (KL-HGNN repo) ----
{
  const pc = path.join(KL, 'data', 'processed', 'cleaned_mof_data_v1.csv');
  const pm = path.join(KL, 'data', 'processed', 'ml_dataset_v1.csv');
  const pr = path.join(KL, 'models', 'xgboost_baseline_results.csv');
  const pt = path.join(KL, 'data', 'metadata', 'mof_structure_tracker.csv');
  const cleaned = csv(pc);
  const ml = csv(pm);
  const res = csv(pr);
  const tracker = csv(pt);
  const splitCounts = {};
  for (const r of ml) splitCounts[r.split] = (splitCounts[r.split] || 0) + 1;
  const status = {};
  for (const r of tracker) status[r.structure_status] = (status[r.structure_status] || 0) + 1;
  emit('proto', [pc, pm, pr, pt], {
    records: cleaned.length,
    mofNames: new Set(cleaned.map((r) => r.mof_name_normalized)).size,
    sourceGroups: new Set(cleaned.map((r) => r.source_group)).size,
    baselineRows: ml.length,
    baselineSplit: splitCounts,
    structureStatus: status,
    results: res.map((r) => ({ split: r.split, rmse: r.rmse, mae: r.mae, r2: r.r2 })),
  });
}

// ---- raw compiled dataset: counts, provenance shares, ref-data split ----
{
  const p = path.join(PM, 'mof_adsorption_combined.csv');
  const pt = path.join(ROOT, 'prediction_model', 'mof_adsorption_test.csv');
  const pman = path.join(PM, 'data', 'structure_manifest.csv');
  const rows = csv(p);
  const usable = rows.filter((r) => typeof r.qe_mg_g === 'number' && r.qe_mg_g > 0);
  const share = (key) => {
    const c = {};
    for (const r of usable) c[r[key]] = (c[r[key]] || 0) + 1;
    return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / usable.length]));
  };
  const papersBySplit = {};
  const rowsBySplit = {};
  for (const r of usable) {
    rowsBySplit[r.split] = (rowsBySplit[r.split] || 0) + 1;
    (papersBySplit[r.split] ||= new Set()).add(r.paper_group);
  }
  const testRef = csv(pt);
  const manifest = csv(pman);
  const recipes = {};
  for (const r of manifest) recipes[r.recipe] = (recipes[r.recipe] || 0) + 1;
  emit('dataset', [p, pt, pman], {
    records: rows.length,
    publicationGroups: new Set(rows.map((r) => r.paper_group)).size,
    mofNames: new Set(rows.map((r) => r.mof_name)).size,
    adsorbateNames: new Set(rows.map((r) => r.adsorbate_name)).size,
    usable: usable.length,
    usablePapers: new Set(usable.map((r) => r.paper_group)).size,
    rowsBySplit,
    papersBySplit: Object.fromEntries(Object.entries(papersBySplit).map(([k, v]) => [k, v.size])),
    extractionShare: share('extraction_method'),
    doiShare: usable.filter((r) => r.doi).length / usable.length,
    refTestRows: testRef.length,
    refTestPapers: new Set(testRef.map((r) => r.paper_group)).size,
    structureRecipes: recipes,
  });
}

// ---- Tox21 side study: class balance ----
{
  const p = path.join(ROOT, 'ToxPredict', 'TOX21', 'tox21.csv');
  const rows = csv(p);
  const labelled = rows.filter((r) => r['NR-AR'] === 0 || r['NR-AR'] === 1);
  const pos = labelled.filter((r) => r['NR-AR'] === 1).length;
  emit('tox', [p], { molecules: rows.length, labelled: labelled.length, positives: pos, positiveShare: pos / labelled.length });
}

// ---- write everything only after every source parsed ----
fs.mkdirSync(OUT, { recursive: true });
for (const [name, payload] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(payload));
}
console.log(`extracted ${Object.keys(outputs).length} datasets -> ${rel(OUT)}`);
