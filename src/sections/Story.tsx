import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { D, SOURCES } from '../data';
import { t } from '../data/facts';
import { Badge, Callout, DataTable, HBars, Reveal, Section, SourceNote, type Col } from '../ui/primitives';
import { fmt } from '../lib';

function Stage({ when, title, repo, children, outcome, lesson, more }: { when: string; title: string; repo?: string; children: React.ReactNode; outcome: React.ReactNode; lesson: React.ReactNode; more?: React.ReactNode }) {
  return (
    <Reveal className="stage-wrap">
      <article className="stage">
        <div className="stage-when"><span>{when}</span>{repo ? <code>{repo}</code> : null}</div>
        <div className="stage-body">
          <h3>{title}</h3>
          <div className="stage-text">{children}</div>
          <dl className="stage-dl">
            <div><dt>Outcome</dt><dd>{outcome}</dd></div>
            <div><dt>Lesson</dt><dd>{lesson}</dd></div>
          </dl>
          {more ? <details className="more"><summary>More detail</summary><div>{more}</div></details> : null}
        </div>
      </article>
    </Reveal>
  );
}

export function Journey() {
  const proto = D.proto;
  return (
    <Section id="journey" title="The journey, including the wrong turns"
      intro={<p>The project went through five stages. Each stage was shaped by a failure or a surprise in the one before it. Dates are when the work was first presented or committed.</p>}>
      <div className="timeline">
        <Stage when="Jan to Mar 2026" title="Concept: a key-lock graph network with a solvation gate"
          outcome="An architecture specified on paper, with no liquid-phase dataset to train or test it."
          lesson="A dataset and an honest baseline have to come first."
          more={<>
            <p>Three review decks (28 Jan, 22 Feb, 30 Mar) and a written report (23 Feb) sharpened the idea. The literature survey named four gaps: no standardised benchmark datasets for MOFs beyond gas-phase adsorption, weak links between AI-generated materials and experimental validation, scarce diverse datasets beyond adsorption tasks, and almost no attention to liquid-phase sensing or solvent effects in current machine-learning models.</p>
            <p>The planned model treats MOF atoms (host), analyte atoms (guest) and the solvent environment as distinct node types, and gates each host-guest interaction. This is a design, not a result. Nothing in it has been trained.</p>
          </>}>
          <p>Existing structure-property models such as ALIGNN work well in vacuum or gas-phase settings. The proposal was a heterogeneous graph in which a <em>solvation gate</em> scales each host-guest interaction by the liquid environment:</p>
          <p className="formula" aria-label="Solvation gate formula">G<sub>ij</sub> = σ( W<sub>g</sub> [ h<sub>i</sub> ∥ h<sub>j</sub> ∥ z<sub>env</sub> ] )</p>
          <p>Here h<sub>i</sub> and h<sub>j</sub> are host and guest embeddings, z<sub>env</sub> encodes conditions such as pH and polarity, and the sigmoid σ keeps the gate between 0 and 1, so interactions blocked by solvent competition or steric hindrance are turned down. <Badge tone="amber">Planned, not built</Badge></p>
        </Stage>

        <Stage when="22 Jul 2026" title="A side study: can a pretrained molecular encoder help?" repo="ToxPredict"
          outcome="A graph network trained from scratch and a fine-tuned ChemBERTa were compared on Tox21 toxicity, as reported in the repository."
          lesson="Pretrained molecular encoders looked promising, so they were later tested for adsorption. There they did not help.">
          <p>A two-layer graph convolutional network was compared with a fine-tuned ChemBERTa transformer on one Tox21 endpoint, and a GIN network was trained on the QM9 HOMO-LUMO gap. The comparison is described in more detail under <a href="#toxpredict">the side study</a>, including why it is indicative rather than controlled.</p>
        </Stage>

        <Stage when="1 Sep 2026" title="Prototype dataset and a first baseline" repo="KL-HGNN-MOF-Sensor"
          outcome={<>A baseline that fit its training data (R² {fmt(proto.results.find((r) => r.split === 'train')!.r2, 2)}) and failed on new publications (test R² {t('protoTestR2')}, RMSE {t('protoTestRmse')} mg/g on {t('protoTest')} rows).</>}
          lesson="A raw-scale target, integer-coded identities and few source groups do not transfer. Use log10 qe, structure-based descriptors and many more publications."
          more={<>
            <p>The cleaning pipeline canonicalised species names without merging distinct species (Cr(III) and Cr(VI) stay apart), split by source publication rather than by row, and assigned each row to a data tier from A (food-matrix experiment) to D (insufficient data). Every material received an explicit structure status: exact, backbone, composite, unresolved or unspecified.</p>
            <p>Of the {t('protoMofs')} material names, {proto.structureStatus['BACKBONE']} were mapped to a parent framework (backbone), {proto.structureStatus['COMPOSITE']} are composites, {proto.structureStatus['UNRESOLVED']} are unresolved and {proto.structureStatus['UNSPECIFIED']} is unspecified; none were matched to an exact structure. Only backbone-matched rows with resolved analytes and numeric targets entered the baseline.</p>
            <p>The baseline used four inputs: an integer code for the framework, an integer code for the analyte, pH and temperature. Test R² is computed on only {t('protoTest')} rows, so it is a rough indicator, but the direction was clear.</p>
          </>}>
          <p>The first dataset held {t('protoRecords')} records for {t('protoMofs')} material names from {t('protoGroups')} source groups. An XGBoost model was trained on the {t('protoRows')} rows that survived the filters ({t('protoTrain')} train, {t('protoVal')} validation, {t('protoTest')} test), predicting raw capacity in mg/g.</p>
        </Stage>

        <Stage when="2 to 3 Sep 2026" title="Reference-data ensemble" repo="prediction_model"
          outcome={<>On {t('refTestPapers')} held-out publications ({t('refTestRows')} rows): R² {t('refR2')}, MAE {t('refMae')} log10, with {t('refWithin5')}% of rows within a factor of five.</>}
          lesson="A mass-balance offset helps where initial concentration and dose are known, and per-publication offsets are large but can be measured from a few rows."
          more={<>
            <p>Every chemical descriptor was sourced from a public database (PubChem, the periodic table, CoRE MOF 2019) instead of typed by hand, giving {t('refFeatures')} features. Frameworks were mapped to structures through {t('refArchetypes')} explicit, auditable assignments.</p>
            <p>The key finding was an identity: qe equals the removal fraction times C₀ divided by dose, so the log of C₀/dose is set by how the experiment was configured, not by any chemistry. A second branch for rows that report both quantities was worth {t('offsetBranchWorth')} log10 of MAE.</p>
            <p>Few-shot calibration then estimated a per-publication offset from a few revealed measurements. With three revealed rows MAE fell from {t('fewshotK0')} to {t('fewshotK3')}. This has not been ported to the final model.</p>
          </>}>
          <p>The second pipeline used {t('refRows')} rows from {t('refPapers')} publications and an ensemble of three gradient-boosted and forest models. Names were resolved to crystal structures by lookup in a database. Results are not comparable with the final pipeline: different rows, different split.</p>
        </Stage>

        <Stage when="6 Sep to 20 Oct 2026" title="Final pipeline: built structures, physics-coupled features, TabPFN-3" repo="PredModel_FeatureExtraction"
          outcome={<>Held-out RMSE {t('rmse')} dex and R² {t('r2')} on {t('nTestPapers')} unseen publications, with measured noise floors and every negative result recorded.</>}
          lesson="With few distinct frameworks and species, the bottleneck is the number of entities rather than the richness of each description: a pretrained estimator helped, pretrained representations did not."
          more={<Pivots />}>
          <p>The final stage rebuilt the dataset around a leakage audit, resolved {t('mofNames')} free-text material names to {t('nStructures')} crystal structures, and fixed an evaluation protocol before any variant was run. Then it tested, one at a time, nearly everything a reviewer might ask about. The pivots are listed below, and the full list is in <a href="#ledger">the experiment ledger</a>.</p>
        </Stage>
      </div>
      <SourceNote files={SOURCES.proto} />
    </Section>
  );
}

function Pivots() {
  const rows = [
    ['6 Sep', 'First end-to-end pipeline committed, with random-row scores reported next to the whole-publication ones.'],
    ['11 Sep', 'A shared four-view harness is added; MOF block, pretrained toxin encoders, folded pH, a measured noise floor, learning curves, a hyper-parameter search and the publication effect are all tested in one day.'],
    ['11 to 12 Sep', 'Newer TabPFN checkpoints are measured, the newest is found not to be the best, and TabPFN-3 on log10 qe becomes the shipped model.'],
    ['12 Sep', 'A continuous-integration check is added that compares every figure quoted in the documentation with the committed result file it came from.'],
    ['15 Sep', 'Both cross-validation conventions are repeated over ten partitions to show the split gap is not a one-partition result.'],
    ['12 to 14 Oct', 'Twelve-estimator ensembles and the gas-phase fine-tuned MOF embedding are tested; neither is adopted.'],
    ['20 Oct', 'Code for a MOF water-affinity experiment is added. No results from it are committed or reported yet.'],
  ];
  return (
    <>
      <ul className="pivots">{rows.map(([d, x]) => (<li key={d}><span>{d}</span><p>{x}</p></li>))}</ul>
      <p className="muted-p">{t('commitsFinal')} commits in total in this repository.</p>
    </>
  );
}

export function Dataset() {
  const labels: Record<string, string> = {
    'all rows': 'All compiled records', 'has positive qe': 'Positive measured qe', 'target not an isotherm-model fit': 'Target is a measurement, not a model fit',
    'not a flagged near-duplicate': 'Not a flagged near-duplicate', 'MOF resolves to a named framework': 'Material name resolves to a framework',
    'framework has a usable crystal structure': 'Framework has a usable crystal structure', 'adsorbate resolves to a SMILES': 'Pollutant resolves to a curated SMILES',
  };
  const items = D.summary.row_filter.map((r) => ({ key: r.step, label: labels[r.step] ?? r.step, value: r.rows }));
  const share = D.dataset.extractionShare;
  const cols: Col<(typeof D.structureVerification)[number]>[] = [
    { key: 'f', label: 'Framework', render: (r) => r.framework },
    { key: 'c', label: 'COD entry', num: true, render: (r) => r.cod },
    { key: 'd', label: 'Volume per metal, difference', num: true, render: (r) => `${fmt(r.pctDiff, 1)}%` },
  ];
  const [view, setView] = useState(false);
  return (
    <Section id="data" title="The dataset: built to be audited" tone="tint"
      intro={<p>No public aqueous MOF-pollutant dataset existed, so the team compiled one. Every row keeps how its value reached the dataset, what “capacity” meant in its paper, and a publication key used for all splitting.</p>}>
      <Reveal>
        <div className="data-grid">
          <div>
            <h3 className="sub">From records to modelling rows</h3>
            <HBars items={items} max={D.summary.row_filter[0]!.rows} format={(x) => fmt(x, 0)} label="Rows remaining after each filter" />
            <p>That leaves {t('nDev')} development rows from {t('nDevPapers')} publications and {t('nTest')} held-out rows from {t('nTestPapers')} publications. The {t('nRows')} rows cover {t('nFrameworks')} frameworks, {t('nSpecies')} chemical species in {t('nClasses')} pollutant classes, with capacity spanning {t('qeDecades')} orders of magnitude ({t('qeMin')} to {t('qeMax')} mg/g).</p>
          </div>
          <div>
            <h3 className="sub">Where the numbers came from</h3>
            <HBars items={[
              { key: 'table', label: 'Read from a table', value: 100 * share.table! }, { key: 'review', label: 'From a review’s summary table', value: 100 * share.review_table! },
              { key: 'fig', label: 'Digitised from a plotted curve', value: 100 * share.figure_digitised! }, { key: 'text', label: 'Quoted in the text', value: 100 * share.text! },
            ]} max={40} format={(x) => `${fmt(x, 1)}%`} label="Extraction method share of usable rows" />
            <p>Digitised values carry an uncertainty note. A DOI is recorded for {t('doiShare')}% of usable rows. About {t('ionShare')}% of the modelling rows ({t('ionRows')}) are bare metal ions or oxyanions from only {t('ionSpecies')} species, which shapes how the pollutant is described to the model.</p>
          </div>
        </div>
        <div className="data-grid second">
          <div>
            <h3 className="sub">A leakage audit, column by column</h3>
            <p>Literature adsorption tables are unusually easy to leak, so every raw column was classified before modelling and the reasoning is stored with its correlation to the target.</p>
            <ul className="plain">
              <li><strong>{t('leakTarget')} target-derived columns dropped.</strong> Removal percentage, equilibrium concentration, distribution coefficient and similar are algebraic functions of qe; fitted isotherm constants come from the same curve the target was read off.</li>
              <li><strong>{t('leakId')} identifier and provenance columns dropped.</strong> They encode the publication, which is exactly the grouping the evaluation must not see.</li>
              <li><strong>{t('leakMof')} tabulated MOF properties withheld</strong> so a framework is represented only by its structure. Adding them back later did not help.</li>
            </ul>
          </div>
          <div>
            <h3 className="sub">From material names to crystal structures</h3>
            <p>{t('mofNames')} free-text names were each inspected and mapped to a parent framework, then to one of {t('nStructures')} structures: {t('recipeCoremof')} taken as-is from CoRE MOF 2019, {t('recipeCod')} from the Crystallography Open Database, {t('recipeMetal')} by isostructural metal exchange and {t('recipeFunc')} built by adding a linker substituent. Frameworks were identified by composition and cell, not by name, then cross-checked against independent depositions:</p>
            <button className="linklike" aria-expanded={view} onClick={() => setView(!view)}>{view ? 'Hide' : 'Show'} the ten cross-checks</button>
            {view ? <DataTable cols={cols} rows={D.structureVerification} caption="Cross-check of ten frameworks against COD" /> : null}
            <p className="muted-p">All ten formulas match; volume per metal agrees within {t('codMin')} to {t('codMax')}%. {t('unbuiltFrameworks')} named frameworks have no buildable structure ({t('unbuiltRows')} rows) and are excluded by design.</p>
          </div>
        </div>
        <Callout tone="caveat" title="What the dataset cannot yet claim">
          The literature search protocol, inclusion criteria and extraction process are not yet documented to systematic-review standard, and about a fifth of values were digitised from figures. The data inherit publication bias towards high-performing materials.
        </Callout>
        <SourceNote files={[...SOURCES.dataset, ...SOURCES.leakAudit, ...SOURCES.structureVerification]} />
      </Reveal>
    </Section>
  );
}

const BLOCKS = [
  { id: 'mof', name: 'MOF', n: 'nMofBlock', tone: 'a', enc: 'Frozen MOFTransformer', from: '44 crystal structures',
    text: <>Each structure is converted into an atom graph and an energy grid and passed through the released pretrained network. The {t('embedDim')}-dimensional [CLS] vector is averaged over {t('embedPasses')} passes (the graph branch makes a random choice at inference) and compressed by PCA to {t('nMofBlock')} components, fitted on development frameworks only. The embedding is a compressed encoding of pore geometry (cavity diameter recovered at leave-one-framework-out R² {t('probeLcd')}) and carries little metal chemistry ({t('probeMetal')} for metal fraction).</> },
  { id: 'ads', name: 'Pollutant', n: 'nAdsBlock', tone: 'b', enc: 'RDKit descriptors', from: '142 curated SMILES',
    text: <>Size and shape, polarity and partitioning, charge, aromaticity, functional-group counts, an inorganic flag and per-element atom counts over 27 elements. The element counts and formal charge are what let one block describe both organic molecules and bare ions. Pretrained ChemBERTa and Uni-Mol2 embeddings were tested as replacements and lost.</> },
  { id: 'coupled', name: 'pH-coupled', n: 'nCoupled', tone: 'c', enc: 'Physics at this row’s pH', from: 'Both materials and the experiment’s pH',
    text: <>Each column is a property of the framework, the pollutant or the pair, evaluated at the row’s pH: pollutant charge and effective hydrophobicity by Henderson-Hasselbalch, framework surface charge from a proxy for its point of zero charge, their electrostatic product, size exclusion against pore diameter, and two physical capacity limits. The framework charge is a proxy (the isoelectric point of the metal oxide), not a measurement, and it ignores the linker.</> },
  { id: 'dose', name: 'Conditions', n: 'nDosing', tone: 'd', enc: 'Dosing settings', from: 'Literature records',
    text: <>Initial concentration, adsorbent dose, contact time, the mass-balance ceiling log10(C₀/dose) and three missingness flags. These are settings of the apparatus, not properties of either material, and they cannot be folded away: withdrawing them costs {t('dosingFold')} dex.</> },
] as const;

export function Method() {
  const [sel, setSel] = useState<(typeof BLOCKS)[number]['id']>('mof');
  const b = BLOCKS.find((x) => x.id === sel)!;
  return (
    <Section id="method" title="The method: four blocks, one pretrained estimator"
      intro={<p>The framework, the pollutant and the experiment are encoded separately. A coupled block then evaluates both materials at the row’s pH. Everything is concatenated into {t('nFeatures')} columns. Select a block to see what is in it.</p>}>
      <Reveal>
        <div className="pipe" role="group" aria-label="Pipeline blocks">
          <div className="pipe-col pipe-blocks">
            {BLOCKS.map((x) => (
              <button key={x.id} className={`pipe-block tone-${x.tone}`} aria-pressed={sel === x.id} onClick={() => setSel(x.id)}>
                <span className="pb-name">{x.name}</span>
                <span className="pb-n tnum">{t(x.n)}</span>
                <span className="pb-from">{x.from}</span>
              </button>
            ))}
          </div>
          <div className="pipe-arrow" aria-hidden="true"><ArrowRight size={26} /><span className="tnum">{t('nFeatures')}</span></div>
          <div className="pipe-model"><strong>TabPFN-3</strong><span>a transformer pretrained on millions of synthetic tabular tasks; it reads the {t('nDev')} training rows as context and predicts by in-context learning, with no gradient updates on this data</span></div>
          <div className="pipe-arrow" aria-hidden="true"><ArrowRight size={26} /></div>
          <div className="pipe-out"><strong>log<sub>10</sub> q<sub>e</sub></strong><span>with a split-conformal interval</span></div>
        </div>
        <div className="pipe-detail" aria-live="polite">
          <h3>{b.name} block <span className="tnum">({t(b.n)} columns)</span></h3>
          <p className="muted-p">{b.enc}</p>
          <p>{b.text}</p>
        </div>
        <div className="prose-grid two">
          <div>
            <h3 className="sub">How it is evaluated</h3>
            <p>Every change is scored on four views, all in RMSE of log10 qe: cross-validation on development publications (reported, never used for selection), the {t('nTestPapers')} held-out publications, unseen frameworks, and unseen pollutants. The selection rule was fixed before any variant ran: a change counts only if it beats the baseline by more than the baseline’s own fold-to-fold spread. Held-out scores are averaged over several seeds, because a single fit cannot resolve differences below about {t('seedFloor')} dex.</p>
          </div>
          <div>
            <h3 className="sub">What stays fixed</h3>
            <p>pH, temperature and the water matrix are not standalone features. pH re-enters through the coupled block; temperature and the water matrix were dropped, which cost nothing measurable. The target is log10 qe, the only candidate that is both an intensive material property and reported by nearly every paper.</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

