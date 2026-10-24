import { useMemo, useState } from 'react';
import { D, SOURCES } from '../data';
import { t, v } from '../data/facts';
import { Parity } from '../charts/Parity';
import { Callout, DataTable, HBars, SourceNote, ViewSwitch, type Col } from '../ui/primitives';
import { classLabel, fmt } from '../lib';

export function HeldoutPanel() {
  const [cls, setCls] = useState<string | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const classes = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of D.heldout) c[r.cls] = (c[r.cls] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, []);
  const rows = cls ? D.heldout.filter((r) => r.cls === cls) : D.heldout;
  const cols: Col<(typeof D.heldout)[number]>[] = [
    { key: 'f', label: 'Framework', render: (r) => r.framework },
    { key: 's', label: 'Species', render: (r) => r.species },
    { key: 'c', label: 'Class', render: (r) => classLabel(r.cls) },
    { key: 'q', label: 'Measured (mg/g)', num: true, render: (r) => fmt(r.qe, r.qe < 10 ? 2 : 0) },
    { key: 'p', label: 'Predicted (mg/g)', num: true, render: (r) => fmt(r.qePred, r.qePred < 10 ? 2 : 0) },
    { key: 'e', label: 'Off by', num: true, render: (r) => `${fmt(10 ** Math.abs(r.yPred - r.y), 2)}×` },
  ];
  const scoreboard: { m: string; rmse: string; mae: string; r2: string; fe: string; w2: string; w3: string; em?: boolean }[] = [
    { m: 'Predict the training mean', rmse: t('meanBaselineRmse'), mae: t('meanBaselineMae'), r2: t('meanBaselineR2'), fe: 'n/a', w2: 'n/a', w3: 'n/a' },
    { m: 'LightGBM, same 87 columns', rmse: t('lgbmRmse'), mae: t('lgbmMae'), r2: t('lgbmR2'), fe: `${t('lgbmMedianFE')}×`, w2: `${t('lgbmWithin2')}%`, w3: `${t('lgbmWithin3')}%` },
    { m: 'TabPFN-3 (final model)', rmse: t('rmse'), mae: t('mae'), r2: t('r2'), fe: `${t('medianFE')}×`, w2: `${t('within2')}%`, w3: `${t('within3')}%`, em: true },
  ];
  return (
    <div>
      <p>Each dot is one of the {t('nTest')} measurements from the {t('nTestPapers')} held-out publications. A dot on the diagonal is a perfect prediction. Hover for the row; pick a class to highlight it.</p>
      <div className="chip-row" role="group" aria-label="Highlight a pollutant class">
        <button className="chip" aria-pressed={cls === null} onClick={() => setCls(null)}>All ({D.heldout.length})</button>
        {classes.map(([c, n]) => (<button key={c} className="chip" aria-pressed={cls === c} onClick={() => setCls(cls === c ? null : c)}>{classLabel(c)} ({n})</button>))}
      </div>
      <div className="panel-head"><ViewSwitch view={view} onChange={setView} /></div>
      {view === 'chart'
        ? <Parity rows={D.heldout} highlightClass={cls} ariaLabel={`Predicted against measured adsorption capacity for ${D.heldout.length} held-out measurements, log scale`} />
        : <DataTable cols={cols} rows={rows} caption="Held-out predictions" maxHeight={420} />}
      <h3 className="sub">Scoreboard on the held-out publications</h3>
      <div className="table-wrap"><table><caption className="sr-only">Held-out scoreboard</caption>
        <thead><tr><th>Model</th><th className="num">RMSE (dex)</th><th className="num">MAE (dex)</th><th className="num">R²</th><th className="num">Median fold-error</th><th className="num">Within 2×</th><th className="num">Within 3×</th></tr></thead>
        <tbody>{scoreboard.map((r) => (<tr key={r.m} className={r.em ? 'row-em' : ''}><td>{r.m}</td><td className="num tnum">{r.rmse}</td><td className="num tnum">{r.mae}</td><td className="num tnum">{r.r2}</td><td className="num tnum">{r.fe}</td><td className="num tnum">{r.w2}</td><td className="num tnum">{r.w3}</td></tr>))}</tbody></table></div>
      <Callout tone="caveat" title="The middle of the distribution got slightly worse">
        TabPFN-3 removes large errors (within 3× rises from {t('lgbmWithin3')}% to {t('within3')}%) but the median fold-error rises from {t('lgbmMedianFE')}× to {t('medianFE')}× and within 2× falls from {t('lgbmWithin2')}% to {t('within2')}%. Both are single seed-0 fits; the numbers are reported because RMSE alone hides the trade.
      </Callout>
      <SourceNote files={[...SOURCES.heldout, ...SOURCES.summary]} />
    </div>
  );
}

export function ClassPanel() {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const items = D.classError.map((c) => ({ key: c.cls, label: classLabel(c.cls), sub: `n = ${c.n}`, value: c.rmse, muted: c.n < 10 }));
  const cols: Col<(typeof D.classError)[number]>[] = [
    { key: 'c', label: 'Class', render: (r) => classLabel(r.cls) },
    { key: 'n', label: 'Held-out rows', num: true, render: (r) => r.n },
    { key: 'r', label: 'RMSE (dex)', num: true, render: (r) => fmt(r.rmse, 3) },
    { key: 'm', label: 'MAE (dex)', num: true, render: (r) => fmt(r.mae, 3) },
  ];
  return (
    <div>
      <p>Held-out RMSE by pollutant class, best to worst. Lighter bars have fewer than ten held-out rows and should not be over-interpreted. Antibiotics ({fmt(D.classError.find((c) => c.cls === 'antibiotic')!.n, 0)} rows) and anionic dyes are the best-represented organic classes; cationic dyes and pesticides are the two worst classes with more than five rows.</p>
      <div className="panel-head"><ViewSwitch view={view} onChange={setView} /></div>
      {view === 'chart'
        ? <HBars items={items} max={1.1} label="Held-out RMSE by pollutant class" />
        : <DataTable cols={cols} rows={D.classError} caption="Held-out error by pollutant class" />}
      <p className="muted-p">Overall held-out RMSE is {t('rmse')} dex. The estimator change moved this profile a great deal: under LightGBM, PFAS was the worst class at {t('pfasLgbm')} dex; under TabPFN-3 it is {fmt(D.classError.find((c) => c.cls === 'pfas')!.rmse, 3)}.</p>
      <SourceNote files={SOURCES.classError} />
    </div>
  );
}

export function SplitPanel() {
  const s = (est: string, ev: string, sp: string) => D.splits.single.find((r) => r.estimator === est && r.evaluation === ev && r.split.startsWith(sp))!.rmse;
  const items = [
    { key: 'h-mix', label: 'Hold-out, random rows', sub: '20 draws', value: s('tabpfn', 'hold-out', 'mixed'), muted: true },
    { key: 'h-pub', label: 'Hold-out, whole publications', value: s('tabpfn', 'hold-out', 'paper') },
    { key: 'c-mix', label: '5-fold CV, random rows', sub: '10 partitions', value: v('cvMixed'), muted: true },
    { key: 'c-pub', label: '5-fold CV, whole publications', sub: '10 partitions', value: v('cvGrouped') },
  ];
  return (
    <div>
      <p>Much of the adsorption-ML literature scores models on test rows drawn at random from pooled data. Rows from one paper share a batch of material, a protocol and an analytical method, so a random split lets the model recognise the paper instead of learning the chemistry. Same model, same features, only the row assignment changes (TabPFN-3, RMSE in dex, lower is better):</p>
      <HBars items={items} max={0.5} format={(x) => fmt(x, 4)} label="RMSE under random-row and whole-publication evaluation" />
      <p className="muted-p">The whole-publication hold-out bar is the TabPFN-3 refit used in this comparison ({fmt(s('tabpfn', 'hold-out', 'paper'), 4)}), which differs from the shipped fit ({t('rmse')}, from {fmt(D.summary.test.rmse, 4)}) in the fourth decimal.</p>
      <div className="figure-row">
        <div><div className="big">{t('gap')} <span className="pm">± {t('gapSd')}</span></div><div className="cap">dex gap between the two conventions, paired over ten partitions</div></div>
        <div><div className="big">≥ {t('gapMin')}</div><div className="cap">dex in every one of the ten partitions</div></div>
        <div><div className="big">{t('lgbmGap')}</div><div className="cap">dex for LightGBM: the gap belongs to the data, not the model</div></div>
      </div>
      <p>On a random split the final model reaches RMSE {t('holdoutMixed')} dex and a median fold-error of {t('holdoutMixedFE')}×, with {t('holdoutMixedWithin2')}% of rows within a factor of two. Those figures answer a question about interpolation inside known publications. The whole-publication figures answer the deployment question of predicting for a new study, so they are the headline.</p>
      <SourceNote files={SOURCES.splits} />
    </div>
  );
}

export function R2Panel() {
  const rmse = D.summary.test.rmse;
  const opts = [
    { id: 'test', label: 'Scored on the held-out rows', sd: v('testSd'), r: rmse, n: `the spread of the ${t('nTest')} test rows` },
    { id: 'pool', label: 'Scored against the pooled spread', sd: v('pooledSd'), r: rmse, n: 'the spread of all modelling rows' },
    { id: 'train', label: 'Scored against the training spread', sd: v('trainSd'), r: rmse, n: `the spread of the ${t('nDev')} training rows` },
    { id: 'nu', label: 'Held-out rows without ten NU-1000 PFAS rows', sd: v('nuSdWithout'), r: v('nuRmseWithout'), n: 'the same model, test set narrowed' },
  ] as const;
  const [id, setId] = useState<(typeof opts)[number]['id']>('test');
  const o = opts.find((x) => x.id === id)!;
  const r2 = 1 - (o.r / o.sd) ** 2;
  return (
    <div>
      <p>On any one set of rows, R² = 1 − (RMSE / SD)², so it depends on how widely the rows being scored are spread. The headline R² of {t('r2')} is real, and it also flatters the model. Pick a way of scoring the same predictions:</p>
      <div className="radio-list" role="radiogroup" aria-label="How to score the predictions">
        {opts.map((x) => (<button key={x.id} role="radio" aria-checked={id === x.id} className="radio" onClick={() => setId(x.id)}>{x.label}</button>))}
      </div>
      <div className="r2-readout" aria-live="polite">
        <div><div className="big tnum">{fmt(r2, 3)}</div><div className="cap">R²</div></div>
        <div className="r2-eq tnum">1 − ({fmt(o.r, 3)} / {fmt(o.sd, 3)})²<br /><span className="cap">RMSE {fmt(o.r, 3)} dex, SD {fmt(o.sd, 3)} dex, {o.n}</span></div>
      </div>
      <p>The test set is wider than the training set because of one publication: {t('nuRows')} rows of PFAS on NU-1000 with measured qe at or below {t('nuCutoff')} mg/g carry {t('nuShare')}% of the test variance. Without them held-out RMSE improves to {t('nuRmseWithout')} dex while R² falls to {t('nuR2Without')}. Compare studies by RMSE in dex, and quote R² together with the SD of the rows it was scored on.</p>
      <SourceNote files={[...SOURCES.heldout, ...SOURCES.summary]} />
    </div>
  );
}
