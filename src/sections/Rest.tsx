import { useMemo, useState } from 'react';
import { ArrowRight, GithubLogo } from '@phosphor-icons/react';
import { D, SOURCES } from '../data';
import { t } from '../data/facts';
import { Evidence } from '../explorers/Evidence';
import { LEDGER, VERDICT_LABEL, type Verdict } from '../content/ledger';
import { REFERENCES } from '../content/references';
import { Badge, Callout, DataTable, Reveal, Section, SourceNote, type Col } from '../ui/primitives';
import { fmt } from '../lib';
import { REPO_URL } from './Top';

export function EvidenceSection() {
  return (
    <Section id="evidence" title="The evidence, explorable"
      intro={<p>Every chart below is drawn from the committed result files, not from screenshots. Each panel names its source files, and each has a table view.</p>}>
      <Reveal><Evidence /></Reveal>
    </Section>
  );
}

export function Ledger() {
  const [verdict, setVerdict] = useState<Verdict | 'all'>('all');
  const [q, setQ] = useState('');
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: LEDGER.length };
    for (const e of LEDGER) c[e.verdict] = (c[e.verdict] ?? 0) + 1;
    return c;
  }, []);
  const shown = LEDGER.filter((e) => (verdict === 'all' || e.verdict === verdict) && (q === '' || `${e.area} ${e.question}`.toLowerCase().includes(q.toLowerCase())));
  const order: (Verdict | 'all')[] = ['all', 'helped', 'none', 'hurt', 'rejected'];
  return (
    <Section id="ledger" title="Every experiment, including the ones that failed" tone="tint"
      intro={<p>Negative results determine where the next stage should go, so they are reported with the same care as positive ones. Filter by outcome or search by topic.</p>}>
      <Reveal>
        <div className="ledger-controls">
          <div className="chip-row" role="group" aria-label="Filter by outcome">
            {order.map((o) => (<button key={o} className="chip" aria-pressed={verdict === o} onClick={() => setVerdict(o)}>{o === 'all' ? 'All' : VERDICT_LABEL[o]} ({counts[o] ?? 0})</button>))}
          </div>
          <label className="search"><span className="sr-only">Search experiments</span>
            <input type="search" placeholder="Search by topic, e.g. MOF, target, ensemble" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <p className="muted-p" aria-live="polite">{shown.length} of {LEDGER.length} experiments shown.</p>
        {shown.length === 0 ? <p className="empty">No experiment matches that search. Clear the filter to see all of them.</p> : (
          <ul className="ledger">
            {shown.map((e) => (
              <li key={e.id} className={`ledger-item v-${e.verdict}`}>
                <div className="ledger-head"><Badge tone={e.verdict === 'helped' ? 'accent' : e.verdict === 'rejected' ? 'amber' : 'plain'}>{VERDICT_LABEL[e.verdict]}</Badge><span className="area">{e.area}</span></div>
                <h3>{e.question}</h3>
                <p>{e.result}</p>
                <p className="script"><code>{e.script}</code></p>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </Section>
  );
}

export function Findings() {
  const rows = [
    { fig: <>{t('noBothR2')}</>, cap: 'R² with no experimental input', head: 'The model is anchored on the mass balance',
      body: <>An experiment that offers C₀ of pollutant against m of adsorbent cannot deposit more than C₀/m, and most experiments in the literature remove most of what is offered. With framework and pollutant identity but no information about the experiment, the model scores worse than predicting the mean, because it learns chemistry-to-uptake associations that are really dosing associations in disguise. About {t('capacityShare')}% of what the coupled block recovers is a single column, the capacity limit; the genuinely pH-derived chemistry contributes {t('phChemistry')} dex. It is real and an order of magnitude smaller.</> },
    { fig: <>{t('icc')}%</>, cap: 'of the remaining error is a per-publication offset', head: 'The publication effect is quantified, not solved',
      body: <>Rows from one study share a batch, an activation protocol and an analytical method. Knowing every publication’s offset would lower RMSE on the rows analysed from {t('rmseNow')} to {t('rmseNoOffset')} dex. Five standard remedies all made held-out error worse, because down-weighting a study removes its measurements, not its batch effect. Independent laboratories themselves disagree by a median {t('interLab')} dex on the same material and pollutant, which sets a floor no model of the literature can beat.</> },
    { fig: <>{t('probeLcd')}</>, cap: 'R² for cavity diameter, from the embedding', head: 'The crystal embedding encodes geometry, not chemistry',
      body: <>From the frozen vector alone, a framework’s largest cavity is recovered at leave-one-framework-out R² {t('probeLcd')} and its pore window at {t('probePld')}, but metal fraction only at {t('probeMetal')} and halogen fraction not at all ({t('probeHalogen')}). It still lowers error on unseen frameworks, in ten of ten paired repeats, and a gas-phase fine-tune made it more geometric and less chemical.</> },
    { fig: <>{t('moreDataRatio')}×</>, cap: 'more value from data for a new publication', head: 'More rows help new studies far more than new materials',
      body: <>Roughly {t('moreDataRatio')} times as much as for a new framework or pollutant, whose error levels off near {fmt((D.learning.asymptotes[0]!.asymptote + D.learning.asymptotes[1]!.asymptote) / 2, 3)} dex. Subsampling existing publications cannot add frameworks, so this measures more rows on known frameworks, not more frameworks.</> },
  ];
  return (
    <Section id="findings" title="What limits accuracy">
      <Reveal>
        <ol className="findings">
          {rows.map((r) => (
            <li key={r.head}>
              <div className="f-fig"><span className="tnum">{r.fig}</span><small>{r.cap}</small></div>
              <div className="f-body"><h3>{r.head}</h3><p>{r.body}</p></div>
            </li>
          ))}
        </ol>
        <Callout tone="caveat" title="Limitations to keep in view">
          Records come from the water-treatment literature, so food matrices are essentially absent. Only {t('nFrameworks')} frameworks appear in the modelling rows. The framework surface charge and pollutant pKa values are proxies. With {t('nTestPapers')} held-out publications the bootstrap interval on held-out RMSE is roughly ± {t('testBootstrapHalf')} dex, so most individual design choices cannot be resolved on the test view alone. Predictions are not clipped to the mass-balance ceiling: the final model exceeds it on {t('ceilingExceed')} of the {t('ceilingRows')} held-out rows that report one. TabPFN-3 weights are licensed for non-commercial use and expose no feature importance.
        </Callout>
        <SourceNote files={[...SOURCES.paperVariance, ...SOURCES.embeddingProbe, ...SOURCES.ablations]} />
      </Reveal>
    </Section>
  );
}

const STATUS: { m: string; s: string; tone: 'accent' | 'amber' | 'plain' }[] = [
  { m: 'Data curation and leakage audit', s: 'Functional', tone: 'accent' },
  { m: 'Structures and MOF embedding', s: 'Functional', tone: 'accent' },
  { m: 'Toxin chemistry (58 descriptors)', s: 'Functional', tone: 'accent' },
  { m: 'Physics-coupled features', s: 'Functional', tone: 'accent' },
  { m: 'Prediction model (TabPFN-3)', s: 'Functional', tone: 'accent' },
  { m: 'Reference-data ensemble', s: 'Functional', tone: 'accent' },
  { m: 'ChemBERTa toxin encoder', s: 'In progress', tone: 'plain' },
  { m: 'Heterogeneous GNN with solvation gate', s: 'Planned', tone: 'amber' },
];

export function Status() {
  const cols: Col<(typeof STATUS)[number]>[] = [
    { key: 'm', label: 'Module', render: (r) => r.m },
    { key: 's', label: 'Status as of Panel Review 2 (16 Sep 2026)', render: (r) => <Badge tone={r.tone}>{r.s}</Badge> },
  ];
  const road = [
    <>Recover structures for the {t('unbuiltFrameworks')} named frameworks now excluded ({t('unbuiltRows')} rows, measured at {t('unbuiltGain')} dex of held-out RMSE).</>,
    'A targeted extraction pass for the weakest classes (cationic dyes, pesticides) and for isotherm-level data, which would allow a capacity target independent of each paper’s dosing.',
    'Port few-shot per-publication calibration to the final model.',
    'A per-framework point of zero charge from node and linker protonation states, replacing the metal-oxide proxy.',
    'Train and evaluate the heterogeneous host-guest graph network with a solvation gate under the same protocol.',
    'Screen CoRE MOF candidates for a target pollutant with conformal intervals, and use active learning to choose the next experiments.',
  ];
  return (
    <Section id="status" title="Where the project stands, and what comes next" tone="tint"
      intro={<p>The staged strategy was to build a clean, leakage-controlled dataset and a reliable physics-aware baseline first, then use that benchmark to test whether a graph network gives a meaningful improvement. The first half is done. The second half is not.</p>}>
      <Reveal>
        <div className="data-grid">
          <div>
            <h3 className="sub">Module status</h3>
            <DataTable cols={cols} rows={STATUS} caption="Module status" />
          </div>
          <div>
            <h3 className="sub">The modelling ladder</h3>
            <ol className="ladder">
              <li className="done"><strong>Tabular baselines</strong><span>RF, XGBoost, LightGBM. Done.</span></li>
              <li className="done"><strong>Physics-coupled features and TabPFN-3</strong><span>Done.</span></li>
              <li><strong>Simple GNN</strong><span>Host and guest graphs. In progress.</span></li>
              <li className="planned"><strong>Heterogeneous GNN</strong><span>Typed nodes and edges. Planned.</span></li>
              <li className="planned"><strong>Full KL-HGNN with solvation gate</strong><span>The target. Planned.</span></li>
            </ol>
          </div>
        </div>
        <div className="planned-box">
          <div className="pb-head"><h3>The planned architecture</h3><Badge tone="amber">Planned, not built</Badge></div>
          <div className="planned-flow" role="img" aria-label="Planned architecture: host graph, guest graph and environment feed a solvation gate that scales each host-guest interaction, then a prediction head">
            <div className="pf-in"><span>Host</span><small>MOF atoms and pore</small></div>
            <div className="pf-in"><span>Guest</span><small>pollutant atoms</small></div>
            <div className="pf-in"><span>Environment</span><small>pH, polarity</small></div>
            <ArrowRight size={22} aria-hidden="true" />
            <div className="pf-gate"><span>Solvation gate</span><small>G<sub>ij</sub> = σ(W<sub>g</sub>[h<sub>i</sub> ∥ h<sub>j</sub> ∥ z<sub>env</sub>])</small></div>
            <ArrowRight size={22} aria-hidden="true" />
            <div className="pf-in"><span>Gated binding</span><small>m̃<sub>ij</sub> = G<sub>ij</sub> · m<sub>ij</sub></small></div>
          </div>
          <p>The current results shape that design. The coupled block is a hand-built, non-learned instance of the gate’s inputs (host state at this pH, guest state at this pH, and their pairing), and it measurably helps, which supports modulating host-guest terms by the environment. The environment that matters is narrower than anticipated: pH matters through the materials, and the dosing settings must stay explicit. With only {t('nFrameworks')} frameworks, end-to-end training of a structure encoder is severely data-limited.</p>
          <p><strong>The bar to beat:</strong> a graph model must score below {t('barToBeat')} dex (seed-averaged) on held-out publications and {t('barToBeatFw')} dex on unseen frameworks under the same protocol to justify its complexity.</p>
        </div>
        <h3 className="sub">Roadmap, in order of measured return</h3>
        <ol className="road">{road.map((r, i) => (<li key={i}>{r}</li>))}</ol>
      </Reveal>
    </Section>
  );
}

export function ToxPredict() {
  return (
    <Section id="toxpredict" title="Side study: ToxPredict">
      <Reveal>
        <p>A comparison of a graph convolutional network trained from scratch and a fine-tuned ChemBERTa transformer on one Tox21 endpoint (NR-AR), plus a GIN network on the QM9 HOMO-LUMO gap. Figures below are <strong>as reported in the repository README</strong>.</p>
        <div className="table-wrap narrow"><table><caption className="sr-only">ToxPredict results as reported</caption>
          <thead><tr><th>Model</th><th className="num">ROC-AUC</th><th className="num">F1</th></tr></thead>
          <tbody>
            <tr><td>Graph convolutional network, from scratch</td><td className="num tnum">{t('gcnAuc')}</td><td className="num tnum">{t('gcnF1')}</td></tr>
            <tr className="row-em"><td>ChemBERTa, fine-tuned</td><td className="num tnum">{t('bertAuc')}</td><td className="num tnum">{t('bertF1')}</td></tr>
          </tbody></table></div>
        <Callout tone="caveat" title="Read this as indicative, not controlled">
          Of {t('toxLabelled')} labelled molecules only {t('toxPositive')}% are positive, so accuracy is not informative and is not shown. The two models’ test splits and decision thresholds are set in different scripts, and no run logs are saved in the repository. The QM9 model was trained but no results are recorded. The paper draft carries the same open note about the split.
        </Callout>
        <p>Its role in the project: pretrained ChemBERTa looked promising, so it was then tested as a pollutant representation for adsorption, where it did not beat 58 RDKit descriptors.</p>
        <SourceNote files={SOURCES.tox} />
      </Reveal>
    </Section>
  );
}

const REPOS = [
  { name: 'PredModel_FeatureExtraction', desc: 'The final pipeline, model, experiments and result files behind every figure on this site.' },
  { name: 'prediction_model', desc: 'The earlier reference-data ensemble with few-shot calibration.' },
  { name: 'KL-HGNN-MOF-Sensor', desc: 'The prototype dataset, structure-resolution pipeline and first baseline.' },
  { name: 'ToxPredict', desc: 'The Tox21 and QM9 side study.' },
  { name: 'research-portfolio', desc: 'This website.', url: REPO_URL },
];

export function Team() {
  return (
    <Section id="team" title="Team, repositories and references">
      <Reveal>
        <div className="data-grid">
          <div>
            <h3 className="sub">Authors</h3>
            <p className="names">Midhunan Vijendra Prabhaharan, Siva Dharaneesh A. R., Sabari L. R. M., Varun Hirthik V., Barath Arjun B.</p>
            <p><strong>Guides:</strong> Dr. Gowtham R., Associate Professor, and Mr. Dayanand V., Assistant Professor (corresponding author), Department of Computer Science and Engineering.</p>
            <p>Amrita School of Computing, Amrita Vishwa Vidyapeetham, Coimbatore, Tamil Nadu, India. Course projects 23CSE399 (Phase 1) and 23CSE498 (Phase 2). Paper: Draft v0.1, 22 October 2026, not peer reviewed.</p>
          </div>
          <div>
            <h3 className="sub">Repositories</h3>
            <ul className="repos">
              {REPOS.map((r) => (
                <li key={r.name}><a href={r.url ?? `https://github.com/team-91-rp/${r.name}`} target="_blank" rel="noreferrer"><GithubLogo size={18} aria-hidden="true" /> {r.name}</a><span>{r.desc}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <h3 className="sub">Data and licensing notes</h3>
        <p>Crystal structures derive from CoRE MOF 2019 v2 and the Crystallography Open Database. The framework embeddings use the released MOFTransformer checkpoint. The TabPFN-3 weights are licensed for non-commercial use; TabPFN v2 is under a permissive licence and costs {t('v2Cost')} dex of held-out RMSE. The compiled dataset is transcribed from published papers, and its redistribution terms are not yet settled, so this site does not offer it for download.</p>
        <details className="more"><summary>References</summary>
          <ol className="refs">{REFERENCES.map((r) => (<li key={r.cite}>{r.cite}{r.doi ? <> <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">doi:{r.doi}</a></> : null}</li>))}</ol>
        </details>
        <p className="foot">Numbers on this page are either recomputed from the project’s committed result files and checked by an automated suite, or, where no file holds them, cited to the paper draft or repository README in the site’s source.</p>
      </Reveal>
    </Section>
  );
}
