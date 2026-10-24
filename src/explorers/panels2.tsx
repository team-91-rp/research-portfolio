import { useState } from 'react';
import { D, SOURCES } from '../data';
import { t, v } from '../data/facts';
import { DotRows } from '../charts/DotRows';
import { Lines } from '../charts/Lines';
import { Callout, DataTable, HBars, SourceNote, type Col } from '../ui/primitives';
import { fmt } from '../lib';

const NAMES: Record<string, string> = { lgbm: 'LightGBM', v2: 'TabPFN v2', 'v2.5': 'TabPFN-2.5', 'v2.6': 'TabPFN-2.6', v3: 'TabPFN-3' };

export function EstimatorPanel() {
  const [target, setTarget] = useState<'log10(qe)' | 'log10(qe / ceiling)'>('log10(qe)');
  const rows = D.estimators.filter((r) => r.target === target);
  const items = rows.filter((r) => r.delta !== null && r.version !== 'lgbm' || r.version !== 'lgbm').map((r) => ({
    key: r.variant, label: NAMES[r.version] ?? r.version, value: r.delta ?? 0, lo: r.deltaLo ?? 0, hi: r.deltaHi ?? 0,
    emphasis: r.version === 'v3' && target === 'log10(qe)',
  }));
  const cols: Col<(typeof rows)[number]>[] = [
    { key: 'm', label: 'Estimator', render: (r) => NAMES[r.version] ?? r.version },
    { key: 't', label: 'Held-out', num: true, render: (r) => fmt(r.testRmse, 4) },
    { key: 'f', label: 'Unseen framework', num: true, render: (r) => fmt(r.fw, 4) },
    { key: 's', label: 'Unseen pollutant', num: true, render: (r) => fmt(r.sp, 4) },
    { key: 'g', label: 'Mean of three', num: true, render: (r) => fmt(r.genAll, 4) },
    { key: 'p', label: 'P(better)', num: true, render: (r) => (r.pBetter === null || r.version === 'lgbm' ? 'n/a' : fmt(r.pBetter, 2)) },
  ];
  return (
    <div>
      <p>Five estimators were crossed with two target forms on identical rows, columns, folds, seeds and device. Below, the change in held-out RMSE against the previously shipped LightGBM on log10 qe, with a 95% interval from a publication-clustered bootstrap over the {t('nTestPapers')} test publications. Left of zero is better.</p>
      <div className="radio-list" role="radiogroup" aria-label="Target form">
        <button role="radio" aria-checked={target === 'log10(qe)'} className="radio" onClick={() => setTarget('log10(qe)')}>Target: log10 qe (shipped)</button>
        <button role="radio" aria-checked={target !== 'log10(qe)'} className="radio" onClick={() => setTarget('log10(qe / ceiling)')}>Target: log10 of qe over the mass-balance ceiling (rejected)</button>
      </div>
      <DotRows items={items.filter((i) => i.key !== 'LightGBM, log10(qe)')} domain={[-0.32, 0.06]} zero dp={3} axisLabel="Change in held-out RMSE (dex)" ariaLabel="Change in held-out RMSE for each estimator with 95 percent bootstrap intervals" />
      <DataTable cols={cols} rows={rows} caption="Estimator comparison, RMSE in dex" />
      <Callout tone="caveat" title="The significance bar and the better mean disagree">
        TabPFN-3 has the better mean on every held-out view (held-out {t('tabpfn3Test')} against {t('lgbmSeedAvg')}, a gap of {t('seedGap')} dex, about eight seed standard deviations). Its bootstrap interval, [{t('t3Lo')}, +{t('t3Hi')}], includes zero at P(better) = {t('t3P')}, whereas TabPFN v2 on the same target, [{t('v2Lo')}, {t('v2Hi')}], excludes it. The shipped model follows the better mean; the v2 checkpoint is a one-line substitution and the only one under a permissive licence, at a cost of {t('v2Cost')} dex.
      </Callout>
      <p>Newer is not better: TabPFN-2.5 and 2.6 both lose to v2 on both targets. The offset target scores better under every estimator and is not shipped: the whole gain sits on the {t('offsetRowsShare')}% of rows that report both initial concentration and dose, and there the arithmetic alone ({t('arithmeticOnly')} dex on the {t('ceilingRows')} held-out rows with a ceiling) beats the offset model ({t('offsetModelOn90')} dex).</p>
      <SourceNote files={SOURCES.estimators} />
    </div>
  );
}

export function AblationPanel() {
  const a = D.ablations;
  const fw = a.fwDisjoint.filter((r) => r.estimator === 'tabpfn');
  const cross = a.cross.filter((r) => r.estimator === 'tabpfn');
  const perm = a.permutation.filter((r) => r.estimator === 'tabpfn').sort((x, y) => y.increase - x.increase);
  const label: Record<string, string> = { 'conditions only': 'Conditions only', 'conditions + adsorbate': 'Conditions + pollutant', 'conditions + MOF embedding': 'Conditions + MOF embedding', full: 'Full model (87)' };
  return (
    <div>
      <h3 className="sub">Block build-up on an unseen framework</h3>
      <p>RMSE when both the framework and the publication are unseen, the view that matters for screening new materials. Every block earns its place under TabPFN-3: the pollutant descriptors are worth {t('adsWorth')} dex on top of the conditions and the MOF embedding {t('mofWorth')} dex.</p>
      <DotRows items={fw.map((r) => ({ key: r.block, label: label[r.block] ?? r.block, value: r.rmse, emphasis: r.block === 'full' }))} domain={[0.42, 0.47]} axisLabel="Framework-disjoint RMSE (dex)" ariaLabel="Block build-up on unseen frameworks" dp={4} />
      <h3 className="sub">The model is anchored on the mass balance</h3>
      <p>Held-out RMSE when the dosing block, the coupled block, or both are withdrawn. The two are substitutes: withdrawing dosing costs {t('noDosing')} dex, the coupled block {t('noCoupled')} dex, but withdrawing both costs {t('noBoth')} dex. With neither, R² is {t('noBothR2')}, worse than predicting the mean.</p>
      <HBars label="Held-out RMSE with blocks withdrawn" max={0.9} items={[
        ...cross.filter((r) => r.testRmse !== null && r.variant !== 'predict the training mean').map((r) => ({ key: r.variant, label: r.variant === 'both blocks (shipped)' ? 'Both blocks (shipped)' : r.variant[0]!.toUpperCase() + r.variant.slice(1), sub: `${r.nFeatures} features`, value: r.testRmse as number })),
        { key: 'mean', label: 'Predict the training mean', value: v('meanBaselineRmse'), muted: true },
      ]} />
      <h3 className="sub">Permutation importance, whole blocks</h3>
      <p>Increase in held-out RMSE when a block is shuffled (20 repeats). The MOF embedding is slightly negative here even though removing it costs {t('mofWorth')} dex on unseen frameworks: shuffling a framework descriptor across rows that mostly share frameworks changes little, so the ablation is the measurement to trust for this block.</p>
      <HBars label="Permutation importance" max={0.55} items={perm.map((r) => ({ key: r.block, label: r.block === 'conditions' ? 'Dosing conditions' : r.block === 'coupled MOF x toxin' ? 'Coupled MOF and pollutant' : r.block === 'adsorbate' ? 'Pollutant descriptors' : r.block === 'toxin at this pH' ? 'Pollutant at this pH' : r.block === 'MOF at this pH' ? 'MOF at this pH' : 'MOF embedding', value: r.increase, display: `${r.increase < 0 ? '−' : '+'}${fmt(Math.abs(r.increase), 3)}` }))} />
      <SourceNote files={SOURCES.ablations} />
    </div>
  );
}

export function LearningPanel() {
  const L = D.learning;
  const held = L.held.map((p) => ({ x: p.rows, y: p.rmse, lo: p.rmse - p.drawSd, hi: p.rmse + p.drawSd }));
  const now = L.held[L.held.length - 1]!;
  const proj = [{ x: now.rows, y: now.rmse }, ...L.projection.filter((p) => p.rows > now.rows && p.rows <= 2083).map((p) => ({ x: p.rows, y: p.rmse }))];
  const fw = L.views.filter((p) => p.view === 'fw_disjoint').map((p) => ({ x: p.rows, y: p.rmse }));
  const sp = L.views.filter((p) => p.view === 'sp_disjoint').map((p) => ({ x: p.rows, y: p.rmse }));
  const asym = (v('asymFw') + v('asymSp')) / 2;
  return (
    <div>
      <p>Subsampling the development set by publication, with the held-out set fixed. The curve is still falling at the current size, but data buys two different things: a lot for a new publication, far less for a new framework or pollutant. These curves were measured with the LightGBM booster, which scored every feature experiment.</p>
      <div className="two-up">
        <figure>
          <figcaption>Held-out publications. Bars show the draw-to-draw spread.</figcaption>
          <Lines ariaLabel="Held-out RMSE against number of training rows with a dotted extrapolation" xLabel="Training rows" yLabel="Held-out RMSE (dex)" xDomain={[0, 2200]} yDomain={[0.35, 0.85]}
            series={[{ key: 'm', label: 'measured', tone: 'accent', pts: held, endLabel: 'measured' }, { key: 'p', label: 'projected', tone: 'ink', dashed: true, pts: proj, endLabel: 'extrapolated' }]} />
        </figure>
        <figure>
          <figcaption>Unseen framework and unseen pollutant.</figcaption>
          <Lines ariaLabel="RMSE against training rows for unseen-framework and unseen-pollutant views with fitted asymptote" xLabel="Training rows in the fold" yLabel="RMSE (dex)" xDomain={[0, 850]} yDomain={[0.35, 0.65]}
            refs={[{ y: asym, label: `asymptote ${fmt(asym, 3)}` }]}
            series={[{ key: 'f', label: 'unseen framework', tone: 'accent', pts: fw, endLabel: 'framework', endLabelDy: -14 }, { key: 's', label: 'unseen pollutant', tone: 'ink', pts: sp, endLabel: 'pollutant' }]} />
        </figure>
      </div>
      <p>A fitted curve projects a gain of {t('gain1000')} dex of held-out RMSE for {t('addRows')} additional rows. This is an extrapolation of a fitted curve, not a measurement; in a backtest every fit over-predicted the error, so the projection is conservative. The two generalisation views level off near {fmt(asym, 3)} dex, so even unlimited data of the same kind would buy little for new frameworks or pollutants: that floor is a representation-and-estimator floor, and the estimator swap moved it without adding a row. The draw-to-draw spread (up to {t('drawSpread')} dex) is five to ten times the seed spread, so which publications are added matters more than refitting.</p>
      <SourceNote files={SOURCES.learning} />
    </div>
  );
}

export function IntervalPanel() {
  const pick = (est: string, nominal: number) => D.conformal.find((r) => r.estimator === est && r.target === 'log10(qe)' && r.method === 'absolute' && r.nominal === nominal);
  const rows = [
    { label: 'TabPFN-3', nominal: 0.8, r: pick('tabpfn', 0.8)! }, { label: 'TabPFN-3', nominal: 0.9, r: pick('tabpfn', 0.9)! },
    { label: 'LightGBM', nominal: 0.8, r: pick('lgbm', 0.8)! }, { label: 'LightGBM', nominal: 0.9, r: pick('lgbm', 0.9)! },
  ];
  const cols: Col<(typeof rows)[number]>[] = [
    { key: 'm', label: 'Model', render: (r) => r.label },
    { key: 'n', label: 'Nominal', num: true, render: (r) => `${fmt(100 * r.nominal, 0)}%` },
    { key: 'c', label: 'Coverage on test publications', num: true, render: (r) => `${fmt(100 * r.r.coverage, 1)}%` },
    { key: 'w', label: 'Median width (dex)', num: true, render: (r) => fmt(r.r.widthDex, 3) },
    { key: 'f', label: 'As a range in qe', num: true, render: (r) => `${fmt(r.r.widthFold, 1)}×` },
  ];
  return (
    <div>
      <p>Split-conformal intervals are calibrated on {t('valPapers')} validation publications and checked on the {t('nTestPapers')} test publications, so no publication appears on both sides. With the absolute-residual score, TabPFN-3 reaches {t('cov80')}% coverage at nominal 80% and {t('cov90')}% at nominal 90%.</p>
      <DataTable cols={cols} rows={rows} caption="Conformal interval coverage and width" />
      <Callout tone="caveat" title="What the intervals can and cannot do">
        An 80% interval is {t('fold80')}× wide in qe and a 90% interval is {t('fold90')}×. That is enough to sort candidate frameworks into tiers and not enough to quote a value with a tolerance. The adaptive (normalised) variant under-covers badly for TabPFN-3 because a {t('valRows')}-row calibration set is too small to fit a difficulty model, so it is not used.
      </Callout>
      <SourceNote files={SOURCES.conformal} />
    </div>
  );
}

